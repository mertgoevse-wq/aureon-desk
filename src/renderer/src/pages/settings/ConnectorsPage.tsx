import React, { useState, useCallback, useEffect } from 'react'
import {
  Wrench, Github, HardDrive, Mail, Calendar,
  Smartphone, Plug, Globe, Cpu, ShieldCheck, AlertTriangle,
  CheckCircle, Circle, RefreshCw, Server,
  ChevronRight, WifiOff, TestTube, Info, Trash2, Clock
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useIpc } from '../../hooks/useIpc'
import type { ConnectorType, ConnectorStatus, CapabilityId } from '@shared/types/studio-core'

// ---- Connector definitions ----
interface ConnectorCard {
  type: ConnectorType
  name: string
  description: string
  icon: React.ReactElement
  authType: 'api_key' | 'oauth' | 'none' | 'local'
  capabilities: CapabilityId[]
  permissionScopes: string[]
  riskNotes: string
  setupPath?: string // settings path for configuration
  status: ConnectorStatus
}

function createConnectorCards(providerStatuses: Record<string, boolean>): ConnectorCard[] {
  const hasApiKey = (slug: string) => providerStatuses[slug] || false

  return [
    {
      type: 'openai',
      name: 'OpenAI / ChatGPT API',
      description: 'GPT models for text, code, vision, and audio. API access only — no browser automation.',
      icon: <Cpu size={20} />,
      authType: 'api_key',
      capabilities: ['text_generation', 'code_generation', 'image_understanding', 'speech_to_text', 'text_to_speech', 'image_generation'],
      permissionScopes: ['Text generation', 'Code generation', 'Image analysis', 'Speech processing', 'Image generation (DALL-E)'],
      riskNotes: 'Files and prompts are sent to OpenAI servers. Never share sensitive data. API key stored encrypted.',
      setupPath: '/settings/providers',
      status: hasApiKey('openai') ? 'connected' : 'not_connected',
    },
    {
      type: 'google_gemini',
      name: 'Google Gemini',
      description: 'Gemini models for text, code, vision, audio, and video. Direct API access.',
      icon: <Globe size={20} />,
      authType: 'api_key',
      capabilities: ['text_generation', 'code_generation', 'image_understanding', 'video_understanding', 'audio_understanding'],
      permissionScopes: ['Text generation', 'Code generation', 'Image & video analysis', 'Audio processing'],
      riskNotes: 'Files and prompts are sent to Google servers. Never share sensitive data. API key stored encrypted.',
      setupPath: '/settings/providers',
      status: hasApiKey('google') ? 'connected' : 'not_connected',
    },
    {
      type: 'google_ai_studio',
      name: 'Google AI Studio',
      description: 'Google AI Studio Gemini API access. Free tier available for prototyping.',
      icon: <Globe size={20} />,
      authType: 'api_key',
      capabilities: ['text_generation', 'code_generation', 'image_understanding', 'video_understanding'],
      permissionScopes: ['Text generation', 'Code generation', 'Image & video analysis'],
      riskNotes: 'Same as Google Gemini — files and prompts sent to Google servers.',
      setupPath: '/settings/providers',
      status: hasApiKey('google') ? 'connected' : 'not_connected',
    },
    {
      type: 'gmail',
      name: 'Gmail',
      description: 'Read inbox, search emails, create drafts, and send (only after confirmation).',
      icon: <Mail size={20} />,
      authType: 'oauth',
      capabilities: ['gmail_read', 'gmail_draft', 'gmail_send'],
      permissionScopes: ['Read inbox summary', 'Search emails', 'Create drafts', 'Send emails (confirmation required)'],
      riskNotes: 'OAuth-based access. Every send requires explicit confirmation. Tokens stored encrypted. Minimal scopes only.',
      setupPath: '/settings/connectors',
      status: 'needs_setup',
    },
    {
      type: 'google_drive',
      name: 'Google Drive',
      description: 'Read, create, and manage files in Google Drive.',
      icon: <HardDrive size={20} />,
      authType: 'oauth',
      capabilities: ['google_drive'],
      permissionScopes: ['Read files', 'Create files', 'Manage files'],
      riskNotes: 'OAuth-based access. File operations require confirmation. Placeholder — full implementation planned.',
      setupPath: '/settings/connectors',
      status: 'needs_setup',
    },
    {
      type: 'google_calendar',
      name: 'Google Calendar',
      description: 'View, create, and manage calendar events.',
      icon: <Calendar size={20} />,
      authType: 'oauth',
      capabilities: ['google_calendar'],
      permissionScopes: ['Read calendar', 'Create events', 'Manage events'],
      riskNotes: 'OAuth-based access. Calendar changes require confirmation. Placeholder — full implementation planned.',
      setupPath: '/settings/connectors',
      status: 'needs_setup',
    },
    {
      type: 'github',
      name: 'GitHub',
      description: 'Import repos, manage issues, create PRs. Already partially integrated.',
      icon: <Github size={20} />,
      authType: 'oauth',
      capabilities: ['github'],
      permissionScopes: ['Read repos', 'Import repos', 'Create PRs', 'Manage issues'],
      riskNotes: 'GitHub import is already built. OAuth for push/PR actions coming soon.',
      setupPath: '/settings/github',
      status: 'needs_setup',
    },
    {
      type: 'openrouter',
      name: 'OpenRouter',
      description: 'Multi-provider routing. Access many models with one API key. Free tier available.',
      icon: <Server size={20} />,
      authType: 'api_key',
      capabilities: ['text_generation', 'code_generation', 'image_understanding'],
      permissionScopes: ['Text generation', 'Code generation', 'Multi-model routing'],
      riskNotes: 'Prompts routed through OpenRouter to model providers. Check their privacy policy. API key stored encrypted.',
      setupPath: '/settings/providers',
      status: hasApiKey('openrouter') ? 'connected' : 'not_connected',
    },
    {
      type: 'ollama',
      name: 'Ollama',
      description: 'Run models locally on your machine. Fully private — no data leaves your computer.',
      icon: <Cpu size={20} />,
      authType: 'local',
      capabilities: ['text_generation', 'code_generation'],
      permissionScopes: ['Text generation', 'Code generation (local only)'],
      riskNotes: 'Runs entirely on your machine. No data leaves your computer. Perfect for private/background tasks.',
      setupPath: '/settings/providers',
      status: 'connected',
    },
    {
      type: 'lm_studio',
      name: 'LM Studio',
      description: 'Run models locally via LM Studio. Fully private — no data leaves your computer.',
      icon: <Cpu size={20} />,
      authType: 'local',
      capabilities: ['text_generation', 'code_generation'],
      permissionScopes: ['Text generation', 'Code generation (local only)'],
      riskNotes: 'Runs entirely on your machine. No data leaves your computer. Requires LM Studio running with a loaded model.',
      setupPath: '/settings/providers',
      status: 'connected',
    },
    {
      type: 'mcp_server',
      name: 'MCP Servers',
      description: 'Model Context Protocol tools — file search, git status, project summaries.',
      icon: <Wrench size={20} />,
      authType: 'none',
      capabilities: ['mcp_tools'],
      permissionScopes: ['File search', 'Git status', 'Project summaries'],
      riskNotes: 'MCP tools can be destructive. Each tool call passes through the safety gate. Untrusted tools are disabled by default.',
      setupPath: '/tools',
      status: 'connected',
    },
    {
      type: 'phone_companion',
      name: 'Phone Companion',
      description: 'Connect your phone for notifications, camera upload, and remote actions.',
      icon: <Smartphone size={20} />,
      authType: 'local',
      capabilities: [],
      permissionScopes: ['Notifications', 'Camera upload', 'Remote actions (planned)'],
      riskNotes: 'Currently in planning stage. Local network pairing only. No cloud relay. All data stays on your local network.',
      setupPath: '/settings/connectors',
      status: 'planned',
    },
  ]
}

