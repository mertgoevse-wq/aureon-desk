// Shared prompt types

export interface SystemPromptRow {
  id: string
  name: string
  description: string | null
  content: string
  is_default: number
  created_at: string
  updated_at: string
}

export interface PromptRow {
  id: string
  title: string
  content: string
  description: string | null
  tags: string | null // JSON array
  category: string | null
  source: string | null
  source_path: string | null
  is_template: number
  created_at: string
  updated_at: string
}

export interface NewSystemPrompt {
  name: string
  description?: string
  content: string
  is_default?: boolean
}

export interface NewPrompt {
  title: string
  content: string
  description?: string
  tags?: string[]
  category?: string
  is_template?: boolean
}
