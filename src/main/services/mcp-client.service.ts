import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js'
import { logger } from '../utils/logger'
import { redactSecrets } from './log-redacter'
import type {
  McpDiscoveredTool,
  McpDiscoveredResource,
  McpDiscoveredPrompt,
  McpDiscoveryResult,
  ConnectionStatus,
} from '../../shared/types/tool'

// Risk classification for permissions/descriptions
const DESTRUCTIVE_KEYWORDS = [
  'delete', 'remove', 'destroy', 'write', 'modify', 'create',
  'execute', 'run', 'shell', 'command', 'terminal', 'bash',
  'push', 'deploy', 'commit', 'send', 'post', 'put', 'patch'
]

const NETWORK_KEYWORDS = [
  'fetch', 'http', 'url', 'api', 'request', 'download', 'upload',
  'network', 'curl', 'wget', 'web', 'browse'
]

function classifyRisk(name: string, description: string): McpDiscoveredTool['riskLevel'] {
  const lower = `${name} ${description}`.toLowerCase()
  if (DESTRUCTIVE_KEYWORDS.some(k => lower.includes(k))) return 'destructive'
  if (NETWORK_KEYWORDS.some(k => lower.includes(k))) return 'write_remote'
  if (lower.includes('read') || lower.includes('get') || lower.includes('list') || lower.includes('search')) {
    return 'read_only'
  }
  return 'safe_read'
}

export function validateMcpServerUrl(rawUrl: string): URL {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    throw new Error('MCP server URL must be a valid HTTP or HTTPS URL')
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('MCP server URL must use HTTP or HTTPS')
  }

  return url
}

export function sanitizeMcpStderr(value: string): string {
  return redactSecrets(value).slice(0, 2_000)
}

export interface McpClientSession {
  client: Client
  transport: Transport
  status: ConnectionStatus
  serverName: string
  serverVersion: string
  transportType: 'stdio' | 'sse'
  childProcess?: { kill: () => void }
}

const sessions = new Map<string, McpClientSession>()

