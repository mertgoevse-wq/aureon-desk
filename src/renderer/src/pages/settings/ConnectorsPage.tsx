import React, { useMemo, useState } from 'react'
import {
  AlertTriangle, Calendar, CheckCircle, ChevronRight, Circle, Cpu, Github,
  Globe, HardDrive, Inbox, Info, Mail, MessageCircle, MessageSquare, Monitor,
  Plug, Search, Server, ShieldCheck, Smartphone, Sparkles, TestTube, Wrench
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  CONNECTOR_PRESETS,
  type ConnectorPreset,
  type ConnectorPresetStatus,
  type ConnectorPresetRisk,
} from '@shared/connector-presets'
import {
  SOCIAL_CONNECTOR_PRESETS,
  type SocialActionContract,
  type SocialConnectorPreset,
} from '@shared/social-connectors'
import { Badge, type BadgeVariant } from '../../components/shared/Badge'
import { Button } from '../../components/shared/Button'
import { Drawer } from '../../components/shared/Drawer'
import { Input } from '../../components/shared/Input'
import { Modal } from '../../components/shared/Modal'

const ICONS: Record<string, React.ReactElement> = {
  Calendar: <Calendar size={18} />,
  Cpu: <Cpu size={18} />,
  Github: <Github size={18} />,
  Globe: <Globe size={18} />,
  HardDrive: <HardDrive size={18} />,
  Inbox: <Inbox size={18} />,
  Mail: <Mail size={18} />,
  MessageCircle: <MessageCircle size={18} />,
  MessageSquare: <MessageSquare size={18} />,
  Monitor: <Monitor size={18} />,
  Search: <Search size={18} />,
  Server: <Server size={18} />,
  Smartphone: <Smartphone size={18} />,
  Sparkles: <Sparkles size={18} />,
  Wrench: <Wrench size={18} />,
}

const STATUS_LABELS: Record<ConnectorPresetStatus, string> = {
  available: 'Available',
  planned: 'Planned',
  manual: 'Manual setup',
}

const STATUS_BADGES: Record<ConnectorPresetStatus, BadgeVariant> = {
  available: 'success',
  planned: 'default',
  manual: 'warning',
}

const RISK_BADGES: Record<ConnectorPresetRisk, BadgeVariant> = {
  low: 'success',
  medium: 'warning',
  high: 'error',
}

const FILTERS: Array<'all' | ConnectorPresetStatus> = ['all', 'available', 'manual', 'planned']

