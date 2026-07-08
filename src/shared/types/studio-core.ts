// === Aureon Studio Core — Shared Types ===

// ---- Autonomy Levels ----
export type AutonomyLevel = 0 | 1 | 2 | 3 | 4

export interface AutonomyLevelInfo {
  level: AutonomyLevel
  label: string
  description: string
  icon: string // lucide icon name
}

export const AUTONOMY_LEVELS: AutonomyLevelInfo[] = [
  { level: 0, label: 'View Only', description: 'Read and observe. No actions allowed.', icon: 'Eye' },
  { level: 1, label: 'Suggest Only', description: 'Propose changes but never apply them.', icon: 'Lightbulb' },
  { level: 2, label: 'Ask Before Acting', description: 'Requires confirmation for every action.', icon: 'ShieldCheck' },
  { level: 3, label: 'Approved Workspace', description: 'Auto-acts within project workspace. Confirms for destructive actions.', icon: 'FolderCheck' },
  { level: 4, label: 'Advanced', description: 'Full autonomy within workspace. Still asks before destructive/account/shell actions.', icon: 'Zap' },
]

// ---- Task Categories ----
export type TaskCategory =
  | 'build_app'
  | 'code_program'
  | 'generate_text'
  | 'generate_image'
  | 'generate_video'
  | 'generate_music'
  | 'analyze_file'
  | 'analyze_screen_video'
  | 'connect_apps'
  | 'automate_workflow'

export interface TaskCategoryInfo {
  id: TaskCategory
  label: string
  description: string
  icon: string // lucide icon name
  requiredCapabilities: CapabilityId[]
  recommendedMode: WorkspaceMode
  starterPrompt: string
  riskLevel: 'low' | 'medium' | 'high'
  requiresConfirmation: boolean
}

export type WorkspaceMode = 'chat' | 'cowork' | 'code' | 'studio'

export const TASK_CATEGORIES: TaskCategoryInfo[] = [
  {
    id: 'build_app',
    label: 'Build App',
    description: 'Create a full application — desktop, web, or mobile — with step-by-step guidance.',
    icon: 'LayoutDashboard',
    requiredCapabilities: ['code_generation', 'app_building', 'live_preview'],
    recommendedMode: 'code',
    starterPrompt: 'I want to build an app. Help me plan the features, choose the right tech stack, and generate the starter code. Start by asking what kind of app I want to build.',
    riskLevel: 'low',
    requiresConfirmation: false,
  },
  {
    id: 'code_program',
    label: 'Code Program',
    description: 'Write, debug, or refactor code with an AI pair programmer.',
    icon: 'Code2',
    requiredCapabilities: ['code_generation'],
    recommendedMode: 'code',
    starterPrompt: 'I need help with coding. Let me describe what I want to build or paste the code I need help with.',
    riskLevel: 'low',
    requiresConfirmation: false,
  },
  {
    id: 'generate_text',
    label: 'Generate Text',
    description: 'Write articles, documentation, emails, stories, or any text content.',
    icon: 'FileText',
    requiredCapabilities: ['text_generation'],
    recommendedMode: 'chat',
    starterPrompt: 'I need help writing something. Let me describe what kind of text I need — article, documentation, email, creative writing, or something else.',
    riskLevel: 'low',
    requiresConfirmation: false,
  },
  {
    id: 'generate_image',
    label: 'Generate Image',
    description: 'Create images, logos, illustrations, or visual assets with AI.',
    icon: 'Image',
    requiredCapabilities: ['image_generation'],
    recommendedMode: 'chat',
    starterPrompt: 'I want to generate an image. Describe what you want to create — style, subject, colors, and purpose. I\'ll help you craft the perfect prompt.',
    riskLevel: 'low',
    requiresConfirmation: false,
  },
  {
    id: 'generate_video',
    label: 'Generate Video',
    description: 'Create videos, animations, or visual content with AI.',
    icon: 'Video',
    requiredCapabilities: ['video_generation'],
    recommendedMode: 'chat',
    starterPrompt: 'I want to generate a video. Describe the type of video, style, duration, and what it should show. I\'ll help you plan and create it.',
    riskLevel: 'low',
    requiresConfirmation: false,
  },
  {
    id: 'generate_music',
    label: 'Generate Music',
    description: 'Create music tracks, sound effects, or audio content with AI.',
    icon: 'Music',
    requiredCapabilities: ['music_generation'],
    recommendedMode: 'chat',
    starterPrompt: 'I want to generate music. Describe the genre, mood, length, and purpose. I\'ll help you craft the perfect prompt.',
    riskLevel: 'low',
    requiresConfirmation: false,
  },
  {
    id: 'analyze_file',
    label: 'Analyze File',
    description: 'Upload and analyze documents, code, data, or media files.',
    icon: 'FileSearch',
    requiredCapabilities: ['text_generation', 'local_files'],
    recommendedMode: 'chat',
    starterPrompt: 'I want to analyze a file. Describe what kind of file it is and what you want to learn from it. You can attach files in the chat composer.',
    riskLevel: 'medium',
    requiresConfirmation: true,
  },
  {
    id: 'analyze_screen_video',
    label: 'Analyze Screen / Video',
    description: 'Analyze screenshots, screen recordings, or video content.',
    icon: 'MonitorPlay',
    requiredCapabilities: ['image_understanding', 'video_understanding'],
    recommendedMode: 'chat',
    starterPrompt: 'I want to analyze a screenshot or video. Describe what you\'re looking at and what you want to understand or fix.',
    riskLevel: 'medium',
    requiresConfirmation: true,
  },
  {
    id: 'connect_apps',
    label: 'Connect Apps',
    description: 'Connect external services — Gmail, GitHub, Google Drive, APIs.',
    icon: 'Plug',
    requiredCapabilities: [],
    recommendedMode: 'studio',
    starterPrompt: 'I want to connect an external service or app. I\'ll guide you through the setup. Which service do you want to connect?',
    riskLevel: 'medium',
    requiresConfirmation: true,
  },
  {
    id: 'automate_workflow',
    label: 'Automate Workflow',
    description: 'Create multi-step automated workflows combining tools and services.',
    icon: 'Workflow',
    requiredCapabilities: ['mcp_tools', 'shell_commands'],
    recommendedMode: 'cowork',
    starterPrompt: 'I want to automate a workflow. Describe the steps you want to automate. I\'ll help you design a safe, permission-based workflow.',
    riskLevel: 'high',
    requiresConfirmation: true,
  },
]

