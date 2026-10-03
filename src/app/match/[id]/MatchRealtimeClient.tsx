'use client'

import { getEffectiveMinute } from "@/lib/match-clock"

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import type {
  MatchEventShape,
  MatchFixtureShape,
  MatchLineupSlot,
  MatchSquadPlayer,
} from './MatchServer'
import { FormationCanvas, type CourtConfig } from '@/components/FormationCanvas'
import Link from 'next/link'

const TABS = ['Overview', 'Stats', 'Timeline', 'Line-up', 'Table'] as const
type Tab = (typeof TABS)[number]

const STAT_KEYS = [
  'passes',
  'shots',
  'shots_on_target',
  'shots_off_target',
  'fouls',
  'corners',
  'freekicks',
  'offsides',
  'yellow_cards',
  'red_cards',
  'gk_saves',
  'interceptions',
]

interface MatchRealtimeClientProps {
  fixtureId: string
  fixture: MatchFixtureShape
  initialEvents: MatchEventShape[]
  /** Stored formation rows (PART 15), pre-fetched server-side. */
  initialLineups: MatchLineupSlot[]
  /** Both squads, used to label formation tokens. */
  squad: MatchSquadPlayer[]
  /** Playing-surface shape declared by the fixture's sport. */
  court: CourtConfig
}

