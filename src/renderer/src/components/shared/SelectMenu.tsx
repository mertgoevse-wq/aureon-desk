import React, { useEffect, useRef, useState } from 'react'

export interface SelectMenuItem {
  id: string
  label: string
  description?: string
  icon?: React.ReactElement
}

interface SelectMenuProps {
  isOpen: boolean
  onClose: () => void
  items: SelectMenuItem[]
  selectedId?: string | null
  onSelect: (id: string | null) => void
  /** Optional "none" option label */
  noneLabel?: string
  /** Anchor position relative to trigger */
  align?: 'left' | 'right' | 'center'
  maxWidth?: string
  maxHeight?: string
}

/**
 * Compact anchored popover menu for selection from a list.
 * Keyboard navigable (arrow keys, enter, esc).
 * Lighter than SelectPopover — no search input.
 */
export function SelectMenu({
  isOpen,
  onClose,
  items,
  selectedId,
  onSelect,
  noneLabel = 'None',
  align = 'left',
  maxWidth = 'w-64',
  maxHeight = 'max-h-72'
}: SelectMenuProps): React.ReactElement | null {
  const [activeIndex, setActiveIndex] = useState(-1)
  const listRef = useRef<HTMLDivElement>(null)

  const alignClasses: Record<string, string> = {
    left: 'left-0',
    right: 'right-0',
    center: 'left-1/2 -translate-x-1/2'
  }

  // Reset active index and auto-focus on open
  useEffect(() => {
    if (isOpen) {
      const selIdx = items.findIndex(i => i.id === selectedId)
      setActiveIndex(selIdx >= 0 ? selIdx + 1 : 0) // +1 to account for "none" option
      // Auto-focus the listbox so keyboard nav works
      setTimeout(() => listRef.current?.focus(), 50)
    }
  }, [isOpen, items, selectedId])

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  // Scroll active into view
  useEffect(() => {
    const el = listRef.current?.children[activeIndex] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  const handleSelect = (id: string | null) => {
    onSelect(id)
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const total = items.length + 1 // +1 for "none" option
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => Math.min(i + 1, total - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIndex === 0) {
        handleSelect(null)
      } else {
        const item = items[activeIndex - 1]
        if (item) handleSelect(item.id)
      }
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 z-10"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={listRef}
        tabIndex={0}
        className={`absolute top-full mt-1.5 z-20 ${alignClasses[align]} ${maxWidth} bg-[var(--ivory-elevated)] border border-[var(--ivory-border)] rounded-[16px] shadow-[var(--shadow-xl)] ring-1 ring-black/5 py-1 animate-scale-in ${maxHeight} overflow-y-auto outline-none focus:ring-2 focus:ring-[var(--ivory-accent)]/30`}
        role="listbox"
        onKeyDown={handleKeyDown}
      >
        {/* None option */}
        <button
          type="button"
          onClick={() => handleSelect(null)}
          onMouseEnter={() => setActiveIndex(0)}
          role="option"
          aria-selected={!selectedId}
          className={`w-full text-left px-3 py-2 text-xs transition-colors
            ${activeIndex === 0
              ? 'bg-[var(--ivory-surface)] text-[var(--ivory-text)]'
              : 'text-[var(--ivory-text-3)] hover:bg-[var(--ivory-surface)]'}`}
        >
          {noneLabel}
        </button>

        {/* Items */}
        {items.map((item, index) => {
          const isSelected = item.id === selectedId
          const isActive = activeIndex === index + 1
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item.id)}
              onMouseEnter={() => setActiveIndex(index + 1)}
              role="option"
              aria-selected={isSelected}
              className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center gap-2
                ${isActive
                  ? 'bg-[var(--ivory-surface)] text-[var(--ivory-text)]'
                  : 'text-[var(--ivory-text-2)] hover:bg-[var(--ivory-surface)]'}`}
            >
              {item.icon && (
                <span className="text-[var(--ivory-accent)] shrink-0">{item.icon}</span>
              )}
              <span className="truncate">{item.label}</span>
              {isSelected && (
                <span className="ml-auto text-[10px] text-[var(--ivory-accent)] font-medium">✓</span>
              )}
            </button>
          )
        })}

        {items.length === 0 && (
          <div className="px-4 py-4 text-center text-xs text-[var(--ivory-text-3)]">
            No items available
          </div>
        )}
      </div>
    </>
  )
}
