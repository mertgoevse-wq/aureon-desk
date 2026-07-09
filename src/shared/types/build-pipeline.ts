// === Aureon Build Pipeline — Shared Types ===
// Bolt-like prompt → code → diff → live preview pipeline

export type BuildMode = 'plan-only' | 'generate' | 'generate-and-preview'

export type FileOpType = 'create_file' | 'update_file' | 'delete_file' | 'rename_file' | 'mkdir'

export type FileOpStatus = 'pending' | 'applied' | 'failed' | 'skipped'

export type FileOpRisk = 'safe' | 'write_local' | 'destructive'

export type BuildStepType =
  | 'classify'
  | 'plan'
  | 'generate'
  | 'apply'
  | 'preview_start'
  | 'preview_ready'
  | 'followup'
  | 'complete'
  | 'error'
  | 'cancelled'

export type BuildStepStatus = 'pending' | 'running' | 'done' | 'skipped' | 'error'

/** A single file operation in the build pipeline */
export interface FileOperation {
  id: string
  type: FileOpType
  /** Relative path within sandbox, e.g. "src/index.html" */
  path: string
  /** Language for syntax highlighting, e.g. "html", "css", "javascript" */
  language: string
  /** Previous content (for update_file, optional) */
  beforeContent?: string
  /** New content (for create_file / update_file) */
  afterContent?: string
  /** Computed diff lines */
  diff?: DiffLine[]
  status: FileOpStatus
  risk: FileOpRisk
  /** For rename_file, the old path */
  oldPath?: string
}

/** A single line in a diff */
export interface DiffLine {
  type: 'add' | 'remove' | 'context'
  content: string
  oldLine?: number
  newLine?: number
}

/** A single step in the build pipeline */
export interface BuildStep {
  type: BuildStepType
  status: BuildStepStatus
  label: string
  /** Which file is currently being worked on (for generate/apply steps) */
  filePath?: string
  timestamp: string
  message?: string
}

/** The initial build request from the user */
export interface BuildRequest {
  prompt: string
  projectType: string
  theme: string
  targetWorkspace: string
  providerModelRoute?: string | null
  mode: BuildMode
  /** Optional path to an existing sandbox used as a diff base for follow-up builds.
   * When null/undefined (fresh build), all files show as create_file in the diff UI. */
  baseSandboxPath?: string | null
}

/** The full build result returned after pipeline completes */
export interface BuildResult {
  success: boolean
  request: BuildRequest
  steps: BuildStep[]
  fileOperations: FileOperation[]
  plan: string[]
  previewUrl: string | null
  previewStatus: string | null
  sandboxPath: string | null
  followUpSuggestions: FollowUpSuggestion[]
  isDeterministicDemo: boolean
  error?: string
}

/** Contextual follow-up suggestion after a build completes */
export interface FollowUpSuggestion {
  id: string
  label: string
  prompt: string
  category: 'style' | 'feature' | 'persistence' | 'animation' | 'theme' | 'deploy' | 'explain'
}

/** Live pipeline status pushed to renderer via IPC */
export interface BuildPipelineStatus {
  buildId: string | null
  step: BuildStep | null
  completedSteps: BuildStep[]
  fileOperations: FileOperation[]
  previewUrl: string | null
  previewStatus: string | null
  isComplete: boolean
  error: string | null
  isDeterministicDemo: boolean
  followUpSuggestions: FollowUpSuggestion[]
  /** Raw streaming text during AI code generation (accumulated) */
  streamingRawText?: string
  /** Whether AI streaming generation is in progress */
  isStreaming?: boolean
  /** Human-readable provider/model label during AI generation (e.g. "Claude 3.5 Sonnet via Anthropic") */
  generatingModelLabel?: string
}

/** Build intent classification result */
export interface BuildIntentClassification {
  intent: 'build_app' | 'build_component' | 'build_utility' | 'build_game' | 'build_dashboard' | 'generic'
  projectType: string
  suggestedFiles: string[]
  suggestedName: string
}

/** Generate contextual follow-up suggestions based on what was built */
export function generateFollowUpSuggestions(intent: string): FollowUpSuggestion[] {
  return [
    { id: 'improve-styling', label: 'Improve styling', prompt: 'Improve the styling — add better spacing, shadows, and a more premium feel.', category: 'style' },
    { id: 'add-navigation', label: 'Add navigation', prompt: 'Add a navigation bar with links between sections.', category: 'feature' },
    { id: 'add-local-storage', label: 'Add local storage', prompt: 'Add local storage so data persists across page reloads.', category: 'persistence' },
    { id: 'add-animations', label: 'Add animations', prompt: 'Add smooth CSS transitions and micro-interactions.', category: 'animation' },
    { id: 'add-dark-mode', label: 'Add dark mode', prompt: 'Add a dark mode toggle that switches the color palette.', category: 'theme' },
    { id: 'package-pwa', label: 'Package as PWA', prompt: 'Make this installable as a Progressive Web App with a manifest and service worker.', category: 'deploy' },
    { id: 'explain-code', label: 'Explain the code', prompt: 'Explain how the generated code works, step by step.', category: 'explain' },
  ]
}