export function ConnectorsPage(): React.ReactElement {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | ConnectorPresetStatus>('all')
  const [selectedPreset, setSelectedPreset] = useState<ConnectorPreset | null>(null)
  const [selectedSocialPreset, setSelectedSocialPreset] = useState<SocialConnectorPreset | null>(null)
  const [pendingSocialAction, setPendingSocialAction] = useState<SocialActionContract | null>(null)
  const [testResults, setTestResults] = useState<Record<string, string>>({})

  const visiblePresets = useMemo(() => {
    const q = query.trim().toLowerCase()
    return CONNECTOR_PRESETS.filter((preset) => {
      const matchesFilter = filter === 'all' || preset.status === filter
      const matchesSearch = !q || [
        preset.displayName,
        preset.description,
        preset.authType,
        preset.status,
        ...preset.actionsSupported,
        ...preset.scopes,
      ].some((value) => value.toLowerCase().includes(q))
      return matchesFilter && matchesSearch
    })
  }, [filter, query])

  const visibleSocialPresets = useMemo(() => {
    const q = query.trim().toLowerCase()
    return SOCIAL_CONNECTOR_PRESETS.filter((preset) => {
      if (!q) return true
      return [
        preset.displayName,
        preset.category,
        preset.authType,
        ...preset.capabilities,
        ...preset.requiredScopes,
      ].some((value) => value.toLowerCase().includes(q))
    })
  }, [query])

  const handleTest = (preset: ConnectorPreset) => {
    const messageByBehavior: Record<string, string> = {
      'provider-test': 'Use Providers & Models to run the encrypted provider connection test.',
      'oauth-placeholder': 'OAuth is planned. This preset is shown in mock mode until the consent flow exists.',
      'local-health-check': 'Local endpoint health check is handled through Providers & Models.',
      'mcp-handshake': 'MCP handshake is planned here. Imported servers remain disabled until reviewed.',
      'mock-only': 'Mock mode only. No live service call was made.',
      'manual-review': 'Manual review required before a live connection can be tested.',
    }
    setTestResults((prev) => ({
      ...prev,
      [preset.id]: messageByBehavior[preset.testConnectionBehavior] || 'No live test available.',
    }))
  }

  return (
    <div className="h-full overflow-y-auto bg-[var(--ivory-bg)]" data-testid="connectors-page">
      <div className="max-w-5xl mx-auto px-6 py-7">
        <header className="mb-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[var(--ivory-accent-light)] flex items-center justify-center text-[var(--ivory-accent)]">
                <Plug size={19} />
              </div>
              <div>
                <h1 className="text-[21px] font-bold text-[var(--ivory-text)]">Connector Presets</h1>
                <p className="text-xs text-[var(--ivory-text-3)] mt-1 max-w-2xl leading-relaxed">
                  Configure safe service templates for providers, OAuth apps, local models, MCP servers, phone companion planning, and official API-only messaging placeholders.
                </p>
              </div>
            </div>
            <Badge variant="default" size="md">{CONNECTOR_PRESETS.length} presets</Badge>
          </div>

          <div className="mt-4 p-3 rounded-2xl border border-[var(--ivory-border)]/70 bg-[var(--ivory-elevated)] flex items-start gap-2.5 text-xs text-[var(--ivory-text-2)]">
            <ShieldCheck size={15} className="shrink-0 mt-0.5 text-[var(--ivory-accent)]" />
            <span className="leading-relaxed">
              Tokens are not stored from this catalog drawer. Available providers route to encrypted provider settings; planned services stay in mock mode. WhatsApp is official Business API placeholder only.
            </span>
          </div>
        </header>

        <div className="sticky top-0 z-10 -mx-6 px-6 py-3 bg-[var(--ivory-bg)]/95 backdrop-blur border-y border-[var(--ivory-border)]/50 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[220px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ivory-text-3)]" />
              <Input
                placeholder="Search connector presets..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="pl-9"
                data-testid="connector-preset-search"
              />
            </div>
            <div className="flex items-center gap-1 p-1 rounded-2xl bg-[var(--ivory-surface)] border border-[var(--ivory-border)]/60">
              {FILTERS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFilter(item)}
                  className={`h-8 px-3 rounded-xl text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/30 ${
                    filter === item
                      ? 'bg-[var(--ivory-elevated)] text-[var(--ivory-text)] shadow-[var(--shadow-xs)]'
                      : 'text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)]'
                  }`}
                  data-testid={`connector-filter-${item}`}
                >
                  {item === 'all' ? 'All' : STATUS_LABELS[item]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {visiblePresets.map((preset) => {
            const testResult = testResults[preset.id]
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => setSelectedPreset(preset)}
                className="group text-left rounded-2xl border border-[var(--ivory-border)]/70 bg-[var(--ivory-elevated)] p-4 hover:border-[var(--ivory-accent)]/25 hover:shadow-[var(--shadow-md)] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/30"
                data-testid={`connector-preset-${preset.id}`}
              >
                <div className="flex items-start gap-3">
                  <PresetIcon preset={preset} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-[14px] font-semibold text-[var(--ivory-text)]">{preset.displayName}</h2>
                      <Badge variant={STATUS_BADGES[preset.status]}>{STATUS_LABELS[preset.status]}</Badge>
                      <Badge variant={RISK_BADGES[preset.riskLevel]}>{preset.riskLevel} risk</Badge>
                      {preset.mockMode && <Badge variant="default">Mock</Badge>}
                    </div>
                    <p className="text-xs text-[var(--ivory-text-3)] mt-1 leading-relaxed line-clamp-2">{preset.description}</p>
                    <div className="flex items-center gap-1.5 flex-wrap mt-3">
                      {preset.actionsSupported.slice(0, 3).map((action) => (
                        <span key={action} className="px-2 py-1 rounded-full text-[10px] font-medium bg-[var(--ivory-surface)] text-[var(--ivory-text-2)] border border-[var(--ivory-border)]/50">
                          {action}
                        </span>
                      ))}
                    </div>
                    {testResult && (
                      <p className="mt-3 text-[11px] text-[var(--ivory-text-2)] bg-[var(--ivory-surface)] rounded-xl px-3 py-2">
                        {testResult}
                      </p>
                    )}
                  </div>
                  <ChevronRight size={16} className="mt-1 text-[var(--ivory-text-3)] group-hover:text-[var(--ivory-accent)] transition-colors" />
                </div>
              </button>
            )
          })}
        </div>

        {visiblePresets.length === 0 && (
          <div className="py-16 text-center">
            <Circle size={28} className="mx-auto text-[var(--ivory-text-3)] mb-3" />
            <p className="text-sm font-semibold text-[var(--ivory-text)]">No presets match your search</p>
            <p className="text-xs text-[var(--ivory-text-3)] mt-1">Try a provider name, auth type, or action.</p>
          </div>
        )}

        <section className="mt-8" data-testid="social-connectors-section">
          <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
            <div>
              <h2 className="text-[17px] font-bold text-[var(--ivory-text)]">Social Connectors</h2>
              <p className="text-xs text-[var(--ivory-text-3)] mt-1 leading-relaxed">
                Official API/OAuth presets for social agents. Drafting and analytics can be prepared safely; posting, replying, deleting, and uploading require explicit confirmation.
              </p>
            </div>
            <Badge variant="default" size="md">{SOCIAL_CONNECTOR_PRESETS.length} social presets</Badge>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {visibleSocialPresets.map((preset) => (
              <SocialPresetCard
                key={preset.id}
                preset={preset}
                testResult={testResults[preset.id]}
                onOpen={() => setSelectedSocialPreset(preset)}
              />
            ))}
          </div>
        </section>
      </div>

      <Drawer
        isOpen={Boolean(selectedPreset)}
        onClose={() => setSelectedPreset(null)}
        title={selectedPreset ? selectedPreset.displayName : 'Connector preset'}
        width="max-w-[520px]"
      >
        {selectedPreset && (
          <PresetDrawer
            preset={selectedPreset}
            testResult={testResults[selectedPreset.id]}
            onTest={() => handleTest(selectedPreset)}
            onConfigure={() => selectedPreset.setupPath ? navigate(selectedPreset.setupPath) : undefined}
          />
        )}
      </Drawer>

      <Drawer
        isOpen={Boolean(selectedSocialPreset)}
        onClose={() => setSelectedSocialPreset(null)}
        title={selectedSocialPreset ? selectedSocialPreset.displayName : 'Social connector'}
        width="max-w-[560px]"
      >
        {selectedSocialPreset && (
          <SocialPresetDrawer
            preset={selectedSocialPreset}
            testResult={testResults[selectedSocialPreset.id]}
            onTest={() => {
              setTestResults((prev) => ({
                ...prev,
                [selectedSocialPreset.id]: selectedSocialPreset.testConnectionAction,
              }))
            }}
            onDraftAction={(action) => setPendingSocialAction(action)}
          />
        )}
      </Drawer>

      <Modal
        isOpen={Boolean(pendingSocialAction)}
        onClose={() => setPendingSocialAction(null)}
        title="Confirm social action"
        size="sm"
      >
        {pendingSocialAction && (
          <div className="space-y-3" data-testid="social-action-confirmation-modal">
            <div className="rounded-2xl border border-[var(--ivory-warning)]/20 bg-[var(--ivory-warning-bg)] p-3 text-xs text-[var(--ivory-warning)] leading-relaxed">
              This is a confirmation preview only. Live posting, replying, deleting, or uploading must show the exact content and support cancel before execution.
            </div>
            <div className="rounded-2xl border border-[var(--ivory-border)] bg-[var(--ivory-surface)] p-3">
              <p className="text-sm font-semibold text-[var(--ivory-text)]">{pendingSocialAction.label}</p>
              <p className="text-xs text-[var(--ivory-text-3)] mt-1 leading-relaxed">{pendingSocialAction.description}</p>
              <p className="text-[11px] text-[var(--ivory-text-2)] mt-3">
                Exact content preview: <span className="font-semibold">Draft text would be shown here before any live action.</span>
              </p>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <Button variant="secondary" size="sm" onClick={() => setPendingSocialAction(null)}>Cancel</Button>
              <Button variant="danger" size="sm" onClick={() => setPendingSocialAction(null)} data-testid="social-confirm-action-button">
                Preview only
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function PresetIcon({ preset }: { preset: ConnectorPreset }): React.ReactElement {
  return (
    <div
      className="w-10 h-10 rounded-2xl bg-[var(--ivory-accent-light)] text-[var(--ivory-accent)] border border-[var(--ivory-accent)]/10 flex items-center justify-center shrink-0"
      data-testid={`connector-preset-icon-${preset.id}`}
      aria-label={`${preset.displayName} neutral icon`}
    >
      {ICONS[preset.neutralIcon] || <Plug size={18} />}
    </div>
  )
}

function PresetDrawer({
  preset,
  testResult,
  onTest,
  onConfigure,
}: {
  preset: ConnectorPreset
  testResult?: string
  onTest: () => void
  onConfigure: () => void
}): React.ReactElement {
  return (
    <div className="space-y-5" data-testid="connector-config-drawer">
      <div className="flex items-start gap-3">
        <PresetIcon preset={preset} />
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant={STATUS_BADGES[preset.status]}>{STATUS_LABELS[preset.status]}</Badge>
            <Badge variant={RISK_BADGES[preset.riskLevel]}>{preset.riskLevel} risk</Badge>
            <Badge variant="default">{preset.authType.replace(/_/g, ' ')}</Badge>
          </div>
          <p className="text-xs text-[var(--ivory-text-3)] mt-2 leading-relaxed">{preset.description}</p>
        </div>
      </div>

      <SafetyPanel preset={preset} />

      <Section title="Required fields">
        <div className="space-y-2">
          {preset.requiredFields.map((field) => (
            <Input
              key={field.id}
              label={`${field.label}${field.required ? ' *' : ''}`}
              type={field.type === 'password' ? 'password' : field.type === 'url' ? 'url' : 'text'}
              placeholder={field.placeholder || field.label}
              defaultValue=""
              disabled={preset.status === 'planned'}
              data-testid={`connector-field-${field.id}`}
            />
          ))}
          {preset.requiredFields.length === 0 && (
            <p className="text-xs text-[var(--ivory-text-3)]">No fields required.</p>
          )}
          <p className="text-[11px] text-[var(--ivory-text-3)] leading-relaxed">
            This drawer previews the setup contract only. Secrets entered here are not persisted; use the linked settings page for encrypted storage.
          </p>
        </div>
      </Section>

      <Section title="Scopes & permissions">
        <TagList items={preset.scopes.length ? preset.scopes : ['No OAuth scopes']} />
        <ul className="mt-3 space-y-1.5">
          {preset.permissions.map((permission) => (
            <li key={permission} className="flex items-start gap-2 text-xs text-[var(--ivory-text-2)] leading-relaxed">
              <ShieldCheck size={12} className="shrink-0 mt-0.5 text-[var(--ivory-accent)]" />
              {permission}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Setup instructions">
        <ol className="space-y-1.5">
          {preset.setupInstructions.map((step, index) => (
            <li key={step} className="flex gap-2 text-xs text-[var(--ivory-text-2)] leading-relaxed">
              <span className="w-5 h-5 rounded-full bg-[var(--ivory-surface)] border border-[var(--ivory-border)] flex items-center justify-center text-[10px] font-bold shrink-0">{index + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Actions supported">
        <TagList items={preset.actionsSupported} />
      </Section>

      <Section title="Limitations">
        <ul className="space-y-1.5">
          {preset.limitations.map((item) => (
            <li key={item} className="flex items-start gap-2 text-xs text-[var(--ivory-text-2)] leading-relaxed">
              <AlertTriangle size={12} className="shrink-0 mt-0.5 text-[var(--ivory-warning)]" />
              {item}
            </li>
          ))}
        </ul>
      </Section>

      {testResult && (
        <div className="rounded-2xl border border-[var(--ivory-border)] bg-[var(--ivory-surface)] p-3 text-xs text-[var(--ivory-text-2)] leading-relaxed" data-testid="connector-test-result">
          <CheckCircle size={13} className="inline mr-1 text-[var(--ivory-success)]" />
          {testResult}
        </div>
      )}

      <div className="flex items-center gap-2 pt-2 border-t border-[var(--ivory-border)]/60">
        <Button size="sm" onClick={onTest} variant={preset.status === 'available' ? 'primary' : 'secondary'} data-testid="connector-test-button">
          <TestTube size={13} /> Test connection
        </Button>
        {preset.setupPath && (
          <Button size="sm" variant="secondary" onClick={onConfigure}>
            <Wrench size={13} /> Open settings
          </Button>
        )}
      </div>
    </div>
  )
}

function SocialPresetCard({
  preset,
  testResult,
  onOpen,
}: {
  preset: SocialConnectorPreset
  testResult?: string
  onOpen: () => void
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group text-left rounded-2xl border border-[var(--ivory-border)]/70 bg-[var(--ivory-elevated)] p-4 hover:border-[var(--ivory-accent)]/25 hover:shadow-[var(--shadow-md)] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/30"
      data-testid={`social-connector-${preset.id}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl bg-[var(--ivory-surface)] text-[var(--ivory-accent)] border border-[var(--ivory-border)] flex items-center justify-center shrink-0">
          {ICONS[preset.neutralIcon] || <Plug size={18} />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[14px] font-semibold text-[var(--ivory-text)]">{preset.displayName}</h3>
            <Badge variant="warning">{preset.authType}</Badge>
            <Badge variant={RISK_BADGES[preset.riskLevel]}>{preset.riskLevel} risk</Badge>
          </div>
          <p className="text-xs text-[var(--ivory-text-3)] mt-1 leading-relaxed line-clamp-2">
            {preset.capabilities.slice(0, 3).join(', ')}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {preset.requiredScopes.slice(0, 3).map((scope) => (
              <span key={scope} className="px-2 py-1 rounded-full text-[10px] font-medium bg-[var(--ivory-surface)] text-[var(--ivory-text-2)] border border-[var(--ivory-border)]/50">
                {scope}
              </span>
            ))}
          </div>
          {testResult && (
            <p className="mt-3 text-[11px] text-[var(--ivory-text-2)] bg-[var(--ivory-surface)] rounded-xl px-3 py-2">
              {testResult}
            </p>
          )}
        </div>
        <ChevronRight size={16} className="mt-1 text-[var(--ivory-text-3)] group-hover:text-[var(--ivory-accent)] transition-colors" />
      </div>
    </button>
  )
}

function SocialPresetDrawer({
  preset,
  testResult,
  onTest,
  onDraftAction,
}: {
  preset: SocialConnectorPreset
  testResult?: string
  onTest: () => void
  onDraftAction: (action: SocialActionContract) => void
}): React.ReactElement {
  return (
    <div className="space-y-5" data-testid="social-config-drawer">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl bg-[var(--ivory-surface)] text-[var(--ivory-accent)] border border-[var(--ivory-border)] flex items-center justify-center shrink-0">
          {ICONS[preset.neutralIcon] || <Plug size={18} />}
        </div>
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant="warning">{preset.authType}</Badge>
            <Badge variant={RISK_BADGES[preset.riskLevel]}>{preset.riskLevel} risk</Badge>
            <Badge variant="default">{preset.category}</Badge>
          </div>
          <p className="text-xs text-[var(--ivory-text-3)] mt-2 leading-relaxed">
            Official docs: {preset.officialDocsUrl}
          </p>
        </div>
      </div>

      <Notice tone="warning" title="Confirmation required for live actions">
        Posting, replying, deleting, and uploading must show exact content and support cancel. This build only previews the action contract.
      </Notice>

      {preset.accountRequirement && (
        <Notice tone="default" title="Account requirement">
          {preset.accountRequirement}
        </Notice>
      )}

      <Section title="Required permissions">
        <TagList items={preset.requiredScopes} />
      </Section>

      <Section title="What this can do">
        <TagList items={preset.capabilities} />
      </Section>

      <Section title="What this cannot do">
        <ul className="space-y-1.5">
          {preset.limitations.map((item) => (
            <li key={item} className="flex items-start gap-2 text-xs text-[var(--ivory-text-2)] leading-relaxed">
              <AlertTriangle size={12} className="shrink-0 mt-0.5 text-[var(--ivory-warning)]" />
              {item}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Safe agent actions">
        <div className="space-y-2">
          {preset.safeActions.slice(0, 8).map((action) => (
            <div key={action.id} className="rounded-2xl border border-[var(--ivory-border)] bg-[var(--ivory-surface)] p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-[var(--ivory-text)]">{action.label}</p>
                  <p className="text-[11px] text-[var(--ivory-text-3)] mt-0.5 leading-relaxed">{action.description}</p>
                </div>
                {action.id.includes('draft') && (
                  <Button size="sm" variant="secondary" onClick={() => onDraftAction(action)} data-testid="social-draft-action">
                    Draft
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Confirmation-only actions">
        <div className="space-y-2">
          {preset.destructiveActions.map((action) => (
            <div key={action.id} className="rounded-2xl border border-[var(--ivory-warning)]/20 bg-[var(--ivory-warning-bg)] p-3">
              <p className="text-xs font-semibold text-[var(--ivory-warning)]">{action.label}</p>
              <p className="text-[11px] text-[var(--ivory-warning)]/90 mt-0.5 leading-relaxed">
                {action.description} Exact content preview, explicit confirmation, and cancel are required.
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Setup steps">
        <ol className="space-y-1.5">
          {preset.setupSteps.map((step, index) => (
            <li key={step} className="flex gap-2 text-xs text-[var(--ivory-text-2)] leading-relaxed">
              <span className="w-5 h-5 rounded-full bg-[var(--ivory-surface)] border border-[var(--ivory-border)] flex items-center justify-center text-[10px] font-bold shrink-0">{index + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </Section>

      {testResult && (
        <div className="rounded-2xl border border-[var(--ivory-border)] bg-[var(--ivory-surface)] p-3 text-xs text-[var(--ivory-text-2)] leading-relaxed" data-testid="social-test-result">
          <CheckCircle size={13} className="inline mr-1 text-[var(--ivory-success)]" />
          {testResult}
        </div>
      )}

      <div className="flex items-center gap-2 pt-2 border-t border-[var(--ivory-border)]/60">
        <Button size="sm" onClick={onTest} data-testid="social-test-button">
          <TestTube size={13} /> Test connection
        </Button>
        <Button size="sm" variant="secondary" disabled>
          <Wrench size={13} /> Configure
        </Button>
        <Button size="sm" variant="secondary" disabled>
          Disconnect
        </Button>
      </div>
    </div>
  )
}

function SafetyPanel({ preset }: { preset: ConnectorPreset }): React.ReactElement {
  if (preset.id === 'whatsapp_business_api') {
    return (
      <Notice tone="warning" title="Official API only">
        This preset does not automate WhatsApp Web, phone screens, or personal accounts. It is a placeholder for the official WhatsApp Business API.
      </Notice>
    )
  }
  if (preset.id === 'phone_companion') {
    return (
      <Notice tone="default" title="Planned companion">
        Phone control requires a future companion app, local pairing, and explicit device permissions. No phone/account control is active now.
      </Notice>
    )
  }
  if (preset.id === 'gmail_oauth') {
    return (
      <Notice tone="warning" title="OAuth approval required">
        Gmail read/draft/send actions require Google OAuth scopes. Sending or modifying mail requires explicit user confirmation.
      </Notice>
    )
  }
  return (
    <Notice tone={preset.riskLevel === 'high' ? 'warning' : 'default'} title={preset.mockMode ? 'Mock mode' : 'Safe setup'}>
      {preset.mockMode
        ? 'This preset documents the setup contract and does not call the live service yet.'
        : 'Use the linked settings area for encrypted storage and live connection tests.'}
    </Notice>
  )
}

function Notice({ title, children, tone }: { title: string; children: React.ReactNode; tone: 'default' | 'warning' }): React.ReactElement {
  return (
    <div className={`rounded-2xl border p-3 text-xs leading-relaxed ${
      tone === 'warning'
        ? 'bg-[var(--ivory-warning-bg)] border-[var(--ivory-warning)]/20 text-[var(--ivory-warning)]'
        : 'bg-[var(--ivory-surface)] border-[var(--ivory-border)] text-[var(--ivory-text-2)]'
    }`}>
      <div className="flex items-center gap-2 font-semibold mb-1">
        <Info size={13} />
        {title}
      </div>
      {children}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }): React.ReactElement {
  return (
    <section>
      <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--ivory-text-3)] mb-2">{title}</h3>
      {children}
    </section>
  )
}

function TagList({ items }: { items: string[] }): React.ReactElement {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span key={item} className="px-2 py-1 rounded-full text-[10px] font-medium bg-[var(--ivory-surface)] text-[var(--ivory-text-2)] border border-[var(--ivory-border)]/50">
          {item}
        </span>
      ))}
    </div>
  )
}
