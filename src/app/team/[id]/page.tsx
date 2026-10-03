import Navigation from '@/components/Navigation'
import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'

export default async function TeamCenter({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const supabase = createClient()

  const { data: team, error } = await (await supabase)
    .from('teams')
    .select('*')
    .eq('id', resolvedParams.id)
    .single()

  if (error || !team) {
    notFound()
  }

  // Fetch fixtures where this team is playing
  const { data: fixtures } = await (await supabase)
    .from('fixtures')
    .select('*, home_team:home_team_id(*), away_team:away_team_id(*)')
    .or(`home_team_id.eq.${team.id},away_team_id.eq.${team.id}`)
    .order('match_date', { ascending: false })

  const staff = [
    { role: 'Head Coach', name: team.coach },
    { role: 'Assistant Coach', name: team.assistant_coach },
    { role: 'Tactical Coach', name: team.tactical_coach },
    { role: 'Medical Staff', name: team.medical_staff },
    { role: 'Kit Personnel', name: team.kit_personnel },
  ].filter(s => s.name)

  return (
    <div className="min-h-dvh bg-surface text-text pb-32">
      <Navigation />

      {/* Team Header */}
      <div className="pt-16 border-b border-border-subtle" style={{ backgroundColor: team.attire_color === 'Yet to be decided' ? 'var(--color-surface-sunken)' : team.attire_color }}>
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 flex flex-col md:flex-row items-center gap-8 bg-surface/80 backdrop-blur-sm">
            <div className="w-32 h-32 md:w-40 md:h-40 bg-surface-sunken rounded-full flex items-center justify-center border-4 border-border-subtle shadow-cc-lg backdrop-blur-md">
                <span className="text-4xl md:text-5xl font-black text-text">{team.short_name}</span>
            </div>
            <div className="text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider bg-surface-sunken px-3 py-1 rounded-full backdrop-blur-md">{team.category || 'Male'} {team.team_type || 'Football'}</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-text drop-shadow-lg">{team.name}</h1>
                <p className="text-text-muted mt-2 font-medium">Attire: {team.attire_color}</p>
            </div>
         </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left Column: Staff & Roster */}
            <div className="space-y-8">
                <div className="cc-card p-6">
                    <h3 className="text-xl font-bold mb-4 border-b border-border-subtle pb-2">Technical Staff</h3>
                    {staff.length === 0 ? (
                        <p className="text-text-muted text-sm">No staff registered.</p>
                    ) : (
                        <ul className="space-y-3">
                            {staff.map((s, i) => (
                                <li key={i} className="flex flex-col">
                                    <span className="text-xs text-primary uppercase font-bold tracking-wider">{s.role}</span>
                                    <span className="font-medium">{s.name}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="cc-card p-6">
                    <h3 className="text-xl font-bold mb-4 border-b border-border-subtle pb-2">Squad Roster</h3>
                    {!team.roster ? (
                        <p className="text-text-muted text-sm">No players registered.</p>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {team.roster.split(',').map((player: string, i: number) => {
                                const p = player.trim()
                                if(!p) return null
                                return (
                                    <div key={i} className="bg-surface-sunken border border-border-subtle rounded px-3 py-1 text-sm hover:bg-surface-sunken transition-colors">
                                        {p}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Column: Fixtures */}
            <div className="lg:col-span-2">
                <div className="cc-card p-6">
                    <h3 className="text-xl font-bold mb-6 border-b border-border-subtle pb-2">Recent & Upcoming Fixtures</h3>
                    {!fixtures || fixtures.length === 0 ? (
                        <p className="text-text-muted text-center py-8">No matches scheduled for this team yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {fixtures.map(f => {
                                const isHome = f.home_team_id === team.id
                                const opponent = isHome ? f.away_team : f.home_team

                                let resultText = ''
                                let resultColor = 'text-text-muted'
                                if (f.status === 'full_time') {
                                    const teamScore = isHome ? f.home_score : f.away_score
                                    const oppScore = isHome ? f.away_score : f.home_score
                                    if (teamScore > oppScore) { resultText = 'W'; resultColor = 'text-secondary-strong' }
                                    else if (teamScore < oppScore) { resultText = 'L'; resultColor = 'text-live' }
                                    else { resultText = 'D'; resultColor = 'text-accent-strong' }
                                }

                                return (
                                    <a href={`/match/${f.id}`} key={f.id} className="block group">
                                        <div className="flex items-center justify-between p-4 bg-surface-sunken rounded-lg hover:bg-surface-elevated transition-colors border border-border-subtle group-hover:border-primary/30">
                                            <div className="flex-1 flex flex-col md:flex-row md:items-center gap-1 md:gap-4">
                                                <span className="text-xs text-text-muted font-mono w-24">
                                                    {new Date(f.match_date).toLocaleDateString()}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-text-muted">{isHome ? 'vs' : '@'}</span>
                                                    <span className="font-bold">{opponent?.name || 'Unknown'}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 text-right">
                                                {f.status === 'full_time' ? (
                                                    <div className="flex items-center gap-3">
                                                        <span className={`font-black text-lg ${resultColor}`}>{resultText}</span>
                                                        <span className="font-bold tracking-tighter tabular-nums bg-surface-sunken px-2 py-1 rounded">
                                                            {f.home_score} - {f.away_score}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm font-bold text-primary">
                                                        {f.status === 'in_progress' ? 'LIVE' : new Date(f.match_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </a>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

         </div>
      </div>
    </div>
  )
}
