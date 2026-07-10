import React from 'react'
import { Terminal, AlertTriangle } from 'lucide-react'
import type { CommandArtifact } from '@shared/artifacts'

interface Props {
  artifact: CommandArtifact
  onCopy: () => void
}

export function CommandArtifactView({ artifact, onCopy }: Props): React.ReactElement {
  return (
    <div className="space-y-2" data-testid="command-artifact">
      <div className="flex items-center gap-2">
        <Terminal size={13} className="text-[var(--ivory-text-3)]" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ivory-text-3)]">Command</span>
        {artifact.cwd && (
          <span className="text-[10px] font-mono text-[var(--ivory-text-3)]">{artifact.cwd}</span>
        )}
      </div>
      {artifact.description && (
        <p className="text-[11px] text-[var(--ivory-text-3)]">{artifact.description}</p>
      )}
      <div className="relative">
        <pre className="text-[11px] font-mono text-[var(--ivory-text)] bg-[var(--ivory-bg)] rounded-xl p-3 border border-[var(--ivory-border)]/60 overflow-x-auto">
          <span className="text-[var(--ivory-text-3)] select-none">$ </span>
          {artifact.command}
        </pre>
        <button
          type="button"
          onClick={onCopy}
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-[var(--ivory-elevated)] border border-[var(--ivory-border)] text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] transition-colors cursor-pointer"
          title="Copy command"
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
