/**
 * Vibeforge — Brand Asset Generator
 *
 * Generates all runtime PNG and ICO assets from SVG sources.
 * Uses the `canvas` package (already in devDependencies) for rendering.
 *
 * Usage: node scripts/generate-brand-assets.mjs
 *
 * Outputs:
 *   public/brand/Vibeforge-mark-32.png
 *   public/brand/Vibeforge-mark-64.png
 *   public/brand/Vibeforge-mark-128.png
 *   public/brand/Vibeforge-mark-256.png
 *   public/brand/Vibeforge-logo-512.png
 *   build/icon.ico (multi-size: 16, 24, 32, 48, 64, 128, 256)
 *   build/icon.png (256px)
 *   build/icon-{size}.png (individual sizes)
 */

import { createCanvas, loadImage } from 'canvas'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = join(__dirname, '..')
const BRAND_SVG = join(ROOT, 'assets', 'brand')
const PUBLIC_BRAND = join(ROOT, 'public', 'brand')
const BUILD_DIR = join(ROOT, 'build')

// Brand colors (must match tokens.css and VibeforgeMark.tsx)
const COLORS = {
  accent: '#B8683A',
  accentHover: '#A45A30',
  accentLight: '#F9EFE9',
  amber: '#E8A45C',
  ivory: '#FAF7F2',
  ivorySurface: '#F3EFE6',
  text: '#2C2416',
  textMuted: '#8E8371',
}

// PNG sizes for the mark (renderer-accessible)
const MARK_SIZES = [32, 64, 128, 256]

// ICO sizes
const ICO_SIZES = [16, 24, 32, 48, 64, 128, 256]

// ---------------------------------------------------------------------------
// SVG source strings (embedded so no file I/O needed for the mark)
// ---------------------------------------------------------------------------

function markSvg(size) {
  const s = 256
  const cx = s / 2
  const cy = s / 2
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}" width="${size}" height="${size}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${COLORS.accent}"/>
      <stop offset="100%" stop-color="${COLORS.accentHover}"/>
    </linearGradient>
  </defs>
  <circle cx="${cx}" cy="${cy}" r="118" fill="${COLORS.accentLight}" stroke="${COLORS.accent}" stroke-width="2" stroke-opacity="0.3"/>
  <circle cx="${cx}" cy="${cy}" r="108" fill="none" stroke="${COLORS.amber}" stroke-width="0.75" stroke-opacity="0.2"/>
  <path d="M72 178L104 72H110L78 178H72Z" fill="url(#g)"/>
  <path d="M184 178L152 72H146L178 178H184Z" fill="url(#g)"/>
  <rect x="92" y="140" width="72" height="6" rx="3" fill="url(#g)"/>
  <circle cx="128" cy="66" r="3.5" fill="${COLORS.amber}" opacity="0.7"/>
  <circle cx="128" cy="166" r="3" fill="${COLORS.amber}" opacity="0.55"/>
  <circle cx="66" cy="128" r="2.5" fill="${COLORS.amber}" opacity="0.45"/>
  <circle cx="190" cy="128" r="2.5" fill="${COLORS.amber}" opacity="0.45"/>
  <line x1="128" y1="70" x2="128" y2="134" stroke="${COLORS.amber}" stroke-width="0.5" stroke-opacity="0.15"/>
  <line x1="70" y1="128" x2="86" y2="134" stroke="${COLORS.amber}" stroke-width="0.5" stroke-opacity="0.12"/>
  <line x1="186" y1="128" x2="170" y2="134" stroke="${COLORS.amber}" stroke-width="0.5" stroke-opacity="0.12"/>