export const mcpClientService = {
  getSession(serverId: string): McpClientSession | undefined {
    return sessions.get(serverId)
  },

  getAllSessions(): Map<string, McpClientSession> {
    return sessions
  },

  /** Connect to an MCP server via stdio (spawns a child process) */
  async connectStdio(serverId: string, command: string, args: string[] = [], envVars: Record<string, string> = {}): Promise<void> {
    if (sessions.has(serverId)) {
      await this.disconnect(serverId)
    }

    const mergedEnv = { ...process.env, ...envVars }

    const transport = new StdioClientTransport({
      command,
      args,
      env: mergedEnv as Record<string, string>,
      stderr: 'pipe',
    })

    // Handle stderr for logging
    if (transport.stderr) {
      transport.stderr.on('data', (data: Buffer) => {
        logger.info(`[MCP stderr:${serverId}] ${sanitizeMcpStderr(data.toString().trim())}`)
      })
    }

    const client = new Client(
      { name: 'Vibeforge-desk', version: '1.0.0' },
      { capabilities: {} as Record<string, unknown> }
    )

    try {
      await client.connect(transport)

      const session: McpClientSession = {
        client,
        transport,
        status: 'connected',
        serverName: 'Unknown',
        serverVersion: '0.0.0',
        transportType: 'stdio',
      }

      // Populate server info from the initialization response
      try {
        const serverInfo = client.getServerVersion()
        if (serverInfo) {
          session.serverName = (serverInfo as any).name || 'Unknown'
          session.serverVersion = (serverInfo as any).version || '0.0.0'
        }
      } catch { /* server info not available */ }

      logger.info(`[MCP] Connected to server ${serverId} via stdio`)

      // Handle transport errors and close events
      transport.onerror = () => {
        logger.warn(`[MCP] Transport error for ${serverId}`)
        session.status = 'error'
      }
      transport.onclose = () => {
        logger.info(`[MCP] Transport closed for ${serverId}`)
        session.status = 'disconnected'
        sessions.delete(serverId)
      }

      sessions.set(serverId, session)
      return
    } catch (err) {
      logger.error(`[MCP] Failed to connect stdio server ${serverId}:`, err)
      throw err
    }
  },

  /** Connect to an MCP server via SSE (HTTP long-polling) */
  async connectSse(serverId: string, url: string): Promise<void> {
    if (sessions.has(serverId)) {
      await this.disconnect(serverId)
    }

    const transport = new SSEClientTransport(validateMcpServerUrl(url))

    const client = new Client(
      { name: 'Vibeforge-desk', version: '1.0.0' },
      { capabilities: {} as Record<string, unknown> }
    )

    try {
      await client.connect(transport)
      logger.info(`[MCP] Connected to server ${serverId} via SSE at ${url}`)

      const session: McpClientSession = {
        client,
        transport,
        status: 'connected',
        serverName: 'Unknown',
        serverVersion: '0.0.0',
        transportType: 'sse',
      }

      // Handle transport errors and close events
      transport.onerror = () => {
        logger.warn(`[MCP] SSE transport error for ${serverId}`)
        session.status = 'error'
      }
      transport.onclose = () => {
        logger.info(`[MCP] SSE transport closed for ${serverId}`)
        session.status = 'disconnected'
        sessions.delete(serverId)
      }

      sessions.set(serverId, session)
      return
    } catch (err) {
      logger.error(`[MCP] Failed to connect SSE server ${serverId}:`, err)
      throw err
    }
  },

  /** Disconnect from an MCP server */
  async disconnect(serverId: string): Promise<void> {
    const session = sessions.get(serverId)
    if (!session) return

    try {
      await session.client.close()
    } catch (err) {
      logger.warn(`[MCP] Error closing client for ${serverId}:`, err)
    }

    if (session.childProcess) {
      try { session.childProcess.kill() } catch { /* already dead */ }
    }

    sessions.delete(serverId)
    logger.info(`[MCP] Disconnected from server ${serverId}`)
  },

  /** Test connection and get server info */
  async testConnection(serverId: string): Promise<{ serverName: string; serverVersion: string; capabilities: string[] }> {
    const session = sessions.get(serverId)
    if (!session || session.status !== 'connected') {
      throw new Error(`Server ${serverId} is not connected`)
    }

    const caps = session.client.getServerCapabilities()
    const capList = Object.entries(caps ?? {}).filter(([, v]) => v).map(([k]) => k)

    return {
      serverName: session.serverName,
      serverVersion: session.serverVersion,
      capabilities: capList,
    }
  },

  /** Discover tools from a connected MCP server */
  async discoverTools(serverId: string): Promise<McpDiscoveredTool[]> {
    const session = sessions.get(serverId)
    if (!session || session.status !== 'connected') {
      throw new Error(`Server ${serverId} is not connected`)
    }

    try {
      const result = await session.client.listTools()
      return (result.tools || []).map(t => ({
        name: t.name,
        description: t.description || 'No description',
        inputSchema: (t.inputSchema as Record<string, unknown>) || {},
        riskLevel: classifyRisk(t.name, t.description || ''),
      }))
    } catch (err) {
      logger.error(`[MCP] Failed to list tools for ${serverId}:`, err)
      return []
    }
  },

  /** Discover resources from a connected MCP server */
  async discoverResources(serverId: string): Promise<McpDiscoveredResource[]> {
    const session = sessions.get(serverId)
    if (!session || session.status !== 'connected') {
      throw new Error(`Server ${serverId} is not connected`)
    }

    try {
      const result = await session.client.listResources()
      return (result.resources || []).map(r => ({
        uri: r.uri,
        name: r.name,
        description: r.description || '',
        mimeType: r.mimeType,
      }))
    } catch (err) {
      logger.error(`[MCP] Failed to list resources for ${serverId}:`, err)
      return []
    }
  },

  /** Discover prompts from a connected MCP server */
  async discoverPrompts(serverId: string): Promise<McpDiscoveredPrompt[]> {
    const session = sessions.get(serverId)
    if (!session || session.status !== 'connected') {
      throw new Error(`Server ${serverId} is not connected`)
    }

    try {
      const result = await session.client.listPrompts()
      return (result.prompts || []).map(p => ({
        name: p.name,
        description: p.description || '',
        arguments: (p.arguments || []).map(a => ({
          name: a.name,
          description: a.description || '',
          required: !!a.required,
        })),
      }))
    } catch (err) {
      logger.error(`[MCP] Failed to list prompts for ${serverId}:`, err)
      return []
    }
  },

  /** Full discovery: tools + resources + prompts */
  async discoverAll(serverId: string): Promise<McpDiscoveryResult> {
    const session = sessions.get(serverId)
    if (!session || session.status !== 'connected') {
      throw new Error(`Server ${serverId} is not connected`)
    }

    const [tools, resources, prompts] = await Promise.all([
      this.discoverTools(serverId).catch(() => [] as McpDiscoveredTool[]),
      this.discoverResources(serverId).catch(() => [] as McpDiscoveredResource[]),
      this.discoverPrompts(serverId).catch(() => [] as McpDiscoveredPrompt[]),
    ])

    return {
      tools,
      resources,
      prompts,
      discoveredAt: new Date().toISOString(),
      serverName: session.serverName,
      serverVersion: session.serverVersion,
    }
  },

  /** Execute a tool on a connected MCP server */
  async executeTool(
    serverId: string,
    toolName: string,
    args: Record<string, unknown> = {}
  ): Promise<{ content: Array<{ type: string; text?: string }>; isError?: boolean }> {
    const session = sessions.get(serverId)
    if (!session || session.status !== 'connected') {
      throw new Error(`Server ${serverId} is not connected`)
    }

    try {
      const result = await session.client.callTool({
        name: toolName,
        arguments: args,
      })
      return result as { content: Array<{ type: string; text?: string }>; isError?: boolean }
    } catch (err) {
      logger.error(`[MCP] Failed to execute tool ${toolName} on ${serverId}:`, err)
      throw err
    }
  },

  /** Read a resource from a connected MCP server */
  async readResource(
    serverId: string,
    uri: string
  ): Promise<{ contents: Array<{ uri: string; mimeType?: string; text?: string }> }> {
    const session = sessions.get(serverId)
    if (!session || session.status !== 'connected') {
      throw new Error(`Server ${serverId} is not connected`)
    }

    try {
      const result = await session.client.readResource({ uri })
      return result as { contents: Array<{ uri: string; mimeType?: string; text?: string }> }
    } catch (err) {
      logger.error(`[MCP] Failed to read resource ${uri} on ${serverId}:`, err)
      throw err
    }
  },
}
