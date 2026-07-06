import { v4 as uuid } from 'uuid'
import { dialog, BrowserWindow } from 'electron'
import { getDb } from '../db/connection'
import { projects } from '../db/schema'
import { eq, desc, and, like } from 'drizzle-orm'
import type { ProjectRow, NewProject, ProjectUpdate } from '../../shared/types/project'
import { buildFileTree, buildProjectContext, isPathIgnored } from './project-context'
import type { FileTreeNode, ProjectContext, FileTreeOptions } from '../../shared/types/project'
import { logger } from '../utils/logger'

export const projectService = {
  /** List all active (non-archived) projects */
  listProjects(includeArchived = false, search?: string): ProjectRow[] {
    const db = getDb()
    let query = db.select().from(projects) as any

    if (!includeArchived) {
      query = query.where(eq(projects.archived, 0))
    }

    if (search) {
      query = query.where(like(projects.name, `%${search}%`))
    }

    return query.orderBy(desc(projects.updated_at)).all() as ProjectRow[]
  },

  /** Get a single project by ID */
  getProject(id: string): ProjectRow | undefined {
    const db = getDb()
    return db.select().from(projects)
      .where(eq(projects.id, id))
      .get() as ProjectRow | undefined
  },

  /** Create a new project */
  createProject(input: NewProject): ProjectRow {
    const db = getDb()
    const now = new Date().toISOString()
    const id = uuid()

    db.insert(projects).values({
      id,
      name: input.name,
      description: input.description || null,
      instructions: input.instructions || null,
      root_path: input.root_path || null,
      archived: 0,
      default_provider_id: input.default_provider_id || null,
      default_model: input.default_model || null,
      default_system_prompt_id: input.default_system_prompt_id || null,
      enabled_skill_ids: input.enabled_skill_ids ? JSON.stringify(input.enabled_skill_ids) : null,
      created_at: now,
      updated_at: now
    } as never).run()

    logger.info(`Created project: ${input.name} (${id})`)
    return this.getProject(id)!
  },

  /** Update an existing project */
  updateProject(id: string, input: ProjectUpdate): ProjectRow | undefined {
    const db = getDb()
    const now = new Date().toISOString()

    const data: Record<string, unknown> = { updated_at: now }
    if (input.name !== undefined) data.name = input.name
    if (input.description !== undefined) data.description = input.description
    if (input.instructions !== undefined) data.instructions = input.instructions
    if (input.root_path !== undefined) data.root_path = input.root_path
    if (input.default_provider_id !== undefined) data.default_provider_id = input.default_provider_id
    if (input.default_model !== undefined) data.default_model = input.default_model
    if (input.default_system_prompt_id !== undefined) data.default_system_prompt_id = input.default_system_prompt_id
    if (input.enabled_skill_ids !== undefined) data.enabled_skill_ids = JSON.stringify(input.enabled_skill_ids)
    if (input.archived !== undefined) data.archived = input.archived ? 1 : 0

    db.update(projects)
      .set(data as never)
      .where(eq(projects.id, id))
      .run()

    logger.info(`Updated project: ${id}`)
    return this.getProject(id)
  },

  /** Archive a project (soft delete) */
  archiveProject(id: string): ProjectRow | undefined {
    return this.updateProject(id, { archived: true })
  },

  /** Restore an archived project */
  restoreProject(id: string): ProjectRow | undefined {
    return this.updateProject(id, { archived: false })
  },

  /** Delete a project (hard delete) with confirmation */
  deleteProject(id: string): boolean {
    const db = getDb()
    const result = db.delete(projects)
      .where(eq(projects.id, id))
      .run()

    logger.info(`Deleted project: ${id}`)
    return result.changes > 0
  },

  /** Select a folder using Electron's dialog */
  async selectFolder(): Promise<string | null> {
    const window = BrowserWindow.getFocusedWindow()
    if (!window) return null

    const result = await dialog.showOpenDialog(window, {
      properties: ['openDirectory'],
      title: 'Select Project Folder'
    })

    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  },

  /** Build file tree for a project's root path */
  getFileTree(rootPath: string, options?: FileTreeOptions): FileTreeNode[] {
    return buildFileTree(rootPath, options)
  },

  /** Build project context from selected file paths */
  getProjectContext(
    projectId: string,
    selectedFilePaths: string[]
  ): ProjectContext | null {
    const project = this.getProject(projectId)
    if (!project) return null

    return buildProjectContext(
      project.name,
      project.root_path,
      project.instructions,
      selectedFilePaths
    )
  },

  /** Check if a file path should be ignored */
  isPathIgnored(filePath: string): boolean {
    return isPathIgnored(filePath)
  }
}
