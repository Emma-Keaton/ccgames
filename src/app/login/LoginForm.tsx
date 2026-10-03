'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

type Mode = 'signin' | 'signup'

/**
 * Auth form: the app previously had no way to create
 * an account even though the README told users to "create an account via the
 * Sign In page". This form now covers email/password sign-in, email/password
 * sign-up (with Supabase confirmation email), password reset, and Google OAuth,
 * all redirecting to the validated `nextPath` afterwards.
 */
export default function LoginForm({ nextPath = '/' }: { nextPath?: string }) {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()

  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Already signed in? Go straight where the user was heading.
  useEffect(() => {
    let cancelled = false
    void supabase.auth.getUser().then(({ data }) => {
      if (!cancelled && data.user) {
        router.replace(nextPath)
        router.refresh()
      }
    })
    return () => {
      cancelled = true
    }
  }, [nextPath, router, supabase])

  const redirectTo = (path: string) =>
    `${window.location.origin}/auth/callback?next=${encodeURIComponent(path)}`

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setNotice(null)

    if (mode === 'signin') {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        setError(signInError.message)
        setLoading(false)
        return
      }
      router.replace(nextPath)
      router.refresh()
      return
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectTo(nextPath) },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.session) {
      router.replace(nextPath)
      router.refresh()
      return
    }

    setNotice('Account created. Check your inbox to confirm your email, then sign in.')
    setMode('signin')
    setLoading(false)
  }

  const handlePasswordReset = async () => {
    if (!email) {
      setError('Enter your email address first, then choose "Forgot password".')
      return
    }
    setError(null)
    setNotice(null)
    setLoading(true)
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo('/'),
    })
    setLoading(false)
    if (resetError) setError(resetError.message)
    else setNotice('Password reset link sent. Check your inbox.')
  }

  const handleGoogleLogin = async () => {
    setError(null)
    setNotice(null)
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectTo(nextPath) },
    })
    if (oauthError) setError(oauthError.message)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <Link href="/" className="flex justify-center">
            <Image
              src="/logo.png"
              alt="Coal City Games logo"
              width={64}
              height={64}
              className="w-16 h-16 rounded-2xl object-cover"
              priority
            />
          </Link>
          <h1 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-ink">
            {mode === 'signin' ? 'Sign in to your account' : 'Create your account'}
          </h1>
          <p className="mt-2 text-center text-sm text-text-muted">
            {mode === 'signin'
              ? 'Follow your teams and manage your tournaments.'
              : 'Free to create — no card required.'}
          </p>
        </div>

        <div className="cc-card p-6 sm:p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                {error}
              </p>
            )}
            {notice && (
              <p className="rounded-md border border-enugu-green/30 bg-enugu-green/10 px-3 py-2 text-sm text-enugu-green">
                {notice}
              </p>
            )}

            <div className="space-y-3">
              <div>
                <label htmlFor="email-address" className="mb-1 block text-sm font-semibold text-ink uppercase tracking-wide">
                  Email address
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full rounded-lg border border-hairline bg-surface-elevated px-3 py-2 text-text placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none sm:text-sm transition-colors"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-semibold text-ink uppercase tracking-wide">
                    Password
                  </label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={handlePasswordReset}
                      disabled={loading}
                      className="text-xs font-semibold text-primary hover:text-primary-strong disabled:opacity-60"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  required
                  minLength={6}
                  className="block w-full rounded-lg border border-hairline bg-surface-elevated px-3 py-2 text-text placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none sm:text-sm transition-colors"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-enugu-blue px-3 py-2.5 text-sm font-semibold text-text hover:bg-enugu-blue/90 disabled:opacity-60 transition-colors"
            >
              {loading
                ? 'Please wait...'
                : mode === 'signin'
                  ? 'Sign in with Email'
                  : 'Create account'}
            </button>
          </form>
            <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-hairline" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-surface-elevated px-2 text-text-muted">Or continue with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="mt-6 flex w-full items-center justify-center gap-3 rounded-lg border border-hairline bg-surface-elevated px-3 py-2.5 text-sm font-semibold text-ink hover:bg-surface-sunken disabled:opacity-60 transition-colors"
            >
              <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
                <path
                  d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"
                  fill="#EA4335"
                />
                <path
                  d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
                  fill="#4285F4"
                />
                <path
                  d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z"
                  fill="#FBBC05"
                />
                <path
                  d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.26538 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z"
                  fill="#34A853"
                />
              </svg>
              <span className="text-sm font-semibold leading-6">Google</span>
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-text-muted">
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin')
                setError(null)
                setNotice(null)
              }}
              className="font-semibold text-primary hover:text-primary-strong"
            >
              {mode === 'signin' ? 'Create one' : 'Sign in'}
            </button>
          </p>
        </div>

        <p className="text-center text-xs text-text-muted">
          By continuing you agree to follow tournament rules and the code of conduct.
        </p>
      </div>
    </div>
  )
}