const STATUS_CONFIG: Record<string, { icon: React.ReactElement; label: string; className: string }> = {
  connected: { icon: <CheckCircle size={12} />, label: 'Connected', className: 'text-emerald-600 bg-emerald-50' },
  not_connected: { icon: <Circle size={12} />, label: 'Not connected', className: 'text-[var(--ivory-text-3)] bg-[var(--ivory-surface-2)]' },
  needs_setup: { icon: <WifiOff size={12} />, label: 'Needs setup', className: 'text-amber-600 bg-amber-50' },
  error: { icon: <AlertTriangle size={12} />, label: 'Error', className: 'text-red-600 bg-red-50' },
  planned: { icon: <Clock size={12} />, label: 'Planned', className: 'text-blue-600 bg-blue-50' },
}

export function ConnectorsPage(): React.ReactElement {
  const navigate = useNavigate()
  const api = useIpc()
  const [providerStatuses, setProviderStatuses] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string } | null>>({})
  const [expandedCard, setExpandedCard] = useState<string | null>(null)

  useEffect(() => {
    // Check which providers have API keys configured
    const checkProviders = async () => {
      try {
        const providers = await api.providerList()
        const statuses: Record<string, boolean> = {}
        for (const p of providers) {
          const hasKey = await api.providerHasApiKey(p.id)
          statuses[p.slug] = hasKey
        }
        setProviderStatuses(statuses)
      } catch {
        // Silently fallback
      } finally {
        setLoading(false)
      }
    }
    checkProviders()
  }, [])

  const cards = createConnectorCards(providerStatuses)

  const handleConfigure = (card: ConnectorCard) => {
    if (card.setupPath) {
      navigate(card.setupPath)
    }
  }

  const handleTest = async (card: ConnectorCard) => {
    // For API key providers, test connection through provider service
    if (card.authType === 'api_key') {
      try {
        const providers = await api.providerList()
        const provider = providers.find((p: { slug: string }) => p.slug === card.type)
        if (provider) {
          const result = await api.providerTestConnection(provider.id)
          setTestResults(prev => ({ ...prev, [card.type]: result }))
        }
      } catch {
        setTestResults(prev => ({ ...prev, [card.type]: { success: false, message: 'Test failed' } }))
      }
    }
  }

  const handleDisconnect = async (card: ConnectorCard) => {
    if (card.authType === 'api_key') {
      try {
        const providers = await api.providerList()
        const provider = providers.find((p: { slug: string }) => p.slug === card.type)
        if (provider) {
          await api.providerDeleteApiKey(provider.id)
          // Refresh provider statuses
          const hasKey = await api.providerHasApiKey(provider.id)
          setProviderStatuses(prev => ({ ...prev, [card.type]: hasKey }))
        }
      } catch {
        // Silently fallback
      }
    }
  }

  const toggleExpand = (type: string) => {
    setExpandedCard(expandedCard === type ? null : type)
  }

  return (
    <div className="h-full overflow-y-auto bg-[var(--ivory-bg)]" data-testid="connectors-page">
      <div className="max-w-3xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--ivory-accent-light)] flex items-center justify-center">
              <Plug size={18} className="text-[var(--ivory-accent)]" />
            </div>
            <div>
              <h1 className="text-[20px] font-bold text-[var(--ivory-text)]">Connectors</h1>
              <p className="text-[11px] text-[var(--ivory-text-3)]">
                Manage connections to external services and apps
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl border border-[var(--ivory-border)]/60 bg-[var(--ivory-elevated)] text-[11px] text-[var(--ivory-text-2)]">
            <Info size={13} className="shrink-0 text-[var(--ivory-accent)]" />
            <span>
              Connectors use neutral icons + text labels. No fake brand logos.
              Official brand assets only used if licensed. See{' '}
              <span className="font-semibold">BRAND_AND_VENDOR_LOGO_POLICY.md</span>.
            </span>
          </div>
        </div>

        {/* Connector Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-[var(--ivory-text-3)]">
            <RefreshCw size={20} className="animate-spin mr-2" />
            Checking connector status...
          </div>
        ) : (
          <div className="space-y-2">
            {cards.map(card => {
              const isExpanded = expandedCard === card.type
              const status = STATUS_CONFIG[card.status]
              const testResult = testResults[card.type]
              return (
                <div
                  key={card.type}
                  data-testid={`connector-${card.type}`}
                  className={`rounded-2xl border transition-all duration-150
                    ${isExpanded
                      ? 'border-[var(--ivory-accent)]/25 bg-[var(--ivory-elevated)] shadow-[var(--shadow-md)]'
                      : 'border-[var(--ivory-border)]/60 bg-[var(--ivory-elevated)] hover:border-[var(--ivory-accent)]/15 hover:shadow-[var(--shadow-sm)]'
                    }`}
                >
                  {/* Card header */}
                  <button
                    type="button"
                    onClick={() => toggleExpand(card.type)}
                    className="w-full flex items-center gap-3 p-3.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/30 rounded-2xl"
                  >
                    <div className="w-9 h-9 rounded-xl bg-[var(--ivory-accent-light)] flex items-center justify-center shrink-0 text-[var(--ivory-accent)]">
                      {card.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-[var(--ivory-text)]">{card.name}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${status.className}`}>
                          {status.icon}
                          {status.label}
                        </span>
                      </div>
                      <p className="text-[10px] text-[var(--ivory-text-3)] mt-0.5 truncate">{card.description}</p>
                    </div>
                    <ChevronRight size={14} className={`text-[var(--ivory-text-3)] transition-transform shrink-0 ${isExpanded ? 'rotate-90' : ''}`} />
                  </button>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="px-3.5 pb-3.5 border-t border-[var(--ivory-border)]/40 animate-fade-in">
                      <div className="mt-3 space-y-2.5">
                        {/* Auth type */}
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--ivory-text-3)]">Auth Type</span>
                          <p className="text-[11px] text-[var(--ivory-text)] mt-0.5">
                            {card.authType === 'api_key' && 'API Key (encrypted storage)'}
                            {card.authType === 'oauth' && 'OAuth 2.0 (token stored encrypted)'}
                            {card.authType === 'none' && 'No authentication required'}
                            {card.authType === 'local' && 'Local — no remote connection'}
                          </p>
                        </div>

                        {/* Capabilities */}
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--ivory-text-3)]">Capabilities</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {card.capabilities.map(cap => (
                              <span key={cap} className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-[var(--ivory-surface-2)] text-[var(--ivory-text-2)]">
                                {cap.replace(/_/g, ' ')}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Permission scopes */}
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--ivory-text-3)]">Permission Scopes</span>
                          <ul className="mt-1 space-y-0.5">
                            {card.permissionScopes.map(scope => (
                              <li key={scope} className="flex items-center gap-1.5 text-[10px] text-[var(--ivory-text-2)]">
                                <ShieldCheck size={10} className="text-[var(--ivory-accent)] shrink-0" />
                                {scope}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Risk notes */}
                        <div className="flex items-start gap-1.5 p-2 rounded-lg bg-amber-50/60 border border-amber-200/50">
                          <AlertTriangle size={11} className="shrink-0 mt-0.5 text-amber-600" />
                          <p className="text-[10px] text-amber-800 leading-relaxed">{card.riskNotes}</p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-1 flex-wrap">
                          {card.setupPath && (
                            <button
                              type="button"
                              onClick={() => handleConfigure(card)}
                              className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-xl bg-[var(--ivory-accent)] text-white text-[11px] font-semibold hover:bg-[var(--ivory-accent-hover)] transition-colors shadow-[var(--shadow-sm)]"
                            >
                              <Wrench size={12} />
                              Configure
                            </button>
                          )}
                          {card.authType === 'api_key' && card.status === 'connected' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleTest(card)}
                                className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-xl border border-[var(--ivory-border)] bg-[var(--ivory-bg)] text-[var(--ivory-text-2)] text-[11px] font-semibold hover:bg-[var(--ivory-surface)] transition-colors"
                              >
                                <TestTube size={12} />
                                Test
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDisconnect(card)}
                                className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-xl border border-red-200 bg-red-50 text-red-600 text-[11px] font-semibold hover:bg-red-100 transition-colors"
                              >
                                <Trash2 size={12} />
                                Disconnect
                              </button>
                            </>
                          )}
                        </div>

                        {/* Test result feedback */}
                        {testResult && (
                          <div className={`p-2 rounded-lg text-[10px] ${testResult.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                            {testResult.success ? `✅ ${testResult.message}` : `❌ ${testResult.message}`}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Footer notes */}
        <div className="mt-8 p-4 rounded-2xl border border-[var(--ivory-border)]/60 bg-[var(--ivory-elevated)]">
          <div className="flex items-start gap-2.5">
            <ShieldCheck size={15} className="shrink-0 mt-0.5 text-[var(--ivory-accent)]" />
            <div>
              <h3 className="text-[12px] font-bold text-[var(--ivory-text)]">Logo & Brand Policy</h3>
              <p className="text-[10px] text-[var(--ivory-text-3)] mt-0.5 leading-relaxed">
                Aureon uses neutral Lucide icons with text labels for all connectors.
                No fake brand logos or lookalikes. Official vendor assets are only used if
                properly licensed and stored in <code className="text-[10px] bg-[var(--ivory-surface-2)] px-1 rounded">assets/vendor/</code> with attribution.
                This page renders correctly without any brand image dependencies.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
