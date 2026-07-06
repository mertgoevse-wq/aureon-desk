import React from 'react'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md'
}

const variantClasses: Record<string, string> = {
  default: 'bg-[var(--ivory-surface-2)] text-[var(--ivory-text-2)]',
  success: 'bg-[var(--ivory-success-bg)] text-[var(--ivory-success)]',
  warning: 'bg-[var(--ivory-warning-bg)] text-[var(--ivory-warning)]',
  error: 'bg-[var(--ivory-error-bg)] text-[var(--ivory-error)]'
}

const sizeClasses: Record<string, string> = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2 py-0.5 text-xs'
}

export function Badge({
  children,
  variant = 'default',
  size = 'sm'
}: BadgeProps): React.ReactElement {
  return (
    <span
      className={`inline-flex items-center font-medium rounded-[var(--radius-sm)]
        ${variantClasses[variant]} ${sizeClasses[size]}`}
    >
      {children}
    </span>
  )
}
