'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

export default function SplashScreen() {
  const [visible, setVisible] = useState(true)
  const [progress, setProgress] = useState(() =>
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 1
      : 0
  )

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // Reduced motion: skip the splash immediately (external media-query sync).
      // oxlint-disable-next-line react/set-state-in-effect -- see above
      setVisible(false)
      return
    }
    const start = Date.now()
    const duration = 2000

    const raf = () => {
      const elapsed = Date.now() - start
      setProgress(Math.min(elapsed / duration, 1))
      if (elapsed < duration) {
        requestAnimationFrame(raf)
      }
    }
    const timer = setTimeout(() => setVisible(false), duration)

    requestAnimationFrame(raf)
    return () => {
      clearTimeout(timer)
    }
  }, [])

  if (!visible) return null

  return (
    <div
      role="status"
      aria-label="Loading Coal City Games"
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-surface"
    >
      <div className="relative mb-6 h-12 w-12">
        <Image
          src="/brand/ccgames-mark.svg"
          alt="Coal City Games logo"
          fill
          className="object-contain"
          priority
        />
      </div>

      {/* App name */}
      <h1 className="text-text font-bold text-2xl tracking-tight mb-8">
        Coal City Games
      </h1>

      {/* Animated loading bar */}
      <div className="w-48 h-1 bg-hairline rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-none"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  )
}
