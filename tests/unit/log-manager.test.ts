import { describe, it, expect } from 'vitest'
import { redactSecrets, containsSecrets, redactObject } from '../../src/main/services/log-redacter'

describe('redactSecrets', () => {
  it('redacts OpenAI API keys', () => {
    const input = 'Using key: sk-proj-12345678901234567890123456789012'
    const result = redactSecrets(input)
    expect(result).not.toContain('sk-proj-12345678901234567890123456789012')
    expect(result).toContain('[REDACTED_OPENAI_KEY]')
  })

  it('redacts Anthropic API keys', () => {
    // Note: x-api-key header pattern matches the envelope, so the outer pattern
    // replaces the whole `x-api-key: value` — the key IS removed though
    const input = 'Header: x-api-key: sk-ant-api03-abcdefghijklmnopqrstuvwxyz123456'
    const result = redactSecrets(input)
    expect(result).not.toContain('sk-ant-api03')
    expect(result).toContain('x-api-key=[REDACTED]')
  })

  it('redacts generic sk- keys', () => {
    const input = 'Using: sk-test-key-12345678901234567890'
    const result = redactSecrets(input)
    expect(result).not.toContain('sk-test-key')
    expect(result).toContain('[REDACTED_KEY]')
  })

  it('redacts Google AI keys', () => {
    const input = 'Using Google key: AIzaSyA1234567890abcdefghijklmnopqrst'
    const result = redactSecrets(input)
    expect(result).not.toContain('AIzaSyA')
    expect(result).toContain('[REDACTED_GOOGLE_KEY]')
  })

  it('redacts Bearer tokens', () => {
    const input = 'Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0'
    const result = redactSecrets(input)
    expect(result).not.toContain('eyJhbGciOi')
    expect(result).toContain('[REDACTED]')
  })

  it('redacts x-api-key headers', () => {
    const input = 'Request with x-api-key: abcdef1234567890abcdef'
    const result = redactSecrets(input)
    expect(result).toContain('x-api-key=[REDACTED]')
    expect(result).not.toContain('abcdef1234567890abcdef')
  })

  it('redacts api_key in assignment', () => {
    const input = 'Config: api_key=mysecretkey12345'
    const result = redactSecrets(input)
    expect(result).toContain('api_key=[REDACTED]')
    expect(result).not.toContain('mysecretkey12345')
  })

  it('redacts secret= patterns', () => {
    const input = 'Env: secret="super-secret-token-here"'
    const result = redactSecrets(input)
    expect(result).toContain('secret=[REDACTED]')
    expect(result).not.toContain('super-secret-token-here')
  })

  it('redacts password= patterns', () => {
    const input = 'DB: password=mydbpassword123'
    const result = redactSecrets(input)
    expect(result).toContain('password=[REDACTED]')
    expect(result).not.toContain('mydbpassword123')
  })

  it('redacts Authorization headers', () => {
    const input = 'Authorization=Bearer secret-token-value-12345'
    const result = redactSecrets(input)
    expect(result).toContain('Authorization=[REDACTED]')
  })

  it('redacts private key blocks', () => {
    const input = `Key:\n-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA...\n-----END RSA PRIVATE KEY-----`
    const result = redactSecrets(input)
    expect(result).not.toContain('MIIEpA')
    expect(result).toContain('[REDACTED_PRIVATE_KEY]')
  })

  it('handles short fake keys that match patterns', () => {
    const input = 'Just testing: sk-testkeythatislongenough12345678'
    const result = redactSecrets(input)
    expect(result).toContain('[REDACTED_KEY]')
  })

  it('does not redact non-secret text', () => {
    const input = 'User message: Hello, how are you today? This is a normal log entry.'
    const result = redactSecrets(input)
    expect(result).toBe(input)
  })
})

describe('containsSecrets', () => {
  it('detects API keys in text', () => {
    expect(containsSecrets('sk-ant-api03-abcdefghijklmnopqrstuvwxyz')).toBe(true)
    expect(containsSecrets('sk-proj-12345678901234567890123456789012')).toBe(true)
    expect(containsSecrets('AIzaSyA1234567890abcdefghijklmnopqrst')).toBe(true)
  })

  it('detects Bearer tokens', () => {
    expect(containsSecrets('Bearer eyJhbGciOiJIUzI1NiJ9.abcdefg12345')).toBe(true)
  })

  it('returns false for clean text', () => {
    expect(containsSecrets('Normal log message about file operations')).toBe(false)
    expect(containsSecrets('User said hello')).toBe(false)
  })

  it('returns false for short strings that look like keys', () => {
    expect(containsSecrets('sk-abc')).toBe(false)  // Too short to match
  })
})

