import React from 'react'
import { AureonMark } from './AureonMark'

interface BrandLockupProps {
  size?: number
  className?: string
}

/**
 * Premium brand lockup: Aureon mark + "Aureon Desk" title + subtitle.
 * Use in sidebar header, splash screens, and anywhere the full brand identity is needed.
 */
export function BrandLockup({ size = 40, className = '' }: BrandLockupProps): React.ReactElement {
  return (
    <div className={`flex items-center gap-3 select-none min-w-0 ${className}`}>
      <div className="shrink-0">
        <AureonMark size={size} />
      </div>
      <div className="min-w-0">
        <h1 className="text-[18px] font-semibold tracking-tight display-text text-[var(--ivory-text)] truncate leading-tight">
          Aureon Desk
        </h1>
        <p className="text-xs text-[var(--ivory-text-3)] truncate font-medium mt-0.5">
          Personal AI workspace
        </p>
      </div>
    </div>
  )
}

