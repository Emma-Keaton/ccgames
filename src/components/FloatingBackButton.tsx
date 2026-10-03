'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * Floating quick-exit button for public pages.
 *
 * It always links to the homepage (never `router.back()`), so the icon is a
 * home glyph rather than a back arrow — the arrow would promise browser
 * history navigation that this button does not perform.
 */
export default function FloatingBackButton() {
  const pathname = usePathname()

  // Don't show on the homepage or admin dashboard
  if (pathname === '/' || pathname.startsWith('/admin')) {
    return null
  }

  return (
    <Link
        href="/"
        className="fixed bottom-6 right-6 z-40 flex items-center justify-center rounded-full border border-primary/25 bg-primary p-4 text-white shadow-cc-lg transition-transform duration-150 ease-out hover:-translate-y-0.5"
        aria-label="Return to homepage"
    >
      {/* Home icon: the button always navigates to "/", it never pops history */}
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M3 10.5 12 3l9 7.5M5 9.5V21h5v-6h4v6h5V9.5" />
      </svg>
    </Link>
  )
}
