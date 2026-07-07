import { describe, it, expect } from 'vitest'
import { redactSecrets, containsSecrets } from '../../src/main/services/log-redacter'

describe('Provider Security — API Key Handling', () => {
  // --- Key masking (tested inline, no Electron dependency) ---
  function maskKey(key: string): string {
    if (!key || key.length <= 8) return '****'
    return key.slice(0, 8) + '...' + key.slice(-4)
  }

  it('should mask API keys (first 8 + last 4)', () => {
    const key = 'sk-or-v1-abcdefghijklmnop12345678'
    const masked = maskKey(key)
    expect(masked).toBe('sk-or-v1...5678')
    expect(masked).not.toBe(key)
    expect(masked).toContain('...')
  })

  it('should mask short keys', () => {
    expect(maskKey('abcde')).toBe('****')
    expect(maskKey('')).toBe('****')
  })

  // --- Log redaction ---
  it('should redact sk- keys from logs', () => {
    const text = 'Headers: {"Authorization":"Bearer sk-or-v1-abcdefghijklmnop12345678"}'
    const redacted = redactSecrets(text)
    expect(redacted).not.toContain('sk-or-v1-abcdefghijklmnop12345678')
    expect(redacted).toContain('[REDACTED_KEY]')
  })

  it('should redact Authorization Bearer tokens', () => {
    const text = 'Authorization: Bearer sk-ant-api03-xxxxxxxxxxxxxyyyyyyyyyzzz'
    const redacted = redactSecrets(text)
    expect(redacted).toContain('[REDACTED_ANTHROPIC_KEY]')
    expect(redacted).not.toContain('sk-ant-api03')
  })

  it('should redact OpenAI project keys', () => {
    const text = 'Using key: sk-proj-abcdefghijklmnopqrstuvwxyz1234567890'
    const redacted = redactSecrets(text)
    expect(redacted).toContain('[REDACTED_OPENAI_KEY]')
    expect(redacted).not.toContain('sk-proj-')
  })

  it('should redact Google AI keys', () => {
    const text = 'API key: AIzaSyD1234567890abcdefghijklmnopq'
    const redacted = redactSecrets(text)
    expect(redacted).toContain('[REDACTED_GOOGLE_KEY]')
  })

  it('should redact x-api-key headers', () => {
    const text = 'x-api-key: abcdef1234567890abcdef1234567890'
    const redacted = redactSecrets(text)
    expect(redacted).toContain('[REDACTED]')
    expect(redacted).not.toContain('abcdef1234567890abcdef1234567890')
  })

  it('should redact multiple secrets in one string', () => {
    const text = 'key1: sk-abc123def456ghi789jkl012mno345pqr\nkey2: sk-ant-xyz789abc123def456ghi789jkl012'
    const redacted = redactSecrets(text)
    expect(redacted).toContain('[REDACTED_KEY]')
    expect(redacted).toContain('[REDACTED_ANTHROPIC_KEY]')
  })

  it('should not redact safe text', () => {
    const safe = 'Hello, this is normal text with model: gpt-4 and temperature: 0.7'
    expect(redactSecrets(safe)).toBe(safe)
  })

  // --- Secret detection ---
  it('should detect real API keys', () => {
    expect(containsSecrets('sk-or-v1-abcdefghijklmnop12345678')).toBe(true)
    expect(containsSecrets('sk-ant-api03-xxxxxxxxxxxxxyyyyyyyyyzzz')).toBe(true)
    expect(containsSecrets('Bearer sk-abc123def456ghi789jkl012mno345pqr')).toBe(true)
  })

  it('should not flag regular model names as secrets', () => {
    expect(containsSecrets('model: gpt-4-turbo')).toBe(false)
    expect(containsSecrets('Using openrouter/free model')).toBe(false)
  })

  // --- Masked keys must not be recoverable ---
  it('masked key should not equal original', () => {
    const raw = 'sk-test-key-12345678'
    const masked = maskKey(raw)
    expect(masked).not.toBe(raw)
    expect(masked).toContain('...')
    expect(masked.length).toBeLessThan(raw.length)
  })

  it('masking should be deterministic', () => {
    const key = 'sk-abcdefghijklmnop'
    expect(maskKey(key)).toBe(maskKey(key))
  })
})
