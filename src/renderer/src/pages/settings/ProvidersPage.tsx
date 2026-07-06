import React, { useCallback, useEffect, useState } from 'react'
import {
  Eye, EyeOff, Trash2, Check, AlertTriangle, Plus,
  Wifi, Shield, Zap, Server, Monitor, Globe, Star, X, Wrench
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

export function ProvidersPage(): React.ReactElement {
  const api = useIpc()
  const { providers, adapters, isLoading, setProviders, setAdapters, updateProvider } = useProviderStore()
  const [editingKey, setEditingKey] = useState<Record<string, string>>({})
  const [showKey, setShowKey] = useState<Record<string, boolean>>({})
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [keyStatus, setKeyStatus] = useState<Record<string, boolean>>({})
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string } | null>>({})
  const [testingId, setTestingId] = useState<string | null>(null)
  const [editingBaseUrl, setEditingBaseUrl] = useState<Record<string, string>>({})
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
      const result = await api.providerTestConnection(providerId)
      setTestResults(prev => ({ ...prev, [providerId]: result }))
      showToast(result.success ? 'success' : 'error', result.success ? 'Connection successful' : 'Connection failed')
    } catch (err) {
      setTestResults(prev => ({ ...prev, [providerId]: { success: false, message: String(err) } }))
    }
    finally { setTestingId(null) }
  }, [api])

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
    <div className="max-w-2xl px-8 py-8">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-xl font-semibold display-text">Providers & API Keys</h2>
        <Button size="sm" onClick={() => setShowCustomForm(true)}>
          <Plus size={14} /> Add Custom
        </Button>
      </div>
      <p className="text-sm text-[var(--ivory-text-3)] mb-6">
        Manage your AI provider connections. Keys are encrypted with your OS credentials (DPAPI on Windows). Never stored in plaintext.
      </p>

      {/* Safety notice */}
      <div className="mb-6 p-3 rounded-[var(--radius-md)] bg-[var(--ivory-warning-bg)] border border-[var(--ivory-warning-bg)] text-xs text-[var(--ivory-warning)] flex items-start gap-2">
        <AlertTriangle size={14} className="shrink-0 mt-0.5" />
        <span>Sending messages to remote providers transmits your chat content to external servers. Local files referenced in prompts will also be sent.</span>
      </div>

      {/* Custom Provider Form */}
      {showCustomForm && (
        <div className="mb-6 p-5 rounded-[var(--radius-lg)] border border-[var(--ivory-accent)] bg-[var(--ivory-bg)]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold display-text">Add Custom OpenAI-Compatible Provider</h3>
            <button onClick={() => setShowCustomForm(false)} className="text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)]"><X size={16} /></button>
          </div>
          <div className="space-y-3">
            <Input label="Display Name" placeholder="My Provider" value={customForm.name}
              onChange={e => setCustomForm(f => ({ ...f, name: e.target.value }))} />
            <Input label="Slug (no spaces)" placeholder="my-provider" value={customForm.slug}
              onChange={e => setCustomForm(f => ({ ...f, slug: e.target.value.replace(/\\s+/g, '-').toLowerCase() }))} />
            <Input label="Base URL" placeholder="http://localhost:8000/v1" value={customForm.baseUrl}
              onChange={e => setCustomForm(f => ({ ...f, baseUrl: e.target.value }))} />
            <Input label="API Key (optional)" type="password" placeholder="sk-..." value={customForm.apiKey}
              onChange={e => setCustomForm(f => ({ ...f, apiKey: e.target.value }))} />
            {customError && <p className="text-xs text-red-600">{customError}</p>}
            <Button onClick={handleCreateCustom}>Create Provider</Button>
          </div>
        </div>
      )}

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
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-base font-semibold display-text">{adapter.name}</h3>
                  <p className="text-xs text-[var(--ivory-text-3)] mt-0.5">{adapter.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  {provider && (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => handleTestConnection(provider.id)} disabled={isTesting}>
                        <Wifi size={14} className={isTesting ? 'animate-pulse' : ''} />
                        {isTesting ? 'Testing...' : 'Test'}
                      </Button>
                      <Toggle
                        checked={provider.is_enabled === 1}
                        onChange={(enabled) => handleToggleProvider(provider.id, enabled)}
                      />
                      <button onClick={() => handleDeleteProvider(provider.id)} className="p-1 text-[var(--ivory-text-3)] hover:text-red-600" title="Delete provider">
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Capabilities */}
              <div className="flex flex-wrap gap-1 mb-3">
                {adapter.capabilities.map(cap => (
                  <Badge key={cap} variant={cap === 'local' ? 'success' : 'default'} size="sm">
                    <span className="flex items-center gap-0.5">
                      {CAPABILITY_LABELS[cap]?.icon} {CAPABILITY_LABELS[cap]?.label || cap}
                    </span>
                  </Badge>
                ))}
                <Badge variant={adapter.authType === 'none' ? 'success' : 'warning'} size="sm">
                  {adapter.authType === 'none' ? 'No key needed' : 'API key'}
                </Badge>
              </div>

              {/* Test result */}
              {testResult && (
                <div className={`mb-3 p-2 rounded-[var(--radius-sm)] text-xs ${testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {testResult.success ? <Check size={12} className="inline mr-1" /> : <AlertTriangle size={12} className="inline mr-1" />}
                  {testResult.message}
                </div>
              )}

              {/* API Key */}
              {adapter.authType !== 'none' && (
                <div className="mb-3">
                  <label className="text-sm font-medium text-[var(--ivory-text)] block mb-1.5">API Key</label>
                  {hasKey ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-[var(--ivory-surface)] border border-[var(--ivory-border)] rounded-[var(--radius-md)] px-3 py-2 text-sm text-[var(--ivory-success)] font-mono">
                        ●●●●●●●● Key configured
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => provider && setEditingKey(prev => ({ ...prev, [provider.id]: '' }))}>Change</Button>
                      <Button variant="ghost" size="sm" onClick={() => provider && handleDeleteKey(provider.id)} disabled={saving}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Input
                          value={editing || ''}
                          onChange={(e) => provider && setEditingKey(prev => ({ ...prev, [provider.id]: e.target.value }))}
                          placeholder={`Enter your ${adapter.name} API key`}
                          type={showing ? 'text' : 'password'}
                        />
                        <button onClick={() => provider && setShowKey(prev => ({ ...prev, [provider.id]: !showing }))}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)]">
                          {showing ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                      <Button size="sm" onClick={() => provider && handleSaveKey(provider.id)} disabled={!editing || saving}>
                        {saving ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Base URL */}
              <div className="mb-3">
                <Input label="Base URL" value={provider?.base_url || adapter.defaultBaseUrl}
                  onChange={(e) => provider && handleSetBaseUrl(provider.id, e.target.value)}
                  placeholder={adapter.defaultBaseUrl} />
              </div>

              {/* Models */}
              {provider && provider.models && provider.models.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[var(--ivory-border)]">
                  <p className="text-xs font-medium text-[var(--ivory-text-2)] mb-2">Models</p>
                  <div className="space-y-1">
                    {provider.models.map((model) => (
                      <div key={model.id} className="flex items-center justify-between py-1.5 px-2 rounded-[var(--radius-sm)] hover:bg-[var(--ivory-surface)] text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-[var(--ivory-text)]">{model.display_name}</span>
                          <span className="text-[var(--ivory-text-3)] text-[10px]">({model.name})</span>
                          {model.context_window && (
                            <span className="text-[10px] text-[var(--ivory-text-3)]">{model.context_window.toLocaleString()} ctx</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
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
