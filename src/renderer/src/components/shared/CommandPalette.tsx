import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Search, Terminal } from 'lucide-react'

export interface CommandItem {
  id: string
  label: string
  description?: string
  icon?: React.ReactElement
  onSelect: () => void
}

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  items: CommandItem[]
  placeholder?: string
}

export function CommandPalette({
  isOpen,
  onClose,
  items,
  placeholder = 'Type a command or search...'
}: CommandPaletteProps): React.ReactElement | null {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const filtered = query
    ? items.filter(i =>
        i.label.toLowerCase().includes(query.toLowerCase()) ||
        (i.description || '').toLowerCase().includes(query.toLowerCase())
      )
    : items

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const handleSelect = useCallback((item: CommandItem) => {
    item.onSelect()
    onClose()
  }, [onClose])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      e.preventDefault()
      handleSelect(filtered[selectedIndex])
    } else if (e.key === 'Escape') {
      onClose()
    }
  }, [filtered, selectedIndex, handleSelect, onClose])

  useEffect(() => {
    const el = listRef.current?.children[selectedIndex] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] bg-black/20 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[var(--ivory-bg)] rounded-[var(--radius-lg)] border border-[var(--ivory-border)] shadow-[var(--shadow-xl)] overflow-hidden animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--ivory-border)]">
          <Terminal size={14} className="text-[var(--ivory-text-3)]" />
          <input
            ref={inputRef}
            className="flex-1 bg-transparent text-sm text-[var(--ivory-text)] placeholder:text-[var(--ivory-text-3)] outline-none"
            placeholder={placeholder}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <kbd className="text-[10px] text-[var(--ivory-text-3)]">esc</kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-72 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-[var(--ivory-text-3)]">
              No results found
            </div>
          ) : (
            filtered.map((item, index) => (
              <button
                key={item.id}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-[var(--transition-fast)]
                  ${index === selectedIndex
                    ? 'bg-[var(--ivory-surface)] text-[var(--ivory-text)]'
                    : 'text-[var(--ivory-text-2)] hover:bg-[var(--ivory-surface-2)]'
                  }`}
              >
                <span className="shrink-0 text-[var(--ivory-text-3)]">
                  {item.icon || <Search size={14} />}
                </span>
                <div className="min-w-0">
                  <span className="text-sm font-medium">{item.label}</span>
                  {item.description && (
                    <span className="block text-xs text-[var(--ivory-text-3)] truncate">{item.description}</span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
