# Design System: Coal City Games — Enugu 2026
**Project:** `ccgames` — public tournament hub for the 23rd National Sports Festival
**Version:** 1.0 (supersedes the Coal City Games dark theme)

> This file is the source of truth for every screen. Anything built for this app
> must be describable in the language below. If a screen needs a new pattern,
> add it here first, then build it.

---

## 1. Visual Theme & Atmosphere

**"Festival daylight."** The interface is bright, civic and broadcast-like: a
near-white canvas (#F8F9FA) that lets the four brand ribbons carry the energy.
Cards are pure white with hairline borders rather than heavy drop shadows —
depth comes from a single whisper-soft shadow on raised surfaces and from the
colour of the ribbon on top of each card.

The atmosphere is *dense but never cluttered*: a national festival publishes
enormous amounts of data (20 sports, hundreds of fixtures, thousands of
athletes), so the design leans on strong vertical rhythm, compact tabular
numerals and a strict "one accent per card" rule. Where the old theme was a
single dark navy with one indigo accent, this system is *categorised colour*:
each sport family owns a ribbon colour, so a visitor scrolling a mixed schedule
can tell football from judo before reading a word.

Motion is purposeful and quick (150–260 ms, ease-out). The signature motion is
the **position table**: when a team or athlete changes position in a race or
leaderboard, their name plate physically glides to the new row instead of
snapping — the table becomes a live standings board.

---

## 2. Color Palette & Roles

### Brand ribbons (from the official logo)
| Descriptive name | Hex | Functional role |
| --- | --- | --- |
| **Athletic Royal Blue** | `#121F8F` | Primary anchor: top navigation, primary buttons, links, active tab underline. Highest contrast on white (WCAG AAA), so all interactive text uses it. |
| **Enugu Green** | `#6CB33F` | Secondary: "qualified", "in progress", positive deltas, **Team Sports** ribbon. |
| **Coal Amber** | `#F7A41E` | Highlight: gold medals, rank-1 plates, countdown, **Timed/Measured** ribbon. Never used as text on white. |
| **Festival Crimson** | `#D8232A` | Urgent: LIVE badges and pulse, errors, destructive actions, "closing soon", **Combat** ribbon. |
| **Coal Black** | `#141416` | Primary typography and the darkest surface in dark mode. |

### Neutrals
| Descriptive name | Hex | Role |
| --- | --- | --- |
| **Festival Paper** | `#F8F9FA` | App canvas. |
| **Pure Card** | `#FFFFFF` | Cards, tables, modals. |
| **Sunken Panel** | `#F1F3F5` | Table header strips, inset wells, skeleton blocks. |
| **Soft Graphite** | `#6B7280` | Secondary text, metadata, table sub-labels. |
| **Hairline** | `#E5E7EB` | 1px borders and dividers. |

### Sport-family ribbons (the "one accent per card" mapping)
| Family | Ribbon | Sports |
| --- | --- | --- |
| Combat & Martial Arts | Crimson `#D8232A` | Boxing, Judo, Taekwondo, Wrestling, MMA |
| Team Sports | Enugu Green `#6CB33F` | Football, Basketball (+wheelchair/3x3), Cricket |
| Racquet & Precision | Royal Blue `#121F8F` | Badminton, Table Tennis, Tennis, Darts |
| Timed, Measured & Judged | Coal Amber `#F7A41E` | Athletics, Swimming, Cycling, Canoeing, Gymnastics, Golf, Shooting, Weightlifting |

### Medal tokens
Gold `#F7A41E` on a 12% amber wash · Silver `#94A3B8` on an 12% slate wash ·
Bronze `#B45309` on a 12% bronze wash. Rank-1 plates are solid amber with white
numerals; rank 2–3 use tinted washes so only the leader shouts.

### Semantic tokens (must be used instead of raw hex in components)
`--role-primary`, `--role-primary-soft`, `--role-secondary`, `--role-accent`,
`--role-danger`, `--role-live`, `--role-surface`, `--role-surface-elevated`,
`--role-text`, `--role-text-muted`, `--role-border`. Dark mode re-points only
these, so components never change.

---

## 3. Typography Rules

**One family: Inter** (self-hosted woff2, already subset in `public/fonts/`).
A single family keeps 20 sports of data tables coherent and keeps the payload
tiny; personality comes from weight and numeric features, not from a second face.

| Use | Weight | Size / tracking |
| --- | --- | --- |
| Page title | 800 | 2.25–3rem, `-0.02em` tracking |
| Section heading | 700 | 1.25–1.5rem |
| Card title / team name | 600 | 1–1.125rem |
| Body | 400 | 0.875–1rem, `1.55` line-height |
| Metadata / venue / time | 500 | 0.75–0.875rem, `Soft Graphite` |
| Scoreline | 800 | `tabular-nums`, tighter tracking so digits never jitter |

**Numeric discipline:** every score, time, rank, distance and set count renders
with `font-variant-numeric: tabular-nums`. Live-updating numbers must never
change width. Sport codes and lane numbers use uppercase with `0.08em` tracking.

---

## 4. Component Stylings

* **Buttons — solid primary:** Athletic Royal Blue fill, white 600-weight label,
  gently curved corners (10px), no border. Hover deepens to `#0D1770`; focus
  draws a 2px royal-blue ring at 2px offset; disabled drops to 60% opacity.
* **Buttons — secondary / ghost:** white fill, hairline `#E5E7EB` stroke, Coal
  Black label. Hover fills with a 4% royal-blue wash.
* **Buttons — destructive:** Festival Crimson fill, white label. Never outline
  crimson on white (it fails contrast at small sizes).
* **Cards/Containers:** pure white, 1px hairline, generously rounded (12–16px),
  whisper-soft diffused shadow (`0 1px 2px rgba(20,20,22,.04), 0 8px 24px
  rgba(20,20,22,.05)`). Each card carries exactly **one** accent: a 3px ribbon on
  the leading edge in the sport-family colour, or a tinted header strip.
* **Position tables (the signature component):** see §6.
* **Live badge:** pill shape, crimson 10% wash, crimson uppercase 700 label at
  0.75rem with 0.08em tracking, preceded by a pulsing 8px dot (1.4s ease-in-out;
  animation removed under `prefers-reduced-motion`).
* **Score plates:** Coal Black 800 numerals on a sunken panel, tabular figures,
  `-0.02em` tracking; the winning side takes a 4% Enugu-green wash and a green
  left rule. Set-based sports render a row of small squares (won = solid amber,
  lost = hairline outline) so a five-set match reads at a glance.
* **Medal chips:** gold `#F7A41E` on a 12% amber wash with a hairline amber
  border; silver `#94A3B8`; bronze `#B45309`.
* **Inputs/Forms:** white field, hairline stroke, 8px radius, 0.5rem padding.
  Focus swaps the stroke to royal blue and adds a 3px royal-blue 18% ring. Labels
  sit above the field in 600-weight 0.75rem uppercase with 0.06em tracking —
  never placeholder-as-label.
* **Chips / filters:** pill-shaped, hairline stroke, `Soft Graphite` label; the
  active state becomes a solid royal-blue fill with a white label.
* **Empty states:** sunken panel, centred, one-line explanation, and (when
  actionable) a single ghost button. Never a bare "No data".

## 5. Layout Principles

* **Container:** max width 1280px (`max-w-7xl`) with 1rem mobile / 1.5rem tablet
  / 2rem desktop gutters. Admin surfaces are narrower (1024px) because they are
  forms, not broadcast data.
* **Sticky navigation:** 64px, white at 92% opacity with backdrop blur and a
  hairline bottom border. Public nav: Home · Sports · Schedule · Teams · News ·
  Medals · Guide. The sport-family ribbons never appear in the nav — it stays
  royal blue so the colour language keeps its meaning inside the content.
* **Vertical rhythm:** 4rem between page sections, 1.5rem between cards, 0.75rem
  inside dense table rows. Generous top padding (6rem) clears the fixed nav.
* **Mobile-first density:** every table degrades to a stacked "row card" under
  640px — position plate, name, then key figures right-aligned. Horizontal scroll
  is a last resort, only for genuine matrix data (a full league table).
* **Grid:** 1 col mobile → 2 col tablet → 3–4 col desktop for card galleries;
  12-col grid for dashboards. Next fixtures always render as a **list**, never a
  grid, because chronological reading order matters.

## 6. Signature Motion: the Animated Position Table

For any sport where **position or rank changes** — athletics, swimming, cycling
and canoeing (overtaking within a race), plus medal tables and group standings —
a competitor's name plate must **travel** to its new row rather than teleport.

**Technique:** FLIP (First, Last, Invert, Play) using the Web Animations API — no
animation library.

1. **First:** before the update, capture each row's bounding box keyed by runner
   id into a `Map`.
2. **Last:** after React paints the reordered list, read the new boxes.
3. **Invert:** for every row present in both captures apply
   `translateY(first.top - last.top)` with `transform-origin: top`.
4. **Play:** animate to `translateY(0)` over **240ms** with
   `cubic-bezier(0.22, 1, 0.36, 1)`. Entering the medal places also animates the
   rank plate colour.

**Rules**
* Only `transform` and `opacity` animate — never `top`, `height` or margin — so
  the browser stays on the compositor and 20 rows hold 60fps.
* Entry and exit must be resolved **before** measuring, otherwise entering rows
  offset the travelling ones. Leaving rows fade over 120ms, entering rows fade in.
* Under `prefers-reduced-motion: reduce` the reorder is instant and the changed
  rank plate flashes for 400ms instead.
* Positions stream in over Supabase Realtime, so a reorder can arrive mid-flight:
  cancel the in-flight animation for that row and re-measure from its current
  visual transform, so plates never snap back.
* The travelling plate shows a delta chevron (▲2 / ▼1) in Enugu Green or Festival
  Crimson for 3 seconds after a change, then fades.
