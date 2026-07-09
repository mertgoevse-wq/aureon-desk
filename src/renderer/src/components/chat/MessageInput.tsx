import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Send, Paperclip, Wrench, FileCode, GitBranch, ClipboardCheck, Map, Eye, FileText, Zap, Settings, BookOpen, Archive, X } from 'lucide-react'
import { usePromptLibraryStore } from '../../stores/promptLibraryStore'
import { useIpc } from '../../hooks/useIpc'
import { VariableFiller } from '../prompts/VariableFiller'
import { DropZone } from '../shared/DropZone'
import { AttachmentChip } from '../shared/AttachmentChip'
import { Modal } from '../shared/Modal'
import { useAttachmentStore } from '../../stores/attachmentStore'
import type { FileProcessResult, ZipInspectResult } from '@shared/attachments'
import { formatFileSize } from '@shared/attachments'

declare global {
  interface WindowEventMap {
    'composer-insert': CustomEvent<{ text: string; mode?: 'replace' | 'append' }>
  }
}

// Local helpers (avoids importing node module in renderer)
function safeParseTags(tags: string | null): string[] {
  if (!tags) return []
  try { return JSON.parse(tags) }
  catch { return [] }
}

function safeParseVars(vars: string | null): string[] {
  if (!vars) return []
  try { return JSON.parse(vars) }
  catch { return [] }
}

function extractTemplateVars(content: string): string[] {
  const matches = content.match(/\{\{(\w+)\}\}/g)
  if (!matches) return []
  return [...new Set(matches.map(m => m.slice(2, -2)))]
}

interface MessageInputProps {
  onSend: (content: string) => void
  disabled?: boolean
  placeholder?: string
}

interface SlashItem {
  id: string
  label: string
  description: string
  content: string
  variables: string[]
  icon: React.ReactElement
  category: 'coding' | 'writing' | 'analysis' | 'system' | 'prompts'
  isPrompt?: boolean
}

const BUILTIN_COMMANDS: Omit<SlashItem, 'isPrompt'>[] = [
  { id: 'fix', label: 'Fix Code', description: 'Identify bugs, edge cases, and improvements', content: 'Please fix the following code. Identify bugs, edge cases, and improvements:\n\n```\n{{code}}\n```\n\nExplain each fix you make.', variables: ['code'], icon: <Wrench size={14} />, category: 'coding' },
  { id: 'explain', label: 'Explain Code', description: 'Walk through what the code does and how it works', content: 'Please explain the following code in detail. Walk through what it does, how it works, and any notable patterns or techniques used:\n\n```\n{{code}}\n```', variables: ['code'], icon: <FileText size={14} />, category: 'analysis' },
  { id: 'refactor', label: 'Refactor Code', description: 'Cleaner, more efficient, more maintainable', content: 'Please refactor the following code to be cleaner, more efficient, and more maintainable. Preserve all existing behavior:\n\n```\n{{code}}\n```\n\nDescribe each refactoring you apply and why.', variables: ['code'], icon: <FileCode size={14} />, category: 'coding' },
  { id: 'commit', label: 'Generate Commit', description: 'Conventional commit message from diff', content: 'Based on the following git diff, generate a concise, well-formatted commit message following conventional commits:\n\n```diff\n{{diff}}\n```', variables: ['diff'], icon: <GitBranch size={14} />, category: 'coding' },
  { id: 'test', label: 'Write Tests', description: 'Comprehensive unit tests with edge cases', content: 'Please write comprehensive unit tests for the following code. Cover happy paths, edge cases, and error handling:\n\n```\n{{code}}\n```\n\nUse the testing framework already in use in this project.', variables: ['code'], icon: <ClipboardCheck size={14} />, category: 'coding' },
  { id: 'plan', label: 'Create Plan', description: 'Detailed implementation plan with steps', content: 'I need a detailed implementation plan for the following task:\n\n{{task}}\n\nPlease break it down into clear, ordered steps with technical details.', variables: ['task'], icon: <Map size={14} />, category: 'writing' },
  { id: 'review', label: 'Code Review', description: 'Correctness, security, performance, best practices', content: 'Please review the following code. Evaluate it for:\n- Correctness and edge cases\n- Performance and efficiency\n- Security concerns\n- Readability and maintainability\n- Adherence to best practices\n\n```\n{{code}}\n```', variables: ['code'], icon: <Eye size={14} />, category: 'analysis' },
  { id: 'summarize', label: 'Summarize', description: 'Concise summary with key takeaways', content: 'Please provide a concise summary of the following:\n\n{{text}}\n\nFocus on the key points and takeaways.', variables: ['text'], icon: <FileText size={14} />, category: 'writing' },
  { id: 'skill', label: 'Apply Skill', description: 'Act as a specialist with a specific skill', content: 'Act as a specialist with the following skill:\n\n{{skill}}\n\nNow, help me with:\n\n{{task}}', variables: ['skill', 'task'], icon: <Zap size={14} />, category: 'system' },
  { id: 'system', label: 'System / Meta', description: 'Set rules then proceed with a task', content: 'Rules:\n- {{rules}}\n\nNow proceed with the following task:\n\n{{task}}', variables: ['rules', 'task'], icon: <Settings size={14} />, category: 'system' },
]

