import Link from 'next/link'
import type { Fixture } from '@/lib/competitions-standings'
import { formatMatchTimeLabel } from '@/lib/match-clock'
import { LiveBadge } from '@/components/ui/feedback'

export function FixtureCard({ match }: { match: Fixture }) {
  const isLive = match.status === 'in_progress' || match.status === 'extra_time'
  const timeLabel = formatMatchTimeLabel(match)

  return (
    <Link href={`/match/${match.id}`} className="block rounded-xl focus-visible:outline-2 focus-visible:outline-primary">
      <div className="cc-card cc-card--interactive group p-4">
        <div className="flex flex-col items-center justify-between md:flex-row">
          <div className="mb-2 w-full text-center text-sm text-text-muted md:mb-0 md:w-32 md:text-left">
            {new Date(match.match_date).toLocaleDateString()}
            <div className="mt-1 text-xs uppercase">{(match.stage ?? 'Group stage').replace(/_/g, ' ')}</div>
          </div>
          <div className="flex flex-1 items-center justify-center gap-4">
            <div className="flex-1 text-right text-lg font-bold text-text transition-colors group-hover:text-primary">{match.home_team?.name}</div>
            <div className="cc-score min-w-[80px] px-4 py-2 text-center">
              {match.status === 'scheduled' ? 'vs' : `${match.home_score ?? '-'} - ${match.away_score ?? '-'}`}
            </div>
            <div className="flex-1 text-left text-lg font-bold text-text transition-colors group-hover:text-primary">{match.away_team?.name}</div>
          </div>
          <div className="mt-2 flex w-full justify-end md:mt-0 md:w-32">
            {isLive ? (
              <span className="flex items-center gap-2 text-sm font-bold">
                <LiveBadge label={timeLabel} />
              </span>
            ) : match.status === 'full_time' ? (
              <span className="cc-num text-sm text-text-muted">FT</span>
            ) : match.status === 'cancelled' ? (
              <span className="text-sm text-text-muted">CANCELLED</span>
            ) : (
              <span className="cc-num text-sm text-primary">
                {new Date(match.match_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

