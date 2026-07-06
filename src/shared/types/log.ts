// Shared log / debug types

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export type LogCategory =
  | 'app'              // General app events
  | 'routing'          // Prompt routing events
  | 'provider'         // Provider request metadata
  | 'tool'             // Tool call logs
  | 'import'           // Import logs
  | 'chat'             // Chat operations
  | 'project'          // Project operations
  | 'security'         // Security-related events
  | 'system'           // System-level events

export interface AppLogRow {
  id: string
  timestamp: string
  level: LogLevel
  category: LogCategory
  message: string
  metadata: string | null     // JSON object
  chat_id: string | null
  project_id: string | null
}

export interface NewAppLog {
  level: LogLevel
  category: LogCategory
  message: string
  metadata?: Record<string, unknown>
  chatId?: string
  projectId?: string
}

export interface LogFilter {
  level?: LogLevel
  category?: LogCategory
  search?: string
  chatId?: string
  projectId?: string
  startDate?: string       // ISO date string
  endDate?: string         // ISO date string
  limit?: number
  offset?: number
}

export interface DebugBundle {
  exportedAt: string
  appVersion: string
  platform: string
  arch: string
  settings: Record<string, string>
  recentLogs: AppLogRow[]
  toolCallLogs: unknown[]
  importLogs: unknown[]
  metadata: {
    logCount: number
    toolCallCount: number
    importLogCount: number
  }
}
