// Mascot pipeline: .preview/mascot/*.jpg (white canvas) -> public/mascot/*.
// Run: node scripts/build-mascot-assets.mjs
// Keys white to alpha w/ feathered fur edges, trims margin, caps 1024px tall.
// NOTE: 2D cutouts presented w/ CSS 3D tilt (see Mascot.tsx), not a .glb mesh.
import sharp from 'sharp'
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { join, basename } from 'node:path'
const PREVIEW_DIR = join(process.cwd(), '.preview', 'mascot')
const OUT_DIR = join(process.cwd(), 'public', 'mascot')
const SLUG_RULES = [
  [/basket/i, 'mascot-basketball'],
  [/soccer/i, 'mascot-football'],
  [/boxing/i, 'mascot-boxing'],
  [/badminton/i, 'mascot-badminton'],
  [/table.tennis/i, 'mascot-table-tennis'],
  [/tennis.racket.*20260929021554/i, 'mascot-tennis'],
  [/remove.the.tennis/i, 'mascot-athletics'],
  [/golf/i, 'mascot-golf'],
  [/red.outfit/i, 'mascot-away-kit'],
  [/white.background.*20260929021900/i, 'mascot-base'],
  [/white.background.*20260929022109/i, 'mascot-base-alt'],
  [/lion.mascot.wearing/i, 'mascot-hero'],
]
const slugFor = (f) => {
  for (const [re, slug] of SLUG_RULES) if (re.test(f)) return slug
  return basename(f, '.jpg').toLowerCase().replace(/[^a-z0-9]+/g, '-')
}
async function keyedCutout(srcPath) {
  const { data, info } = await sharp(srcPath)
    .flatten({ background: '#ffffff' }).ensureAlpha().raw()
    .toBuffer({ resolveWithObject: true })
  const out = Buffer.from(data)
  let opaque = 0
  for (let i = 0; i < out.length; i += 4) {
    const r = out[i]; const g = out[i + 1]; const b = out[i + 2]
    const mn = Math.min(r, g, b)
    const mx = Math.max(r, g, b)
    // Studio canvas reads ~237-250 grey, low saturation. Fur/kit is either
    // darker (mn < 225) or saturated (mx - mn > 18). Anything bright AND
    // neutral is canvas -> transparent; straddling pixels feather.
    const sat = mx - mn
    let a
    if (mn >= 236 && sat <= 14) a = 0
    else if (mn >= 222 && sat <= 22) a = 0.45
    else if (mn >= 210 && sat <= 30) a = 0.8
    else a = 1
    if (a >= 1) { out[i + 3] = 255; opaque++; continue }
    if (a <= 0) { out[i + 3] = 0; continue }
    out[i + 3] = Math.round(a * 255)
    const un = (c) => {
      const v = (c - 255 * (1 - a)) / a
      return v < 0 ? 0 : v > 255 ? 255 : Math.round(v)
    }
    out[i] = un(r); out[i + 1] = un(g); out[i + 2] = un(b)
  }
  const cut = sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
  return { cut, opaqueRatio: opaque / (info.width * info.height) }
}
async function main() {
  mkdirSync(OUT_DIR, { recursive: true })
  const files = readdirSync(PREVIEW_DIR).filter((f) => /\.jpe?g$/i.test(f))
  if (!files.length) throw new Error('No JPG sources in ' + PREVIEW_DIR)
  const manifest = []
  for (const file of files) {
    const slug = slugFor(file)
    const { cut, opaqueRatio } = await keyedCutout(join(PREVIEW_DIR, file))
    const resized = cut.trim({ threshold: 12 })
      .resize({ height: 1024, fit: 'inside', withoutEnlargement: true })
    const png = await resized.clone().png({ compressionLevel: 9 }).toBuffer()
    const webp = await resized.clone().webp({ quality: 88 }).toBuffer()
    writeFileSync(join(OUT_DIR, slug + '.png'), png)
    writeFileSync(join(OUT_DIR, slug + '.webp'), webp)
    const meta = await sharp(png).metadata()
    manifest.push({ slug, source: '.preview/mascot/' + file,
      png: '/mascot/' + slug + '.png', webp: '/mascot/' + slug + '.webp',
      width: meta.width, height: meta.height,
      pngKB: +(png.length / 1024).toFixed(1), webpKB: +(webp.length / 1024).toFixed(1),
      opaqueRatio: +opaqueRatio.toFixed(3) })
    console.log(' ' + slug + ' ' + meta.width + 'x' + meta.height +
      ' png ' + (png.length / 1024).toFixed(0) + 'KB webp ' +
      (webp.length / 1024).toFixed(0) + 'KB opaque ' + (opaqueRatio * 100).toFixed(1) + '%')
  }
  const bad = manifest.filter((m) => m.opaqueRatio > 0.92 || m.width < 200 || m.height < 400)
  manifest.sort((a, b) => a.slug.localeCompare(b.slug))
  writeFileSync(join(OUT_DIR, 'mascot-manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
  console.log('\nWrote ' + manifest.length + ' poses to public/mascot/')
  if (bad.length) { console.error('VERIFY FAILED: ' + JSON.stringify(bad)); process.exit(1) }
  console.log('VERIFY PASSED: portrait alpha-keyed cutouts.')
}
main().catch((e) => { console.error(e.message); process.exit(1) })
