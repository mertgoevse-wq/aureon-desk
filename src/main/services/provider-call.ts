import { logger } from '../utils/logger'
import { redactSecrets } from './log-redacter'

// ─── Types ────────────────────────────────────────────

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ProviderApiParams {
  adapter: string
  baseUrl: string
  apiKey?: string | null
  model: string
  systemPrompt?: string
  messages: ChatMessage[]
  temperature?: number
  maxTokens?: number
  timeoutMs?: number
  headers?: Record<string, string>
}

// ─── Router ───────────────────────────────────────────

/**
 * Call a provider's API endpoint and return the response text.
 * Routes to the correct adapter-specific implementation based on `adapter`.
 */
export async function callProviderApi(params: ProviderApiParams): Promise<string> {
  const { adapter } = params

  switch (adapter) {
    case 'anthropic':
      return _callAnthropic(params)
    case 'google':
      return _callGoogle(params)
    case 'ollama':
      return _callOllamaNative(params)
    default:
      // openai, openrouter, groq, mistral, deepseek, nvidia, huggingface, custom, lmstudio
      return _callOpenAICompatible(params)
  }
}

// ─── Streaming API ────────────────────────────────────

/**
 * Call a provider's API with SSE streaming.
 * Calls onToken for throttled content delta chunks (~150ms).
 * Returns the complete accumulated text when done.
 *
 * Supports OpenAI-compatible, Anthropic, and Ollama native streaming.
 * Falls back to chunked non-streaming for adapters like Google Gemini.
 */
export async function callProviderApiStreaming(
  params: ProviderApiParams,
  onToken: (chunk: string) => void,
): Promise<string> {
  const { adapter } = params

  switch (adapter) {
    case 'anthropic':
      return _callAnthropicStreaming(params, onToken)
    case 'google':
      // Gemini streaming requires different SSE parsing; fall back with chunking
      return _fallbackNonStreaming(params, onToken)
    case 'ollama':
      return _callOllamaStreaming(params, onToken)
    default:
      // openai, openrouter, groq, mistral, deepseek, nvidia, custom, lmstudio
      return _callOpenAICompatibleStreaming(params, onToken)
  }
}

async function _fallbackNonStreaming(
  params: ProviderApiParams,
  onToken: (chunk: string) => void,
): Promise<string> {
  const text = await callProviderApi(params)
  // Emit the full text in chunks for a streaming-like UX
  const chunks = text.match(/.{1,200}/g) || [text]
  for (const chunk of chunks) {
    onToken(chunk)
    await sleep(30)
  }
  return text
}

/**
 * OpenAI-compatible streaming: POST {baseUrl}/chat/completions with stream:true.
 * Parses SSE data lines: data: {"choices":[{"delta":{"content":"..."}}]}
 */
