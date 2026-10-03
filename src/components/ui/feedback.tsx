import type { ReactNode } from 'react'

/* --------------------------------------------------------------------------
   Badges & pills
   -------------------------------------------------------------------------- */

export type BadgeTone = 'live' | 'success' | 'warn' | 'danger' | 'neutral'

export function Badge({
  tone = 'neutral',
  children,
  className = '',
}: {
  tone?: BadgeTone
  children: ReactNode
  className?: string
}) {
  return <span className={`cc-badge cc-badge--${tone} ${className}`}>{children}</span>
}

/**
 * The one place a live match is announced. A pulsing crimson dot plus the word
 * LIVE — never colour alone, so it survives greyscale and screen readers.
 */
export function LiveBadge({ label = 'Live' }: { label?: string }) {
  return (
    <Badge tone="live">
      <span className="cc-live-dot" aria-hidden="true" />
      {label}
    </Badge>
  )
}

/* --------------------------------------------------------------------------
   Empty state — never a bare "No data"
   -------------------------------------------------------------------------- */

export function EmptyState({
  title,
  hint,
  action,
  className = '',
}: {
  title: string
  hint?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={`cc-empty ${className}`}>
      <p className="text-base font-semibold text-text">{title}</p>
      {hint ? <p className="mx-auto mt-1 max-w-md text-sm text-text-muted">{hint}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  )
}

/* --------------------------------------------------------------------------
   Stat tiles
   -------------------------------------------------------------------------- */

export function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string
  value: ReactNode
  hint?: string
  /** Trail the value with a coloured figure (medal counts, deltas). */
  tone?: 'gold' | 'live' | 'success'
}) {
  const valueTone =
    tone === 'gold'
      ? 'text-accent'
      : tone === 'live'
        ? 'text-live'
        : tone === 'success'
          ? 'text-secondary'
          : 'text-text'

  return (
    <div className="cc-stat">
      <p className="cc-stat-label">{label}</p>
      <p className={`cc-stat-value ${valueTone}`}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-text-muted">{hint}</p> : null}
    </div>
  )
}

export function StatGrid({ children, columns = 3 }: { children: ReactNode; columns?: 2 | 3 | 4 }) {
  const cols =
    columns === 2
      ? 'sm:grid-cols-2'
      : columns === 4
        ? 'sm:grid-cols-2 lg:grid-cols-4'
        : 'sm:grid-cols-3'
  return <div className={`grid grid-cols-1 gap-4 ${cols}`}>{children}</div>
}

/* --------------------------------------------------------------------------
   Loading
   -------------------------------------------------------------------------- */

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <span role="status" className="inline-flex items-center gap-3 text-sm text-text-muted">
      <span className="cc-spinner" aria-hidden="true" />
      {label}
    </span>
  )
}
