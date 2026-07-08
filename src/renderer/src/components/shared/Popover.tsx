import React, { useEffect, useRef, useState } from 'react'

interface PopoverProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  /** Anchor position relative to trigger */
  align?: 'left' | 'right' | 'center'
  /** Side: opens above or below */
  side?: 'bottom' | 'top'
  /** Width constraint */
  maxWidth?: string
  className?: string
}

/**
 * Compact anchored popover for selectors, dropdowns, and quick actions.
 * Closes on ESC, click outside, and focus loss.
 * Does NOT block the page scroll like Modal.
 */
export function Popover({
  isOpen,
  onClose,
  children,
  align = 'left',
  side = 'bottom',
  maxWidth = 'w-72',
  className = ''
}: PopoverProps): React.ReactElement | null {
  const panelRef = useRef<HTMLDivElement>(null)

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  // Close on focus loss (click outside handled by overlay)
  useEffect(() => {
    if (!isOpen) return
    const handleFocusOut = (e: FocusEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.relatedTarget as Node)) {
        // Small delay to allow click events to fire first
        setTimeout(() => {
          if (panelRef.current && !panelRef.current.contains(document.activeElement)) {
            onClose()
          }
        }, 100)
      }
    }
    document.addEventListener('focusout', handleFocusOut)
    return () => document.removeEventListener('focusout', handleFocusOut)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const alignClasses = {
    left: 'left-0',
    right: 'right-0',
    center: 'left-1/2 -translate-x-1/2'
  }

  const sideClasses = {
    bottom: 'top-full mt-1.5',
    top: 'bottom-full mb-1.5'
  }

  return (
    <>
      {/* Transparent overlay to capture clicks outside */}
      <div
        className="fixed inset-0 z-10"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        className={`absolute z-20 ${alignClasses[align]} ${sideClasses[side]} ${maxWidth} bg-[var(--ivory-elevated)] border border-[var(--ivory-border)] rounded-[16px] shadow-[var(--shadow-xl)] ring-1 ring-black/5 py-1 animate-scale-in ${className}`}
        role="listbox"
      >
        {children}
      </div>
    </>
  )
}

/**
 * Compact searchable popover for selecting from a list with search/filter.
 * Keyboard navigable: arrow keys, enter to select, esc to close.
 */
interface SelectPopoverProps<T> {
  isOpen: boolean
  onClose: () => void
  items: T[]
  selectedId?: string | null
  onSelect: (item: T) => void
  renderItem: (item: T, isSelected: boolean) => React.ReactNode
  getId: (item: T) => string
  getLabel: (item: T) => string
  placeholder?: string
  emptyMessage?: string
  maxWidth?: string
}

export function SelectPopover<T>({
  isOpen,
  onClose,
  items,
  selectedId,
  onSelect,
  renderItem,
  getId,
  getLabel,
  placeholder = 'Search...',
  emptyMessage = 'No items found',
  maxWidth = 'w-72'
}: SelectPopoverProps<T>): React.ReactElement | null {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const filtered = query
    ? items.filter(i => getLabel(i).toLowerCase().includes(query.toLowerCase()))
    : items

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setActiveIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  // Scroll active into view
  useEffect(() => {
    const el = listRef.current?.children[activeIndex] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  const handleSelect = (item: T) => {
    onSelect(item)
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && filtered[activeIndex]) {
      e.preventDefault()
      handleSelect(filtered[activeIndex])
    } else if (e.key === 'Escape') {
      onClose()
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
      <div className={`absolute top-full right-0 mt-1.5 z-20 ${maxWidth} bg-[var(--ivory-elevated)] border border-[var(--ivory-border)] rounded-[16px] shadow-[var(--shadow-xl)] ring-1 ring-black/5 overflow-hidden animate-scale-in`}>
        {/* Search input */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--ivory-border)]/60">
          <input
            ref={inputRef}
            className="flex-1 bg-transparent text-xs text-[var(--ivory-text)] placeholder:text-[var(--ivory-text-3)] outline-none"
            placeholder={placeholder}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-64 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-[var(--ivory-text-3)]">
              {emptyMessage}
            </div>
          ) : (
            filtered.map((item, index) => {
              const isSelected = getId(item) === selectedId
              return (
                <button
                  key={getId(item)}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setActiveIndex(index)}
                  role="option"
                  aria-selected={isSelected}
                  className={`w-full text-left transition-colors duration-75
                    ${index === activeIndex
                      ? 'bg-[var(--ivory-surface)] text-[var(--ivory-text)]'
                      : 'text-[var(--ivory-text-2)] hover:bg-[var(--ivory-surface)]'}`}
                >
                  {renderItem(item, isSelected)}
                </button>
              )
            })
          )}
        </div>
      </div>
    </>
  )
}