export function MatchRealtimeClient({
  fixtureId,
  fixture: initialFixture,
  initialEvents,
  initialLineups,
  squad,
  court,
}: MatchRealtimeClientProps) {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const router = useRouter()

  /** Read the initial tab from ?tab= so the URL is shareable and the back button works. */
  const rawTab = searchParams.get('tab') ?? 'Overview'
  const isValidTab = TABS.includes(rawTab as Tab)
  const [activeTab, setActiveTab] = useState<Tab>(isValidTab ? (rawTab as Tab) : 'Overview')
  const [liveFixture, setLiveFixture] = useState<MatchFixtureShape>(initialFixture)
  const [events, setEvents] = useState<MatchEventShape[]>(initialEvents)
  const [lineups, setLineups] = useState<MatchLineupSlot[]>(initialLineups)

  // No sync effect needed: the server mounts this component fresh per fixture
  // (keyed by fixtureId in MatchServer), so initialFixture/initialEvents are
  // always current at mount. Realtime keeps them fresh afterwards.

  useEffect(() => {
    const channel = supabase
      .channel(`match_${fixtureId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'fixtures', filter: `id=eq.${fixtureId}` },
        (payload) => {
          const next = payload.new as Record<string, unknown> | null
          if (!next) return
          setLiveFixture((prev) => ({
            ...prev,
            home_score: (next.home_score as number | null) ?? prev.home_score,
            away_score: (next.away_score as number | null) ?? prev.away_score,
            status: (next.status as string | null) ?? prev.status,
            current_minute: (next.current_minute as number | null) ?? prev.current_minute,
            stats: (next.stats as MatchFixtureShape['stats']) ?? prev.stats,
          }))
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'match_events', filter: `fixture_id=eq.${fixtureId}` },
        (payload) => {
          const raw = payload.new as Record<string, unknown>
          const row: MatchEventShape = {
            id: raw.id as string,
            minute: (raw.minute as number | null) ?? null,
            event_type: raw.event_type as string,
            player_name: (raw.player_name as string | null) ?? null,
            details: (raw.details as string | null) ?? null,
            team_id: (raw.team_id as string | null) ?? null,
          }
          setEvents((prev) =>
            [...prev, row].sort((a, b) => (b.minute ?? 0) - (a.minute ?? 0)),
          )
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'fixture_lineups',
          filter: `fixture_id=eq.${fixtureId}`,
        },
        (payload) => {
          const row = (payload.new ?? payload.old) as Record<string, unknown> | null
          if (!row || row.team_id === undefined) return
          if (payload.eventType === 'DELETE') {
            setLineups((prev) => prev.filter((entry) => entry.id !== String(row.id)))
            return
          }
          const mapped: MatchLineupSlot = {
            id: String(row.id),
            teamId: String(row.team_id),
            slot: Number(row.slot),
            player_id: (row.player_id as string | null) ?? null,
            athlete_id: (row.athlete_id as string | null) ?? null,
            role: (row.role as string | null) ?? null,
            x: Number(row.x),
            y: Number(row.y),
            is_captain: Boolean(row.is_captain),
          }
          setLineups((prev) => {
            const others = prev.filter((entry) => entry.id !== mapped.id)
            return [...others, mapped].sort((a, b) => a.slot - b.slot)
          })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, fixtureId])

  const isLive = liveFixture.status === 'in_progress' || liveFixture.status === 'extra_time'

  return (
    <div>
      <div
        data-tour="match-tabs"
        className="max-w-7xl mx-auto px-4 mt-4 flex overflow-x-auto [&::-webkit-scrollbar]:hidden"
      >
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab)
              const url = new URL(window.location.href)
              if (tab === 'Overview') {
                url.searchParams.delete('tab')
              } else {
                url.searchParams.set('tab', tab)
              }
              router.push(url.pathname + url.search, { scroll: false })
              document.getElementById(`match-tab-${tab.toLowerCase()}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
            className={`px-6 py-4 font-semibold text-sm whitespace-nowrap transition-colors border-b-2 ${
              activeTab === tab
                ? 'border-primary text-text bg-surface-sunken'
                : 'border-transparent text-text-muted hover:text-text hover:bg-surface-sunken'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="py-6" data-tour="match-live">
        {activeTab === 'Overview' && (
          <div id="match-tab-overview">
            <OverviewPanel fixture={liveFixture} events={events} isLive={isLive} />
          </div>
        )}
        {activeTab === 'Stats' && (
          <div id="match-tab-stats">
            <StatsPanel fixture={liveFixture} />
          </div>
        )}
        {activeTab === 'Timeline' && (<div id="match-tab-timeline"><TimelinePanel events={events} homeId={liveFixture.home_team.id} awayId={liveFixture.away_team.id} homeShort={liveFixture.home_team.short_name} awayShort={liveFixture.away_team.short_name} /></div>)}
        {activeTab === 'Line-up' && (
          <div id="match-tab-line-up">
            <LineupPanel
              homeTeam={liveFixture.home_team}
              awayTeam={liveFixture.away_team}
              lineups={lineups}
              squad={squad}
              court={court}
            />
          </div>
        )}
        {activeTab === 'Table' && <div id="match-tab-table"><TablePanel /></div>}
      </div>
    </div>
  )
}

function OverviewPanel({ fixture, events, isLive }: { fixture: MatchFixtureShape; events: MatchEventShape[]; isLive: boolean }) {
  const initialEvents = events.slice(0, 5)
  return (
    <div className="space-y-6">
      <div className="cc-card p-6 text-center text-text-muted">
        <p>
          Venue: <span className="text-text font-medium">{fixture.venue || 'TBD'}</span>
        </p>
        <p className="mt-2">
          Competition:{' '}
          <span className="text-text font-medium">
            Coal City Games {fixture.home_team.category} {fixture.home_team.team_type}
          </span>
        </p>
        {isLive && (
          <p className="mt-2 text-live font-semibold animate-pulse">
            Minute {getEffectiveMinute(fixture)}&apos;
          </p>
        )}
      </div>

      <div className="cc-card p-6">
        <h3 className="font-bold text-lg mb-4 text-center">Match Events</h3>
        {initialEvents.length === 0 ? (
          <p className="text-text-muted text-center text-sm">No events logged yet.</p>
        ) : (
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {initialEvents.map((e) => (
              <div key={e.id} className="flex items-center justify-between text-sm py-2 border-b border-border-subtle last:border-0">
                <span className="text-text-muted w-12">{e.minute}&apos;</span>
                <span className="flex-1 font-medium text-center text-text">
                  {e.event_type.replace(/_/g, ' ')}
                </span>
                <span className="text-text-muted flex-1 text-right truncate">
                  {e.player_name || 'N/A'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatsPanel({ fixture }: { fixture: MatchFixtureShape }) {
  const stats = fixture.stats
  if (!stats) {
    return (
      <div className="cc-empty">
        No statistics available yet.
      </div>
    )
  }

  return (
    <div className="cc-card p-6 sm:p-10">
      <h3 className="font-bold text-xl mb-8 text-center">Match Statistics</h3>
      <div className="space-y-8">
        {STAT_KEYS.map((stat) => {
          const hVal = stats.home?.[stat] || 0
          const aVal = stats.away?.[stat] || 0
          const total = hVal + aVal || 1
          const hPct = (hVal / total) * 100
          const aPct = (aVal / total) * 100

          return (
            <div key={stat}>
              <div className="flex justify-between text-sm font-bold mb-2">
                <span className={hVal > aVal ? 'text-text' : 'text-text-muted'}>{hVal}</span>
                <span className="uppercase tracking-wider text-text-muted">{stat.replace(/_/g, ' ')}</span>
                <span className={aVal > hVal ? 'text-text' : 'text-text-muted'}>{aVal}</span>
              </div>
              <div className="flex h-2 bg-surface-sunken rounded-full overflow-hidden">
                <div style={{ width: `${hPct}%` }} className={`transition-all duration-500 ${hVal > aVal ? 'bg-primary' : 'bg-surface-sunken'}`} />
                <div style={{ width: `${aPct}%` }} className={`transition-all duration-500 ${aVal >= hVal ? 'bg-secondary' : 'bg-surface-sunken'}`} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TimelinePanel({
  events,
  homeId,
  awayId,
  homeShort,
  awayShort,
}: {
  events: MatchEventShape[]
  homeId: string
  awayId: string
  homeShort: string
  awayShort: string
}) {
  if (events.length === 0) {
    return (
      <div className="cc-empty">
        No events logged yet.
      </div>
    )
  }

  return (
    <div className="cc-card p-6">
      <h3 className="font-bold text-xl mb-8 text-center">Match Timeline</h3>
      <div className="relative border-l border-border-subtle ml-6 space-y-6">
        {events.map((e) => {
          const isHome = e.team_id === homeId
          const isAway = e.team_id === awayId
          return (
            <div key={e.id} className="relative pl-6">
              <div className="absolute w-3 h-3 bg-primary rounded-full -left-[6.5px] top-1.5 shadow-cc" />
              <div className="flex items-start gap-4">
                <span className="font-bold text-primary text-lg w-10 shrink-0">
                  {e.minute}&apos;
                </span>
                <div className="bg-surface-sunken border border-border-subtle rounded-lg p-3 flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold capitalize">{e.event_type.replace(/_/g, ' ')}</span>
                    {e.team_id && (
                      <span className="text-xs font-semibold px-2 py-1 bg-surface-sunken rounded text-text-muted">
                        {isHome ? homeShort : isAway ? awayShort : ''}
                      </span>
                    )}
                  </div>
                  {e.player_name && (
                    <p className="text-sm font-medium text-text">{e.player_name}</p>
                  )}
                  {e.details && <p className="text-xs text-text-muted mt-1">{e.details}</p>}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function LineupPanel({
  homeTeam,
  awayTeam,
  lineups,
  squad,
  court,
}: {
  homeTeam: MatchFixtureShape['home_team']
  awayTeam: MatchFixtureShape['away_team']
  lineups: MatchLineupSlot[]
  squad: MatchSquadPlayer[]
  court: CourtConfig
}) {
  const slotsFor = (teamId: string) =>
    lineups
      .filter((slot) => slot.teamId === teamId)
      .map((slot) => ({
        id: slot.id,
        slot: slot.slot,
        player_id: slot.player_id,
        athlete_id: slot.athlete_id,
        role: slot.role,
        x: slot.x,
        y: slot.y,
        is_captain: slot.is_captain,
      }))

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {[
        { team: homeTeam, accent: 'home' as const },
        { team: awayTeam, accent: 'away' as const },
      ].map(({ team, accent }) => {
        const slots = slotsFor(team.id)
        return (
          <div key={team.id} className="cc-card p-6">
            <h3 className="mb-6 border-b border-border-subtle pb-2 text-center text-lg font-bold">
              {team.name} Lineup
            </h3>
            {slots.length > 0 ? (
              <FormationCanvas
                court={court}
                slots={slots}
                teamName={team.name}
                accent={accent}
                players={squad.filter((player) => player.team_id === team.id)}
              />
            ) : team.roster ? (
              <ul className="space-y-3">
                {team.roster.split(',').map((player: string, index: number) => (
                  <li key={index} className="rounded bg-surface-sunken py-2 text-center text-sm">
                    {player.trim()}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-sm text-text-muted">No data available yet.</p>
            )}
          </div>
        )
      })}
    </div>
  )
}

function TablePanel() {
  return (
    <div className="cc-empty flex flex-col items-center justify-center py-20">
      <svg className="w-16 h-16 text-text-muted mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
      <h3 className="font-bold text-xl mb-2 text-text-muted">Competition Standings</h3>
      <p className="text-text-muted">Live table data is not available for this competition yet.</p>
      <Link href="/competitions" className="mt-6 text-primary hover:text-primary font-medium">
        View Group Stage Settings
      </Link>
    </div>
  )
}