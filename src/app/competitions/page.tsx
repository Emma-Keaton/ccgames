import { Suspense } from 'react'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/client'
import Navigation from '@/components/Navigation'
import { SportMascotStrip } from '@/components/brand/SportMascotStrip'
import { CompetitionsTabs } from './CompetitionsTabs'

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
    <div className="min-h-screen bg-[#0f172a] text-white pb-32">
      <Navigation />
      <div data-tour="competitions-tabs" className="pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <header className="mb-10 flex flex-col items-center gap-5 text-center md:flex-row md:justify-between md:text-left">
          <div className="flex items-center gap-4">
            <Image src="/mascot/mascot-hero.webp" alt="Odum Eze, Coal City Games mascot" width={84} height={112} className="h-20 w-auto object-contain" />
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2">Competitions</h1>
            <p className="text-gray-400 text-lg">Coal City Games Tournament Hub</p>
          </div>
          </div>
        </header>
        <div className="mb-10">
          <SportMascotStrip />
        </div>
        <Suspense fallback={<div className="py-20 text-center text-gray-400">Loading competitions…</div>}>
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
