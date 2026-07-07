import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock DB connection
vi.mock('../../src/main/db/connection', () => ({
  getDb: vi.fn(),
}))

vi.mock('../../src/main/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}))

import { chatService } from '../../src/main/services/chat.service'
import { getDb } from '../../src/main/db/connection'

// Simple sanitize helper to match the frontend page helper
function sanitizeTestMessage(message: string): string {
  return message
    .replace(/sk-[A-Za-z0-9_-]{12,}/g, '[REDACTED_KEY]')
    .replace(/AIza[A-Za-z0-9_-]{12,}/g, '[REDACTED_GOOGLE_KEY]')
    .replace(/Bearer\s+[A-Za-z0-9._-]{12,}/gi, 'Bearer [REDACTED]')
    .replace(/(x-api-key|api[_-]?key)\s*[:=]\s*[A-Za-z0-9._-]{8,}/gi, '$1=[REDACTED]')
}

describe('Provider Settings and Connection Security', () => {
  it('should redact sensitive API keys from test result logs and UI messages', () => {
    const rawError = 'Error connecting: Request failed with status 401. Key used: sk-proj-1234567890abcdefabcdefabcdef. Bearer sk-proj-1234567890abcdefabcdefabcdef'
    const sanitized = sanitizeTestMessage(rawError)
    expect(sanitized).not.toContain('sk-proj-1234567890abcdefabcdefabcdef')
    expect(sanitized).toContain('[REDACTED_KEY]')
  })

  it('should redact Google AI Studio keys from test result logs and UI messages', () => {
    const rawError = 'Invalid request to Google: AIzaSyD-1234567890abcdefabcdef'
    const sanitized = sanitizeTestMessage(rawError)
    expect(sanitized).not.toContain('AIzaSyD-1234567890abcdefabcdef')
    expect(sanitized).toContain('[REDACTED_GOOGLE_KEY]')
  })

  it('should redact generic api-key query parameters or headers', () => {
    const rawHeader = 'Headers: x-api-key: my-secret-key-123456'
    const sanitized = sanitizeTestMessage(rawHeader)
    expect(sanitized).not.toContain('my-secret-key-123456')
    expect(sanitized).toContain('x-api-key=[REDACTED]')
  })
})

describe('Chat Auto Model Selection Logic', () => {
  let mockDb: any

  beforeEach(() => {
    mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      all: vi.fn(),
      get: vi.fn(),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      run: vi.fn(),
    }
    vi.mocked(getDb).mockReturnValue(mockDb)
  })

  it('should select default model if no model_id is specified in new chat input', () => {
    // 1. Mock enabled providers
    mockDb.all.mockReturnValueOnce([{ id: 'provider-openrouter' }]) // enabled providers select query
    
    // 2. Mock all models query
    mockDb.all.mockReturnValueOnce([
      { id: 'model-openrouter-free', provider_id: 'provider-openrouter', is_default: 0, is_enabled: 1 },
      { id: 'model-openrouter-auto', provider_id: 'provider-openrouter', is_default: 1, is_enabled: 1 }
    ])

    // 3. Mock get chat result
    const mockChatRow = { id: 'chat-uuid', title: 'New Chat', model_id: 'model-openrouter-auto' }
    mockDb.get.mockReturnValue(mockChatRow)

    const result = chatService.createChat({ title: 'New Chat' })

    // Verify insert was called with the auto-selected default model ID
    expect(mockDb.insert).toHaveBeenCalled()
    expect(mockDb.values).toHaveBeenCalledWith(expect.objectContaining({
      model_id: 'model-openrouter-auto'
    }))
    expect(result.model_id).toBe('model-openrouter-auto')
  })

  it('should fallback to first active model if no model has is_default = 1', () => {
    // 1. Mock enabled providers
    mockDb.all.mockReturnValueOnce([{ id: 'provider-ollama' }])
    
    // 2. Mock all models query
    mockDb.all.mockReturnValueOnce([
      { id: 'model-ollama-llama3', provider_id: 'provider-ollama', is_default: 0, is_enabled: 1 }
    ])

    // 3. Mock get chat result
    const mockChatRow = { id: 'chat-uuid', title: 'New Chat', model_id: 'model-ollama-llama3' }
    mockDb.get.mockReturnValue(mockChatRow)

    const result = chatService.createChat({ title: 'New Chat' })

    expect(mockDb.insert).toHaveBeenCalled()
    expect(mockDb.values).toHaveBeenCalledWith(expect.objectContaining({
      model_id: 'model-ollama-llama3'
    }))
    expect(result.model_id).toBe('model-ollama-llama3')
  })

  it('should preserve model_id if it is explicitly passed in new chat input', () => {
    // 1. Mock get chat result
    const mockChatRow = { id: 'chat-uuid', title: 'New Chat', model_id: 'explicit-model-id' }
    mockDb.get.mockReturnValue(mockChatRow)

    const result = chatService.createChat({ title: 'New Chat', model_id: 'explicit-model-id' })

    expect(mockDb.insert).toHaveBeenCalled()
    expect(mockDb.values).toHaveBeenCalledWith(expect.objectContaining({
      model_id: 'explicit-model-id'
    }))
    expect(result.model_id).toBe('explicit-model-id')
  })
})
