// Coal City Games 2026 — brand asset pipeline.
// Run with: node scripts/build-brand-assets.mjs
//
// Source artwork (dropped in by the organisers):
//   public/logo-img.jpg   1024x1024  the multicolour mark
//   public/logo-text.jpg  1200x896   "Coal City Games / ENUGU / 2026 / 23RD NSF"
//
// Both sources are flattened JPGs on a white canvas, so this script keys the
// white background out to real alpha (colours un-premultiplied, so edges stay
// crisp) and emits every derivative the app, the PWA and social previews need.

import sharp from 'sharp'
import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const PUB = join(process.cwd(), 'public')
const BRAND_DIR = join(PUB, 'brand')

const MARK_SRC = join(PUB, 'logo-img.jpg')
const LOCKUP_SRC = join(PUB, 'logo-text.jpg')

/** Brand swatches (from the Coal City Games brand sheet). */
const COLORS = {
  green: '#6CB33F',
  amber: '#F7A41E',
  crimson: '#D8232A',
  blue: '#121F8F',
  coal: '#141416',
  white: '#FFFFFF',
}

/**
 * Key the white canvas out of a flattened JPG and return a transparent PNG.
 *
 * For each pixel: `a = (255 - min(r,g,b)) / 255`, so pure white becomes fully
 * transparent and saturated brand colours stay fully opaque. The colour is then
 * un-premultiplied against white (`colour = (observed - 255*(1-a)) / a`) so an
 * anti-aliased light-red edge recovers its true hue instead of a white fringe.
 */
