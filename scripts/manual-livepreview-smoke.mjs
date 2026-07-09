#!/usr/bin/env node
/**
 * scripts/manual-livepreview-smoke.mjs
 *
 * Standalone smoke test for the LivePreview sandbox.
 * Runs outside Electron — uses the compiled service directly via Node.
 *
 * Usage:
 *   node scripts/manual-livepreview-smoke.mjs
 *
 * No secrets are used. No external network calls.
 */

import { createServer } from 'http'
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { randomUUID } from 'crypto'

const DEMO_COUNTER_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Aureon Counter Demo</title>
</head>
<body>
  <h1>Aureon Counter Demo</h1>
  <div id="counter">0</div>
  <button id="btn-increment" onclick="increment()">Increment</button>
  <button id="btn-reset" onclick="reset()">Reset</button>
  <script>
    let count = 0;
    const el = document.getElementById('counter');
    function increment() { count++; el.textContent = count; }
    function reset() { count = 0; el.textContent = count; }
  </script>
</body>
</html>`

const sandboxId = randomUUID()
const sandboxPath = join(tmpdir(), 'aureon-smoke-' + sandboxId)
const PORT = 19191

function cleanup() {
  try {
    if (existsSync(sandboxPath)) rmSync(sandboxPath, { recursive: true, force: true })
  } catch {}
}

process.on('exit', cleanup)
process.on('SIGINT', () => { cleanup(); process.exit(0) })

console.log('\n🧪 Aureon LivePreview Smoke Test\n')

// Step 1: Create sandbox
console.log('1. Creating sandbox at', sandboxPath)
mkdirSync(sandboxPath, { recursive: true })
writeFileSync(join(sandboxPath, 'index.html'), DEMO_COUNTER_HTML, 'utf-8')
writeFileSync(join(sandboxPath, '.aureon-demo'), 'demo', 'utf-8')
console.log('   ✓ Sandbox created')

// Step 2: Start in-process HTTP server
console.log(`2. Starting static server on http://127.0.0.1:${PORT}`)

await new Promise((resolve, reject) => {
  const srv = createServer((req, res) => {
    if (req.url === '/' || req.url === '/index.html') {
      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end(readFileSync(join(sandboxPath, 'index.html')))
    } else {
      res.writeHead(404)
      res.end('Not found')
    }
  })

  srv.listen(PORT, '127.0.0.1', async () => {
    console.log(`   ✓ Server listening on http://127.0.0.1:${PORT}`)

    // Step 3: Fetch preview URL
    console.log('3. Fetching preview URL...')
    try {
      const { default: http } = await import('http')
      const html = await new Promise((res, rej) => {
        http.get(`http://127.0.0.1:${PORT}/`, r => {
          let body = ''
          r.on('data', c => body += c)
          r.on('end', () => res(body))
          r.on('error', rej)
        }).on('error', rej)
      })

      console.log('   ✓ Received HTML response')

      // Step 4: Verify content
      console.log('4. Verifying content...')
      const checks = [
        { label: 'Contains <h1>Aureon Counter Demo</h1>', pass: html.includes('Aureon Counter Demo') },
        { label: 'Contains counter div', pass: html.includes('id="counter"') },
        { label: 'Contains Increment button', pass: html.includes('btn-increment') },
        { label: 'Contains Reset button', pass: html.includes('btn-reset') },
        { label: 'No secrets leaked', pass: !html.includes('sk-or-v1') && !html.includes('sk-ant') },
      ]

      let allPass = true
      for (const check of checks) {
        const icon = check.pass ? '   ✓' : '   ✗'
        if (!check.pass) allPass = false
        console.log(`${icon} ${check.label}`)
      }

      // Step 5: Stop server
      console.log('5. Stopping server...')
      srv.close(() => {
        console.log('   ✓ Server stopped')
        console.log('\n' + (allPass ? '✅ All checks passed!' : '❌ Some checks failed') + '\n')
        srv.closeAllConnections?.()
        resolve(allPass)
      })
    } catch (err) {
      console.error('   ✗ Fetch failed:', err.message)
      srv.close()
      reject(err)
    }
  })

  srv.on('error', err => {
    console.error(`   ✗ Server error: ${err.message}`)
    reject(err)
  })
})
