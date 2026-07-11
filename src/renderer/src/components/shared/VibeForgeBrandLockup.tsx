import React from 'react'
import { VibeForgeMark } from './VibeForgeMark'

interface VibeForgeBrandLockupProps {
  size?: number
  className?: string
  compact?: boolean
}

export function VibeForgeBrandLockup({
  size = 40,
  className = '',
  compact = false,
}: VibeForgeBrandLockupProps): React.ReactElement {
  if (compact) {
    return <div className={`flex items-center shrink-0 ${className}`}><VibeForgeMark size={size} /></div>
  }

  return (
    <div className={`flex items-center gap-3 select-none min-w-0 ${className}`}>
      <VibeForgeMark size={size} className="shrink-0" />
      <div className="min-w-0">
        <h1 className="text-[18px] font-semibold tracking-tight display-text text-[var(--ivory-text)] truncate leading-tight">
          Vibeforge
        </h1>
        <p className="text-xs text-[var(--ivory-text-3)] truncate font-medium mt-0.5">
          Build ideas into working software
        </p>
      </div>
    </div>
  )
}

export function VibeForgeBrandLockupCompact({
  size = 22,
  className = '',
}: {
  size?: number
  className?: string
}): React.ReactElement {
  return <VibeForgeBrandLockup size={size} className={className} compact />
}
