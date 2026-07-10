import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Check,
  ChevronDown,
  ChevronRight,
  Globe,
  Monitor,
  Search,
  Settings2,
  Zap
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useIpc } from '../../hooks/useIpc'

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

interface ProviderGroup {
  name: string
  slug: string
  isLocal: boolean
  models: ModelOption[]
}

type SmokeStatus = 'untested' | 'pass' | 'fail' | 'testing'

const SMOKE_CACHE_KEY = 'vibeforge-smoke-statuses'

function smokeTestDot(status: SmokeStatus): React.ReactElement {
  const colors: Record<SmokeStatus, string> = {
    pass: 'bg-emerald-500',
    fail: 'bg-amber-500',
    untested: 'bg-gray-300',
    testing: 'bg-gray-400 animate-pulse'
  }
  const titles: Record<SmokeStatus, string> = {
    pass: 'Provider connection verified',
    fail: 'Provider connection failed - check Settings',
    untested: 'Provider has not been tested in this session',
    testing: 'Testing provider connection'
  }
  return (
    <span
      className={`inline-block h-2 w-2 shrink-0 rounded-full ${colors[status]}`}
      title={titles[status]}
      aria-label={titles[status]}
    />
  )
}

function isLocalProvider(model: ModelOption): boolean {
  return Boolean(model.is_local || model.provider_slug === 'ollama' || model.provider_slug === 'lmstudio')
}

