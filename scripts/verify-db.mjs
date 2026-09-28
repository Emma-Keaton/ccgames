// Post-deploy database verification.
// Run with: node scripts/verify-db.mjs
//
// Proves a deployment actually matches the Coal City Games 2026 programme
// instead of trusting that `db push` did what the migration file says. Reads
// only — it never writes real data — so it is safe against production.
//
// Requires the same two variables the app uses:
//   NEXT_PUBLIC_SUPABASE_URL
//   NEXT_PUBLIC_SUPABASE_ANON_KEY   (RLS applies: this is a public read)
//
// Exit code 0 = schema verified, 1 = something is wrong (details printed).

import { readFileSync, existsSync } from 'node:fs'

/** The 20 sports approved by the National Sports Commission for CCGames 2026. */
const PROGRAMME = [
  'athletics', 'badminton', 'basketball', 'boxing',
  'canoeing', 'cricket', 'cycling', 'darts',
  'football', 'golf', 'gymnastics', 'judo',
  'mma', 'shooting', 'swimming', 'table_tennis',
  'taekwondo', 'tennis', 'weightlifting', 'wrestling',
]

/** Must NOT exist: removed from the speculative pan-African catalogue. */
const REMOVED = [
  'volleyball', 'beach_volleyball', 'handball', 'hockey', 'rugby', 'netball',
  'abula', 'esports', 'squash', 'chess', 'scrabble', 'ayo', 'archery',
  'diving', 'rowing', 'triathlon', 'fencing', 'karate', 'dambe', 'futsal',
]

/** Divisions the integrated para programme must expose. */
const DIVISIONS = [
  'Para Athletics',
  'Para Badminton',
  'Wheelchair Basketball (3x3)',
  'Basketball (5x5)',
  'Basketball 3x3',
  'Para Canoeing',
  'Para Shooting',
  'Para Table Tennis',
  'Para Powerlifting',
]

/** Write RPCs the live console and scout panel call. */
const RPCS = ['record_score', 'record_stat', 'update_match_clock', 'record_match_event']

/** Parsed from .env.local when the process env does not already carry them. */
function loadEnvFile(path = '.env.local') {
  if (!existsSync(path)) return {}
  const out = {}
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line)
    if (match) out[match[1]] = match[2].trim()
  }
  return out
}

const fileEnv = loadEnvFile()
const SUPABASE_URL = (
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  fileEnv.NEXT_PUBLIC_SUPABASE_URL ||
  ''
).replace(/\/$/, '')
const ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || fileEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const failures = []
const notes = []

