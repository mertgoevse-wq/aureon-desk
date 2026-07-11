import React, { useId } from 'react'

interface VibeForgeMarkProps {
  size?: number
  className?: string
  variant?: 'svg' | 'png'
}

const COLORS = {
  graphite: '#302820',
  bronze: '#B8683A',
  bronzeDark: '#96502F',
  glow: '#E9A15B',
  ivory: '#F7F0E5',
}

/** Original VibeForge mark: a compact V/F monogram with a forge spark. */
export function VibeForgeMark({
  size = 32,
  className = '',
  variant = 'svg',
}: VibeForgeMarkProps): React.ReactElement {
  const gradientId = useId()

  if (variant === 'png') {
    return (
      <img
        src={size <= 64 ? '/brand/vibeforge-mark-64.png' : size <= 128 ? '/brand/vibeforge-mark-128.png' : '/brand/vibeforge-mark-256.png'}
        alt="Vibeforge"
        width={size}
        height={size}
        className={className}
        style={{ objectFit: 'contain' }}
        draggable={false}
      />
    )
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 256 256"
      fill="none"
      aria-label="Vibeforge"
      role="img"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`${gradientId}-forge`} x1="52" y1="46" x2="208" y2="210" gradientUnits="userSpaceOnUse">
          <stop stopColor={COLORS.glow} />
          <stop offset="0.48" stopColor={COLORS.bronze} />
          <stop offset="1" stopColor={COLORS.bronzeDark} />
        </linearGradient>
      </defs>
      <rect x="14" y="14" width="228" height="228" rx="58" fill={COLORS.ivory} />
      <rect x="14.75" y="14.75" width="226.5" height="226.5" rx="57.25" stroke={COLORS.bronze} strokeOpacity="0.2" strokeWidth="1.5" />
      <path d="M52 68H79L112 165L145 68H172L125 190H98L52 68Z" fill={`url(#${gradientId}-forge)`} />
      <path d="M145 68H204V91H171V119H200V142H171V190H145V68Z" fill={COLORS.graphite} />
      <path d="M207 39L213 51L225 57L213 63L207 75L201 63L189 57L201 51L207 39Z" fill={COLORS.glow} />
    </svg>
  )
}
