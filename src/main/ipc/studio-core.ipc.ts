// === Vibeforge Studio Core — IPC Handlers ===

import { ipcMain } from 'electron'
import { orchestrate, getTaskCategories, getAutonomyLevels } from '../services/studio-core.service'
import { getAllCapabilities } from '../../shared/capability-registry'
import type { StudioIntentInput } from '../../shared/types/studio-core'
import { logger } from '../utils/logger'

export function registerStudioCoreIPC(): void {
  // Orchestrate: classify intent and return routing plan
  ipcMain.handle('studio:orchestrate', (_event, input: StudioIntentInput) => {
    logger.info(`Studio orchestrating: "${input.userIntent.slice(0, 80)}..."`)
    return orchestrate(input)
  })

  // Get all task categories for the launcher UI
  ipcMain.handle('studio:taskCategories', () => {
    return getTaskCategories()
  })

  // Get all capabilities for the capability browser
  ipcMain.handle('studio:capabilities', () => {
    return getAllCapabilities()
  })

  // Get autonomy levels for the settings UI
  ipcMain.handle('studio:autonomyLevels', () => {
    return getAutonomyLevels()
  })

  logger.info('Studio Core IPC handlers registered')
}
