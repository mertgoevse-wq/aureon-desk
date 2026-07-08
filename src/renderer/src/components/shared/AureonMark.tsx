import React from 'react'

interface AureonMarkProps {
  size?: number
  className?: string
  withRing?: boolean
  /** Use PNG image (from Nano Banana) instead of inline SVG. Faster for large sizes. */
  variant?: 'svg' | 'png'
}

/**
 * Shared Aureon Desk brand mark — the stylized "A" with aureole ring.
 * Use `variant="png"` for branded images, `variant="svg"` (default) for theme-responsive inline rendering.
 */
export function AureonMark({ size = 32, className = '', withRing = true, variant = 'svg' }: AureonMarkProps): React.ReactElement {
  if (variant === 'png') {
    return (
      <img
        src={size <= 64 ? '/brand/aureon-mark-64.png' : size <= 128 ? '/brand/aureon-mark-128.png' : '/brand/aureon-mark-256.png'}
        alt="Aureon Desk"
        width={size}
        height={size}
        className={className}
        style={{ objectFit: 'contain' }}
        draggable={false}
      />
    )
  }

  const viewBox = withRing ? '0 0 64 64' : '10 12 44 40'
  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill="none"
      aria-hidden="true"
      className={className}
    >
      {withRing && (
        <circle
          cx="32"
          cy="32"
          r="30"
          fill="var(--ivory-accent-light)"
          stroke="var(--ivory-accent)"
          strokeWidth="1.5"
          opacity="0.9"
        />
      )}
      <path d="M18 44L26 20H29L21 44H18Z" fill="var(--ivory-accent)" />
      <path d="M46 44L38 20H35L43 44H46Z" fill="var(--ivory-accent)" />
      <rect x="23" y="34" width="18" height="3.5" rx="1" fill="var(--ivory-accent)" />
      {withRing && (
        <circle cx="32" cy="40" r="1.5" fill="#E8A45C" opacity="0.8" />
      )}
    </svg>
  )
}

/**
 * Aureon full logo — mark + "Aureon Desk" wordmark as an image.
 * Best for README, documentation, and splash screens.
 */
export function AureonLogo({ width = 360, className = '' }: { width?: number; className?: string }): React.ReactElement {
  return (
    <img
      src="/brand/aureon-logo-512.png"
      alt="Aureon Desk"
      width={width}
      className={className}
      style={{ objectFit: 'contain' }}
      draggable={false}
    />
  )
}
