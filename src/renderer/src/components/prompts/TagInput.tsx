import React, { useState, useCallback, useRef, useEffect } from 'react'
import { X } from 'lucide-react'

interface TagInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
  suggestions?: string[]
  placeholder?: string
}

export function TagInput({
  tags,
  onChange,
  suggestions = [],
  placeholder = 'Add tag...'
}: TagInputProps): React.ReactElement {
  const [inputValue, setInputValue] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const filteredSuggestions = suggestions
    .filter(s => !tags.includes(s) && s.toLowerCase().includes(inputValue.toLowerCase()))
    .slice(0, 5)

  useEffect(() => {
    setSelectedSuggestionIndex(0)
  }, [inputValue])

  const addTag = useCallback((tag: string) => {
    const trimmed = tag.trim()
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed])
    }
    setInputValue('')
    setShowSuggestions(false)
    inputRef.current?.focus()
  }, [tags, onChange])

  const removeTag = useCallback((index: number) => {
    onChange(tags.filter((_, i) => i !== index))
  }, [tags, onChange])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (showSuggestions && filteredSuggestions.length > 0) {
        addTag(filteredSuggestions[selectedSuggestionIndex])
      } else if (inputValue.trim()) {
        addTag(inputValue)
      }
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags.length - 1)
    } else if (e.key === 'ArrowDown' && showSuggestions) {
      e.preventDefault()
      setSelectedSuggestionIndex(i => Math.min(i + 1, filteredSuggestions.length - 1))
    } else if (e.key === 'ArrowUp' && showSuggestions) {
      e.preventDefault()
      setSelectedSuggestionIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }, [inputValue, tags, showSuggestions, filteredSuggestions, selectedSuggestionIndex, addTag, removeTag])

  return (
    <div ref={containerRef} className="relative">
      <div className="flex flex-wrap gap-1.5 p-2 rounded-[var(--radius-md)] bg-[var(--ivory-surface)] border border-[var(--ivory-border)] focus-within:border-[var(--ivory-accent)] focus-within:ring-1 focus-within:ring-[var(--ivory-accent)] transition-colors min-h-[40px] cursor-text"
        onClick={() => inputRef.current?.focus()}>
        {tags.map((tag, index) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-[var(--radius-sm)] bg-[var(--ivory-surface-2)] text-[var(--ivory-text-2)]"
          >
            {tag}
            <button
              onClick={(e) => { e.stopPropagation(); removeTag(index) }}
              className="text-[var(--ivory-text-3)] hover:text-[var(--ivory-error)]"
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => { setInputValue(e.target.value); setShowSuggestions(true) }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[80px] bg-transparent text-sm outline-none py-0.5 text-[var(--ivory-text)] placeholder:text-[var(--ivory-text-3)]"
        />
      </div>

      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--ivory-bg)] border border-[var(--ivory-border)] rounded-[var(--radius-md)] shadow-[var(--shadow-md)] z-20 py-1">
          {filteredSuggestions.map((suggestion, i) => (
            <button
              key={suggestion}
              onClick={() => addTag(suggestion)}
              className={`w-full text-left px-3 py-1.5 text-xs transition-colors
                ${i === selectedSuggestionIndex
                  ? 'bg-[var(--ivory-surface)] text-[var(--ivory-text)]'
                  : 'text-[var(--ivory-text-2)] hover:bg-[var(--ivory-surface)]'}`}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
