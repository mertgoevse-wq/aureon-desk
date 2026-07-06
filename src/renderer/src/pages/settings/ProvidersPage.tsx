import React, { useCallback, useEffect, useState } from 'react'
import { Key, Eye, EyeOff, Trash2, Check, AlertTriangle, ExternalLink } from 'lucide-react'
import { Button } from '../../components/shared/Button'
import { Input, Textarea } from '../../components/shared/Input'
import { Toggle } from '../../components/shared/Toggle'
import { useIpc } from '../../hooks/useIpc'
import { useProviderStore } from '../../stores/providerStore'
import type { ProviderAdapterInfo } from '@shared/types/provider'

export function ProvidersPage(): React.ReactElement {
  const api = useIpc()
  const { providers, adapters, isLoading, setProviders, setAdapters, updateProvider } = useProviderStore()
  const [editingKey, setEditingKey] = useState<Record<string, string>>({})
  const [showKey, setShowKey] = useState<Record<string, boolean>>({})
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [keyStatus, setKeyStatus] = useState<Record<string, boolean>>({})

  useEffect(() => {
    loadData()
  }, [])

  const loadData = useCallback(async () => {
    const [prov, adaps] = await Promise.all([
      api.providerList(),
      api.providerAdapters()
    ])
    setProviders(prov)
    setAdapters(adaps)

    // Check which providers have API keys set
    const statuses: Record<string, boolean> = {}
    for (const p of prov) {
      statuses[p.id] = await api.providerHasApiKey(p.id)
    }
    setKeyStatus(statuses)
  }, [api, setProviders, setAdapters])

  const handleSaveKey = useCallback(async (providerId: string) => {
    const key = editingKey[providerId]
    if (!key) return

    setSavingKey(providerId)
    try {
      await api.providerSetApiKey(providerId, key)
      setKeyStatus(prev => ({ ...prev, [providerId]: true }))
      setEditingKey(prev => {
        const next = { ...prev }
        delete next[providerId]
        return next
      })
      setShowKey(prev => ({ ...prev, [providerId]: false }))
    } catch (err) {
      console.error('Failed to save API key:', err)
    } finally {
      setSavingKey(null)
    }
  }, [editingKey, api])

  const handleDeleteKey = useCallback(async (providerId: string) => {
    setSavingKey(providerId)
    try {
      await api.providerDeleteApiKey(providerId)
      setKeyStatus(prev => ({ ...prev, [providerId]: false }))
    } catch (err) {
      console.error('Failed to delete API key:', err)
    } finally {
      setSavingKey(null)
    }
  }, [api])

  const handleToggleProvider = useCallback(async (providerId: string, enabled: boolean) => {
    await api.providerToggleEnabled(providerId, enabled)
    updateProvider(providerId, { is_enabled: enabled ? 1 : 0 })
  }, [api, updateProvider])

  const handleSetBaseUrl = useCallback(async (providerId: string, baseUrl: string) => {
    await api.providerSetBaseUrl(providerId, baseUrl)
    updateProvider(providerId, { base_url: baseUrl })
  }, [api, updateProvider])

  return (
    <div className="max-w-2xl px-8 py-8">
      <h2 className="text-xl font-semibold display-text mb-1">Providers & API Keys</h2>
      <p className="text-sm text-[var(--ivory-text-3)] mb-8">
        Manage your AI provider connections and API keys. Keys are encrypted using your system credentials.
      </p>

      {adapters.map((adapter: ProviderAdapterInfo) => {
        const provider = providers.find(p => p.slug === adapter.slug)
        const hasKey = provider ? keyStatus[provider.id] : false
        const editing = provider ? editingKey[provider.id] : undefined
        const showing = provider ? showKey[provider.id] : false
        const saving = provider ? savingKey === provider.id : false

        return (
          <div
            key={adapter.slug}
            className="mb-6 p-5 rounded-[var(--radius-lg)] border border-[var(--ivory-border)] bg-[var(--ivory-bg)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold display-text">{adapter.name}</h3>
                <p className="text-xs text-[var(--ivory-text-3)] mt-0.5">{adapter.description}</p>
              </div>
              <Toggle
                checked={provider ? provider.is_enabled === 1 : false}
                onChange={(enabled) => {
                  if (provider) handleToggleProvider(provider.id, enabled)
                }}
              />
            </div>

            {/* API Key */}
            <div className="mb-3">
              <label className="text-sm font-medium text-[var(--ivory-text)] block mb-1.5">
                API Key
              </label>
              {hasKey ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-[var(--ivory-surface)] border border-[var(--ivory-border)] rounded-[var(--radius-md)] px-3 py-2 text-sm text-[var(--ivory-success)] font-mono">
                    ●●●●●●●● Key configured
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (provider) {
                        setEditingKey(prev => ({ ...prev, [provider.id]: '' }))
                      }
                    }}
                  >
                    Change
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => provider && handleDeleteKey(provider.id)}
                    disabled={saving}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Input
                      value={editing || ''}
                      onChange={(e) => {
                        if (provider) {
                          setEditingKey(prev => ({ ...prev, [provider.id]: e.target.value }))
                        }
                      }}
                      placeholder={`Enter your ${adapter.name} API key`}
                      type={showing ? 'text' : 'password'}
                    />
                    <button
                      onClick={() => {
                        if (provider) setShowKey(prev => ({ ...prev, [provider.id]: !showing }))
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)]"
                    >
                      {showing ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => provider && handleSaveKey(provider.id)}
                    disabled={!editing || saving}
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              )}

              {/* Base URL */}
              <div className="mt-3">
                <Input
                  label="Base URL"
                  value={provider?.base_url || adapter.defaultBaseUrl}
                  onChange={(e) => {
                    if (provider) handleSetBaseUrl(provider.id, e.target.value)
                  }}
                  placeholder={adapter.defaultBaseUrl}
                />
              </div>
            </div>

            {/* Default Models */}
            {adapter.defaultModels.length > 0 && (
              <div className="mt-3 pt-3 border-t border-[var(--ivory-border)]">
                <p className="text-xs font-medium text-[var(--ivory-text-2)] mb-2">Available Models</p>
                <div className="flex flex-wrap gap-1.5">
                  {adapter.defaultModels.map(model => (
                    <span
                      key={model.name}
                      className="inline-flex items-center px-2 py-1 text-[11px] rounded-[var(--radius-sm)]
                        bg-[var(--ivory-surface)] text-[var(--ivory-text-2)] border border-[var(--ivory-border)]"
                    >
                      {model.displayName}
                      <span className="text-[var(--ivory-text-3)] ml-1">
                        ({model.contextWindow?.toLocaleString()} ctx)
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
