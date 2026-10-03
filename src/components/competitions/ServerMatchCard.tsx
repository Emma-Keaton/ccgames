import Link from 'next/link'
import type { Fixture } from '@/lib/competitions-standings'
import { formatMatchTimeLabel } from '@/lib/match-clock'
import { LiveBadge } from '@/components/ui/feedback'

export interface ServerMatchCardProps {
  match: Fixture
}

export function ServerMatchCard({ match }: ServerMatchCardProps) {
  const isLive = match.status === 'in_progress' || match.status === 'extra_time'
  const timeLabel = formatMatchTimeLabel(match)

  const dateLabel = new Date(match.match_date).toLocaleDateString()
  const stageLabel = (match.stage ?? 'Group stage').replace(/_/g, ' ')

  return (
    <Link href={`/match/${match.id}`} className="block rounded-xl focus-visible:outline-2 focus-visible:outline-primary">
      <div className="cc-card cc-card--interactive group flex flex-col items-center justify-between p-4 md:flex-row">
        <div className="mb-2 w-full text-center text-sm text-text-muted md:mb-0 md:w-32 md:text-left">
          {dateLabel}
          <div className="mt-1 text-xs uppercase">{stageLabel}</div>
        </div>

        <div className="flex flex-1 items-center justify-center gap-4">
          <div className="flex-1 text-right text-lg font-bold transition-colors group-hover:text-primary">
            {match.home_team?.name ?? 'Unknown'}
          </div>
          <div className="cc-score min-w-[80px] px-4 py-2 text-center">
            {match.status === 'scheduled'
              ? 'vs'
              : `${match.home_score ?? '-'} - ${match.away_score ?? '-'}`}
          </div>
          <div className="flex-1 text-left text-lg font-bold transition-colors group-hover:text-primary">
            {match.away_team?.name ?? 'Unknown'}
          </div>
        </div>

        <div className="mt-2 flex w-full justify-end md:mt-0 md:w-32">
          {isLive ? (
            <LiveBadge label={timeLabel} />
          ) : match.status === 'full_time' ? (
            <span className="cc-num text-sm text-text-muted">FT</span>
          ) : match.status === 'cancelled' ? (
            <span className="text-sm text-text-muted">CANCELLED</span>
          ) : (
            <span className="cc-num text-sm text-primary">
              {new Date(match.match_date).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

