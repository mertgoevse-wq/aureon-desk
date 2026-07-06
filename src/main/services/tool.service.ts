import { v4 as uuid } from 'uuid'
import { getDb } from '../db/connection'
import { tools, toolPermissions, toolCallLogs } from '../db/schema'
import { eq } from 'drizzle-orm'
import { logger } from '../utils/logger'
import { checkToolSafety, logToolCall } from './tool-safety-gate'
import type { ToolRow, NewTool, ToolPermission, ToolCallLog } from '../../shared/types/tool'

/**
 * Tool Service — CRUD for tools, 3 built-in mock tools, and permission management.
 * Imported tools are disabled by default. Built-in tools are enabled but untrusted.
 */

const BUILTIN_MOCK_TOOLS: NewTool[] = [
  {
    name: 'file_search_mock',
    description: 'Search for files matching a pattern in a directory. Mock tool — does not access real files.',
    version: '1.0.0',
    transport: 'local',
    config: { mock: true, maxResults: 50 },
    permissions: ['file_read'],
    source: 'builtin',
  },
  {
    name: 'git_status_mock',
    description: 'Get git repository status (branch, changes, last commit). Mock tool — does not access real git.',
    version: '1.0.0',
    transport: 'local',
    config: { mock: true },
    permissions: ['git'],
    source: 'builtin',
  },
  {
    name: 'project_summary_mock',
    description: 'Generate a summary of the current project structure and metadata. Mock tool — does not modify files.',
    version: '1.0.0',
    transport: 'local',
    config: { mock: true },
    permissions: ['file_read'],
    source: 'builtin',
  },
]

