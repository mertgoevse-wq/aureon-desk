/**
 * Attachments IPC — Safe file reading and ZIP inspection.
 * All file reading happens in the main process, never in the renderer.
 */
import { ipcMain, dialog, BrowserWindow } from 'electron'
import { logger } from '../utils/logger'
import { processAttachmentFile, extractAttachmentZip } from '../services/attachment-reader.service'
import type { FileProcessResult } from '../../shared/attachments'

export function registerAttachmentsIPC(): void {
  /**
   * Open native file dialog for selecting files to attach.
   */
  ipcMain.handle('attachment:selectFiles', async (): Promise<string[]> => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return []
    const result = await dialog.showOpenDialog(win, {
      title: 'Select files to attach',
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'All Supported Files', extensions: ['html', 'css', 'js', 'ts', 'tsx', 'jsx', 'json', 'md', 'txt', 'csv', 'xml', 'svg', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'pdf', 'zip', 'py', 'rs', 'toml', 'yml', 'yaml'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    })
    return result.canceled ? [] : result.filePaths
  })
  /**
   * Process a single file: validate, read metadata, get thumbnail.
   * Returns an AttachmentFile with safety scan results.
   */
  ipcMain.handle('attachment:processFile', async (_e, filePath: string): Promise<FileProcessResult> => {
    try {
      logger.info(`Processing attachment: ${filePath}`)
      return processAttachmentFile(filePath)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      logger.error(`attachment:processFile failed: ${msg}`)
      throw err
    }
  })

  /**
   * Process multiple files in parallel.
   */
  ipcMain.handle('attachment:processFiles', async (_e, filePaths: string[]): Promise<FileProcessResult[]> => {
    const results: FileProcessResult[] = []
    for (const fp of filePaths) {
      try {
        results.push(processAttachmentFile(fp))
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        logger.error(`attachment:processFiles failed for ${fp}: ${msg}`)
        // Don't throw — return partial results
      }
    }
    return results
  })

  /**
   * Extract a ZIP archive after explicit user approval.
   * The destDir must be a safe, app-managed directory.
   */
  ipcMain.handle('attachment:extractZip', async (_e, zipPath: string, destDir?: string): Promise<{ success: boolean; extractedPaths: string[]; error?: string }> => {
    logger.info(`Extracting ZIP: ${zipPath} -> ${destDir || 'temp directory'}`)
    return await extractAttachmentZip(zipPath, destDir)
  })

  logger.info('Attachments IPC handlers registered')
}
