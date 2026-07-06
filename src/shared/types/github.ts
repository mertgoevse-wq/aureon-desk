// GitHub Import types

export type ImportStatus = 'pending' | 'importing' | 'imported' | 'failed'
export type ItemStatus = 'unreviewed' | 'enabled' | 'disabled' | 'rejected'
export type RepoCategory =
  | 'system-prompt-pack'
  | 'prompt-library'
  | 'agent-framework-reference'
  | 'skill-pack'
  | 'mcp-server-list'
  | 'local-model-reference'
  | 'research/reference'
  | 'unrelated/reference'
export type ImportedItemType = 'prompt' | 'system_prompt' | 'skill' | 'unknown'

export interface ImportedRepo {
  id: string
  repo_url: string
  branch: string
  local_path: string
  category: RepoCategory | null
  status: ImportStatus
  detected_categories: string | null   // JSON array
  last_synced: string | null
  commit_hash: string | null
  item_count: number
  prompt_count: number
  system_prompt_count: number
  skill_count: number
  warning_count: number
  created_at: string
  updated_at: string
}

export interface ImportedItem {
  id: string
  repo_id: string
  repo_url: string
  item_type: ImportedItemType
  title: string
  content: string
  description: string | null
  tags: string | null             // JSON array
  category: string | null
  source_file: string             // Relative path within repo
  status: ItemStatus
  safety_warnings: string | null  // JSON array of warning objects
  is_untrusted: number            // Always 1 for imported content
  original_content: string        // Unmodified original
  created_at: string
}

export interface ImportWarning {
  id: string
  item_id: string
  repo_url: string
  type: 'secret_detected' | 'injection_detected' | 'proprietary_warning' | 'large_file' | 'binary_skipped' | 'parse_error'
  message: string
  severity: 'low' | 'medium' | 'high'
  line_number: number | null
  context: string | null
  created_at: string
}

export interface ImportResult {
  repoId: string
  repoUrl: string
  status: ImportStatus
  category: RepoCategory | null
  itemsFound: number
  itemsImported: number
  warnings: ImportWarning[]
  errors: string[]
  commitHash: string | null
}

// Star list item
export interface StarListItem {
  url: string
  name: string
  expectedCategory: RepoCategory
  description: string
}

// IPC
export interface ImportRepoInput {
  repoUrl: string
  branch?: string
}

export interface BulkImportInput {
  repoUrls: string[]
}

export interface ImportItemApproveInput {
  itemId: string
  approveAs: 'prompt' | 'system_prompt' | 'skill'
}

export interface ImportItemFilter {
  repoId?: string
  category?: RepoCategory
  itemType?: ImportedItemType
  status?: ItemStatus
  search?: string
  hasWarnings?: boolean
}
