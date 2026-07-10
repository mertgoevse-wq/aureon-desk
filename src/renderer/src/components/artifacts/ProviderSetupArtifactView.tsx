import React from 'react'
import { ExternalLink, KeyRound } from 'lucide-react'
import type { ProviderSetupArtifact } from '@shared/artifacts'

interface Props {
  artifact: ProviderSetupArtifact
}

export function ProviderSetupArtifactView({ artifact }: Props): React.ReactElement {
  return (
    <div className="space-y-3" data-testid="provider-setup-artifact">
      <div className="flex items-center gap-2">
        <KeyRound size={13} className="text-[var(--ivory-accent)]" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ivory-text-3)]">
          Provider Setup
        </span>
        <span className="text-[11px] font-semibold text-[var(--ivory-text)]">{artifact.provider}</span>
      </div>
      <p className="text-[11px] text-[var(--ivory-text-2)] leading-relaxed">{artifact.instructions}</p>
      {artifact.apiKeyHint && (
        <div className="rounded-xl bg-[var(--ivory-bg)] border border-[var(--ivory-border)]/60 p-2.5">
          <span className="text-[10px] font-semibold text-[var(--ivory-text-3)] block mb-1">API Key</span>
          <code className="text-[11px] font-mono text-[var(--ivory-text-2)]">{artifact.apiKeyHint}</code>
        </div>
      )}
      {artifact.setupUrl && (
        <a
          href={artifact.setupUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[var(--ivory-accent)] hover:underline"
        >
          <ExternalLink size={11} />
          Open setup page
        </a>
      )}
    </div>
  )
}
