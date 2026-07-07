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

export function ModelSelector({ value, onChange }: ModelSelectorProps): React.ReactElement {
  const api = useIpc()
  const navigate = useNavigate()
  const [models, setModels] = useState<ModelOption[]>([])
  const [isOpen, setIsOpen] = useState(false)

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

  const selectedModel = models.find(m => m.id === value)
  const hasModels = models.length > 0

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
          hover:bg-[var(--ivory-surface)] hover:border-[var(--ivory-border-2)] transition-all cursor-pointer"
        aria-label={isOpen ? 'Close model selector' : `Select model${selectedModel ? ` (current: ${selectedModel.display_name})` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Zap size={12} className="text-[var(--ivory-accent)]" />
        <span className="max-w-[140px] truncate font-medium">
          {selectedModel ? selectedModel.display_name : 'Select model'}
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
          <div className="absolute top-full right-0 mt-1 w-72 z-20 bg-[var(--ivory-bg)] border border-[var(--ivory-border)] rounded-lg shadow-[var(--shadow-lg)] py-1 max-h-72 overflow-y-auto">
            <button
              onClick={() => handleSelect(null)}
              className="w-full text-left px-3 py-2 text-xs text-[var(--ivory-text-3)] hover:bg-[var(--ivory-surface)] border-b border-[var(--ivory-border)]/50"
            >
              No model selected
            </button>
            {!hasModels && (
              <div className="px-3 py-4 text-center">
                <p className="text-xs text-[var(--ivory-text-3)] mb-2">No models available</p>
                <button
                  onClick={() => { navigate('/settings/providers'); setIsOpen(false) }}
                  className="text-xs text-[var(--ivory-accent)] hover:underline"
                >
                  Configure providers →
                </button>
              </div>
            )}
            {models.map((model) => {
              const isLocal = model.provider_slug === 'ollama' || model.provider_slug === 'lmstudio'
              return (
                <button
                  key={model.id}
                  onClick={() => handleSelect(model.id)}
                  className={`w-full text-left px-3 py-2.5 text-xs hover:bg-[var(--ivory-surface)] transition-colors
                    ${model.id === value ? 'bg-[var(--ivory-surface)] text-[var(--ivory-text)]' : 'text-[var(--ivory-text-2)]'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate font-medium">{model.display_name}</span>
                        {isLocal ? (
                          <span className="text-[10px] px-1 py-0.5 rounded-[var(--radius-sm)] bg-[var(--ivory-success-bg)] text-[var(--ivory-success)] font-medium shrink-0">
                            <Monitor size={10} className="inline mr-0.5" />
                            Local
                          </span>
                        ) : (
                          <span className="text-[10px] px-1 py-0.5 rounded-[var(--radius-sm)] bg-[var(--ivory-surface-2)] text-[var(--ivory-text-3)] font-medium shrink-0">
                            <Globe size={10} className="inline mr-0.5" />
                            Cloud
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-[var(--ivory-text-3)] mt-0.5 truncate">
                        {model.provider_name}
                        {model.context_window ? ` · ${(model.context_window / 1000).toFixed(0)}k ctx` : ''}
                      </div>
                    </div>
                    {model.id === value && (
                      <Zap size={12} className="text-[var(--ivory-accent)] shrink-0" />
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
