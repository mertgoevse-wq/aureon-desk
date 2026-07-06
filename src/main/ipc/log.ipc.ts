import { ipcMain } from 'electron'
import { logService } from '../services/log.service'
import { logger } from '../utils/logger'

export function registerLogIPC(): void {
  // Write a log entry
  ipcMain.handle('log:write', (_event, input: {
    level: string; category: string; message: string;
    metadata?: Record<string, unknown>; chatId?: string; projectId?: string
  }) => {
    return logService.writeLog({
      level: input.level as 'debug' | 'info' | 'warn' | 'error',
      category: input.category as Parameters<typeof logService.writeLog>[0]['category'],
      message: input.message,
      metadata: input.metadata,
      chatId: input.chatId,
      projectId: input.projectId
    })
  })

  // Query logs with filters
  ipcMain.handle('log:query', (_event, filter: Record<string, unknown>) => {
    return logService.queryLogs(filter as Parameters<typeof logService.queryLogs>[0])
  })

  // Count logs
  ipcMain.handle('log:count', (_event, filter: Record<string, unknown>) => {
    return logService.countLogs(filter as Parameters<typeof logService.countLogs>[0])
  })

  // Get log categories
  ipcMain.handle('log:categories', () => {
    return logService.getCategories()
  })

  // Get a single log entry
  ipcMain.handle('log:get', (_event, id: string) => {
    return logService.getLog(id)
  })

  // Clear app logs
  ipcMain.handle('log:clear', () => {
    return logService.clearLogs()
  })

  // Clear tool call logs
  ipcMain.handle('log:clearToolCallLogs', () => {
    return logService.clearToolCallLogs()
  })

  // Clear import logs
  ipcMain.handle('log:clearImportLogs', () => {
    return logService.clearImportLogs()
  })

  // Export debug bundle
  ipcMain.handle('log:exportDebugBundle', () => {
    return logService.exportDebugBundle()
  })

  logger.info('Log IPC handlers registered')
}
