import React from 'react'
import { MessageSquare } from 'lucide-react'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({
  icon,
  title,
  description,
  action
}: EmptyStateProps): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-[var(--ivory-text-3)] mb-4">
        {icon || <MessageSquare size={40} strokeWidth={1.5} />}
      </div>
      <h3 className="text-base font-semibold text-[var(--ivory-text)] mb-1 display-text">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-[var(--ivory-text-3)] max-w-sm mb-4">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  )
}
