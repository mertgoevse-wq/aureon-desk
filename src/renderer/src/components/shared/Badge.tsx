import React from 'react'

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  size?: 'sm' | 'md'
}

const variantClasses: Record<string, string> = {
  default: 'bg-[var(--ivory-surface)] text-[var(--ivory-text-2)] border border-[var(--ivory-border)]',
  success: 'bg-[var(--ivory-success-bg)] text-[var(--ivory-success)] border border-[var(--ivory-success)]/20',
  warning: 'bg-[var(--ivory-warning-bg)] text-[var(--ivory-warning)] border border-[var(--ivory-warning)]/20',
  error: 'bg-[var(--ivory-error-bg)] text-[var(--ivory-error)] border border-[var(--ivory-error)]/20'
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
      className={`inline-flex items-center font-medium rounded-[var(--radius-full)]
        ${variantClasses[variant]} ${sizeClasses[size]}`}
    >
      {children}
    </span>
  )
}
