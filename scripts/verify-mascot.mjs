// Verifies extracted mascot cutouts: transparent bg, portrait, non-blank.
import sharp from 'sharp'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
const manifest = JSON.parse(readFileSync(join(process.cwd(), 'public', 'mascot', 'mascot-manifest.json'), 'utf8'))
let fail = 0
for (const m of manifest) {
  const p = join(process.cwd(), 'public', m.webp.replace(/^\//, ''))
  const meta = await sharp(p).metadata()
  const { data, info } = await sharp(p).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  let tr = 0
  for (let i = 3; i < data.length; i += 4) if (data[i] < 128) tr++
  const pct = (tr / (info.width * info.height)) * 100
  const ok = meta.width === m.width && meta.height === m.height && pct > 40 && m.height >= m.width && m.opaqueRatio < 0.6
  console.log((ok ? 'PASS' : 'FAIL') + ' ' + m.slug + ' ' + meta.width + 'x' + meta.height + ' transparent ' + pct.toFixed(1) + '%')
  if (!ok) fail++
}
if (fail) { console.error(fail + ' mascot asset(s) failed verification'); process.exit(1) }
console.log('All ' + manifest.length + ' mascot assets verified.')
