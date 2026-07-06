import type { MessageRow } from '../../shared/types/chat'
import type { ModelRow, ProviderRow } from '../../shared/types/provider'
import type { SystemPromptRow, ResolvedPrompt } from '../../shared/types/prompt'
import { providerService } from './provider.service'
import { vault } from '../security/vault'
import { logger } from '../utils/logger'
import { redactSecrets } from './log-redacter'

/**
 * Request Builder — assembles all components into a sendable API request.
 * Combines: system prompt hierarchy → chat messages → model → provider → tools.
 * Redacts secrets from logs and warns about local→remote file transfers.
 */

export interface BuiltRequest {
  provider: ProviderRow
  model: ModelRow
  systemPrompt: string | null
  messages: Array<{ role: string; content: string }>
  apiKey: string | null
  baseUrl: string
  headers: Record<string, string>
  warnings: string[]
}

export interface BuildRequestInput {
  chatId: string
  providerId: string
  modelId: string
  messages: MessageRow[]
  resolvedPrompt?: ResolvedPrompt | null
  systemPromptProfile?: SystemPromptRow | null
  tools?: string[]
}

/**
 * Sanitize a string for log output — redacts API keys, Bearer tokens, and secrets.
 * Delegates to the unified log-redacter.
 */
export const redactForLog = redactSecrets

/**
 * Build a complete API request from all components.
 */
export function buildRequest(input: BuildRequestInput): BuiltRequest {
  const warnings: string[] = []
  const provider = providerService.getProvider(input.providerId)
  if (!provider) throw new Error(`Provider ${input.providerId} not found`)

  const model = provider.models.find(m => m.id === input.modelId)
  if (!model) throw new Error(`Model ${input.modelId} not found for provider ${provider.name}`)

  // System prompt: hierarchy resolved > chat profile > null
  let systemPrompt: string | null = null
  if (input.resolvedPrompt && input.resolvedPrompt.text) {
    systemPrompt = input.resolvedPrompt.text
  } else if (input.systemPromptProfile && input.systemPromptProfile.content) {
    systemPrompt = input.systemPromptProfile.content
  }

  // Messages
  const messages = input.messages
    .filter(m => m.role !== 'system' && m.role !== 'tool')
    .map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user' as const, content: m.content }))

  // API key
  const apiKey = providerService.getApiKey(provider.id)

  // Base URL
  const baseUrl = provider.base_url || ''

  // Headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }

  if (apiKey && provider.adapter !== 'ollama' && provider.adapter !== 'lmstudio') {
    headers['Authorization'] = `Bearer ${apiKey}`
  }

  if (provider.adapter === 'openai' || provider.adapter === 'openrouter' || provider.adapter === 'custom') {
    // OpenAI-compatible header
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`
  }

  if (provider.adapter === 'anthropic' && apiKey) {
    headers['x-api-key'] = apiKey
    delete headers['Authorization']
  }

  if (provider.adapter === 'google' && apiKey) {
    // Google uses query param, not header
    delete headers['Authorization']
  }

  // Warnings
  if (provider.adapter !== 'ollama' && provider.adapter !== 'lmstudio') {
    warnings.push(`⚠️ Sending to remote provider: ${provider.name}`)
  }

  // Check for local file references in messages that are going to remote providers
  if (provider.adapter !== 'ollama' && provider.adapter !== 'lmstudio') {
    const hasFileRefs = input.messages.some(m =>
      m.content && (m.content.includes('file://') || m.content.includes('/tmp/') || m.content.includes('C:\\'))
    )
    if (hasFileRefs) {
      warnings.push('⚠️ This request may contain local file paths. Local files will be sent to a remote provider.')
    }
  }

  // Log the built request (with secrets redacted)
  const logSafe = {
    provider: provider.name,
    model: model.name,
    messageCount: messages.length,
    hasSystemPrompt: !!systemPrompt,
    hasApiKey: !!apiKey,
    tools: input.tools?.length || 0,
    warnings,
    headers: Object.keys(headers).reduce((acc, k) => {
      acc[k] = redactForLog(headers[k])
      return acc
    }, {} as Record<string, string>),
  }
  logger.info(`Built request: ${JSON.stringify(logSafe)}`)

  return {
    provider,
    model,
    systemPrompt,
    messages,
    apiKey,
    baseUrl,
    headers,
    warnings,
  }
}
