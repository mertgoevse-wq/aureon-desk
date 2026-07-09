import { v4 as uuid } from 'uuid'
import { getDb } from '../db/connection'
import { tools, toolPermissions, toolCallLogs } from '../db/schema'
import { eq } from 'drizzle-orm'
import { logger } from '../utils/logger'
import { checkToolSafety, logToolCall } from './tool-safety-gate'
import { mcpClientService } from './mcp-client.service'
import { redactSecrets } from './log-redacter'
import type {
  ToolRow, NewTool, ToolPermission, ToolCallLog,
  McpDiscoveryResult, McpDiscoveredTool, McpDiscoveredResource, McpDiscoveredPrompt,
  ConnectionStatus, TrustLevel, McpPreset,
} from '../../shared/types/tool'

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

// MCP Server Presets
export const MCP_PRESETS: McpPreset[] = [
  {
    id: 'filesystem',
    name: 'Local Filesystem',
    description: 'Read, write, and manage files on your local machine via MCP.',
    icon: 'FolderOpen',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@anthropic/mcp-server-filesystem', '.'],
    requiredBinary: 'npx',
    setupInstructions: 'Install Node.js (v18+) and run: npm install -g npx',
    permissions: ['file_read', 'file_write'],
    riskLevel: 'write_local',
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Access GitHub repos, PRs, issues, and manage code via MCP.',
    icon: 'Github',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@anthropic/mcp-server-github'],
    requiredBinary: 'npx',
    setupInstructions: 'Install Node.js (v18+) and set GITHUB_TOKEN env var: export GITHUB_TOKEN=<your_token>',
    permissions: ['file_read', 'git', 'network'],
    riskLevel: 'account_action',
  },
  {
    id: 'browser_search',
    name: 'Browser Search',
    description: 'Search the web and fetch page content via MCP (Puppeteer-based).',
    icon: 'Globe',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@anthropic/mcp-server-brave-search'],
    requiredBinary: 'npx',
    setupInstructions: 'Install Node.js (v18+) and set BRAVE_API_KEY env var',
    permissions: ['network', 'browser'],
    riskLevel: 'write_remote',
  },
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Read, draft, and manage emails via MCP (OAuth-based).',
    icon: 'Mail',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@anthropic/mcp-server-gmail'],
    requiredBinary: 'npx',
    setupInstructions: 'Requires Gmail OAuth setup. See https://developers.google.com/gmail',
    permissions: ['network', 'clipboard'],
    riskLevel: 'account_action',
  },
  {
    id: 'custom',
    name: 'Custom MCP Server',
    description: 'Connect to any custom MCP-compatible server via stdio command.',
    icon: 'Wrench',
    transport: 'stdio',
    command: '',
    args: [],
    requiredBinary: '',
    setupInstructions: 'Enter the command and arguments to start your custom MCP server.',
    permissions: ['file_read'],
    riskLevel: 'safe_read',
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
      trust_level: input.trust_level || 'untrusted',
      env_vars: input.env_vars ? JSON.stringify(input.env_vars) : null,
      connection_status: 'disconnected',
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
    if (input.trust_level !== undefined) data.trust_level = input.trust_level
    if (input.env_vars !== undefined) data.env_vars = JSON.stringify(input.env_vars)

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

  // ---- MCP Lifecycle ----

  /** Connect to an MCP server and discover its capabilities */
  async connectMcpServer(serverId: string): Promise<{ success: boolean; error?: string }> {
    const tool = this.getTool(serverId)
    if (!tool) return { success: false, error: 'Tool not found' }

    try {
      const config = JSON.parse(tool.config || '{}')
      const envVarsRaw = tool.env_vars ? JSON.parse(tool.env_vars) : {}

      if (tool.transport === 'stdio') {
        const command = tool.command || config.command || ''
        const args = config.args || []
        await mcpClientService.connectStdio(serverId, command, args, envVarsRaw)
      } else if (tool.transport === 'sse' || tool.transport === 'http') {
        const url = tool.command || config.url || ''
        if (!url) return { success: false, error: 'No URL configured for SSE server' }
        await mcpClientService.connectSse(serverId, url)
      } else {
        return { success: false, error: `Unsupported transport: ${tool.transport}` }
      }

      this.updateConnectionStatus(serverId, 'connected')
      logger.info(`MCP server connected: ${tool.name}`)
      return { success: true }
    } catch (err) {
      this.updateConnectionStatus(serverId, 'error')
      return { success: false, error: String(err) }
    }
  },

  /** Disconnect from an MCP server */
  async disconnectMcpServer(serverId: string): Promise<boolean> {
    try {
      await mcpClientService.disconnect(serverId)
      this.updateConnectionStatus(serverId, 'disconnected')
      return true
    } catch (err) {
      logger.error(`Failed to disconnect MCP server ${serverId}:`, err)
      return false
    }
  },

  /** Test connection to an MCP server */
  async testMcpConnection(serverId: string): Promise<{ serverName: string; serverVersion: string; capabilities: string[] } | null> {
    try {
      const result = await mcpClientService.testConnection(serverId)
      return {
        serverName: result.serverName,
        serverVersion: result.serverVersion,
        capabilities: result.capabilities,
      }
    } catch (err) {
      logger.error(`MCP connection test failed for ${serverId}:`, err)
      return null
    }
  },

  /** Discover all capabilities from a connected MCP server */
  async discoverMcpCapabilities(serverId: string): Promise<McpDiscoveryResult | null> {
    try {
      const result = await mcpClientService.discoverAll(serverId)
      const db = getDb()
      db.update(tools).set({
        discovery_data: JSON.stringify(result),
        last_discovered_at: result.discoveredAt,
      } as never).where(eq(tools.id, serverId)).run()
      return result
    } catch (err) {
      logger.error(`MCP discovery failed for ${serverId}:`, err)
      return null
    }
  },

  /** Execute a tool on an MCP server with safety gate */
  async executeMcpTool(
    serverId: string,
    toolName: string,
    args: Record<string, unknown>
  ): Promise<{
    success: boolean
    output: string
    error: string | null
    requiresConfirmation: boolean
    safetyMessage: string
    logId: string
  }> {
    const tool = this.getTool(serverId)
    if (!tool) {
      return { success: false, output: '', error: 'Server not found', requiresConfirmation: false, safetyMessage: '', logId: '' }
    }

    // Safety gate check
    const safetyCheck = checkToolSafety(serverId, args)
    if (!safetyCheck.allowed && safetyCheck.reason !== 'tool_destructive') {
      const logId = logToolCall({
        toolId: serverId, toolName: `${tool.name}:${toolName}`,
        status: 'blocked_untrusted', input: args, error: safetyCheck.message
      })
      return { success: false, output: '', error: safetyCheck.message, requiresConfirmation: false, safetyMessage: safetyCheck.message, logId }
    }

    if (safetyCheck.requiresConfirmation) {
      const logId = logToolCall({
        toolId: serverId, toolName: `${tool.name}:${toolName}`,
        status: 'denied', input: args, error: 'Awaiting confirmation'
      })
      return { success: false, output: '', error: 'Confirmation required', requiresConfirmation: true, safetyMessage: safetyCheck.message, logId }
    }

    // Execute
    try {
      const result = await mcpClientService.executeTool(serverId, toolName, args)
      const outputText = result.content?.map(c => c.text || '').join('\n') || JSON.stringify(result)
      const isError = result.isError === true

      const logId = logToolCall({
        toolId: serverId, toolName: `${tool.name}:${toolName}`,
        status: isError ? 'error' : 'approved',
        input: args,
        output: redactSecrets(outputText.slice(0, 500)),
        error: isError ? outputText : undefined,
      })

      return {
        success: !isError,
        output: outputText,
        error: isError ? outputText : null,
        requiresConfirmation: false,
        safetyMessage: safetyCheck.message,
        logId,
      }
    } catch (err) {
      const logId = logToolCall({
        toolId: serverId, toolName: `${tool.name}:${toolName}`,
        status: 'error', input: args, error: String(err)
      })
      return { success: false, output: '', error: String(err), requiresConfirmation: false, safetyMessage: '', logId }
    }
  },

  /** Get parsed discovery data for a server */
  getDiscoveryData(serverId: string): McpDiscoveryResult | null {
    const tool = this.getTool(serverId)
    if (!tool || !tool.discovery_data) return null
    try { return JSON.parse(tool.discovery_data) } catch { return null }
  },

  /** Update connection status in the database */
  updateConnectionStatus(serverId: string, status: ConnectionStatus): void {
    const db = getDb()
    db.update(tools).set({ connection_status: status } as never).where(eq(tools.id, serverId)).run()
  },

  /** Get MCP presets */
  getPresets(): McpPreset[] {
    return MCP_PRESETS
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
