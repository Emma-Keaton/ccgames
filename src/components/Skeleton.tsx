import Image from 'next/image'

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`cc-skeleton ${className}`} />
  )
}

export function BrandedLoader({ message = 'Loading…' }: { message?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface text-text">
      <Image
        src="/logo-compressed.jpeg"
        alt="Coal City Games"
        width={72}
        height={72}
        className="h-16 w-16 rounded-2xl object-cover"
        priority
      />
      <div className="cc-spinner"></div>
      <p role="status" className="text-sm text-text-muted">{message}</p>
    </div>
  )
}

export function MatchCardSkeleton() {
  return (
    <div className="cc-card p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between border border-border-subtle">
      <div className="flex items-center justify-between w-full sm:w-auto flex-1 gap-4">
        <div className="flex items-center gap-3 sm:gap-4 flex-1">
          <Skeleton className="w-8 h-8 sm:w-10 sm:h-10 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex flex-col items-center px-4 sm:px-8 shrink-0">
          <Skeleton className="h-6 w-16 mb-1" />
          <Skeleton className="h-3 w-12" />
        </div>
        <div className="flex items-center gap-3 sm:gap-4 flex-1 justify-end">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="w-8 h-8 sm:w-10 sm:h-10 rounded-full" />
        </div>
      </div>
    </div>
  )
}

export function TeamCardSkeleton() {
  return (
    <div className="cc-card overflow-hidden border border-border-subtle shadow-cc h-full flex flex-col">
      <Skeleton className="h-24 w-full rounded-none" />
      <div className="p-5 flex-1 flex flex-col">
        <Skeleton className="h-5 w-3/4 mb-2" />
        <div className="flex items-center gap-2 mt-auto pt-4">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  )
}

export function InsightCardSkeleton() {
  return (
    <div className="snap-center shrink-0 w-72 sm:w-80 cc-card overflow-hidden border border-border-subtle">
      <Skeleton className="h-48 rounded-none" />
      <div className="p-6">
        <Skeleton className="h-3 w-20 mb-2" />
        <Skeleton className="h-5 w-3/4 mb-2" />
        <Skeleton className="h-3 w-full" />
      </div>
    </div>
  )
}

