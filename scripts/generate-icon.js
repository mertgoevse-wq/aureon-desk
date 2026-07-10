// Vibeforge — Icon Generator
// Generates multi-size .ico with the Vibeforge "A" mark on warm ivory background
const fs = require('fs')
const sizes = [16, 32, 48, 256]
const HEADER_SIZE = 40
const ICO_HEADER = 22
const ENTRY_SIZE = 16

// Vibeforge brand colors (BGR order for BMP)
const IVORY = { b: 0xF5, g: 0xF8, r: 0xFA }
const TERRACOTTA = { r: 0xC7, g: 0x5B, b: 0x39 }
const AMBER = { r: 0xE8, g: 0xA4, b: 0x5C }
const BORDER_LIGHT = { r: 0xD4, g: 0xCB, b: 0xB9 }
const IVORY_DARK = { r: 0xE5, g: 0xDE, b: 0xD3 }

function drawMark(buf, off, s) {
  const cx = s / 2
  const cy = s * 0.47
  const scale = s / 80

  // Draw background
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const idx = off + HEADER_SIZE + ((s - 1 - y) * s + x) * 4
      buf.writeUInt8(IVORY.b, idx)
      buf.writeUInt8(IVORY.g, idx + 1)
      buf.writeUInt8(IVORY.r, idx + 2)
      buf.writeUInt8(255, idx + 3)
    }
  }

  // Helper: set pixel
  function setPixel(px, py, color, alpha = 255) {
    const x = Math.round(px)
    const y = Math.round(py)
    if (x < 0 || x >= s || y < 0 || y >= s) return
    const idx = off + HEADER_SIZE + ((s - 1 - y) * s + x) * 4
    if (alpha === 255) {
      buf.writeUInt8(color.b, idx)
      buf.writeUInt8(color.g, idx + 1)
      buf.writeUInt8(color.r, idx + 2)
      buf.writeUInt8(255, idx + 3)
    }
  }

  // Left A-pillar
  for (let y = cy - scale * 18; y <= cy + scale * 22; y++) {
    const t = (y - (cy - scale * 18)) / (scale * 40) // 0 to 1
    const leftEdge = cx - scale * 13 - t * scale * 11
    const rightEdge = cx - scale * 3 - t * scale * 7
    for (let x = leftEdge; x <= rightEdge; x++) {
      setPixel(x, y, TERRACOTTA)
    }
  }

  // Right A-pillar
  for (let y = cy - scale * 18; y <= cy + scale * 22; y++) {
    const t = (y - (cy - scale * 18)) / (scale * 40)
    const leftEdge = cx + scale * 3 + t * scale * 7
    const rightEdge = cx + scale * 13 + t * scale * 11
    for (let x = leftEdge; x <= rightEdge; x++) {
      setPixel(x, y, TERRACOTTA)
    }
  }

  // Crossbar
  for (let y = cy + scale * 8; y <= cy + scale * 12; y++) {
    for (let x = cx - scale * 9; x <= cx + scale * 9; x++) {
      setPixel(x, y, TERRACOTTA)
    }
  }

  // Neural node dots
  function dot(dx, dy, r, color) {
    for (let dy2 = -r * 2; dy2 <= r * 2; dy2++) {
      for (let dx2 = -r * 2; dx2 <= r * 2; dx2++) {
        if (dx2 * dx2 + dy2 * dy2 <= r * r * 4) {
          setPixel(cx + dx * scale + dx2, cy + dy * scale + dy2, color)
        }
      }
    }
  }

  dot(0, 16, scale * 1.5, AMBER)
  dot(-8, -1, scale, AMBER)
  dot(8, -1, scale, AMBER)

  // Subtle border ring
  for (let angle = 0; angle < 360; angle++) {
    const rad = (angle * Math.PI) / 180
    for (let r = scale * 34; r <= scale * 36; r += 0.5) {
      setPixel(cx + Math.cos(rad) * r, cy + Math.sin(rad) * r, BORDER_LIGHT)
    }
  }
}

// Calculate offsets
const entries = []
let dataOffset = ICO_HEADER + sizes.length * ENTRY_SIZE
for (const s of sizes) {
  const imgSize = s * s * 4
  entries.push({ size: s, imgSize, offset: dataOffset })
  dataOffset += HEADER_SIZE + imgSize
}

const buf = Buffer.alloc(dataOffset)

// ICO header
buf.writeUInt16LE(0, 0)
buf.writeUInt16LE(1, 2)
buf.writeUInt16LE(sizes.length, 4)

// ICONDIRENTRY
sizes.forEach((s, i) => {
  const e = entries[i]
  const off = 6 + i * 16
  buf.writeUInt8(s === 256 ? 0 : s, off)
  buf.writeUInt8(s === 256 ? 0 : s, off + 1)
  buf.writeUInt8(0, off + 2)
  buf.writeUInt8(0, off + 3)
  buf.writeUInt16LE(0, off + 4)
  buf.writeUInt16LE(0, off + 6)
  buf.writeUInt32LE(e.imgSize, off + 8)
  buf.writeUInt32LE(e.offset, off + 12)
})

// Write bitmap data
sizes.forEach((s, i) => {
  const e = entries[i]
  const off = e.offset
  buf.writeUInt32LE(40, off)
  buf.writeInt32LE(s, off + 4)
  buf.writeInt32LE(s * 2, off + 8)
  buf.writeUInt16LE(1, off + 12)
  buf.writeUInt16LE(32, off + 14)
  buf.writeUInt32LE(0, off + 16)
  buf.writeUInt32LE(s * s * 4, off + 20)
  buf.writeInt32LE(0, off + 24)
  buf.writeInt32LE(0, off + 28)
  buf.writeUInt32LE(0, off + 32)
  buf.writeUInt32LE(0, off + 36)
  drawMark(buf, off, s)
})

fs.mkdirSync('build', { recursive: true })
fs.writeFileSync('build/icon.ico', buf)
console.log(`Vibeforge icon created: build/icon.ico (${buf.length} bytes, ${sizes.length} sizes: ${sizes.join(', ')})`)

// Also extract the 256px BMP as icon.png for general use
const lastEntry = entries[sizes.length - 1]
const bmpOffset = lastEntry.offset + HEADER_SIZE
const bmpSize = lastEntry.imgSize
const bmpData = buf.subarray(bmpOffset, bmpOffset + bmpSize)

// Write as raw RGBA — usable as icon.png reference
// For a proper PNG, install the canvas package and use generate-icons.mjs
fs.writeFileSync('build/icon.png', Buffer.concat([
  // Simple BMP-to-buffer for the 256px icon as fallback
  bmpData
]))
console.log(`Fallback icon.png saved (${bmpData.length} bytes, raw RGBA from 256px BMP)`)
