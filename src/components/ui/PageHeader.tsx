import type { ReactNode } from 'react'
import { HEADER, EYEBROW, TITLE, LEDE } from './classes'

/**
 * The header block every page opens with: a ribbon-adjacent eyebrow, the page
 * title, an optional one-line lede and an optional actions slot.
 *
 * Rendered as a card so the title never floats on the canvas — the header is
 * the first "raised surface" of the page and sets the vertical rhythm.
 */
export function PageHeader({
  eyebrow,
  title,
  lede,
  actions,
  children,
  className = '',
}: {
  eyebrow?: ReactNode
  title: string
  lede?: ReactNode
  /** Buttons/links pinned to the trailing edge on wide screens. */
  actions?: ReactNode
  /** Extra content below the lede (filters, metadata rows, stat strips). */
  children?: ReactNode
  className?: string
}) {
  return (
    <header className={`cc-card ${className}`}>
      <div className={`${HEADER} sm:flex-row sm:items-start sm:justify-between sm:gap-6`}>
        <div className="flex flex-col gap-2">
          {eyebrow ? <p className={EYEBROW}>{eyebrow}</p> : null}
          <h1 className={TITLE}>{title}</h1>
          {lede ? <p className={LEDE}>{lede}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {children ? <div className="px-7 pb-7 sm:px-8 sm:pb-8">{children}</div> : null}
    </header>
  )
}
