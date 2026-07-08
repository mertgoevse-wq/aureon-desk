import { useEffect, useCallback, useState } from 'react'
import {
  Eye, EyeOff, Trash2, Check, AlertTriangle, Plus,
  Wifi, Zap, Server, Monitor, Globe, Star, X, Wrench,
  Activity, Clock
} from 'lucide-react'
import { Button } from '../../components/shared/Button'
import { Input } from '../../components/shared/Input'
import { Toggle } from '../../components/shared/Toggle'
import { Badge } from '../../components/shared/Badge'
import { Card } from '../../components/shared/Card'
import { showToast } from '../../components/shared/Toast'
import { useIpc } from '../../hooks/useIpc'
import { useProviderStore } from '../../stores/providerStore'
import type { ProviderAdapterInfo, ProviderCapability } from '@shared/types/provider'

const CAPABILITY_LABELS: Record<ProviderCapability, { label: string; icon: React.ReactElement }> = {
  text: { label: 'Text', icon: <Zap size={10} /> },
  vision: { label: 'Vision', icon: <Eye size={10} /> },
  tool_use: { label: 'Tool Use', icon: <Wrench size={10} /> },
  streaming: { label: 'Streaming', icon: <Wifi size={10} /> },
  json_mode: { label: 'JSON', icon: <Server size={10} /> },
  embeddings: { label: 'Embeddings', icon: <Globe size={10} /> },
  local: { label: 'Local', icon: <Monitor size={10} /> },
}

interface ProviderTestResult {
  success: boolean
  message: string
  latencyMs: number
  checkedAt: string
}

function sanitizeTestMessage(message: string): string {
  return message
    .replace(/sk-[A-Za-z0-9_-]{12,}/g, '[REDACTED_KEY]')
    .replace(/AIza[A-Za-z0-9_-]{12,}/g, '[REDACTED_GOOGLE_KEY]')
    .replace(/Bearer\s+[A-Za-z0-9._-]{12,}/gi, 'Bearer [REDACTED]')
    .replace(/(x-api-key|api[_-]?key)\s*[:=]\s*[A-Za-z0-9._-]{8,}/gi, '$1=[REDACTED]')
}

