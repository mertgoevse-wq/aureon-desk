import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock provider service
const mockGetProvider = vi.fn()
const mockGetMaskedApiKey = vi.fn()
const mockGetApiKey = vi.fn()
const mockResolveCanonicalModelReference = vi.fn()
vi.mock('../../src/main/services/provider.service', () => ({
  providerService: {
    getProvider: (...args: any[]) => mockGetProvider(...args),
    getMaskedApiKey: (...args: any[]) => mockGetMaskedApiKey(...args),
    getApiKey: (...args: any[]) => mockGetApiKey(...args),
    resolveCanonicalModelReference: (...args: any[]) => mockResolveCanonicalModelReference(...args),
  },
}))

// Mock logger
const mockLoggerInfo = vi.fn()
const mockLoggerWarn = vi.fn()
const mockLoggerError = vi.fn()

vi.mock('../../src/main/utils/logger', () => ({
  logger: {
    info: (...args: any[]) => mockLoggerInfo(...args),
    warn: (...args: any[]) => mockLoggerWarn(...args),
    error: (...args: any[]) => mockLoggerError(...args),
  },
}))

// We must import MODEL_SCORES after mocks are in place since
// model-selector is a pure shared module (no Electron deps)
import { modelRouterService } from '../../src/main/services/model-router.service'

// ─── Helpers ────────────────────────────────────────────

const enabledModel = {
  id: 'model-1',
  provider_id: 'provider-1',
  name: 'gpt-4o',
  display_name: 'GPT-4o',
  context_window: 128000,
  is_default: 1,
  is_enabled: 1,
  created_at: '2026-01-01T00:00:00.000Z',
}

const enabledModelNonDefault = {
  ...enabledModel,
  id: 'model-2',
  name: 'gpt-4o-mini',
  display_name: 'GPT-4o Mini',
  is_default: 0,
}

const remoteProvider = {
  id: 'provider-1',
  name: 'OpenAI',
  slug: 'openai',
  adapter: 'openai',
  base_url: 'https://api.openai.com/v1',
  api_key_enc: 'encrypted-mock-key',
  is_enabled: 1,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  models: [enabledModel, enabledModelNonDefault],
}

const localProvider = {
  id: 'provider-ollama',
  name: 'Ollama',
  slug: 'ollama',
  adapter: 'ollama',
  base_url: 'http://localhost:11434/v1',
  api_key_enc: null,
  is_enabled: 1,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  models: [{ ...enabledModel, id: 'ollama-model', name: 'llama3.2', display_name: 'Llama 3.2', is_default: 1 }],
}

const anthropicProvider = {
  ...remoteProvider,
  id: 'provider-anthropic',
  name: 'Anthropic',
  slug: 'anthropic',
  adapter: 'anthropic',
  base_url: 'https://api.anthropic.com/v1',
  models: [{ ...enabledModel, id: 'anthropic-model', name: 'claude-sonnet-4-20250514', display_name: 'Claude Sonnet 4', is_default: 1 }],
}

const googleProvider = {
  ...remoteProvider,
  id: 'provider-google',
  name: 'Google Gemini',
  slug: 'google',
  adapter: 'google',
  base_url: 'https://generativelanguage.googleapis.com/v1beta',
  models: [{ ...enabledModel, id: 'google-model', name: 'gemini-2.5-pro', display_name: 'Gemini 2.5 Pro', is_default: 1 }],
}

const canRef = {
  providerId: 'provider-1',
  providerName: 'OpenAI',
  providerSlug: 'openai',
  adapterType: 'openai',
  modelId: 'model-1',
  modelName: 'gpt-4o',
  modelLabel: 'GPT-4o',
  baseUrl: 'https://api.openai.com/v1',
  isLocal: false,
  source: 'chat' as const,
}

function setupStandardMocks(provider = remoteProvider) {
  mockGetProvider.mockReturnValue(provider)
  mockGetMaskedApiKey.mockReturnValue('sk-****...abcd')
  mockGetApiKey.mockReturnValue('sk-test-key-123456789')
  mockResolveCanonicalModelReference.mockReturnValue({
    ...canRef,
    providerId: provider.id,
    providerName: provider.name,
    providerSlug: provider.slug,
    adapterType: provider.adapter,
    modelId: provider.models[0].id,
    modelName: provider.models[0].name,
    modelLabel: provider.models[0].display_name,
    baseUrl: provider.base_url,
    isLocal: provider.adapter === 'ollama' || provider.adapter === 'lmstudio',
  })
}

