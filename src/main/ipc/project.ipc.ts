import { ipcMain } from 'electron'
import { projectService } from '../services/project.service'
import { logger } from '../utils/logger'

export function registerProjectIPC(): void {
  ipcMain.handle('project:list', (_event, includeArchived?: boolean, search?: string) => {
    return projectService.listProjects(includeArchived, search)
  })

  ipcMain.handle('project:get', (_event, id: string) => {
    return projectService.getProject(id)
  })

  ipcMain.handle('project:create', (_event, input: {
    name: string; description?: string; instructions?: string;
    root_path?: string; default_provider_id?: string;
    default_model?: string; default_system_prompt_id?: string;
    enabled_skill_ids?: string[]
  }) => {
    return projectService.createProject(input)
  })

  ipcMain.handle('project:update', (_event, id: string, input: Record<string, unknown>) => {
    return projectService.updateProject(id, input as Parameters<typeof projectService.updateProject>[1])
  })

  ipcMain.handle('project:delete', (_event, id: string) => {
    return projectService.deleteProject(id)
  })

  ipcMain.handle('project:archive', (_event, id: string) => {
    return projectService.archiveProject(id)
  })

  ipcMain.handle('project:restore', (_event, id: string) => {
    return projectService.restoreProject(id)
  })

  ipcMain.handle('project:selectFolder', async () => {
    return await projectService.selectFolder()
  })

  ipcMain.handle('project:getFileTree', (_event, rootPath: string, options?: Record<string, unknown>) => {
    return projectService.getFileTree(rootPath, options as Parameters<typeof projectService.getFileTree>[1])
  })

  ipcMain.handle('project:getContext', (_event, projectId: string, selectedFilePaths: string[]) => {
    return projectService.getProjectContext(projectId, selectedFilePaths)
  })

  ipcMain.handle('project:isPathIgnored', (_event, filePath: string) => {
    return projectService.isPathIgnored(filePath)
  })

  logger.info('Project IPC handlers registered')
}
