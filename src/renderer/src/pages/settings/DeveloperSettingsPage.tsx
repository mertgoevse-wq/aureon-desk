import React from 'react'
import { Activity, Bug, FileText, PlayCircle, TestTube2, Wrench } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const developerCards = [
  {
    title: 'Logs & Debug',
    description: 'Open runtime logs, export diagnostics, and inspect recent app events.',
    icon: <FileText size={17} />,
    action: 'Open logs',
    path: '/settings/logs'
  },
  {
    title: 'Provider Test Center',
    description: 'Run connection checks against configured providers and models.',
    icon: <TestTube2 size={17} />,
    action: 'Open providers',
    path: '/settings/providers'
  },
  {
    title: 'LivePreview diagnostics',
    description: 'Use the code workspace to verify rendering and preview behavior.',
    icon: <PlayCircle size={17} />,
    action: 'Open Code',
    path: '/preview'
  }
]

export function DeveloperSettingsPage(): React.ReactElement {
  const navigate = useNavigate()

  return (
    <div data-testid="settings-developer-page">
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--ivory-border)] bg-[var(--ivory-elevated)] text-[11px] font-semibold text-[var(--ivory-text-3)] mb-3">
          <Bug size={13} className="text-[var(--ivory-accent)]" />
          Debug surface
        </div>
        <h1 className="text-[28px] font-semibold tracking-tight text-[var(--ivory-text)] display-text">Developer</h1>
        <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[var(--ivory-text-3)]">
          Shortcuts for validation, logs, provider checks, and preview debugging.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-5">
        {developerCards.map((card) => (
          <section key={card.title} className="rounded-[24px] border border-[var(--ivory-border)] bg-[var(--ivory-elevated)] p-4 shadow-[var(--shadow-sm)]">
            <div className="w-10 h-10 rounded-2xl bg-[var(--ivory-accent-light)] text-[var(--ivory-accent)] flex items-center justify-center mb-4">
              {card.icon}
            </div>
            <h2 className="text-[14px] font-semibold text-[var(--ivory-text)]">{card.title}</h2>
            <p className="mt-2 min-h-[52px] text-[12px] leading-relaxed text-[var(--ivory-text-3)]">{card.description}</p>
            <button
              type="button"
              onClick={() => navigate(card.path)}
              className="mt-4 h-9 px-3 rounded-2xl border border-[var(--ivory-border)] bg-[var(--ivory-bg)] text-[12px] font-semibold text-[var(--ivory-text-2)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35"
            >
              {card.action}
            </button>
          </section>
        ))}
      </div>

      <section className="rounded-[28px] border border-[var(--ivory-border)] bg-[var(--ivory-elevated)] p-5 shadow-[var(--shadow-md)]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl border border-[var(--ivory-border)] bg-[var(--ivory-bg)] text-[var(--ivory-accent)] flex items-center justify-center">
            <Activity size={17} />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-[var(--ivory-text)]">Validation checklist</h2>
            <p className="text-[11px] text-[var(--ivory-text-3)]">Commands expected before shipping a UI pass.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {['npm run typecheck', 'npm test', 'npm run build', 'npm run test:e2e'].map((command) => (
            <div key={command} className="rounded-2xl border border-[var(--ivory-border)] bg-[var(--ivory-bg)] px-3 py-3">
              <div className="flex items-center gap-2 text-[12px] font-semibold text-[var(--ivory-text)]">
                <Wrench size={13} className="text-[var(--ivory-accent)]" />
                {command}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
