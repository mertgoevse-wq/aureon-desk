export type ConnectorPresetStatus = 'available' | 'planned' | 'manual'
export type ConnectorPresetRisk = 'low' | 'medium' | 'high'
export type ConnectorPresetAuthType = 'api_key' | 'oauth' | 'local' | 'mcp' | 'manual' | 'none'
export type ConnectorPresetTestBehavior = 'provider-test' | 'oauth-placeholder' | 'local-health-check' | 'mcp-handshake' | 'mock-only' | 'manual-review'

export interface ConnectorPresetField {
  id: string
  label: string
  type: 'text' | 'password' | 'url' | 'select'
  required: boolean
  secret?: boolean
  placeholder?: string
  helpText?: string
  options?: string[]
}

export interface ConnectorPreset {
  id: string
  displayName: string
  neutralIcon: string
  description: string
  authType: ConnectorPresetAuthType
  requiredFields: ConnectorPresetField[]
  scopes: string[]
  permissions: string[]
  riskLevel: ConnectorPresetRisk
  status: ConnectorPresetStatus
  setupInstructions: string[]
  testConnectionBehavior: ConnectorPresetTestBehavior
  actionsSupported: string[]
  limitations: string[]
  mockMode: boolean
  setupPath?: string
}

export const CONNECTOR_PRESETS: ConnectorPreset[] = [
  {
    id: 'openai_api',
    displayName: 'OpenAI API',
    neutralIcon: 'Cpu',
    description: 'Text, code, vision, audio, and image-capable API provider.',
    authType: 'api_key',
    requiredFields: [
      { id: 'apiKey', label: 'API key', type: 'password', required: true, secret: true, placeholder: 'sk-...', helpText: 'Stored only through the encrypted provider vault when saved.' },
      { id: 'baseUrl', label: 'Base URL', type: 'url', required: false, placeholder: 'https://api.openai.com/v1' },
    ],
    scopes: [],
    permissions: ['Send selected prompts and attached context to the configured API endpoint'],
    riskLevel: 'medium',
    status: 'available',
    setupInstructions: ['Create an API key in your OpenAI account.', 'Paste it into Providers & Models.', 'Use Test Connection before selecting a model for chat.'],
    testConnectionBehavior: 'provider-test',
    actionsSupported: ['Chat completions', 'Code assistance', 'Vision analysis', 'Image/audio features when models are configured'],
    limitations: ['Remote provider privacy and billing policies apply.', 'Vibeforge does not bundle or expose provider keys in source code.'],
    mockMode: false,
    setupPath: '/settings/providers',
  },
  {
    id: 'google_gemini_api',
    displayName: 'Google Gemini API',
    neutralIcon: 'Sparkles',
    description: 'Gemini API access for text, code, image, audio, and video reasoning.',
    authType: 'api_key',
    requiredFields: [
      { id: 'apiKey', label: 'API key', type: 'password', required: true, secret: true, placeholder: 'AIza...' },
      { id: 'baseUrl', label: 'Base URL', type: 'url', required: false, placeholder: 'https://generativelanguage.googleapis.com' },
    ],
    scopes: [],
    permissions: ['Send selected prompts and media context to Google Gemini API'],
    riskLevel: 'medium',
    status: 'available',
    setupInstructions: ['Create a Gemini API key.', 'Save it in Providers & Models.', 'Select a Gemini model and run Test Connection.'],
    testConnectionBehavior: 'provider-test',
    actionsSupported: ['Chat completions', 'Code assistance', 'Vision/media understanding'],
    limitations: ['Remote processing applies.', 'Video generation is not wired in the desktop app yet.'],
    mockMode: false,
    setupPath: '/settings/providers',
  },
  {
    id: 'openrouter',
    displayName: 'OpenRouter',
    neutralIcon: 'Server',
    description: 'Multi-model routing through OpenRouter with explicit OpenRouter provider labeling.',
    authType: 'api_key',
    requiredFields: [
      { id: 'apiKey', label: 'API key', type: 'password', required: true, secret: true, placeholder: 'sk-or-v1-...' },
      { id: 'defaultModel', label: 'Default model', type: 'text', required: false, placeholder: 'anthropic/claude-sonnet-4' },
    ],
    scopes: [],
    permissions: ['Route selected prompts through OpenRouter to the chosen model provider'],
    riskLevel: 'medium',
    status: 'available',
    setupInstructions: ['Create an OpenRouter key.', 'Save it in Providers & Models.', 'Confirm the UI shows OpenRouter plus the routed model label.'],
    testConnectionBehavior: 'provider-test',
    actionsSupported: ['Chat completions', 'Code assistance', 'Model routing'],
    limitations: ['The direct provider is OpenRouter, even when the routed model is Claude, Gemini, or another family.'],
    mockMode: false,
    setupPath: '/settings/providers',
  },
  {
    id: 'anthropic',
    displayName: 'Anthropic',
    neutralIcon: 'MessageSquare',
    description: 'Direct Anthropic API access for Claude-family models.',
    authType: 'api_key',
    requiredFields: [
      { id: 'apiKey', label: 'API key', type: 'password', required: true, secret: true, placeholder: 'sk-ant-...' },
      { id: 'baseUrl', label: 'Base URL', type: 'url', required: false, placeholder: 'https://api.anthropic.com' },
    ],
    scopes: [],
    permissions: ['Send selected prompts and context to Anthropic API'],
    riskLevel: 'medium',
    status: 'available',
    setupInstructions: ['Create an Anthropic API key.', 'Save it in Providers & Models.', 'Select a direct Anthropic model, not an OpenRouter-routed one.'],
    testConnectionBehavior: 'provider-test',
    actionsSupported: ['Chat completions', 'Code assistance', 'Long-context analysis'],
    limitations: ['Only direct Anthropic routes should display as Anthropic in message metadata.'],
    mockMode: false,
    setupPath: '/settings/providers',
  },
  {
    id: 'gmail_oauth',
    displayName: 'Gmail OAuth',
    neutralIcon: 'Mail',
    description: 'Gmail read, search, draft, and send workflows through OAuth with per-action approval.',
    authType: 'oauth',
    requiredFields: [
      { id: 'clientId', label: 'OAuth client ID', type: 'text', required: true },
      { id: 'clientSecret', label: 'OAuth client secret', type: 'password', required: true, secret: true },
      { id: 'redirectUri', label: 'Loopback redirect URI', type: 'url', required: true, placeholder: 'http://localhost:{port}/oauth/callback' },
    ],
    scopes: ['gmail.readonly', 'gmail.compose', 'gmail.send', 'gmail.modify'],
    permissions: ['Read selected mailbox metadata', 'Search emails', 'Create drafts', 'Send only after explicit user approval'],
    riskLevel: 'high',
    status: 'planned',
    setupInstructions: ['Create a Google OAuth desktop app.', 'Choose only the Gmail scopes you actually need.', 'Review every draft/send action before approval.'],
    testConnectionBehavior: 'oauth-placeholder',
    actionsSupported: ['Read inbox summary', 'Search mail', 'Create drafts', 'Send drafts after confirmation'],
    limitations: ['OAuth flow is not implemented in this build.', 'No email is sent automatically.'],
    mockMode: true,
  },
  {
    id: 'google_drive_oauth',
    displayName: 'Google Drive OAuth',
    neutralIcon: 'HardDrive',
    description: 'Google Drive file access placeholder with scoped OAuth planning.',
    authType: 'oauth',
    requiredFields: [
      { id: 'clientId', label: 'OAuth client ID', type: 'text', required: true },
      { id: 'clientSecret', label: 'OAuth client secret', type: 'password', required: true, secret: true },
    ],
    scopes: ['drive.readonly', 'drive.file'],
    permissions: ['Read selected files', 'Create or update files only after confirmation'],
    riskLevel: 'high',
    status: 'planned',
    setupInstructions: ['Prepare Google Drive OAuth credentials.', 'Use least-privilege Drive scopes.', 'Confirm every write/move/delete operation.'],
    testConnectionBehavior: 'oauth-placeholder',
    actionsSupported: ['Read files', 'Create files', 'Manage selected files'],
    limitations: ['OAuth and live Drive operations are placeholders.'],
    mockMode: true,
  },
  {
    id: 'google_calendar_oauth',
    displayName: 'Google Calendar OAuth',
    neutralIcon: 'Calendar',
    description: 'Calendar read/create/update placeholder with explicit approval for changes.',
    authType: 'oauth',
    requiredFields: [
      { id: 'clientId', label: 'OAuth client ID', type: 'text', required: true },
      { id: 'clientSecret', label: 'OAuth client secret', type: 'password', required: true, secret: true },
    ],
    scopes: ['calendar.readonly', 'calendar.events'],
    permissions: ['Read calendar availability', 'Create or edit events only after confirmation'],
    riskLevel: 'high',
    status: 'planned',
    setupInstructions: ['Prepare Google Calendar OAuth credentials.', 'Start with read-only scopes.', 'Require confirmation before creating or changing events.'],
    testConnectionBehavior: 'oauth-placeholder',
    actionsSupported: ['Read events', 'Find availability', 'Create/update events after confirmation'],
    limitations: ['OAuth and live calendar writes are placeholders.'],
    mockMode: true,
  },
  {
    id: 'github',
    displayName: 'GitHub',
    neutralIcon: 'Github',
    description: 'Repository import and future GitHub issue/PR workflows.',
    authType: 'oauth',
    requiredFields: [
      { id: 'token', label: 'Personal access token or OAuth token', type: 'password', required: true, secret: true },
      { id: 'owner', label: 'Default owner/org', type: 'text', required: false },
    ],
    scopes: ['repo', 'read:org', 'workflow'],
    permissions: ['Read repositories', 'Import repositories', 'Create issues or pull requests after confirmation'],
    riskLevel: 'high',
    status: 'manual',
    setupInstructions: ['Use existing GitHub import for read/import flows.', 'Limit token scopes.', 'Review all write operations before enabling them.'],
    testConnectionBehavior: 'manual-review',
    actionsSupported: ['Import repos', 'Read metadata', 'Planned issues/PR actions'],
    limitations: ['Full OAuth push/PR automation is not implemented here.'],
    mockMode: true,
    setupPath: '/settings/github',
  },
  {
    id: 'mcp_server_custom',
    displayName: 'MCP Server Custom',
    neutralIcon: 'Wrench',
    description: 'Custom MCP server registration with disabled-by-default safety posture.',
    authType: 'mcp',
    requiredFields: [
      { id: 'name', label: 'Server name', type: 'text', required: true },
      { id: 'transport', label: 'Transport', type: 'select', required: true, options: ['stdio', 'http', 'sse'] },
      { id: 'commandOrUrl', label: 'Command or URL', type: 'text', required: true },
    ],
    scopes: [],
    permissions: ['Declared MCP permissions only', 'Safety gate check before every tool call'],
    riskLevel: 'high',
    status: 'manual',
    setupInstructions: ['Register the MCP server.', 'Keep it disabled until permissions are reviewed.', 'Trust only servers you control or have audited.'],
    testConnectionBehavior: 'mcp-handshake',
    actionsSupported: ['File search', 'Project summaries', 'Tool calls through safety gate'],
    limitations: ['Live MCP execution is still safety-gated and partially mocked.'],
    mockMode: true,
    setupPath: '/settings/tools',
  },
  {
    id: 'local_ollama',
    displayName: 'Local Ollama',
    neutralIcon: 'Cpu',
    description: 'Local model endpoint for private chat and code assistance.',
    authType: 'local',
    requiredFields: [
      { id: 'baseUrl', label: 'Base URL', type: 'url', required: true, placeholder: 'http://localhost:11434' },
    ],
    scopes: [],
    permissions: ['Connect to local Ollama server only'],
    riskLevel: 'low',
    status: 'available',
    setupInstructions: ['Install and start Ollama.', 'Pull at least one model.', 'Set the local base URL in Providers & Models.'],
    testConnectionBehavior: 'local-health-check',
    actionsSupported: ['Local chat completions', 'Local code assistance', 'Model discovery'],
    limitations: ['Requires Ollama running locally.'],
    mockMode: false,
    setupPath: '/settings/providers',
  },
  {
    id: 'lm_studio',
    displayName: 'LM Studio',
    neutralIcon: 'Monitor',
    description: 'Local OpenAI-compatible server from LM Studio.',
    authType: 'local',
    requiredFields: [
      { id: 'baseUrl', label: 'Base URL', type: 'url', required: true, placeholder: 'http://localhost:1234/v1' },
    ],
    scopes: [],
    permissions: ['Connect to local LM Studio endpoint only'],
    riskLevel: 'low',
    status: 'available',
    setupInstructions: ['Start LM Studio local server.', 'Load a model.', 'Configure the local endpoint in Providers & Models.'],
    testConnectionBehavior: 'local-health-check',
    actionsSupported: ['Local chat completions', 'Local code assistance'],
    limitations: ['Requires LM Studio running with a loaded model.'],
    mockMode: false,
    setupPath: '/settings/providers',
  },
  {
    id: 'phone_companion',
    displayName: 'Phone Companion',
    neutralIcon: 'Smartphone',
    description: 'Planned local companion app for phone pairing, notifications, and uploads.',
    authType: 'local',
    requiredFields: [
      { id: 'pairingCode', label: 'Pairing code', type: 'text', required: true },
      { id: 'deviceName', label: 'Device name', type: 'text', required: false },
    ],
    scopes: [],
    permissions: ['Local network pairing only after companion app exists', 'No cloud relay'],
    riskLevel: 'medium',
    status: 'planned',
    setupInstructions: ['Install the future Vibeforge phone companion app.', 'Pair on the same local network.', 'Approve permissions on the phone.'],
    testConnectionBehavior: 'mock-only',
    actionsSupported: ['Planned notifications', 'Planned camera upload', 'Planned local handoff'],
    limitations: ['No companion app exists in this build.', 'No phone/account control is implemented now.'],
    mockMode: true,
  },
  {
    id: 'whatsapp_business_api',
    displayName: 'WhatsApp Business API',
    neutralIcon: 'MessageCircle',
    description: 'Official WhatsApp Business API placeholder only.',
    authType: 'manual',
    requiredFields: [
      { id: 'businessApiUrl', label: 'Business API endpoint', type: 'url', required: true },
      { id: 'accessToken', label: 'Access token', type: 'password', required: true, secret: true },
      { id: 'phoneNumberId', label: 'Phone number ID', type: 'text', required: true },
    ],
    scopes: ['whatsapp_business_messaging'],
    permissions: ['Official Business API messaging only after user approval'],
    riskLevel: 'high',
    status: 'planned',
    setupInstructions: ['Use the official WhatsApp Business Platform only.', 'Verify business/account permissions outside Vibeforge.', 'Require approval before any message send.'],
    testConnectionBehavior: 'mock-only',
    actionsSupported: ['Planned official template/message workflows'],
    limitations: ['No unauthorized WhatsApp Web/mobile automation.', 'No personal-account automation.', 'No live messaging in this build.'],
    mockMode: true,
  },
  {
    id: 'email_smtp_imap',
    displayName: 'Email SMTP/IMAP',
    neutralIcon: 'Inbox',
    description: 'Manual email account placeholder for standards-based mail servers.',
    authType: 'manual',
    requiredFields: [
      { id: 'imapHost', label: 'IMAP host', type: 'text', required: true },
      { id: 'smtpHost', label: 'SMTP host', type: 'text', required: true },
      { id: 'username', label: 'Username', type: 'text', required: true },
      { id: 'password', label: 'Password or app password', type: 'password', required: true, secret: true },
    ],
    scopes: [],
    permissions: ['Read mail through IMAP', 'Create/send mail through SMTP only after approval'],
    riskLevel: 'high',
    status: 'planned',
    setupInstructions: ['Use app passwords where supported.', 'Store credentials only in encrypted vault.', 'Confirm every send action.'],
    testConnectionBehavior: 'mock-only',
    actionsSupported: ['Planned inbox read/search', 'Planned draft/send'],
    limitations: ['No live SMTP/IMAP integration in this build.'],
    mockMode: true,
  },
  {
    id: 'browser_search_mcp',
    displayName: 'Browser Search MCP',
    neutralIcon: 'Search',
    description: 'Planned MCP preset for browser/search retrieval with explicit source handling.',
    authType: 'mcp',
    requiredFields: [
      { id: 'serverUrl', label: 'MCP server URL', type: 'url', required: true },
      { id: 'apiKey', label: 'Optional API key', type: 'password', required: false, secret: true },
    ],
    scopes: [],
    permissions: ['Search/read public pages through configured MCP server', 'No form submission or account actions'],
    riskLevel: 'medium',
    status: 'planned',
    setupInstructions: ['Configure a trusted search MCP server.', 'Review permissions before enabling.', 'Use search/read-only actions first.'],
    testConnectionBehavior: 'mock-only',
    actionsSupported: ['Planned web search', 'Planned source summarization'],
    limitations: ['No browser control or account actions are implemented by this preset.'],
    mockMode: true,
  },
]

export function getConnectorPreset(id: string): ConnectorPreset | undefined {
  return CONNECTOR_PRESETS.find((preset) => preset.id === id)
}

export function getConnectorPresetsByStatus(status: ConnectorPresetStatus): ConnectorPreset[] {
  return CONNECTOR_PRESETS.filter((preset) => preset.status === status)
}

export function validateConnectorPreset(preset: ConnectorPreset): string[] {
  const issues: string[] = []
  if (!preset.id) issues.push('id is required')
  if (!preset.displayName) issues.push('displayName is required')
  if (!preset.neutralIcon) issues.push('neutralIcon is required')
  if (!preset.description) issues.push('description is required')
  if (!preset.setupInstructions.length) issues.push('setupInstructions are required')
  if (!preset.actionsSupported.length) issues.push('actionsSupported are required')
  if (!preset.limitations.length) issues.push('limitations are required')
  if (preset.status === 'planned' && !preset.mockMode) issues.push('planned presets must use mockMode')
  if (preset.id.includes('whatsapp') && !preset.limitations.some((item) => item.toLowerCase().includes('unauthorized'))) {
    issues.push('WhatsApp preset must explicitly reject unauthorized automation')
  }
  return issues
}
