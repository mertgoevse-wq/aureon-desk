import React, { useCallback, useEffect, useState } from 'react'
import { ChevronDown, Zap } from 'lucide-react'
import { useIpc } from '../../hooks/useIpc'

interface ModelSelectorProps {
  value: string | null
  onChange: (modelId: string | null) => void
}

export function ModelSelector({ value, onChange }: ModelSelectorProps): React.ReactElement {
  const api = useIpc()
  const [models, setModels] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    api.modelAllEnabled().then(setModels).catch(console.error)
  }, [api])

  const selectedModel = models.find((m: any) => m.id === value)

  const handleSelect = useCallback((modelId: string | null) => {
    onChange(modelId)
    setIsOpen(false)
  }, [onChange])

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-[var(--radius-md)]
          bg-[var(--ivory-surface)] border border-[var(--ivory-border)] text-[var(--ivory-text-2)]
          hover:bg-[var(--ivory-surface-2)] transition-colors"
      >
        <Zap size={12} className="text-[var(--ivory-accent)]" />
        <span className="max-w-[140px] truncate">
          {selectedModel ? selectedModel.display_name : 'Select model'}
        </span>
        <ChevronDown size={12} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-1 w-64 z-20 bg-[var(--ivory-bg)] border border-[var(--ivory-border)] rounded-[var(--radius-md)] shadow-[var(--shadow-lg)] py-1 max-h-60 overflow-y-auto">
            <button
              onClick={() => handleSelect(null)}
              className="w-full text-left px-3 py-1.5 text-xs text-[var(--ivory-text-3)] hover:bg-[var(--ivory-surface)]"
            >
              No model selected
            </button>
            {models.map((model: any) => (
              <button
                key={model.id}
                onClick={() => handleSelect(model.id)}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-[var(--ivory-surface)] transition-colors
                  ${model.id === value ? 'bg-[var(--ivory-surface)] text-[var(--ivory-text)]' : 'text-[var(--ivory-text-2)]'}`}
              >
                <div className="flex items-center justify-between">
                  <span>{model.display_name}</span>
                  <span className="text-[10px] text-[var(--ivory-text-3)]">{model.provider_name || model.provider_slug}</span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
