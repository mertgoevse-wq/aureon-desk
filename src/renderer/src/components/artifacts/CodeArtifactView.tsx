import React from 'react'
import type { CodeArtifact } from '@shared/artifacts'

interface Props {
  artifact: CodeArtifact
  onCopy: () => void
}

export function CodeArtifactView({ artifact, onCopy }: Props): React.ReactElement {
  return (
    <div className="space-y-2" data-testid="code-artifact">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ivory-text-3)]">Code</span>
        {artifact.filename && (
          <span className="text-[10px] font-mono text-[var(--ivory-accent)] bg-[var(--ivory-accent-light)]/50 px-1.5 py-0.5 rounded">
            {artifact.filename}
          </span>
        )}
        <span className="text-[10px] text-[var(--ivory-text-3)]">{artifact.language}</span>
        {artifact.generated && (
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 font-medium">AI generated</span>
        )}
      </div>
      <div className="relative">
        <pre className="text-[11px] font-mono text-[var(--ivory-text)] leading-relaxed bg-[var(--ivory-bg)] rounded-xl p-3 border border-[var(--ivory-border)]/60 max-h-[400px] overflow-auto whitespace-pre">
          {artifact.code}
        </pre>
        <button
          type="button"
          onClick={onCopy}
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-[var(--ivory-elevated)] border border-[var(--ivory-border)] text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] transition-colors cursor-pointer shadow-[var(--shadow-xs)]"
          title="Copy code"
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