async function keyedPng(srcPath, { trim = true } = {}) {
  let pipeline = sharp(srcPath)
  if (trim) pipeline = pipeline.trim({ threshold: 12 })

  const { data, info } = await pipeline
    .flatten({ background: '#ffffff' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const out = Buffer.from(data)
  for (let i = 0; i < out.length; i += 4) {
    const r = out[i]
    const g = out[i + 1]
    const b = out[i + 2]
    const mn = Math.min(r, g, b)
    if (mn >= 255) {
      out[i + 3] = 0
      continue
    }
    const a = (255 - mn) / 255
    out[i + 3] = Math.round(a * 255)
    const un = (channel) => {
      const value = (channel - 255 * (1 - a)) / a
      return value < 0 ? 0 : value > 255 ? 255 : Math.round(value)
    }
    out[i] = un(r)
    out[i + 1] = un(g)
    out[i + 2] = un(b)
  }

  return sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toBuffer()
}

/** Wrap one 32x32 PNG in an ICO container (PNG-in-ICO, supported everywhere). */
function pngToIco(pngBuffer, size = 32) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // type: icon
  header.writeUInt16LE(1, 4) // image count

  const entry = Buffer.alloc(16)
  entry.writeUInt8(size === 256 ? 0 : size, 0)
  entry.writeUInt8(size === 256 ? 0 : size, 1)
  entry.writeUInt8(0, 2) // palette size
  entry.writeUInt8(0, 3) // reserved
  entry.writeUInt16LE(1, 4) // colour planes
  entry.writeUInt16LE(32, 6) // bits per pixel
  entry.writeUInt32LE(pngBuffer.length, 8)
  entry.writeUInt32LE(22, 12) // data offset = 6 + 16

  return Buffer.concat([header, entry, pngBuffer])
}

/** Opaque derivative: the mark centred on a solid canvas (iOS/Android safe). */
async function opaqueIcon(markBuffer, size, background) {
  const inner = Math.round(size * 0.78)
  const mark = await sharp(markBuffer).resize(inner, inner, { fit: 'inside' }).png().toBuffer()
  const meta = await sharp(mark).metadata()
  const width = meta.width ?? inner
  const height = meta.height ?? inner
  return sharp({ create: { width: size, height: size, channels: 4, background } })
    .composite([
      {
        input: mark,
        left: Math.round((size - width) / 2),
        top: Math.round((size - height) / 2),
      },
    ])
    .png()
    .toBuffer()
}

async function main() {
  for (const source of [MARK_SRC, LOCKUP_SRC]) {
    if (!existsSync(source)) {
      throw new Error(
        `Missing brand source: ${source}\n` +
          "Drop the organisers' artwork in as public/logo-img.jpg (mark) and public/logo-text.jpg (lockup).",
      )
    }
  }
  mkdirSync(BRAND_DIR, { recursive: true })

  // 1. Transparent masters ---------------------------------------------------
  const markMaster = await keyedPng(MARK_SRC)
  const lockupMaster = await keyedPng(LOCKUP_SRC)

  // Palette PNG is lossless for flat brand art and far smaller than truecolour.
  // dither:0 keeps the anti-aliased edges clean instead of speckled.
  const FLAT_PNG = { compressionLevel: 9, palette: true, colours: 64, dither: 0 }
  const markPng = await sharp(markMaster).resize(640, 640, { fit: 'inside' }).png(FLAT_PNG).toBuffer()
  const lockupPng = await sharp(lockupMaster)
    .resize(1000, 1000, { fit: 'inside' })
    .png(FLAT_PNG)
    .toBuffer()

  writeFileSync(join(BRAND_DIR, 'ccgames-mark.png'), markPng)
  writeFileSync(join(BRAND_DIR, 'ccgames-lockup.png'), lockupPng)
  // Legacy alias, so any un-migrated reference still renders the new mark.
  writeFileSync(join(PUB, 'logo.png'), markPng)

  // 2. Favicons -------------------------------------------------------------
  const fav32 = await sharp(markMaster).resize(32, 32, { fit: 'contain' }).png().toBuffer()
  const fav16 = await sharp(markMaster).resize(16, 16, { fit: 'contain' }).png().toBuffer()
  writeFileSync(join(PUB, 'favicon-32x32.png'), fav32)
  writeFileSync(join(PUB, 'favicon-16x16.png'), fav16)
  writeFileSync(join(PUB, 'favicon.ico'), pngToIco(fav32, 32))

  // 3. Home-screen + PWA icons (opaque: iOS/Android never flatten them) ------
  const white = { r: 255, g: 255, b: 255, alpha: 1 }
  writeFileSync(join(PUB, 'apple-touch-icon.png'), await opaqueIcon(markMaster, 180, white))
  writeFileSync(join(PUB, 'android-chrome-192x192.png'), await opaqueIcon(markMaster, 192, white))
  const pwa512 = await opaqueIcon(markMaster, 512, white)
  writeFileSync(join(PUB, 'android-chrome-512x512.png'), pwa512)
  writeFileSync(
    join(PUB, 'logo-compressed.jpeg'),
    await sharp(pwa512).resize(256, 256).jpeg({ quality: 88 }).toBuffer(),
  )

  // 4. Social card — brand-blue field, white plate, lockup centred ----------
  const cardW = 1200
  const cardH = 630
  const plateW = 1000
  const plateH = 470
  const plateTop = Math.round((cardH - plateH) / 2) - 12

  const lockupOnPlate = await sharp(lockupMaster)
    .resize(plateW - 140, plateH - 120, { fit: 'inside' })
    .png()
    .toBuffer()
  const lockupMeta = await sharp(lockupOnPlate).metadata()
  const lockupW = lockupMeta.width ?? plateW
  const lockupH = lockupMeta.height ?? plateH

  const svg = (body) => Buffer.from(`<svg width="${cardW}" height="${cardH}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`)

  const og = await sharp({ create: { width: cardW, height: cardH, channels: 4, background: COLORS.blue } })
    .composite([
      {
        input: svg(
          `<rect x="${Math.round((cardW - plateW) / 2)}" y="${plateTop}" width="${plateW}" height="${plateH}" rx="28" ry="28" fill="${COLORS.white}"/>`,
        ),
        left: 0,
        top: 0,
      },
      {
        input: lockupOnPlate,
        left: Math.round((cardW - lockupW) / 2),
        top: plateTop + Math.round((plateH - lockupH) / 2),
      },
      {
        input: svg(
          `<rect x="0" y="${cardH - 20}" width="${cardW * 0.34}" height="20" fill="${COLORS.green}"/>` +
            `<rect x="${cardW * 0.34}" y="${cardH - 20}" width="${cardW * 0.33}" height="20" fill="${COLORS.amber}"/>` +
            `<rect x="${cardW * 0.67}" y="${cardH - 20}" width="${cardW * 0.33}" height="20" fill="${COLORS.crimson}"/>`,
        ),
        left: 0,
        top: 0,
      },
    ])
    .png()
    .toBuffer()
  writeFileSync(join(PUB, 'og-image.png'), og)

  const kb = (buffer) => `${(buffer.length / 1024).toFixed(1)} KB`
  console.log('Coal City Games brand assets written:')
  console.log(`  public/brand/ccgames-mark.png     ${kb(markPng)}`)
  console.log(`  public/brand/ccgames-lockup.png   ${kb(lockupPng)}`)
  console.log(`  public/favicon-32x32.png          ${kb(fav32)}`)
  console.log(`  public/favicon-16x16.png          ${kb(fav16)}`)
  console.log('  public/favicon.ico                32x32')
  console.log('  public/apple-touch-icon.png       180x180')
  console.log('  public/android-chrome-192x192.png 192x192')
  console.log(`  public/android-chrome-512x512.png ${kb(pwa512)}`)
  console.log(`  public/og-image.png               1200x630 ${kb(og)}`)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
