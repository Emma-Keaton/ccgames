import { HomeRealtimeMatches } from "@/components/HomeRealtimeMatches"
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import { HomeInsights } from '@/components/HomeInsights'
import { restGet } from '@/lib/public-api'
import type { InsightPost } from '@/components/HomeInsights'
import { PageHeader } from '@/components/ui/PageHeader'
import { Section } from '@/components/ui/Section'
import { EmptyState, LiveBadge } from '@/components/ui/feedback'
import { Button } from '@/components/ui/Button'

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
          <EmptyState title={emptyMessage} hint="Fixtures appear here once officials publish the schedule." />
      )
  }
  return (
      <div className="space-y-4">
          {matches.map((match) => (
              <Link href={`/match/${match.id}`} key={match.id} className="block rounded-xl focus-visible:outline-2 focus-visible:outline-primary">
                  <div className="cc-card cc-card--interactive group flex flex-col items-center justify-between p-4 sm:flex-row sm:p-6">
                      <div className="flex w-full flex-1 items-center justify-between gap-4 sm:w-auto">
                          <div className="flex flex-1 items-center gap-3 sm:gap-4">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-sunken text-xs font-bold text-text sm:h-10 sm:w-10 sm:text-sm">{match.home.abbr}</div>
                              <span className="text-sm font-semibold sm:text-lg">{match.home.name}</span>
                          </div>

                          <div className="flex shrink-0 flex-col items-center px-4 sm:px-8">
                              {match.home.score !== undefined && match.away.score !== undefined ? (
                                <>
                                  <div className="cc-score text-xl group-hover:text-primary sm:text-2xl">{match.home.score} - {match.away.score}</div>
                                  <div className={`cc-num mt-1 text-xs font-medium ${match.status === 'LIVE' ? '' : 'text-text-muted'}`}>{match.status === 'LIVE' ? <LiveBadge label={match.time || match.status} /> : (match.time || match.status)}</div>
                                </>
                              ) : (
                                <>
                                  <div className="text-sm font-bold text-text-muted transition-colors group-hover:text-primary sm:text-base">VS</div>
                                  <div className="cc-num mt-1 text-xs font-medium text-text-muted">{match.date}</div>
                                </>
                              )}
                          </div>

                          <div className="flex items-center gap-3 sm:gap-4 flex-1 justify-end">
                              <span className="font-semibold text-sm sm:text-lg text-right">{match.away.name}</span>
                              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-surface-sunken flex items-center justify-center font-bold text-text text-xs sm:text-sm">{match.away.abbr}</div>
                          </div>
                      </div>
                  </div>
              </Link>
          ))}
      </div>
  )
}

const UpcomingFixturesSection = ({ matches }: { matches: MatchCardRow[] }) => (
  <Section title="Upcoming Fixtures">
      {renderMatchList(matches, "No upcoming fixtures scheduled.")}
  </Section>
)

const ConcludedMatchesSection = ({ matches }: { matches: MatchCardRow[] }) => (
  <Section title="Results">
      {renderMatchList(matches, "No recent results available.")}
  </Section>
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
    <div className="min-h-dvh bg-surface pb-24 text-text cc-safe-b">
      <Navigation />
      <div className="pt-16">
        <main className="cc-page max-w-5xl space-y-16 !pt-12">

          <PageHeader
            eyebrow="Enugu 2026 · 23rd National Sports Festival"
            title="Coal City Games"
            lede="Festival daylight: every result, fixture, medal and story from Enugu 2026 — live as it happens, across all 20 sports."
          />

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

      <div data-tour="home-signup" className="cc-safe-b pointer-events-none fixed bottom-8 left-0 right-0 z-40 flex justify-center px-4">
        <div className="pointer-events-auto">
              <Button href="/login" size="lg" className="rounded-full !px-8 !py-4">
                <span className="text-base sm:text-lg">Sign Up & Follow Your Team</span>
                <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </Button>
        </div>
      </div>
    </div>
  )
}