async function _callOpenAICompatibleStreaming(
  params: ProviderApiParams,
  onToken: (chunk: string) => void,
): Promise<string> {
  const {
    baseUrl, apiKey, model, systemPrompt, messages,
    temperature = 0.7, maxTokens = 4096, timeoutMs = 120000,
    headers: extraHeaders,
    adapter,
  } = params

  const url = `${baseUrl}/chat/completions`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  }
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`
  }
  if (adapter === 'openrouter') {
    headers['HTTP-Referer'] = extraHeaders?.['HTTP-Referer'] || 'Vibeforge-desk'
    headers['X-Title'] = extraHeaders?.['X-Title'] || 'Vibeforge'
  }

  const fullMessages: ChatMessage[] = []
  if (systemPrompt) {
    fullMessages.push({ role: 'system', content: systemPrompt })
  }
  fullMessages.push(...messages)

  const body = JSON.stringify({
    model,
    messages: fullMessages,
    temperature,
    max_tokens: maxTokens,
    stream: true,
  })

  logger.info(`POST (streaming) ${redactSecrets(url)}`, { model, msgCount: messages.length, adapter })

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body,
    signal: AbortSignal.timeout(timeoutMs),
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'Unable to read error body')
    logger.error(`Provider streaming error (${response.status}): ${redactSecrets(errorBody.slice(0, 500))}`)
    if (response.status === 401 || response.status === 403) {
      throw new Error(`Authentication failed (${response.status}). Check your API key.`)
    }
    if (response.status === 429) {
      throw new Error('Rate limited. Please wait and try again.')
    }
    throw new Error(`Provider returned error ${response.status}: ${errorBody.slice(0, 300)}`)
  }

  const reader = response.body?.getReader()
  if (!reader) throw new Error('No response body for streaming')

  const decoder = new TextDecoder()
  let fullText = ''
  let buffer = ''
  let lastFlush = Date.now()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })

    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || !trimmed.startsWith('data:')) continue

      const data = trimmed.slice(5).trim()
      if (data === '[DONE]') continue

      try {
        const parsed = JSON.parse(data) as Record<string, unknown>
        const choices = parsed.choices as Array<{ delta?: { content?: string } }> | undefined
        const content = choices?.[0]?.delta?.content
        if (content) {
          fullText += content
          const now = Date.now()
          if (now - lastFlush >= 150) {
            onToken(content)
            lastFlush = now
          }
        }
      } catch {
        // Skip unparseable SSE data
      }
    }
  }

  return fullText
}

/**
 * Anthropic streaming: POST {baseUrl}/messages with stream:true.
 * Parses SSE events: event: content_block_delta → data: {"delta":{"text":"..."}}
 */
async function _callAnthropicStreaming(
  params: ProviderApiParams,
  onToken: (chunk: string) => void,
): Promise<string> {
  const {
    baseUrl, apiKey, model, systemPrompt, messages,
    maxTokens = 4096, timeoutMs = 120000,
  } = params

  const url = `${baseUrl}/messages`

  const mergedMessages = messages.reduce(
    (acc: ChatMessage[], msg) => {
      if (acc.length > 0 && acc[acc.length - 1].role === msg.role) {
        acc[acc.length - 1] = {
          ...acc[acc.length - 1],
          content: acc[acc.length - 1].content + '\n\n' + msg.content,
        }
      } else {
        acc.push(msg)
      }
      return acc
    },
    [],
  )

  const body = JSON.stringify({
    model,
    system: systemPrompt || undefined,
    messages: mergedMessages,
    max_tokens: maxTokens,
    stream: true,
  })

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-api-key': apiKey || '',
    'anthropic-version': '2023-06-01',
  }

  logger.info(`POST (streaming) ${redactSecrets(url)}`, { model, msgCount: mergedMessages.length })

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body,
    signal: AbortSignal.timeout(timeoutMs),
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'Unable to read error body')
    logger.error(`Anthropic streaming error (${response.status}): ${redactSecrets(errorBody.slice(0, 500))}`)
    if (response.status === 401 || response.status === 403) {
      throw new Error(`Anthropic authentication failed (${response.status}). Check your API key.`)
    }
    throw new Error(`Anthropic returned error ${response.status}: ${errorBody.slice(0, 300)}`)
  }

  const reader = response.body?.getReader()
  if (!reader) throw new Error('No response body for streaming')

  const decoder = new TextDecoder()
  let fullText = ''
  let buffer = ''
  let lastFlush = Date.now()
  let currentEvent = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })

    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue

      if (trimmed.startsWith('event:')) {
        currentEvent = trimmed.slice(6).trim()
        continue
      }

      if (!trimmed.startsWith('data:')) continue

      const data = trimmed.slice(5).trim()
      if (currentEvent === 'content_block_delta' || currentEvent === 'content_block_start') {
        try {
          const parsed = JSON.parse(data) as Record<string, unknown>
          const delta = parsed.delta as { text?: string } | undefined
          if (delta?.text) {
            fullText += delta.text
            const now = Date.now()
            if (now - lastFlush >= 150) {
              onToken(delta.text)
              lastFlush = now
            }
          }
        } catch {
          // Skip unparseable
        }
      }
    }
  }

  return fullText
}

/**
 * Ollama streaming: POST {baseUrl}/api/chat with stream:true.
 * Each line is a JSON response with message.content containing the delta.
 */
async function _callOllamaStreaming(
  params: ProviderApiParams,
  onToken: (chunk: string) => void,
): Promise<string> {
  const {
    baseUrl, model, systemPrompt, messages,
    temperature = 0.7, timeoutMs = 180000,
  } = params

  const ollamaBase = (baseUrl || 'http://localhost:11434').replace(/\/v1\/?$/, '')
  const url = `${ollamaBase}/api/chat`

  const fullMessages: ChatMessage[] = []
  if (systemPrompt) {
    fullMessages.push({ role: 'system', content: systemPrompt })
  }
  fullMessages.push(...messages)

  const body = JSON.stringify({
    model,
    messages: fullMessages,
    stream: true,
    options: { temperature },
  })

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  logger.info(`POST (streaming) ${redactSecrets(url)}`, { model, msgCount: fullMessages.length })

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body,
    signal: AbortSignal.timeout(timeoutMs),
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'Unable to read error body')
    logger.error(`Ollama streaming error (${response.status}): ${redactSecrets(errorBody.slice(0, 500))}`)
    throw new Error(`Ollama returned error ${response.status}: ${errorBody.slice(0, 300)}`)
  }

  const reader = response.body?.getReader()
  if (!reader) throw new Error('No response body for streaming')

  const decoder = new TextDecoder()
  let fullText = ''
  let buffer = ''
  let lastFlush = Date.now()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })

    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue

      try {
        const parsed = JSON.parse(trimmed) as Record<string, unknown>
        const message = parsed.message as { content?: string } | undefined
        if (message?.content) {
          fullText += message.content
          const now = Date.now()
          if (now - lastFlush >= 150) {
            onToken(message.content)
            lastFlush = now
          }
        }
      } catch {
        // Skip unparseable
      }
    }
  }

  return fullText
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ─── OpenAI-compatible ────────────────────────────────

/**
 * POST {baseUrl}/chat/completions
 * Used by: OpenAI, OpenRouter, Groq, Mistral, DeepSeek, NVIDIA, Custom, LM Studio
 */
async function _callOpenAICompatible(params: ProviderApiParams): Promise<string> {
  const {
    baseUrl, apiKey, model, systemPrompt, messages,
    temperature = 0.7, maxTokens = 4096, timeoutMs = 120000,
    headers: extraHeaders,
    adapter,
  } = params

  const url = `${baseUrl}/chat/completions`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  }
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`
  }
  if (adapter === 'openrouter') {
    headers['HTTP-Referer'] = extraHeaders?.['HTTP-Referer'] || 'Vibeforge-desk'
    headers['X-Title'] = extraHeaders?.['X-Title'] || 'Vibeforge'
  }

  // Build full messages array with system prompt if provided
  const fullMessages: ChatMessage[] = []
  if (systemPrompt) {
    fullMessages.push({ role: 'system', content: systemPrompt })
  }
  fullMessages.push(...messages)

  const body = JSON.stringify({
    model,
    messages: fullMessages,
    temperature,
    max_tokens: maxTokens,
  })

  logger.info(`POST ${redactSecrets(url)}`, { model, msgCount: messages.length, adapter })

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body,
    signal: AbortSignal.timeout(timeoutMs),
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'Unable to read error body')
    logger.error(`Provider error (${response.status}): ${redactSecrets(errorBody.slice(0, 500))}`)
    if (response.status === 401 || response.status === 403) {
      throw new Error(`Authentication failed (${response.status}). Check your API key.`)
    }
    if (response.status === 429) {
      throw new Error('Rate limited. Please wait and try again.')
    }
    throw new Error(`Provider returned error ${response.status}: ${errorBody.slice(0, 300)}`)
  }

  const data = await response.json() as Record<string, unknown>
  const choices = data.choices as Array<{ message?: { content?: string } }> | undefined
  if (!choices?.[0]?.message?.content) {
    logger.error('Unexpected response format', { data: JSON.stringify(data).slice(0, 500) })
    throw new Error('Unexpected response format — no content in response')
  }
  return choices[0].message.content
}

