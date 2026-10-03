import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f172a] px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-border-subtle bg-[#1e293b] p-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">
          404
        </p>
        <h1 className="mt-2 text-2xl font-bold text-text">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          Could not find the requested resource.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary"
        >
          Return Home
        </Link>
      </div>
    </div>
  )
}
