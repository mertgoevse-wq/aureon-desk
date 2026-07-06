import React from 'react'
import { ChevronDown } from 'lucide-react'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  label?: string
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function Select({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select...',
  className = ''
}: SelectProps): React.ReactElement {
  const selectId = label?.toLowerCase().replace(/\s+/g, '-') || 'select'

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={selectId}
          className="text-sm font-medium text-[var(--ivory-text)]"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`appearance-none w-full px-3 py-2 pr-8 text-sm rounded-[var(--radius-md)]
            bg-[var(--ivory-surface)] border border-[var(--ivory-border)] text-[var(--ivory-text)]
            focus:outline-none focus:border-[var(--ivory-accent)] focus:ring-1 focus:ring-[var(--ivory-accent)]
            transition-colors duration-150 cursor-pointer ${className}`}
        >
          <option value="" disabled>{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--ivory-text-3)]"
        />
      </div>
    </div>
  )
}
