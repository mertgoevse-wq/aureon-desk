// Shared prompt types

export interface SystemPromptRow {
  id: string
  name: string
  description: string | null
  content: string
  tags: string | null       // JSON array of tag strings
  category: string | null
  is_default: number
  is_archived: number
  priority: number          // 0 = lowest, higher = higher priority in hierarchy
  created_at: string
  updated_at: string
}

export interface PromptRow {
  id: string
  title: string
  content: string
  description: string | null
  variables: string | null   // JSON array of variable names from {{var}} placeholders
  tags: string | null        // JSON array
  category: string | null
  favorite: number           // 0 or 1
  usage_count: number        // times inserted via slash or copy
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
  tags?: string[]
  category?: string
  is_default?: boolean
  priority?: number
}

export interface NewPrompt {
  title: string
  content: string
  description?: string
  variables?: string[]
  tags?: string[]
  category?: string
  is_template?: boolean
}

/** Built-in slash command definitions */
export interface SlashCommand {
  id: string
  label: string
  description: string
  content: string            // Template content with optional {{variable}} placeholders
  variables?: string[]       // Variable names found in content
  icon: string               // Lucide icon name
  category: 'coding' | 'writing' | 'analysis' | 'system' | 'prompts'
}

/** Prompt import/export format */
export interface PromptExport {
  version: number
  exportedAt: string
  prompts: PromptRow[]
}

/** Markdown/YAML import parsed result */
export interface ParsedPromptImport {
  title: string
  content: string
  description?: string
  tags?: string[]
  category?: string
}

/** Result of resolving the system prompt hierarchy */
export interface ResolvedPrompt {
  text: string
  sources: PromptLayer[]
  warnings: PromptWarning[]
}

export interface PromptLayer {
  name: string
  content: string
  priority: number
}

export interface PromptWarning {
  type: 'secret_detected' | 'tool_bypass' | 'empty'
  message: string
  severity: 'low' | 'medium' | 'high'
}

/** Inputs for the hierarchy resolver */
export interface HierarchyInput {
  globalBasePolicy?: string          // Global safety/instruction baseline
  projectInstructions?: string        // From project.instructions
  selectedProfile?: SystemPromptRow   // Selected prompt profile
  chatOverride?: string               // Chat-level override
  taskInstruction?: string            // Temporary per-task instruction
}
