import type { Metadata, Viewport } from 'next'
import './globals.css'
import FloatingBackButton from '@/components/FloatingBackButton'
import SplashScreen from '@/components/SplashScreen'
import { OnboardingExperience } from '@/components/onboarding/OnboardingExperience'

/**
 * Fonts
 *
 * This app deliberately does **not** use `next/font/google`: that loader runs at
 * build time, which makes a production build depend on network access to
 * fonts.googleapis.com (fatal on locked-down CI or an offline deploy — Next 16's
 * Turbopack also rejects wrapping the loader in try/catch). The system font
 * stack in `globals.css` provides the same fallback chain with zero build-time
 * network dependency.
 */
const SYSTEM_FONT_CLASS = 'system-font-fallback'

export const metadata: Metadata = {
  metadataBase: (() => {
    const raw = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
    try {
      return new URL(raw)
    } catch {
      return new URL(raw.startsWith("http") ? raw : `https://${raw}`)
    }
  })(),
  title: 'Coal City Games 2026 — Enugu',
  description: 'The 23rd National Sports Festival — live scores, results, medals and schedules for Coal City Games Enugu 2026.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'icon', url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { rel: 'icon', url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'Coal City Games 2026 — Enugu',
    description: 'The 23rd National Sports Festival — live scores, results, medals and schedules for Coal City Games Enugu 2026.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Coal City Games 2026 — Enugu',
      },
    ],
    siteName: 'Coal City Games 2026',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Coal City Games 2026 — Enugu',
    description: 'The 23rd National Sports Festival — live scores, results, medals and schedules for Coal City Games Enugu 2026.',
    images: ['/og-image.png'],
  },
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#F8F9FA',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Above-the-fold webfonts get an explicit priority hint so the first
            paint already uses the real typeface instead of swapping mid-read. */}
        <link
          rel="preload"
          href="/fonts/Inter-Regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/Inter-Bold.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body className={SYSTEM_FONT_CLASS}>
        <a href="#main" className="cc-skip-link">
          Skip to main content
        </a>
        <SplashScreen />
        <OnboardingExperience>
          <div id="main">{children}</div>
        </OnboardingExperience>
        <FloatingBackButton />
      </body>
    </html>
  )
}
