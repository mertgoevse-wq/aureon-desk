// === Aureon Desk — Connector Registry ===
// Formal registry of all connectors, their actions, scopes, and safety contracts.
// This is the source of truth for the Connectors Hub UI.

import type { ConnectorType, ConnectorStatus, CapabilityId } from './types/studio-core'

// ---- Auth Types ----

export type AuthType = 'api_key' | 'oauth' | 'none' | 'local' | 'mcp'

// ---- OAuth Scope Model (Design) ----

export interface OAuthScope {
  id: string
  label: string
  description: string
  risk: 'read' | 'write' | 'delete' | 'admin'
  required: boolean
}

export interface OAuthConfig {
  provider: string
  authUrl: string
  tokenUrl: string
  scopes: OAuthScope[]
  /** Desktop OAuth flow: use loopback redirect with localhost callback */
  redirectUriPattern: string
  /** Tokens stored via Electron safeStorage, never logged */
  storageStrategy: 'safeStorage' | 'vault'
}

// ---- Connector Action Contracts ----

export type ActionRisk = 'safe' | 'read' | 'write' | 'destructive' | 'account'

export interface ConnectorAction {
  id: string
  label: string
  description: string
  risk: ActionRisk
  requiresConfirmation: boolean
  confirmationMessage?: string
  /** If true, this action needs a second "are you sure?" prompt */
  requiresDoubleConfirmation?: boolean
}

export interface ConnectorDefinition {
  id: ConnectorType
  displayName: string
  category: 'ai_provider' | 'google_service' | 'developer' | 'local' | 'future'
  iconKey: string // lucide icon name
  status: ConnectorStatus
  capabilities: CapabilityId[]
  authType: AuthType
  scopes: OAuthScope[]
  riskLevel: ActionRisk
  setupStatus: 'ready' | 'needs_key' | 'needs_oauth' | 'planned' | 'configured'
  docsUrl?: string
  supportsTestConnection: boolean
  actions: ConnectorAction[]
  riskNotes: string
  setupPath: string
}

// ---- Gmail Action Contracts (Safety-First) ----

export const GMAIL_SCOPES: OAuthScope[] = [
  {
    id: 'gmail.readonly',
    label: 'Read inbox',
    description: 'View inbox summary and search emails. Cannot modify anything.',
    risk: 'read',
    required: false,
  },
  {
    id: 'gmail.compose',
    label: 'Compose drafts',
    description: 'Create and update email drafts. Drafts are NEVER sent without explicit approval.',
    risk: 'write',
    required: false,
  },
  {
    id: 'gmail.send',
    label: 'Send emails',
    description: 'Send emails ONLY after explicit user confirmation. Every send shows what will be sent.',
    risk: 'delete',
    required: false,
  },
  {
    id: 'gmail.modify',
    label: 'Modify labels',
    description: 'Label, archive, or move emails. Every modification requires approval.',
    risk: 'write',
    required: false,
  },
]

export const GMAIL_ACTIONS: ConnectorAction[] = [
  {
    id: 'gmail.read_inbox',
    label: 'Read inbox summary',
    description: 'Get a summary of recent emails — sender, subject, and timestamp only. No body content.',
    risk: 'read',
    requiresConfirmation: false,
  },
  {
    id: 'gmail.search',
    label: 'Search emails',
    description: 'Search emails by query. Returns matching message summaries.',
    risk: 'read',
    requiresConfirmation: false,
  },
  {
    id: 'gmail.create_draft',
    label: 'Create draft',
    description: 'Create a new email draft. Draft is saved but NOT sent.',
    risk: 'write',
    requiresConfirmation: true,
    confirmationMessage: 'This will create an email draft. It will NOT be sent. Continue?',
  },
  {
    id: 'gmail.update_draft',
    label: 'Update draft',
    description: 'Modify an existing draft. Changes are saved locally first.',
    risk: 'write',
    requiresConfirmation: true,
    confirmationMessage: 'This will modify an existing draft. Review the changes before confirming.',
  },
  {
    id: 'gmail.send_draft',
    label: 'Send draft',
    description: 'Send a draft email. Shows recipient, subject, and body preview BEFORE sending.',
    risk: 'account',
    requiresConfirmation: true,
    requiresDoubleConfirmation: true,
    confirmationMessage: '⚠️ You are about to SEND an email. Review recipient, subject, and content carefully.',
  },
  {
    id: 'gmail.label',
    label: 'Label / Archive',
    description: 'Add or remove labels, or archive emails. Shows what will change before applying.',
    risk: 'write',
    requiresConfirmation: true,
    confirmationMessage: 'This will change labels on your emails. Review the changes before confirming.',
  },
  {
    id: 'gmail.trash',
    label: 'Move to trash',
    description: 'Move emails to trash. Emails can be recovered from trash for 30 days.',
    risk: 'destructive',
    requiresConfirmation: true,
    requiresDoubleConfirmation: true,
    confirmationMessage: '⚠️ This will move emails to trash. They can be recovered within 30 days. Are you sure?',
  },
]

