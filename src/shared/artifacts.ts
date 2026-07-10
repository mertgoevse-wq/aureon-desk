/**
 * Aureon Desk — Artifact Renderer System
 *
 * Structured output artifacts that make AI results easier to understand, copy, and reuse.
 * Each artifact has a consistent shape: id, type, title, content, optional metadata, and actions.
 */

// ---- Core Types ----

export type ArtifactType =
  | 'prompt'
  | 'code'
  | 'text'
  | 'markdown'
  | 'file-tree'
  | 'diff'
  | 'preview'
  | 'build-plan'
  | 'search-results'
  | 'image-gallery'
  | 'tutorial'
  | 'checklist'
  | 'command'
  | 'error-diagnostic'
  | 'provider-setup'
  | 'skill-result'

export type ArtifactRisk = 'safe' | 'caution' | 'destructive'

export interface ArtifactAction {
  id: string
  label: string
  /** Icon name from lucide-react */
  icon?: string
  /** Handler is resolved at render time — component maps action IDs to callbacks */
  enabled?: boolean
}

export interface BaseArtifact {
  id: string
  type: ArtifactType
  title: string
  subtitle?: string
  createdAt: string
  /** Which agent/skill produced this artifact */
  source?: string
  risk?: ArtifactRisk
  /** Actions available on this artifact (copy, expand, etc.) */
  actions?: ArtifactAction[]
  /** Whether the artifact is collapsed by default */
  collapsed?: boolean
}

// ---- Specific Artifact Types ----

export interface PromptArtifact extends BaseArtifact {
  type: 'prompt'
  /** The prompt text — always copyable */
  prompt: string
  /** Which template produced this prompt, if any */
  templateId?: string
}

export interface CodeArtifact extends BaseArtifact {
  type: 'code'
  /** The code content */
  code: string
  /** Programming language for syntax highlighting */
  language: string
  /** Display filename (e.g., "src/index.html") */
  filename?: string
  /** Whether the code was AI-generated */
  generated?: boolean
}

export interface TextArtifact extends BaseArtifact {
  type: 'text'
  /** Freeform text or document content */
  text: string
}

export interface MarkdownArtifact extends BaseArtifact {
  type: 'markdown'
  /** Raw markdown string */
  markdown: string
}

export interface FileTreeArtifact extends BaseArtifact {
  type: 'file-tree'
  /** Hierarchical file tree entries */
  files: FileTreeEntry[]
}

export interface FileTreeEntry {
  name: string
  path: string
  type: 'file' | 'directory'
  language?: string
  /** Operation type if this tree represents build changes */
  opType?: 'create' | 'update' | 'delete' | 'rename'
  children?: FileTreeEntry[]
}

export interface DiffArtifact extends BaseArtifact {
  type: 'diff'
  /** The diff lines to render */
  lines: DiffLine[]
  /** Which file this diff is for */
  filePath?: string
  language?: string
}

export interface DiffLine {
  type: 'add' | 'remove' | 'context'
  content: string
  oldLine?: number
  newLine?: number
}

export interface PreviewArtifact extends BaseArtifact {
  type: 'preview'
  /** URL to render in iframe */
  url?: string
  /** Status of the preview */
  status: 'idle' | 'starting' | 'running' | 'error' | 'stopped'
  port?: number
  /** Sandbox path on disk */
  sandboxPath?: string
}

export interface BuildPlanArtifact extends BaseArtifact {
  type: 'build-plan'
  /** The prompt that generated this plan */
  prompt?: string
  /** Plan steps */
  steps: string[]
}

export interface SearchResultsArtifact extends BaseArtifact {
  type: 'search-results'
  /** Search results */
  results: SearchResult[]
  query?: string
}

export interface SearchResult {
  title: string
  snippet: string
  url?: string
  source?: string
  score?: number
}

export interface TutorialArtifact extends BaseArtifact {
  type: 'tutorial'
  /** Tutorial cards with questions and answers */
  cards: TutorialCard[]
}

export interface TutorialCard {
  id: string
  icon?: string
  question: string
  answer: string
}

export interface ChecklistArtifact extends BaseArtifact {
  type: 'checklist'
  /** Checklist items with completion state */
  items: ChecklistItem[]
}

export interface ChecklistItem {
  id: string
  label: string
  description?: string
  checked: boolean
}

export interface CommandArtifact extends BaseArtifact {
  type: 'command'
  /** The terminal command(s) */
  command: string
  /** Human-readable description */
  description?: string
  /** Working directory for the command */
  cwd?: string
}

export interface ErrorDiagnosticArtifact extends BaseArtifact {
  type: 'error-diagnostic'
  /** The error message */
  errorMessage: string
  /** Suggested fixes */
  suggestions: string[]
  /** Stack trace if available */
  stackTrace?: string
}

export interface ProviderSetupArtifact extends BaseArtifact {
  type: 'provider-setup'
  /** Provider name (e.g., "OpenRouter", "Ollama") */
  provider: string
  /** Setup instructions */
  instructions: string
  /** API key hint */
  apiKeyHint?: string
  /** Setup URL */
  setupUrl?: string
}