// ---- Capability Registry ----
export type CapabilityId =
  | 'text_generation'
  | 'code_generation'
  | 'app_building'
  | 'image_generation'
  | 'image_understanding'
  | 'video_generation'
  | 'video_understanding'
  | 'music_generation'
  | 'audio_understanding'
  | 'speech_to_text'
  | 'text_to_speech'
  | 'gmail_read'
  | 'gmail_draft'
  | 'gmail_send'
  | 'google_drive'
  | 'google_calendar'
  | 'github'
  | 'mcp_tools'
  | 'live_preview'
  | 'local_files'
  | 'shell_commands'

export type RiskTier = 'safe' | 'read_only' | 'write_local' | 'write_remote' | 'account_action' | 'destructive'

export interface CapabilityDefinition {
  id: CapabilityId
  displayName: string
  description: string
  icon: string // lucide icon name
  requiredConnector: ConnectorType | null
  riskTier: RiskTier
  permissionRequired: boolean
  mayUploadRemotely: boolean
  recommendedTaskCategory: TaskCategory | null
}

export type ConnectorType =
  | 'openai'
  | 'google_gemini'
  | 'google_ai_studio'
  | 'gmail'
  | 'google_drive'
  | 'google_calendar'
  | 'github'
  | 'openrouter'
  | 'ollama'
  | 'lm_studio'
  | 'mcp_server'
  | 'phone_companion'

export type ConnectorStatus = 'not_connected' | 'connected' | 'needs_setup' | 'error' | 'planned'

export interface TaskModelPolicy {
  preferredAdapterSlug: string | null
  requiredCapabilityFlags: string[]
  preferLocal: boolean
  fallbackToFree: boolean
  setupGuidance: string
}

// ---- Studio Core Input/Output ----
export interface StudioIntentInput {
  userIntent: string
  selectedTaskType?: TaskCategory
  selectedMode?: WorkspaceMode
  selectedProviderId?: string
  selectedModelId?: string
  connectedApps?: ConnectorType[]
  availableTools?: string[]
  projectContext?: string
  mediaAttachments?: boolean
  autonomyLevel: AutonomyLevel
}

export interface StudioOrchestrationResult {
  taskClassification: TaskCategory
  confidence: number
  recommendedMode: WorkspaceMode
  recommendedAdapter: string | null
  recommendedModel: string | null
  requiredCapabilities: CapabilityId[]
  requiredPermissions: string[]
  plannedSteps: string[]
  suggestedPrompt: string
  nextUIAction: 'navigate_to_chat' | 'navigate_to_code' | 'navigate_to_cowork' | 'open_connectors' | 'show_setup_guidance' | 'show_confirmation'
  safetyWarnings: string[]
  missingCapabilities: CapabilityId[]
  requiresConfirmation: boolean
}
