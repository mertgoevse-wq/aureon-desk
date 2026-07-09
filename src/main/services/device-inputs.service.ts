import { desktopCapturer } from 'electron'
import { logger } from '../utils/logger'
import type { ScreenSource, ScreenSourcesRequest, ScreenSourcesResult } from '../../shared/device-inputs'

/**
 * Device Inputs Service — Main Process
 *
 * Handles screen/window capture via Electron's desktopCapturer API.
 * Camera and microphone enumeration happens in the renderer process
 * via navigator.mediaDevices.enumerateDevices().
 *
 * Safety: No capture without explicit user action. No background recording.
 */
export const deviceInputsService = {
  /**
   * List available screen and window sources via desktopCapturer.
   * Returns thumbnails as base64 data URLs for preview.
   */
  async getScreenSources(request: ScreenSourcesRequest): Promise<ScreenSourcesResult> {
    try {
      const sources = await desktopCapturer.getSources({
        types: request.types,
        thumbnailSize: { width: 320, height: 180 },
        fetchWindowIcons: true,
      })

      const mapped: ScreenSource[] = sources.map((source) => ({
        id: source.id,
        name: source.name,
        thumbnail: source.thumbnail.toDataURL(),
        appIcon: source.appIcon ? source.appIcon.toDataURL() : null,
      }))

      logger.info(`Device inputs: listed ${mapped.length} screen/window sources`, {
        types: request.types,
      })

      return { success: true, sources: mapped }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      logger.error(`Device inputs: screen source listing failed: ${msg}`)
      return { success: false, sources: [], error: msg }
    }
  },
}
