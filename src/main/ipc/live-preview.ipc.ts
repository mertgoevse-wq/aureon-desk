import { ipcMain } from 'electron'
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

  ipcMain.handle('preview:createDemo', (_e, port?: number): CodingDemoResult =>
    livePreviewService.createDemo(port)
  )

  logger.info('LivePreview IPC handlers registered')
}
