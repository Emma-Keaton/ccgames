import type { Fixture } from '@/lib/competitions-standings'
import { FixtureCard } from '@/components/competitions/FixtureCard'
import { EmptyState } from '@/components/ui/feedback'
import { Section } from '@/components/ui/Section'

interface PlayoffTabsProps {
  quarterFinal: Fixture[]
  semiFinal: Fixture[]
  final: Fixture[]
}

export function PlayoffTabs({ quarterFinal, semiFinal, final }: PlayoffTabsProps) {
  const renderBlock = (label: string, matches: Fixture[]) => {
    if (matches.length === 0) return null
    return (
      <div key={label} className="mt-6">
        <h3 className="text-xl font-semibold mb-4 text-primary uppercase tracking-widest">
          {label}
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {matches.map((f) => (
            <FixtureCard key={f.id} match={f} />
          ))}
        </div>
      </div>
    )
  }

  const hasAny = quarterFinal.length > 0 || semiFinal.length > 0 || final.length > 0

  return (
    <Section title="Tournament Bracket">

      <div className="space-y-10">
        {renderBlock('Final', final)}
        {renderBlock('Semi Final', semiFinal)}
        {renderBlock('Quarter Final', quarterFinal)}
        {!hasAny && (
          <EmptyState
            title="The play-offs bracket has not been generated yet."
            hint="Knockout fixtures appear here once the group stage is decided."
          />
        )}
      </div>
    </Section>
  )
}