export function ProvidersPage(): React.ReactElement {
  const api = useIpc()
  const { providers, adapters, isLoading, setProviders, setAdapters, updateProvider } = useProviderStore()
  const [editingKey, setEditingKey] = useState<Record<string, string>>({})
  const [showKey, setShowKey] = useState<Record<string, boolean>>({})
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [keyStatus, setKeyStatus] = useState<Record<string, boolean>>({})
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string } | null>>({})
  const [testCenterResults, setTestCenterResults] = useState<Record<string, ProviderTestResult>>({})
  const [testingId, setTestingId] = useState<string | null>(null)
  const [testingAll, setTestingAll] = useState(false)
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [customForm, setCustomForm] = useState({ name: '', slug: '', baseUrl: '', apiKey: '' })
  const [customError, setCustomError] = useState<string | null>(null)

  useEffect(() => { loadData() }, [])

  const loadData = useCallback(async () => {
    const [prov, adaps] = await Promise.all([
      api.providerList(), api.providerAdapters()
    ])
    setProviders(prov); setAdapters(adaps)

    const statuses: Record<string, boolean> = {}
    for (const p of prov) { statuses[p.id] = await api.providerHasApiKey(p.id) }
    setKeyStatus(statuses)
  }, [api, setProviders, setAdapters])

  const handleSaveKey = useCallback(async (providerId: string) => {
    const key = editingKey[providerId]; if (!key) return
    setSavingKey(providerId)
    try {
      await api.providerSetApiKey(providerId, key)
      setKeyStatus(prev => ({ ...prev, [providerId]: true }))
      setEditingKey(prev => { const n = { ...prev }; delete n[providerId]; return n })
      setShowKey(prev => ({ ...prev, [providerId]: false }))
      showToast('success', 'API key saved successfully')
    } catch (err) { console.error(err) }
    finally { setSavingKey(null) }
  }, [editingKey, api])

  const handleDeleteKey = useCallback(async (providerId: string) => {
    setSavingKey(providerId)
    try {
      await api.providerDeleteApiKey(providerId)
      setKeyStatus(prev => ({ ...prev, [providerId]: false }))
      showToast('info', 'API key removed')
    } catch (err) { console.error(err) }
    finally { setSavingKey(null) }
  }, [api])

  const handleToggleProvider = useCallback(async (providerId: string, enabled: boolean) => {
    await api.providerToggleEnabled(providerId, enabled)
    updateProvider(providerId, { is_enabled: enabled ? 1 : 0 })
  }, [api, updateProvider])

  const handleSetBaseUrl = useCallback(async (providerId: string, baseUrl: string) => {
    await api.providerSetBaseUrl(providerId, baseUrl)
    updateProvider(providerId, { base_url: baseUrl })
  }, [api, updateProvider])

  const handleTestConnection = useCallback(async (providerId: string) => {
    setTestingId(providerId)
    try {
      const startedAt = performance.now()
      const result = await api.providerTestConnection(providerId)
      const normalized = {
        success: result.success,
        message: sanitizeTestMessage(result.message),
        latencyMs: Math.round(performance.now() - startedAt),
        checkedAt: new Date().toISOString()
      }
      setTestResults(prev => ({ ...prev, [providerId]: { success: normalized.success, message: normalized.message } }))
      setTestCenterResults(prev => ({ ...prev, [providerId]: normalized }))
      showToast(result.success ? 'success' : 'error', result.success ? 'Connection successful' : 'Connection failed')
    } catch (err) {
      const message = sanitizeTestMessage(String(err))
      setTestResults(prev => ({ ...prev, [providerId]: { success: false, message } }))
      setTestCenterResults(prev => ({
        ...prev,
        [providerId]: { success: false, message, latencyMs: 0, checkedAt: new Date().toISOString() }
      }))
    }
    finally { setTestingId(null) }
  }, [api])

  const handleRunAllTests = useCallback(async () => {
    setTestingAll(true)
    try {
      for (const provider of providers) {
        setTestingId(provider.id)
        const startedAt = performance.now()
        try {
          const result = await api.providerTestConnection(provider.id)
          const normalized = {
            success: result.success,
            message: sanitizeTestMessage(result.message),
            latencyMs: Math.round(performance.now() - startedAt),
            checkedAt: new Date().toISOString()
          }
          setTestResults(prev => ({ ...prev, [provider.id]: { success: normalized.success, message: normalized.message } }))
          setTestCenterResults(prev => ({ ...prev, [provider.id]: normalized }))
        } catch (err) {
          const message = sanitizeTestMessage(String(err))
          setTestResults(prev => ({ ...prev, [provider.id]: { success: false, message } }))
          setTestCenterResults(prev => ({
            ...prev,
            [provider.id]: { success: false, message, latencyMs: Math.round(performance.now() - startedAt), checkedAt: new Date().toISOString() }
          }))
        }
      }
      showToast('info', 'Provider checks completed')
    } finally {
      setTestingId(null)
      setTestingAll(false)
    }
  }, [api, providers])

  const handleDeleteProvider = useCallback(async (providerId: string) => {
    if (!confirm('Delete this provider and all its models?')) return
    await api.providerDelete(providerId)
    showToast('info', 'Provider deleted')
    loadData()
  }, [api, loadData])

  const handleSetDefaultModel = useCallback(async (providerId: string, modelId: string) => {
    await api.providerSetDefaultModel(providerId, modelId)
    loadData()
  }, [api, loadData])

  const handleCreateCustom = useCallback(async () => {
    if (!customForm.name || !customForm.slug) { setCustomError('Name and slug are required'); return }
    setCustomError(null)
    try {
      await api.providerCreateCustom({
        name: customForm.name, slug: customForm.slug,
        baseUrl: customForm.baseUrl || 'http://localhost:8000/v1',
        apiKey: customForm.apiKey || undefined
      })
      setShowCustomForm(false)
      setCustomForm({ name: '', slug: '', baseUrl: '', apiKey: '' })
      showToast('success', 'Custom provider created')
      loadData()
    } catch (err) { setCustomError(String(err)) }
  }, [customForm, api, loadData])

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold text-[var(--ivory-text)] display-text">Providers &amp; API Keys</h2>
          <p className="text-xs text-[var(--ivory-text-3)] mt-1 leading-relaxed">
            Manage your AI provider connections. Keys are encrypted with your OS credentials (DPAPI on Windows).
          </p>
        </div>
        <Button size="sm" onClick={() => setShowCustomForm(true)} className="shrink-0">
          <Plus size={14} /> Add Custom
        </Button>
      </div>

      {/* Safety notice */}
      <div className="p-3.5 rounded-xl bg-[var(--ivory-warning-bg)] border border-[var(--ivory-warning)]/15 text-xs text-[var(--ivory-warning)] flex items-start gap-2.5">
        <AlertTriangle size={14} className="shrink-0 mt-0.5" />
        <span className="leading-relaxed">Sending messages to remote providers transmits your chat content to external servers. Local files referenced in prompts will also be sent.</span>
      </div>

      <Card className="mb-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Activity size={16} className="text-[var(--ivory-accent)]" />
              <h3 className="text-base font-semibold">Provider Test Center</h3>
            </div>
            <p className="text-xs text-[var(--ivory-text-3)] leading-relaxed">
              Check credential status, local server reachability, response latency, and sanitized error details without exposing API keys.
            </p>
          </div>
          <Button size="sm" variant="secondary" onClick={handleRunAllTests} disabled={testingAll || providers.length === 0} loading={testingAll}>
            <Wifi size={14} /> Test All
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {providers.map(provider => {
            const result = testCenterResults[provider.id]
            const hasKey = keyStatus[provider.id]
            const isLocal = provider.adapter === 'ollama' || provider.adapter === 'lmstudio'
            const isTesting = testingId === provider.id
            return (
              <div key={provider.id} className="rounded-[var(--radius-lg)] border border-[var(--ivory-border)] bg-[var(--ivory-bg)] p-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--ivory-text)] truncate">{provider.name}</p>
                    <p className="text-[11px] text-[var(--ivory-text-3)] truncate">{provider.base_url || 'No base URL configured'}</p>
                  </div>
                  <ProviderStatusBadge
                    hasKey={hasKey}
                    isEnabled={provider.is_enabled === 1}
                    testResult={result ? { success: result.success, message: result.message } : null}
                    isLocal={isLocal}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-1.5 mb-3">
                  <Badge variant={provider.is_enabled === 1 ? 'success' : 'default'} size="sm">
                    {provider.is_enabled === 1 ? 'Enabled' : 'Disabled'}
                  </Badge>
                  <Badge variant={isLocal || hasKey ? 'success' : 'warning'} size="sm">
                    {isLocal ? 'No key needed' : hasKey ? 'Key stored' : 'Missing key'}
                  </Badge>
                  {result && (
                    <Badge variant={result.success ? 'success' : 'error'} size="sm">
                      <Clock size={10} className="mr-0.5" /> {result.latencyMs} ms
                    </Badge>
                  )}
                </div>
                <p className={`min-h-10 text-[11px] leading-relaxed ${result ? (result.success ? 'text-[var(--ivory-success)]' : 'text-[var(--ivory-error)]') : 'text-[var(--ivory-text-3)]'}`}>
                  {isTesting ? 'Testing connection...' : result?.message || 'Not tested yet.'}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-[10px] text-[var(--ivory-text-3)]">
                    {result ? new Date(result.checkedAt).toLocaleTimeString() : 'No result'}
                  </span>
                  <Button size="sm" variant="ghost" onClick={() => handleTestConnection(provider.id)} disabled={isTesting || testingAll} loading={isTesting}>
                    <Wifi size={13} /> Test
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Custom Provider Form */}
      {showCustomForm && (
        <div className="mb-5 p-5 rounded-[var(--radius-lg)] border-2 border-[var(--ivory-accent)]/30 bg-[var(--ivory-bg)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Add Custom OpenAI-Compatible Provider</h3>
            <button onClick={() => setShowCustomForm(false)} className="text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)]"><X size={16} /></button>
          </div>
          <div className="space-y-3">
            <Input label="Display Name" placeholder="My Provider" value={customForm.name}
              onChange={e => setCustomForm(f => ({ ...f, name: e.target.value }))} />
            <Input label="Slug (no spaces)" placeholder="my-provider" value={customForm.slug}
              onChange={e => setCustomForm(f => ({ ...f, slug: e.target.value.replace(/\s+/g, '-').toLowerCase() }))} />
            <Input label="Base URL" placeholder="http://localhost:8000/v1" value={customForm.baseUrl}
              onChange={e => setCustomForm(f => ({ ...f, baseUrl: e.target.value }))} />
            <Input label="API Key (optional)" type="password" placeholder="sk-..." value={customForm.apiKey}
              onChange={e => setCustomForm(f => ({ ...f, apiKey: e.target.value }))} />
            {customError && <p className="text-xs text-red-600">{customError}</p>}
            <Button onClick={handleCreateCustom}>Create Provider</Button>
          </div>
        </div>
      )}

      <div className="space-y-5">
        {adapters.map((adapter: ProviderAdapterInfo) => {
          const provider = providers.find(p => p.slug === adapter.slug)
          const hasKey = provider ? keyStatus[provider.id] : false
          const editing = provider ? editingKey[provider.id] : undefined
          const showing = provider ? showKey[provider.id] : false
          const saving = provider ? savingKey === provider.id : false
          const testResult = provider ? testResults[provider.id] : null
          const isTesting = provider ? testingId === provider.id : false

          return (
            <Card key={adapter.slug}>
              {/* Header */}
              <div className="flex items-start justify-between mb-4 gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-ui-lg font-semibold text-[var(--ivory-text)]">{adapter.name}</h3>
                    {/* Provider status */}
                    {provider ? (
                      <ProviderStatusBadge
                        hasKey={hasKey}
                        isEnabled={provider.is_enabled === 1}
                        testResult={testResult}
                        isLocal={adapter.capabilities.includes('local')}
                      />
                    ) : (
                      <Badge variant="default" size="sm">Not configured</Badge>
                    )}
                  </div>
                  <p className="text-ui-caption text-[var(--ivory-text-3)] leading-relaxed">{adapter.description}</p>
                </div>
                {provider && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => handleTestConnection(provider.id)} disabled={isTesting} className="text-ui-caption">
                      <Wifi size={13} className={isTesting ? 'animate-pulse' : ''} />
                      {isTesting ? 'Testing...' : 'Test'}
                    </Button>
                    <Toggle
                      checked={provider.is_enabled === 1}
                      onChange={(enabled) => handleToggleProvider(provider.id, enabled)}
                    />
                    <button onClick={() => handleDeleteProvider(provider.id)} className="p-1.5 text-[var(--ivory-text-3)] hover:text-red-600 transition-colors rounded-lg hover:bg-red-50" title="Delete provider" aria-label="Delete provider">
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Local provider help card */}
              {adapter.capabilities.includes('local') && (
                <div className="mb-4 p-3 rounded-xl bg-[var(--ivory-surface)]/60 border border-[var(--ivory-border)]/50 text-[11px] text-[var(--ivory-text-2)]">
                  <p className="font-semibold mb-1">
                    {adapter.slug === 'ollama' ? '🦙 Running Ollama locally' : '🖥️ Running LM Studio locally'}
                  </p>
                  <p className="text-[var(--ivory-text-3)] leading-relaxed">
                    {adapter.slug === 'ollama'
                      ? 'No API key needed. Make sure Ollama is running. Default: http://localhost:11434'
                      : 'No API key needed. Load a model in LM Studio. Default: http://localhost:1234/v1'}
                  </p>
                </div>
              )}

              {/* OpenRouter help card */}
              {adapter.slug === 'openrouter' && (
                <div className="mb-4 p-3 rounded-xl bg-[var(--ivory-surface)]/60 border border-[var(--ivory-border)]/50 text-[11px] text-[var(--ivory-text-2)]">
                  <p className="font-semibold mb-1">OpenRouter — multi-provider access</p>
                  <p className="text-[var(--ivory-text-3)] leading-relaxed">
                    Use <code className="text-[10px] px-1 py-0.5 rounded bg-[var(--ivory-surface-2)]">:free</code> models for zero-cost testing. Get a key at openrouter.ai/keys.
                  </p>
                </div>
              )}

              {/* Capabilities */}
              <div className="flex flex-wrap gap-1 mb-4">
                {adapter.capabilities.map(cap => (
                  <span key={cap} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-ui-caption font-medium bg-[var(--ivory-bg)] text-[var(--ivory-text-2)] border border-[var(--ivory-border)]/60">
                    {CAPABILITY_LABELS[cap]?.icon} {CAPABILITY_LABELS[cap]?.label || cap}
                  </span>
                ))}
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-ui-caption font-medium border ${adapter.authType === 'none' ? 'bg-[var(--ivory-success-bg)] text-[var(--ivory-success)] border-[var(--ivory-success)]/20' : 'bg-[var(--ivory-warning-bg)] text-[var(--ivory-warning)] border-[var(--ivory-warning)]/20'}`}>
                  {adapter.authType === 'none' ? 'No key needed' : 'API key'}
                </span>
              </div>

              {/* Test result */}
              {testResult && (
                <div className={`mb-4 p-2.5 rounded-[var(--radius-md)] text-xs ${testResult.success ? 'bg-[var(--ivory-success-bg)] text-[var(--ivory-success)] border border-[var(--ivory-success)]/20' : 'bg-[var(--ivory-error-bg)] text-[var(--ivory-error)] border border-[var(--ivory-error)]/20'}`}>
                  {testResult.success ? <Check size={12} className="inline mr-1" /> : <AlertTriangle size={12} className="inline mr-1" />}
                  {testResult.message}
                </div>
              )}

              {/* API Key */}
              {adapter.authType !== 'none' && (
                <div className="mb-4">
                  <label className="text-xs font-semibold text-[var(--ivory-text)] block mb-2">API Key</label>
                  {hasKey ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-[var(--ivory-surface)] border border-[var(--ivory-border)]/60 rounded-xl px-3 py-2 text-sm text-[var(--ivory-success)] font-mono">
                        ●●●●●●●● Key configured
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => provider && setEditingKey(prev => ({ ...prev, [provider.id]: '' }))}>Change</Button>
                      <Button variant="ghost" size="sm" onClick={() => provider && handleDeleteKey(provider.id)} disabled={saving}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex gap-2 items-start">
                        <div className="flex-1 relative">
                          <input
                            value={editing || ''}
                            onChange={(e) => provider && setEditingKey(prev => ({ ...prev, [provider.id]: e.target.value }))}
                            placeholder={`Enter your ${adapter.name} API key`}
                            type={showing ? 'text' : 'password'}
                            className="w-full px-3 py-2 text-sm rounded-xl bg-[var(--ivory-elevated)] border border-[var(--ivory-border)] text-[var(--ivory-text)] placeholder:text-[var(--ivory-text-3)] shadow-[var(--shadow-xs)] hover:border-[var(--ivory-border-2)] focus:outline-none focus:border-[var(--ivory-accent)] focus:ring-1 focus:ring-[var(--ivory-accent)] transition-colors"
                          />
                          <button onClick={() => provider && setShowKey(prev => ({ ...prev, [provider.id]: !showing }))}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] transition-colors"
                            aria-label={showing ? 'Hide API key' : 'Show API key'}>
                            {showing ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                        <Button size="md" variant="secondary" onClick={() => provider && handleSaveKey(provider.id)} disabled={!editing || saving} className="shrink-0">
                          {saving ? 'Saving...' : 'Save Key'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Base URL */}
              <div className="mb-1">
                <Input label="Base URL" value={provider?.base_url || adapter.defaultBaseUrl}
                  onChange={(e) => provider && handleSetBaseUrl(provider.id, e.target.value)}
                  placeholder={adapter.defaultBaseUrl} />
              </div>

              {/* Models */}
              {provider && provider.models && provider.models.length > 0 && (
                <div className="mt-4 pt-3 border-t border-[var(--ivory-border)]/60">
                  <p className="text-ui-caption font-semibold text-[var(--ivory-text-2)] mb-2">Models</p>
                  <div className="space-y-0.5">
                    {provider.models.map((model) => (
                      <div key={model.id} className="flex items-center justify-between py-2 px-2 rounded-xl hover:bg-[var(--ivory-surface)] text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-medium text-[var(--ivory-text)] truncate">{model.display_name}</span>
                          {model.context_window && (
                            <span className="text-ui-caption text-[var(--ivory-text-3)] shrink-0">{Math.round(model.context_window / 1000)}k ctx</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Toggle
                            checked={model.is_enabled === 1}
                            onChange={(enabled) => api.modelToggleEnabled(model.id, enabled).then(loadData)}
                          />
                          {model.is_default ? (
                            <Star size={12} className="text-amber-500 fill-current" />
                          ) : (
                            <button onClick={() => handleSetDefaultModel(provider.id, model.id)}
                              className="text-[var(--ivory-text-3)] hover:text-amber-500" title="Set as default">
                              <Star size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// --- Provider Status Badge ---

function ProviderStatusBadge({
  hasKey, isEnabled, testResult, isLocal
}: {
  hasKey: boolean
  isEnabled: boolean
  testResult: { success: boolean; message: string } | null
  isLocal: boolean
}): React.ReactElement {
  if (!isEnabled) {
    return <Badge variant="default" size="sm">Disabled</Badge>
  }
  if (testResult) {
    if (testResult.success) {
      return <Badge variant="success" size="sm"><Check size={10} className="inline mr-0.5" />Tested</Badge>
    }
    return <Badge variant="error" size="sm"><AlertTriangle size={10} className="inline mr-0.5" />Test failed</Badge>
  }
  if (isLocal) {
    return <Badge variant="success" size="sm"><Monitor size={10} className="inline mr-0.5" />Local</Badge>
  }
  if (hasKey) {
    return <Badge variant="success" size="sm">Configured</Badge>
  }
  return <Badge variant="warning" size="sm">No API key</Badge>
}
