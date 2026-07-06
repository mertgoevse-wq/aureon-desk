import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

const variantClasses: Record<string, string> = {
  primary: 'bg-[var(--ivory-accent)] text-white hover:bg-[var(--ivory-accent-hover)]',
  secondary: 'bg-[var(--ivory-surface)] text-[var(--ivory-text)] border border-[var(--ivory-border)] hover:bg-[var(--ivory-surface-2)]',
  ghost: 'bg-transparent text-[var(--ivory-text-2)] hover:bg-[var(--ivory-surface)] hover:text-[var(--ivory-text)]',
  danger: 'bg-[var(--ivory-error)] text-white hover:opacity-90'
}

const sizeClasses: Record<string, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-2.5 text-sm'
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps): React.ReactElement {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] 
        font-medium transition-colors duration-150 focus-visible:outline-2 
        focus-visible:outline-[var(--ivory-accent)] focus-visible:outline-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
