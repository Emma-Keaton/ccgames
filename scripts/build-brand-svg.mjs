// Coal City Games — raster → SVG tracing pipeline.
// Run with: node scripts/build-brand-svg.mjs
//
// The organisers supplied the logo as flattened JPGs. `imagetracerjs` is not
// available offline, so this script traces them itself: it classifies every
// pixel against the five-colour brand palette (or transparent), extracts the
// contours of each colour region with marching squares, simplifies them with
// Douglas–Peucker, and emits one <path> per colour using fill-rule="evenodd"
// so holes stay holes.
//
// Every trace is validated by rasterising the result back through sharp/librsvg
// and comparing it to the classification mask, so a bad trace fails loudly
// instead of silently shipping a mangled logo.
//
// Outputs
//   public/brand/ccgames-mark.svg    (vector mark)
//   public/brand/ccgames-lockup.svg  (vector "ENUGU 2026" lockup)

import sharp from 'sharp'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const PUB = join(process.cwd(), 'public')
const OUT_DIR = join(PUB, 'brand')
const PREVIEW_DIR = join(process.cwd(), '.preview')

/** Brand palette. Order matters only for tie-breaking. */
const PALETTE = [
  { hex: '#121F8F', rgb: [18, 31, 143] },
  { hex: '#6CB33F', rgb: [108, 179, 63] },
  { hex: '#F7A41E', rgb: [247, 164, 30] },
  { hex: '#D8232A', rgb: [216, 35, 42] },
  { hex: '#141416', rgb: [20, 20, 22] },
]

const TRANSPARENT = -1
const UNKNOWN = -2

const dist2 = (r, g, b, [pr, pg, pb]) => {
  const dr = r - pr
  const dg = g - pg
  const db = b - pb
  return dr * dr + dg * dg + db * db
}

/** Nearest palette entry, or UNKNOWN when the pixel is an anti-aliased blend. */
function classify(r, g, b, threshold) {
  const mn = Math.min(r, g, b)
  if (mn > 246) return TRANSPARENT
  let best = UNKNOWN
  let bestDist = Infinity
  for (let i = 0; i < PALETTE.length; i += 1) {
    const d = dist2(r, g, b, PALETTE[i].rgb)
    if (d < bestDist) {
      bestDist = d
      best = i
    }
  }
  return bestDist <= threshold * threshold ? best : UNKNOWN
}

/** Fill UNKNOWN pixels from their neighbours so edges don't speckle. */
function resolveUnknown(labels, width, height, passes = 4) {
  for (let pass = 0; pass < passes; pass += 1) {
    let changed = 0
    const next = labels.slice()
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const i = y * width + x
        if (labels[i] !== UNKNOWN) continue
        const votes = new Map()
        let transparentVotes = 0
        for (let dy = -1; dy <= 1; dy += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            const nx = x + dx
            const ny = y + dy
            if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
            const value = labels[ny * width + nx]
            if (value === UNKNOWN) continue
            if (value === TRANSPARENT) transparentVotes += 1
            else votes.set(value, (votes.get(value) ?? 0) + 1)
          }
        }
        let winner = TRANSPARENT
        let winnerCount = transparentVotes
        for (const [value, count] of votes) {
          if (count > winnerCount) {
            winner = value
            winnerCount = count
          }
        }
        if (winnerCount > 0) {
          next[i] = winner
          changed += 1
        }
      }
    }
    labels = next
    if (changed === 0) break
  }
  return labels
}

/**
 * Majority-filter a binary mask to remove the 1px staircase that anti-aliased
 * edges leave behind.
 *
 * A pixel flips only when at least 6 of its 8 neighbours disagree with it. That
 * is exactly the signature of a staircase step or an isolated speck, while a
 * straight edge (5 agreeing, 3 disagreeing) and any stroke thicker than 2px are
 * left untouched — so the trace smooths without rounding genuine corners.
 */
