import React from 'react'
import type { TextArtifact } from '@shared/artifacts'

interface Props {
  artifact: TextArtifact
  onCopy: () => void
}

export function TextArtifactView({ artifact, onCopy }: Props): React.ReactElement {
  return (
    <div className="text-[13px] text-[var(--ivory-text)] leading-relaxed whitespace-pre-wrap font-sans max-h-96 overflow-y-auto" data-testid="text-artifact">
      {artifact.text}
    </div>
  )
}
