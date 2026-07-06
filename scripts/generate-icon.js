// Generates a multi-size .ico file (16, 32, 48, 256) with a warm terracotta-on-ivory design
const fs = require('fs')
const sizes = [16, 32, 48, 256]
const HEADER_SIZE = 40
const ICO_HEADER = 22
const ENTRY_SIZE = 16

// Calculate offsets and total buffer size
const entries = []
let dataOffset = ICO_HEADER + sizes.length * ENTRY_SIZE

for (const s of sizes) {
  const imgSize = s * s * 4
  entries.push({ size: s, imgSize, offset: dataOffset })
  dataOffset += HEADER_SIZE + imgSize
}

const buf = Buffer.alloc(dataOffset)

// ICO header
buf.writeUInt16LE(0, 0)       // reserved
buf.writeUInt16LE(1, 2)       // type: ICO
buf.writeUInt16LE(sizes.length, 4) // image count

// ICONDIRENTRY for each image
sizes.forEach((s, i) => {
  const e = entries[i]
  const off = 6 + i * 16
  buf.writeUInt8(s === 256 ? 0 : s, off)     // width
  buf.writeUInt8(s === 256 ? 0 : s, off + 1) // height
  buf.writeUInt8(0, off + 2)                  // colors
  buf.writeUInt8(0, off + 3)                  // reserved
  buf.writeUInt16LE(0, off + 4)               // color planes
  buf.writeUInt16LE(0, off + 6)               // bpp (0 for PNG)
  buf.writeUInt32LE(e.imgSize, off + 8)        // image size
  buf.writeUInt32LE(e.offset, off + 12)        // data offset
})

// Write each image: BITMAPINFOHEADER + RGBA pixels (bottom-up BMP)
sizes.forEach((s, i) => {
  const e = entries[i]
  const off = e.offset

  // BITMAPINFOHEADER
  buf.writeUInt32LE(40, off)        // header size
  buf.writeInt32LE(s, off + 4)      // width
  buf.writeInt32LE(s * 2, off + 8)  // height (2x for ICO: AND mask below color)
  buf.writeUInt16LE(1, off + 12)    // planes
  buf.writeUInt16LE(32, off + 14)   // bpp
  buf.writeUInt32LE(0, off + 16)    // compression
  buf.writeUInt32LE(s * s * 4, off + 20) // image size
  buf.writeInt32LE(0, off + 24)     // x pixels per meter
  buf.writeInt32LE(0, off + 28)     // y pixels per meter
  buf.writeUInt32LE(0, off + 32)    // colors used
  buf.writeUInt32LE(0, off + 36)    // colors important

  // Pixel data (BGRA, bottom-up)
  const cx = s / 2
  const cy = s / 2
  const cr = s * 0.3

  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const idx = off + HEADER_SIZE + ((s - 1 - y) * s + x) * 4
      const d = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
      const rr = 210 + Math.floor(Math.sin(x * 0.02 + y * 0.03) * 8)
      const gg = 150 + Math.floor(Math.cos(x * 0.025 + y * 0.025) * 6)
      const bb = 95 + Math.floor(Math.sin(x * 0.03 + y * 0.02) * 6)

      if (d < cr) {
        // Inner circle: lighter warm tone
        buf.writeUInt8(130, idx)      // B
        buf.writeUInt8(175, idx + 1)  // G
        buf.writeUInt8(230, idx + 2)  // R
      } else {
        // Background: warm ivory/terracotta
        buf.writeUInt8(bb, idx)       // B
        buf.writeUInt8(gg, idx + 1)   // G
        buf.writeUInt8(rr, idx + 2)   // R
      }
      buf.writeUInt8(255, idx + 3)    // Alpha
    }
  }
})

fs.mkdirSync('build', { recursive: true })
fs.writeFileSync('build/icon.ico', buf)
console.log(`Icon created: build/icon.ico (${buf.length} bytes, ${sizes.length} sizes: ${sizes.join(', ')})`)
