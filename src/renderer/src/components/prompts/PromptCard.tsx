import React from 'react'
import { Edit2, Trash2, Copy, Star, BarChart3 } from 'lucide-react'
import { Badge } from '../shared/Badge'
import type { PromptRow } from '@shared/types/prompt'

interface PromptCardProps {
  prompt: PromptRow
  onEdit: (prompt: PromptRow) => void
  onDelete: (id: string) => void
  onCopy: (content: string) => void
  onToggleFavorite: (id: string) => void
}

export function PromptCard({
  prompt,
  onEdit,
  onDelete,
  onCopy,
  onToggleFavorite
}: PromptCardProps): React.ReactElement {
  const tags: string[] = safeParseTags(prompt.tags)
  const isFavorite = prompt.favorite === 1
  const usageCount = prompt.usage_count || 0

  return (
    <div className="group p-4 rounded-[var(--radius-lg)] border border-[var(--ivory-border)] bg-[var(--ivory-bg)] hover:border-[var(--ivory-border-2)] transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => onToggleFavorite(prompt.id)}
            className={`shrink-0 transition-colors ${isFavorite ? 'text-amber-500' : 'text-[var(--ivory-text-3)] hover:text-amber-400'}`}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star size={14} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
          <h3 className="text-sm font-semibold display-text text-[var(--ivory-text)] truncate">
            {prompt.title}
          </h3>
          {prompt.is_template === 1 && (
            <Badge variant="warning" size="sm">template</Badge>
          )}
          {prompt.source && (
            <Badge variant="default" size="sm">
              {prompt.source.replace('import:', '')}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
          <button
            onClick={() => onCopy(prompt.content)}
            className="p-1.5 rounded-[var(--radius-sm)] text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface)] transition-colors"
            title="Copy content"
          >
            <Copy size={14} />
          </button>
          <button
            onClick={() => onEdit(prompt)}
            className="p-1.5 rounded-[var(--radius-sm)] text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface)] transition-colors"
            title="Edit"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => onDelete(prompt.id)}
            className="p-1.5 rounded-[var(--radius-sm)] text-[var(--ivory-text-3)] hover:text-[var(--ivory-error)] hover:bg-[var(--ivory-error-bg)] transition-colors"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {prompt.description && (
        <p className="text-xs text-[var(--ivory-text-3)] mb-2">{prompt.description}</p>
      )}

      <div className="bg-[var(--ivory-surface)] rounded-[var(--radius-md)] p-2.5 mb-2 border border-[var(--ivory-border)]">
        <pre className="text-[11px] text-[var(--ivory-text-2)] whitespace-pre-wrap line-clamp-3 font-mono leading-relaxed">
          {prompt.content}
        </pre>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1 items-center">
          {tags.map(tag => (
            <Badge key={tag} variant="default" size="sm">{tag}</Badge>
          ))}
          {prompt.category && (
            <Badge variant="success" size="sm">{prompt.category}</Badge>
          )}
          {usageCount > 0 && (
            <span className="text-[10px] text-[var(--ivory-text-3)] flex items-center gap-0.5 ml-1">
              <BarChart3 size={10} />
              {usageCount}
            </span>
          )}
        </div>
        <span className="text-[10px] text-[var(--ivory-text-3)]">
          {new Date(prompt.updated_at).toLocaleDateString()}
        </span>
      </div>
    </div>
  )
}

function safeParseTags(tags: string | null): string[] {
  if (!tags) return []
  try { return JSON.parse(tags) }
  catch { return [] }
}
