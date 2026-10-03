import Link from 'next/link'
import type { ReactNode } from 'react'

/** Section heading with an optional trailing link/action. */
export function SectionHeading({
  title,
  href,
  linkLabel,
  actions,
  level = 2,
  id,
}: {
  title: string
  href?: string
  linkLabel?: string
  actions?: ReactNode
  /** Use `3` for a heading nested inside another section. */
  level?: 2 | 3
  id?: string
}) {
  const Heading = level === 3 ? 'h3' : 'h2'
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <Heading
        id={id}
        className={level === 3 ? 'text-lg font-semibold text-text' : 'cc-section-title'}
      >
        {title}
      </Heading>
      <div className="flex items-center gap-3">
        {actions}
        {href && linkLabel ? (
          <Link
            href={href}
            className="text-sm font-semibold text-primary hover:text-primary-strong transition-colors"
          >
            {linkLabel}
          </Link>
        ) : null}
      </div>
    </div>
  )
}

/** A page section: heading + children, with the standard 4rem vertical rhythm. */
export function Section({
  title,
  href,
  linkLabel,
  actions,
  id,
  children,
  tour,
}: {
  title?: string
  href?: string
  linkLabel?: string
  actions?: ReactNode
  id?: string
  children: ReactNode
  /** `data-tour` anchor consumed by the guided tour. */
  tour?: string
}) {
  return (
    <section id={id} data-tour={tour} className="scroll-mt-24">
      {title ? (
        <SectionHeading title={title} href={href} linkLabel={linkLabel} actions={actions} />
      ) : null}
      {children}
    </section>
  )
}
