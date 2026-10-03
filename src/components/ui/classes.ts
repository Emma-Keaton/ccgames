/**
 * Shared class strings for the daylight kit.
 *
 * Components should reach for these instead of retyping Tailwind chains, so a
 * palette change lands in one place. The heavy lifting lives in `cc-kit.css`
 * (`@layer components`); these constants only cover the utility-level tweaks
 * that the CSS layer cannot express.
 */

/** Page shell: full-height canvas + safe bottom padding for fixed CTAs. */
export const PAGE_SHELL = 'min-h-dvh bg-surface text-text pb-24'

/** Container width for broadcast-data pages. */
export const PAGE = 'cc-page'

/** Container width for forms/admin pages. */
export const PAGE_NARROW = 'cc-page cc-page--narrow'

/** Grid for card galleries: 1 → 2 → 3 → 4 columns. */
export const CARD_GRID = 'grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'

/** Two-column card grid (wider cards). */
export const CARD_GRID_2 = 'grid grid-cols-1 gap-5 md:grid-cols-2'

/** Filter/search toolbar above a list. */
export const TOOLBAR = 'cc-card flex flex-col gap-3 p-4 lg:flex-row lg:items-center'

export const FIELD = 'cc-input'
export const SELECT = 'cc-select'
export const TEXTAREA = 'cc-textarea'
export const LABEL = 'cc-label'
export const HINT = 'cc-hint'
export const ERROR = 'cc-error'
export const CHECK = 'cc-check'

export const TABLE_SHELL = 'cc-table-shell'
export const TABLE_SCROLL = 'cc-table-scroll'
export const TABLE = 'cc-table'
export const THEAD = 'cc-thead'
export const TH = 'cc-th'
export const TD = 'cc-td'
export const TR = 'cc-tr'

export const NUM = 'cc-num'
export const SCORE = 'cc-score'
export const SCOREBOARD = 'cc-scoreboard'
export const RANK = 'cc-rank'

export const EMPTY = 'cc-empty'
export const STAT = 'cc-stat'
export const STAT_LABEL = 'cc-stat-label'
export const STAT_VALUE = 'cc-stat-value'
export const SKELETON = 'cc-skeleton'
export const SPINNER = 'cc-spinner'

export const SCRIM = 'cc-scrim'
export const MODAL = 'cc-modal'

export const SCROLL_X = 'cc-scroll-x'
export const DIVIDER = 'cc-divider'
export const HEADER = 'cc-header'
export const EYEBROW = 'cc-eyebrow'
export const TITLE = 'cc-title'
export const LEDE = 'cc-lede'
export const SECTION_TITLE = 'cc-section-title'
