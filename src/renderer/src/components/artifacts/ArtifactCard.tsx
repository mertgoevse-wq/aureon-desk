/**
 * ArtifactCard — the universal artifact renderer.
 *
 * Renders the correct artifact component based on the artifact type.
 * Each artifact component receives the artifact data + a standard set of action callbacks.
 */
import React, { useState, useCallback } from 'react'
import {
  Copy, Check, ChevronDown, ChevronUp, Send,
  Code2, Eye, AlertTriangle, Terminal, BookOpen
} from 'lucide-react'
import type { Artifact } from '@shared/artifacts'

// ---- Individual artifact renderers are imported lazily or inline ----
import { PromptArtifactView } from './PromptArtifactView'
import { CodeArtifactView } from './CodeArtifactView'
import { TextArtifactView } from './TextArtifactView'
import { MarkdownArtifactView } from './MarkdownArtifactView'
import { DiffArtifactView } from './DiffArtifactView'
import { FileTreeArtifactView } from './FileTreeArtifactView'
import { BuildPlanArtifactView } from './BuildPlanArtifactView'
import { CommandArtifactView } from './CommandArtifactView'
import { ErrorDiagnosticArtifactView } from './ErrorDiagnosticArtifactView'
import { TutorialArtifactView } from './TutorialArtifactView'
import { ChecklistArtifactView } from './ChecklistArtifactView'
import { PreviewArtifactView } from './PreviewArtifactView'
import { ProviderSetupArtifactView } from './ProviderSetupArtifactView'

export interface ArtifactActionHandlers {
  onCopy?: (artifact: Artifact) => void
  onSendToComposer?: (artifact: Artifact) => void
  onOpenInCode?: (artifact: Artifact) => void
  onSaveToLibrary?: (artifact: Artifact) => void
  onExpand?: (artifact: Artifact) => void
  onToggleChecklistItem?: (artifactId: string, itemId: string, checked: boolean) => void
}

interface ArtifactCardProps {
  artifact: Artifact
  handlers?: ArtifactActionHandlers
  className?: string
}