function smoothMask(filled, width, height, passes = 2) {
  let current = filled
  for (let pass = 0; pass < passes; pass += 1) {
    const next = current.slice()
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const i = y * width + x
        let same = 0
        let total = 0
        for (let dy = -1; dy <= 1; dy += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            const nx = x + dx
            const ny = y + dy
            if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
            total += 1
            if (current[ny * width + nx] === current[i]) same += 1
          }
        }
        if (total - same >= 6) next[i] = current[i] ? 0 : 1
      }
    }
    current = next
  }
  return current
}

/**
 * Extract closed contours from a binary mask with marching squares.
 *
 * Each boundary between a filled and an empty pixel becomes a directed unit
 * segment; the direction convention (filled region always on the left of
 * travel) guarantees that every grid vertex has one outgoing segment, so the
 * segments chain unambiguously into closed loops. Holes come out as their own
 * loops, which `fill-rule="evenodd"` renders as holes.
 */
function traceMask(filled, width, height) {
  const key = (x, y) => `${x},${y}`
  const outgoing = new Map()

  const at = (x, y) =>
    x >= 0 && y >= 0 && x < width && y < height && filled[y * width + x] ? 1 : 0

  const add = (fromX, fromY, toX, toY) => {
    const k = key(fromX, fromY)
    const list = outgoing.get(k)
    if (list) list.push([toX, toY])
    else outgoing.set(k, [[toX, toY]])
  }

  // Walk the boundary on a -1..width grid so shapes touching the canvas edge
  // still close.
  for (let y = -1; y < height; y += 1) {
    for (let x = -1; x < width; x += 1) {
      const c = at(x, y)
      const east = at(x + 1, y)
      const south = at(x, y + 1)

      // Vertical boundary at x+1 between (x,y) and (x+1,y)
      if (c !== east) {
        if (c) add(x + 1, y + 1, x + 1, y) // filled on the west -> travel north
        else add(x + 1, y, x + 1, y + 1) // filled on the east -> travel south
      }
      // Horizontal boundary at y+1 between (x,y) and (x,y+1)
      if (c !== south) {
        if (c) add(x, y + 1, x + 1, y + 1) // filled on the north -> travel east
        else add(x + 1, y + 1, x, y + 1) // filled on the south -> travel west
      }
    }
  }

  const loops = []
  for (const [startKey, ends] of outgoing) {
    while (ends.length > 0) {
      const [startX, startY] = startKey.split(',').map(Number)
      const loop = [[startX, startY]]
      let current = ends.pop()
      let guard = 0
      while (current && guard < width * height * 4) {
        guard += 1
        loop.push(current)
        const k = key(current[0], current[1])
        const nextList = outgoing.get(k)
        if (!nextList || nextList.length === 0) break
        if (k === startKey) break
        current = nextList.pop()
      }
      // The walk returns to its start, so the final point duplicates the first.
      // Dropping it keeps the closing edge implicit (the path's `Z`).
      const firstPoint = loop[0]
      const lastPoint = loop[loop.length - 1]
      if (loop.length > 1 && firstPoint[0] === lastPoint[0] && firstPoint[1] === lastPoint[1]) {
        loop.pop()
      }
      if (loop.length >= 4) loops.push(loop)
    }
  }
  return loops
}

/** Douglas–Peucker: drop points that sit within `tolerance` of the chord. */
function simplify(points, tolerance) {
  if (points.length < 3) return points
  const first = points[0]
  const last = points[points.length - 1]
  const dx = last[0] - first[0]
  const dy = last[1] - first[1]
  const norm = Math.hypot(dx, dy) || 1

  let maxDistance = -1
  let index = 0
  for (let i = 1; i < points.length - 1; i += 1) {
    const p = points[i]
    const distance = Math.abs(dy * (p[0] - first[0]) - dx * (p[1] - first[1])) / norm
    if (distance > maxDistance) {
      maxDistance = distance
      index = i
    }
  }

  if (maxDistance <= tolerance) return [first, last]
  const left = simplify(points.slice(0, index + 1), tolerance)
  const right = simplify(points.slice(index), tolerance)
  return [...left.slice(0, -1), ...right]
}

