import React from 'react'
import {
  AppWindow,
  EyeOff,
  Globe,
  Monitor,
  MousePointer2,
  ScreenShare,
  ShieldCheck
} from 'lucide-react'

interface PermissionRow {
  title: string
  description: string
  status: string
  icon: React.ReactNode
}

const permissionRows: PermissionRow[] = [
  {
    title: 'Browser Use',
    description: 'Future browser automation entry point. Currently inactive.',
    status: 'Placeholder',
    icon: <Globe size={16} />
  },
  {
    title: 'Computer Use',
    description: 'Desktop control is not enabled until explicit implementation and permission checks exist.',
    status: 'Off',
    icon: <MousePointer2 size={16} />
  },
  {
    title: 'Unhide apps',
    description: 'App visibility controls will live here when desktop permissions are implemented.',
    status: 'Not configured',
    icon: <AppWindow size={16} />
  },
  {
    title: 'Denied apps',
    description: 'Blocked app rules are shown as a placeholder until there is an app permission registry.',
    status: 'None',
    icon: <EyeOff size={16} />
  },
  {
    title: 'Accessibility status',
    description: 'Aureon is not requesting operating-system accessibility permissions in this build.',
    status: 'Not requested',
    icon: <Monitor size={16} />
  },
  {
    title: 'Screen Recording status',
    description: 'Screen capture permissions are not requested by this workspace shell.',
    status: 'Not requested',
    icon: <ScreenShare size={16} />
  }
]

export function GeneralSettingsPage(): React.ReactElement {
  return (
    <div data-testid="settings-general-page">
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--ivory-border)] bg-[var(--ivory-elevated)] text-[11px] font-semibold text-[var(--ivory-text-3)] mb-3">
          <ShieldCheck size={13} className="text-[var(--ivory-accent)]" />
          Local workspace defaults
        </div>
        <h1 className="text-[28px] font-semibold tracking-tight text-[var(--ivory-text)] display-text">General</h1>
        <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[var(--ivory-text-3)]">
          Core workspace behavior and permission surfaces. Unsupported desktop features are visible as placeholders so they never look silently broken.
        </p>
      </div>

      <section className="rounded-[28px] border border-[var(--ivory-border)] bg-[var(--ivory-elevated)] shadow-[var(--shadow-md)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--ivory-border)]">
          <h2 className="text-[15px] font-semibold text-[var(--ivory-text)]">Permissions and desktop access</h2>
          <p className="mt-1 text-[11px] text-[var(--ivory-text-3)]">Rows are intentionally explicit about what is active and what is not.</p>
        </div>
        <div className="divide-y divide-[var(--ivory-border)]">
          {permissionRows.map((row) => (
            <div key={row.title} className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-9 h-9 rounded-2xl border border-[var(--ivory-border)] bg-[var(--ivory-bg)] text-[var(--ivory-accent)] flex items-center justify-center shrink-0">
                  {row.icon}
                </div>
                <div className="min-w-0">
                  <h3 className="text-[13px] font-semibold text-[var(--ivory-text)]">{row.title}</h3>
                  <p className="mt-1 text-[11px] leading-relaxed text-[var(--ivory-text-3)]">{row.description}</p>
                </div>
              </div>
              <div className="shrink-0 flex items-center gap-3">
                <span className="rounded-full border border-[var(--ivory-border)] bg-[var(--ivory-bg)] px-2.5 py-1 text-[10px] font-semibold text-[var(--ivory-text-3)]">
                  {row.status}
                </span>
                <button
                  type="button"
                  disabled
                  className="relative h-6 w-11 rounded-full bg-[var(--ivory-surface-2)] border border-[var(--ivory-border)] opacity-70 cursor-not-allowed"
                  aria-label={`${row.title} disabled placeholder`}
                >
                  <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-[var(--ivory-elevated)] shadow-[var(--shadow-xs)]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
