'use client'

import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/client'
import { ADMIN_LINKS, PUBLIC_LINKS } from '@/lib/nav-links'
import { useAdminAuth } from '@/lib/use-admin-auth'
import { useEffect, useState, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'

const isActivePath = (pathname: string, href: string) =>
  href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)

const NavLinks = ({ pathname }: { pathname: string }) => (
  <span data-tour="nav-public" className="contents">
    {PUBLIC_LINKS.map((link) => {
      const active = isActivePath(pathname, link.href)
      return (
        <Link
          key={link.href}
          href={link.href}
          className={
            'px-3 py-2 rounded-md text-base md:text-sm font-medium block md:inline-block transition-colors ' +
            (active ? 'text-primary bg-primary-soft' : 'text-ink-muted hover:text-ink hover:bg-surface-sunken')
          }
        >
          {link.label}
        </Link>
      )
    })}
  </span>
)

export default function Navigation() {
  const { loading: authLoading, authenticated, isAppAdmin, canAccessAdmin } = useAdminAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const supabase = createClient()
  const pathname = usePathname()
  const router = useRouter()
  const prevPathname = useRef(pathname)

  useEffect(() => {
    if (!isMobileMenuOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMobileMenuOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isMobileMenuOpen])

  useEffect(() => {
    if (prevPathname.current !== pathname) {
      setIsMobileMenuOpen(false)
      prevPathname.current = pathname
    }
  }, [pathname])

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await supabase.auth.signOut()
      // Clear the httpOnly server cookies too, otherwise the proxy would keep
      // treating the browser as signed in until they expire.
      await fetch('/auth/signout', { method: 'POST' })
    } finally {
      setIsMobileMenuOpen(false)
      setSigningOut(false)
      router.replace('/')
      router.refresh()
    }
  }

  const signedIn = !authLoading && authenticated
  const adminLinks = canAccessAdmin
    ? ADMIN_LINKS.filter((link) => link.href !== '/admin/users' || isAppAdmin)
    : []
return (
    <>
      <nav className="fixed w-full z-50 bg-surface-card/90 backdrop-blur-md border-b border-border-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                type="button"
                aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={isMobileMenuOpen}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 -ml-2 mr-2 text-ink-muted hover:text-ink focus:outline-none"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>

              <Link href="/" className="flex-shrink-0 flex items-center gap-2">
                <Image
                  src="/brand/ccgames-mark.svg"
                  alt="Coal City Games logo"
                  width={32}
                  height={32}
                  className="w-8 h-8 object-contain"
                  priority
                />
                <span className="font-bold text-xl tracking-tight text-ink">
                  Coal City Games
                </span>
              </Link>

              <div className="hidden md:block ml-10">
                <div className="flex items-baseline space-x-4">
                  <NavLinks pathname={pathname} />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {signedIn ? (
                <>
                  {adminLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={
                        'text-sm font-medium hidden sm:block ' +
                        (isActivePath(pathname, link.href)
                          ? 'text-primary font-bold'
                          : 'text-primary hover:text-primary-strong')
                      }
                    >
                      {link.label}
                    </Link>
                  ))}
                  <button
                    type="button"
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="text-ink-muted hover:text-ink px-3 py-2 rounded-md text-sm font-medium border border-hairline hidden sm:block disabled:opacity-60"
                  >
                    {signingOut ? 'Signing out...' : 'Sign Out'}
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="bg-enugu-blue text-text px-4 py-2 rounded-md text-sm font-medium hover:bg-enugu-blue/90 transition-colors hidden sm:block"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Sliding Menu Overlay */}
      <div
        className={`fixed inset-0 bg-ink/50 z-40 md:hidden transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile Sliding Menu Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
        className={`cc-safe-b fixed inset-y-0 left-0 w-64 bg-surface-elevated z-50 transform transition-transform duration-300 ease-in-out border-r border-border-subtle flex flex-col md:hidden pt-20 pb-6 px-4 shadow-cc-lg overflow-y-auto ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex flex-col space-y-2">
          <NavLinks pathname={pathname} />
          <hr className="border-hairline my-4" />
          {signedIn ? (
            <>
              {adminLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={
                    'px-3 py-2 rounded-md text-base font-medium block ' +
                    (isActivePath(pathname, link.href)
                      ? 'text-primary bg-primary-soft'
                      : 'text-ink-muted hover:text-ink hover:bg-surface-sunken')
                  }
                >
                  {link.label}
                </Link>
              ))}
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className="text-left text-danger hover:text-danger/80 px-3 py-2 rounded-md text-base font-medium block w-full hover:bg-red-50 disabled:opacity-60"
              >
                {signingOut ? 'Signing out...' : 'Sign Out'}
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="bg-enugu-blue text-center text-text px-4 py-3 rounded-md text-base font-medium hover:bg-enugu-blue/90 transition-colors block w-full mt-4"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </>
  )
}