export function MessageInput({
  onSend,
  disabled = false,
  placeholder = 'Ask Aureon to write, inspect, plan, or build...'
}: MessageInputProps): React.ReactElement {
  const [value, setValue] = useState('')
  const [showSlashMenu, setShowSlashMenu] = useState(false)
  const [slashQuery, setSlashQuery] = useState('')
  const [slashIndex, setSlashIndex] = useState(0)
  const [slashItems, setSlashItems] = useState<SlashItem[]>([])
  const [variableFiller, setVariableFiller] = useState<{ title: string; content: string; variables: string[] } | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const prompts = usePromptLibraryStore(s => s.prompts)
  const loadPrompts = usePromptLibraryStore(s => s.setPrompts)
  const api = useIpc()
  const { attachments, addAttachments, removeAttachment, toggleContext, getContextSummary, clearAll } = useAttachmentStore()
  const [isProcessingDrop, setIsProcessingDrop] = useState(false)
  const [zipInspectModal, setZipInspectModal] = useState<{ id: string; name: string; inspect: ZipInspectResult } | null>(null)
  const [extracting, setExtracting] = useState(false)

  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 220) + 'px'
  }, [])

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

  // Listen for global composer events from empty-state prompt chips and shortcuts.
  useEffect(() => {
    const handler = () => {
      textareaRef.current?.focus()
    }
    const insertHandler = (event: WindowEventMap['composer-insert']) => {
      const incoming = event.detail?.text || ''
      if (!incoming) return
      setValue(current => event.detail?.mode === 'append' && current.trim()
        ? `${current.trimEnd()}\n\n${incoming}`
        : incoming)
      requestAnimationFrame(() => {
        resizeTextarea()
        textareaRef.current?.focus()
      })
    }
    window.addEventListener('focus-composer', handler)
    window.addEventListener('composer-insert', insertHandler)
    return () => {
      window.removeEventListener('focus-composer', handler)
      window.removeEventListener('composer-insert', insertHandler)
    }
  }, [resizeTextarea])

  const handleSend = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    // Append attachment context summary to the message
    const contextSummary = getContextSummary()
    const fullContent = trimmed + contextSummary
    onSend(fullContent)
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [value, disabled, onSend, getContextSummary])

  const replaceSlash = useCallback((content: string) => {
    const slashPos = value.lastIndexOf('/')
    const before = value.slice(0, slashPos)
    const after = value.slice(slashPos + slashQuery.length + 1)
    setValue(before + content + '\n' + after)
    setShowSlashMenu(false)
    setSlashQuery('')
    requestAnimationFrame(() => textareaRef.current?.focus())
  }, [value, slashQuery])

  const insertCommand = useCallback((item: SlashItem) => {
    if (item.variables.length > 0) {
      setVariableFiller({ title: item.label, content: item.content, variables: item.variables })
      setShowSlashMenu(false)
    } else {
      replaceSlash(item.content)
    }
    if (item.isPrompt) {
      api.promptLibraryIncrementUsage(item.id).catch(() => {})
    }
  }, [replaceSlash, api])

  const handleVariableInsert = useCallback((text: string) => {
    replaceSlash(text)
  }, [replaceSlash])

  const openPromptMenu = useCallback(() => {
    setValue('/')
    setSlashQuery('')
    setSlashItems(BUILTIN_COMMANDS.slice(0, 10).map(item => ({ ...item, isPrompt: false })))
    setSlashIndex(0)
    setShowSlashMenu(true)
    requestAnimationFrame(() => textareaRef.current?.focus())
    ensurePromptsLoaded().then(() => {
      const currentPrompts = usePromptLibraryStore.getState().prompts
      const promptItems: SlashItem[] = currentPrompts.slice(0, 4).map(p => ({
        id: p.id,
        label: p.title,
        description: p.description || p.content.slice(0, 80),
        content: p.content,
        variables: p.variables ? safeParseVars(p.variables) : extractTemplateVars(p.content),
        icon: <BookOpen size={14} className="text-[var(--ivory-accent)]" />,
        category: 'prompts',
        isPrompt: true
      }))
      setSlashItems([...BUILTIN_COMMANDS.slice(0, 8).map(item => ({ ...item, isPrompt: false })), ...promptItems].slice(0, 12))
    })
  }, [ensurePromptsLoaded])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (showSlashMenu && slashItems.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSlashIndex(i => Math.min(i + 1, slashItems.length - 1))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSlashIndex(i => Math.max(i - 1, 0))
        return
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        insertCommand(slashItems[slashIndex])
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
  }, [handleSend, showSlashMenu, slashIndex, slashItems, insertCommand])

  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setValue(newValue)

    resizeTextarea()

    const el = e.target
    const cursorPos = el.selectionStart
    const textBefore = newValue.slice(0, cursorPos)
    const slashMatch = textBefore.match(/\/(\S*)$/)

    if (slashMatch && textBefore.lastIndexOf('/') === cursorPos - slashMatch[0].length) {
      const query = slashMatch[1].toLowerCase()
      setSlashQuery(query)

      const filteredBuiltins: SlashItem[] = BUILTIN_COMMANDS
        .filter(c => c.id.startsWith(query) || c.label.toLowerCase().includes(query) || c.description.toLowerCase().includes(query))

      ensurePromptsLoaded().then(() => {
        const currentPrompts = usePromptLibraryStore.getState().prompts
        const filteredPrompts: SlashItem[] = currentPrompts
          .filter(p => p.title.toLowerCase().includes(query) || (p.tags && safeParseTags(p.tags).some(t => t.toLowerCase().includes(query))))
          .slice(0, 10)
          .map(p => ({
            id: p.id,
            label: p.title,
            description: p.description || p.content.slice(0, 80),
            content: p.content,
            variables: p.variables ? safeParseVars(p.variables) : extractTemplateVars(p.content),
            icon: <BookOpen size={14} className="text-[var(--ivory-accent)]" />,
            category: 'prompts' as const,
            isPrompt: true
          }))

        const combined = [...filteredBuiltins, ...filteredPrompts].slice(0, 12)
        setSlashItems(combined)
        setSlashIndex(0)
        setShowSlashMenu(combined.length > 0)
      })
    } else {
      setShowSlashMenu(false)
    }
  }, [ensurePromptsLoaded])

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const text = e.clipboardData.getData('text')
    if (!text) return
    e.preventDefault()

    const el = e.currentTarget
    const start = el.selectionStart ?? value.length
    const end = el.selectionEnd ?? value.length
    const nextValue = value.slice(0, start) + text + value.slice(end)
    const cursor = start + text.length

    setValue(nextValue)
    setShowSlashMenu(false)
    requestAnimationFrame(() => {
      resizeTextarea()
      textareaRef.current?.setSelectionRange(cursor, cursor)
      textareaRef.current?.focus()
    })
  }, [resizeTextarea, value])

  return (
    <div className="bg-gradient-to-t from-[var(--ivory-bg)] via-[var(--ivory-bg)] to-[var(--ivory-bg)]/80" data-testid="chat-composer">
      <div className="mx-auto max-w-3xl px-4 pt-2 pb-4 relative">
        {/* Slash command palette */}
        {showSlashMenu && slashItems.length > 0 && (
          <div className="absolute bottom-full left-8 right-8 mb-3 bg-[var(--ivory-elevated)] border border-[var(--ivory-border)] rounded-[18px] shadow-[var(--shadow-xl)] z-20 max-h-80 overflow-y-auto">
            <div className="px-3 py-1.5 text-[10px] text-[var(--ivory-text-3)] border-b border-[var(--ivory-border)] font-medium flex items-center justify-between">
              <span>Commands & Prompts</span>
              <span className="text-[var(--ivory-text-3)]/60">↑↓ navigate · ↵ insert · esc close</span>
            </div>
            {slashItems.map((item, i) => {
              const categoryColor: Record<string, string> = {
                coding: 'text-blue-600',
                writing: 'text-green-600',
                analysis: 'text-purple-600',
                system: 'text-amber-600',
                prompts: 'text-[var(--ivory-accent)]'
              }
              return (
                <button
                  key={item.id}
                  onClick={() => insertCommand(item)}
                  className={`w-full text-left px-3 py-2.5 flex items-start gap-3 transition-colors border-b border-[var(--ivory-border)]/50 last:border-0
                    ${i === slashIndex ? 'bg-[var(--ivory-surface)]' : 'hover:bg-[var(--ivory-surface)]'}`}
                >
                  <span className={`mt-0.5 shrink-0 ${categoryColor[item.category] || ''}`}>
                    {item.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-[var(--ivory-text)] font-medium">{item.label}</span>
                      {item.variables.length > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-[var(--radius-sm)] bg-[var(--ivory-surface-2)] text-[var(--ivory-text-3)] font-mono">
                          {item.variables.map(v => `{{${v}}}`).join(', ')}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[var(--ivory-text-3)] mt-0.5 truncate">{item.description}</p>
                  </div>
                  <span className="text-[10px] text-[var(--ivory-text-3)]/60 font-mono mt-0.5 shrink-0">
                    /{item.id}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {/* Variable filler modal */}
        {variableFiller && (
          <VariableFiller
            isOpen={!!variableFiller}
            onClose={() => setVariableFiller(null)}
            onInsert={handleVariableInsert}
            title={variableFiller.title}
            content={variableFiller.content}
            variables={variableFiller.variables}
          />
        )}

        {/* Attachment chips row */}
        {attachments.length > 0 && (
          <div className="mx-4 mt-2 flex flex-wrap gap-2" data-testid="attachment-chips">
            {attachments.map((att) => (
              <AttachmentChip
                key={att.id}
                attachment={att}
                onRemove={removeAttachment}
                onToggleContext={toggleContext}
                onInspectZip={(id) => {
                  const a = attachments.find(x => x.id === id)
                  if (!a) return
                  // Process the file to get ZIP inspection results
                  api.attachmentProcessFile(a.path).then((result: FileProcessResult) => {
                    if (result.zipInspect) {
                      setZipInspectModal({ id, name: a.name, inspect: result.zipInspect })
                    }
                  }).catch(() => {})
                }}
              />
            ))}
          </div>
        )}

        <DropZone
          onFilesDropped={async (filePaths) => {
            setIsProcessingDrop(true)
            try {
              for (const fp of filePaths) {
                try {
                  const result: FileProcessResult = await api.attachmentProcessFile(fp)
                  addAttachments([result.attachment])
                } catch {
                  // Skip files that fail to process
                }
              }
            } finally {
              setIsProcessingDrop(false)
            }
          }}
          disabled={disabled || isProcessingDrop}
        >
          <div className="bg-[var(--ivory-elevated)] border border-[var(--ivory-border)] rounded-[22px] px-3 py-2 shadow-[var(--shadow-composer)]
            focus-within:border-[var(--ivory-accent)] focus-within:ring-1 focus-within:ring-[var(--ivory-accent)]
            hover:border-[var(--ivory-border-2)] transition duration-[var(--transition-fast)]">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleInput}
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="w-full resize-none bg-transparent text-[15px] text-[var(--ivory-text)] placeholder:text-[var(--ivory-text-3)] outline-none min-h-[42px] max-h-[220px] px-2 pt-2 pb-1 leading-relaxed"
            data-testid="message-textarea"
          />

          <div className="flex items-center justify-between gap-3 border-t border-[var(--ivory-border)]/60 pt-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <button
                className="relative inline-flex h-7 w-7 items-center justify-center rounded-full text-[var(--ivory-text-3)] hover:text-[var(--ivory-text-2)] hover:bg-[var(--ivory-surface)] transition-colors shrink-0"
                title={`${attachments.length > 0 ? `${attachments.length} file(s) attached` : 'Attach file'}`}
                aria-label="Attach file"
                onClick={() => {
                  // Open native file dialog for attachments
                  api.attachmentSelectFiles().then(async (filePaths: string[]) => {
                    if (!filePaths.length) return
                    setIsProcessingDrop(true)
                    try {
                      for (const fp of filePaths) {
                        try {
                          const result: FileProcessResult = await api.attachmentProcessFile(fp)
                          addAttachments([result.attachment])
                        } catch { /* skip failed files */ }
                      }
                    } finally {
                      setIsProcessingDrop(false)
                    }
                  }).catch(() => {})
                }}
              >
                <Paperclip size={15} className={attachments.length > 0 ? 'text-[var(--ivory-accent)]' : ''} />
                {attachments.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--ivory-accent)] text-white text-[9px] font-bold flex items-center justify-center">
                    {attachments.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={openPromptMenu}
                className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-[11px] font-semibold text-[var(--ivory-text-2)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface)] transition-colors cursor-pointer"
                title="Open commands and prompt library"
              >
                <BookOpen size={13} className="text-[var(--ivory-accent)]" />
                Prompts
              </button>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="hidden sm:inline text-[10px] text-[var(--ivory-text-3)] font-medium">
                Enter to send · Shift+Enter for line break
              </span>
              <button
                onClick={handleSend}
                disabled={disabled || !value.trim()}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full transition shrink-0
                  bg-[var(--ivory-accent)] text-white shadow-[var(--shadow-sm)] hover:bg-[var(--ivory-accent-hover)] hover:shadow-[var(--shadow-md)]
                  disabled:bg-[var(--ivory-surface-3)] disabled:text-[var(--ivory-text-3)] disabled:shadow-none cursor-pointer"
                title="Send message (Enter)"
                aria-label="Send message"
                data-testid="send-button"
              >
                <Send size={15} />
              </button>
            </div>
          </div>
          </div>
        </DropZone>

        {/* ZIP inspect modal */}
        {zipInspectModal && (
          <Modal
            isOpen={!!zipInspectModal}
            onClose={() => setZipInspectModal(null)}
            title={`ZIP Archive: ${zipInspectModal.name}`}
            size="sm"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50/60 border border-blue-200/40">
                <Archive size={20} className="text-blue-600 shrink-0" />
                <div>
                  <p className="text-[13px] font-semibold text-[var(--ivory-text)]">{zipInspectModal.inspect.fileCount} files detected</p>
                  <p className="text-[11px] text-[var(--ivory-text-3)]">{formatFileSize(zipInspectModal.inspect.totalSizeBytes)} total</p>
                </div>
              </div>
              {zipInspectModal.inspect.tree.length > 0 && (
                <div className="max-h-[200px] overflow-y-auto rounded-xl border border-[var(--ivory-border)] bg-[var(--ivory-surface)] p-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--ivory-text-3)] px-2 py-1">Contents</div>
                  {zipInspectModal.inspect.tree.map((entry, i) => (
                    <div key={i} className="px-2 py-1 text-[11px] font-mono text-[var(--ivory-text-2)] hover:bg-[var(--ivory-elevated)] rounded">
                      {entry}
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2 pt-2 border-t border-[var(--ivory-border)]/60">
                <button
                  type="button"
                  onClick={() => setZipInspectModal(null)}
                  className="flex-1 h-9 rounded-xl border border-[var(--ivory-border)] bg-[var(--ivory-bg)] hover:bg-[var(--ivory-surface)] text-[12px] font-semibold text-[var(--ivory-text-2)] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <X size={13} /> Close
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setExtracting(true)
                    try {
                      const a = attachments.find(x => x.id === zipInspectModal.id)
                      if (!a) return
                      const result = await api.attachmentExtractZip(a.path)
                      if (result.success) {
                        // Process extracted files as new attachments
                        for (const extractedPath of result.extractedPaths) {
                          try {
                            const r = await api.attachmentProcessFile(extractedPath)
                            addAttachments([r.attachment])
                          } catch { /* skip */ }
                        }
                      }
                    } catch { /* ignore */ }
                    finally {
                      setExtracting(false)
                      setZipInspectModal(null)
                    }
                  }}
                  disabled={extracting}
                  className="flex-1 h-9 rounded-xl bg-[var(--ivory-accent)] hover:bg-[var(--ivory-accent-hover)] text-[12px] font-bold text-white transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5"
                >
                  {extracting ? 'Extracting...' : 'Extract & attach files'}
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  )
}
