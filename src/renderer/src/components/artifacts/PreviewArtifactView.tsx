import React from 'react'
import { Monitor, ExternalLink } from 'lucide-react'
import type { PreviewArtifact } from '@shared/artifacts'

interface Props {
  artifact: PreviewArtifact
}

export function PreviewArtifactView({ artifact }: Props): React.ReactElement {
  const isRunning = artifact.status === 'running' && artifact.url

  return (
    <div className="space-y-2" data-testid="preview-artifact">
      <div className="flex items-center gap-2">
        <Monitor size={13} className="text-[var(--ivory-text-3)]" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ivory-text-3)]">
          Preview
        </span>
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
          artifact.status === 'running' ? 'bg-emerald-50 text-emerald-600' :
          artifact.status === 'error' ? 'bg-red-50 text-red-600' :
          'bg-[var(--ivory-surface)] text-[var(--ivory-text-3)]'
        }`}>
          {artifact.status}
        </span>
        {artifact.port && (
          <span className="text-[10px] text-[var(--ivory-text-3)]">:{artifact.port}</span>
        )}
      </div>

      {isRunning ? (
        <div className="rounded-xl border border-[var(--ivory-border)] overflow-hidden bg-white h-[300px]">
          <iframe
            src={artifact.url}
            title="Live Preview"
            className="w-full h-full border-none"
            sandbox="allow-scripts"
          />
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-[var(--ivory-border)] bg-[var(--ivory-bg)] p-8 text-center">
          <Monitor size={24} className="text-[var(--ivory-text-3)] mx-auto mb-2" />
          <p className="text-[12px] text-[var(--ivory-text-3)]">Preview not available. Server status: {artifact.status}.</p>
        </div>
      )}
    </div>
  )
}
