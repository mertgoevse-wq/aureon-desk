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

  const viewBox = withRing ? '0 0 256 256' : '17 24 51 45'
  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient id={`mark-grad-${size}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--ivory-accent)" />
          <stop offset="100%" stopColor="var(--ivory-accent-hover)" />
        </linearGradient>
      </defs>
      {withRing && (
        <>
          <circle cx="128" cy="128" r="118" fill="var(--ivory-accent-light)" stroke="var(--ivory-accent)" strokeWidth="2" strokeOpacity="0.25" />
          <circle cx="128" cy="128" r="108" fill="none" stroke="#E8A45C" strokeWidth="0.75" strokeOpacity="0.15" />
        </>
      )}
      <path d="M72 178L104 72H110L78 178H72Z" fill={`url(#mark-grad-${size})`} />
      <path d="M184 178L152 72H146L178 178H184Z" fill={`url(#mark-grad-${size})`} />
      <rect x="92" y="140" width="72" height="6" rx="3" fill={`url(#mark-grad-${size})`} />
      {withRing && (
        <>
          <circle cx="128" cy="66" r="3" fill="#E8A45C" opacity="0.6" />
          <circle cx="128" cy="166" r="2.5" fill="#E8A45C" opacity="0.4" />
          <circle cx="66" cy="128" r="2" fill="#E8A45C" opacity="0.35" />
          <circle cx="190" cy="128" r="2" fill="#E8A45C" opacity="0.35" />
        </>
      )}
    </svg>
  )
}

