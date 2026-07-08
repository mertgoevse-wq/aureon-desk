import React from 'react'
import {
  Cpu, Globe, Mail, Github,
  Server, Wrench, Smartphone, Puzzle,
  Sparkles
} from 'lucide-react'

/**
 * ConnectorIcon — Safe vendor icon system.
 *
 * RULES:
 * - If an OFFICIAL vendor image exists in assets/vendor/ AND is properly licensed AND
 *   the image path is available at runtime, use it.
 * - Otherwise, render a neutral Lucide icon with vendor initials as fallback.
 * - NEVER generate, invent, or display fake brand logos.
 * - NEVER imply partnership or endorsement.
 *
 * Visual: consistent 40×40 rounded container with accent-light background.
 */

export type ConnectorIconType =
  | 'openai'
  | 'chatgpt'
  | 'google'
  | 'gemini'
  | 'gmail'
  | 'github'
  | 'openrouter'
  | 'ollama'
  | 'lmstudio'
  | 'mcp'
  | 'phone'
  | 'custom'

interface ConnectorIconProps {
  type: ConnectorIconType
  size?: number
  className?: string
  /** Override the default label */
  label?: string
}

const CONNECTOR_LABELS: Record<ConnectorIconType, string> = {
  openai: 'OpenAI',
  chatgpt: 'ChatGPT',
  google: 'Google',
  gemini: 'Gemini',
  gmail: 'Gmail',
  github: 'GitHub',
  openrouter: 'OpenRouter',
  ollama: 'Ollama',
  lmstudio: 'LM Studio',
  mcp: 'MCP',
  phone: 'Phone',
  custom: 'Custom',
}

const CONNECTOR_ICONS: Record<ConnectorIconType, (size?: number) => React.ReactElement> = {
  openai: (s) => <Cpu size={s || 18} />,
  chatgpt: (s) => <Sparkles size={s || 18} />,
  google: (s) => <Globe size={s || 18} />,
  gemini: (s) => <Globe size={s || 18} />,
  gmail: (s) => <Mail size={s || 18} />,
  github: (s) => <Github size={s || 18} />,
  openrouter: (s) => <Server size={s || 18} />,
  ollama: (s) => <Cpu size={s || 18} />,
  lmstudio: (s) => <Cpu size={s || 18} />,
  mcp: (s) => <Wrench size={s || 18} />,
  phone: (s) => <Smartphone size={s || 18} />,
  custom: (s) => <Puzzle size={s || 18} />,
}

const CONNECTOR_INITIALS: Record<ConnectorIconType, string> = {
  openai: 'OA',
  chatgpt: 'CG',
  google: 'GL',
  gemini: 'GN',
  gmail: 'MA',
  github: 'GH',
  openrouter: 'OR',
  ollama: 'OL',
  lmstudio: 'LM',
  mcp: 'MC',
  phone: 'PH',
  custom: 'CU',
}

/**
 * Check if an official vendor image exists.
 * Currently, no vendor assets are loaded — all connectors use neutral icons.
 * When vendor assets are added to assets/vendor/ with proper attribution,
 * this function should check for their existence.
 */
function hasOfficialAsset(type: ConnectorIconType): boolean {
  // Placeholder: no official vendor assets loaded yet.
  // When added: check existence of assets/vendor/<type>.png in public/vendor/
  return false
}

function getOfficialAssetPath(type: ConnectorIconType): string | null {
  if (!hasOfficialAsset(type)) return null
  return `/vendor/${type}.png`
}

/**
 * Renders a connector icon:
 * - Official vendor image if available and licensed
 * - Lucide icon in accent-light background as fallback
 * - Never renders fake brand logos
 */
export function ConnectorIcon({
  type,
  size = 40,
  className = '',
  label,
}: ConnectorIconProps): React.ReactElement {
  const displayLabel = label || CONNECTOR_LABELS[type]
  const officialPath = getOfficialAssetPath(type)

  // If we have a properly licensed vendor asset, use it
  if (officialPath) {
    return (
      <img
        src={officialPath}
        alt={displayLabel}
        width={size}
        height={size}
        className={`rounded-xl object-contain bg-[var(--ivory-accent-light)] shrink-0 ${className}`}
        data-testid={`connector-icon-${type}`}
        draggable={false}
      />
    )
  }

  // Fallback: neutral Lucide icon
  const iconSize = Math.max(14, size * 0.45)

  return (
    <div
      className={`flex items-center justify-center rounded-xl bg-[var(--ivory-accent-light)] text-[var(--ivory-accent)] shrink-0 transition-colors ${className}`}
      style={{ width: size, height: size }}
      data-testid={`connector-icon-${type}`}
      title={displayLabel}
      aria-label={displayLabel}
    >
      {CONNECTOR_ICONS[type]
        ? CONNECTOR_ICONS[type](iconSize)
        : (
          <span className="text-[10px] font-bold text-[var(--ivory-accent)]">
            {CONNECTOR_INITIALS[type]}
          </span>
        )}
    </div>
  )
}

/**
 * ConnectorIconSmall — inline icon for use in lists, badges, or small contexts.
 * Always renders as a neutral icon — no images.
 */
export function ConnectorIconSmall({
  type,
  size = 18,
  className = '',
}: Omit<ConnectorIconProps, 'label'>): React.ReactElement {
  const iconSize = Math.max(10, size * 0.75)
  return (
    <span
      className={`inline-flex items-center justify-center rounded-lg bg-[var(--ivory-accent-light)] text-[var(--ivory-accent)] shrink-0 ${className}`}
      style={{ width: size, height: size }}
      data-testid={`connector-icon-small-${type}`}
    >
      {CONNECTOR_ICONS[type]
        ? CONNECTOR_ICONS[type](iconSize)
        : (
          <span className="text-[8px] font-bold text-[var(--ivory-accent)]">
            {CONNECTOR_INITIALS[type]}
          </span>
        )}
    </span>
  )
}

export { CONNECTOR_LABELS, CONNECTOR_ICONS, CONNECTOR_INITIALS }
