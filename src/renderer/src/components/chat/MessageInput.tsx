import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Send, Paperclip, Sparkles } from 'lucide-react'
import { usePromptLibraryStore } from '../../stores/promptLibraryStore'
import { useIpc } from '../../hooks/useIpc'

interface MessageInputProps {
  onSend: (content: string) => void
  disabled?: boolean
  placeholder?: string
}

export function MessageInput({
  onSend,
  disabled = false,
  placeholder = 'Type a message... (Shift+Enter for new line, / for prompts)'
}: MessageInputProps): React.ReactElement {
  const [value, setValue] = useState('')
  const [showSlashMenu, setShowSlashMenu] = useState(false)
  const [slashQuery, setSlashQuery] = useState('')
  const [slashIndex, setSlashIndex] = useState(0)
  const [filteredPrompts, setFilteredPrompts] = useState<{id: string; title: string; content: string}[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const prompts = usePromptLibraryStore(s => s.prompts)
  const loadPrompts = usePromptLibraryStore(s => s.setPrompts)
  const api = useIpc()

  // Lazy-load prompts from DB on first slash trigger if store is empty
  const ensurePromptsLoaded = useCallback(async () => {
    if (prompts.length === 0) {
      try {
        const results = await api.promptLibraryList()
        loadPrompts(results)
      } catch { /* silently fail */ }
    }
  }, [prompts.length, loadPrompts, api])

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  const handleSend = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [value, disabled, onSend])

  const insertPromptContent = useCallback((prompt: {id: string; title: string; content: string}) => {
    const slashPos = value.lastIndexOf('/')
    const before = value.slice(0, slashPos)
    const after = value.slice(slashPos + slashQuery.length + 1)
    setValue(before + prompt.content + '\n' + after)
    setShowSlashMenu(false)
    setSlashQuery('')
    requestAnimationFrame(() => textareaRef.current?.focus())
  }, [value, slashQuery])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (showSlashMenu && filteredPrompts.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSlashIndex(i => Math.min(i + 1, filteredPrompts.length - 1))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSlashIndex(i => Math.max(i - 1, 0))
        return
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        insertPromptContent(filteredPrompts[slashIndex])
        return
      }
      if (e.key === 'Escape') {
        setShowSlashMenu(false)
        return
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!showSlashMenu) {
        handleSend()
      }
    }
  }, [handleSend, showSlashMenu, slashIndex, filteredPrompts, insertPromptContent])

  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setValue(newValue)

    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 200) + 'px'

    const cursorPos = el.selectionStart
    const textBefore = newValue.slice(0, cursorPos)
    const slashMatch = textBefore.match(/\/(\S*)$/)

    if (slashMatch && textBefore.lastIndexOf('/') === cursorPos - slashMatch[0].length) {
      const query = slashMatch[1].toLowerCase()
      setSlashQuery(query)
      ensurePromptsLoaded().then(() => {
        const currentPrompts = usePromptLibraryStore.getState().prompts
        const filtered = currentPrompts
          .filter(p => p.title.toLowerCase().includes(query) || (p.tags && safeParseTags(p.tags).some(t => t.toLowerCase().includes(query))))
          .slice(0, 6)
          .map(p => ({ id: p.id, title: p.title, content: p.content }))
        setFilteredPrompts(filtered)
        setShowSlashMenu(filtered.length > 0)
      })
    } else {
      setShowSlashMenu(false)
    }
  }, [ensurePromptsLoaded])

  return (
    <div className="border-t border-[var(--ivory-border)] bg-[var(--ivory-bg)]">
      <div className="mx-auto max-w-3xl px-4 py-3 relative">
        {showSlashMenu && filteredPrompts.length > 0 && (
          <div className="absolute bottom-full left-8 right-8 mb-2 bg-[var(--ivory-bg)] border border-[var(--ivory-border)] rounded-[var(--radius-md)] shadow-[var(--shadow-lg)] z-20 max-h-48 overflow-y-auto">
            <div className="px-3 py-1.5 text-[10px] text-[var(--ivory-text-3)] border-b border-[var(--ivory-border)] font-medium">
              Prompt Templates
            </div>
            {filteredPrompts.map((prompt, i) => (
              <button
                key={prompt.id}
                onClick={() => insertPromptContent(prompt)}
                className={`w-full text-left px-3 py-2 text-xs flex items-start gap-2 transition-colors
                  ${i === slashIndex ? 'bg-[var(--ivory-surface)]' : 'hover:bg-[var(--ivory-surface)]'}`}
              >
                <Sparkles size={12} className="mt-0.5 text-[var(--ivory-accent)] shrink-0" />
                <div className="min-w-0">
                  <span className="text-[var(--ivory-text)] font-medium">{prompt.title}</span>
                  <p className="text-[10px] text-[var(--ivory-text-3)] truncate mt-0.5">{prompt.content.slice(0, 80)}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2 bg-[var(--ivory-surface)] border border-[var(--ivory-border)] rounded-[var(--radius-lg)] p-2 focus-within:border-[var(--ivory-accent)] focus-within:ring-1 focus-within:ring-[var(--ivory-accent)] transition-colors">
          <button
            className="p-1.5 rounded-[var(--radius-sm)] text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)] transition-colors shrink-0"
            title="Attach file"
          >
            <Paperclip size={18} />
          </button>

          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm text-[var(--ivory-text)] placeholder:text-[var(--ivory-text-3)] outline-none min-h-[24px] max-h-[200px] py-1"
          />

          <button
            onClick={handleSend}
            disabled={disabled || !value.trim()}
            className="p-1.5 rounded-[var(--radius-sm)] transition-colors shrink-0
              text-[var(--ivory-accent)] hover:bg-[var(--ivory-accent)]/10
              disabled:text-[var(--ivory-text-3)] disabled:hover:bg-transparent"
            title="Send message (Enter)"
          >
            <Send size={18} />
          </button>
        </div>

        <p className="text-[10px] text-[var(--ivory-text-3)] mt-1.5 px-1 text-center">
          Type / to search prompts. Ivory does not send messages until API keys are configured.
        </p>
      </div>
    </div>
  )
}

function safeParseTags(tags: string | null): string[] {
  if (!tags) return []
  try { return JSON.parse(tags) }
  catch { return [] }
}