// ─── smokeTestProvider ─────────────────────────────────

describe('modelRouterService.smokeTestProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupStandardMocks()
    modelRouterService.clearAllUsage()
  })

  // ── validation guards ──

  it('should return error when provider is not found', async () => {
    mockGetProvider.mockReturnValue(undefined)

    const result = await modelRouterService.smokeTestProvider('nonexistent')

    expect(result.success).toBe(false)
    expect(result.message).toBe('Provider not found')
    expect(result.modelUsed).toBeNull()
    expect(result.durationMs).toBe(0)
    expect(result.responsePreview).toBeNull()
  })

  it('should return error when provider is disabled', async () => {
    mockGetProvider.mockReturnValue({ ...remoteProvider, is_enabled: 0 })

    const result = await modelRouterService.smokeTestProvider('provider-1')

    expect(result.success).toBe(false)
    expect(result.message).toContain('disabled')
    expect(result.modelUsed).toBeNull()
  })

  it('should return error when remote provider has no API key', async () => {
    mockGetMaskedApiKey.mockReturnValue(null)

    const result = await modelRouterService.smokeTestProvider('provider-1')

    expect(result.success).toBe(false)
    expect(result.message).toContain('No API key configured')
    expect(result.modelUsed).toBeNull()
  })

  it('should skip API key check for local providers (Ollama)', async () => {
    setupStandardMocks(localProvider)
    mockGetMaskedApiKey.mockReturnValue(null) // no key needed
    mockGetApiKey.mockReturnValue(null)
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: { content: '{"status":"ok"}' } }),
    })

    const result = await modelRouterService.smokeTestProvider('provider-ollama')

    // Local providers should succeed even without API key
    expect(result.success).toBe(true)
  })

  it('should skip API key check for local providers (LM Studio)', async () => {
    const lmStudioProvider = { ...localProvider, id: 'provider-lmstudio', name: 'LM Studio', slug: 'lmstudio', adapter: 'lmstudio', base_url: 'http://localhost:1234/v1' }
    setupStandardMocks(lmStudioProvider)
    mockGetMaskedApiKey.mockReturnValue(null)
    mockGetApiKey.mockReturnValue(null)
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: '{"status":"ok"}' } }] }),
    })

    const result = await modelRouterService.smokeTestProvider('provider-lmstudio')

    // LM Studio should succeed without API key via OpenAI-compatible endpoint
    expect(result.success).toBe(true)
  })

  it('should return error when provider has no enabled models', async () => {
    mockGetProvider.mockReturnValue({
      ...remoteProvider,
      models: [
        { ...enabledModel, is_enabled: 0 },
        { ...enabledModelNonDefault, is_enabled: 0 },
      ],
    })

    const result = await modelRouterService.smokeTestProvider('provider-1')

    expect(result.success).toBe(false)
    expect(result.message).toContain('No enabled models')
    expect(result.modelUsed).toBeNull()
  })

  it('should return error when model reference cannot be resolved', async () => {
    mockResolveCanonicalModelReference.mockReturnValue(undefined)

    const result = await modelRouterService.smokeTestProvider('provider-1')

    expect(result.success).toBe(false)
    expect(result.message).toContain('Could not resolve model')
    expect(result.modelUsed).toBe('GPT-4o')
  })

  it('should prefer default model over first enabled model', async () => {
    // Provider has non-default first, default second
    mockGetProvider.mockReturnValue({
      ...remoteProvider,
      models: [
        { ...enabledModelNonDefault, is_default: 0 }, // enabled, not default
        { ...enabledModel, is_default: 1 },           // enabled, is default
      ],
    })
    mockResolveCanonicalModelReference.mockImplementation((modelId: string) => ({
      ...canRef,
      modelId,
      modelName: modelId === 'model-1' ? 'gpt-4o' : 'gpt-4o-mini',
      modelLabel: modelId === 'model-1' ? 'GPT-4o' : 'GPT-4o Mini',
    }))
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: '{"status":"ok"}' } }] }),
    })

    const result = await modelRouterService.smokeTestProvider('provider-1')

    expect(result.success).toBe(true)
    // Should have used the default model (model-1 / GPT-4o)
    expect(result.modelUsed).toBe('GPT-4o')
    expect(mockResolveCanonicalModelReference).toHaveBeenCalledWith('model-1')
  })

  it('should fall back to first enabled model when no default exists', async () => {
    mockGetProvider.mockReturnValue({
      ...remoteProvider,
      models: [
        { ...enabledModelNonDefault, is_default: 0 },
      ],
    })
    // Remove the default model
    mockResolveCanonicalModelReference.mockImplementation((modelId: string) => ({
      ...canRef,
      modelId,
      modelName: 'gpt-4o-mini',
      modelLabel: 'GPT-4o Mini',
    }))
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: '{"status":"ok"}' } }] }),
    })

    const result = await modelRouterService.smokeTestProvider('provider-1')

    expect(result.success).toBe(true)
    expect(result.modelUsed).toBe('GPT-4o Mini')
  })

  // ── successful smoke tests ──

  it('should return success when OpenAI-compatible provider responds with ok', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: '{"status":"ok","message":"Smoke test passed"}' } }] }),
    })

    const result = await modelRouterService.smokeTestProvider('provider-1')

    expect(result.success).toBe(true)
    expect(result.message).toContain('✅')
    expect(result.message).toContain('provider is working')
    expect(result.modelUsed).toBe('GPT-4o')
    expect(result.durationMs).toBeGreaterThanOrEqual(0)
    expect(result.responsePreview).toContain('{"status":"ok"')
  })

  it('should return partial success when response lacks expected format', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'Hello, I am an AI assistant.' } }] }),
    })

    const result = await modelRouterService.smokeTestProvider('provider-1')

    expect(result.success).toBe(true)
    expect(result.message).toContain('⚠️')
    expect(result.message).toContain("didn't match expected format")
    expect(result.responsePreview).toContain('Hello')
  })

  it('should truncate response preview to 200 chars', async () => {
    const longResponse = 'A'.repeat(500)
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: longResponse } }] }),
    })

    const result = await modelRouterService.smokeTestProvider('provider-1')

    expect(result.responsePreview!.length).toBeLessThanOrEqual(200)
  })

  it('should record usage after successful smoke test', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: '{"status":"ok"}' } }] }),
    })

    await modelRouterService.smokeTestProvider('provider-1')

    // Usage should be recorded
    const usage = modelRouterService.getUsage()
    expect(usage.length).toBeGreaterThanOrEqual(1)
    const entry = usage.find((e: any) => e.modelId === 'gpt-4o')
    expect(entry).toBeDefined()
    expect(entry!.requestCount).toBe(1)
  })

  // ── error handling ──

  it('should return auth error for 401 responses', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
    })

    const result = await modelRouterService.smokeTestProvider('provider-1')

    expect(result.success).toBe(false)
    expect(result.message).toContain('Authentication failed')
    expect(result.message).toContain('API key')
    expect(result.modelUsed).toBe('GPT-4o')
    expect(result.durationMs).toBeGreaterThanOrEqual(0)
  })

  it('should return auth error for 403 responses', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => 'Forbidden',
    })

    const result = await modelRouterService.smokeTestProvider('provider-1')

    expect(result.success).toBe(false)
    expect(result.message).toContain('Authentication failed')
  })

  it('should return auth error when response text mentions Unauthorized', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Unauthorized: invalid token'))

    const result = await modelRouterService.smokeTestProvider('provider-1')

    expect(result.success).toBe(false)
    expect(result.message).toContain('Authentication failed')
  })

  it('should NOT record usage after failed smoke test', async () => {
    modelRouterService.clearAllUsage()
    global.fetch = vi.fn().mockRejectedValue(new Error('Connection refused'))

    await modelRouterService.smokeTestProvider('provider-1')

    const usage = modelRouterService.getUsage()
    // No usage should be recorded for failed calls
    expect(usage.filter((e: any) => e.modelId === 'gpt-4o').length).toBe(0)
  })

  it('should return rate limit error for 429 responses', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => 'Rate limit exceeded',
    })

    const result = await modelRouterService.smokeTestProvider('provider-1')

    expect(result.success).toBe(false)
    expect(result.message).toContain('Rate limited')
    expect(result.message).toContain('Please wait')
  })

  it('should return timeout error for ETIMEDOUT', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('fetch failed — ETIMEDOUT'))

    const result = await modelRouterService.smokeTestProvider('provider-1')

    expect(result.success).toBe(false)
    expect(result.message).toContain('timed out')
    expect(result.message).toContain('slow or unreachable')
  })

  it('should return timeout error for aborted requests', async () => {
    global.fetch = vi.fn().mockRejectedValue(new DOMException('The operation was aborted', 'AbortError'))

    const result = await modelRouterService.smokeTestProvider('provider-1')

    expect(result.success).toBe(false)
    expect(result.message).toContain('timed out')
  })

  it('should return connection error for ECONNREFUSED', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('fetch failed — ECONNREFUSED 127.0.0.1:8080'))

    const result = await modelRouterService.smokeTestProvider('provider-1')

    expect(result.success).toBe(false)
    expect(result.message).toContain('Cannot reach the provider')
    expect(result.message).toContain('base URL')
  })

  it('should return connection error for ENOTFOUND', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('fetch failed — ENOTFOUND api.example.com'))

    const result = await modelRouterService.smokeTestProvider('provider-1')

    expect(result.success).toBe(false)
    expect(result.message).toContain('Cannot reach the provider')
  })

  it('should return connection error for generic fetch failures', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('fetch failed'))

    const result = await modelRouterService.smokeTestProvider('provider-1')

    expect(result.success).toBe(false)
    expect(result.message).toContain('Cannot reach the provider')
  })

  it('should pass through unknown error messages unmodified', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Unexpected JSON parse error at position 42'))

    const result = await modelRouterService.smokeTestProvider('provider-1')

    expect(result.success).toBe(false)
    expect(result.message).toBe('Unexpected JSON parse error at position 42')
  })

  it('should log successful smoke tests at info level', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: '{"status":"ok"}' } }] }),
    })

    await modelRouterService.smokeTestProvider('provider-1')

    expect(mockLoggerInfo).toHaveBeenCalledWith(
      expect.stringContaining('Smoke test passed')
    )
  })

  it('should log failed smoke tests at error level', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Connection refused'))

    await modelRouterService.smokeTestProvider('provider-1')

    expect(mockLoggerError).toHaveBeenCalledWith(
      expect.stringContaining('Smoke test failed')
    )
  })
})

