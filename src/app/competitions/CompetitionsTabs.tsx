'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'
import { BrandedLoader } from '@/components/Skeleton'
import { EmptyState, Stat, StatGrid } from '@/components/ui/feedback'
import { Section } from '@/components/ui/Section'
import {
  computeCompetitionsView,
  type Fixture,
  type Team,
  type Event,
  type Player,
} from '@/lib/competitions-standings'
import { FixtureCard } from '@/components/competitions/FixtureCard'
import { StandingsTable } from '@/components/competitions/Standings'
import { PlayoffTabs } from '@/components/competitions/PlayoffTabs'
import { RealtimeClient } from './RealtimeClient'

const VALID_TABS = ['overview', 'results', 'fixtures', 'stats', 'groups', 'playoffs'] as const
type Tab = (typeof VALID_TABS)[number]

const DEFAULT_TAB: Tab = 'overview'

interface CompetitionsTabsProps {
  fixtures: Fixture[]
  teams: Team[]
  events: Event[]
  players: Player[]
}

export function CompetitionsTabs({ fixtures, teams, events, players }: CompetitionsTabsProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const raw = searchParams.get('tab') ?? DEFAULT_TAB
  const initialTab: Tab = VALID_TABS.includes(raw as Tab) ? (raw as Tab) : DEFAULT_TAB
  const [activeTab, setActiveTab] = useState<Tab>(initialTab)

  const view = computeCompetitionsView(fixtures, teams, events, players)

  const liveFixtures = [...view.results, ...view.upcoming]
    .filter((f) => f.status === 'in_progress' || f.status === 'extra_time')
    .sort((a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime())

  // Exclude kicked-off (live) matches from the upcoming list so they only render under Live Now.
  const upcoming = view.upcoming.filter(
    (f) => f.status !== 'in_progress' && f.status !== 'extra_time'
  )
  const results = view.results

  const navigateTo = (tab: Tab) => {
    const url = new URL(window.location.href)
    if (tab === DEFAULT_TAB) {
      url.searchParams.delete('tab')
    } else {
      url.searchParams.set('tab', tab)
    }
    router.push(url.pathname + url.search, { scroll: false })
    setActiveTab(tab)
  }

  const scrollToSection = (tab: Tab) => {
    const id = `section-${tab}`
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleTabClick = (tab: Tab) => {
    navigateTo(tab)
    scrollToSection(tab)
  }

  return (
    <div className="space-y-12">
      {/* Section tabs — sticky header strip, pinned under the site nav on all devices. */}
      <nav
        aria-label="Competition sections"
        className="cc-card sticky top-16 z-20 -mx-4 sm:mx-0"
      >
        <div className="cc-scroll-x mx-auto flex max-w-3xl justify-start gap-1 px-2 sm:justify-center">
          {VALID_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => handleTabClick(tab)}
              aria-current={activeTab === tab ? 'true' : undefined}
              className={`whitespace-nowrap border-b-[3px] px-4 py-3 text-sm font-medium transition-colors hover:text-text ${
                activeTab === tab
                  ? 'border-primary text-text'
                  : 'border-transparent text-text-muted hover:border-hairline'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1).replace('-', ' ')}
            </button>
          ))}
        </div>
      </nav>

      {/* Overview */}
      <div id="section-overview" className="space-y-12">
        <StatGrid columns={3}>
            <Stat label="Matches Played" value={<span className="cc-num">{results.length}</span>} />
            <Stat label="Upcoming" value={<span className="cc-num">{upcoming.length}</span>} />
            <Stat label="Live Now" value={<span className="cc-num">{liveFixtures.length}</span>} tone="live" />
        </StatGrid>

        <Suspense fallback={<BrandedLoader message="Refreshing live matches…" />}>
          <RealtimeClient liveFixtures={liveFixtures} />
        </Suspense>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="cc-card p-5">
            <h3 className="mb-4 text-lg font-bold text-secondary">Upcoming Fixtures</h3>
            {upcoming.length === 0 ? (
              <EmptyState title="No upcoming fixtures scheduled." hint="Fixtures appear here once officials publish the schedule." />
            ) : (
              <div className="space-y-4">
                {upcoming.map((f) => (
                  <FixtureCard key={f.id} match={f} />
                ))}
              </div>
            )}
          </div>

          <div className="cc-card p-5">
            <h3 className="mb-4 text-lg font-bold text-primary">Latest Results</h3>
            {results.length === 0 ? (
              <EmptyState title="No matches have been played yet." hint="Results appear here once matches conclude." />
            ) : (
              <div className="space-y-4">
                {results.slice(0, 6).map((f) => (
                  <FixtureCard key={f.id} match={f} />
                ))}
                {results.length > 6 && (
                  <div className="text-center">
                    <span className="text-primary text-sm">
                      +{results.length - 6} more results on{' '}
                      <button
                        onClick={() => handleTabClick('results')}
                        className="underline hover:text-primary"
                      >
                        results
                      </button>
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-surface-sunken rounded-lg p-5 border border-border-subtle">
            <h3 className="font-bold text-lg text-secondary-strong mb-4">Team Expected Goals</h3>
            {view.teamXg.length === 0 ? (
              <p className="text-text-muted text-sm">No xG data available yet.</p>
            ) : (
              <div className="space-y-3">
                {view.teamXg.slice(0, 8).map((teamXg, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold">{teamXg.team.name}</div>
                      <div className="text-xs text-text-muted">{teamXg.team.short_name}</div>
                    </div>
                    <div className="text-2xl font-black text-primary">{teamXg.xg.toFixed(2)}</div>
                  </div>
                ))}
                {view.teamXg.length > 8 && (
                  <p className="text-text-muted text-sm">
                    +{view.teamXg.length - 8} more teams on stats tab
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="bg-surface-sunken rounded-lg p-5 border border-border-subtle">
            <h3 className="font-bold text-lg text-accent-strong mb-4">Clean Sheets</h3>
            {view.topCleanSheets.length === 0 ? (
              <p className="text-text-muted text-sm">No clean sheet data yet.</p>
            ) : (
              <div className="space-y-3">
                {view.topCleanSheets.slice(0, 8).map((row, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold">{row.player?.name}</div>
                      <div className="text-xs text-text-muted">
                        {row.player?.team?.name}
                      </div>
                    </div>
                    <div className="text-xl font-black text-accent-strong">{row.value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      <Section title="Match Results" id="section-results">
        {results.length === 0 ? (
          <EmptyState title="No matches have ended yet." hint="Results appear here once matches conclude." />
        ) : (
          <div className="grid gap-4">
            {results.map((f) => (
              <FixtureCard key={f.id} match={f} />
            ))}
          </div>
        )}
      </Section>

      {/* Fixtures */}
      <Section title="Upcoming Matches" id="section-fixtures">
        {upcoming.length === 0 ? (
          <EmptyState title="No upcoming matches scheduled." hint="Fixtures appear here once officials publish the schedule." />
        ) : (
          <div className="grid gap-4">
            {upcoming.map((f) => (
              <FixtureCard key={f.id} match={f} />
            ))}
          </div>
        )}
      </Section>

      {/* Stats */}
      <div id="section-stats" className="space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="cc-card overflow-hidden">
            <div className="bg-primary-soft p-4 border-b border-border-subtle">
              <h3 className="font-bold text-lg">Top Scorers</h3>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-sunken text-text-muted">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Player</th>
                  <th className="p-3 text-right">Goals</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {view.topScorers.map((row, idx) => (
                  <tr key={idx} className="hover:bg-surface-sunken">
                    <td className="p-3">{idx + 1}</td>
                    <td className="p-3">
                      <div className="font-semibold">{row.player?.name}</div>
                      <div className="text-xs text-text-muted">{row.player?.team?.name}</div>
                    </td>
                    <td className="p-3 text-right font-bold text-primary">{row.value}</td>
                  </tr>
                ))}
                {view.topScorers.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-4 text-center text-text-muted">No data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="cc-card overflow-hidden">
            <div className="bg-primary/10 p-4 border-b border-border-subtle">
              <h3 className="font-bold text-lg">Top Assists</h3>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-sunken text-text-muted">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Player</th>
                  <th className="p-3 text-right">Assists</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {view.topAssists.map((row, idx) => (
                  <tr key={idx} className="hover:bg-surface-sunken">
                    <td className="p-3">{idx + 1}</td>
                    <td className="p-3">
                      <div className="font-semibold">{row.player?.name}</div>
                      <div className="text-xs text-text-muted">{row.player?.team?.name}</div>
                    </td>
                    <td className="p-3 text-right font-bold text-primary">{row.value}</td>
                  </tr>
                ))}
                {view.topAssists.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-4 text-center text-text-muted">No data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="cc-card overflow-hidden">
            <div className="bg-accent/10 p-4 border-b border-border-subtle">
              <h3 className="font-bold text-lg">Most Yellow Cards</h3>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-sunken text-text-muted">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Player</th>
                  <th className="p-3 text-right">Cards</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {view.topYellow.map((row, idx) => (
                  <tr key={idx} className="hover:bg-surface-sunken">
                    <td className="p-3">{idx + 1}</td>
                    <td className="p-3">
                      <div className="font-semibold">{row.player?.name}</div>
                      <div className="text-xs text-text-muted">{row.player?.team?.name}</div>
                    </td>
                    <td className="p-3 text-right font-bold text-accent-strong">{row.value}</td>
                  </tr>
                ))}
                {view.topYellow.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-4 text-center text-text-muted">No data</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="cc-card overflow-hidden">
            <div className="bg-danger/10 p-4 border-b border-border-subtle">
              <h3 className="font-bold text-lg">Most Red Cards</h3>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-sunken text-text-muted">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Player</th>
                  <th className="p-3 text-right">Cards</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {view.topRed.map((row, idx) => (
                  <tr key={idx} className="hover:bg-surface-sunken">
                    <td className="p-3">{idx + 1}</td>
                    <td className="p-3">
                      <div className="font-semibold">{row.player?.name}</div>
                      <div className="text-xs text-text-muted">{row.player?.team?.name}</div>
                    </td>
                    <td className="p-3 text-right font-bold text-live">{row.value}</td>
                  </tr>
                ))}
                {view.topRed.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-4 text-center text-text-muted">No data</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Groups */}
      <div id="section-groups">
        <h2 className="text-2xl font-bold mb-6">Group Standings</h2>
        {view.groupNames.length === 0 ? (
          <div className="cc-empty">
            No groups have been set up yet.
          </div>
        ) : (
          view.groupNames.map((groupName) => (
            <div key={groupName} className="space-y-4">
              <h3 className="text-xl font-semibold text-primary">
                {groupName.replace(/_/g, ' ')}
              </h3>
              <StandingsTable rows={view.standings[groupName] ?? []} />
            </div>
          ))
        )}
      </div>

      {/* Playoffs */}
      <div id="section-playoffs">
        <PlayoffTabs
          quarterFinal={view.playoffMatches.filter((f) => f.stage === 'quarter_final')}
          semiFinal={view.playoffMatches.filter((f) => f.stage === 'semi_final')}
          final={view.playoffMatches.filter((f) => f.stage === 'final')}
        />
      </div>
    </div>
  )
}