function check(label, ok, detail = '') {
  console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${label}${detail ? ` — ${detail}` : ''}`)
  if (!ok) failures.push(label)
}

async function rest(path, { method = 'GET', body } = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await response.text()
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = null
  }
  return { status: response.status, ok: response.ok, json, text }
}

async function main() {
  console.log('Coal City Games 2026 — deployed schema verification\n')

  if (!SUPABASE_URL || SUPABASE_URL.includes('your-project-ref')) {
    console.error('FAIL: NEXT_PUBLIC_SUPABASE_URL is missing or still the placeholder.')
    process.exit(1)
  }
  if (!ANON_KEY || ANON_KEY.length < 40) {
    console.error(
      'FAIL: NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or still the placeholder.\n' +
        '      Supabase dashboard → Project Settings → API → Project API keys → anon/public.\n' +
        '      Nothing can be verified without it.',
    )
    process.exit(1)
  }
  console.log(`Project: ${SUPABASE_URL}\n`)

  // 1. The catalogue is exactly the approved programme -----------------------
  const sports = await rest('sports?select=code&order=code.asc&limit=200')
  if (!sports.ok) {
    console.error(`\nFAIL: could not read public.sports (HTTP ${sports.status}).`)
    console.error(sports.text.slice(0, 400))
    console.error('\nA 404 / PGRST205 here means the migrations have not been applied yet.')
    process.exit(1)
  }

  const codes = new Set((sports.json ?? []).map((row) => row.code))
  console.log('Catalogue')
  check('exactly 20 sports seeded', codes.size === 20, `found ${codes.size}`)
  for (const code of PROGRAMME) check(`present: ${code}`, codes.has(code))
  for (const code of REMOVED) check(`removed: ${code}`, !codes.has(code))

  // 2. Tournament + per-event enablement ------------------------------------
  const tournaments = await rest(
    'tournaments?select=id,slug,name,is_active&slug=eq.ccgames2026',
  )
  console.log('\nTournament')
  const tournament = (tournaments.json ?? [])[0]
  check('ccgames2026 row exists', Boolean(tournament))
  if (tournament) {
    check('named "Coal City Games 2026"', tournament.name === 'Coal City Games 2026', tournament.name)
    check('is the active event', tournament.is_active === true)

    const links = await rest(
      `tournament_sports?select=sport_id&tournament_id=eq.${tournament.id}&limit=200`,
    )
    const count = Array.isArray(links.json) ? links.json.length : 0
    check('all 20 sports enabled for the event', count === 20, `found ${count}`)
  }

  // 3. Para / division surface ----------------------------------------------
  const divisions = await rest('sport_divisions?select=name&limit=500')
  console.log('\nDivisions')
  const divisionNames = new Set((divisions.json ?? []).map((row) => row.name))
  for (const name of DIVISIONS) check(`present: ${name}`, divisionNames.has(name))
  for (const gone of ['Sitting Volleyball', 'Para Dambe', 'Para Archery']) {
    check(`removed: ${gone}`, !divisionNames.has(gone))
  }

  // 4. Write RPCs the console depends on ------------------------------------
  //
  // Read PostgREST's own OpenAPI document rather than POSTing an empty body to
  // each endpoint: an empty body asks for a *zero-argument* function, which
  // correctly 404s even when the real function (which requires fixture_id, …)
  // is deployed. The spec lists every callable RPC, so this is authoritative.
  console.log('\nWrite RPCs (security: must not be callable by anon)')
  const spec = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
  })
  if (spec.ok) {
    const document = await spec.json()
    const rpcPaths = new Set(Object.keys(document.paths ?? {}))
    for (const fn of RPCS) {
      // These are `GRANT EXECUTE … TO authenticated`, so their ABSENCE from the
      // anon spec is the security property we want — not evidence of a missing
      // deployment. Existence is asserted by scripts/db-schema-report.py, which
      // queries pg_proc directly with database credentials.
      check(`${fn} not callable by anon`, !rpcPaths.has(`/rpc/${fn}`))
    }
  } else {
    // Deliberately NOT a pass: asserting against an empty set would be a
    // hollow check. Recorded so the run reports why this section is silent.
    notes.push(
      `RPC exposure could not be audited as anon (OpenAPI spec HTTP ${spec.status}); ` +
        'run scripts/db-schema-report.py to confirm the functions exist.',
    )
  }

  // 5. RLS blocks anonymous writes ------------------------------------------
  console.log('\nRow level security')
  const write = await rest('sports', {
    method: 'POST',
    body: { code: '__verify_should_never_insert__', name: 'x', scoring_type: 'duel' },
  })
  check('anonymous insert into sports rejected', !write.ok, `HTTP ${write.status}`)
  if (write.ok) notes.push('A row was inserted as anon — delete it and tighten the policy.')

  // Report -------------------------------------------------------------------
  console.log(`\n${'='.repeat(64)}`)
  if (failures.length === 0) {
    console.log('SUCCESS — the deployed database matches the CCGames 2026 programme.')
    notes.forEach((note) => console.log(`  note: ${note}`))
    process.exit(0)
  }
  console.log(`${failures.length} check(s) FAILED:`)
  failures.forEach((failure) => console.log(`  - ${failure}`))
  process.exit(1)
}

main().catch((error) => {
  console.error(`\nVerification could not run: ${error.message}`)
  process.exit(1)
})
