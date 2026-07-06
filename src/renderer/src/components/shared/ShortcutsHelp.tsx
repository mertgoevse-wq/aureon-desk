import React, { useEffect, useRef } from 'react'
import { X, Keyboard } from 'lucide-react'

interface ShortcutEntry {
  keys: string
  description: string
}

const SHORTCUTS: ShortcutEntry[] = [
  { keys: 'Ctrl+K', description: 'Open command palette' },
  { keys: 'Ctrl+N', description: 'New chat' },
  { keys: 'Ctrl+Shift+P', description: 'Open prompt library' },
  { keys: 'Ctrl+,', description: 'Open settings' },
  { keys: 'Ctrl+L', description: 'Focus message composer' },
  { keys: 'Ctrl+B', description: 'Toggle sidebar' },
  { keys: 'Ctrl+I', description: 'Toggle inspector panel' },
  { keys: 'Esc', description: 'Close modals / command palette' },
  { keys: 'Ctrl+/', description: 'Show this shortcuts help' },
]

interface ShortcutsHelpProps {
  isOpen: boolean
  onClose: () => void
}

export function ShortcutsHelp({ isOpen, onClose }: ShortcutsHelpProps): React.ReactElement | null {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[250] flex items-center justify-center bg-black/20 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[var(--ivory-bg)] rounded-[var(--radius-lg)] border border-[var(--ivory-border)] shadow-[var(--shadow-xl)] overflow-hidden animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--ivory-border)]">
          <div className="flex items-center gap-2">
            <Keyboard size={14} className="text-[var(--ivory-accent)]" />
            <h2 className="text-sm font-semibold display-text text-[var(--ivory-text)]">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-[var(--radius-sm)] text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)] transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Shortcuts list */}
        <div className="max-h-96 overflow-y-auto">
          {SHORTCUTS.map((shortcut) => (
            <div
              key={shortcut.keys}
              className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--ivory-border)]/50 last:border-0 hover:bg-[var(--ivory-surface)]/50 transition-colors"
            >
              <span className="text-sm text-[var(--ivory-text)]">{shortcut.description}</span>
              <kbd className="text-xs px-2 py-0.5 rounded-[var(--radius-sm)] bg-[var(--ivory-surface-2)] text-[var(--ivory-text-2)] font-mono border border-[var(--ivory-border)]">
                {shortcut.keys}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-[var(--ivory-border)] text-[10px] text-[var(--ivory-text-3)] text-center">
          Press <kbd className="px-1 py-0.5 rounded bg-[var(--ivory-surface-2)] border border-[var(--ivory-border)] text-[10px] font-mono">Ctrl+/</kbd> anywhere to show this help
        </div>
      </div>
    </div>
  )
}
