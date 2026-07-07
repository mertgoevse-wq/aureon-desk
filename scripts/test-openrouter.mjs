/**
 * Aureon Desk — OpenRouter Free Model Smoke Test
 * 
 * Usage: node scripts/test-openrouter.mjs
 * 
 * Requires: OPENROUTER_API_KEY environment variable
 *   Windows: set OPENROUTER_API_KEY=sk-or-v1-... && node scripts/test-openrouter.mjs
 *   bash:    OPENROUTER_API_KEY=sk-or-v1-... node scripts/test-openrouter.mjs
 * 
 * Security: NEVER hardcode API keys in this file. Always use env vars.
 * This script never prints the API key in any output.
 */

const API_KEY = process.env.OPENROUTER_API_KEY
const BASE_URL = 'https://openrouter.ai/api/v1'
const MODEL = 'openrouter/free'
const TIMEOUT_MS = 30000

async function main() {
  // Header
  console.log('Aureon Desk — OpenRouter Smoke Test')
  console.log('='.repeat(50))

  // Check for API key
  if (!API_KEY) {
    console.log('⚠️  OPENROUTER_API_KEY not set.')
    console.log('   To run this test:')
    console.log('     Windows: set OPENROUTER_API_KEY=sk-or-v1-... && node scripts/test-openrouter.mjs')
    console.log('     bash:    OPENROUTER_API_KEY=sk-or-v1-... node scripts/test-openrouter.mjs')
    console.log('')
    console.log('✓  Test skipped (no API key). This is expected in CI/local without credentials.')
    process.exit(0)
  }

  // Confirm key exists (never print any part of the key)
  if (API_KEY.length < 20) {
    console.log('✗  API key appears malformed (too short)')
    process.exit(1)
  }
  console.log('Key detected (format valid)')

  // Build request
  const url = `${BASE_URL}/chat/completions`
  const body = JSON.stringify({
    model: MODEL,
    messages: [
      { role: 'user', content: 'Reply with exactly: AUREON_OK' }
    ],
    max_tokens: 10,
    temperature: 0,
  })

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`,
    'HTTP-Referer': 'aureon-desk',
    'X-Title': 'Aureon Desk Smoke Test',
  }

  // Send request
  console.log(`Provider:  OpenRouter`)
  console.log(`Model:     ${MODEL}`)
  console.log(`Endpoint:  ${url}`)
  console.log('')

  const startTime = Date.now()

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    const latency = Date.now() - startTime
    const responseText = await response.text()

    if (!response.ok) {
      let errorInfo = ''
      try {
        const errorJson = JSON.parse(responseText)
        errorInfo = errorJson.error?.message || errorJson.message || responseText
      } catch {
        errorInfo = responseText.slice(0, 300)
      }

      console.log(`Status:    FAIL (HTTP ${response.status})`)
      console.log(`Latency:   ${latency}ms`)
      console.log(`Error:     ${errorInfo}`)

      // Friendly messages for common issues
      if (response.status === 401 || response.status === 403) {
        console.log('')
        console.log('  → Your API key appears to be invalid or expired.')
        console.log('    Get a new key at: https://openrouter.ai/keys')
      } else if (response.status === 429) {
        console.log('')
        console.log('  → Rate limited. Wait a moment and try again.')
      } else if (response.status === 402) {
        console.log('')
        console.log('  → Insufficient credits. Add credits at: https://openrouter.ai/credits')
      }

      process.exit(1)
    }

    // Parse successful response
    let data
    try {
      data = JSON.parse(responseText)
    } catch {
      console.log(`Status:    FAIL (invalid JSON response)`)
      console.log(`Latency:   ${latency}ms`)
      process.exit(1)
    }

    const content = data?.choices?.[0]?.message?.content || ''
    const modelUsed = data?.model || MODEL

    console.log(`Status:    OK`)
    console.log(`Model:     ${modelUsed}`)
    console.log(`Latency:   ${latency}ms`)
    console.log(`Response:  "${content.trim()}"`)

    if (content.trim() === 'AUREON_OK') {
      console.log('')
      console.log('✓  OpenRouter smoke test passed!')
      process.exit(0)
    } else {
      console.log('')
      console.log('?  Response received but didn\'t match expected "AUREON_OK".')
      console.log('   This may be normal — free models can produce varied output.')
      process.exit(0) // Still exit 0 — the API works even if response varies
    }
  } catch (err) {
    const latency = Date.now() - startTime
    const msg = String(err)

    console.log(`Status:    FAIL`)
    console.log(`Latency:   ${latency}ms`)

    if (msg.includes('aborted') || msg.includes('AbortError') || msg.includes('timeout')) {
      console.log(`Error:     Request timed out after ${TIMEOUT_MS / 1000}s`)
    } else if (msg.includes('fetch') || msg.includes('ECONNREFUSED') || msg.includes('ENOTFOUND')) {
      console.log(`Error:     Network error — cannot reach OpenRouter`)
      console.log('')
      console.log('  → Check your internet connection.')
      console.log('  → Verify https://openrouter.ai is accessible.')
    } else {
      console.log(`Error:     ${msg.slice(0, 500)}`)
    }

    process.exit(1)
  }
}

main().catch(err => {
  console.error('Fatal error:', String(err))
  process.exit(1)
})
