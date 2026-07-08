import React from 'react'

function insertPastedText(target: HTMLInputElement | HTMLTextAreaElement, text: string): void {
  const start = target.selectionStart ?? target.value.length
  const end = target.selectionEnd ?? target.value.length
  const nextValue = target.value.slice(0, start) + text + target.value.slice(end)
  target.value = nextValue
  const cursor = start + text.length
  target.setSelectionRange(cursor, cursor)
  target.dispatchEvent(new InputEvent('input', {
    bubbles: true,
    cancelable: true,
    inputType: 'insertFromPaste',
    data: text
  }))
}

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
  onPaste,
  ...props
}: InputProps): React.ReactElement {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  const handleInput = (event: React.InputEvent<HTMLInputElement>) => {
    onInput?.(event)
    onChange?.(event as unknown as React.ChangeEvent<HTMLInputElement>)
  }

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    onPaste?.(event)
    if (event.defaultPrevented) return
    const text = event.clipboardData.getData('text')
    if (!text) return
    event.preventDefault()
    insertPastedText(event.currentTarget, text)
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
        onPaste={handlePaste}
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
  onPaste,
  ...props
}: TextareaProps): React.ReactElement {
  const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-')

  const handleInput = (event: React.InputEvent<HTMLTextAreaElement>) => {
    onInput?.(event)
    onChange?.(event as unknown as React.ChangeEvent<HTMLTextAreaElement>)
  }

  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    onPaste?.(event)
    if (event.defaultPrevented) return
    const text = event.clipboardData.getData('text')
    if (!text) return
    event.preventDefault()
    insertPastedText(event.currentTarget, text)
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
        onPaste={handlePaste}
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
