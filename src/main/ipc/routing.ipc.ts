import { ipcMain } from 'electron'
import { routePrompt } from '../services/routing-policy'
import { logger } from '../utils/logger'
import type { AnalyzePromptInput } from '../../shared/types/routing'

export function registerRoutingIPC(): void {
  ipcMain.handle('routing:analyze', (_event, input: AnalyzePromptInput) => {
    logger.info(`Analyzing prompt: "${input.content.slice(0, 80)}..."`)
    return routePrompt(input)
  })

  logger.info('Routing IPC handlers registered')
}
