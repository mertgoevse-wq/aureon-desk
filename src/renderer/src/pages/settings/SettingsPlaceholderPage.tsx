import React from 'react'
import { Boxes, LockKeyhole, Shield, Sparkles } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

const pageCopy: Record<string, { title: string; description: string; icon: React.ReactNode }> = {
  '/settings/extensions': {
    title: 'Extensions',
    description: 'Plugin and connector management will live here once Aureon has a dedicated extension registry.',
    icon: <Boxes size={18} />
  },
  '/settings/security': {
    title: 'Privacy & Security',
    description: 'Local data, permission rules, and audit controls will be grouped here as they become configurable.',
    icon: <Shield size={18} />
  },
  '/settings/capabilities': {
    title: 'Capabilities',
    description: 'Desktop and tool capabilities stay explicit. Unsupported access remains inactive until implemented.',
    icon: <LockKeyhole size={18} />
  }
}

export function SettingsPlaceholderPage(): React.ReactElement {
  const navigate = useNavigate()
  const location = useLocation()
  const copy = pageCopy[location.pathname] || {
    title: 'Settings',
    description: 'This settings section is reserved for a future Aureon feature.',
    icon: <Sparkles size={18} />
  }

  return (
    <div data-testid="settings-placeholder-page">
      <section className="rounded-[30px] border border-[var(--ivory-border)] bg-[var(--ivory-elevated)] p-7 shadow-[var(--shadow-md)]">
        <div className="w-12 h-12 rounded-[22px] bg-[var(--ivory-accent-light)] text-[var(--ivory-accent)] flex items-center justify-center mb-5">
          {copy.icon}
        </div>
        <h1 className="text-[28px] font-semibold tracking-tight text-[var(--ivory-text)] display-text">{copy.title}</h1>
        <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-[var(--ivory-text-3)]">{copy.description}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigate('/settings/general')}
            className="h-10 px-4 rounded-2xl border border-[var(--ivory-border)] bg-[var(--ivory-bg)] text-[12px] font-semibold text-[var(--ivory-text-2)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35"
          >
            Open General
          </button>
          <button
            type="button"
            onClick={() => navigate('/settings/providers')}
            className="h-10 px-4 rounded-2xl border border-[var(--ivory-border)] bg-[var(--ivory-bg)] text-[12px] font-semibold text-[var(--ivory-text-2)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35"
          >
            Open Providers
          </button>
        </div>
      </section>
    </div>
  )
}
