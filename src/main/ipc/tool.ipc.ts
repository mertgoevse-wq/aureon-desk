import { ipcMain } from 'electron'
import { toolService } from '../services/tool.service'
import { checkToolSafety, getNetworkRiskWarning, redactEnvVars } from '../services/tool-safety-gate'
import { logger } from '../utils/logger'

export function registerToolIPC(): void {
  // CRUD
  ipcMain.handle('tool:list', () => toolService.listTools())
  ipcMain.handle('tool:get', (_e, id: string) => toolService.getTool(id))
  ipcMain.handle('tool:create', (_e, input: any) => toolService.createTool(input))
  ipcMain.handle('tool:update', (_e, id: string, input: any) => toolService.updateTool(id, input))
  ipcMain.handle('tool:delete', (_e, id: string) => toolService.deleteTool(id))
  ipcMain.handle('tool:setEnabled', (_e, id: string, enabled: boolean) => toolService.setEnabled(id, enabled))
  ipcMain.handle('tool:setTrusted', (_e, id: string, trusted: boolean) => toolService.setTrusted(id, trusted))

  // Safety
  ipcMain.handle('tool:checkSafety', (_e, toolId: string, input: Record<string, unknown>) => checkToolSafety(toolId, input))
  ipcMain.handle('tool:execute', (_e, toolId: string, input: Record<string, unknown>) => toolService.executeTool(toolId, input))
  ipcMain.handle('tool:getCallLogs', (_e, toolId?: string) => toolService.getCallLogs(toolId))
  ipcMain.handle('tool:getNetworkRiskWarning', (_e, toolId: string) => {
    const t = toolService.getTool(toolId)
    return t ? getNetworkRiskWarning(t) : null
  })

  // MCP Lifecycle
  ipcMain.handle('mcp:connect', async (_e, serverId: string, confirmed = false) => toolService.connectMcpServer(serverId, confirmed))
  ipcMain.handle('mcp:disconnect', async (_e, serverId: string) => toolService.disconnectMcpServer(serverId))
  ipcMain.handle('mcp:testConnection', async (_e, serverId: string) => toolService.testMcpConnection(serverId))
  ipcMain.handle('mcp:discover', async (_e, serverId: string) => toolService.discoverMcpCapabilities(serverId))
  ipcMain.handle('mcp:execute', async (_e, serverId: string, toolName: string, args: Record<string, unknown>, confirmed = false) =>
    toolService.executeMcpTool(serverId, toolName, args, confirmed)
  )
  ipcMain.handle('mcp:getDiscoveryData', (_e, serverId: string) => toolService.getDiscoveryData(serverId))
  ipcMain.handle('mcp:getPresets', () => toolService.getPresets())

  // Env var redaction helper
  ipcMain.handle('mcp:redactEnvVars', (_e, envVars: Record<string, string>) => redactEnvVars(envVars))

  logger.info('Tool + MCP IPC handlers registered')
}
