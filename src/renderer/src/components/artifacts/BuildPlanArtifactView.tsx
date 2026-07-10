import React from 'react'
import { ListChecks } from 'lucide-react'
import type { BuildPlanArtifact } from '@shared/artifacts'

interface Props {
  artifact: BuildPlanArtifact
  onCopy: () => void
}

export function BuildPlanArtifactView({ artifact }: Props): React.ReactElement {
  return (
    <div className="space-y-2" data-testid="build-plan-artifact">
      {artifact.prompt && (
        <div className="rounded-xl border border-[var(--ivory-border)] bg-[var(--ivory-bg)] p-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ivory-text-3)] block mb-1">Prompt</span>
          <p className="text-[11px] text-[var(--ivory-text)] leading-relaxed">{artifact.prompt}</p>
        </div>
      )}
      <div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ivory-text-3)] block mb-1.5">
          <ListChecks size={11} className="inline mr-1" />
          Build Steps ({artifact.steps.length})
        </span>
        <ul className="list-decimal pl-4 text-[11px] text-[var(--ivory-text-2)] space-y-0.5">
          {artifact.steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
