import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: React.ReactNode
}

const variantClasses: Record<string, string> = {
  primary: 'bg-[var(--ivory-accent)] text-white hover:bg-[var(--ivory-accent-hover)] active:scale-[0.98] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]',
  secondary: 'bg-[var(--ivory-elevated)] text-[var(--ivory-text)] border border-[var(--ivory-border)] hover:bg-[var(--ivory-surface)] hover:border-[var(--ivory-border-2)] shadow-[var(--shadow-xs)]',
  ghost: 'bg-transparent text-[var(--ivory-text-2)] hover:bg-[var(--ivory-surface)] hover:text-[var(--ivory-text)]',
  danger: 'bg-[var(--ivory-error)] text-white hover:opacity-90 active:scale-[0.98] shadow-[var(--shadow-sm)]'
}

const sizeClasses: Record<string, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5 h-8',
  md: 'px-4 py-2 text-sm gap-2 h-9',
  lg: 'px-6 py-2.5 text-sm gap-2 h-11'
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  disabled,
  loading = false,
  ...props
}: ButtonProps): React.ReactElement {
  const isDisabled = disabled || loading

  return (
    <button
      className={`inline-flex items-center justify-center rounded-[var(--radius-lg)] 
        font-medium transition-all duration-[var(--transition-fast)]
        whitespace-nowrap
        focus-visible:outline-2 focus-visible:outline-[var(--ivory-accent)] 
        focus-visible:outline-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
        select-none
        ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={isDisabled}
      aria-busy={loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
}
