/**
 * Tournament programme info shown to fans.
 *
 * Orchestrators handle registration off-app. App admins register teams
 * directly in /admin; fans see fixtures, teams, medals and news.
 */

export interface TournamentRegistrationSettings {
  registration_open?: boolean
  registration_deadline?: string | null
  eligibility?: string | null
  team_size_limit?: string | null
  entry_fee?: string | null
  registration_rules?: string | null
}

export interface RegistrationTarget {
  id?: string | null
  name?: string | null
  slug?: string | null
  edition?: string | null
  venue_city?: string | null
  start_date?: string | null
  end_date?: string | null
  settings?: TournamentRegistrationSettings | null
}