export interface SkillResultArtifact extends BaseArtifact {
  type: 'skill-result'
  /** The skill that produced this result */
  skill: string
  /** Status of the skill execution */
  status: 'running' | 'done' | 'error'
  /** Result message or output */
  result?: string
}

// ---- Union Type ----

export type Artifact =
  | PromptArtifact
  | CodeArtifact
  | TextArtifact
  | MarkdownArtifact
  | FileTreeArtifact
  | DiffArtifact
  | PreviewArtifact
  | BuildPlanArtifact
  | SearchResultsArtifact
  | TutorialArtifact
  | ChecklistArtifact
  | CommandArtifact
  | ErrorDiagnosticArtifact
  | ProviderSetupArtifact
  | SkillResultArtifact

// ---- Helpers ----

let _idCounter = 0
export function createArtifactId(): string {
  _idCounter++
  return `artifact-${Date.now()}-${_idCounter}`
}

/** Create a code artifact from a file operation (build pipeline → artifact) */
export function codeArtifactFromFileOp(
  op: { id: string; path: string; language: string; afterContent?: string; type: string },
): CodeArtifact {
  return {
    id: createArtifactId(),
    type: 'code',
    title: op.path.split('/').pop() || op.path,
    subtitle: op.path,
    filename: op.path,
    language: op.language,
    code: op.afterContent || '',
    generated: true,
    createdAt: new Date().toISOString(),
    actions: [
      { id: 'copy', label: 'Copy code', icon: 'Copy' },
      { id: 'expand', label: 'Expand', icon: 'ChevronDown' },
    ],
  }
}

/** Create a prompt artifact from a vibe template */
export function promptArtifactFromTemplate(
  template: { id: string; label: string; prompt: string; category: string },
): PromptArtifact {
  return {
    id: createArtifactId(),
    type: 'prompt',
    title: template.label,
    subtitle: `Category: ${template.category}`,
    prompt: template.prompt,
    templateId: template.id,
    createdAt: new Date().toISOString(),
    actions: [
      { id: 'copy', label: 'Copy prompt', icon: 'Copy' },
      { id: 'send', label: 'Send to composer', icon: 'Send' },
    ],
  }
}

/** Create a diff artifact from build pipeline diff lines */
export function diffArtifactFromDiff(
  filePath: string,
  language: string,
  lines: Array<{ type: 'add' | 'remove' | 'context'; content: string }>,
): DiffArtifact {
  return {
    id: createArtifactId(),
    type: 'diff',
    title: filePath.split('/').pop() || filePath,
    subtitle: filePath,
    filePath,
    language,
    lines,
    createdAt: new Date().toISOString(),
    actions: [
      { id: 'copy', label: 'Copy diff', icon: 'Copy' },
    ],
  }
}

/** Create a build plan artifact */
export function buildPlanArtifact(
  prompt: string,
  steps: string[],
): BuildPlanArtifact {
  return {
    id: createArtifactId(),
    type: 'build-plan',
    title: 'Build Plan',
    subtitle: `${steps.length} steps`,
    prompt,
    steps,
    createdAt: new Date().toISOString(),
    actions: [
      { id: 'copy', label: 'Copy plan', icon: 'Copy' },
    ],
  }
}

// ---- Content Parsing ----

/**
 * Extract structured artifacts from AI message content.
 * Detects fenced code blocks (```) and converts them to CodeArtifacts.
 * Everything else stays as raw markdown text.
 */
export function parseArtifactsFromContent(content: string): { artifacts: Artifact[]; cleanedContent: string } {
  const artifacts: Artifact[] = []
  const codeBlockRegex = /```(\w+)?\s*(?:#\s*(.+))?\r?\n([\s\S]*?)```/g
  let cleanedContent = content
  let match: RegExpExecArray | null

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const language = (match[1] || 'text').trim()
    const filenameHint = match[2] ? match[2].trim() : undefined
    const code = match[3].trim()

    const artifact: CodeArtifact = {
      id: createArtifactId(),
      type: 'code',
      title: filenameHint || `${language} snippet`,
      subtitle: filenameHint ? `${language} · ${filenameHint}` : language,
      filename: filenameHint,
      language,
      code,
      generated: true,
      createdAt: new Date().toISOString(),
      actions: [
        { id: 'copy', label: 'Copy code', icon: 'Copy' },
        { id: 'expand', label: 'Expand', icon: 'ChevronDown' },
      ],
    }
    artifacts.push(artifact)

    // Remove the matched code block from cleaned content (keep other markdown)
    cleanedContent = cleanedContent.replace(match[0], '')
  }

  // Trim extra whitespace and normalize multiple blank lines from cleanedContent
  cleanedContent = cleanedContent.replace(/\n{3,}/g, '\n\n').trim()

  return { artifacts, cleanedContent }
}
