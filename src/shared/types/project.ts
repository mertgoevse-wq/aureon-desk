// Shared project types

export interface ProjectRow {
  id: string
  name: string
  description: string | null
  instructions: string | null
  root_path: string | null
  archived: number
  default_provider_id: string | null
  default_model: string | null
  default_system_prompt_id: string | null
  enabled_skill_ids: string | null  // JSON array
  created_at: string
  updated_at: string
}

export interface NewProject {
  name: string
  description?: string
  instructions?: string
  root_path?: string
  default_provider_id?: string
  default_model?: string
  default_system_prompt_id?: string
  enabled_skill_ids?: string[]
}

export interface ProjectUpdate {
  name?: string
  description?: string
  instructions?: string
  root_path?: string
  default_provider_id?: string
  default_model?: string
  default_system_prompt_id?: string
  enabled_skill_ids?: string[]
  archived?: boolean
}

/** A node in the project file tree */
export interface FileTreeNode {
  name: string
  path: string
  isDirectory: boolean
  children?: FileTreeNode[]
  size?: number
  extension?: string
}

/** Context built from selected project files */
export interface ProjectFileContext {
  path: string
  content: string
  size: number
  extension: string
  warnings: string[]
}

/** Built context for sending to LLM */
export interface ProjectContext {
  projectName: string
  rootPath: string | null
  instructions: string | null
  selectedFiles: ProjectFileContext[]
  warnings: string[]
  totalSize: number
}

/** Options for building file tree */
export interface FileTreeOptions {
  maxDepth?: number
  maxFilesPerDir?: number
  maxTotalSize?: number
}
