# Go-live setup checklist — what the app needs to be fully set up and functional

> The companion to `DEPLOY.md §8` (the deploy runbook). This file answers
> **"what does the app need?"** as a checklist with owners and verification —
> work top to bottom, tick each box, do not skip.

| # | Requirement | Owner | Verify |
| --- | --- | --- | --- |
| 1 | **Supabase project** (region near users) + `SUPABASE_ACCESS_TOKEN` | Backend | `supabase projects list` |
| 2 | **Migrations 00–15 applied** to hosted (`supabase db push`) | Backend | `supabase migration list` shows none pending |
| 3 | **Env vars** set locally (`.env.local`) *and* in Vercel (Production + Preview): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL` | Backend | `npm run dev` boots; `npm run smoke <url>` |
| 4 | **Auth providers**: email/password on; Google OAuth client wired (Supabase callback URL) | Backend | sign in both ways on staging |
| 5 | **Supabase URL config**: Site URL + Redirect URLs include prod, preview, `http://localhost:3000/**` | Backend | password-reset + invite links land correctly |
| 6 | **First app admin** created (SQL `app_admin` grant or invite accept) | Backend | `/admin` renders, `/admin/users` visible |
| 7 | **Tournament + sports seeded**: active `tournaments` row, `tournament_sports` links, teams registered in `/admin` | Content | `/`, `/competitions`, `/teams` non-empty |
| 8 | **Storage buckets** (team logos, article images) public-read with size limits | Backend | upload from `/admin/posts` works |
| 9 | **Realtime enabled** on `fixtures`, `match_events`, `fixture_entries` (live scores/clocks) | Backend | open a live match in two browsers |
| 10 | **Upstash Redis** (optional, recommended): `UPSTASH_REDIS_REST_URL/TOKEN` for shared cache + rate limit | Backend | second-region deploy shares cache state |
| 11 | **Sentry DSN** (+ `SENTRY_AUTH_TOKEN/ORG/PROJECT` for source maps) | Frontend | trigger a test error, see it in Sentry |
| 12 | **Vercel project** wired to `main`, build `npm run build`, custom domain + HTTPS | Frontend | `https://<domain>/robots.txt` correct |
| 13 | **Brand pass**: OG image, favicon set, `NEXT_PUBLIC_SITE_URL` = prod domain, manifest name | Frontend | link-preview a `/news/<slug>` URL |
| 14 | **Content pass**: at least one published article, fixtures scheduled, medals flow tested | Content | `/news`, `/medals` render real data |
| 15 | **Smoke + a11y**: `npm run smoke <prod>`, keyboard-only walkthrough, 360px mobile check | QA | no console errors, no dead buttons |

## Notes

- Registration is **not** handled by the app: no WhatsApp/email channels, no
  `/news/registration/*` route, no `PinnedRegistrationCard`. Orchestrators
  register teams off-app; app admins enter them in `/admin`.
- The design system lives in `DESIGN.md` (source of truth),
  `src/app/globals.css` + `src/app/cc-kit.css` (tokens and component layer)
  and `src/components/ui/` (React primitives). New screens compose those —
  do not invent new surfaces.
- Self-hosted fonts only (`public/fonts/`): Inter 400–800 for prose,
  JetBrains Mono 400/600/700 for scores, clocks and table figures via
  `font-mono` / `.cc-num`. Never `next/font/google` (breaks offline builds).
