import React, { useCallback, useEffect, useState } from 'react'
import { ChevronDown, Zap, Monitor, Globe } from 'lucide-react'
import { useIpc } from '../../hooks/useIpc'
import { useNavigate } from 'react-router-dom'

interface ModelSelectorProps {
  value: string | null
  onChange: (modelId: string | null) => void
}

interface ModelOption {
  id: string
  name: string
  display_name: string
  provider_name: string
  provider_slug: string
  context_window?: number
  is_local?: boolean
}

/** Provider-level smoke test status for connection indicator dots */
type SmokeStatus = 'untested' | 'pass' | 'fail' | 'testing'

function smokeTestDot(status: SmokeStatus): React.ReactElement {
  const colors: Record<SmokeStatus, string> = {
    pass: 'bg-emerald-500',
    fail: 'bg-amber-500',
    untested: 'bg-gray-300',
    testing: 'bg-gray-400 animate-pulse',
  }
  const titles: Record<SmokeStatus, string> = {
    pass: 'Provider connection verified',
    fail: 'Provider connection failed — check Settings',
    untested: 'Not tested yet — run smoke test in Settings',
    testing: 'Testing connection…',
  }
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full shrink-0 ${colors[status]}`}
      title={titles[status]}
      aria-label={titles[status]}
    />
  )
}

export function ModelSelector({ value, onChange }: ModelSelectorProps): React.ReactElement {
  const api = useIpc()
  const navigate = useNavigate()
  const [models, setModels] = useState<ModelOption[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [smokeStatuses, setSmokeStatuses] = useState<Record<string, SmokeStatus>>({})
  const [smokeTesting, setSmokeTesting] = useState(false)

  const SMOKE_CACHE_KEY = 'aureon-smoke-statuses'

  // Fetch enabled models
  useEffect(() => {
    api.modelAllEnabled().then((data: ModelOption[]) => {
      // Sort: local providers first, then remote, then by display name
      const sorted = [...(data || [])].sort((a: ModelOption, b: ModelOption) => {
        const aLocal = a.provider_slug === 'ollama' || a.provider_slug === 'lmstudio' ? 0 : 1
        const bLocal = b.provider_slug === 'ollama' || b.provider_slug === 'lmstudio' ? 0 : 1
        if (aLocal !== bLocal) return aLocal - bLocal
        return a.display_name.localeCompare(b.display_name)
      })
      setModels(sorted)
    }).catch(console.error)
  }, [api])

  // Load smoke test results once per session (cached in sessionStorage).
  // Uses provider_name for cross-referencing since providerSmokeTestAll returns
  // results keyed by display name, not DB UUID or adapter slug.
  useEffect(() => {
    // Try cached results first
    const cached = sessionStorage.getItem(SMOKE_CACHE_KEY)
    if (cached) {
      try {
        setSmokeStatuses(JSON.parse(cached))
        return
      } catch { /* corrupted cache — re-run */ }
    }

    // No cache — run smoke tests once
    setSmokeTesting(true)
    api.providerSmokeTestAll().then((result: { results: Array<{ providerId: string; providerName: string; success: boolean }>; total: number; passed: number; failed: number; skipped: number }) => {
      const statuses: Record<string, SmokeStatus> = {}
      for (const r of result.results) {
        // Key by provider name — models expose provider_name, smoke results expose providerName.
        // Note: if two providers share the same display name, the last result wins.
        statuses[r.providerName] = r.success ? 'pass' : 'fail'
      }
      setSmokeStatuses(statuses)
      // Cache for this session
      try { sessionStorage.setItem(SMOKE_CACHE_KEY, JSON.stringify(statuses)) } catch { /* ignore */ }
    }).catch(() => {
      // Smoke test unavailable — all dots remain 'untested'
    }).finally(() => {
      setSmokeTesting(false)
    })
  }, [api])

  const selectedModel = models.find(m => m.id === value)
  const selectedLabel = selectedModel ? `${selectedModel.provider_name} · ${selectedModel.display_name}` : 'Select model'
  const hasModels = models.length > 0
  // Smoke status for selected model's provider (main button dot)
  // Key by provider_name to match smoke test results
  const selectedSmoke: SmokeStatus = selectedModel
    ? (smokeStatuses[selectedModel.provider_name] || (smokeTesting ? 'testing' : 'untested'))
    : smokeTesting ? 'testing' : 'untested'

  const handleSelect = useCallback((modelId: string | null) => {
    onChange(modelId)
    setIsOpen(false)
  }, [onChange])

  return (
    <div className="relative" data-testid="model-selector">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full
          bg-[var(--ivory-bg)] border border-[var(--ivory-border)] text-[var(--ivory-text-2)]
          hover:bg-[var(--ivory-surface)] hover:border-[var(--ivory-border-2)] transition cursor-pointer"
        aria-label={isOpen ? 'Close model selector' : `Select model${selectedModel ? ` (current: ${selectedModel.display_name})` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {smokeTestDot(selectedSmoke)}
        <Zap size={12} className="text-[var(--ivory-accent)]" />
        <span className="max-w-[180px] truncate font-medium">
          {selectedLabel}
        </span>
        {selectedModel && (
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${
            selectedModel.provider_slug === 'ollama' || selectedModel.provider_slug === 'lmstudio'
              ? 'bg-[var(--ivory-success-bg)] text-[var(--ivory-success)]'
              : 'bg-[var(--ivory-accent-light)] text-[var(--ivory-accent)]'
          }`}>
            {selectedModel.provider_slug === 'ollama' || selectedModel.provider_slug === 'lmstudio' ? 'Local' : 'Cloud'}
          </span>
        )}
        <ChevronDown size={12} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full right-0 mt-2 w-72 z-20 bg-[var(--ivory-elevated)] border border-[var(--ivory-border)] rounded-[18px] shadow-[var(--shadow-xl)] py-1.5 max-h-72 overflow-y-auto p-1">
            <button
              onClick={() => handleSelect(null)}
              className="w-[calc(100%-8px)] mx-1 text-left px-3 py-2 text-xs text-[var(--ivory-text-3)] hover:bg-[var(--ivory-surface)] rounded-xl border-b border-[var(--ivory-border)]/50 transition-colors cursor-pointer"
            >
              No model selected
            </button>
            {!hasModels && (
              <div className="px-3 py-4 text-center">
                <p className="text-xs text-[var(--ivory-text-3)] mb-2">No models available</p>
                <button
                  onClick={() => { navigate('/settings/providers'); setIsOpen(false) }}
                  className="text-xs text-[var(--ivory-accent)] hover:underline cursor-pointer"
                >
                  Configure providers →
                </button>
              </div>
            )}
            <div className="space-y-0.5 mt-1">
              {models.map((model) => {
                const isLocal = model.provider_slug === 'ollama' || model.provider_slug === 'lmstudio'
                const isSelected = model.id === value
                const smoke: SmokeStatus = smokeStatuses[model.provider_name] || (smokeTesting ? 'testing' : 'untested')
                return (
                  <button
                    key={model.id}
                    onClick={() => handleSelect(model.id)}
                    className={`w-[calc(100%-8px)] mx-1 text-left px-3 py-2 text-xs rounded-xl transition-colors cursor-pointer
                      ${isSelected ? 'bg-[var(--ivory-surface)] text-[var(--ivory-text)] font-semibold' : 'text-[var(--ivory-text-2)] hover:bg-[var(--ivory-surface)]'}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          {smokeTestDot(smoke)}
                          <span className="truncate font-medium">{model.display_name}</span>
                          {isLocal ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--ivory-success-bg)] text-[var(--ivory-success)] font-medium shrink-0">
                              Local
                            </span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--ivory-accent-light)] text-[var(--ivory-accent)] font-medium shrink-0">
                              Cloud
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-[var(--ivory-text-3)] mt-0.5 truncate">
                          {model.provider_name}
                          {model.context_window ? ` · ${(model.context_window / 1000).toFixed(0)}k ctx` : ''}
                        </div>
                      </div>
                      {isSelected && (
                        <Zap size={12} className="text-[var(--ivory-accent)] shrink-0" />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
