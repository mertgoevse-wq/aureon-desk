import { ipcMain } from 'electron'
import { promptLibraryService } from '../services/promptLibrary.service'
import { logger } from '../utils/logger'

export function registerPromptLibraryIPC(): void {
  ipcMain.handle('promptLibrary:list', (_event, filters?: {
    search?: string; tags?: string[]; category?: string; favoritesOnly?: boolean
  }) => {
    return promptLibraryService.listPrompts(filters)
  })

  ipcMain.handle('promptLibrary:get', (_event, id: string) => {
    return promptLibraryService.getPrompt(id)
  })

  ipcMain.handle('promptLibrary:create', (_event, input: {
    title: string
    content: string
    description?: string
    variables?: string[]
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
    variables: string[]
    tags: string[]
    category: string
    is_template: boolean
  }>) => {
    return promptLibraryService.updatePrompt(id, input)
  })

  ipcMain.handle('promptLibrary:delete', (_event, id: string) => {
    return promptLibraryService.deletePrompt(id)
  })

  ipcMain.handle('promptLibrary:toggleFavorite', (_event, id: string) => {
    return promptLibraryService.toggleFavorite(id)
  })

  ipcMain.handle('promptLibrary:incrementUsage', (_event, id: string) => {
    promptLibraryService.incrementUsage(id)
  })

  ipcMain.handle('promptLibrary:getTags', () => {
    return promptLibraryService.getAllTags()
  })

  ipcMain.handle('promptLibrary:getCategories', () => {
    return promptLibraryService.getAllCategories()
  })

  // Import / Export
  ipcMain.handle('promptLibrary:exportAll', () => {
    return promptLibraryService.exportAll()
  })

  ipcMain.handle('promptLibrary:importJson', (_event, jsonString: string) => {
    return promptLibraryService.importFromJson(jsonString)
  })

  ipcMain.handle('promptLibrary:importText', (_event, text: string, format?: string, extension?: string) => {
    if (format === 'json') return promptLibraryService.importFromJson(text)
    return promptLibraryService.importAuto(text, extension)
  })

  // Slash Commands
  ipcMain.handle('promptLibrary:resolveSlashCommand', (_event, command: string) => {
    return promptLibraryService.resolveSlashCommand(command)
  })

  logger.info('Prompt Library IPC handlers registered')
}