// ---- Google OAuth Config (Design) ----

export const GMAIL_OAUTH_CONFIG: OAuthConfig = {
  provider: 'google',
  authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  scopes: GMAIL_SCOPES,
  redirectUriPattern: 'http://localhost:{port}/oauth/callback',
  storageStrategy: 'safeStorage',
}

// ---- Connector Registry ----

export const CONNECTOR_REGISTRY: Record<ConnectorType, ConnectorDefinition> = {
  openai: {
    id: 'openai',
    displayName: 'OpenAI / ChatGPT API',
    category: 'ai_provider',
    iconKey: 'Cpu',
    status: 'not_connected',
    capabilities: ['text_generation', 'code_generation', 'image_understanding', 'speech_to_text', 'text_to_speech', 'image_generation'],
    authType: 'api_key',
    scopes: [],
    riskLevel: 'read',
    setupStatus: 'needs_key',
    docsUrl: 'https://platform.openai.com/docs',
    supportsTestConnection: true,
    actions: [
      { id: 'openai.text', label: 'Text generation', description: 'Generate text with GPT models', risk: 'safe', requiresConfirmation: false },
      { id: 'openai.code', label: 'Code generation', description: 'Generate and refactor code', risk: 'write', requiresConfirmation: true },
      { id: 'openai.vision', label: 'Image analysis', description: 'Analyze images with GPT-4o vision', risk: 'read', requiresConfirmation: false },
      { id: 'openai.image', label: 'Image generation', description: 'Generate images with DALL-E', risk: 'write', requiresConfirmation: true },
      { id: 'openai.speech', label: 'Speech processing', description: 'Transcribe audio with Whisper and generate speech with TTS', risk: 'read', requiresConfirmation: false },
    ],
    riskNotes: 'Files and prompts are sent to OpenAI servers. Never share sensitive data. API key stored encrypted via Electron safeStorage.',
    setupPath: '/settings/providers',
  },
  google_gemini: {
    id: 'google_gemini',
    displayName: 'Google Gemini',
    category: 'ai_provider',
    iconKey: 'Globe',
    status: 'not_connected',
    capabilities: ['text_generation', 'code_generation', 'image_understanding', 'video_understanding', 'audio_understanding'],
    authType: 'api_key',
    scopes: [],
    riskLevel: 'read',
    setupStatus: 'needs_key',
    docsUrl: 'https://ai.google.dev/docs',
    supportsTestConnection: true,
    actions: [
      { id: 'gemini.text', label: 'Text generation', description: 'Generate text with Gemini models', risk: 'safe', requiresConfirmation: false },
      { id: 'gemini.code', label: 'Code generation', description: 'Generate and analyze code', risk: 'write', requiresConfirmation: true },
      { id: 'gemini.vision', label: 'Image & video analysis', description: 'Analyze images and video with Gemini vision', risk: 'read', requiresConfirmation: false },
      { id: 'gemini.audio', label: 'Audio processing', description: 'Process and understand audio content', risk: 'read', requiresConfirmation: false },
    ],
    riskNotes: 'Files and prompts are sent to Google servers. Never share sensitive data. API key stored encrypted via Electron safeStorage.',
    setupPath: '/settings/providers',
  },
  google_ai_studio: {
    id: 'google_ai_studio',
    displayName: 'Google AI Studio',
    category: 'ai_provider',
    iconKey: 'Globe',
    status: 'not_connected',
    capabilities: ['text_generation', 'code_generation', 'image_understanding', 'video_understanding'],
    authType: 'api_key',
    scopes: [],
    riskLevel: 'read',
    setupStatus: 'needs_key',
    docsUrl: 'https://aistudio.google.com',
    supportsTestConnection: true,
    actions: [
      { id: 'aistudio.text', label: 'Text generation', description: 'Generate text with Gemini models via AI Studio', risk: 'safe', requiresConfirmation: false },
      { id: 'aistudio.vision', label: 'Image & video analysis', description: 'Analyze media with Gemini vision', risk: 'read', requiresConfirmation: false },
    ],
    riskNotes: 'Same as Google Gemini — files and prompts sent to Google servers. Free tier available for prototyping.',
    setupPath: '/settings/providers',
  },
  gmail: {
    id: 'gmail',
    displayName: 'Gmail',
    category: 'google_service',
    iconKey: 'Mail',
    status: 'needs_setup',
    capabilities: ['gmail_read', 'gmail_draft', 'gmail_send'],
    authType: 'oauth',
    scopes: GMAIL_SCOPES,
    riskLevel: 'account',
    setupStatus: 'needs_oauth',
    docsUrl: 'https://developers.google.com/gmail/api/guides',
    supportsTestConnection: false,
    actions: GMAIL_ACTIONS,
    riskNotes: 'OAuth-based access to Gmail. Every send requires explicit confirmation. Tokens stored encrypted via Electron safeStorage. Minimal scopes requested — you choose which to grant.',
    setupPath: '/settings/connectors',
  },
  google_drive: {
    id: 'google_drive',
    displayName: 'Google Drive',
    category: 'google_service',
    iconKey: 'HardDrive',
    status: 'needs_setup',
    capabilities: ['google_drive'],
    authType: 'oauth',
    scopes: [
      { id: 'drive.readonly', label: 'Read files', description: 'View and download files from Google Drive', risk: 'read', required: false },
      { id: 'drive.file', label: 'Create and manage files', description: 'Create, update, and organize files', risk: 'write', required: false },
    ],
    riskLevel: 'account',
    setupStatus: 'planned',
    docsUrl: 'https://developers.google.com/drive/api/guides/about-sdk',
    supportsTestConnection: false,
    actions: [
      { id: 'drive.read', label: 'Read files', description: 'View and download files from Drive', risk: 'read', requiresConfirmation: false },
      { id: 'drive.create', label: 'Create files', description: 'Upload and create new files', risk: 'write', requiresConfirmation: true },
      { id: 'drive.manage', label: 'Manage files', description: 'Move, rename, and organize files', risk: 'write', requiresConfirmation: true },
    ],
    riskNotes: 'OAuth-based access to Google Drive. File operations require confirmation. Placeholder — full implementation planned.',
    setupPath: '/settings/connectors',
  },
  google_calendar: {
    id: 'google_calendar',
    displayName: 'Google Calendar',
    category: 'google_service',
    iconKey: 'Calendar',
    status: 'needs_setup',
    capabilities: ['google_calendar'],
    authType: 'oauth',
    scopes: [
      { id: 'calendar.readonly', label: 'Read calendar', description: 'View events and free/busy information', risk: 'read', required: false },
      { id: 'calendar.events', label: 'Manage events', description: 'Create, update, and delete calendar events', risk: 'write', required: false },
    ],
    riskLevel: 'account',
    setupStatus: 'planned',
    docsUrl: 'https://developers.google.com/calendar/api/guides/overview',
    supportsTestConnection: false,
    actions: [
      { id: 'calendar.read', label: 'Read events', description: 'View calendar events and schedule', risk: 'read', requiresConfirmation: false },
      { id: 'calendar.create', label: 'Create events', description: 'Create new calendar events', risk: 'write', requiresConfirmation: true },
      { id: 'calendar.manage', label: 'Manage events', description: 'Update or delete events', risk: 'write', requiresConfirmation: true },
    ],
    riskNotes: 'OAuth-based access to Google Calendar. Event changes require confirmation. Placeholder — full implementation planned.',
    setupPath: '/settings/connectors',
  },
  github: {
    id: 'github',
    displayName: 'GitHub',
    category: 'developer',
    iconKey: 'Github',
    status: 'needs_setup',
    capabilities: ['github'],
    authType: 'oauth',
    scopes: [
      { id: 'repo', label: 'Repository access', description: 'Read and write repository contents', risk: 'write', required: false },
      { id: 'read:org', label: 'Organization read', description: 'Read organization membership', risk: 'read', required: false },
      { id: 'workflow', label: 'Workflows', description: 'Read and trigger GitHub Actions workflows', risk: 'write', required: false },
    ],
    riskLevel: 'account',
    setupStatus: 'needs_oauth',
    docsUrl: 'https://docs.github.com/en/rest',
    supportsTestConnection: false,
    actions: [
      { id: 'github.read', label: 'Read repos', description: 'Browse and read repository contents', risk: 'read', requiresConfirmation: false },
      { id: 'github.import', label: 'Import repos', description: 'Clone and import repositories', risk: 'write', requiresConfirmation: true },
      { id: 'github.pr', label: 'Create PR', description: 'Create pull requests', risk: 'write', requiresConfirmation: true },
      { id: 'github.issues', label: 'Manage issues', description: 'Create and manage issues', risk: 'write', requiresConfirmation: true },
    ],
    riskNotes: 'GitHub import is already built. OAuth for push/PR actions coming soon. Repository access requires explicit authorization.',
    setupPath: '/settings/github',
  },
  openrouter: {
    id: 'openrouter',
    displayName: 'OpenRouter',
    category: 'ai_provider',
    iconKey: 'Server',
    status: 'not_connected',
    capabilities: ['text_generation', 'code_generation', 'image_understanding'],
    authType: 'api_key',
    scopes: [],
    riskLevel: 'read',
    setupStatus: 'needs_key',
    docsUrl: 'https://openrouter.ai/docs',
    supportsTestConnection: true,
    actions: [
      { id: 'openrouter.text', label: 'Text generation', description: 'Generate text with auto-routed best model', risk: 'safe', requiresConfirmation: false },
      { id: 'openrouter.code', label: 'Code generation', description: 'Generate code with coding-optimized models', risk: 'write', requiresConfirmation: true },
      { id: 'openrouter.vision', label: 'Image analysis', description: 'Analyze images with vision-capable models', risk: 'read', requiresConfirmation: false },
    ],
    riskNotes: 'Prompts routed through OpenRouter to model providers. Check their privacy policy. Free tier available. API key stored encrypted.',
    setupPath: '/settings/providers',
  },
  ollama: {
    id: 'ollama',
    displayName: 'Ollama',
    category: 'local',
    iconKey: 'Cpu',
    status: 'connected',
    capabilities: ['text_generation', 'code_generation'],
    authType: 'local',
    scopes: [],
    riskLevel: 'safe',
    setupStatus: 'ready',
    docsUrl: 'https://ollama.com',
    supportsTestConnection: true,
    actions: [
      { id: 'ollama.text', label: 'Text generation', description: 'Generate text locally — no data leaves your machine', risk: 'safe', requiresConfirmation: false },
      { id: 'ollama.code', label: 'Code generation', description: 'Generate code locally', risk: 'safe', requiresConfirmation: false },
      { id: 'ollama.sync', label: 'Sync models', description: 'Auto-detect locally installed Ollama models', risk: 'safe', requiresConfirmation: false },
    ],
    riskNotes: 'Runs entirely on your machine. No data leaves your computer. Perfect for private/background tasks. Requires Ollama running locally.',
    setupPath: '/settings/providers',
  },
  lm_studio: {
    id: 'lm_studio',
    displayName: 'LM Studio',
    category: 'local',
    iconKey: 'Cpu',
    status: 'connected',
    capabilities: ['text_generation', 'code_generation'],
    authType: 'local',
    scopes: [],
    riskLevel: 'safe',
    setupStatus: 'ready',
    docsUrl: 'https://lmstudio.ai',
    supportsTestConnection: true,
    actions: [
      { id: 'lmstudio.text', label: 'Text generation', description: 'Generate text locally via LM Studio', risk: 'safe', requiresConfirmation: false },
      { id: 'lmstudio.code', label: 'Code generation', description: 'Generate code locally', risk: 'safe', requiresConfirmation: false },
    ],
    riskNotes: 'Runs entirely on your machine. No data leaves your computer. Requires LM Studio running with a loaded model.',
    setupPath: '/settings/providers',
  },
  mcp_server: {
    id: 'mcp_server',
    displayName: 'MCP Servers',
    category: 'developer',
    iconKey: 'Wrench',
    status: 'connected',
    capabilities: ['mcp_tools'],
    authType: 'mcp',
    scopes: [],
    riskLevel: 'destructive',
    setupStatus: 'ready',
    docsUrl: 'https://modelcontextprotocol.io',
    supportsTestConnection: false,
    actions: [
      { id: 'mcp.search', label: 'File search', description: 'Search for files by pattern — mock tool, no real filesystem access', risk: 'read', requiresConfirmation: false },
      { id: 'mcp.git', label: 'Git status', description: 'Check git repository status — mock tool', risk: 'read', requiresConfirmation: false },
      { id: 'mcp.summary', label: 'Project summary', description: 'Generate project overview — mock tool', risk: 'read', requiresConfirmation: false },
      { id: 'mcp.destructive', label: 'Destructive actions', description: 'Actions requiring file_write, shell, git, database, or secrets permissions', risk: 'destructive', requiresConfirmation: true, requiresDoubleConfirmation: true },
    ],
    riskNotes: 'MCP tools can be destructive. Each tool call passes through the safety gate. Imported tools are disabled and untrusted by default. Destructive tools require double confirmation.',
    setupPath: '/tools',
  },
  phone_companion: {
    id: 'phone_companion',
    displayName: 'Phone Companion',
    category: 'future',
    iconKey: 'Smartphone',
    status: 'planned',
    capabilities: [],
    authType: 'local',
    scopes: [],
    riskLevel: 'safe',
    setupStatus: 'planned',
    docsUrl: undefined,
    supportsTestConnection: false,
    actions: [
      { id: 'phone.notify', label: 'Notifications', description: 'Receive desktop notifications on your phone', risk: 'safe', requiresConfirmation: false },
      { id: 'phone.camera', label: 'Camera upload', description: 'Upload photos from phone camera', risk: 'read', requiresConfirmation: true },
      { id: 'phone.remote', label: 'Remote actions', description: 'Trigger actions on Aureon from your phone', risk: 'write', requiresConfirmation: true },
    ],
    riskNotes: 'Currently in planning stage. Local network pairing only — no cloud relay. All data stays on your local network. Pairing code displayed in Aureon Desk.',
    setupPath: '/settings/connectors',
  },
}

// ---- Helper Functions ----

export function getConnector(id: ConnectorType): ConnectorDefinition {
  return CONNECTOR_REGISTRY[id]
}

export function getAllConnectors(): ConnectorDefinition[] {
  return Object.values(CONNECTOR_REGISTRY)
}

export function getConnectorsByCategory(category: ConnectorDefinition['category']): ConnectorDefinition[] {
  return Object.values(CONNECTOR_REGISTRY).filter(c => c.category === category)
}

export function getDangerousActions(connectorId: ConnectorType): ConnectorAction[] {
  return CONNECTOR_REGISTRY[connectorId]?.actions.filter(a =>
    a.risk === 'destructive' || a.risk === 'account'
  ) || []
}

export function getActionsRequiringConfirmation(connectorId: ConnectorType): ConnectorAction[] {
  return CONNECTOR_REGISTRY[connectorId]?.actions.filter(a =>
    a.requiresConfirmation
  ) || []
}

export function getOAuthScopes(connectorId: ConnectorType): OAuthScope[] {
  return CONNECTOR_REGISTRY[connectorId]?.scopes || []
}
