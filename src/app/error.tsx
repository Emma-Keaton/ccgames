'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

// Next.js 16 passes `unstable_retry` (preferred) — `reset` is the legacy
// alias. Accept both so this boundary works on either convention.
export default function Error({
  error,
  reset,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  reset?: () => void
  unstable_retry?: () => void
}) {
  const retry = unstable_retry ?? reset

  useEffect(() => {
    console.error(error)
    try {
      Sentry.captureException(error)
    } catch {
      // Telemetry must never break the fallback UI.
    }
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f172a] px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-border-subtle bg-[#1e293b] p-8 text-center">
        <h2 className="text-2xl font-bold text-text">Something went wrong!</h2>
        <p className="mt-2 text-sm text-text-muted">
          An unexpected error occurred while rendering this section.
        </p>
        {error?.digest && (
          <p className="mt-2 text-xs text-text-muted">
            Error digest: {error.digest}
          </p>
        )}
        <button
          type="button"
          onClick={() => {
            if (retry) {
              retry()
            } else {
              window.location.reload()
            }
          }}
          className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
