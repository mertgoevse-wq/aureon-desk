import { chatService } from './chat.service'
import { providerService } from './provider.service'
import { modelRouterService } from './model-router.service'
import { callProviderApi } from './provider-call'
import { promptService } from './prompt.service'
import { projectService } from './project.service'
import { buildRequest } from './request-builder'
import { resolvePrompt } from './hierarchy-resolver'
import { logger } from '../utils/logger'
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
    const messages = built.messages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    const params = {
      adapter,
      baseUrl: built.baseUrl,
      apiKey: built.apiKey,
      model: model.name,
      systemPrompt: built.systemPrompt || undefined,
      messages,
      temperature: 0.7,
      maxTokens: 4096,
      timeoutMs: 120000,
    }

    // Ollama: try native API first, fall back to OpenAI-compatible on connection errors
    if (adapter === 'ollama') {
      try {
        return await callProviderApi(params)
      } catch (err) {
        const msg = String(err)
        if (msg.includes('ECONNREFUSED') || msg.includes('fetch failed') || msg.includes('404')) {
          logger.info('Ollama native API failed, falling back to OpenAI-compatible endpoint', { error: msg.slice(0, 100) })
          return callProviderApi({ ...params, adapter: 'lmstudio' })
        }
        throw err
      }
    }

    return callProviderApi(params)
  },

}
