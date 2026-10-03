'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import type { StandingsRow } from '@/lib/competitions-standings'

interface StandingsTableProps {
  rows: StandingsRow[]
}

// DESIGN.md §1 - "the signature motion is the position table: when a team or
// athlete changes position in a race or leaderboard, their name plate physically
// glides to the new row instead of snapping - the table becomes a live
// standings board."
//
// Implemented with a FLIP animation (First, Last, Invert, Play):
//
//   First  - the previous offsetTop of every row is kept in a ref.
//   Last   - after commit we measure the new offsetTop of every row.
//   Invert - we apply `translateY(prev - next)` with the transition OFF, so
//            the row is visually back where it started.
//   Play   - on the next frame we drop the transform and enable the
//            transition, so the row glides to its new row.
//
// Notes for whoever edits this next:
//
//  1. Row offsets must be *measured*, never hardcoded. Team names wrap to two
//     lines on narrow viewports, so a fixed px offset drifts out of alignment.
//  2. The layout effect below depends on `rows` and is the only one that
//     writes `prevTops`. It measures, inverts, then plays. Do not add a second
//     effect keyed on `rows` that also writes that ref, or the "First" baseline
//     gets clobbered with the positions we are animating away from.
//  3. `playing` gates the transition class. There is deliberately no "mounted"
//     flag: the Invert phase runs with the transition off, so the first paint
//     can never animate by accident.
//  4. `prefers-reduced-motion` is honoured by suppressing the transition. Rows
//     still jump to their new positions - correct, just not animated.
//  5. It stays a real <table>: header/row/cell semantics are intact for screen
//     readers, and with CSS disabled it is an ordinary standings table.

export function StandingsTable({ rows }: StandingsTableProps) {
  const rowRefs = useRef(new Map<string, HTMLTableRowElement>())
  const prevTops = useRef(new Map<string, number>())
  // `deltas` is the Invert step (row pinned at its old offset, transition off).
  // `playing` is the Play step (transform released, transition on). Keeping the
  // two separate lets the browser paint one frame with the row in its old place
  // before it starts gliding, which is what makes the motion read as movement
  // rather than a jump cut.
  const [deltas, setDeltas] = useState<Record<string, number>>({})
  const [playing, setPlaying] = useState(false)

  useLayoutEffect(() => {
    const next: Record<string, number> = {}
    const moved: Record<string, number> = {}
    let anyMoved = false

    for (const row of rows) {
      const el = rowRefs.current.get(row.id)
      if (!el) continue
      next[row.id] = el.offsetTop
      const prev = prevTops.current.get(row.id)
      if (prev !== undefined && prev !== el.offsetTop) {
        moved[row.id] = prev - el.offsetTop
        anyMoved = true
      }
    }

    // Baseline for the next update, pruned to the current row set so the map
    // cannot grow without bound as teams are added and removed.
    prevTops.current = new Map(Object.entries(next))

    // Nothing moved. `deltas` is already `{}` at this point - either we never
    // animated, or the Play phase already cleared it - so there is deliberately
    // no `setDeltas({})` here. Calling it would be a synchronous setState inside
    // an effect, which is a needless re-render on every standings refresh that
    // did not change the order.
    if (!anyMoved) return

    // Every state change below is deferred by a frame rather than applied
    // synchronously inside this effect, which keeps the measure/invert/play
    // phases as distinct paints and avoids the cascading-render warning.
    const pending = { invert: 0, play: 0 }
    let settle: ReturnType<typeof setTimeout>

    pending.invert = requestAnimationFrame(() => {
      // Invert: pin every moved row at its previous offset, transition off.
      setDeltas(moved)
      pending.play = requestAnimationFrame(() => {
        // Play: release the transform with the transition now enabled.
        setPlaying(true)
        setDeltas({})
        // Drop the transition class once the glide is over, so a table sitting
        // still is not carrying a compositing layer.
        settle = setTimeout(() => setPlaying(false), 220)
      })
    })

    return () => {
      cancelAnimationFrame(pending.invert)
      cancelAnimationFrame(pending.play)
      clearTimeout(settle)
    }
  }, [rows])

  if (rows.length === 0) {
    return (
      <div className="cc-empty">
        <p className="text-base font-semibold text-text">No teams assigned to this group yet.</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-text-muted">Standings appear here once teams are assigned.</p>
      </div>
    )
  }

  return (
    <div className="cc-table-shell">
      <div className="cc-table-scroll">
      <table className="cc-table">
        <thead className="cc-thead">
          <tr>
            <th scope="col" className="cc-th cc-num">#</th>
            <th scope="col" className="cc-th">Team</th>
            <th scope="col" className="cc-th cc-num text-center">P</th>
            <th scope="col" className="cc-th cc-num text-center">W</th>
            <th scope="col" className="cc-th cc-num text-center">D</th>
            <th scope="col" className="cc-th cc-num text-center">L</th>
            <th scope="col" className="cc-th cc-num text-center">GD</th>
            <th scope="col" className="cc-th cc-num text-right">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t, index) => {
            const delta = deltas[t.id]
            return (
              <tr
                key={t.id}
                ref={(el) => {
                  if (el) rowRefs.current.set(t.id, el)
                  else rowRefs.current.delete(t.id)
                }}
                style={delta ? { transform: `translateY(${delta}px)` } : undefined}
                className={[
                  'cc-tr',
                  index < 2 ? 'border-l-4 border-primary' : '',
                  // `playing` alone gates this, NOT `delta && playing`: the Play
                  // phase is precisely the frame where the transform has been
                  // released, so keying the class off `delta` would find it
                  // already undefined and the glide would jump instead.
                  // Invert phase => `playing` is false => transition off.
                  // Play phase   => `playing` is true  => transition on.
                  playing
                    ? 'transition-transform duration-200 ease-out motion-reduce:transition-none'
                    : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <td className="cc-td cc-num font-semibold">{index + 1}</td>
                <td className="cc-td">{t.name}</td>
                <td className="cc-td cc-num text-center">{t.played}</td>
                <td className="cc-td cc-num text-center">{t.won}</td>
                <td className="cc-td cc-num text-center">{t.drawn}</td>
                <td className="cc-td cc-num text-center">{t.lost}</td>
                <td className="cc-td cc-num text-center">{t.gd > 0 ? `+${t.gd}` : t.gd}</td>
                <td className="cc-td cc-num text-right font-bold text-lg text-primary">{t.points}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      </div>
    </div>
  )
}