export function ArtifactCard({
  artifact,
  handlers,
  className = '',
}: ArtifactCardProps): React.ReactElement {
  const [collapsed, setCollapsed] = useState(artifact.collapsed ?? false)
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    // Attempt to extract copyable content based on artifact type
    let text = ''
    switch (artifact.type) {
      case 'prompt': text = (artifact as any).prompt || ''; break
      case 'code': text = (artifact as any).code || ''; break
      case 'text': text = (artifact as any).text || ''; break
      case 'command': text = (artifact as any).command || ''; break
      case 'markdown': text = (artifact as any).markdown || ''; break
      default: text = artifact.title || ''
    }

    if (text) {
      navigator.clipboard?.writeText(text).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }).catch(() => {})
      handlers?.onCopy?.(artifact)
    }
  }, [artifact, handlers])

  const renderContent = () => {
    switch (artifact.type) {
      case 'prompt':
        return <PromptArtifactView artifact={artifact as any} onCopy={handleCopy} />
      case 'code':
        return <CodeArtifactView artifact={artifact as any} onCopy={handleCopy} />
      case 'text':
        return <TextArtifactView artifact={artifact as any} onCopy={handleCopy} />
      case 'markdown':
        return <MarkdownArtifactView artifact={artifact as any} onCopy={handleCopy} />
      case 'diff':
        return <DiffArtifactView artifact={artifact as any} onCopy={handleCopy} />
      case 'file-tree':
        return <FileTreeArtifactView artifact={artifact as any} />
      case 'build-plan':
        return <BuildPlanArtifactView artifact={artifact as any} onCopy={handleCopy} />
      case 'command':
        return <CommandArtifactView artifact={artifact as any} onCopy={handleCopy} />
      case 'tutorial':
        return <TutorialArtifactView artifact={artifact as any} />
      case 'checklist':
        return (
          <ChecklistArtifactView
            artifact={artifact as any}
            onToggle={handlers?.onToggleChecklistItem}
          />
        )
      case 'preview':
        return <PreviewArtifactView artifact={artifact as any} />
      case 'error-diagnostic':
        return <ErrorDiagnosticArtifactView artifact={artifact as any} />
      case 'provider-setup':
        return <ProviderSetupArtifactView artifact={artifact as any} />
      case 'search-results':
      case 'skill-result':
      default:
        return (
          <TextArtifactView
            artifact={{ type: 'text', title: artifact.title || artifact.type, text: `[${artifact.type}] artifact`, id: artifact.id, createdAt: artifact.createdAt } as any}
            onCopy={handleCopy}
          />
        )
    }
  }

  const riskColor = artifact.risk === 'destructive'
    ? 'border-[var(--ivory-error)]/20'
    : artifact.risk === 'caution'
      ? 'border-[var(--ivory-warning)]/20'
      : 'border-[var(--ivory-border)]'

  return (
    <div
      className={`rounded-2xl border ${riskColor} bg-[var(--ivory-elevated)] shadow-[var(--shadow-sm)] overflow-hidden ${className}`}
      data-testid={`artifact-${artifact.type}`}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--ivory-border)]/40 bg-[var(--ivory-surface)]/50">
        <div className="flex items-center gap-2 min-w-0">
          <ArtifactTypeIcon type={artifact.type} />
          <div className="min-w-0">
            <span className="text-[12px] font-semibold text-[var(--ivory-text)] truncate block">
              {artifact.title}
            </span>
            {artifact.subtitle && (
              <span className="text-[10px] text-[var(--ivory-text-3)] truncate block">
                {artifact.subtitle}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Copy button */}
          {(artifact.type === 'prompt' || artifact.type === 'code' || artifact.type === 'command' || artifact.type === 'text') && (
            <button
              type="button"
              onClick={handleCopy}
              className="p-1.5 rounded-lg text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface)] transition-colors cursor-pointer"
              title={copied ? 'Copied!' : 'Copy'}
            >
              {copied ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
            </button>
          )}

          {/* Send to composer */}
          {artifact.type === 'prompt' && (
            <button
              type="button"
              onClick={() => handlers?.onSendToComposer?.(artifact)}
              className="p-1.5 rounded-lg text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface)] transition-colors cursor-pointer"
              title="Send to composer"
            >
              <Send size={13} />
            </button>
          )}

          {/* Collapse toggle */}
          <button
            type="button"
            onClick={() => {
              setCollapsed(!collapsed)
              if (!collapsed) handlers?.onExpand?.(artifact)
            }}
            className="p-1.5 rounded-lg text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface)] transition-colors cursor-pointer"
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
          </button>
        </div>
      </div>

      {/* Content */}
      {!collapsed && (
        <div className="p-4">
          {renderContent()}
        </div>
      )}
    </div>
  )
}

/** Icon mapping for artifact types */
function ArtifactTypeIcon({ type }: { type: string }): React.ReactElement {
  switch (type) {
    case 'prompt': return <Send size={14} className="text-blue-500" />
    case 'code': return <Code2 size={14} className="text-emerald-500" />
    case 'text': return <BookOpen size={14} className="text-[var(--ivory-text-3)]" />
    case 'markdown': return <BookOpen size={14} className="text-purple-500" />
    case 'diff': return <Code2 size={14} className="text-amber-500" />
    case 'file-tree': return <Code2 size={14} className="text-blue-500" />
    case 'preview': return <Eye size={14} className="text-emerald-500" />
    case 'build-plan': return <Code2 size={14} className="text-purple-500" />
    case 'error-diagnostic': return <AlertTriangle size={14} className="text-red-500" />
    case 'command': return <Terminal size={14} className="text-[var(--ivory-text-3)]" />
    case 'provider-setup': return <Copy size={14} className="text-blue-500" />
    default: return <BookOpen size={14} className="text-[var(--ivory-text-3)]" />
  }
}
