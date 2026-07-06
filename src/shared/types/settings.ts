// Shared settings types

export interface AppSettings {
  theme: 'light' | 'dark'
  fontSize: 'small' | 'medium' | 'large'
  sidebarWidth: number
  inspectorOpen: boolean
  inspectorWidth: number
  defaultModelId: string | null
  defaultSystemPromptId: string | null
  autoSaveChats: boolean
  confirmToolCalls: boolean
  maxContextTokens: number
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  fontSize: 'medium',
  sidebarWidth: 280,
  inspectorOpen: true,
  inspectorWidth: 340,
  defaultModelId: null,
  defaultSystemPromptId: null,
  autoSaveChats: true,
  confirmToolCalls: true,
  maxContextTokens: 200000
}
