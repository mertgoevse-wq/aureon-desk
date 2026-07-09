import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
  onClick?: () => void
}

const paddingClasses: Record<string, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-6'
}

export function Card({
  children,
  className = '',
  padding = 'md',
  hover = false,
  onClick
}: CardProps): React.ReactElement {
  const Component = onClick ? 'button' : 'div'

  return (
    <Component
      onClick={onClick}
      className={`rounded-[var(--radius-lg)] border border-[var(--ivory-border)] 
        bg-[var(--ivory-elevated)] shadow-[var(--shadow-xs)] ${paddingClasses[padding]}
        ${hover ? 'hover:border-[var(--ivory-border-2)] hover:shadow-[var(--shadow-md)] transition duration-[var(--transition-fast)]' : ''}
        ${onClick ? 'cursor-pointer text-left w-full' : ''}
        ${className}`}
    >
      {children}
    </Component>
  )
}