// ─── Anthropic ────────────────────────────────────────

/**
 * POST {baseUrl}/messages
 * Uses separate system field, consecutive messages merged.
 */
async function _callAnthropic(params: ProviderApiParams): Promise<string> {
  const {
    baseUrl, apiKey, model, systemPrompt, messages,
    maxTokens = 4096, timeoutMs = 120000,
  } = params

  const url = `${baseUrl}/messages`

  // Merge consecutive same-role messages for Anthropic compatibility
  const mergedMessages = messages.reduce(
    (acc: ChatMessage[], msg) => {
      if (acc.length > 0 && acc[acc.length - 1].role === msg.role) {
        acc[acc.length - 1] = {
          ...acc[acc.length - 1],
          content: acc[acc.length - 1].content + '\n\n' + msg.content,
        }
      } else {
        acc.push(msg)
      }
      return acc
    },
    [],
  )

  const body = JSON.stringify({
    model,
    system: systemPrompt || undefined,
    messages: mergedMessages,
    max_tokens: maxTokens,
  })

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-api-key': apiKey || '',
    'anthropic-version': '2023-06-01',
  }

  logger.info(`POST ${redactSecrets(url)}`, { model, msgCount: mergedMessages.length })

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body,
    signal: AbortSignal.timeout(timeoutMs),
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
  if (!content?.[0]?.text) {
    logger.error('Unexpected Anthropic response format', { data: JSON.stringify(data).slice(0, 500) })
    throw new Error('Unexpected response format from Anthropic')
  }
  return content[0].text
}

