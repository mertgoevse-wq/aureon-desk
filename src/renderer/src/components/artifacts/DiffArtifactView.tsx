import React from 'react'
import type { DiffArtifact, DiffLine } from '@shared/artifacts'

interface Props {
  artifact: DiffArtifact
  onCopy: () => void
}

export function DiffArtifactView({ artifact, onCopy }: Props): React.ReactElement {
  return (
    <div data-testid="diff-artifact">
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ivory-text-3)]">Diff</span>
        {artifact.filePath && (
          <span className="text-[10px] font-mono text-[var(--ivory-text-2)]">{artifact.filePath}</span>
        )}
        <span className="text-[10px] text-[var(--ivory-text-3)]">
          <span className="text-emerald-600 font-semibold">+{artifact.lines.filter(l => l.type === 'add').length}</span>
          {' '}/{' '}
          <span className="text-red-600 font-semibold">-{artifact.lines.filter(l => l.type === 'remove').length}</span>
        </span>
      </div>
      <div className="rounded-xl border border-[var(--ivory-border)] overflow-hidden font-mono text-[11px] bg-[var(--ivory-bg)] max-h-[400px] overflow-auto">
        {artifact.lines.map((line, i) => (
          <div
            key={i}
            className={`flex items-start gap-2 px-3 py-0.5 leading-relaxed ${
              line.type === 'add'
                ? 'bg-emerald-50/50 text-emerald-800'
                : line.type === 'remove'
                  ? 'bg-red-50/50 text-red-800'
                  : 'text-[var(--ivory-text-2)]'
            }`}
          >
            <span className="shrink-0 w-5 text-center select-none opacity-50 text-[10px]">
              {line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '}
            </span>
            <span className="break-all whitespace-pre-wrap">{line.content || ' '}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
