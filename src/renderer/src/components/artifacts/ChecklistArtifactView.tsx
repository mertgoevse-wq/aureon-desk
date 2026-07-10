import React from 'react'
import { CheckSquare, Square } from 'lucide-react'
import type { ChecklistArtifact } from '@shared/artifacts'

interface Props {
  artifact: ChecklistArtifact
  onToggle?: (artifactId: string, itemId: string, checked: boolean) => void
}

export function ChecklistArtifactView({ artifact, onToggle }: Props): React.ReactElement {
  return (
    <div className="space-y-1" data-testid="checklist-artifact">
      {artifact.items.map((item) => (
        <label
          key={item.id}
          className="flex items-start gap-2.5 py-1.5 px-2 rounded-lg hover:bg-[var(--ivory-surface)]/50 transition-colors cursor-pointer"
        >
          <button
            type="button"
            onClick={() => onToggle?.(artifact.id, item.id, !item.checked)}
            className="shrink-0 mt-0.5 text-[var(--ivory-text-3)] hover:text-[var(--ivory-accent)] transition-colors cursor-pointer"
          >
            {item.checked ? (
              <CheckSquare size={15} className="text-[var(--ivory-accent)]" />
            ) : (
              <Square size={15} />
            )}
          </button>
          <div className="min-w-0">
            <span className={`text-[12px] ${item.checked ? 'line-through text-[var(--ivory-text-3)]' : 'text-[var(--ivory-text)] font-medium'}`}>
              {item.label}
            </span>
            {item.description && (
              <p className="text-[10px] text-[var(--ivory-text-3)] mt-0.5">{item.description}</p>
            )}
          </div>
        </label>
      ))}
    </div>
  )
}
