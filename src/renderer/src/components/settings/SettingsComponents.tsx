import React from 'react'

interface SettingsSectionProps {
  title: string
  description?: string
  children: React.ReactNode
}

export function SettingsSection({ title, description, children }: SettingsSectionProps): React.ReactElement {
  return (
    <section className="space-y-4 pt-1 pb-4">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-[var(--ivory-text)] display-text">{title}</h3>
        {description && (
          <p className="text-xs text-[var(--ivory-text-3)] leading-relaxed">{description}</p>
        )}
      </div>
      <div className="rounded-2xl border border-[var(--ivory-border)] bg-[var(--ivory-surface)] overflow-hidden divide-y divide-[var(--ivory-border)]">
        {children}
      </div>
    </section>
  )
}

interface SettingsRowProps {
  label: string
  description?: string
  children: React.ReactNode
  dataTestId?: string
}

export function SettingsRow({ label, description, children, dataTestId }: SettingsRowProps): React.ReactElement {
  return (
    <div className="p-4 flex items-center justify-between gap-6 hover:bg-[var(--ivory-elevated)]/20 transition-colors" data-testid={dataTestId}>
      <div className="min-w-0 flex-1 space-y-1">
        <span className="block text-xs font-semibold text-[var(--ivory-text)]">{label}</span>
        {description && (
          <span className="block text-[11px] text-[var(--ivory-text-3)] leading-relaxed">{description}</span>
        )}
      </div>
      <div className="shrink-0 flex items-center gap-3">
        {children}
      </div>
    </div>
  )
}

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  dataTestId?: string
}

export function Toggle({ checked, onChange, disabled = false, dataTestId }: ToggleProps): React.ReactElement {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/30
        ${checked ? 'bg-[var(--ivory-accent)]' : 'bg-[var(--ivory-border)]'}
        ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
      data-testid={dataTestId}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
          ${checked ? 'translate-x-4' : 'translate-x-0'}`}
      />
    </button>
  )
}

interface StatusPillProps {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral'
  children: React.ReactNode
}

export function StatusPill({ variant = 'neutral', children }: StatusPillProps): React.ReactElement {
  const getColors = () => {
    switch (variant) {
      case 'success':
        return 'bg-green-50 text-green-700 border-green-200/50'
      case 'warning':
        return 'bg-amber-50 text-amber-700 border-amber-200/50'
      case 'error':
        return 'bg-rose-50 text-rose-700 border-rose-200/50'
      case 'info':
        return 'bg-blue-50 text-blue-700 border-blue-200/50'
      default:
        return 'bg-[var(--ivory-bg)] text-[var(--ivory-text-2)] border-[var(--ivory-border)]'
    }
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${getColors()}`}>
      {children}
    </span>
  )
}

interface DangerZoneProps {
  label: string
  description: string
  actionLabel: string
  onClick: () => void
  disabled?: boolean
  dataTestId?: string
}

export function DangerZone({ label, description, actionLabel, onClick, disabled = false, dataTestId }: DangerZoneProps): React.ReactElement {
  return (
    <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/40 flex items-center justify-between gap-6" data-testid={dataTestId}>
      <div className="min-w-0 flex-1 space-y-1">
        <span className="block text-xs font-semibold text-rose-800">{label}</span>
        <span className="block text-[11px] text-rose-700/80 leading-relaxed">{description}</span>
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className="px-3.5 py-1.5 rounded-xl border border-rose-200 bg-white text-xs font-semibold text-rose-700 hover:bg-rose-50 active:bg-rose-100/50 transition-colors shadow-[var(--shadow-xs)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        {actionLabel}
      </button>
    </div>
  )
}
