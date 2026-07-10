import React from 'react'
import { AlertTriangle, Lightbulb } from 'lucide-react'
import type { ErrorDiagnosticArtifact } from '@shared/artifacts'

interface Props {
  artifact: ErrorDiagnosticArtifact
}

export function ErrorDiagnosticArtifactView({ artifact }: Props): React.ReactElement {
  return (
    <div className="space-y-3" data-testid="error-diagnostic-artifact">
      <div className="p-3 rounded-xl bg-[var(--ivory-error-bg)] border border-[var(--ivory-error)]/20">
        <div className="flex items-center gap-2 mb-1.5">
          <AlertTriangle size={13} className="text-[var(--ivory-error)]" />
          <span className="text-[12px] font-semibold text-[var(--ivory-error)]">Error</span>
        </div>
        <p className="text-[11px] text-[var(--ivory-error)]/80 leading-relaxed">{artifact.errorMessage}</p>
        {artifact.stackTrace && (
          <pre className="mt-2 text-[10px] font-mono text-[var(--ivory-text-3)] bg-[var(--ivory-bg)] p-2 rounded-lg border border-[var(--ivory-border)]/40 max-h-32 overflow-auto whitespace-pre-wrap">
            {artifact.stackTrace}
          </pre>
        )}
      </div>
      {artifact.suggestions.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Lightbulb size={12} className="text-amber-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ivory-text-3)]">Suggestions</span>
          </div>
          <ul className="space-y-1">
            {artifact.suggestions.map((s, i) => (
              <li key={i} className="text-[11px] text-[var(--ivory-text-2)] flex items-start gap-1.5">
                <span className="text-[var(--ivory-accent)] font-semibold shrink-0">{i + 1}.</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
