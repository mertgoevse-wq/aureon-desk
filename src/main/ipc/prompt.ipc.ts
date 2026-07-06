import { ipcMain } from 'electron'
import { promptService } from '../services/prompt.service'
import type { HierarchyInput } from '../../shared/types/prompt'
import { logger } from '../utils/logger'

export function registerPromptIPC(): void {
  ipcMain.handle('systemPrompt:list', (_event, includeArchived?: boolean) => {
    return promptService.listSystemPrompts(includeArchived)
  })

  ipcMain.handle('systemPrompt:get', (_event, id: string) => {
    return promptService.getSystemPrompt(id)
  })

  ipcMain.handle('systemPrompt:getDefault', () => {
    return promptService.getDefaultSystemPrompt()
  })

  ipcMain.handle('systemPrompt:create', (_event, input: {
    name: string; description?: string; content: string; tags?: string[];
    category?: string; is_default?: boolean; priority?: number
  }) => {
    return promptService.createSystemPrompt(input)
  })

  ipcMain.handle('systemPrompt:update', (_event, id: string, input: Partial<{
    name: string; description: string; content: string; tags: string[];
    category: string; is_default: boolean; is_archived: boolean; priority: number
  }>) => {
    return promptService.updateSystemPrompt(id, input)
  })

  ipcMain.handle('systemPrompt:delete', (_event, id: string) => {
    return promptService.deleteSystemPrompt(id)
  })

  ipcMain.handle('systemPrompt:archive', (_event, id: string) => {
    return promptService.archiveSystemPrompt(id)
  })

  ipcMain.handle('systemPrompt:restore', (_event, id: string) => {
    return promptService.restoreSystemPrompt(id)
  })

  ipcMain.handle('systemPrompt:duplicate', (_event, id: string) => {
    return promptService.duplicateSystemPrompt(id)
  })

  ipcMain.handle('systemPrompt:resolveHierarchy', (_event, input: HierarchyInput) => {
    return promptService.resolveHierarchy(input)
  })

  ipcMain.handle('systemPrompt:validateSecrets', (_event, content: string) => {
    return promptService.validateSecrets(content)
  })

  ipcMain.handle('systemPrompt:validateToolBypass', (_event, content: string) => {
    return promptService.validateToolBypass(content)
  })

  logger.info('Prompt IPC handlers registered')
}
