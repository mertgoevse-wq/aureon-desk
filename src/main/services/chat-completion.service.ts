import { chatService } from './chat.service'
import { providerService } from './provider.service'
import { modelRouterService } from './model-router.service'
import { promptService } from './prompt.service'
import { projectService } from './project.service'
import { buildRequest } from './request-builder'
import { resolvePrompt } from './hierarchy-resolver'
import { logger } from '../utils/logger'
import { redactSecrets } from './log-redacter'
import type { ChatSendInput, ChatSendResult } from '../../shared/types/chat'
import type { ModelRow, ProviderRow } from '../../shared/types/provider'
import type { SystemPromptRow, HierarchyInput } from '../../shared/types/prompt'

// ---- Types ----

export type { ChatSendResult }

// ---- Completion Engine ----

export const chatCompletionService = {
  /**
   * Send a chat completion request to the configured provider.
   * Loads the chat, resolves system prompts, builds the request,
   * calls the provider API, and stores the assistant response.
   */
  async send(input: ChatSendInput): Promise<ChatSendResult> {
    const warnings: string[] = []

    try {
      // 1. Load chat with all messages
      const chat = chatService.getChat(input.chatId)
      if (!chat) return { success: false, error: 'Chat not found', errorCode: 'unknown' }

      const messages = chat.messages
      if (messages.length === 0) return { success: false, error: 'No messages in chat', errorCode: 'unknown' }

      // 2. Get provider and model
      if (!chat.model_id) {
        return { success: false, error: 'No model selected. Open Settings → Providers to configure.', errorCode: 'no_model' }
      }

      if (input.expectedModelId !== undefined && input.expectedModelId !== chat.model_id) {
        return {
          success: false,
          error: 'The selected model changed before this request was sent. Re-select the model and try again.',
          errorCode: 'stale_model'
        }
      }

      const providerModel = providerService.resolveCanonicalModelReference(chat.model_id, input.expectedModelId ? 'renderer' : 'chat')
      if (!providerModel) {
        return {
          success: false,
          error: 'Selected model no longer exists, is disabled, or its provider is disabled. Choose a current model in the selector.',
          errorCode: 'stale_model'
        }
      }

      const provider = providerService.getProvider(providerModel.providerId)
      if (!provider) {
        return { success: false, error: 'Provider not found for selected model', errorCode: 'no_provider' }
      }

      const model = provider.models.find(m => m.id === providerModel.modelId)
      if (!model) {
        return { success: false, error: 'Selected model not found', errorCode: 'no_model' }
      }

      // 3. Resolve system prompt hierarchy
      let resolvedPrompt = null
      let systemPromptProfile: SystemPromptRow | undefined = undefined

      if (chat.system_prompt_id) {
        systemPromptProfile = promptService.getSystemPrompt(chat.system_prompt_id)
      } else {
        systemPromptProfile = promptService.getDefaultSystemPrompt()
      }

      // Load project instructions if chat is associated with a project
      let projectInstructions: string | undefined = undefined
      if (chat.project_id) {
        const project = projectService.getProject(chat.project_id)
        if (project && project.instructions) {
          projectInstructions = `Project: ${project.name}\n\n${project.instructions}`
        }
      }

      if (systemPromptProfile || projectInstructions) {
        const hierarchyInput: HierarchyInput = {
          selectedProfile: systemPromptProfile,
          projectInstructions,
          chatOverride: undefined,
          taskInstruction: undefined,
        }
        resolvedPrompt = resolvePrompt(hierarchyInput)
      }

      // 4. Build the request
      const built = buildRequest({
        chatId: chat.id,
        providerId: provider.id,
        modelId: model.id,
        messages,
        resolvedPrompt,
        systemPromptProfile,
      })

      warnings.push(...built.warnings)

      // 5. Check API key for remote providers
      if (provider.adapter !== 'ollama' && provider.adapter !== 'lmstudio' && !built.apiKey) {
        return {
        success: false,
        error: `No API key configured for ${provider.name}. Go to Settings → Providers to add your key.`,
        errorCode: 'no_api_key',
        providerName: provider.name,
        modelName: model.display_name || model.name,
          providerModel,
        }
      }

      // 6. Send to provider
      const isLocal = provider.adapter === 'ollama' || provider.adapter === 'lmstudio'
      logger.info(`Sending chat completion to ${provider.name} (${model.name})`, {
        providerId: providerModel.providerId,
        modelId: providerModel.modelId,
        modelLabel: providerModel.modelLabel,
        adapter: provider.adapter,
        isLocal 
      })
      const startTime = Date.now()

      const responseText = await this.callProvider(provider, model, built)

      // Record usage for token tracking
      modelRouterService.recordUsage(model.name)

      const duration = Date.now() - startTime
      logger.info(`Chat completion completed in ${duration}ms`, {
        providerId: providerModel.providerId,
        providerName: providerModel.providerName,
        modelId: providerModel.modelId,
        modelLabel: providerModel.modelLabel,
        adapter: providerModel.adapterType
      })

      // 7. Store assistant message
      const assistantMsg = chatService.addMessage({
        chat_id: chat.id,
        role: 'assistant',
        content: responseText,
        provider_id: providerModel.providerId,
        provider_name: providerModel.providerName,
        model_id: providerModel.modelId,
        model_label: providerModel.modelLabel,
        adapter_type: providerModel.adapterType,
        latency_ms: duration,
      })

      return {
        success: true,
        message: assistantMsg,
        warnings: warnings.length > 0 ? warnings : undefined,
        providerName: provider.name,
        modelName: model.display_name || model.name,
        providerModel,
      }
    } catch (err) {
      const errorMsg = String(err)
      logger.error('Chat completion failed', err instanceof Error ? err : String(err))

      // Determine error code from message
      let errorCode: ChatSendResult['errorCode'] = 'provider_error'
      if (errorMsg.includes('timeout') || errorMsg.includes('ETIMEDOUT') || errorMsg.includes('aborted')) {
        errorCode = 'timeout'
      } else if (errorMsg.includes('401') || errorMsg.includes('403') || errorMsg.includes('Unauthorized')) {
        errorCode = 'no_api_key'
      } else if (errorMsg.includes('ECONNREFUSED') || errorMsg.includes('fetch failed') || errorMsg.includes('ENOTFOUND')) {
        errorCode = 'provider_error'
        // Give a better message for offline local providers
        if (errorMsg.includes('127.0.0.1') || errorMsg.includes('localhost') || errorMsg.includes('11434') || errorMsg.includes('1234')) {
          // Replace raw error with user-friendly message
          return {
            success: false,
            error: `Cannot connect to local provider. Is the server running? Check:\n• Ollama: http://localhost:11434\n• LM Studio: http://localhost:1234\n\nOriginal error: ${errorMsg.slice(0, 200)}`,
            errorCode: 'provider_error',
            warnings: warnings.length > 0 ? warnings : undefined,
          }
        }
      }

      return {
        success: false,
        error: errorMsg,
        errorCode,
        warnings: warnings.length > 0 ? warnings : undefined,
      }
    }
  },

  /**
   * Find the provider that owns a given model ID.
   */
  findProviderByModel(modelId: string): (ProviderRow & { models: ModelRow[] }) | undefined {
    const resolved = providerService.resolveCanonicalModelReference(modelId)
    return resolved ? providerService.getProvider(resolved.providerId) : undefined
  },

  /**
   * Call the appropriate provider API based on adapter type.
   */
  async callProvider(
    provider: ProviderRow,
    model: ModelRow,
    built: ReturnType<typeof buildRequest>,
  ): Promise<string> {
    const adapter = provider.adapter

    switch (adapter) {
      case 'anthropic':
        return this.callAnthropic(built, model, provider)
      case 'google':
        return this.callGoogle(built, model, provider)
      case 'ollama':
        // Try native Ollama API first, fallback to OpenAI-compatible
        return this.callOllamaNative(built, model, provider)
      case 'lmstudio':
        // LM Studio uses OpenAI-compatible endpoint
        return this.callOpenAICompatible(built, model, provider)
      case 'openai':
      case 'openrouter':
      case 'groq':
      case 'mistral':
      case 'deepseek':
      case 'nvidia':
      case 'custom':
      default:
        return this.callOpenAICompatible(built, model, provider)
    }
  },

  /**
   * OpenAI-compatible /chat/completions endpoint.
   * Used by: OpenAI, OpenRouter, Groq, Mistral, DeepSeek, Custom, Ollama, LM Studio.
   */
  async callOpenAICompatible(
    built: ReturnType<typeof buildRequest>,
    model: ModelRow,
    provider: ProviderRow,
  ): Promise<string> {
    const baseUrl = built.baseUrl
    const url = `${baseUrl}/chat/completions`

    // Build messages array including system prompt
    const messages: Array<{ role: string; content: string }> = []
    if (built.systemPrompt) {
      messages.push({ role: 'system', content: built.systemPrompt })
    }
    for (const msg of built.messages) {
      messages.push(msg)
    }

    const body = JSON.stringify({
      model: model.name,
      messages,
      temperature: 0.7,
      max_tokens: 4096,
    })

    const headers: Record<string, string> = { ...built.headers }

    // Specific header tweaks for some providers
    if (provider.adapter === 'openrouter') {
      headers['HTTP-Referer'] = 'aureon-desk'
      headers['X-Title'] = 'Aureon Desk'
    }

    logger.info(`POST ${redactSecrets(url)}`, { model: model.name, msgCount: messages.length })

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
      signal: AbortSignal.timeout(120000), // 2 minute timeout
    })

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Unable to read error body')
      logger.error(`Provider error (${response.status}): ${redactSecrets(errorBody.slice(0, 500))}`)

      if (response.status === 401 || response.status === 403) {
        throw new Error(`Authentication failed (${response.status}). Check your API key for ${provider.name}.`)
      }
      if (response.status === 429) {
        throw new Error(`Rate limited by ${provider.name}. Please wait and try again.`)
      }
      throw new Error(`${provider.name} returned error ${response.status}: ${errorBody.slice(0, 300)}`)
    }

    const data = await response.json() as Record<string, unknown>

    // Extract content from OpenAI-compatible response
    const choices = data.choices as Array<{ message?: { content?: string } }> | undefined
    if (!choices || !choices[0]?.message?.content) {
      logger.error('Unexpected response format', { data: JSON.stringify(data).slice(0, 500) })
      throw new Error(`Unexpected response format from ${provider.name}`)
    }

    return choices[0].message.content
  },

  /**
   * Anthropic Messages API: POST /v1/messages
   */
  async callAnthropic(
    built: ReturnType<typeof buildRequest>,
    model: ModelRow,
    provider: ProviderRow,
  ): Promise<string> {
    const url = `${built.baseUrl}/messages`

    // Anthropic uses a separate "system" field, not in messages array.
    // Keep original roles (user/assistant) from the request builder.
    const messages = built.messages
      .reduce((acc: Array<{ role: string; content: string }>, msg) => {
        if (acc.length > 0 && acc[acc.length - 1].role === msg.role) {
          acc[acc.length - 1].content += '\n\n' + msg.content
        } else {
          acc.push(msg)
        }
        return acc
      }, [])

    const body = JSON.stringify({
      model: model.name,
      system: built.systemPrompt || undefined,
      messages,
      max_tokens: 4096,
    })

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-api-key': built.apiKey || '',
      'anthropic-version': '2023-06-01',
    }

    logger.info(`POST ${redactSecrets(url)}`, { model: model.name, msgCount: messages.length })

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
      signal: AbortSignal.timeout(120000),
    })

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Unable to read error body')
      logger.error(`Anthropic error (${response.status}): ${redactSecrets(errorBody.slice(0, 500))}`)

      if (response.status === 401 || response.status === 403) {
        throw new Error(`Anthropic authentication failed (${response.status}). Check your API key.`)
      }
      throw new Error(`Anthropic returned error ${response.status}: ${errorBody.slice(0, 300)}`)
    }

    const data = await response.json() as Record<string, unknown>
    const content = data.content as Array<{ type: string; text?: string }> | undefined

    if (!content || !content[0]?.text) {
      logger.error('Unexpected Anthropic response format', { data: JSON.stringify(data).slice(0, 500) })
      throw new Error('Unexpected response format from Anthropic')
    }

    return content[0].text
  },

  /**
   * Google Gemini API: generateContent
   */
  async callGoogle(
    built: ReturnType<typeof buildRequest>,
    model: ModelRow,
    provider: ProviderRow,
  ): Promise<string> {
    const apiKey = built.apiKey
    const url = `${built.baseUrl}/models/${model.name}:generateContent?key=${apiKey}`

    // Build contents array with alternating user/model roles
    const contents = built.messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

    const body: Record<string, unknown> = { contents }

    // System instruction
    if (built.systemPrompt) {
      body.systemInstruction = { parts: [{ text: built.systemPrompt }] }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    logger.info(`POST ${redactSecrets(url)}`, { model: model.name, msgCount: contents.length })

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120000),
    })

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Unable to read error body')
      logger.error(`Gemini error (${response.status}): ${redactSecrets(errorBody.slice(0, 500))}`)

      if (response.status === 401 || response.status === 403) {
        throw new Error(`Gemini authentication failed (${response.status}). Check your API key.`)
      }
      throw new Error(`Gemini returned error ${response.status}: ${errorBody.slice(0, 300)}`)
    }

    const data = await response.json() as Record<string, unknown>
    const candidates = data.candidates as Array<{ content?: { parts?: Array<{ text?: string }> } }> | undefined

    if (!candidates || !candidates[0]?.content?.parts?.[0]?.text) {
      // Check for safety block
      if (candidates?.[0] && !candidates[0].content) {
        const finishReason = (candidates[0] as Record<string, unknown>).finishReason
        throw new Error(`Gemini blocked the response (${finishReason || 'safety filter'}). Try rephrasing your message.`)
      }
      logger.error('Unexpected Gemini response format', { data: JSON.stringify(data).slice(0, 500) })
      throw new Error('Unexpected response format from Gemini')
    }

    return candidates[0].content.parts[0].text
  },

  /**
   * Ollama native /api/chat endpoint.
   * Falls back to OpenAI-compatible /v1/chat/completions if native fails.
   */
  async callOllamaNative(
    built: ReturnType<typeof buildRequest>,
    model: ModelRow,
    provider: ProviderRow,
  ): Promise<string> {
    try {
      return await this._callOllamaApiChat(built, model, provider)
    } catch (err) {
      const msg = String(err)
      // If native API fails with connection error, try OpenAI-compatible
      if (msg.includes('ECONNREFUSED') || msg.includes('fetch failed') || msg.includes('404')) {
        logger.info('Ollama native API failed, falling back to OpenAI-compatible endpoint', { error: msg.slice(0, 100) })
        return this.callOpenAICompatible(built, model, provider)
      }
      throw err
    }
  },

  /**
   * Ollama native /api/chat endpoint.
   */
  async _callOllamaApiChat(
    built: ReturnType<typeof buildRequest>,
    model: ModelRow,
    provider: ProviderRow,
  ): Promise<string> {
    // Strip /v1 suffix from base URL if present for native API
    const baseUrl = (built.baseUrl || 'http://localhost:11434').replace(/\/v1\/?$/, '')
    const url = `${baseUrl}/api/chat`

    // Build messages including system prompt
    const messages: Array<{ role: string; content: string }> = []
    if (built.systemPrompt) {
      messages.push({ role: 'system', content: built.systemPrompt })
    }
    for (const msg of built.messages) {
      messages.push({ role: msg.role, content: msg.content })
    }

    const body = JSON.stringify({
      model: model.name,
      messages,
      stream: false,
      options: {
        temperature: 0.7,
      },
    })

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    logger.info(`POST ${redactSecrets(url)}`, { model: model.name, msgCount: messages.length })

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
      signal: AbortSignal.timeout(120000),
    })

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Unable to read error body')
      logger.error(`Ollama error (${response.status}): ${redactSecrets(errorBody.slice(0, 500))}`)
      throw new Error(`Ollama returned error ${response.status}: ${errorBody.slice(0, 300)}`)
    }

    const data = await response.json() as Record<string, unknown>

    // Ollama native response: { model, message: { role, content }, done }
    const message = data.message as { role?: string; content?: string } | undefined
    if (!message?.content) {
      logger.error('Unexpected Ollama response format', { data: JSON.stringify(data).slice(0, 500) })
      throw new Error('Unexpected response format from Ollama')
    }

    return message.content
  },

}
