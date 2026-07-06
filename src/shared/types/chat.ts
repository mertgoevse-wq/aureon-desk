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
}

export interface ChatWithMessages extends ChatRow {
  messages: MessageRow[]
}

export interface ChatListItem {
  id: string
  title: string
  updated_at: string
  message_count: number
  last_message_preview: string | null
}
