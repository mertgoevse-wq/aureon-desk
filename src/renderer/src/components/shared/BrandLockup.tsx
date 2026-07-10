import React from 'react'
import { AureonMark } from './AureonMark'

interface BrandLockupProps {
  size?: number
  className?: string
  /** Render compact icon-only variant (no text). For collapsed sidebars, topbar icons, etc. */
  compact?: boolean
}

/**
 * Premium brand lockup: Aureon mark + "Aureon Desk" title + subtitle.
 * Use in sidebar header, splash screens, and anywhere the full brand identity is needed.
 *
 * Set `compact={true}` for icon-only rendering (collapsed sidebars, topbar, small spaces).
 */
export function BrandLockup({
  size = 40,
  className = '',
  compact = false,
}: BrandLockupProps): React.ReactElement {
  if (compact) {
    return (
      <div className={`flex items-center shrink-0 ${className}`}>
        <AureonMark size={size} />
      </div>
    )
  }

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

/**
 * Compact brand lockup — just the mark, no text.
 * Convenience export for use in collapsed sidebars and topbar.
 */
export function BrandLockupCompact({
  size = 22,
  className = '',
}: {
  size?: number
  className?: string
}): React.ReactElement {
  return <BrandLockup size={size} className={className} compact />
}

