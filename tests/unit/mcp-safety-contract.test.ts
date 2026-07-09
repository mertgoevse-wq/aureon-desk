import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ToolRow } from '../../src/shared/types/tool'

let currentTool: ToolRow | undefined

vi.mock('../../src/main/db/connection', () => ({
  getDb: () => ({
    select: () => ({
      from: () => ({
        where: () => ({
          get: () => currentTool,
          all: () => currentTool ? [currentTool] : [],
        }),
        all: () => currentTool ? [currentTool] : [],
      }),
    }),
    update: () => ({
      set: () => ({
        where: () => ({ run: () => ({ changes: 1 }) }),
      }),
    }),
    insert: () => ({
      values: () => ({ run: () => ({ changes: 1 }) }),
    }),
  }),
}))

vi.mock('../../src/main/utils/logger', () => ({
  logger: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

vi.mock('../../src/main/services/tool-safety-gate', () => ({
  checkToolSafety: vi.fn(),
  logToolCall: vi.fn(() => 'tool-log-id'),
}))

import { toolService } from '../../src/main/services/tool.service'
import { mcpClientService } from '../../src/main/services/mcp-client.service'
import { checkToolSafety } from '../../src/main/services/tool-safety-gate'
import { sanitizeMcpStderr, validateMcpServerUrl } from '../../src/main/services/mcp-client.service'

const mockedSafety = vi.mocked(checkToolSafety)
const connectStdio = vi.spyOn(mcpClientService, 'connectStdio')
const executeTool = vi.spyOn(mcpClientService, 'executeTool')

function makeMcpTool(overrides: Partial<ToolRow> = {}): ToolRow {
  return {
    id: 'mcp-server',
    name: 'Test MCP',
    description: 'Test MCP server',
    version: '1.0.0',
    source: 'mcp',
    source_path: null,
    transport: 'stdio',
    command: 'node',
    config: JSON.stringify({ args: ['server.js'] }),
    permissions: JSON.stringify(['file_read']),
    is_enabled: 1,
    is_trusted: 1,
    trust_level: 'trusted',
    env_vars: null,
    connection_status: 'disconnected',
    discovery_data: null,
    last_discovered_at: null,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('MCP safety contract', () => {
  beforeEach(() => {
    currentTool = makeMcpTool()
    vi.clearAllMocks()
  })

  it('blocks a server connection before spawning an untrusted server command', async () => {
    mockedSafety.mockReturnValue({
      allowed: false,
      reason: 'tool_untrusted',
      message: 'Trust the server before connecting.',
      requiresConfirmation: true,
      dryRunPreview: null,
    })

    const result = await toolService.connectMcpServer('mcp-server')

    expect(result.success).toBe(false)
    expect(result.error).toContain('Trust the server')
    expect(connectStdio).not.toHaveBeenCalled()
  })

  it('requires a separate confirmation before connecting a trusted destructive server', async () => {
    mockedSafety.mockReturnValue({
      allowed: true,
      reason: 'tool_destructive',
      message: 'Confirmation required.',
      requiresConfirmation: true,
      dryRunPreview: null,
    })

    const result = await toolService.connectMcpServer('mcp-server')

    expect(result.requiresConfirmation).toBe(true)
    expect(connectStdio).not.toHaveBeenCalled()
  })

  it('executes a confirmed MCP tool call exactly once after the safety gate approves it', async () => {
    mockedSafety.mockReturnValue({
      allowed: true,
      reason: 'tool_destructive',
      message: 'Confirmation required.',
      requiresConfirmation: true,
      dryRunPreview: null,
    })
    executeTool.mockResolvedValue({ content: [{ type: 'text', text: 'done' }] })

    const result = await toolService.executeMcpTool('mcp-server', 'write_file', { path: 'demo.txt' }, true)

    expect(result.success).toBe(true)
    expect(executeTool).toHaveBeenCalledWith('mcp-server', 'write_file', { path: 'demo.txt' })
  })

  it('does not let confirmation bypass a disabled or untrusted safety decision', async () => {
    mockedSafety.mockReturnValue({
      allowed: false,
      reason: 'tool_disabled',
      message: 'Enable the server first.',
      requiresConfirmation: false,
      dryRunPreview: null,
    })

    const result = await toolService.executeMcpTool('mcp-server', 'read_file', {}, true)

    expect(result.success).toBe(false)
    expect(executeTool).not.toHaveBeenCalled()
  })

  it('only accepts HTTP(S) URLs for network MCP servers', () => {
    expect(validateMcpServerUrl('https://mcp.example.test/sse').protocol).toBe('https:')
    expect(() => validateMcpServerUrl('file:///tmp/mcp')).toThrow('HTTP or HTTPS')
  })

  it('redacts secrets before MCP stderr is written to logs', () => {
    const output = sanitizeMcpStderr('Authorization: Bearer secret-token-value-1234567890')
    expect(output).toContain('[REDACTED]')
    expect(output).not.toContain('secret-token-value-1234567890')
  })
})
