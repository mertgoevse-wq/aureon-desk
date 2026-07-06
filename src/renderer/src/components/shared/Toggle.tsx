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
          className={`w-9 h-5 rounded-full transition-colors duration-200 
            ${checked ? 'bg-[var(--ivory-accent)]' : 'bg-[var(--ivory-border-2)]'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div
            className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 mt-0.5
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
