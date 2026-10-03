'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { EmptyState } from '@/components/ui/feedback'

/** Public team card shape (subset of `teams` used by the explorer). */
export interface TeamRow {
  id: string
  name: string
  short_name: string | null
  attire_color: string | null
  category: string | null
  team_type: string | null
  group_name: string | null
}

const FIELD_CLASSES = 'cc-input'

const sortValues = (values: string[]) => values.sort((a, b) => a.localeCompare(b))

const collectValues = (teams: TeamRow[], pick: (team: TeamRow) => string | null) =>
  sortValues(
    Array.from(
      new Set(
        teams
          .map(pick)
          .filter((value): value is string => Boolean(value && value.trim().length > 0))
      )
    )
  )

export function TeamsExplorer({ teams }: { teams: TeamRow[] }) {
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [groupFilter, setGroupFilter] = useState('all')

  const categoryOptions = useMemo(() => collectValues(teams, (team) => team.category), [teams])
  const typeOptions = useMemo(() => collectValues(teams, (team) => team.team_type), [teams])
  const groupOptions = useMemo(() => collectValues(teams, (team) => team.group_name), [teams])

  const filteredTeams = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return teams.filter((team) => {
      if (categoryFilter !== 'all' && (team.category ?? '') !== categoryFilter) return false
      if (typeFilter !== 'all' && (team.team_type ?? '') !== typeFilter) return false
      if (groupFilter !== 'all' && (team.group_name ?? '') !== groupFilter) return false
      if (!needle) return true
      return team.name.toLowerCase().includes(needle) || (team.short_name ?? '').toLowerCase().includes(needle)
    })
  }, [categoryFilter, groupFilter, query, teams, typeFilter])

  const filtersActive = query.trim().length > 0 || categoryFilter !== 'all' || typeFilter !== 'all' || groupFilter !== 'all'

  const clearFilters = () => {
    setQuery('')
    setCategoryFilter('all')
    setTypeFilter('all')
    setGroupFilter('all')
  }

  return (
    <div className="space-y-8">
      <div className="cc-card p-4 sm:p-6 flex flex-col xl:flex-row xl:items-center gap-4">
        <div className="relative flex-1">
          <svg
            className="w-4 h-4 text-text-muted absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
            fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search teams by name or short name..."
            aria-label="Search teams by name or short name"
            className={`${FIELD_CLASSES} w-full pl-10 pr-4`}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            aria-label="Filter teams by category"
            className={`${FIELD_CLASSES} px-4`}
          >
            <option value="all">All categories</option>
            {categoryOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            aria-label="Filter teams by type"
            className={`${FIELD_CLASSES} px-4`}
          >
            <option value="all">All types</option>
            {typeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          {groupOptions.length > 0 ? (
            <select
              value={groupFilter}
              onChange={(event) => setGroupFilter(event.target.value)}
              aria-label="Filter teams by group"
              className={`${FIELD_CLASSES} px-4`}
            >
              <option value="all">All groups</option>
              {groupOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-text-muted">
          Showing <span className="text-text font-semibold">{filteredTeams.length}</span> of {teams.length}{' '}
          {teams.length === 1 ? 'team' : 'teams'}
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

      {filteredTeams.length === 0 ? (
        <EmptyState
          title={teams.length === 0 ? 'No teams found.' : 'No teams match your filters.'}
          hint={teams.length === 0 ? 'Admins must register teams in the dashboard first.' : 'Try a different search term or clear the filters.'}
          action={filtersActive ? (
            <button type="button" onClick={clearFilters} className="cc-btn cc-btn--ghost cc-btn--sm hover:text-primary">
              Clear filters
            </button>
          ) : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTeams.map((team) => (
            <Link href={`/team/${team.id}`} key={team.id} className="block h-full rounded-xl focus-visible:outline-2 focus-visible:outline-primary">
              <div className="cc-card cc-card--interactive group flex h-full flex-col overflow-hidden">
                <div className="relative flex h-24 w-full items-center justify-center overflow-hidden bg-surface-sunken">
                  <span className="text-2xl font-black text-text-muted">{team.short_name}</span>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h2 className="font-bold text-xl mb-1 group-hover:text-primary transition-colors">{team.name}</h2>
                  <div className="flex flex-wrap items-center gap-2 mt-auto pt-4">
                    <span className="text-xs font-medium bg-surface-sunken text-text-muted px-2 py-1 rounded">
                      {team.category || 'Male'}
                    </span>
                    <span className="text-xs font-medium bg-surface-sunken text-text-muted px-2 py-1 rounded">
                      {team.team_type || 'Football'}
                    </span>
                    {team.group_name ? (
                      <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded">
                        {team.group_name}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
