import React from 'react'
import type { PromptArtifact } from '@shared/artifacts'

interface Props {
  artifact: PromptArtifact
  onCopy: () => void
}

export function PromptArtifactView({ artifact, onCopy }: Props): React.ReactElement {
  return (
    <div className="space-y-2" data-testid="prompt-artifact">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ivory-text-3)]">
          Prompt
        </span>
        {artifact.templateId && (
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--ivory-surface)] text-[var(--ivory-text-3)]">
            {artifact.templateId}
          </span>
        )}
      </div>
      <div className="relative">
        <pre className="text-[12px] text-[var(--ivory-text)] whitespace-pre-wrap leading-relaxed font-sans bg-[var(--ivory-bg)] rounded-xl p-3 border border-[var(--ivory-border)]/60 max-h-80 overflow-y-auto">
          {artifact.prompt}
        </pre>
        <button
          type="button"
          onClick={onCopy}
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-[var(--ivory-elevated)] border border-[var(--ivory-border)] text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] transition-colors cursor-pointer shadow-[var(--shadow-xs)]"
          title="Copy prompt"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 011-2-2V5a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
        </button>
      </div>
    </div>
  )
}