export function HomePageSkeleton() {
  return (
    <div className="min-h-screen bg-surface text-text pb-32">
      <div className="pt-16">
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
          <div className="text-center space-y-4 mb-4">
            <Skeleton className="h-12 w-64 mx-auto" />
            <Skeleton className="h-5 w-96 mx-auto" />
          </div>

          <section>
            <Skeleton className="h-7 w-48 mb-6" />
            <div className="space-y-4">
              <MatchCardSkeleton />
              <MatchCardSkeleton />
            </div>
          </section>

          <section>
            <Skeleton className="h-7 w-40 mb-6" />
            <div className="flex overflow-x-auto gap-6 pb-4">
              <InsightCardSkeleton />
              <InsightCardSkeleton />
              <InsightCardSkeleton />
            </div>
          </section>

          <section className="cc-card p-8 sm:p-12">
            <Skeleton className="h-8 w-64 mx-auto mb-4" />
            <Skeleton className="h-5 w-96 mx-auto mb-8" />
            <Skeleton className="h-12 w-48 mx-auto rounded-full" />
          </section>

          <section>
            <Skeleton className="h-7 w-44 mb-6" />
            <div className="space-y-4">
              <MatchCardSkeleton />
              <MatchCardSkeleton />
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

export function TeamsPageSkeleton() {
  return (
    <div className="min-h-screen bg-surface text-text pb-32">
      <div className="pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <header className="mb-8 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <Skeleton className="h-12 w-64 mb-2" />
            <Skeleton className="h-5 w-80" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-20" />
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <TeamCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}

export function TeamDetailSkeleton() {
  return (
    <div className="min-h-screen bg-surface text-text pb-32">
      <div className="border-b border-border-subtle bg-surface-elevated pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 flex flex-col md:flex-row items-center gap-8">
          <Skeleton className="w-32 h-32 md:w-40 md:h-40 rounded-full" />
          <div className="text-center md:text-left">
            <Skeleton className="h-4 w-24 mb-2 mx-auto md:mx-0" />
            <Skeleton className="h-12 w-64 mb-2 mx-auto md:mx-0" />
            <Skeleton className="h-4 w-32 mx-auto md:mx-0" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-8">
            <div className="bg-[#1e293b] rounded-xl p-6 border border-border-subtle">
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex flex-col">
                    <Skeleton className="h-3 w-20 mb-1" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[#1e293b] rounded-xl p-6 border border-border-subtle">
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-24" />
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-[#1e293b] rounded-xl p-6 border border-border-subtle">
              <Skeleton className="h-6 w-48 mb-6" />
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function MatchCenterSkeleton() {
  return (
    <div className="min-h-screen bg-surface text-text pb-32 flex flex-col items-center justify-center">
      <div className="text-center flex flex-col items-center">
        <Image
          src="/logo-compressed.jpeg"
          alt="Coal City Games"
          width={64}
          height={64}
          className="w-14 h-14 rounded-2xl object-cover animate-pulse mb-4"
        />
        <div className="animate-spin w-8 h-8 border-2 border-primary/40 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-text-muted">Loading Match Data...</p>
      </div>
    </div>
  )
}

export function MatchCenterFullSkeleton() {
  return (
    <div className="min-h-screen bg-surface text-text pb-32">
      <div className="pt-16 bg-[#1e293b] border-b border-border-subtle shadow-cc-lg">
        <div className="max-w-7xl mx-auto px-4 py-10 sm:py-16">
          <div className="text-center mb-8">
            <Skeleton className="h-8 w-32 mx-auto" />
          </div>

          <div className="flex items-center justify-between md:justify-center md:gap-24 max-w-4xl mx-auto">
            <div className="flex flex-col items-center gap-4 flex-1">
              <Skeleton className="w-20 h-20 sm:w-32 sm:h-32 rounded-full" />
              <Skeleton className="h-5 w-32" />
            </div>
            <div className="flex flex-col items-center shrink-0">
              <Skeleton className="h-16 sm:h-20 w-32" />
            </div>
            <div className="flex flex-col items-center gap-4 flex-1">
              <Skeleton className="w-20 h-20 sm:w-32 sm:h-32 rounded-full" />
              <Skeleton className="h-5 w-32" />
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 mt-8 flex gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-24" />
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-[#1e293b] rounded-xl p-6 border border-border-subtle">
          <Skeleton className="h-20 w-full" />
        </div>
        <div className="bg-[#1e293b] rounded-xl p-6 border border-border-subtle">
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function LoginSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="h-16 w-16 rounded-2xl" />
          <Skeleton className="h-7 w-56" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  )
}

export function AdminSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-surface-elevated shadow-sm px-6 py-4 flex justify-between items-center mb-8">
        <Skeleton className="h-6 w-48 bg-gray-200" />
        <Skeleton className="h-6 w-20 bg-gray-200" />
      </div>
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-8">
          <div className="bg-surface-elevated p-6 rounded-lg border border-gray-200">
            <Skeleton className="h-6 w-40 mb-4 bg-gray-200" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full bg-gray-200" />
              ))}
            </div>
          </div>
        </div>
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-surface-elevated p-6 rounded-lg border border-gray-200">
            <Skeleton className="h-6 w-40 mb-4 bg-gray-200" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full bg-gray-200" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function AdminMatchSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-surface-elevated border-b px-6 py-4 flex items-center justify-between">
        <Skeleton className="h-6 w-56 bg-gray-200" />
        <Skeleton className="h-10 w-40 bg-gray-200" />
      </div>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <div className="bg-surface-elevated rounded-xl p-6 border border-gray-200">
          <div className="flex justify-between items-center gap-6">
            <Skeleton className="h-8 w-40 bg-gray-200" />
            <Skeleton className="h-16 w-40 bg-gray-200" />
            <Skeleton className="h-8 w-40 bg-gray-200" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-surface-elevated rounded-xl p-6 border border-gray-200 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full bg-gray-200" />
            ))}
          </div>
          <div className="bg-surface-elevated rounded-xl p-6 border border-gray-200 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full bg-gray-200" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function CompetitionsSkeleton() {
  return (
    <div className="min-h-screen bg-surface text-text pb-32">
      <div className="pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <header className="mb-10 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <Skeleton className="h-12 w-48 mb-2" />
            <Skeleton className="h-5 w-40" />
          </div>
        </header>

        <div className="flex gap-2 border-b border-border-subtle pb-1 mb-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-24" />
          ))}
        </div>

        <div className="space-y-8">
          <section>
            <Skeleton className="h-7 w-40 mb-6" />
            <div className="grid gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <MatchCardSkeleton key={i} />
              ))}
            </div>
          </section>

          <section>
            <Skeleton className="h-7 w-44 mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="cc-card p-5 border border-border-subtle">
                  <Skeleton className="h-5 w-24 mb-4" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
