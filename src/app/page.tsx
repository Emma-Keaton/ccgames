import { HomeRealtimeMatches } from "@/components/HomeRealtimeMatches"
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import { HomeInsights } from '@/components/HomeInsights'
import { restGet } from '@/lib/public-api'
import type { InsightPost } from '@/components/HomeInsights'

/** Live-ish home page: 30s freshness window. */
export const revalidate = 30

/** PostgREST projection reused by the three fixture lists below. */
const FIXTURE_SELECT = '*,home_team:home_team_id(*),away_team:away_team_id(*)'

interface FixtureRow {
  id: string
  status: string | null
  match_date: string
  home_score: number | null
  away_score: number | null
  current_minute: number | null
  home_team: { name: string | null; short_name: string | null } | null
  away_team: { name: string | null; short_name: string | null } | null
}

// Render DTOs for the three live home fixture sections.
interface TeamCardInfo {
  name: string;
  abbr: string;
  score?: number;
}
interface MatchCardRow {
  id: string;
  home: TeamCardInfo;
  away: TeamCardInfo;
  status: string;
  time?: string;
  date?: string;
}

const renderMatchList = (matches: MatchCardRow[], emptyMessage: string) => {
  if (matches.length === 0) {
      return (
          <div className="bg-[#1e293b] rounded-xl p-8 text-center border border-white/5 text-gray-400">
              {emptyMessage}
          </div>
      )
  }
  return (
      <div className="space-y-4">
          {matches.map((match) => (
              <Link href={`/match/${match.id}`} key={match.id} className="block">
                  <div className="bg-[#1e293b] rounded-xl p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between border border-white/5 hover:border-indigo-500/50 transition-colors cursor-pointer group">
                      <div className="flex items-center justify-between w-full sm:w-auto flex-1 gap-4">
                          <div className="flex items-center gap-3 sm:gap-4 flex-1">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-white text-xs sm:text-sm">{match.home.abbr}</div>
                              <span className="font-semibold text-sm sm:text-lg">{match.home.name}</span>
                          </div>

                          <div className="flex flex-col items-center px-4 sm:px-8 shrink-0">
                              {match.home.score !== undefined && match.away.score !== undefined ? (
                                <>
                                  <div className="text-xl sm:text-2xl font-black tabular-nums tracking-tighter group-hover:text-indigo-400 transition-colors">{match.home.score} - {match.away.score}</div>
                                  <div className={`text-xs font-medium mt-1 ${match.status === 'LIVE' ? 'text-red-400 animate-pulse' : 'text-gray-400'}`}>{match.time || match.status}</div>
                                </>
                              ) : (
                                <>
                                  <div className="text-sm sm:text-base font-bold text-gray-400 group-hover:text-indigo-400 transition-colors">VS</div>
                                  <div className="text-xs font-medium mt-1 text-gray-400">{match.date}</div>
                                </>
                              )}
                          </div>

                          <div className="flex items-center gap-3 sm:gap-4 flex-1 justify-end">
                              <span className="font-semibold text-sm sm:text-lg text-right">{match.away.name}</span>
                              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-white text-xs sm:text-sm">{match.away.abbr}</div>
                          </div>
                      </div>
                  </div>
              </Link>
          ))}
      </div>
  )
}

const UpcomingFixturesSection = ({ matches }: { matches: MatchCardRow[] }) => (
  <section>
      <h2 className="text-2xl font-bold mb-6">Upcoming Fixtures</h2>
      {renderMatchList(matches, "No upcoming fixtures scheduled.")}
  </section>
)

const ConcludedMatchesSection = ({ matches }: { matches: MatchCardRow[] }) => (
  <section>
      <h2 className="text-2xl font-bold mb-6">Results</h2>
      {renderMatchList(matches, "No recent results available.")}
  </section>
)

