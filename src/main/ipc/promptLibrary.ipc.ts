import { ipcMain } from 'electron'
import { promptLibraryService } from '../services/promptLibrary.service'
import { logger } from '../utils/logger'

export function registerPromptLibraryIPC(): void {
  ipcMain.handle('promptLibrary:list', (_event, filters?: { search?: string; tags?: string[]; category?: string }) => {
    return promptLibraryService.listPrompts(filters)
  })

  ipcMain.handle('promptLibrary:get', (_event, id: string) => {
    return promptLibraryService.getPrompt(id)
  })

  ipcMain.handle('promptLibrary:create', (_event, input: {
    title: string
    content: string
    description?: string
    tags?: string[]
    category?: string
    is_template?: boolean
  }) => {
    return promptLibraryService.createPrompt(input)
  })

  ipcMain.handle('promptLibrary:update', (_event, id: string, input: Partial<{
    title: string
    content: string
    description: string
    tags: string[]
    category: string
    is_template: boolean
  }>) => {
    return promptLibraryService.updatePrompt(id, input)
  })

  ipcMain.handle('promptLibrary:delete', (_event, id: string) => {
    return promptLibraryService.deletePrompt(id)
  })

  ipcMain.handle('promptLibrary:getTags', () => {
    return promptLibraryService.getAllTags()
  })

  ipcMain.handle('promptLibrary:getCategories', () => {
    return promptLibraryService.getAllCategories()
  })

  logger.info('Prompt Library IPC handlers registered')
}
