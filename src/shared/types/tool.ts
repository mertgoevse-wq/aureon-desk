// MCP-style tool types

export type TransportType = 'stdio' | 'http' | 'sse' | 'websocket' | 'local'
export type ToolPermission = 'file_read' | 'file_write' | 'shell_command' | 'network' | 'browser' | 'git' | 'database' | 'clipboard' | 'secrets'

export interface ToolRow {
  id: string
  name: string
  description: string | null
  version: string
  source: string | null          // 'builtin' | 'imported' | 'mcp'
  source_path: string | null
  transport: TransportType
  command: string | null          // Command to run (for stdio)
  config: string                  // JSON config
  permissions: string | null      // JSON array of ToolPermission
  is_enabled: number
  is_trusted: number             // 1 = user explicitly trusts this tool
  created_at: string
  updated_at: string
}

export interface ToolPermissionRow {
  id: string
  tool_id: string
  permission: ToolPermission
  granted: number
  created_at: string
}

export interface ToolCallLog {
  id: string
  tool_id: string
  tool_name: string
  status: 'approved' | 'denied' | 'blocked_untrusted' | 'blocked_disabled' | 'blocked_unknown' | 'error'
  input_preview: string           // First 200 chars of input
  output_preview: string | null
  permission_checks: string | null // JSON array
  error_message: string | null
  created_at: string
}

export interface NewTool {
  name: string
  description?: string
  version?: string
  transport?: TransportType
  command?: string
  config?: Record<string, unknown>
  permissions?: ToolPermission[]
  source?: 'builtin' | 'imported' | 'mcp'
  is_trusted?: boolean
}

// Safety check result
export interface SafetyCheckResult {
  allowed: boolean
  reason: 'all_checks_passed' | 'tool_disabled' | 'tool_unknown' | 'tool_untrusted' | 'tool_destructive' | 'permission_denied'
  message: string
  requiresConfirmation: boolean
  dryRunPreview: string | null
}

// IPC types
export interface ToolExecuteInput {
  toolId: string
  input: Record<string, unknown>
}

export interface ToolExecuteResult {
  success: boolean
  output: string
  error: string | null
  safetyCheck: SafetyCheckResult
  logId: string
}
