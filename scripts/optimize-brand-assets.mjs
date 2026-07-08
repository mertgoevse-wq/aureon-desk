/**
 * Aureon Desk Brand Asset Optimizer
 *
 * Reads source originals from assets/brand/source/nano-banana/
 * and creates optimized runtime copies in public/brand/ and assets/brand/.
 *
 * Uses the canvas package for resizing. Falls back to documentation if unavailable.
 */

import { createCanvas, loadImage } from 'canvas'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = join(__dirname, '..')

const SOURCE_DIR = join(PROJECT_ROOT, 'assets/brand/source/nano-banana')
const PUBLIC_DIR = join(PROJECT_ROOT, 'public/brand')
const ASSETS_DIR = join(PROJECT_ROOT, 'assets/brand')

// Ensure output directories exist
mkdirSync(PUBLIC_DIR, { recursive: true })
mkdirSync(ASSETS_DIR, { recursive: true })

async function resizeImage(inputPath, outputPath, targetWidth) {
  console.log(`  Loading: ${inputPath}`)
  const buffer = readFileSync(inputPath)
  const image = await loadImage(buffer)

  // Calculate proportional height
  const aspectRatio = image.height / image.width
  const targetHeight = Math.round(targetWidth * aspectRatio)

  const canvas = createCanvas(targetWidth, targetHeight)
  const ctx = canvas.getContext('2d')

  // Use best quality downscaling
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  ctx.drawImage(image, 0, 0, targetWidth, targetHeight)

  const outputBuffer = canvas.toBuffer('image/png', {
    compressionLevel: 9,
    filters: canvas.PNG_ALL_FILTERS
  })

  writeFileSync(outputPath, outputBuffer)
  const sizeKB = (outputBuffer.length / 1024).toFixed(1)
  console.log(`  Written: ${outputPath} (${sizeKB} KB)`)
}

async function main() {
  console.log('Aureon Desk — Brand Asset Optimizer\n')

  const sourceFiles = {
    'aureon-mark-monochrome.png': { basename: 'aureon-mark', targets: [128, 256] },
    'aureon-logo-light.png': { basename: 'aureon-logo', targets: [512] },
    'aureon-github-banner.png': { basename: 'aureon-github-banner', targets: [1200] },
  }

  let totalBefore = 0
  let totalAfter = 0

  for (const [sourceFile, config] of Object.entries(sourceFiles)) {
    const sourcePath = join(SOURCE_DIR, sourceFile)
    if (!existsSync(sourcePath)) {
      console.log(`  SKIP: ${sourcePath} not found`)
      continue
    }

    const sourceSize = readFileSync(sourcePath).length
    totalBefore += sourceSize

    for (const width of config.targets) {
      let outputDir
      if (sourceFile === 'aureon-github-banner.png') {
        outputDir = ASSETS_DIR
      } else {
        outputDir = PUBLIC_DIR
      }

      const outputPath = join(outputDir, `${config.basename}-${width}.png`)
      await resizeImage(sourcePath, outputPath, width)

      if (existsSync(outputPath)) {
        totalAfter += readFileSync(outputPath).length
      }
    }
  }

  // Also create icon-sized mark (64px) for in-app use
  const markSource = join(SOURCE_DIR, 'aureon-mark-monochrome.png')
  if (existsSync(markSource)) {
    const iconPath = join(PUBLIC_DIR, 'aureon-mark-64.png')
    await resizeImage(markSource, iconPath, 64)
    if (existsSync(iconPath)) {
      totalAfter += readFileSync(iconPath).length
    }
  }

  // Create a reasonable-sized app icon in assets for potential use
  const appIconSource = join(SOURCE_DIR, 'aureon-app-icon.png')
  if (existsSync(appIconSource)) {
    const appIconPath = join(ASSETS_DIR, 'aureon-app-icon-256.png')
    await resizeImage(appIconSource, appIconPath, 256)
    if (existsSync(appIconPath)) {
      totalAfter += readFileSync(appIconPath).length
    }
  }

  const beforeMB = (totalBefore / 1024 / 1024).toFixed(1)
  const afterMB = (totalAfter / 1024 / 1024).toFixed(1)

  console.log(`\nDone!`)
  console.log(`  Source originals: ${beforeMB} MB (kept in assets/brand/source/nano-banana/)`)
  console.log(`  Optimized assets: ${afterMB} MB`)
  console.log(`  Reduction: ${(100 - (totalAfter / totalBefore * 100)).toFixed(0)}%`)
}

main().catch(err => {
  console.error('Optimization failed:', err.message)
  process.exit(1)
})
