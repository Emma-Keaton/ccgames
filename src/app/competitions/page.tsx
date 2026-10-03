import { Suspense } from 'react'
import { createClient } from '@/utils/supabase/client'
import Navigation from '@/components/Navigation'
import { CompetitionsTabs } from './CompetitionsTabs'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/feedback'

export const revalidate = 30

export default async function CompetitionsPage() {
  const supabase = createClient()

  const [fixturesRes, teamsRes, eventsRes, playersRes] = await Promise.all([
    supabase
      .from('fixtures')
      .select('*, home_team:home_team_id(*), away_team:away_team_id(*)')
      .order('match_date', { ascending: true }),
    supabase.from('teams').select('*').order('name'),
    supabase
      .from('match_events')
      .select('*, player:player_id(*), assist_player:assist_player_id(*), team:team_id(*)'),
    supabase.from('players').select('*, team:team_id(*)'),
  ])

  return (
    <div className="min-h-dvh bg-surface pb-24 text-text">
      <Navigation />
      <div data-tour="competitions-tabs" className="cc-page space-y-10">
        <PageHeader
          eyebrow="Tournament hub"
          title="Competitions"
          lede="Coal City Games Tournament Hub"
        />
        <Suspense fallback={<div className="py-20 text-center"><Spinner label="Loading competitions…" /></div>}>
          <CompetitionsTabs
            fixtures={fixturesRes.data ?? []}
            teams={teamsRes.data ?? []}
            events={eventsRes.data ?? []}
            players={playersRes.data ?? []}
          />
        </Suspense>
      </div>
    </div>
  )
}
