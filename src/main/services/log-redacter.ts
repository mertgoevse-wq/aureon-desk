/**
 * Unified log redaction utility.
 * Redacts API keys, tokens, Authorization headers, and secrets from log output.
 * Consolidated from request-builder.ts and tool-safety-gate.ts.
 */

const REDACTION_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  // Specific keys first (before generic catch-alls)
  // Anthropic key: sk-ant-...
  { pattern: /sk-ant-[a-zA-Z0-9_-]{20,}/g, replacement: '[REDACTED_ANTHROPIC_KEY]' },
  // OpenAI key: sk-proj-..., sk-org-...
  { pattern: /sk-(?:proj|org)-[a-zA-Z0-9]{32,}/g, replacement: '[REDACTED_OPENAI_KEY]' },
  // Google AI key: AIza... (35 chars after AIza = 39 total)
  { pattern: /AIza[0-9A-Za-z_-]{20,}/g, replacement: '[REDACTED_GOOGLE_KEY]' },
  // Generic sk- keys (catch remaining — order matters: must be AFTER specific patterns)
  { pattern: /sk-[a-zA-Z0-9_-]{20,}/g, replacement: '[REDACTED_KEY]' },
  // Bearer tokens
  { pattern: /Bearer\s+[a-zA-Z0-9._\-+/=]{20,}/gi, replacement: 'Bearer [REDACTED]' },
  // x-api-key / api-key / api_key / apikey headers
  { pattern: /(x-api-key|api-key|api_key|apikey)\s*[:=]\s*[^\s,&]+/gi, replacement: '$1=[REDACTED]' },
  // Authorization header values
  { pattern: /Authorization\s*[:=]\s*[^\s,&]+/gi, replacement: 'Authorization=[REDACTED]' },
  // Generic secret/token/password assignment
  { pattern: /(secret|token|password|passwd)\s*[:=]\s*["']?[^\s"']{4,}["']?/gi, replacement: '$1=[REDACTED]' },
  // Private key BEGIN/END blocks
  { pattern: /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----[^]*?-----END\s+(?:RSA\s+)?PRIVATE\s+KEY-----/g, replacement: '[REDACTED_PRIVATE_KEY]' },
]

/**
 * Redact all known secret patterns from a string.
 */
export function redactSecrets(text: string): string {
  let result = text
  for (const { pattern, replacement } of REDACTION_PATTERNS) {
    result = result.replace(pattern, replacement)
  }
  return result
}

/**
 * Redact secrets from an object's values (shallow).
 */
export function redactObject(obj: Record<string, unknown>): Record<string, unknown> {
  const redacted: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      redacted[key] = redactSecrets(value)
    } else if (typeof value === 'object' && value !== null) {
      redacted[key] = redactObject(value as Record<string, unknown>)
    } else {
      redacted[key] = value
    }
  }
  return redacted
}

/**
 * Check if a string contains any secrets.
 */
export function containsSecrets(text: string): boolean {
  for (const { pattern } of REDACTION_PATTERNS) {
    const cleaned = new RegExp(pattern.source, 'g') // fresh regex to avoid lastIndex
    if (cleaned.test(text)) return true
  }
  return false
}
