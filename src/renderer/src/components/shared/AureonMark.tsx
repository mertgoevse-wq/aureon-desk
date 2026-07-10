import React, { useId } from 'react'

interface AureonMarkProps {
  size?: number
  className?: string
  withRing?: boolean
  /** Use PNG image (from Nano Banana) instead of inline SVG. Faster for large sizes. */
  variant?: 'svg' | 'png'
}

/**
 * Aureon Desk brand colors — hardcoded for reliable SVG rendering across all Chromium versions.
 * These match the CSS variables in tokens.css exactly.
 */
const COLORS = {
  accent: '#B8683A',
  accentHover: '#A45A30',
  accentLight: '#F9EFE9',
  amber: '#E8A45C',
}

/**
 * Shared Aureon Desk brand mark — the stylized "A" with aureole ring.
 * Uses hardcoded brand colors for guaranteed visibility (CSS variables in SVG
 * presentation attributes can fail in some Electron/Chromium edge cases).
 *
 * Use `variant="png"` for branded images, `variant="svg"` (default) for crisp theme-responsive rendering.
 */
export function AureonMark({
  size = 32,
  className = '',
  withRing = true,
  variant = 'svg',
}: AureonMarkProps): React.ReactElement {
  const gradientId = useId()

  if (variant === 'png') {
    return (
      <img
        src={
          size <= 64
            ? '/brand/aureon-mark-64.png'
            : size <= 128
              ? '/brand/aureon-mark-128.png'
              : '/brand/aureon-mark-256.png'
        }
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
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`${gradientId}-g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={COLORS.accent} />
          <stop offset="100%" stopColor={COLORS.accentHover} />
        </linearGradient>
      </defs>

      {withRing && (
        <>
          {/* Outer ring with accent-light fill for contrast */}
          <circle
            cx="128"
            cy="128"
            r="118"
            fill={COLORS.accentLight}
            stroke={COLORS.accent}
            strokeWidth="2"
            strokeOpacity="0.3"
          />
          {/* Inner subtle ring */}
          <circle
            cx="128"
            cy="128"
            r="108"
            fill="none"
            stroke={COLORS.amber}
            strokeWidth="0.75"
            strokeOpacity="0.2"
          />
        </>
      )}

      {/* Abstract "A" — left pillar */}
      <path d="M72 178L104 72H110L78 178H72Z" fill={`url(#${gradientId}-g)`} />

      {/* Abstract "A" — right pillar */}
      <path d="M184 178L152 72H146L178 178H184Z" fill={`url(#${gradientId}-g)`} />

      {/* Crossbar */}
      <rect x="92" y="140" width="72" height="6" rx="3" fill={`url(#${gradientId}-g)`} />

      {withRing && (
        <>
          {/* Neural node dots with higher opacity for visibility */}
          <circle cx="128" cy="66" r="3.5" fill={COLORS.amber} opacity="0.7" />
          <circle cx="128" cy="166" r="3" fill={COLORS.amber} opacity="0.55" />
          <circle cx="66" cy="128" r="2.5" fill={COLORS.amber} opacity="0.45" />
          <circle cx="190" cy="128" r="2.5" fill={COLORS.amber} opacity="0.45" />

          {/* Subtle connection lines from nodes toward center */}
          <line
            x1="128"
            y1="70"
            x2="128"
            y2="134"
            stroke={COLORS.amber}
            strokeWidth="0.5"
            strokeOpacity="0.15"
          />
          <line
            x1="70"
            y1="128"
            x2="86"
            y2="134"
            stroke={COLORS.amber}
            strokeWidth="0.5"
            strokeOpacity="0.12"
          />
          <line
            x1="186"
            y1="128"
            x2="170"
            y2="134"
            stroke={COLORS.amber}
            strokeWidth="0.5"
            strokeOpacity="0.12"
          />
        </>
      )}
    </svg>
  )
}