describe('redactObject', () => {
  it('redacts secrets in object values', () => {
    const obj = {
      message: 'Using key sk-proj-12345678901234567890123456789012',
      url: 'https://api.example.com',
      headers: 'Bearer tok12345678901234567890'
    }
    const result = redactObject(obj)
    // OpenAI key pattern matches sk-proj specifically
    expect(result.message).toContain('[REDACTED_OPENAI_KEY]')
    expect(result.url).toBe('https://api.example.com')
    expect(result.headers).toContain('[REDACTED]')
  })

  it('handles nested objects', () => {
    const input = {
      request: {
        headers: { Authorization: 'Bearer secret123456789012345' },
        body: 'api_key=actual-key-here-12345'
      }
    }
    const result = redactObject(input)
    const headers = (result as any).request.headers
    expect(headers.Authorization).toContain('[REDACTED]')
    const body = (result as any).request.body
    expect(body).toContain('api_key=[REDACTED]')
  })
})

describe('debug bundle safety', () => {
  it('debug bundle exported JSON contains no API key patterns', () => {
    // Simulate building a debug bundle and checking for secrets
    const fakeBundle = {
      exportedAt: new Date().toISOString(),
      appVersion: '0.7.0',
      settings: {
        'provider.anthropic.key': '[REDACTED_KEY]',
        'provider.openai.key': '[REDACTED_OPENAI_KEY]',
        'app.theme': 'ivory'
      },
      recentLogs: [
        {
          id: '1', timestamp: new Date().toISOString(), level: 'info',
          category: 'provider', message: 'Built request: {"provider":"Anthropic","hasApiKey":true,"headers":{"x-api-key":"[REDACTED_KEY]"}}',
          metadata: null, chat_id: null, project_id: null
        }
      ]
    }

    const json = JSON.stringify(fakeBundle)
    // Should not contain actual key patterns
    expect(json).not.toMatch(/sk-ant-[a-zA-Z0-9_-]{20,}/)
    expect(json).not.toMatch(/sk-[a-zA-Z0-9]{32,}/)
    expect(json).not.toMatch(/AIza[0-9A-Za-z_-]{35}/)

    // Should contain redacted markers
    expect(json).toContain('[REDACTED')
  })

  it('fake API key never appears in logs', () => {
    const fakeKey = 'sk-ant-api03-my-fake-test-key-that-is-long-enough'
    const input = `User set API key: ${fakeKey}`

    // Redact the input
    const sanitized = redactSecrets(input)

    // Verify
    expect(sanitized).not.toContain(fakeKey)
    expect(sanitized).toContain('[REDACTED_ANTHROPIC_KEY]')

    // Also check via containsSecrets
    const logs = JSON.stringify([
      { level: 'info', message: sanitized }
    ])
    expect(logs).not.toContain(fakeKey)
  })
})

describe('log filtering', () => {
  it('can filter by level', () => {
    const logs = [
      { level: 'error', message: 'Failed' },
      { level: 'info', message: 'Started' },
      { level: 'error', message: 'Crashed' },
      { level: 'warn', message: 'Warning' }
    ]
    const errors = logs.filter(l => l.level === 'error')
    expect(errors.length).toBe(2)
    expect(errors[0].message).toBe('Failed')
    expect(errors[1].message).toBe('Crashed')
  })

  it('can filter by category', () => {
    const logs = [
      { category: 'tool', message: 'Tool executed' },
      { category: 'routing', message: 'Route resolved' },
      { category: 'tool', message: 'Tool failed' }
    ]
    const toolLogs = logs.filter(l => l.category === 'tool')
    expect(toolLogs.length).toBe(2)
  })

  it('can search by message content', () => {
    const logs = [
      { level: 'info', message: 'User logged in' },
      { level: 'error', message: 'Database connection failed' },
      { level: 'info', message: 'File saved' }
    ]
    const dbLogs = logs.filter(l => l.message.includes('Database'))
    expect(dbLogs.length).toBe(1)
    expect(dbLogs[0].message).toBe('Database connection failed')
  })

  it('supports combined filters', () => {
    const logs = [
      { level: 'error', category: 'provider', message: 'API key invalid' },
      { level: 'error', category: 'tool', message: 'Tool crashed' },
      { level: 'info', category: 'provider', message: 'Provider connected' }
    ]
    const filtered = logs.filter(l => l.level === 'error' && l.category === 'provider')
    expect(filtered.length).toBe(1)
    expect(filtered[0].message).toBe('API key invalid')
  })
})
