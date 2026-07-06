import { ipcMain } from 'electron'
import { promptService } from '../services/prompt.service'
import { logger } from '../utils/logger'

export function registerPromptIPC(): void {
  ipcMain.handle('systemPrompt:list', () => {
    return promptService.listSystemPrompts()
  })

  ipcMain.handle('systemPrompt:get', (_event, id: string) => {
    return promptService.getSystemPrompt(id)
  })

  ipcMain.handle('systemPrompt:getDefault', () => {
    return promptService.getDefaultSystemPrompt()
  })

  ipcMain.handle('systemPrompt:create', (_event, input: { name: string; description?: string; content: string; is_default?: boolean }) => {
    return promptService.createSystemPrompt(input)
  })

  ipcMain.handle('systemPrompt:update', (_event, id: string, input: { name?: string; description?: string; content?: string; is_default?: boolean }) => {
    return promptService.updateSystemPrompt(id, input)
  })

  ipcMain.handle('systemPrompt:delete', (_event, id: string) => {
    return promptService.deleteSystemPrompt(id)
  })

  logger.info('Prompt IPC handlers registered')
}