export default async function Home() {
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date()
  endOfDay.setHours(23, 59, 59, 999)

  // Single source of truth for the fixture projection used by the three
  // queries below.
  const matchesSelect = FIXTURE_SELECT

  // Cached public reads (Next Data Cache: `revalidate` + the shared
  // `public-data` tag busted by POST /api/revalidate). Reading through
  // `restGet` instead of the cookie-bound Supabase client keeps this route
  // cacheable, so a traffic spike is served from the edge/ISR cache rather
  // than from Postgres — see SECURITY_AND_SCALING.md §2.
  const [todayMatchesData, upcomingMatchesData, concludedMatchesData, postsData] =
    await Promise.all([
      restGet<FixtureRow>(
        `fixtures?select=${matchesSelect}&match_date=gte.${startOfDay.toISOString()}&match_date=lte.${endOfDay.toISOString()}&order=match_date.asc`
      ),
      restGet<FixtureRow>(
        `fixtures?select=${matchesSelect}&match_date=gt.${endOfDay.toISOString()}&order=match_date.asc&limit=5`
      ),
      restGet<FixtureRow>(
        `fixtures?select=${matchesSelect}&status=in.(full_time,cancelled)&order=match_date.desc&limit=5`
      ),
      restGet<InsightPost>(
        'tournament_posts?select=id,title,slug,excerpt,category,image_url,published_at&published=is.true&order=published_at.desc&limit=6'
      ),
      
    ])

  
  const matchesOfTheDay: MatchCardRow[] = todayMatchesData.map((m) => ({
    id: m.id,
    home: { name: m.home_team?.name || 'Unknown', abbr: m.home_team?.short_name || 'UNK', score: m.home_score ?? undefined },
    away: { name: m.away_team?.name || 'Unknown', abbr: m.away_team?.short_name || 'UNK', score: m.away_score ?? undefined },
    status: m.status === 'in_progress' ? 'LIVE' : m.status ?? 'scheduled',
    time: m.current_minute ? m.current_minute + "'" : new Date(m.match_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }))
  const upcomingFixtures: MatchCardRow[] = upcomingMatchesData.map((m) => ({
    id: m.id,
    home: { name: m.home_team?.name || 'Unknown', abbr: m.home_team?.short_name || 'UNK' },
    away: { name: m.away_team?.name || 'Unknown', abbr: m.away_team?.short_name || 'UNK' },
    status: 'UPCOMING',
    date: new Date(m.match_date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }))
  const concludedMatches: MatchCardRow[] = concludedMatchesData.map((m) => ({
    id: m.id,
    home: { name: m.home_team?.name || 'Unknown', abbr: m.home_team?.short_name || 'UNK', score: m.home_score ?? undefined },
    away: { name: m.away_team?.name || 'Unknown', abbr: m.away_team?.short_name || 'UNK', score: m.away_score ?? undefined },
    status: m.status === 'full_time' ? 'FT' : 'CANCELLED'
  }))

  const hasMatches = matchesOfTheDay.length > 0

  return (
    <div className="min-h-screen bg-[#0f172a] text-white pb-32">
      <Navigation />
      <div className="pt-16">
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">

          <div className="cc-card flex flex-col items-center gap-4 p-8 text-center sm:p-12">
            <span className="inline-block rounded-full bg-primary-soft px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-primary">
              Enugu 2026 · 23rd National Sports Festival
            </span>
            <h1 className="max-w-2xl text-4xl font-black tracking-tight text-text sm:text-5xl">
              Coal City Games
            </h1>
            <p className="max-w-2xl text-lg font-normal text-text-muted">
              Festival daylight: every result, fixture, medal and story from Enugu 2026 — live as it happens, across all 20 sports.
            </p>
          </div>

          {hasMatches ? (
             <>
                <div data-tour="home-matchday">
                  <HomeRealtimeMatches initialMatches={matchesOfTheDay} />
                </div>
                <div data-tour="home-insights">
                  <HomeInsights posts={postsData} />
                </div>
                 <UpcomingFixturesSection matches={upcomingFixtures} />
                 <ConcludedMatchesSection matches={concludedMatches} />
              </>
           ) : (
              <>
                 <UpcomingFixturesSection matches={upcomingFixtures} />
                <div data-tour="home-insights">
                  <HomeInsights posts={postsData} />
                </div>
                <ConcludedMatchesSection matches={concludedMatches} />
             </>
          )}

        </main>
      </div>

      <div className="fixed bottom-8 left-0 right-0 z-40 flex justify-center pointer-events-none px-4">
        <div className="pointer-events-auto">
            <Link href="/login" className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 px-8 rounded-full shadow-[0_10px_40px_rgba(79,70,229,0.6)] transition-all transform hover:scale-105 border border-indigo-400/50 backdrop-blur-md">
                <span className="text-base sm:text-lg">Sign Up & Follow Your Team</span>
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
        </div>
      </div>
    </div>
  )
}
