import { ipcMain } from 'electron'
import { toolService } from '../services/tool.service'
import { checkToolSafety } from '../services/tool-safety-gate'
import { logger } from '../utils/logger'

export function registerToolIPC(): void {
  ipcMain.handle('tool:list', () => toolService.listTools())
  ipcMain.handle('tool:get', (_e, id: string) => toolService.getTool(id))
  ipcMain.handle('tool:create', (_e, input: any) => toolService.createTool(input))
  ipcMain.handle('tool:update', (_e, id: string, input: any) => toolService.updateTool(id, input))
  ipcMain.handle('tool:delete', (_e, id: string) => toolService.deleteTool(id))
  ipcMain.handle('tool:setEnabled', (_e, id: string, enabled: boolean) => toolService.setEnabled(id, enabled))
  ipcMain.handle('tool:setTrusted', (_e, id: string, trusted: boolean) => toolService.setTrusted(id, trusted))
  ipcMain.handle('tool:checkSafety', (_e, toolId: string, input: Record<string, unknown>) => checkToolSafety(toolId, input))
  ipcMain.handle('tool:execute', (_e, toolId: string, input: Record<string, unknown>) => toolService.executeTool(toolId, input))
  ipcMain.handle('tool:getCallLogs', (_e, toolId?: string) => toolService.getCallLogs(toolId))

  logger.info('Tool IPC handlers registered')
}