</svg>`
}

function iconSvg(size) {
  // Rounded-square app icon with centered mark
  const s = 256
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}" width="${size}" height="${size}">
  <defs>
    <linearGradient id="ig" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${COLORS.accent}"/>
      <stop offset="100%" stop-color="${COLORS.accentHover}"/>
    </linearGradient>
  </defs>
  <rect x="16" y="16" width="224" height="224" rx="48" fill="${COLORS.ivorySurface}"/>
  <path d="M78 182L108 82H113L83 182H78Z" fill="url(#ig)"/>
  <path d="M178 182L148 82H143L173 182H178Z" fill="url(#ig)"/>
  <rect x="97" y="146" width="62" height="5" rx="2.5" fill="url(#ig)"/>
  <circle cx="128" cy="170" r="2.5" fill="${COLORS.amber}" opacity="0.6"/>
  <circle cx="128" cy="78" r="2.5" fill="${COLORS.amber}" opacity="0.5"/>
</svg>`
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Ensure SVG string has explicit width/height attributes for canvas */
function ensureSvgDimensions(svgString, fallbackW, fallbackH) {
  // Strip existing width and height to prevent duplicates or mismatches
  const cleaned = svgString
    .replace(/\s+width\s*=\s*["'][\d%]+["']/gi, '')
    .replace(/\s+height\s*=\s*["'][\d%]+["']/gi, '')
  
  // Inject explicit width and height attributes
  return cleaned.replace(/<svg\b/, `<svg width="${fallbackW}" height="${fallbackH}"`)
}

async function svgToPng(svgString, width, height) {
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  // Ensure SVG has explicit dimensions
  const fixedSvg = ensureSvgDimensions(svgString, width, height)

  // Render SVG to canvas
  try {
    const img = await loadImage(Buffer.from(fixedSvg))
    ctx.drawImage(img, 0, 0, width, height)
    return canvas.toBuffer('image/png')
  } catch (err) {
    console.error('--- FAILURE SVG START ---')
    console.error(fixedSvg)
    console.error('--- FAILURE SVG END ---')
    throw err
  }
}

function writePng(path, buffer) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, buffer)
  console.log(`  ✓ ${path} (${(buffer.length / 1024).toFixed(1)} KB)`)
}

function createIco(pngBuffers) {
  // PNGs mapped by size
  const sizeMap = new Map()
  for (const { size, buffer } of pngBuffers) {
    sizeMap.set(size, buffer)
  }

  // ICO header: 6 bytes
  const imageCount = ICO_SIZES.length
  const headerSize = 6
  const dirEntrySize = 16
  const dataStart = headerSize + imageCount * dirEntrySize

  // Calculate offsets and total size
  let offset = dataStart
  const entries = []
  for (const size of ICO_SIZES) {
    const buf = sizeMap.get(size)
    if (!buf) {
      console.warn(`  ⚠ Missing ${size}px PNG, skipping in ICO`)
      continue
    }
    entries.push({ size, buffer: buf, offset })
    offset += buf.length
  }

  const totalSize = dataStart + entries.reduce((s, e) => s + e.buffer.length, 0)
  const icoBuf = Buffer.alloc(totalSize)

  // Write header
  icoBuf.writeUInt16LE(0, 0) // reserved
  icoBuf.writeUInt16LE(1, 2) // ICO type (1 = icon)
  icoBuf.writeUInt16LE(entries.length, 4)

  // Write directory entries
  entries.forEach((entry, i) => {
    const off = headerSize + i * dirEntrySize
    const s = entry.size
    icoBuf.writeUInt8(s === 256 ? 0 : s, off) // width
    icoBuf.writeUInt8(s === 256 ? 0 : s, off + 1) // height
    icoBuf.writeUInt8(0, off + 2) // color palette
    icoBuf.writeUInt8(0, off + 3) // reserved
    icoBuf.writeUInt16LE(1, off + 4) // color planes
    icoBuf.writeUInt16LE(32, off + 6) // bits per pixel
    icoBuf.writeUInt32LE(entry.buffer.length, off + 8) // image size
    icoBuf.writeUInt32LE(entry.offset, off + 12) // image offset
  })

  // Write image data
  entries.forEach((entry) => {
    entry.buffer.copy(icoBuf, entry.offset)
  })

  return icoBuf
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('🎨 Vibeforge — Brand Asset Generator\n')

  const markSvgPath = join(BRAND_SVG, 'vibeforge-mark.svg')
  const lockupPath = join(BRAND_SVG, 'vibeforge-logo-lockup.svg')
  const bannerSvgPath = join(BRAND_SVG, 'vibeforge-github-banner.svg')

  if (!existsSync(markSvgPath)) {
    throw new Error(`Missing source SVG: ${markSvgPath}`)
  }

  const markSvgContent = readFileSync(markSvgPath, 'utf-8')

  // --- Generate mark PNGs ---
  console.log('Mark PNGs (public/brand/):')
  for (const size of MARK_SIZES) {
    const png = await svgToPng(markSvgContent, size, size)
    writePng(join(PUBLIC_BRAND, `vibeforge-mark-${size}.png`), png)
    writePng(join(PUBLIC_BRAND, `Vibeforge-mark-${size}.png`), png) // Legacy alias
  }

  // --- Generate logo PNG (512px) ---
  console.log('\nLogo PNG (public/brand/):')
  if (existsSync(lockupPath)) {
    const lockupSvg = readFileSync(lockupPath, 'utf-8')
    const logo512 = await svgToPng(lockupSvg, 512, 148)
    writePng(join(PUBLIC_BRAND, 'vibeforge-logo-512.png'), logo512)
    writePng(join(PUBLIC_BRAND, 'Vibeforge-logo-512.png'), logo512) // Legacy alias
  }

  // --- Generate icon PNGs for ICO ---
  console.log('\nIcon PNGs (build/):')
  const icoPngs = []
  for (const size of ICO_SIZES) {
    const png = await svgToPng(markSvgContent, size, size)
    const outPath = join(BUILD_DIR, `icon-${size}.png`)
    writePng(outPath, png)
    icoPngs.push({ size, buffer: png })
  }

  // --- ICO file ---
  console.log('\nICO:')
  const icoBuffer = createIco(icoPngs)
  const icoPath = join(BUILD_DIR, 'icon.ico')
  writeFileSync(icoPath, icoBuffer)
  console.log(`  ✓ ${icoPath} (${(icoBuffer.length / 1024).toFixed(1)} KB, ${ICO_SIZES.length} sizes: ${ICO_SIZES.join(', ')})`)

  // --- Main icon PNG (256px) ---
  console.log('\nMain PNG:')
  const mainIcon = icoPngs.find((p) => p.size === 256)
  if (mainIcon) {
    const iconPngPath = join(BUILD_DIR, 'icon.png')
    writeFileSync(iconPngPath, mainIcon.buffer)
    console.log(`  ✓ ${iconPngPath} (${(mainIcon.buffer.length / 1024).toFixed(1)} KB)`)
  }

  // --- GitHub banner PNG ---
  console.log('\nGitHub Banner:')
  if (existsSync(bannerSvgPath)) {
    const bannerSvg = readFileSync(bannerSvgPath, 'utf-8')
    const bannerPng = await svgToPng(bannerSvg, 1280, 640)
    const bannerPath = join(BRAND_SVG, '..', 'vibeforge-github-banner-1200.png')
    writePng(bannerPath, bannerPng)
    const legacyBannerPath = join(BRAND_SVG, '..', 'Vibeforge-github-banner-1200.png')
    writePng(legacyBannerPath, bannerPng) // Legacy alias
  }

  console.log('\n✅ All brand assets generated successfully!')
}

main().catch((err) => {
  console.error('❌ Brand asset generation failed:', err.message)
  console.error(err.stack)
  process.exit(1)
})
