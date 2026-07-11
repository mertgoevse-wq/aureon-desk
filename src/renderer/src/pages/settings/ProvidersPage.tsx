import { useEffect, useCallback, useState } from 'react'
import {
  Eye, EyeOff, Trash2, Check, AlertTriangle, Plus,
  Wifi, Zap, Server, Monitor, Globe, Star, Wrench,
  Activity, Clock
} from 'lucide-react'
import { Button } from '../../components/shared/Button'
import { Input } from '../../components/shared/Input'
import { Toggle } from '../../components/shared/Toggle'
import { Badge } from '../../components/shared/Badge'
import { Card } from '../../components/shared/Card'
import { Modal } from '../../components/shared/Modal'
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
  const [modelUsage, setModelUsage] = useState<any[]>([])
  const [loadingUsage, setLoadingUsage] = useState(false)
  const [smokeTestResults, setSmokeTestResults] = useState<Record<string, { success: boolean; message: string; modelUsed: string | null; durationMs: number; responsePreview: string | null } | null>>({})
  const [smokeTestingId, setSmokeTestingId] = useState<string | null>(null)
  const [smokeTestingAll, setSmokeTestingAll] = useState(false)
  const [smokeTestAllSummary, setSmokeTestAllSummary] = useState<{ total: number; passed: number; failed: number; skipped: number } | null>(null)

  useEffect(() => { loadData() }, [])

  const loadUsage = useCallback(async () => {
    setLoadingUsage(true)
    try {
      const usage = await api.modelRouterGetUsage()
      setModelUsage(usage)
    } catch { /* ignore */ }
    finally { setLoadingUsage(false) }
  }, [api])

  useEffect(() => { loadUsage() }, [loadUsage])

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

  const handleSmokeTestAll = useCallback(async () => {
    setSmokeTestingAll(true)
    setSmokeTestAllSummary(null)
    // Clear individual results
    setSmokeTestResults({})
    try {
      const result = await api.providerSmokeTestAll()
      // Map results back to per-provider state for inline display
      const mapped: Record<string, { success: boolean; message: string; modelUsed: string | null; durationMs: number; responsePreview: string | null }> = {}
      for (const r of result.results) {
        mapped[r.providerId] = {
          success: r.success,
          message: r.message,
          modelUsed: r.modelUsed,
          durationMs: r.durationMs,
          responsePreview: null,
        }
      }
      setSmokeTestResults(mapped)
      setSmokeTestAllSummary({ total: result.total, passed: result.passed, failed: result.failed, skipped: result.skipped })
      showToast(
        result.passed > 0 ? 'success' : 'error',
        `${result.passed} passed, ${result.failed} failed, ${result.skipped} skipped`
      )
    } catch (err) {
      showToast('error', 'Smoke test all failed: ' + String(err))
    }
    finally { setSmokeTestingAll(false) }
  }, [api])

  const handleSmokeTest = useCallback(async (providerId: string) => {
    setSmokeTestingId(providerId)
    setSmokeTestResults(prev => ({ ...prev, [providerId]: null }))
    try {
      const result = await api.providerSmokeTest(providerId)
      setSmokeTestResults(prev => ({ ...prev, [providerId]: result }))
      showToast(result.success ? 'success' : 'error', result.success ? 'Smoke test passed' : 'Smoke test failed')
    } catch (err) {
      setSmokeTestResults(prev => ({
        ...prev,
        [providerId]: { success: false, message: String(err), modelUsed: null, durationMs: 0, responsePreview: null }
      }))
    }
    finally { setSmokeTestingId(null) }
  }, [api])

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
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-[18px] font-semibold text-[var(--ivory-text)]">Providers</h2>
          <p className="text-[11px] text-[var(--ivory-text-3)] mt-1 leading-relaxed">
            Configure model access. Keys stay encrypted in the local vault.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setShowCustomForm(true)} className="shrink-0">
          <Plus size={14} /> Add Custom
        </Button>
      </div>

      {/* Safety notice — quieter */}
      <div className="p-2.5 rounded-xl bg-[var(--ivory-surface)] border border-[var(--ivory-border)]/60 text-[11px] text-[var(--ivory-text-3)] flex items-start gap-2">
        <AlertTriangle size={13} className="shrink-0 mt-0.5 text-[var(--ivory-text-3)]" />
        <span className="leading-relaxed">External providers receive prompt content when selected. Local providers stay on your machine.</span>
      </div>

      <div className="rounded-xl border border-[var(--ivory-border)]/70 bg-[var(--ivory-elevated)] p-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h3 className="text-[13px] font-semibold text-[var(--ivory-text)] flex items-center gap-1.5">
            <Activity size={13} className="text-[var(--ivory-text-3)]" />
            Provider Test Center
          </h3>
          <p className="text-[10px] text-[var(--ivory-text-3)] mt-0.5">
            {Object.keys(testCenterResults).length > 0
              ? `${Object.keys(testCenterResults).length} recent checks`
              : loadingUsage
                ? 'Loading provider usage...'
                : `${modelUsage.length} model routes available`}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleRunAllTests} loading={testingAll} disabled={providers.length === 0}>
          <Clock size={13} />
          Test All
        </Button>
      </div>

      {/* Custom Provider Modal */}
      <Modal
        isOpen={showCustomForm}
        onClose={() => { setShowCustomForm(false); setCustomError(null) }}
        title="Add Custom Provider"
        size="sm"
      >
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
          <Button onClick={handleCreateCustom} className="w-full">Create Provider</Button>
        </div>
      </Modal>

      <div className="space-y-4">
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
              <div className="flex items-start justify-between mb-4 gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-[15px] font-semibold text-[var(--ivory-text)]">{adapter.name}</h3>
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
                <p className="text-[11px] text-[var(--ivory-text-3)] leading-relaxed">{adapter.description}</p>
                </div>
              </div>

              {/* Local provider help card */}
              {adapter.capabilities.includes('local') && (
                <div className="mb-3 p-2.5 rounded-xl bg-[var(--ivory-surface)]/60 border border-[var(--ivory-border)]/50 text-[11px] text-[var(--ivory-text-2)]">
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
                <div className="mb-3 p-2.5 rounded-xl bg-[var(--ivory-surface)]/60 border border-[var(--ivory-border)]/50 text-[11px] text-[var(--ivory-text-2)]">
                  <p className="font-semibold mb-1">OpenRouter — multi-provider access</p>
                  <p className="text-[var(--ivory-text-3)] leading-relaxed">
                    Use <code className="text-[10px] px-1 py-0.5 rounded bg-[var(--ivory-surface-2)]">:free</code> models for zero-cost testing. Get a key at openrouter.ai/keys.
                  </p>
                </div>
              )}

              {/* Capabilities */}
              <div className="flex flex-wrap gap-1 mb-3">
                {adapter.capabilities.map(cap => (
                  <span key={cap} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-ui-caption font-medium bg-[var(--ivory-bg)] text-[var(--ivory-text-2)] border border-[var(--ivory-border)]/60">
                    {CAPABILITY_LABELS[cap]?.icon} {CAPABILITY_LABELS[cap]?.label || cap}
                  </span>
                ))}
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-ui-caption font-medium border ${adapter.authType === 'none' ? 'bg-[var(--ivory-success-bg)] text-[var(--ivory-success)] border-[var(--ivory-success)]/20' : 'bg-[var(--ivory-warning-bg)] text-[var(--ivory-warning)] border-[var(--ivory-warning)]/20'}`}>
                  {adapter.authType === 'none' ? 'No key needed' : 'API key required'}
                </span>
              </div>

              {/* === Connection Section === */}
              <div className="pt-3 border-t border-[var(--ivory-border)]/60">
                <p className="text-xs font-semibold text-[var(--ivory-text)] mb-3">Connection</p>
                <Input label="Base URL" value={provider?.base_url || adapter.defaultBaseUrl}
                  onChange={(e) => provider && handleSetBaseUrl(provider.id, e.target.value)}
                  placeholder={adapter.defaultBaseUrl} />
              </div>


              {/* === API Key Section === */}
              {adapter.authType !== 'none' && (
                <div className="pt-3 border-t border-[var(--ivory-border)]/60">
                  <p className="text-xs font-semibold text-[var(--ivory-text)] mb-3">API Key</p>
                  {hasKey ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-[var(--ivory-surface)] border border-[var(--ivory-border)]/60 rounded-xl px-3 py-2 text-xs font-mono text-[var(--ivory-success)]">
                        ●●●●●●●● Key configured
                      </div>
                      <Button variant="secondary" size="sm" onClick={() => provider && setEditingKey(prev => ({ ...prev, [provider.id]: '' }))}>Change</Button>
                      <Button variant="ghost" size="sm" onClick={() => provider && handleDeleteKey(provider.id)} disabled={saving}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 items-end">
                      <div className="flex-1 min-w-[200px]">
                        <div className="flex items-center gap-1.5">
                          <div className="flex-1">
                            <Input
                              type={showing ? 'text' : 'password'}
                              value={editing || ''}
                              onChange={(e) => provider && setEditingKey(prev => ({ ...prev, [provider.id]: e.target.value }))}
                              placeholder={`Enter your ${adapter.name} API key`}
                            />
                          </div>
                          <button onClick={() => provider && setShowKey(prev => ({ ...prev, [provider.id]: !showing }))}
                            className="shrink-0 p-1.5 rounded-lg text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface)] transition-colors mt-5"
                            aria-label={showing ? 'Hide API key' : 'Show API key'}>
                            {showing ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </div>
                      <Button size="md" variant="secondary" onClick={() => provider && handleSaveKey(provider.id)} disabled={!editing || saving} className="shrink-0">
                        {saving ? 'Saving...' : 'Save Key'}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Models */}
              {provider && provider.models && provider.models.length > 0 && (
                <div className="pt-3 border-t border-[var(--ivory-border)]/60">
                  <p className="text-xs font-semibold text-[var(--ivory-text)] mb-3">Models</p>
                  <div className="space-y-1">
                    {provider.models.map((model) => (
                      <div key={model.id} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-[var(--ivory-bg)] transition-colors">
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
                              className="p-1 text-[var(--ivory-text-3)] hover:text-amber-500 rounded transition-colors" title="Set as default">
                              <Star size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* === Actions Footer === */}
              <div className="pt-3 border-t border-[var(--ivory-border)]/60">
                {/* Test result inline */}
                {testResult && (
                  <div className={`mb-3 p-2.5 rounded-xl text-xs flex items-start gap-2 ${testResult.success ? 'bg-[var(--ivory-success-bg)] text-[var(--ivory-success)] border border-[var(--ivory-success)]/20' : 'bg-[var(--ivory-error-bg)] text-[var(--ivory-error)] border border-[var(--ivory-error)]/20'}`}>
                    {testResult.success ? <Check size={12} className="shrink-0 mt-0.5" /> : <AlertTriangle size={12} className="shrink-0 mt-0.5" />}
                    <span className="leading-relaxed">{testResult.message}</span>
                  </div>
                )}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 flex-wrap">
                    {provider && (
                      <>
                        <Button variant="secondary" size="sm" onClick={() => handleTestConnection(provider.id)} disabled={isTesting}>
                          <Wifi size={13} className={isTesting ? 'animate-pulse' : ''} />
                          {isTesting ? 'Testing...' : 'Test connection'}
                        </Button>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Toggle
                            checked={provider.is_enabled === 1}
                            onChange={(enabled) => handleToggleProvider(provider.id, enabled)}
                          />
                          <span className="text-xs text-[var(--ivory-text-2)] select-none">Enabled</span>
                        </label>
                      </>
                    )}
                  </div>
                  {provider && (
                    <Button variant="danger" size="sm" onClick={() => handleDeleteProvider(provider.id)}>
                      <Trash2 size={13} /> Delete
                    </Button>
                  )}
                </div>
              </div>
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
