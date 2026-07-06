import React from 'react'
import { Palette, Type, Layout, Sun } from 'lucide-react'
import { Card } from '../../components/shared/Card'

const COLOR_SWATCHES = [
  { name: 'Background', var: '--ivory-bg', value: '#FAF8F5' },
  { name: 'Surface', var: '--ivory-surface', value: '#F5F1EB' },
  { name: 'Surface 2', var: '--ivory-surface-2', value: '#EDE7DD' },
  { name: 'Border', var: '--ivory-border', value: '#E0D8CC' },
  { name: 'Text', var: '--ivory-text', value: '#2C2416' },
  { name: 'Text 2', var: '--ivory-text-2', value: '#6B5E4A' },
  { name: 'Text 3', var: '--ivory-text-3', value: '#9B8D7A' },
  { name: 'Accent', var: '--ivory-accent', value: '#C75B39' },
  { name: 'Success', var: '--ivory-success', value: '#5C8A5E' },
  { name: 'Warning', var: '--ivory-warning', value: '#C2953E' },
  { name: 'Error', var: '--ivory-error', value: '#B8453C' },
]

const RADIUS_TOKENS = [
  { name: 'Small', var: '--radius-sm', size: 4 },
  { name: 'Medium', var: '--radius-md', size: 8 },
  { name: 'Large', var: '--radius-lg', size: 12 },
  { name: 'XLarge', var: '--radius-xl', size: 16 },
]

const SPACING_TOKENS = [
  { name: 'xs', var: '--space-xs', size: 4 },
  { name: 'sm', var: '--space-sm', size: 8 },
  { name: 'md', var: '--space-md', size: 16 },
  { name: 'lg', var: '--space-lg', size: 24 },
  { name: 'xl', var: '--space-xl', size: 32 },
]

export function AppearancePage(): React.ReactElement {
  return (
    <div className="px-8 py-8 max-w-2xl">
      <div className="mb-6">
        <h2 className="text-xl font-semibold display-text mb-1">Appearance</h2>
        <p className="text-sm text-[var(--ivory-text-3)]">
          Preview the ivory design system. Theme customization coming in a future update.
        </p>
      </div>

      <div className="space-y-8">
        {/* Colors */}
        <Card padding="lg">
          <div className="flex items-center gap-2 mb-4">
            <Palette size={14} className="text-[var(--ivory-accent)]" />
            <h3 className="text-sm font-semibold display-text">Color Palette</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {COLOR_SWATCHES.map(c => (
              <div key={c.var} className="flex items-center gap-3 p-2 rounded-[var(--radius-md)]">
                <div
                  className="w-8 h-8 rounded-[var(--radius-sm)] border border-[var(--ivory-border)] shrink-0"
                  style={{ backgroundColor: c.value }}
                />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[var(--ivory-text)] truncate">{c.name}</p>
                  <p className="text-[10px] text-[var(--ivory-text-3)]">
                    {c.var} · {c.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Typography */}
        <Card padding="lg">
          <div className="flex items-center gap-2 mb-4">
            <Type size={14} className="text-[var(--ivory-accent)]" />
            <h3 className="text-sm font-semibold display-text">Typography</h3>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-[10px] text-[var(--ivory-text-3)] mb-0.5">Serif display — Crimson Text</p>
              <h1 className="text-3xl font-semibold display-text">Heading 1</h1>
              <h2 className="text-2xl font-semibold display-text">Heading 2</h2>
              <h3 className="text-xl font-semibold display-text">Heading 3</h3>
            </div>
            <div className="pt-3 border-t border-[var(--ivory-border)]">
              <p className="text-[10px] text-[var(--ivory-text-3)] mb-0.5">Sans-serif body — Inter</p>
              <p className="text-sm text-[var(--ivory-text)]">Body text at 13px looks crisp and readable.</p>
              <p className="text-xs text-[var(--ivory-text-2)] mt-1">Secondary text at 12px for supporting content.</p>
              <p className="text-[10px] text-[var(--ivory-text-3)] mt-1">Muted text at 10px for captions.</p>
            </div>
            <div className="pt-3 border-t border-[var(--ivory-border)]">
              <p className="text-[10px] text-[var(--ivory-text-3)] mb-0.5">Monospace — JetBrains Mono</p>
              <code className="text-xs">const greeting = &quot;Hello, Aureon&quot;</code>
            </div>
          </div>
        </Card>

        {/* Radius & Spacing */}
        <div className="grid grid-cols-2 gap-4">
          <Card padding="lg">
            <div className="flex items-center gap-2 mb-4">
              <Layout size={14} className="text-[var(--ivory-accent)]" />
              <h3 className="text-sm font-semibold display-text">Radius</h3>
            </div>
            <div className="space-y-2">
              {RADIUS_TOKENS.map(r => (
                <div key={r.var} className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 bg-[var(--ivory-surface)] border border-[var(--ivory-border)]"
                    style={{ borderRadius: r.size }}
                  />
                  <div>
                    <span className="text-xs text-[var(--ivory-text)]">{r.name}</span>
                    <span className="text-[10px] text-[var(--ivory-text-3)] ml-1">{r.var} ({r.size}px)</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card padding="lg">
            <div className="flex items-center gap-2 mb-4">
              <Layout size={14} className="text-[var(--ivory-accent)]" />
              <h3 className="text-sm font-semibold display-text">Spacing</h3>
            </div>
            <div className="space-y-2">
              {SPACING_TOKENS.map(s => (
                <div key={s.var} className="flex items-center gap-3">
                  <div
                    className="bg-[var(--ivory-accent)]"
                    style={{ width: s.size < 8 ? 8 : s.size, height: 8, minWidth: s.size < 8 ? 8 : s.size, borderRadius: 2 }}
                  />
                  <div>
                    <span className="text-xs text-[var(--ivory-text)]">{s.name}</span>
                    <span className="text-[10px] text-[var(--ivory-text-3)] ml-1">{s.var} ({s.size}px)</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
