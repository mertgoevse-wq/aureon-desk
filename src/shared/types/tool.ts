// Shared tool/MCP types

export interface ToolRow {
  id: string
  name: string
  type: string // 'builtin' | 'mcp-stdio' | 'mcp-sse'
  config: string // JSON
  description: string | null
  is_enabled: number
  source: string | null
  source_path: string | null
  created_at: string
  updated_at: string
}

export interface NewTool {
  name: string
  type: 'builtin' | 'mcp-stdio' | 'mcp-sse'
  config: Record<string, unknown>
  description?: string
}