export function ModelSelector({ value, onChange }: ModelSelectorProps): React.ReactElement {
  const api = useIpc()
  const navigate = useNavigate()
  const searchRef = useRef<HTMLInputElement>(null)
  const [models, setModels] = useState<ModelOption[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeProvider, setActiveProvider] = useState<string | null>(null)
  const [smokeStatuses, setSmokeStatuses] = useState<Record<string, SmokeStatus>>({})
  const [smokeTesting, setSmokeTesting] = useState(false)

  useEffect(() => {
    api.modelAllEnabled().then((data: ModelOption[]) => {
      setModels([...(data || [])].sort((a, b) => {
        const localDelta = Number(isLocalProvider(b)) - Number(isLocalProvider(a))
        if (localDelta !== 0) return localDelta
        const providerDelta = a.provider_name.localeCompare(b.provider_name)
        return providerDelta || a.display_name.localeCompare(b.display_name)
      }))
    }).catch(console.error)
  }, [api])

  useEffect(() => {
    const cached = sessionStorage.getItem(SMOKE_CACHE_KEY)
    if (cached) {
      try {
        setSmokeStatuses(JSON.parse(cached))
        return
      } catch {
        sessionStorage.removeItem(SMOKE_CACHE_KEY)
      }
    }

    setSmokeTesting(true)
    api.providerSmokeTestAll().then((result: {
      results: Array<{ providerName: string; success: boolean }>
    }) => {
      const statuses: Record<string, SmokeStatus> = {}
      for (const item of result.results) statuses[item.providerName] = item.success ? 'pass' : 'fail'
      setSmokeStatuses(statuses)
      try { sessionStorage.setItem(SMOKE_CACHE_KEY, JSON.stringify(statuses)) } catch { /* optional cache */ }
    }).catch(() => {
      // Settings remains the source of truth when a smoke test is unavailable.
    }).finally(() => setSmokeTesting(false))
  }, [api])

  const providerGroups = useMemo<ProviderGroup[]>(() => {
    const grouped = new Map<string, ProviderGroup>()
    for (const model of models) {
      const existing = grouped.get(model.provider_name)
      if (existing) existing.models.push(model)
      else grouped.set(model.provider_name, {
        name: model.provider_name,
        slug: model.provider_slug,
        isLocal: isLocalProvider(model),
        models: [model]
      })
    }
    return [...grouped.values()].sort((a, b) => {
      const localDelta = Number(b.isLocal) - Number(a.isLocal)
      return localDelta || a.name.localeCompare(b.name)
    })
  }, [models])

  const filteredGroups = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase()
    if (!needle) return providerGroups
    return providerGroups
      .map(group => ({
        ...group,
        models: group.models.filter(model =>
          group.name.toLocaleLowerCase().includes(needle)
          || model.display_name.toLocaleLowerCase().includes(needle)
          || model.name.toLocaleLowerCase().includes(needle)
        )
      }))
      .filter(group => group.models.length > 0)
  }, [providerGroups, query])

  const selectedModel = models.find(model => model.id === value)
  const visibleProvider = filteredGroups.find(group => group.name === activeProvider) ?? filteredGroups[0]

  useEffect(() => {
    if (!isOpen) return
    setActiveProvider(selectedModel?.provider_name ?? providerGroups[0]?.name ?? null)
    setQuery('')
    window.setTimeout(() => searchRef.current?.focus(), 0)
  }, [isOpen, providerGroups, selectedModel?.provider_name])

  useEffect(() => {
    if (visibleProvider && visibleProvider.name !== activeProvider) setActiveProvider(visibleProvider.name)
  }, [activeProvider, visibleProvider])

  const handleSelect = useCallback((modelId: string | null) => {
    onChange(modelId)
    setIsOpen(false)
    setQuery('')
  }, [onChange])

  const selectedSmoke: SmokeStatus = selectedModel
    ? smokeStatuses[selectedModel.provider_name] || (smokeTesting ? 'testing' : 'untested')
    : smokeTesting ? 'testing' : 'untested'

  return (
    <div className="relative" data-testid="model-selector">
      <button
        type="button"
        onClick={() => setIsOpen(open => !open)}
        className="flex items-center gap-2 rounded-xl border border-[var(--ivory-border)] bg-[var(--ivory-elevated)] px-3 py-2 text-xs text-[var(--ivory-text-2)] shadow-[var(--shadow-xs)] transition hover:border-[var(--ivory-border-2)] hover:bg-[var(--ivory-surface)] cursor-pointer"
        aria-label={isOpen ? 'Close provider and model selector' : 'Choose provider and model'}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        {smokeTestDot(selectedSmoke)}
        <Zap size={13} className="text-[var(--ivory-accent)]" />
        <span className="max-w-[220px] truncate font-semibold">
          {selectedModel ? `${selectedModel.provider_name} / ${selectedModel.display_name}` : 'Choose provider and model'}
        </span>
        <ChevronDown size={13} className="text-[var(--ivory-text-3)]" />
      </button>

      {isOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-30 cursor-default"
            aria-label="Close model menu"
            onClick={() => setIsOpen(false)}
          />
          <div
            className="absolute right-0 top-full z-40 mt-2 w-[560px] max-w-[calc(100vw-32px)] overflow-hidden rounded-[20px] border border-[var(--ivory-border)] bg-[var(--ivory-elevated)] shadow-[var(--shadow-xl)]"
            role="dialog"
            aria-label="Provider and model selection"
            data-testid="provider-model-menu"
          >
            <div className="border-b border-[var(--ivory-border)] p-3">
              <label className="flex items-center gap-2 rounded-xl border border-[var(--ivory-border)] bg-[var(--ivory-bg)] px-3 py-2">
                <Search size={14} className="shrink-0 text-[var(--ivory-text-3)]" />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                  placeholder="Search providers and models"
                  className="min-w-0 flex-1 bg-transparent text-xs text-[var(--ivory-text)] outline-none placeholder:text-[var(--ivory-text-3)]"
                  data-testid="model-search"
                />
              </label>
            </div>

            {filteredGroups.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm font-semibold text-[var(--ivory-text)]">No matching model</p>
                <p className="mt-1 text-xs text-[var(--ivory-text-3)]">Try another search or configure a provider.</p>
              </div>
            ) : (
              <div className="grid min-h-[260px] grid-cols-[190px_minmax(0,1fr)]">
                <div className="border-r border-[var(--ivory-border)] bg-[var(--ivory-surface)]/55 p-2">
                  <p className="px-2 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--ivory-text-3)]">Provider</p>
                  <div className="max-h-[330px] space-y-1 overflow-y-auto">
                    {filteredGroups.map(group => {
                      const active = group.name === visibleProvider?.name
                      const smoke = smokeStatuses[group.name] || (smokeTesting ? 'testing' : 'untested')
                      return (
                        <button
                          type="button"
                          key={group.name}
                          onMouseEnter={() => setActiveProvider(group.name)}
                          onFocus={() => setActiveProvider(group.name)}
                          onClick={() => setActiveProvider(group.name)}
                          className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-xs transition cursor-pointer ${active ? 'bg-[var(--ivory-elevated)] text-[var(--ivory-text)] shadow-[var(--shadow-xs)]' : 'text-[var(--ivory-text-2)] hover:bg-[var(--ivory-elevated)]/70'}`}
                          data-testid={`provider-option-${group.slug}`}
                        >
                          {smokeTestDot(smoke)}
                          {group.isLocal ? <Monitor size={13} /> : <Globe size={13} />}
                          <span className="min-w-0 flex-1 truncate font-semibold">{group.name}</span>
                          <ChevronRight size={12} className="text-[var(--ivory-text-3)]" />
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="p-2">
                  <div className="flex items-center justify-between px-2 pb-2 pt-1">
                    <div>
                      <p className="text-xs font-bold text-[var(--ivory-text)]">{visibleProvider?.name}</p>
                      <p className="text-[10px] text-[var(--ivory-text-3)]">Choose a model</p>
                    </div>
                    <span className="rounded-full bg-[var(--ivory-surface)] px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-[var(--ivory-text-3)]">
                      {visibleProvider?.isLocal ? 'Local' : 'Cloud'}
                    </span>
                  </div>
                  <div className="max-h-[290px] space-y-1 overflow-y-auto">
                    {visibleProvider?.models.map(model => {
                      const selected = model.id === value
                      return (
                        <button
                          type="button"
                          key={model.id}
                          onClick={() => handleSelect(model.id)}
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition cursor-pointer ${selected ? 'bg-[var(--ivory-accent-light)] text-[var(--ivory-text)]' : 'text-[var(--ivory-text-2)] hover:bg-[var(--ivory-surface)]'}`}
                          data-testid={`model-option-${model.id}`}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold">{model.display_name}</p>
                            <p className="mt-0.5 truncate text-[10px] text-[var(--ivory-text-3)]">
                              {model.context_window ? `${Math.round(model.context_window / 1000)}k context` : model.name}
                            </p>
                          </div>
                          {selected && <Check size={14} className="shrink-0 text-[var(--ivory-accent)]" />}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-[var(--ivory-border)] bg-[var(--ivory-surface)]/45 px-3 py-2">
              <button type="button" onClick={() => handleSelect(null)} className="text-[11px] font-medium text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] cursor-pointer">
                Clear selection
              </button>
              <button
                type="button"
                onClick={() => { setIsOpen(false); navigate('/settings/providers') }}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[var(--ivory-accent)] hover:underline cursor-pointer"
              >
                <Settings2 size={12} /> Manage providers
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
