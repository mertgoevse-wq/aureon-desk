import { ipcMain, BrowserWindow } from 'electron'
import { buildPipelineService } from '../services/build-pipeline.service'
import { logger } from '../utils/logger'
import type { BuildRequest, BuildPipelineStatus } from '../../shared/types/build-pipeline'

export function registerBuildPipelineIPC(): void {
  ipcMain.handle('build:run', async (_e, request: BuildRequest) => {
    try {
      const result = await buildPipelineService.runBuild(request)
      // Push final result to all windows
      BrowserWindow.getAllWindows().forEach(win => {
        if (!win.isDestroyed()) {
          win.webContents.send('build:complete', result)
        }
      })
      return result
    } catch (err) {
      logger.error(`build:run failed: ${err}`)
      throw err
    }
  })

  ipcMain.handle('build:cancel', () => {
    buildPipelineService.cancelBuild()
    return true
  })

  // Register the step callback to push events to all renderer windows
  buildPipelineService.onStep((status: BuildPipelineStatus) => {
    // Already handled inside emitStep, but this ensures the callback is registered
  })

  logger.info('Build Pipeline IPC handlers registered')
}
