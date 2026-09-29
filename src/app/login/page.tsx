import type { Metadata } from 'next'
import LoginForm from './LoginForm'

export const metadata: Metadata = {
  title: 'Sign in · Coal City Games',
  description: 'Sign in or create a Coal City Games account to follow teams and manage tournaments.',
  robots: { index: false, follow: false },
}

/**
 * Server wrapper: reads the `next` query param on the server so
 * the client form does not need `useSearchParams()` (which would force the
 * route dynamic / require a Suspense boundary).
 *
 * `next` is validated here to be a site-relative path, which prevents an open
 * redirect through the login form.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await searchParams
  const safeNext = typeof next === 'string' && next.startsWith('/') && !next.startsWith('//')
    ? next
    : '/'

  return <LoginForm nextPath={safeNext} />
}
