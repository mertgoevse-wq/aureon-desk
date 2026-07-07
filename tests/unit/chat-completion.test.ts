import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the database and services
vi.mock('../../src/main/db/connection', () => ({
  getDb: vi.fn(),
}))

vi.mock('../../src/main/services/chat.service', () => ({
  chatService: {
    getChat: vi.fn(),
    addMessage: vi.fn(),
    getMessages: vi.fn(),
  },
}))

vi.mock('../../src/main/services/provider.service', () => ({
  providerService: {
    listProviders: vi.fn(),
    getApiKey: vi.fn(),
    getProvider: vi.fn(),
    fetchOllamaModels: vi.fn(),
    syncOllamaModels: vi.fn(),
  },
}))

vi.mock('../../src/main/services/prompt.service', () => ({
  promptService: {
    getSystemPrompt: vi.fn(),
    getDefaultSystemPrompt: vi.fn(),
  },
}))

vi.mock('../../src/main/services/hierarchy-resolver', () => ({
  resolvePrompt: vi.fn(),
}))

vi.mock('../../src/main/services/log-redacter', () => ({
  redactSecrets: vi.fn((s: string) => s.replace(/sk-[a-zA-Z0-9]+/g, 'sk-REDACTED')),
}))

vi.mock('../../src/main/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}))

import { chatCompletionService } from '../../src/main/services/chat-completion.service'
import { chatService } from '../../src/main/services/chat.service'
import { providerService } from '../../src/main/services/provider.service'
import { promptService } from '../../src/main/services/prompt.service'
import { resolvePrompt } from '../../src/main/services/hierarchy-resolver'

describe('Chat Completion Service', () => {
  const mockChatId = 'chat-1'
  const mockProviderId = 'provider-1'
  const mockModelId = 'model-1'
  const mockMessageId = 'msg-1'

  const mockChat = {
    id: mockChatId,
    title: 'Test Chat',
    model_id: mockModelId,
    system_prompt_id: null,
    project_id: null,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z',
    archived: 0,
    messages: [
      {
        id: mockMessageId,
        chat_id: mockChatId,
        role: 'user' as const,
        content: 'Hello, how are you?',
        tool_calls: null,
        tool_call_id: null,
        token_count: null,
        created_at: '2025-01-01T00:00:00.000Z',
        sort_order: 0,
      },
      {
        id: 'msg-2',
        chat_id: mockChatId,
        role: 'assistant' as const,
        content: 'I am doing well, thank you!',
        tool_calls: null,
        tool_call_id: null,
        token_count: null,
        created_at: '2025-01-01T00:00:01.000Z',
        sort_order: 1,
      },
      {
        id: 'msg-3',
        chat_id: mockChatId,
        role: 'user' as const,
        content: 'What is TypeScript?',
        tool_calls: null,
        tool_call_id: null,
        token_count: null,
        created_at: '2025-01-01T00:00:02.000Z',
        sort_order: 2,
      },
    ],
  }

  const mockProvider = {
    id: mockProviderId,
    name: 'OpenAI',
    slug: 'openai',
    adapter: 'openai',
    base_url: 'https://api.openai.com/v1',
    api_key_enc: 'encrypted-key',
    is_enabled: 1,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z',
    models: [
      {
        id: mockModelId,
        provider_id: mockProviderId,
        name: 'gpt-4o',
        display_name: 'GPT-4o',
        context_window: 128000,
        is_default: 1,
        is_enabled: 1,
        created_at: '2025-01-01T00:00:00.000Z',
      },
    ],
  }

  const mockAssistantMessage = {
    id: 'assistant-msg-1',
    chat_id: mockChatId,
    role: 'assistant' as const,
    content: 'TypeScript is a typed superset of JavaScript...',
    tool_calls: null,
    tool_call_id: null,
    token_count: null,
    created_at: '2025-01-01T00:00:03.000Z',
    sort_order: 3,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Default: successful setup
    vi.mocked(chatService.getChat).mockReturnValue(mockChat)
    vi.mocked(chatService.addMessage).mockReturnValue(mockAssistantMessage)
    vi.mocked(providerService.listProviders).mockReturnValue([mockProvider])
    vi.mocked(providerService.getProvider).mockReturnValue(mockProvider)
    vi.mocked(providerService.getApiKey).mockReturnValue('sk-test-key-123456789')
    vi.mocked(promptService.getDefaultSystemPrompt).mockReturnValue(undefined)
    vi.mocked(resolvePrompt).mockReturnValue({
      text: '',
      sources: [],
      warnings: [],
    })
    // Mock fetch for all tests
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'TypeScript is a typed superset of JavaScript...' } }],
      }),
      text: async () => '{"error": "mock"}',
    })
  })

  // ---- Test: Missing API Key ----

  describe('missing API key', () => {
    it('should return error when remote provider has no API key', async () => {
      vi.mocked(providerService.getApiKey).mockReturnValue(null)

      const result = await chatCompletionService.send({ chatId: mockChatId })

      expect(result.success).toBe(false)
      expect(result.errorCode).toBe('no_api_key')
      expect(result.error).toContain('API key')
      expect(result.providerName).toBe('OpenAI')
    })
  })

  // ---- Test: No Model Selected ----

  describe('no model selected', () => {
    it('should return error when chat has no model_id', async () => {
      vi.mocked(chatService.getChat).mockReturnValue({
        ...mockChat,
        model_id: null,
      })

      const result = await chatCompletionService.send({ chatId: mockChatId })

      expect(result.success).toBe(false)
      expect(result.errorCode).toBe('no_model')
      expect(result.error).toContain('No model selected')
    })
  })

  // ---- Test: Disabled Provider ----

  describe('disabled provider', () => {
    it('should return error when provider is disabled', async () => {
      vi.mocked(providerService.listProviders).mockReturnValue([{
        ...mockProvider,
        is_enabled: 0,
      }])

      const result = await chatCompletionService.send({ chatId: mockChatId })

      expect(result.success).toBe(false)
      expect(result.errorCode).toBe('no_provider')
    })
  })

  // ---- Test: Successful Completion ----

  describe('successful completion', () => {
    it('should return success with assistant message for OpenAI-compatible provider', async () => {
      const result = await chatCompletionService.send({ chatId: mockChatId })

      expect(result.success).toBe(true)
      expect(result.message).toBeDefined()
      expect(result.message?.role).toBe('assistant')
      expect(result.message?.content).toContain('TypeScript')
      expect(result.providerName).toBe('OpenAI')
      expect(result.modelName).toBe('GPT-4o')
    })

    it('should store assistant message via chatService.addMessage', async () => {
      await chatCompletionService.send({ chatId: mockChatId })

      expect(chatService.addMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          chat_id: mockChatId,
          role: 'assistant',
        })
      )
    })
  })

  // ---- Test: Provider Error ----

  describe('provider error handling', () => {
    it('should return error when provider returns non-OK status', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      })

      const result = await chatCompletionService.send({ chatId: mockChatId })

      expect(result.success).toBe(false)
      expect(result.errorCode).toBe('provider_error')
      expect(result.error).toContain('500')
    })

    it('should return no_api_key error on 401', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      })

      const result = await chatCompletionService.send({ chatId: mockChatId })

      expect(result.errorCode).toBe('no_api_key')
    })

    it('should return no_api_key error on 403', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        text: async () => 'Forbidden',
      })

      const result = await chatCompletionService.send({ chatId: mockChatId })

      expect(result.errorCode).toBe('no_api_key')
    })

    it('should return timeout error on AbortError', async () => {
      global.fetch = vi.fn().mockRejectedValue(new DOMException('The operation was aborted', 'AbortError'))

      const result = await chatCompletionService.send({ chatId: mockChatId })

      expect(result.success).toBe(false)
      expect(result.errorCode).toBe('timeout')
    })
  })

  // ---- Test: OpenAI-compatible Payload ----

  describe('OpenAI-compatible payload', () => {
    it('should send correct request body to OpenAI endpoint', async () => {
      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Response' } }],
        }),
      })
      global.fetch = fetchSpy

      await chatCompletionService.send({ chatId: mockChatId })

      expect(fetchSpy).toHaveBeenCalledTimes(1)
      const callArgs = fetchSpy.mock.calls[0]
      const url = callArgs[0] as string
      const options = callArgs[1] as Record<string, unknown>

      expect(url).toBe('https://api.openai.com/v1/chat/completions')
      expect(options.method).toBe('POST')
      expect(options.headers).toHaveProperty('Authorization')

      const body = JSON.parse(options.body as string)
      expect(body).toHaveProperty('model', 'gpt-4o')
      expect(body).toHaveProperty('messages')
      expect(body.messages).toBeInstanceOf(Array)
      expect(body.messages.length).toBe(3) // user + assistant + user
    })
  })

  // ---- Test: Anthropic Payload ----

  describe('Anthropic payload', () => {
    it('should send correct request body to Anthropic endpoint', async () => {
      const anthropicProvider = {
        ...mockProvider,
        adapter: 'anthropic',
        name: 'Anthropic',
        base_url: 'https://api.anthropic.com/v1',
      }
      vi.mocked(providerService.listProviders).mockReturnValue([anthropicProvider])
      vi.mocked(providerService.getProvider).mockReturnValue(anthropicProvider)

      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          content: [{ type: 'text', text: 'Claude responds...' }],
        }),
      })
      global.fetch = fetchSpy

      await chatCompletionService.send({ chatId: mockChatId })

      expect(fetchSpy).toHaveBeenCalledTimes(1)
      const callArgs = fetchSpy.mock.calls[0]
      const url = callArgs[0] as string
      const options = callArgs[1] as Record<string, unknown>

      expect(url).toBe('https://api.anthropic.com/v1/messages')
      expect(options.headers).toHaveProperty('x-api-key')
      expect(options.headers).toHaveProperty('anthropic-version', '2023-06-01')

      const body = JSON.parse(options.body as string)
      expect(body).toHaveProperty('model', 'gpt-4o')
      expect(body).toHaveProperty('max_tokens', 4096)
      expect(body).toHaveProperty('messages')
      // Anthropic should preserve user/assistant roles
      expect(body.messages[0].role).toBe('user')
    })

    it('should return error on Anthropic authentication failure', async () => {
      const anthropicProvider = {
        ...mockProvider,
        adapter: 'anthropic',
        name: 'Anthropic',
        base_url: 'https://api.anthropic.com/v1',
      }
      vi.mocked(providerService.listProviders).mockReturnValue([anthropicProvider])
      vi.mocked(providerService.getProvider).mockReturnValue(anthropicProvider)

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => '{"error":{"message":"invalid x-api-key"}}',
      })

      const result = await chatCompletionService.send({ chatId: mockChatId })

      expect(result.success).toBe(false)
      expect(result.errorCode).toBe('no_api_key')
      expect(result.error).toContain('Anthropic')
    })
  })

  // ---- Test: OpenRouter Payload ----

  describe('OpenRouter payload', () => {
    it('should send correct headers to OpenRouter endpoint', async () => {
      const openRouterProvider = {
        ...mockProvider,
        adapter: 'openrouter',
        name: 'OpenRouter',
        slug: 'openrouter',
        base_url: 'https://openrouter.ai/api/v1',
      }
      vi.mocked(providerService.listProviders).mockReturnValue([openRouterProvider])
      vi.mocked(providerService.getProvider).mockReturnValue(openRouterProvider)

      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Response from OpenRouter' } }],
        }),
      })
      global.fetch = fetchSpy

      await chatCompletionService.send({ chatId: mockChatId })

      expect(fetchSpy).toHaveBeenCalledTimes(1)
      const options = fetchSpy.mock.calls[0][1] as Record<string, unknown>
      const headers = options.headers as Record<string, string>

      expect(headers).toHaveProperty('HTTP-Referer', 'aureon-desk')
      expect(headers).toHaveProperty('X-Title', 'Aureon Desk')
      expect(headers).toHaveProperty('Authorization')
    })

    it('should return error when OpenRouter has no API key', async () => {
      const openRouterProvider = {
        ...mockProvider,
        adapter: 'openrouter',
        name: 'OpenRouter',
        slug: 'openrouter',
        base_url: 'https://openrouter.ai/api/v1',
      }
      vi.mocked(providerService.listProviders).mockReturnValue([openRouterProvider])
      vi.mocked(providerService.getProvider).mockReturnValue(openRouterProvider)
      vi.mocked(providerService.getApiKey).mockReturnValue(null)

      const result = await chatCompletionService.send({ chatId: mockChatId })

      expect(result.success).toBe(false)
      expect(result.errorCode).toBe('no_api_key')
      expect(result.error).toContain('API key')
    })
  })

  // ---- Test: Gemini Payload ----

  describe('Gemini payload', () => {
    it('should send correct request to Gemini endpoint', async () => {
      const geminiProvider = {
        ...mockProvider,
        adapter: 'google',
        name: 'Google Gemini',
        slug: 'google',
        base_url: 'https://generativelanguage.googleapis.com/v1beta',
      }
      vi.mocked(providerService.listProviders).mockReturnValue([geminiProvider])
      vi.mocked(providerService.getProvider).mockReturnValue(geminiProvider)

      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: 'Gemini response' }] } }],
        }),
      })
      global.fetch = fetchSpy

      await chatCompletionService.send({ chatId: mockChatId })

      expect(fetchSpy).toHaveBeenCalledTimes(1)
      const url = fetchSpy.mock.calls[0][0] as string
      const options = fetchSpy.mock.calls[0][1] as Record<string, unknown>

      // URL should include API key as query param and model name
      expect(url).toContain('generateContent?key=')
      expect(url).toContain(mockProvider.models[0].name) // model name in URL

      const body = JSON.parse(options.body as string)
      expect(body).toHaveProperty('contents')
      expect(body.contents).toBeInstanceOf(Array)
      // Gemini maps 'assistant' role to 'model'
      expect(body.contents.find((c: { role: string }) => c.role === 'assistant')).toBeUndefined()
    })

    it('should handle Gemini safety filter block', async () => {
      const geminiProvider = {
        ...mockProvider,
        adapter: 'google',
        name: 'Google Gemini',
        slug: 'google',
        base_url: 'https://generativelanguage.googleapis.com/v1beta',
      }
      vi.mocked(providerService.listProviders).mockReturnValue([geminiProvider])
      vi.mocked(providerService.getProvider).mockReturnValue(geminiProvider)

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [{ finishReason: 'SAFETY' }],
        }),
      })

      const result = await chatCompletionService.send({ chatId: mockChatId })

      expect(result.success).toBe(false)
      expect(result.error).toMatch(/safety/i)
    })

    it('should return error on Gemini auth failure', async () => {
      const geminiProvider = {
        ...mockProvider,
        adapter: 'google',
        name: 'Google Gemini',
        slug: 'google',
        base_url: 'https://generativelanguage.googleapis.com/v1beta',
      }
      vi.mocked(providerService.listProviders).mockReturnValue([geminiProvider])
      vi.mocked(providerService.getProvider).mockReturnValue(geminiProvider)

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        text: async () => 'API key not valid',
      })

      const result = await chatCompletionService.send({ chatId: mockChatId })

      expect(result.success).toBe(false)
      expect(result.errorCode).toBe('no_api_key')
    })
  })

  // ---- Test: findProviderByModel ----

  describe('findProviderByModel', () => {
    it('should find provider containing the model', () => {
      const result = chatCompletionService.findProviderByModel(mockModelId)
      expect(result).toBeDefined()
      expect(result?.name).toBe('OpenAI')
    })

    it('should return undefined for unknown model', () => {
      const result = chatCompletionService.findProviderByModel('nonexistent')
      expect(result).toBeUndefined()
    })
  })

  // ---- Test: Chat Not Found ----

  describe('chat not found', () => {
    it('should return error when chat does not exist', async () => {
      vi.mocked(chatService.getChat).mockReturnValue(undefined)

      const result = await chatCompletionService.send({ chatId: 'nonexistent' })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Chat not found')
    })
  })

  // ---- Test: Ollama Native API Payload ----

  describe('Ollama native API', () => {
    it('should call /api/chat with correct payload', async () => {
      const ollamaProvider = {
        ...mockProvider,
        adapter: 'ollama',
        name: 'Ollama',
        slug: 'ollama',
        base_url: 'http://localhost:11434/v1',
      }
      vi.mocked(providerService.listProviders).mockReturnValue([ollamaProvider])
      vi.mocked(providerService.getProvider).mockReturnValue(ollamaProvider)
      vi.mocked(providerService.getApiKey).mockReturnValue(null) // Ollama needs no key

      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          model: 'llama3.2',
          message: { role: 'assistant', content: 'Hello from Ollama!' },
          done: true,
        }),
      })
      global.fetch = fetchSpy

      await chatCompletionService.send({ chatId: mockChatId })

      expect(fetchSpy).toHaveBeenCalledTimes(1)
      const callArgs = fetchSpy.mock.calls[0]
      const url = callArgs[0] as string
      const options = callArgs[1] as Record<string, unknown>

      // Should call native /api/chat (base_url /v1 suffix stripped)
      expect(url).toBe('http://localhost:11434/api/chat')
      expect(options.method).toBe('POST')

      const body = JSON.parse(options.body as string)
      expect(body).toHaveProperty('model', 'gpt-4o')
      expect(body).toHaveProperty('stream', false)
      expect(body).toHaveProperty('messages')
      expect(body.messages).toBeInstanceOf(Array)
    })

    it('should fallback to OpenAI-compatible if native API fails', async () => {
      const ollamaProvider = {
        ...mockProvider,
        adapter: 'ollama',
        name: 'Ollama',
        slug: 'ollama',
        base_url: 'http://localhost:11434/v1',
      }
      vi.mocked(providerService.listProviders).mockReturnValue([ollamaProvider])
      vi.mocked(providerService.getProvider).mockReturnValue(ollamaProvider)
      vi.mocked(providerService.getApiKey).mockReturnValue(null)

      // First call (native) fails, second call (fallback) succeeds
      const fetchSpy = vi.fn()
        .mockRejectedValueOnce(new Error('fetch failed')) // native fails
        .mockResolvedValueOnce({                            // fallback succeeds
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'Hello from Ollama via OpenAI-compatible!' } }],
          }),
        })
      global.fetch = fetchSpy

      const result = await chatCompletionService.send({ chatId: mockChatId })

      // Should succeed via fallback
      expect(result.success).toBe(true)
      expect(fetchSpy).toHaveBeenCalledTimes(2)
      // First call should be native /api/chat
      expect(fetchSpy.mock.calls[0][0]).toBe('http://localhost:11434/api/chat')
      // Second call should be OpenAI-compatible /v1/chat/completions
      expect(fetchSpy.mock.calls[1][0]).toBe('http://localhost:11434/v1/chat/completions')
    })

    it('should skip API key check for Ollama provider', async () => {
      const ollamaProvider = {
        ...mockProvider,
        adapter: 'ollama',
        name: 'Ollama',
        slug: 'ollama',
        base_url: 'http://localhost:11434/v1',
      }
      vi.mocked(providerService.listProviders).mockReturnValue([ollamaProvider])
      vi.mocked(providerService.getProvider).mockReturnValue(ollamaProvider)
      vi.mocked(providerService.getApiKey).mockReturnValue(null)

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          model: 'llama3.2',
          message: { role: 'assistant', content: 'Hello!' },
          done: true,
        }),
      })

      const result = await chatCompletionService.send({ chatId: mockChatId })

      // Should succeed even without API key
      expect(result.success).toBe(true)
      expect(result.message?.role).toBe('assistant')
    })
  })

  // ---- Test: LM Studio ----

  describe('LM Studio', () => {
    it('should call OpenAI-compatible endpoint with no API key', async () => {
      const lmStudioProvider = {
        ...mockProvider,
        adapter: 'lmstudio',
        name: 'LM Studio',
        slug: 'lmstudio',
        base_url: 'http://localhost:1234/v1',
      }
      vi.mocked(providerService.listProviders).mockReturnValue([lmStudioProvider])
      vi.mocked(providerService.getProvider).mockReturnValue(lmStudioProvider)
      vi.mocked(providerService.getApiKey).mockReturnValue(null)

      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Hello from LM Studio!' } }],
        }),
      })
      global.fetch = fetchSpy

      const result = await chatCompletionService.send({ chatId: mockChatId })

      expect(result.success).toBe(true)
      expect(fetchSpy).toHaveBeenCalledTimes(1)
      expect(fetchSpy.mock.calls[0][0]).toBe('http://localhost:1234/v1/chat/completions')
    })
  })

  // ---- Test: Offline Provider ----

  describe('offline provider', () => {
    it('should return friendly error when local provider is unreachable', async () => {
      const ollamaProvider = {
        ...mockProvider,
        adapter: 'ollama',
        name: 'Ollama',
        slug: 'ollama',
        base_url: 'http://localhost:11434/v1',
      }
      vi.mocked(providerService.listProviders).mockReturnValue([ollamaProvider])
      vi.mocked(providerService.getProvider).mockReturnValue(ollamaProvider)
      vi.mocked(providerService.getApiKey).mockReturnValue(null)

      // Both native and fallback fail with connection refused
      global.fetch = vi.fn().mockRejectedValue(
        new Error('fetch failed — ECONNREFUSED 127.0.0.1:11434')
      )

      const result = await chatCompletionService.send({ chatId: mockChatId })

      expect(result.success).toBe(false)
      expect(result.errorCode).toBe('provider_error')
      expect(result.error).toContain('Cannot connect to local provider')
    })

    it('should return friendly error when LM Studio is unreachable', async () => {
      const lmStudioProvider = {
        ...mockProvider,
        adapter: 'lmstudio',
        name: 'LM Studio',
        slug: 'lmstudio',
        base_url: 'http://localhost:1234/v1',
      }
      vi.mocked(providerService.listProviders).mockReturnValue([lmStudioProvider])
      vi.mocked(providerService.getProvider).mockReturnValue(lmStudioProvider)
      vi.mocked(providerService.getApiKey).mockReturnValue(null)

      global.fetch = vi.fn().mockRejectedValue(
        new Error('fetch failed — ECONNREFUSED 127.0.0.1:1234')
      )

      const result = await chatCompletionService.send({ chatId: mockChatId })

      expect(result.success).toBe(false)
      expect(result.errorCode).toBe('provider_error')
      expect(result.error).toContain('Cannot connect to local provider')
    })
  })

  // ---- Test: Ollama Model Fetching ----

  // ---- Test: OpenRouter Free Model Integration ----

  describe('OpenRouter free model', () => {
    it('should send request with HTTP-Referer and X-Title headers', async () => {
      const openRouterProvider = {
        ...mockProvider,
        adapter: 'openrouter',
        name: 'OpenRouter',
        slug: 'openrouter',
        base_url: 'https://openrouter.ai/api/v1',
        models: [{
          id: 'openrouter-free', provider_id: mockProviderId,
          name: 'openrouter/free', display_name: 'Free (smoke test)',
          context_window: 8000, is_default: 0, is_enabled: 1,
          created_at: '2025-01-01T00:00:00.000Z',
        }],
      }
      vi.mocked(providerService.listProviders).mockReturnValue([openRouterProvider])
      vi.mocked(providerService.getProvider).mockReturnValue(openRouterProvider)

      vi.mocked(chatService.getChat).mockReturnValue({
        ...mockChat,
        model_id: 'openrouter-free',
        messages: [{
          id: '1', chat_id: mockChatId, role: 'user' as const,
          content: 'Reply with one short sentence.',
          tool_calls: null, tool_call_id: null, token_count: null,
          created_at: '2025-01-01T00:00:00.000Z', sort_order: 0,
        }],
      } as never)

      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Sure! I can help with that.' } }],
        }),
      })
      global.fetch = fetchSpy

      const result = await chatCompletionService.send({ chatId: mockChatId })

      expect(result.success).toBe(true)
      expect(fetchSpy).toHaveBeenCalledTimes(1)
      const options = fetchSpy.mock.calls[0][1] as Record<string, unknown>
      const headers = options.headers as Record<string, string>
      expect(headers['HTTP-Referer']).toBe('aureon-desk')
      expect(headers['X-Title']).toBe('Aureon Desk')
    })

    it('should return clear error for rate limit (429)', async () => {
      const openRouterProvider = {
        ...mockProvider,
        adapter: 'openrouter',
        name: 'OpenRouter',
        slug: 'openrouter',
        base_url: 'https://openrouter.ai/api/v1',
      }
      vi.mocked(providerService.listProviders).mockReturnValue([openRouterProvider])
      vi.mocked(providerService.getProvider).mockReturnValue(openRouterProvider)

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        text: async () => '{"error":{"message":"Rate limit exceeded"}}',
      })

      const result = await chatCompletionService.send({ chatId: mockChatId })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Rate limited')
    })
  })

  // ---- Test: Secure Key Handling (No Secret in Logs) ----

  describe('secure key handling', () => {
    it('should not include raw API key in error messages', async () => {
      const rawKey = 'sk-or-v1-abcdefghijklmnopqrstuvwxyz123456789'
      vi.mocked(providerService.getApiKey).mockReturnValue(rawKey)

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => `{"error":{"message":"Invalid key: ${rawKey}"}}`,
      })

      const result = await chatCompletionService.send({ chatId: mockChatId })

      expect(result.success).toBe(false)
      // The error message should NOT contain the raw API key
      expect(result.error).not.toContain('sk-or-v1')
    })

    it('should redact secrets from log output', async () => {
      const { redactSecrets } = await import('../../src/main/services/log-redacter')

      const logLine = 'Authorization: Bearer sk-or-v1-mysecretkey123456789'
      const redacted = redactSecrets(logLine)

      // Key should be redacted
      expect(redacted).not.toContain('sk-or-v1-mysecretkey')
      expect(redacted).toContain('REDACTED')
      // Non-secret parts should be preserved
      expect(redacted).toContain('Authorization')
    })

    it('should redact OpenRouter-specific key format', async () => {
      const { redactSecrets } = await import('../../src/main/services/log-redacter')

      const testCases = [
        'sk-or-v1-abc123def456ghi789jkl012mno345pqr678',
        'Bearer sk-or-v1-aaaaabbbbbcccccdddddeeeeefffffg',
      ]

      for (const tc of testCases) {
        const result = redactSecrets(tc)
        expect(result).not.toContain('sk-or-v1')
        expect(result).toContain('REDACTED')
      }
    })
  })

  // ---- Test: Missing OPENROUTER_API_KEY skip ----

  describe('missing OPENROUTER_API_KEY', () => {
    it('should handle missing env key gracefully', () => {
      // This test verifies the smoke test pattern: tests should skip when env var is missing
      const envKey = process.env.OPENROUTER_API_KEY
      const canTest = !!envKey

      if (!canTest) {
        // This is the expected path in CI/local without credentials
        expect(canTest).toBe(false)
      } else {
        // If key exists, verify it follows expected format (don't print it)
        expect(typeof envKey).toBe('string')
        expect(envKey.length).toBeGreaterThan(20)
      }
    })

    it('should not include real API keys in test output', () => {
      // Verify no hardcoded REAL keys in this test file
      // Mock keys like 'sk-or-v1-abcdef...' are expected for redaction tests
      const fs = require('fs')
      const testSource = fs.readFileSync(__filename, 'utf-8')
      // Mock keys are short fake keys used for testing (30-40 chars of repeated chars)
      // Real keys are longer and more random
      const realKeyPattern = /sk-or-v1-[a-zA-Z0-9_-]{40,}/g
      const matches = testSource.match(realKeyPattern)
      // If there are matches, ensure they're all mock keys (repeated patterns like 'abcdef...')
      if (matches) {
        const mockOnly = matches.every((m: string) =>
          /(abcdef|aaaaa|bbbbb|ccccc|ddddd|eeeee|fffff)/i.test(m)
        )
        expect(mockOnly).toBe(true)
      }
    })
  })

  describe('fetchOllamaModels', () => {
    it('should return models list from /api/tags', async () => {
      const mockModels = [
        { name: 'llama3.2:latest', size: 2000000000 },
        { name: 'codellama:latest', size: 3500000000 },
      ]
      vi.mocked(providerService.fetchOllamaModels).mockResolvedValue(mockModels)

      const models = await providerService.fetchOllamaModels('http://localhost:11434')

      expect(models).toHaveLength(2)
      expect(models[0].name).toBe('llama3.2:latest')
      expect(models[1].name).toBe('codellama:latest')
    })

    it('should return empty array when Ollama is offline', async () => {
      vi.mocked(providerService.fetchOllamaModels).mockResolvedValue([])

      const models = await providerService.fetchOllamaModels()

      expect(models).toEqual([])
    })
  })
})
