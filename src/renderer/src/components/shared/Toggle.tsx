import React from 'react'

interface ToggleProps {
  label?: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

export function Toggle({
  label,
  description,
  checked,
  onChange,
  disabled = false
}: ToggleProps): React.ReactElement {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <div className="relative mt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <div
          className={`w-9 h-5 rounded-full transition-all duration-[var(--transition-normal)] 
            ${checked ? 'bg-[var(--ivory-accent)]' : 'bg-[var(--ivory-border-2)]'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div
            className={`w-3.5 h-3.5 rounded-full bg-white shadow-[var(--shadow-sm)] transition-all duration-[var(--transition-normal)] mt-[3px]
              ${checked ? 'translate-x-[18px]' : 'translate-x-[2px]'}`}
          />
        </div>
      </div>
      {(label || description) && (
        <div className="flex flex-col">
          {label && <span className="text-sm font-medium text-[var(--ivory-text)]">{label}</span>}
          {description && <span className="text-xs text-[var(--ivory-text-3)]">{description}</span>}
        </div>
      )}
    </label>
  )
}