// ─── Google Gemini ────────────────────────────────────

/**
 * POST {baseUrl}/models/{model}:generateContent?key={apiKey}
 * Maps 'assistant' role to 'model'.
 */
async function _callGoogle(params: ProviderApiParams): Promise<string> {
  const {
    baseUrl, apiKey, model, systemPrompt, messages,
    timeoutMs = 120000,
  } = params

  const url = `${baseUrl}/models/${model}:generateContent?key=${apiKey || ''}`

  // Map roles: assistant → model
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const body: Record<string, unknown> = { contents }
  if (systemPrompt) {
    body.systemInstruction = { parts: [{ text: systemPrompt }] }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  logger.info(`POST ${redactSecrets(url)}`, { model, msgCount: contents.length })

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
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

  if (!candidates?.[0]?.content?.parts?.[0]?.text) {
    if (candidates?.[0] && !candidates[0].content) {
      const finishReason = (candidates[0] as Record<string, unknown>).finishReason
      throw new Error(`Gemini blocked the response (${finishReason || 'safety filter'}). Try rephrasing your message.`)
    }
    logger.error('Unexpected Gemini response format', { data: JSON.stringify(data).slice(0, 500) })
    throw new Error('Unexpected response format from Gemini')
  }

  return candidates[0].content.parts[0].text
}

// ─── Ollama Native ────────────────────────────────────

/**
 * POST {baseUrl}/api/chat (strips /v1 suffix if present)
 */
async function _callOllamaNative(params: ProviderApiParams): Promise<string> {
  const {
    baseUrl, model, systemPrompt, messages,
    temperature = 0.7, timeoutMs = 120000,
  } = params

  // Strip /v1 suffix for native API
  const ollamaBase = (baseUrl || 'http://localhost:11434').replace(/\/v1\/?$/, '')
  const url = `${ollamaBase}/api/chat`

  const fullMessages: ChatMessage[] = []
  if (systemPrompt) {
    fullMessages.push({ role: 'system', content: systemPrompt })
  }
  fullMessages.push(...messages)

  const body = JSON.stringify({
    model,
    messages: fullMessages,
    stream: false,
    options: { temperature },
  })

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  logger.info(`POST ${redactSecrets(url)}`, { model, msgCount: messages.length })

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body,
    signal: AbortSignal.timeout(timeoutMs),
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'Unable to read error body')
    logger.error(`Ollama error (${response.status}): ${redactSecrets(errorBody.slice(0, 500))}`)
    throw new Error(`Ollama returned error ${response.status}: ${errorBody.slice(0, 300)}`)
  }

  const data = await response.json() as Record<string, unknown>
  const message = data.message as { role?: string; content?: string } | undefined
  if (!message?.content) {
    logger.error('Unexpected Ollama response format', { data: JSON.stringify(data).slice(0, 500) })
    throw new Error('Unexpected response format from Ollama')
  }
  return message.content
}