export const toolService = {
  // ---- CRUD ----

  listTools(): ToolRow[] {
    const db = getDb()
    return db.select().from(tools).all() as ToolRow[]
  },

  getTool(id: string): ToolRow | undefined {
    const db = getDb()
    return db.select().from(tools).where(eq(tools.id, id)).get() as ToolRow | undefined
  },

  createTool(input: NewTool): ToolRow {
    const db = getDb()
    const now = new Date().toISOString()
    const id = uuid()

    db.insert(tools).values({
      id,
      name: input.name,
      description: input.description || null,
      version: input.version || '1.0.0',
      source: input.source || null,
      source_path: null,
      transport: input.transport || 'local',
      command: input.command || null,
      config: JSON.stringify(input.config || {}),
      permissions: input.permissions ? JSON.stringify(input.permissions) : null,
      is_enabled: input.source === 'imported' ? 0 : 1,
      is_trusted: input.is_trusted ? 1 : 0,
      created_at: now,
      updated_at: now,
    } as never).run()

    logger.info(`Created tool: ${input.name}`)
    return this.getTool(id)!
  },

  updateTool(id: string, input: Partial<NewTool>): ToolRow | undefined {
    const db = getDb()
    const now = new Date().toISOString()
    const data: Record<string, unknown> = { updated_at: now }
    if (input.name !== undefined) data.name = input.name
    if (input.description !== undefined) data.description = input.description
    if (input.version !== undefined) data.version = input.version
    if (input.transport !== undefined) data.transport = input.transport
    if (input.command !== undefined) data.command = input.command
    if (input.config !== undefined) data.config = JSON.stringify(input.config)
    if (input.permissions !== undefined) data.permissions = JSON.stringify(input.permissions)
    if (input.is_trusted !== undefined) data.is_trusted = input.is_trusted ? 1 : 0

    db.update(tools).set(data as never).where(eq(tools.id, id)).run()
    return this.getTool(id)
  },

  deleteTool(id: string): boolean {
    const db = getDb()
    const result = db.delete(tools).where(eq(tools.id, id)).run()
    return result.changes > 0
  },

  toggleEnabled(id: string): ToolRow | undefined {
    const tool = this.getTool(id)
    if (!tool) return undefined
    return this.setEnabled(id, !tool.is_enabled)
  },

  setEnabled(id: string, enabled: boolean): ToolRow | undefined {
    const db = getDb()
    db.update(tools).set({ is_enabled: enabled ? 1 : 0 } as never).where(eq(tools.id, id)).run()
    return this.getTool(id)
  },

  setTrusted(id: string, trusted: boolean): ToolRow | undefined {
    const db = getDb()
    db.update(tools).set({ is_trusted: trusted ? 1 : 0 } as never).where(eq(tools.id, id)).run()
    return this.getTool(id)
  },

  // ---- Seed ----

  /** Seed the 3 built-in mock tools if they don't exist */
  seedMockTools(): void {
    try {
      const db = getDb()
      const existing = db.select().from(tools).all() as ToolRow[]
      const existingNames = new Set(existing.map(t => t.name))
      const now = new Date().toISOString()

      for (const mock of BUILTIN_MOCK_TOOLS) {
        if (existingNames.has(mock.name)) continue
        const id = uuid()
        db.insert(tools).values({
          id, name: mock.name, description: mock.description,
          version: mock.version || '1.0.0', source: mock.source || 'builtin',
          source_path: null, transport: mock.transport || 'local',
          command: mock.command || null, config: JSON.stringify(mock.config || {}),
          permissions: mock.permissions ? JSON.stringify(mock.permissions) : null,
          is_enabled: 1, is_trusted: 0,
          created_at: now, updated_at: now
        } as never).run()
        logger.info(`Seeded mock tool: ${mock.name}`)
      }
    } catch (err) {
      logger.error('Failed to seed mock tools', err)
    }
  },

  // ---- Execution ----

  /** Execute a tool (after safety gate check) */
  executeTool(toolId: string, input: Record<string, unknown>): {
    success: boolean; output: string; error: string | null; safetyCheck: ReturnType<typeof checkToolSafety>; logId: string
  } {
    // Safety gate
    const safetyCheck = checkToolSafety(toolId, input)
    const tool = this.getTool(toolId)!
    
    if (!safetyCheck.allowed) {
      const logId = logToolCall({
        toolId, toolName: tool?.name || 'unknown', status: safetyCheck.reason === 'tool_disabled' ? 'blocked_disabled' :
          safetyCheck.reason === 'tool_untrusted' ? 'blocked_untrusted' :
          safetyCheck.reason === 'tool_unknown' ? 'blocked_unknown' : 'denied',
        input, error: safetyCheck.message
      })
      return { success: false, output: '', error: safetyCheck.message, safetyCheck, logId }
    }

    // If destructive, return the safety check for caller to handle confirmation
    if (safetyCheck.requiresConfirmation) {
      const logId = logToolCall({
        toolId, toolName: tool.name, status: 'denied',
        input, error: 'Awaiting user confirmation',
        permissionChecks: tool.permissions ? JSON.parse(tool.permissions) : []
      })
      return { success: false, output: '', error: 'Confirmation required', safetyCheck, logId }
    }

    // Execute mock tool
    try {
      const output = runMockTool(tool.name, input)
      const logId = logToolCall({
        toolId, toolName: tool.name, status: 'approved', input, output,
        permissionChecks: tool.permissions ? JSON.parse(tool.permissions) : []
      })
      return { success: true, output, error: null, safetyCheck, logId }
    } catch (err) {
      const logId = logToolCall({
        toolId, toolName: tool.name, status: 'error', input, error: String(err)
      })
      return { success: false, output: '', error: String(err), safetyCheck, logId }
    }
  },

  // ---- Logs ----

  getCallLogs(toolId?: string): ToolCallLog[] {
    const db = getDb()
    if (toolId) {
      return db.select().from(toolCallLogs)
        .where(eq(toolCallLogs.tool_id, toolId))
        .all() as ToolCallLog[]
    }
    return db.select().from(toolCallLogs).all().slice(-50) as ToolCallLog[]
  }
}

// ---- Mock Tool Runners ----

function runMockTool(name: string, input: Record<string, unknown>): string {
  switch (name) {
    case 'file_search_mock':
      return JSON.stringify({
        mock: true,
        pattern: input.pattern || '*',
        path: input.path || '.',
        results: [
          'src/main/index.ts',
          'src/renderer/src/App.tsx',
          'src/renderer/src/components/chat/MessageInput.tsx',
          'src/shared/types/tool.ts',
          'README.md'
        ].filter(f => !input.pattern || f.includes(String(input.pattern).replace(/\*/g, ''))),
        totalMatches: 5
      }, null, 2)

    case 'git_status_mock':
      return JSON.stringify({
        mock: true,
        branch: 'master',
        status: 'clean',
        lastCommit: 'ac9f0ca - Implement secure GitHub star list importer',
        behind: 0,
        ahead: 0,
        changedFiles: []
      }, null, 2)

    case 'project_summary_mock':
      return JSON.stringify({
        mock: true,
        projectName: 'Aureon Desk',
        language: 'TypeScript',
        framework: 'Electron + React',
        totalFiles: 85,
        totalLines: 12000,
        mainModules: ['electron main', 'react renderer', 'shared types', 'database', 'services'],
        lastBuild: new Date().toISOString()
      }, null, 2)

    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}
