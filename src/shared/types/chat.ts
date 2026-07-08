// Shared chat types used across main, preload, and renderer

export type MessageRole = 'system' | 'user' | 'assistant' | 'tool'

export interface ChatRow {
  id: string
  title: string
  model_id: string | null
  system_prompt_id: string | null
  project_id: string | null
  created_at: string
  updated_at: string
  archived: number // sqlite boolean
}

export interface MessageRow {
  id: string
  chat_id: string
  role: MessageRole
  content: string
  tool_calls: string | null // JSON
  tool_call_id: string | null
  token_count: number | null
  provider_id: string | null
  provider_name: string | null
  model_id: string | null
  model_label: string | null
  adapter_type: string | null
  latency_ms: number | null
  created_at: string
  sort_order: number
}

export interface NewChat {
  title?: string
  model_id?: string
  system_prompt_id?: string
  project_id?: string
}

export interface NewMessage {
  chat_id: string
  role: MessageRole
  content: string
  tool_calls?: string
  tool_call_id?: string
  token_count?: number
  provider_id?: string
  provider_name?: string
  model_id?: string
  model_label?: string
  adapter_type?: string
  latency_ms?: number
}

export interface ChatWithMessages extends ChatRow {
  messages: MessageRow[]
}

export interface ChatSendInput {
  chatId: string
  expectedModelId?: string | null
}

export interface ChatSendResult {
  success: boolean
  message?: MessageRow
  error?: string
  errorCode?: 'no_provider' | 'no_model' | 'stale_model' | 'no_api_key' | 'provider_error' | 'timeout' | 'unknown'
  warnings?: string[]
  providerName?: string
  modelName?: string
  providerModel?: import('./provider').CanonicalModelReference
}

export interface ChatListItem {
  id: string
  title: string
  updated_at: string
  message_count: number
  last_message_preview: string | null
}
