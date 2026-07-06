import { ipcMain } from 'electron'
import { githubImportService } from '../services/github-import.service'
import { logger } from '../utils/logger'
import type { ImportedItem, ImportWarning, ImportResult, ImportRepoInput, ImportItemFilter } from '../../shared/types/github'

export function registerGitHubIPC(): void {
  // Repo management
  ipcMain.handle('github:listRepos', () => githubImportService.listRepos())
  ipcMain.handle('github:getRepo', (_e, id: string) => githubImportService.getRepo(id))
  ipcMain.handle('github:importRepo', (_e, input: ImportRepoInput) => githubImportService.importRepo(input.repoUrl, input.branch))
  ipcMain.handle('github:importBulk', (_e, urls: string[]) => githubImportService.importBulk(urls))
  ipcMain.handle('github:deleteRepo', (_e, id: string) => githubImportService.deleteRepo(id))
  ipcMain.handle('github:isAlreadyImported', (_e, url: string) => githubImportService.isAlreadyImported(url))

  // Item management
  ipcMain.handle('github:listItems', (_e, filters?: ImportItemFilter) => githubImportService.listItems(filters))
  ipcMain.handle('github:getItem', (_e, id: string) => githubImportService.getItem(id))
  ipcMain.handle('github:updateItemStatus', (_e, id: string, status: string) => githubImportService.updateItemStatus(id, status as ImportedItem['status']))
  ipcMain.handle('github:deleteItem', (_e, id: string) => githubImportService.deleteItem(id))
  ipcMain.handle('github:getWarnings', (_e, itemId?: string, repoUrl?: string) => githubImportService.getWarnings(itemId, repoUrl))

  logger.info('GitHub Import IPC handlers registered')
}
