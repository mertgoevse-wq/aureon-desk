// Shared project types

export interface ProjectRow {
  id: string
  name: string
  description: string | null
  instructions: string | null
  root_path: string | null
  created_at: string
  updated_at: string
}

export interface NewProject {
  name: string
  description?: string
  instructions?: string
  root_path?: string
}