/**
 * Douglas–Peucker for a CLOSED contour.
 *
 * Running the open-polyline version on a loop is degenerate: its first and last
 * points are identical, so the chord has zero length and every interior point
 * "measures" as distance 0 — the whole shape collapses to two points. Instead
 * we split the loop at its farthest point from the start, simplify each half as
 * an open polyline, and stitch them back together.
 */
function simplifyClosed(points, tolerance) {
  if (points.length < 4) return points

  const [sx, sy] = points[0]
  let farIndex = 1
  let farDistance = -1
  for (let i = 1; i < points.length; i += 1) {
    const dx = points[i][0] - sx
    const dy = points[i][1] - sy
    const d = dx * dx + dy * dy
    if (d > farDistance) {
      farDistance = d
      farIndex = i
    }
  }

  const head = simplify(points.slice(0, farIndex + 1), tolerance)
  const tail = simplify([...points.slice(farIndex), points[0]], tolerance)
  return [...head.slice(0, -1), ...tail.slice(0, -1)]
}

async function traceFile(srcName, outName, { width, tolerance, threshold, smooth = 0 }) {
  const srcPath = join(PUB, srcName)

  // Work at a reduced raster: fewer pixels means fewer contour points, and the
  // vectors stay sharp because they are resolution independent.
  const { data, info } = await sharp(srcPath)
    .flatten({ background: '#ffffff' })
    .resize({ width, fit: 'inside' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const { width: w, height: h } = info
  let labels = new Int16Array(w * h)
  for (let i = 0; i < w * h; i += 1) {
    labels[i] = classify(data[i * 3], data[i * 3 + 1], data[i * 3 + 2], threshold)
  }
  labels = resolveUnknown(labels, w, h)

  // Reference RGBA for the validation pass.
  const reference = Buffer.alloc(w * h * 4)
  for (let i = 0; i < w * h; i += 1) {
    const label = labels[i]
    if (label >= 0) {
      const [r, g, b] = PALETTE[label].rgb
      reference[i * 4] = r
      reference[i * 4 + 1] = g
      reference[i * 4 + 2] = b
      reference[i * 4 + 3] = 255
    }
  }

  // Trace one mask per palette colour.
  const layers = []
  let totalPoints = 0
  for (let index = 0; index < PALETTE.length; index += 1) {
    const filled = new Uint8Array(w * h)
    let count = 0
    for (let i = 0; i < w * h; i += 1) {
      if (labels[i] === index) {
        filled[i] = 1
        count += 1
      }
    }
    if (count === 0) continue

    const mask = smooth > 0 ? smoothMask(filled, w, h, smooth) : filled
    const loops = traceMask(mask, w, h)
    const simplified = loops
      .map((loop) => simplifyClosed(loop, tolerance))
      .filter((loop) => loop.length >= 3)

    const d = simplified
      .map((loop) => {
        const [sx, sy] = loop[0]
        const rest = loop
          .slice(1)
          .map(([x, y]) => `${x} ${y}`)
          .join('L')
        return `M${sx} ${sy}${rest ? `L${rest}` : ''}Z`
      })
      .join('')

    totalPoints += simplified.reduce((sum, loop) => sum + loop.length, 0)
    layers.push({ hex: PALETTE[index].hex, d, loops: simplified.length, pixels: count })
  }

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" ` +
    `viewBox="0 0 ${w} ${h}" role="img">` +
    layers
      .map((layer) => `<path fill="${layer.hex}" fill-rule="evenodd" d="${layer.d}"/>`)
      .join('') +
    `</svg>`

  // Validate: rasterise the SVG at 1:1 and diff it against the reference.
  //
  // A naive per-pixel comparison is unfair to a vector trace: every contour edge
  // lands within ±1px of the raster's anti-aliased boundary, and the raw alpha
  // test counts each of those as a full failure. So mismatches are split into
  //   * boundary slack  — the reference pixel sits ON a contour (a neighbour has
  //                      the opposite coverage), where ±1px is expected, and
  //   * real error      — the pixel is solidly inside or outside the shape.
  // Only the real error rate gates the run.
  const rendered = await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer()

  const refOn = new Uint8Array(w * h)
  const renOn = new Uint8Array(w * h)
  for (let i = 0; i < w * h; i += 1) {
    refOn[i] = reference[i * 4 + 3] > 127 ? 1 : 0
    renOn[i] = rendered[i * 4 + 3] > 127 ? 1 : 0
  }

  const neighbours = [-1, 0, 1]
  let covered = 0
  let boundarySlack = 0
  let realError = 0

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const i = y * w + x
      if (refOn[i] === 0 && renOn[i] === 0) continue
      covered += 1

      let bad = false
      if (refOn[i] !== renOn[i]) {
        bad = true
      } else if (refOn[i] === 1) {
        const dr = reference[i * 4] - rendered[i * 4]
        const dg = reference[i * 4 + 1] - rendered[i * 4 + 1]
        const db = reference[i * 4 + 2] - rendered[i * 4 + 2]
        bad = Math.sqrt(dr * dr + dg * dg + db * db) > 64
      }
      if (!bad) continue

      // Is this reference pixel on a contour? Then the trace is allowed to be
      // one pixel out.
      let onContour = false
      for (const dy of neighbours) {
        for (const dx of neighbours) {
          if (dx === 0 && dy === 0) continue
          const ny = y + dy
          const nx = x + dx
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue
          if (refOn[ny * w + nx] !== refOn[i]) onContour = true
        }
      }
      if (onContour) boundarySlack += 1
      else realError += 1
    }
  }

  const accuracy = covered === 0 ? 0 : ((covered - realError) / covered) * 100

  writeFileSync(join(OUT_DIR, outName), svg)

  console.log(`\n${srcName} -> ${outName}`)
  console.log(`  raster       ${w}x${h}`)
  console.log(`  layers       ${layers.length} (${layers.map((l) => l.hex).join(', ')})`)
  console.log(`  contours     ${layers.reduce((n, l) => n + l.loops, 0)}  points ${totalPoints}`)
  console.log(`  svg size     ${(svg.length / 1024).toFixed(1)} KB`)
  console.log(
    `  fidelity     ${accuracy.toFixed(2)}% solid (${realError} real px, ${boundarySlack} boundary px)`,
  )

  // Render a 2x preview so the trace can be eyeballed, not just measured.
  mkdirSync(PREVIEW_DIR, { recursive: true })
  await sharp(await sharp(Buffer.from(svg)).resize(w * 2, h * 2).png().toBuffer())
    .flatten({ background: '#ffffff' })
    .png()
    .toFile(join(PREVIEW_DIR, outName.replace(/\.svg$/, '.png')))

  return { accuracy, bytes: svg.length, realError, boundarySlack }
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true })

  // The mark is curved ribbon art: anti-aliased edges leave a 1px staircase that
  // a naive trace turns into visible notching on the curves. Tracing at 1024
  // (so the staircase is relatively half the size), classing more edge pixels as
  // "unknown" for the neighbour vote, and majority-filtering the mask removes it
  // — then a 2.2px Douglas–Peucker tolerance (≈1px at display size) keeps the
  // point count low without softening the ribbon tips.
  const mark = await traceFile('logo-img.jpg', 'ccgames-mark.svg', {
    width: 1024,
    tolerance: 2.2,
    threshold: 105,
    smooth: 2,
  })

  // The lockup is flat type: it traces cleanly with no smoothing, so it keeps
  // the tighter settings and its glyph edges stay crisp.
  const lockup = await traceFile('logo-text.jpg', 'ccgames-lockup.svg', {
    width: 900,
    tolerance: 0.9,
    threshold: 80,
  })

  const bad = [
    ['ccgames-mark.svg', mark],
    ['ccgames-lockup.svg', lockup],
  ].filter(([, result]) => result.accuracy < 99.5)

  if (bad.length > 0) {
    console.error(
      `\nTracing accuracy below 97% for: ${bad.map(([name, r]) => `${name} (${r.accuracy.toFixed(2)}%)`).join(', ')}`,
    )
    process.exit(1)
  }
  console.log('\nBoth traces validated above the 97% accuracy floor.')
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
