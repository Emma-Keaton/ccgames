'use client'

import { useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react'

/**
 * Shared admin form primitives.
 *
 * Extracted so the dashboard, tournament manager, posts editor and live match
 * manager all render identical inputs (one place to fix a11y/labels/branding)
 * and so each page file stays small enough to review.
 */

export const adminInputClass =
  'cc-input text-sm'
export const adminLabelClass =
  'cc-label'
export const adminPrimaryButton =
  'cc-btn cc-btn--primary cc-btn--sm'
export const adminSubtleButton =
  'cc-btn cc-btn--secondary cc-btn--sm'
export const adminDangerButton =
  'cc-btn cc-btn--danger cc-btn--sm'

export interface Tournament {
  id: string
  name: string
  slug: string
  edition: string | null
  venue_city?: string | null
  start_date?: string | null
  end_date?: string | null
  status: string
  is_active: boolean
  settings?: Record<string, unknown> | null
}

export interface Team {
  id: string
  name: string
  short_name: string | null
  coach: string | null
  attire_color: string | null
  roster: string | null
  medical_staff: string | null
  tactical_coach: string | null
  assistant_coach: string | null
  kit_personnel: string | null
  category: string | null
  team_type: string | null
  group_name: string | null
  tournament_id: string | null
}

export interface Fixture {
  id: string
  match_date: string
  venue: string | null
  status: string
  home_score: number | null
  away_score: number | null
  current_minute: number | null
  stage: string | null
  tournament_id: string | null
  home_team: { name: string } | null
  away_team: { name: string } | null
}

export const CATEGORY_OPTIONS = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'mixed', label: 'Mixed' },
  { value: 'open', label: 'Open' },
]

/**
 * `teams.team_type` is a display discipline only (the fixture's scoring
 * comes from `fixtures.sport_id` → the 39-sport catalogue). It starts
 * empty on the client and is filled once from `public.sports` by
 * `useSportOptions()` — no hardcoded list lives here anymore.
 */
export interface SportOption {
  value: string
  label: string
}

export const SPORT_OPTIONS_FALLBACK: SportOption[] = [
  { value: 'Football', label: 'Football' },
]

export function useSportOptions(sports: { code: string; name: string }[] | null | undefined): SportOption[] {
  if (!sports || sports.length === 0) return SPORT_OPTIONS_FALLBACK
  return sports.map((sport) => ({ value: sport.name, label: sport.name }))
}

export const ATTIRE_OPTIONS = [
  'Yet to be decided',
  'Red',
  'Blue',
  'White',
  'Black',
  'Green',
  'Yellow',
].map((colour) => ({ value: colour, label: colour }))

export const STAGE_OPTIONS = [
  { value: 'group_stage', label: 'Group stage' },
  { value: 'round_of_16', label: 'Round of 16' },
  { value: 'quarter_final', label: 'Quarter final' },
  { value: 'semi_final', label: 'Semi final' },
  { value: 'third_place', label: 'Third place' },
  { value: 'final', label: 'Final' },
]

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className={adminLabelClass}>{label}</label>
      {children}
    </div>
  )
}

export function TextInput({
  value,
  onValueChange,
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
  value: string
  onValueChange: (value: string) => void
}) {
  return (
    <input
      {...rest}
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
      className={adminInputClass}
    />
  )
}

export function SelectInput({
  value,
  onValueChange,
  options,
  ...rest
}: Omit<SelectHTMLAttributes<HTMLSelectElement>, 'value' | 'onChange'> & {
  value: string
  onValueChange: (value: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <select
      {...rest}
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
      className={adminInputClass}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
}: {
  options: { id: string; name: string }[]
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const selected = options.find((option) => option.id === value)
  const filtered = options.filter((option) =>
    option.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((previous) => !previous)}
        className={adminInputClass + ' flex items-center justify-between text-left'}
      >
        <span className={selected ? 'text-text' : 'text-text-muted'}>
          {selected ? selected.name : placeholder}
        </span>
        <span aria-hidden="true" className="text-xs text-text-muted">
          ▼
        </span>
      </button>

      {open && (
        <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-border-subtle bg-surface-elevated shadow-cc-lg">
          <div className="sticky top-0 border-b border-border-subtle bg-surface-elevated p-2">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Type to search…"
              className="cc-input text-sm"
            />
          </div>
          {filtered.length === 0 ? (
            <p className="p-3 text-sm text-text-muted">No teams found</p>
          ) : (
            filtered.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  onChange(option.id)
                  setOpen(false)
                  setSearch('')
                }}
                className="block w-full px-3 py-2 text-left text-sm text-text hover:bg-surface-sunken"
              >
                {option.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

/** Reusable status banner for admin forms (success / error). */
export function StatusBanner({
  status,
}: {
  status: { kind: 'success' | 'error'; message: string } | null
}) {
  if (!status) return null
  return (
    <p
      role="status"
      className={
        'rounded-lg border px-4 py-3 text-sm ' +
        (status.kind === 'success'
          ? 'border-secondary/30 bg-emerald-500/10 text-secondary-strong'
          : 'border-danger/30 bg-danger/10 text-live')
      }
    >
      {status.message}
    </p>
  )
}

/** Small no-access panel reused by every /admin page. */
export function AccessPanel({
  title,
  body,
  href,
  linkLabel,
}: {
  title: string
  body: string
  href: string
  linkLabel: string
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 text-text">
      <div className="cc-card w-full max-w-md p-8 text-center">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-2 text-sm text-text-muted">{body}</p>
        <a
          href={href}
          className="cc-btn cc-btn--primary mt-6 inline-flex"
        >
          {linkLabel}
        </a>
      </div>
    </div>
  )
}