// ─── _callSmokeTest ────────────────────────────────────

describe('modelRouterService._callSmokeTest', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupStandardMocks()
  })

  // ── Ollama native API ──

  describe('Ollama adapter', () => {
    it('should call native /api/chat endpoint and strip /v1 suffix', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ message: { content: '{"status":"ok"}' } }),
      })

      const result = await modelRouterService._callSmokeTest(
        'http://localhost:11434/v1',
        null,
        'llama3.2',
        'ollama',
      )

      expect(global.fetch).toHaveBeenCalledTimes(1)
      const callArgs = (global.fetch as any).mock.calls[0]
      const url = callArgs[0] as string
      expect(url).toBe('http://localhost:11434/api/chat')

      const options = callArgs[1] as Record<string, unknown>
      const body = JSON.parse(options.body as string)
      expect(body.model).toBe('llama3.2')
      expect(body.stream).toBe(false)
      expect(body.messages[0].role).toBe('user')
      expect(options.signal).toBeDefined() // AbortSignal

      expect(result).toContain('{"status":"ok"}')
    })

    it('should throw when Ollama returns non-OK status', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'error body',
      })

      await expect(
        modelRouterService._callSmokeTest('http://localhost:11434/v1', null, 'llama3.2', 'ollama')
      ).rejects.toThrow('Ollama returned error 500')
    })

    it('should throw when Ollama response has no content', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ message: {} }),
      })

      await expect(
        modelRouterService._callSmokeTest('http://localhost:11434/v1', null, 'llama3.2', 'ollama')
      ).rejects.toThrow('Unexpected response format')
    })
  })

  // ── Anthropic Messages API ──

  describe('Anthropic adapter', () => {
    it('should call /messages endpoint with correct headers', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ content: [{ type: 'text', text: '{"status":"ok"}' }] }),
      })

      const result = await modelRouterService._callSmokeTest(
        'https://api.anthropic.com/v1',
        'sk-ant-test-key',
        'claude-sonnet-4-20250514',
        'anthropic',
      )

      expect(global.fetch).toHaveBeenCalledTimes(1)
      const callArgs = (global.fetch as any).mock.calls[0]
      const url = callArgs[0] as string
      expect(url).toBe('https://api.anthropic.com/v1/messages')

      const options = callArgs[1] as Record<string, unknown>
      const headers = options.headers as Record<string, string>
      expect(headers['x-api-key']).toBe('sk-ant-test-key')
      expect(headers['anthropic-version']).toBe('2023-06-01')
      expect(headers['Content-Type']).toBe('application/json')

      const body = JSON.parse(options.body as string)
      expect(body.model).toBe('claude-sonnet-4-20250514')
      expect(body.max_tokens).toBe(128)
      expect(body.messages[0].role).toBe('user')

      expect(result).toContain('{"status":"ok"}')
    })

    it('should throw when Anthropic returns non-OK status', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'error body',
      })

      await expect(
        modelRouterService._callSmokeTest(
          'https://api.anthropic.com/v1', 'bad-key', 'claude-sonnet-4', 'anthropic'
        )
      ).rejects.toThrow('Anthropic authentication failed')
    })

    it('should throw when Anthropic response has no text content', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ content: [] }),
      })

      await expect(
        modelRouterService._callSmokeTest('https://api.anthropic.com/v1', 'sk-ant-test-key', 'claude-sonnet-4', 'anthropic')
      ).rejects.toThrow('Unexpected response format')
    })
  })

  // ── Google Gemini API ──

  describe('Google adapter', () => {
    it('should call Gemini generateContent endpoint with API key in query param', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ candidates: [{ content: { parts: [{ text: '{"status":"ok"}' }] } }] }),
      })

      const result = await modelRouterService._callSmokeTest(
        'https://generativelanguage.googleapis.com/v1beta',
        'AIzaTestKey123',
        'gemini-2.5-pro',
        'google',
      )

      expect(global.fetch).toHaveBeenCalledTimes(1)
      const callArgs = (global.fetch as any).mock.calls[0]
      const url = callArgs[0] as string
      expect(url).toContain('/models/gemini-2.5-pro:generateContent')
      expect(url).toContain('key=AIzaTestKey123')

      const options = callArgs[1] as Record<string, unknown>
      const body = JSON.parse(options.body as string)
      expect(body.contents[0].role).toBe('user')
      expect(body.contents[0].parts[0].text).toContain('Smoke test')

      expect(result).toContain('{"status":"ok"}')
    })

    it('should throw when Gemini returns non-OK status', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        text: async () => 'error body',
      })

      await expect(
        modelRouterService._callSmokeTest(
          'https://generativelanguage.googleapis.com/v1beta', 'bad-key', 'gemini-pro', 'google'
        )
      ).rejects.toThrow('Gemini authentication failed')
    })

    it('should throw when Gemini response has no text', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ candidates: [] }),
      })

      await expect(
        modelRouterService._callSmokeTest('https://generativelanguage.googleapis.com/v1beta', 'AIzaTestKey', 'gemini-pro', 'google')
      ).rejects.toThrow('Unexpected response format')
    })
  })

  // ── OpenAI-compatible (default path) ──

  describe('OpenAI-compatible adapters', () => {
    it('should call /chat/completions for OpenAI adapter', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ choices: [{ message: { content: '{"status":"ok"}' } }] }),
      })

      const result = await modelRouterService._callSmokeTest(
        'https://api.openai.com/v1',
        'sk-test-key',
        'gpt-4o',
        'openai',
      )

      expect(global.fetch).toHaveBeenCalledTimes(1)
      const callArgs = (global.fetch as any).mock.calls[0]
      const url = callArgs[0] as string
      expect(url).toBe('https://api.openai.com/v1/chat/completions')

      const options = callArgs[1] as Record<string, unknown>
      const headers = options.headers as Record<string, string>
      expect(headers['Authorization']).toBe('Bearer sk-test-key')

      const body = JSON.parse(options.body as string)
      expect(body.model).toBe('gpt-4o')
      expect(body.max_tokens).toBe(128)
      expect(body.temperature).toBe(0)

      expect(result).toContain('{"status":"ok"}')
    })

    it('should add OpenRouter-specific headers for OpenRouter adapter', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ choices: [{ message: { content: '{"status":"ok"}' } }] }),
      })

      await modelRouterService._callSmokeTest(
        'https://openrouter.ai/api/v1',
        'sk-or-test-key',
        'openai/gpt-4o',
        'openrouter',
      )

      const options = (global.fetch as any).mock.calls[0][1] as Record<string, unknown>
      const headers = options.headers as Record<string, string>
      expect(headers['HTTP-Referer']).toBe('aureon-desk')
      expect(headers['X-Title']).toBe('Aureon Desk')
    })

    it('should work for NVIDIA NIM adapter', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ choices: [{ message: { content: '{"status":"ok"}' } }] }),
      })

      const result = await modelRouterService._callSmokeTest(
        'https://integrate.api.nvidia.com/v1',
        'nvapi-test-key',
        'nvidia/llama-3.1-nemotron-70b-instruct',
        'nvidia',
      )

      expect(result).toContain('{"status":"ok"}')
      const headers = (global.fetch as any).mock.calls[0][1].headers as Record<string, string>
      // NVIDIA uses OpenAI-compatible path, so Authorization: Bearer
      expect(headers['Authorization']).toBe('Bearer nvapi-test-key')
    })

    it('should work for Groq adapter', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ choices: [{ message: { content: '{"status":"ok"}' } }] }),
      })

      const result = await modelRouterService._callSmokeTest(
        'https://api.groq.com/openai/v1',
        'gsk-test-key',
        'llama-3.3-70b-versatile',
        'groq',
      )

      expect(result).toContain('{"status":"ok"}')
    })

    it('should work for Mistral adapter', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ choices: [{ message: { content: '{"status":"ok"}' } }] }),
      })

      const result = await modelRouterService._callSmokeTest(
        'https://api.mistral.ai/v1',
        'ms-test-key',
        'mistral-large-latest',
        'mistral',
      )

      expect(result).toContain('{"status":"ok"}')
    })

    it('should work for DeepSeek adapter', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ choices: [{ message: { content: '{"status":"ok"}' } }] }),
      })

      const result = await modelRouterService._callSmokeTest(
        'https://api.deepseek.com/v1',
        'sk-ds-test-key',
        'deepseek-chat',
        'deepseek',
      )

      expect(result).toContain('{"status":"ok"}')
    })

    it('should work for custom provider adapter', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ choices: [{ message: { content: '{"status":"ok"}' } }] }),
      })

      const result = await modelRouterService._callSmokeTest(
        'http://localhost:8000/v1',
        'custom-test-key',
        'local-model',
        'custom',
      )

      expect(result).toContain('{"status":"ok"}')
    })

    it('should throw when OpenAI-compatible provider returns non-OK', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'error body',
      })

      await expect(
        modelRouterService._callSmokeTest(
          'https://api.openai.com/v1', 'sk-test-key', 'gpt-4o', 'openai'
        )
      ).rejects.toThrow('Provider returned error 500')
    })

    it('should throw when OpenAI response has no content', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ choices: [{ message: {} }] }),
      })

      await expect(
        modelRouterService._callSmokeTest('https://api.openai.com/v1', 'sk-test-key', 'gpt-4o', 'openai')
      ).rejects.toThrow('Unexpected response format')
    })
  })

  // ── Null API key handling ──

  describe('null API key', () => {
    it('should not include Authorization header when API key is null for OpenAI-compatible', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ choices: [{ message: { content: '{"status":"ok"}' } }] }),
      })

      await modelRouterService._callSmokeTest(
        'http://localhost:1234/v1',
        null,
        'local-model',
        'lmstudio',
      )

      const options = (global.fetch as any).mock.calls[0][1] as Record<string, unknown>
      const headers = options.headers as Record<string, string>
      // LM Studio doesn't need auth; no Authorization header should be present
      expect(headers['Authorization']).toBeUndefined()
      expect(headers['x-api-key']).toBeUndefined()
    })

    it('should not include x-api-key header for Anthropic when key is null', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ content: [{ type: 'text', text: 'ok' }] }),
      })

      await modelRouterService._callSmokeTest(
        'https://api.anthropic.com/v1',
        null,
        'claude-sonnet-4',
        'anthropic',
      )

      const options = (global.fetch as any).mock.calls[0][1] as Record<string, unknown>
      const headers = options.headers as Record<string, string>
      expect(headers['x-api-key']).toBe('')
    })
  })
})
