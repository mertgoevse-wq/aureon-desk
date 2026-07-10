import React, { useState } from 'react'
import { ChevronDown, ChevronRight, Lightbulb } from 'lucide-react'
import type { TutorialArtifact } from '@shared/artifacts'

interface Props {
  artifact: TutorialArtifact
}

export function TutorialArtifactView({ artifact }: Props): React.ReactElement {
  return (
    <div className="space-y-2" data-testid="tutorial-artifact">
      {artifact.cards.map((card) => (
        <TutorialCardView key={card.id} card={card} />
      ))}
    </div>
  )
}

function TutorialCardView({ card }: { card: { id: string; icon?: string; question: string; answer: string } }): React.ReactElement {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-xl border border-[var(--ivory-border)]/60 bg-[var(--ivory-bg)] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-[12px] font-semibold text-[var(--ivory-text)] hover:bg-[var(--ivory-surface)]/50 transition-colors cursor-pointer"
      >
        {open ? <ChevronDown size={13} className="text-[var(--ivory-text-3)]" /> : <ChevronRight size={13} className="text-[var(--ivory-text-3)]" />}
        <Lightbulb size={13} className="text-[var(--ivory-accent)]" />
        <span>{card.question}</span>
      </button>
      {open && (
        <div className="px-4 pb-3 pt-1 border-t border-[var(--ivory-border)]/30">
          <p className="text-[11px] text-[var(--ivory-text-2)] leading-relaxed">{card.answer}</p>
        </div>
      )}
    </div>
  )
}
