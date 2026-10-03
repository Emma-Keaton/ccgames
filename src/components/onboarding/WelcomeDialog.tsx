'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useAdminAuth } from '@/lib/use-admin-auth'
import { useOnboarding } from './onboarding-context'
import type { RoleId } from '@/lib/onboarding'

/**
 * First-run welcome.
 *
 * Shown once per browser (see `WELCOME_SEEN_KEY`) so a newcomer is greeted with
 * a short explanation of what the app is and how to get in, without ever
 * interrupting a returning operator. Every path here can also be reached from
 * the Guide link in the navigation, so nothing is lost if it is dismissed.
 */

interface Choice {
  id: string
  title: string
  detail: string
  role: RoleId
  href: string
  action: 'tour' | 'link'
}

const CHOICES: Choice[] = [
  {
    id: 'fan',
    title: 'Follow the action',
    detail: 'Live scores, fixtures, tables, squads, news and medal tables.',
    role: 'fan',
    href: '/competitions',
    action: 'tour',
  },
  {
    id: 'user',
    title: 'Make it yours',
    detail: 'Your signed-in tour of the app — follow your favourite teams and pick up where you left off.',
    role: 'user',
    href: '/login',
    action: 'tour',
  },
]

export function WelcomeDialog() {
  const { startTour, completeWelcome } = useOnboarding()
  const { loading, authenticated } = useAdminAuth()
  const [ready, setReady] = useState(false)
  const [choice, setChoice] = useState<Choice>(CHOICES[0])
  const primaryRef = useRef<HTMLButtonElement>(null)
  /** Once the visitor picks a card by hand, auto-detection never overrides it. */
  const userPicked = useRef(false)

  // Wait for the splash screen (2s) before covering the page with a modal.
  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 2200)
    return () => window.clearTimeout(timer)
  }, [])

  // Focus the primary action on open + Escape to dismiss (mobile menu parity).
  useEffect(() => {
    if (!ready || loading) return
    primaryRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') completeWelcome()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [ready, loading, completeWelcome])

  /**
   * Everybody is welcomed as a fan; a signed-in account gets the signed-in
   * tour. Staff duties are granted quietly by an admin — the people holding
   * them are introduced to those controls when they open them, and nobody
   * else ever learns the roles exist.
   */
  useEffect(() => {
    if (loading || userPicked.current) return
    const match = authenticated ? (CHOICES.find((option) => option.id === 'user') ?? CHOICES[0]) : CHOICES[0]
    // Auth state resolves after mount, so the default choice must be synced in an effect.
    // oxlint-disable-next-line react/set-state-in-effect -- see above
     
    setChoice(match)
  }, [loading, authenticated])

  if (!ready || loading) return null

  /** Anonymous visitors see the fan card; signed-in accounts see theirs. */
  const visibleChoices = authenticated
    ? [CHOICES.find((option) => option.id === 'user') ?? CHOICES[0]]
    : [CHOICES[0]]

  const confirm = () => {
    completeWelcome()
    if (choice.action === 'tour') startTour(choice.role)
  }

  return (
    <div
      className="cc-scrim flex items-center justify-center p-4 cc-safe-b"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
    >
      <div className="cc-modal w-full max-w-xl">
        <div className="flex items-center gap-3">
          
          <Image
            src="/brand/ccgames-mark.svg"
            alt="Coal City Games logo"
            width={40}
            height={40}
            className="h-10 w-10 object-contain"
          />
          <div>
            <h2 id="welcome-title" className="text-xl font-extrabold tracking-tight text-text">
              Welcome to Coal City Games
            </h2>
            <p className="text-xs text-text-muted">
              Tournaments, live scoring and news in one place.
            </p>
          </div>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-text-muted">
          {authenticated
            ? 'Welcome back — here is a 60-second tour of everything your account can do: live scores, fixtures, tables and news.'
            : 'Let us show you around in 60 seconds — live scores, fixtures, tables, squads and news. No account needed to watch; sign in to follow your favourite teams.'}
        </p>

        <div className="mt-5 space-y-3" role="radiogroup" aria-label="Choose your starting point">
          {visibleChoices.map((option) => {
            const selected = option.id === choice.id
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => {
                  userPicked.current = true
                  setChoice(option)
                }}
                className={
                  'w-full rounded-xl border p-4 text-left transition ' +
                  (selected
                    ? 'border-primary/40 bg-primary-soft'
                    : 'border-border-subtle bg-surface-sunken hover:border-border-subtle')
                }
              >
                <span className="block text-sm font-semibold text-text">{option.title}</span>
                <span className="mt-1 block text-xs text-text-muted">{option.detail}</span>
              </button>
            )
          })}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={completeWelcome}
            className="text-xs text-text-muted underline decoration-dotted hover:text-text"
          >
            I do not need this — do not show again
          </button>
          <div className="flex items-center gap-3">
            <Link
              href="/onboarding"
              onClick={completeWelcome}
              className="cc-btn cc-btn--secondary"
            >
              Open the guide
            </Link>
            <button
              ref={primaryRef}
              type="button"
              onClick={confirm}
              className="cc-btn cc-btn--primary"
            >
              {choice.action === 'tour' ? 'Take the tour' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WelcomeDialog
