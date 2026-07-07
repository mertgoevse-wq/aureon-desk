import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export function Input({
  label,
  error,
  hint,
  className = '',
  id,
  onChange,
  onInput,
  ...props
}: InputProps): React.ReactElement {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  const handleInput = (event: React.InputEvent<HTMLInputElement>) => {
    onInput?.(event)
    onChange?.(event as unknown as React.ChangeEvent<HTMLInputElement>)
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-[var(--ivory-text)]"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        onInput={handleInput}
        className={`px-3 py-2 text-sm rounded-[var(--radius-lg)] bg-[var(--ivory-elevated)]
          border border-[var(--ivory-border)] text-[var(--ivory-text)]
          placeholder:text-[var(--ivory-text-3)]
          shadow-[var(--shadow-xs)] hover:border-[var(--ivory-border-2)]
          focus:outline-none focus:border-[var(--ivory-accent)] focus:ring-1 focus:ring-[var(--ivory-accent)]
          transition-colors duration-[var(--transition-fast)]
          ${error ? 'border-[var(--ivory-error)] hover:border-[var(--ivory-error)] focus:border-[var(--ivory-error)] focus:ring-[var(--ivory-error)]' : ''}
          ${className}`}
        {...props}
      />
      {hint && !error && (
        <span className="text-xs text-[var(--ivory-text-3)]">{hint}</span>
      )}
      {error && (
        <span className="text-xs text-[var(--ivory-error)]">{error}</span>
      )}
    </div>
  )
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export function Textarea({
  label,
  error,
  className = '',
  id,
  onChange,
  onInput,
  ...props
}: TextareaProps): React.ReactElement {
  const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-')

  const handleInput = (event: React.InputEvent<HTMLTextAreaElement>) => {
    onInput?.(event)
    onChange?.(event as unknown as React.ChangeEvent<HTMLTextAreaElement>)
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={textareaId}
          className="text-sm font-medium text-[var(--ivory-text)]"
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        onInput={handleInput}
        className={`px-3 py-2 text-sm rounded-[var(--radius-lg)] bg-[var(--ivory-elevated)]
          border border-[var(--ivory-border)] text-[var(--ivory-text)]
          placeholder:text-[var(--ivory-text-3)]
          shadow-[var(--shadow-xs)] hover:border-[var(--ivory-border-2)]
          focus:outline-none focus:border-[var(--ivory-accent)] focus:ring-1 focus:ring-[var(--ivory-accent)]
          transition-colors duration-[var(--transition-fast)] resize-vertical min-h-[80px]
          ${error ? 'border-[var(--ivory-error)]' : ''}
          ${className}`}
        {...props}
      />
      {error && (
        <span className="text-xs text-[var(--ivory-error)]">{error}</span>
      )}
    </div>
  )
}
