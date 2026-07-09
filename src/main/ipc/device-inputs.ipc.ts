import { ipcMain } from 'electron'
import { deviceInputsService } from '../services/device-inputs.service'
import { logger } from '../utils/logger'
import type { ScreenSourcesRequest } from '../../shared/device-inputs'

export function registerDeviceInputsIPC(): void {
  /**
   * List screen/window sources for capture.
   * Returns thumbnails as base64 data URLs.
   */
  ipcMain.handle('device-inputs:listScreenSources', async (_e, request: ScreenSourcesRequest) => {
    try {
      const result = await deviceInputsService.getScreenSources(request)
      return result
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      logger.error(`device-inputs:listScreenSources failed: ${msg}`)
      return { success: false, sources: [], error: msg }
    }
  })

  logger.info('Device Inputs IPC handlers registered')
}
