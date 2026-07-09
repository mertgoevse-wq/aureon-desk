import { createRequire } from 'module'
import path from 'path'
import fs from 'fs'

const require = createRequire(import.meta.url)

// 1. Intercept require and mock electron app before loading services
const Module = require('module')
const originalLoad = Module._load
Module._load = function (request, parent, isMain) {
  if (request === 'electron') {
    return {
      app: {
        getPath: (name) => {
          const tempDir = path.resolve('./scratch/test-userdata')
          if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })
          return tempDir
        },
        on: () => {}
      }
    }
  }
  return originalLoad.apply(this, arguments)
}

// Mock logger to prevent stdout pollution
const mockLogger = {
  info: (msg) => console.log(`[LOG-INFO] ${msg}`),
  error: (msg) => console.error(`[LOG-ERROR] ${msg}`)
}
// Inject mock logger into global space before imports
globalThis.mockLogger = mockLogger

// 2. Import live preview service
const { livePreviewService } = require('../src/main/services/live-preview.service.ts')

async function runSmokeTest() {
  console.log('[SMOKE] Starting LivePreview service smoke test...')
  
  try {
    // 3. Start unified generated flow
    const status = livePreviewService.startGeneratedPreview({
      source: 'studio-build-app',
      style: 'Soft Teal',
      port: 3200
    })

    console.log(`[SMOKE] Server status: ${status.status}`)
    console.log(`[SMOKE] Sandbox path: ${status.sandboxPath}`)
    console.log(`[SMOKE] Sandbox URL: ${status.url}`)

    if (status.status === 'error') {
      throw new Error(`Failed to start preview: ${status.error}`)
    }

    // Give HTTP server a split second to bind (usually immediate)
    await new Promise(r => setTimeout(r, 200))

    // 4. Request sandbox URL
    console.log(`[SMOKE] Fetching preview index from ${status.url}...`)
    const response = await fetch(status.url)
    if (!response.ok) {
      throw new Error(`HTTP fetch failed with code ${response.status}`)
    }

    const htmlText = await response.text()
    
    // 5. Assertions
    const titleMatch = htmlText.includes('<title>Aureon Counter Demo</title>')
    const tealStyleMatch = htmlText.includes('background: #F0F7F6;')
    const buttonMatch = htmlText.includes('Increment')
    
    console.log(`[SMOKE] Assert Title: ${titleMatch ? 'PASS' : 'FAIL'}`)
    console.log(`[SMOKE] Assert Theme (Teal): ${tealStyleMatch ? 'PASS' : 'FAIL'}`)
    console.log(`[SMOKE] Assert Button: ${buttonMatch ? 'PASS' : 'FAIL'}`)

    if (!titleMatch || !tealStyleMatch || !buttonMatch) {
      throw new Error('HTML content assertions failed')
    }

    console.log('[SMOKE] HTML assertions passed successfully.')

  } catch (err) {
    console.error(`[SMOKE] TEST FAILED: ${err.message}`)
    process.exit(1)
  } finally {
    // 6. Tear down preview
    console.log('[SMOKE] Stopping LivePreview server...')
    livePreviewService.stopPreview()
    console.log('[SMOKE] Teardown complete.')
  }
}

runSmokeTest()
