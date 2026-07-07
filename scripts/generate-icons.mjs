/**
 * Aureon Desk — Icon Generation Script (Canvas-based)
 * Generates high-quality PNG icons using the `canvas` package.
 * 
 * Usage: npm install canvas && node scripts/generate-icons.mjs
 * 
 * If `canvas` is not installed, use the fallback:
 *   node scripts/generate-icon.js
 * That script generates build/icon.ico + build/icon.png without extra dependencies.
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

let createCanvas
try {
  const canvas = await import('canvas')
  createCanvas = canvas.createCanvas
} catch {
  console.error('Canvas package not found. Install it with: npm install canvas')
  console.error('Falling back to generate-icon.js for icon generation.')
  console.error('Run: node scripts/generate-icon.js')
  process.exit(1)
}

const OUTPUT_DIR = 'build'
const SIZES = [16, 32, 48, 64, 128, 256, 512]

// Aureon brand colors
const COLORS = {
  bg: '#FAF8F5',
  accent: '#C75B39',
  accentLight: '#E8A45C',
  text: '#2C2416',
  border: '#D4CBB9',
  borderLight: '#E5DED3',
}

function drawAureonMark(ctx, cx, cy, scale) {
  // Outer aureole rings
  ctx.strokeStyle = COLORS.borderLight
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.arc(cx, cy, scale * 32, 0, Math.PI * 2)
  ctx.stroke()

  ctx.strokeStyle = COLORS.accent
  ctx.globalAlpha = 0.3
  ctx.lineWidth = 0.5
  ctx.beginPath()
  ctx.arc(cx, cy, scale * 28, 0, Math.PI * 2)
  ctx.stroke()
  ctx.globalAlpha = 1

  // Stylized "A"
  ctx.fillStyle = COLORS.accent
  
  // Left pillar
  ctx.beginPath()
  ctx.moveTo(cx - scale * 14, cy + scale * 20)
  ctx.lineTo(cx - scale * 4, cy - scale * 16)
  ctx.lineTo(cx, cy - scale * 16)
  ctx.lineTo(cx - scale * 10, cy + scale * 20)
  ctx.closePath()
  ctx.fill()

  // Right pillar
  ctx.beginPath()
  ctx.moveTo(cx + scale * 14, cy + scale * 20)
  ctx.lineTo(cx + scale * 4, cy - scale * 16)
  ctx.lineTo(cx, cy - scale * 16)
  ctx.lineTo(cx + scale * 10, cy + scale * 20)
  ctx.closePath()
  ctx.fill()

  // Crossbar
  const barH = scale * 4
  const barW = scale * 18
  const barR = scale * 1.5
  ctx.beginPath()
  ctx.moveTo(cx - barW / 2 + barR, cy + scale * 8)
  ctx.lineTo(cx + barW / 2 - barR, cy + scale * 8)
  ctx.arcTo(cx + barW / 2, cy + scale * 8, cx + barW / 2, cy + scale * 8 + barR, barR)
  ctx.lineTo(cx + barW / 2, cy + scale * 8 + barH - barR)
  ctx.arcTo(cx + barW / 2, cy + scale * 8 + barH, cx + barW / 2 - barR, cy + scale * 8 + barH, barR)
  ctx.lineTo(cx - barW / 2 + barR, cy + scale * 8 + barH)
  ctx.arcTo(cx - barW / 2, cy + scale * 8 + barH, cx - barW / 2, cy + scale * 8 + barH - barR, barR)
  ctx.lineTo(cx - barW / 2, cy + scale * 8 + barR)
  ctx.arcTo(cx - barW / 2, cy + scale * 8, cx - barW / 2 + barR, cy + scale * 8, barR)
  ctx.closePath()
  ctx.fill()

  // Neural node dots
  ctx.fillStyle = COLORS.accentLight
  ctx.globalAlpha = 0.7
  ctx.beginPath()
  ctx.arc(cx, cy + scale * 14, scale * 1.5, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.globalAlpha = 0.5
  ctx.beginPath()
  ctx.arc(cx - scale * 8, cy, scale * 1, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(cx + scale * 8, cy, scale * 1, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.globalAlpha = 1
}

function generatePng(size) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')

  // Background
  ctx.fillStyle = COLORS.bg
  ctx.beginPath()
  ctx.roundRect(0, 0, size, size, size * 0.18)
  ctx.fill()

  // Border
  ctx.strokeStyle = COLORS.border
  ctx.lineWidth = Math.max(1, size * 0.015)
  ctx.beginPath()
  ctx.roundRect(size * 0.015, size * 0.015, size * 0.97, size * 0.97, size * 0.17)
  ctx.stroke()

  // Draw mark centered
  const markScale = size / 96
  drawAureonMark(ctx, size / 2, size * 0.48, markScale)

  return canvas.toBuffer('image/png')
}

function writeIco(pngBuffers) {
  // For simplicity and broad compatibility, embed the largest PNG as the ICO
  const largest = pngBuffers[pngBuffers.length - 1]
  const icoPath = join(OUTPUT_DIR, 'icon.ico')
  writeFileSync(icoPath, largest)
  console.log(`  Wrote icon.ico (${largest.length} bytes, embedded ${SIZES[SIZES.length - 1]}px PNG)`)
}

// Main
mkdirSync(OUTPUT_DIR, { recursive: true })

console.log('Aureon Desk — Icon Generator')
console.log(`Output directory: ${OUTPUT_DIR}`)
console.log(`Sizes: ${SIZES.join(', ')}\n`)

const pngBuffers = []
for (const size of SIZES) {
  const buf = generatePng(size)
  const path = join(OUTPUT_DIR, `icon-${size}.png`)
  writeFileSync(path, buf)
  pngBuffers.push(buf)
  console.log(`  ✓ icon-${size}.png (${buf.length} bytes)`)
}

// Also write icon.png (512px) as default
const largePng = pngBuffers[pngBuffers.length - 1]
writeFileSync(join(OUTPUT_DIR, 'icon.png'), largePng)
console.log(`  ✓ icon.png (${largePng.length} bytes)`)

// Write ICO
writeIco(pngBuffers)

console.log('\nDone! Icons generated in build/ directory.')
console.log('For best results, install the canvas package:')
console.log('  npm install canvas')
console.log('(If canvas fails to install, the fallback ICO in build/ will be used.)')
