import React from 'react'

interface ToggleProps {
  /** Optional label text shown beside the toggle */
  label?: string
  /** Optional description shown below the label */
  description?: string
  /** Whether the toggle is checked */
  checked: boolean
  /** Called when toggle state changes */
  onChange: (checked: boolean) => void
  /** Disable the toggle */
  disabled?: boolean
  /** Optional data-testid for E2E testing */
  dataTestId?: string
}

/**
 * Canonical Toggle component for Vibeforge.
 *
 * Used by settings pages, Cowork permissions, provider management,
 * and anywhere a boolean switch is needed.
 *
 * When `label` or `description` is provided, renders as a row with text.
 * Otherwise renders as a bare toggle switch.
 */
export function Toggle({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  dataTestId
}: ToggleProps): React.ReactElement {
  const switchElement = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/25
        ${checked ? 'bg-[var(--ivory-accent)]' : 'bg-[var(--ivory-border)] hover:bg-[var(--ivory-border-2)]'}
        ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
      data-testid={dataTestId}
    >
      <span
        className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out
          ${checked ? 'translate-x-[18px]' : 'translate-x-[2px]'}`}
      />
    </button>
  )

  // If no label or description, return bare toggle (settings-style)
  if (!label && !description) {
    return switchElement
  }

  // Otherwise render with label row (old shared-style)
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      {switchElement}
      <div className="flex flex-col">
        {label && <span className="text-sm font-medium text-[var(--ivory-text)]">{label}</span>}
        {description && <span className="text-xs text-[var(--ivory-text-3)]">{description}</span>}
      </div>
    </label>
  )
}
