import React from 'react'
import ReactMarkdown from 'react-markdown'
import type { MarkdownArtifact } from '@shared/artifacts'

interface Props {
  artifact: MarkdownArtifact
  onCopy: () => void
}

export function MarkdownArtifactView({ artifact }: Props): React.ReactElement {
  return (
    <div className="prose prose-sm max-w-none text-[var(--ivory-text)]" data-testid="markdown-artifact">
      <ReactMarkdown>{artifact.markdown}</ReactMarkdown>
    </div>
  )
}
