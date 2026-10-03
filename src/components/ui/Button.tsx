import Link from 'next/link'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'

/**
 * The app's button.
 *
 * Renders an `<a>` (via `next/link`) when `href` is present and a `<button>`
 * otherwise, so navigation stays navigation (middle-click, Cmd-click, "open in
 * new tab" all work) while actions stay actions.
 *
 * Always pass `aria-label` when the child is an icon only.
 */

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

function buttonClass(variant: ButtonVariant, size: ButtonSize, block: boolean, className: string) {
  return [
    'cc-btn',
    `cc-btn--${variant}`,
    size === 'sm' ? 'cc-btn--sm' : size === 'lg' ? 'cc-btn--lg' : '',
    block ? 'cc-btn--block' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')
}

interface CommonProps {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Full-width button (mobile CTAs, form submits). */
  block?: boolean
  className?: string
  children: ReactNode
}

type ButtonAsButton = CommonProps &
  Omit<ComponentPropsWithoutRef<'button'>, 'className' | 'children'> & { href?: undefined }

type ButtonAsLink = CommonProps &
  Omit<ComponentPropsWithoutRef<'a'>, 'className' | 'children' | 'href'> & { href: string }

export type ButtonProps = ButtonAsButton | ButtonAsLink

export function Button(props: ButtonProps) {
  const { variant = 'primary', size = 'md', block = false, className = '', children, ...rest } = props
  const classes = buttonClass(variant, size, block, className)

  if ('href' in rest && typeof rest.href === 'string') {
    const { href, ...anchorRest } = rest
    const external = /^(https?:)?\/\//.test(href) || href.startsWith('mailto:')

    if (external) {
      return (
        <a href={href} className={classes} rel="noopener noreferrer" {...anchorRest}>
          {children}
        </a>
      )
    }

    return (
      <Link href={href} className={classes} {...anchorRest}>
        {children}
      </Link>
    )
  }

  return (
    <button type="button" className={classes} {...rest}>
      {children}
    </button>
  )
}
