import { ipcMain, BrowserWindow } from 'electron'
import { livePreviewService } from '../services/live-preview.service'
import { logger } from '../utils/logger'
import type { CreateSandboxInput, PreviewStatus, CodingDemoResult } from '../services/live-preview.service'

export function registerLivePreviewIPC(): void {
  ipcMain.handle('preview:createSandbox', (_e, input?: CreateSandboxInput) =>
    livePreviewService.createSandbox(input)
  )

  ipcMain.handle('preview:start', (_e, sandboxPath: string, port?: number) =>
    livePreviewService.startPreview(sandboxPath, port)
  )

  ipcMain.handle('preview:stop', () =>
    livePreviewService.stopPreview()
  )

  ipcMain.handle('preview:status', (): PreviewStatus =>
    livePreviewService.getStatus()
  )

  ipcMain.handle('preview:writeFile', (_e, sandboxPath: string, relativePath: string, content: string) =>
    livePreviewService.writeSandboxFile(sandboxPath, relativePath, content)
  )

  ipcMain.handle('preview:listSandboxes', () =>
    livePreviewService.listSandboxes()
  )

  ipcMain.handle('preview:cleanup', (_e, maxAgeHours?: number) =>
    livePreviewService.cleanupSandboxes(maxAgeHours)
  )

  ipcMain.handle('preview:createDemo', async (_e, port?: number, style?: string): Promise<CodingDemoResult> =>
    await livePreviewService.createDemo(port, style)
  )

  ipcMain.handle('preview:startGenerated', (_e, input: any) =>
    livePreviewService.startGeneratedPreview(input)
  )

  // Push status-change events to all renderer windows immediately.
  // This eliminates the 2-second poll delay when the preview server starts.
  livePreviewService.onStatusChange((status: PreviewStatus) => {
    try {
      BrowserWindow.getAllWindows().forEach(win => {
        if (!win.isDestroyed()) {
          win.webContents.send('preview:status-change', status)
        }
      })
    } catch (err) {
      logger.error(`preview:status-change push failed: ${err}`)
    }
  })

  logger.info('LivePreview IPC handlers registered')
}
