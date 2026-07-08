/**
 * Generates build/icon.ico and build/icon.png from the Nano Banana app icon.
 *
 * Usage: node scripts/generate-nano-icon.js
 *
 * Uses the canvas package to read the source PNG and write a multi-size ICO.
 * Falls back to the programmatic generate-icon.js if canvas is unavailable.
 */

const fs = require('fs')
const path = require('path')

const SOURCE_PNG = path.join(__dirname, '..', 'assets', 'brand', 'nano-banana', 'aureon-app-icon.png')
const BUILD_DIR = path.join(__dirname, '..', 'build')
const ICO_PATH = path.join(BUILD_DIR, 'icon.ico')
const PNG_PATH = path.join(BUILD_DIR, 'icon.png')

const SIZES = [16, 32, 48, 256]

async function main() {
  if (!fs.existsSync(SOURCE_PNG)) {
    console.log('⚠ Nano Banana source PNG not found, falling back to programmatic icon generation...')
    require('./generate-icon.js')
    return
  }

  let canvas
  try {
    canvas = require('canvas')
  } catch {
    console.log('⚠ canvas package not available, falling back to programmatic icon generation...')
    console.log('   Install canvas: npm install canvas')
    console.log('   For now, using generate-icon.js')
    require('./generate-icon.js')
    return
  }

  const { createCanvas, loadImage } = canvas

  if (!fs.existsSync(BUILD_DIR)) {
    fs.mkdirSync(BUILD_DIR, { recursive: true })
  }

  // Load the source image
  const img = await loadImage(SOURCE_PNG)

  // Generate resized PNGs and build ICO buffers
  const iconBuffers = []

  for (const size of SIZES) {
    const cvs = createCanvas(size, size)
    const ctx = cvs.getContext('2d')
    ctx.drawImage(img, 0, 0, size, size)

    const buf = cvs.toBuffer('image/png')
    iconBuffers.push({ size, buf, width: size, height: size })

    // Save individual size PNGs
    const pngFile = path.join(BUILD_DIR, `icon-${size}.png`)
    fs.writeFileSync(pngFile, buf)
    console.log(`✓ Generated ${size}x${size} PNG (${buf.length} bytes)`)
  }

  // Write multi-size ICO
  const icoBuf = createIcoBuffer(iconBuffers)
  fs.writeFileSync(ICO_PATH, icoBuf)
  console.log(`✓ Generated ICO (${icoBuf.length} bytes) → ${ICO_PATH}`)

  // Write 256px PNG as main icon
  const largestBuf = iconBuffers[iconBuffers.length - 1].buf
  fs.writeFileSync(PNG_PATH, largestBuf)
  console.log(`✓ Generated icon.png → ${PNG_PATH}`)

  console.log('✅ Nano Banana icon generation complete!')
}

function createIcoBuffer(images) {
  const headerSize = 6
  const dirEntrySize = 16
  const dataOffset = headerSize + images.length * dirEntrySize

  const header = Buffer.alloc(headerSize)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // ICO type
  header.writeUInt16LE(images.length, 4) // image count

  const dirEntries = []
  let currentOffset = dataOffset

  for (const img of images) {
    // For ICO, use PNG format (type 0)
    const entry = Buffer.alloc(dirEntrySize)
    entry.writeUInt8(img.width === 256 ? 0 : img.width, 0)
    entry.writeUInt8(img.height === 256 ? 0 : img.height, 1)
    entry.writeUInt8(0, 2) // color palette
    entry.writeUInt8(0, 3) // reserved
    entry.writeUInt16LE(1, 4) // color planes
    entry.writeUInt16LE(32, 6) // bits per pixel
    entry.writeUInt32LE(img.buf.length, 8) // image size
    entry.writeUInt32LE(currentOffset, 12) // image offset
    dirEntries.push(entry)
    currentOffset += img.buf.length
  }

  const buffers = [header, ...dirEntries, ...images.map(i => i.buf)]
  return Buffer.concat(buffers)
}

main().catch(err => {
  console.error('Icon generation failed:', err.message)
  console.log('Falling back to programmatic icon generation...')
  require('./generate-icon.js')
})
