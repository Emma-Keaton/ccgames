/* eslint-disable @next/next/no-img-element */
'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { EmptyState } from '@/components/ui/feedback'

/**
 * Public news feed item. Mirrors the PostgREST projection used by `/news`
 * (`tournament_posts` + embedded `tournaments`). Type-only exported so server
 * pages can reuse the shape without pulling this client bundle across the
 * boundary.
 */
export interface NewsPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  category: string | null
  image_url: string | null
  published_at: string | null
  tournament_id: string | null
  tournaments: { name: string; slug: string } | null
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/**
 * Deterministic (UTC, no Intl) date label so the pre-render and the hydration
 * pass always produce identical markup.
 */
const formatPostDate = (value: string | null) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`
}

const FIELD_CLASSES = 'cc-input'

export function NewsList({ posts }: { posts: NewsPost[] }) {
  const [query, setQuery] = useState('')
  const [tournamentFilter, setTournamentFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const tournamentOptions = useMemo(() => {
    const seen = new Map<string, string>()
    posts.forEach((post) => {
      if (post.tournaments) seen.set(post.tournaments.slug, post.tournaments.name)
    })
    return Array.from(seen, ([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label))
  }, [posts])

  const categoryOptions = useMemo(() => {
    const seen = new Set<string>()
    posts.forEach((post) => {
      if (post.category) seen.add(post.category)
    })
    return Array.from(seen).sort((a, b) => a.localeCompare(b))
  }, [posts])

  const filteredPosts = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return posts.filter((post) => {
      if (tournamentFilter !== 'all' && post.tournaments?.slug !== tournamentFilter) return false
      if (categoryFilter !== 'all' && post.category !== categoryFilter) return false
      if (!needle) return true
      return post.title.toLowerCase().includes(needle) || (post.excerpt ?? '').toLowerCase().includes(needle)
    })
  }, [categoryFilter, posts, query, tournamentFilter])

  const filtersActive = query.trim().length > 0 || tournamentFilter !== 'all' || categoryFilter !== 'all'

  const clearFilters = () => {
    setQuery('')
    setTournamentFilter('all')
    setCategoryFilter('all')
  }

  return (
    <div className="space-y-8">
      <div className="cc-card p-4 sm:p-6 flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="relative flex-1">
          <svg
            className="w-4 h-4 text-text-muted absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search articles..."
            aria-label="Search articles by title or excerpt"
            className={`${FIELD_CLASSES} w-full pl-10 pr-4`}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={tournamentFilter}
            onChange={(event) => setTournamentFilter(event.target.value)}
            aria-label="Filter articles by tournament"
            className={`${FIELD_CLASSES} px-4`}
          >
            <option value="all">All tournaments</option>
            {tournamentOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            aria-label="Filter articles by category"
            className={`${FIELD_CLASSES} px-4`}
          >
            <option value="all">All categories</option>
            {categoryOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-text-muted">
          Showing <span className="text-text font-semibold">{filteredPosts.length}</span> of {posts.length}{' '}
          {posts.length === 1 ? 'article' : 'articles'}
        </p>
        {filtersActive ? (
          <button
            type="button"
            onClick={clearFilters}
            className="text-sm font-medium text-primary hover:text-primary-strong transition-colors"
          >
            Clear filters
          </button>
        ) : null}
      </div>

      {filteredPosts.length === 0 ? (
        <EmptyState
          title={posts.length === 0 ? 'No articles have been published yet.' : 'No articles match your filters.'}
          hint={posts.length === 0 ? 'Check back soon for tournament coverage.' : 'Try a different search term or clear the filters.'}
          action={filtersActive ? (
            <button type="button" onClick={clearFilters} className="cc-btn cc-btn--ghost cc-btn--sm hover:text-primary">
              Clear filters
            </button>
          ) : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <Link key={post.id} href={`/news/${post.slug}`} className="block h-full rounded-xl focus-visible:outline-2 focus-visible:outline-primary">
              <article className="cc-card cc-card--interactive group flex h-full flex-col overflow-hidden">
                <div className="h-44 w-full bg-surface-sunken relative overflow-hidden">
                  {post.image_url ? (
                    <img
                      src={post.image_url}
                      alt={post.title}
                      width={640}
                      height={360}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 via-primary/10 to-transparent">
                      <span className="text-xs uppercase tracking-widest text-primary/50 px-4 text-center">
                        {post.category ?? 'Coal City Games'}
                      </span>
                    </div>
                  )}
                  {post.category ? (
                    <span className="absolute top-3 left-3 text-xs font-semibold bg-primary/90 text-white px-2 py-1 rounded">
                      {post.category}
                    </span>
                  ) : null}
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <h2 className="font-bold text-lg mb-2 line-clamp-2 text-text group-hover:text-primary transition-colors">
                    {post.title}
                  </h2>
                  {post.excerpt ? <p className="text-text-muted text-sm line-clamp-3">{post.excerpt}</p> : null}
                  <div className="mt-auto pt-4 flex items-center justify-between gap-3 text-xs text-text-muted">
                    <span className="truncate">{post.tournaments?.name ?? 'Coal City Games'}</span>
                    <span className="shrink-0">{formatPostDate(post.published_at)}</span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}