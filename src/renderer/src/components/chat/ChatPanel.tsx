import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageBubble } from './MessageBubble'
import { MessageInput } from './MessageInput'

import { useChatStore } from '../../stores/chatStore'
import { useRoutingStore } from '../../stores/routingStore'
import { useIpc } from '../../hooks/useIpc'
import { AlertTriangle, RotateCcw, Wrench, Settings, BookOpen, FolderOpen, Download } from 'lucide-react'
import type { MessageRow } from '@shared/types/chat'
import type { AnalyzePromptOutput } from '@shared/types/routing'

export function ChatPanel(): React.ReactElement {
  const { activeChat, activeChatId, addMessage, updateChatInList } = useChatStore()
  const { setCurrentAnalysis, addToHistory, setLoading, setError } = useRoutingStore()
  const api = useIpc()
  const navigate = useNavigate()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamError, setStreamError] = useState<string | null>(null)
  const shouldAutoScroll = useRef(true)

  useEffect(() => {
    if (shouldAutoScroll.current || isStreaming) {
      scrollToBottom()
    }
  }, [activeChat?.messages, isStreaming])

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current
    if (!el) return
    const threshold = 120 // pixels from bottom to consider "near bottom"
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold
    shouldAutoScroll.current = isNearBottom
  }, [])

  const handleSend = useCallback(async (content: string) => {
    if (!activeChatId || isStreaming) return

    setStreamError(null)
    setIsStreaming(true)

    const newMessage: MessageRow = {
      id: crypto.randomUUID(),
      chat_id: activeChatId,
      role: 'user',
      content,
      tool_calls: null,
      tool_call_id: null,
      token_count: null,
      created_at: new Date().toISOString(),
      sort_order: (activeChat?.messages?.length || 0)
    }

    // Add to local state immediately
    addMessage(newMessage)

    // Persist user message to database
    try {
      await api.messageAdd({
        chat_id: activeChatId,
        role: 'user',
        content
      })
    } catch (err) {
      console.error('Failed to save message:', err)
    }

    // Update chat in sidebar
    updateChatInList(activeChatId, {
      last_message_preview: content.slice(0, 100)
    })

    // Run prompt analysis (non-blocking)
    setLoading(true)
    setError(null)
    api.routingAnalyze({ content, chatId: activeChatId })
      .then((result: AnalyzePromptOutput) => {
        setCurrentAnalysis(result)
        addToHistory(result)
      })
      .catch((err: unknown) => {
        console.error('Prompt analysis failed:', err)
        setError(String(err))
      })
      .finally(() => setLoading(false))

    // --- Send to AI provider ---
    try {
      const result = await api.chatSend(activeChatId)

      if (result.success && result.message) {
        // Add assistant message to local state
        addMessage(result.message)
        // Update sidebar preview
        updateChatInList(activeChatId, {
          last_message_preview: result.message.content.slice(0, 100)
        })
      } else {
        // Show error from provider
        setStreamError(result.error || 'Unknown error from provider')
      }
    } catch (err) {
      console.error('Chat completion failed:', err)
      setStreamError(String(err))
    } finally {
      setIsStreaming(false)
    }
  }, [activeChatId, activeChat, isStreaming, addMessage, api, updateChatInList, setCurrentAnalysis, addToHistory, setLoading, setError])

  const handleRetry = useCallback(async () => {
    if (!activeChatId || !activeChat?.messages?.length || isStreaming) return
    setStreamError(null)
    setIsStreaming(true)

    try {
      const result = await api.chatSend(activeChatId)

      if (result.success && result.message) {
        addMessage(result.message)
        updateChatInList(activeChatId, {
          last_message_preview: result.message.content.slice(0, 100)
        })
      } else {
        setStreamError(result.error || 'Unknown error from provider')
      }
    } catch (err) {
      console.error('Retry failed:', err)
      setStreamError(String(err))
    } finally {
      setIsStreaming(false)
    }
  }, [activeChatId, activeChat, addMessage, api, updateChatInList])

  // Error bubble component
  const ErrorBubble = () => (
    <div className="px-4 py-3">
      <div className="mx-auto max-w-3xl">
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-[var(--ivory-error-bg)] text-[var(--ivory-error)] ring-1 ring-[var(--ivory-error)]/15">
            <AlertTriangle size={14} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="rounded-xl border border-[var(--ivory-error)]/20 bg-[var(--ivory-error-bg)]/70 p-4">
              <p className="text-sm font-medium text-[var(--ivory-error)] mb-2">Assistant unavailable</p>
              <p className="text-xs text-[var(--ivory-error)]/80 mb-3 leading-relaxed">{streamError}</p>
              <div className="flex gap-2">
                <button
                  onClick={handleRetry}
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-[var(--radius-md)] bg-white hover:bg-[var(--ivory-surface)] text-[var(--ivory-error)] border border-[var(--ivory-error)]/20 transition-colors"
                >
                  <RotateCcw size={11} />
                  Retry
                </button>
                <button
                  onClick={() => navigate('/settings/providers')}
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-[var(--radius-md)] bg-white hover:bg-[var(--ivory-surface)] text-[var(--ivory-text-2)] border border-[var(--ivory-border)] transition-colors"
                >
                  <Wrench size={11} />
                  Provider Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // Thinking bubble — refined
  const ThinkingBubble = () => (
    <div className="px-4 py-3 bg-[var(--ivory-bg)]">
      <div className="mx-auto max-w-3xl flex gap-3">
        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-[var(--ivory-surface-3)] text-[var(--ivory-text-2)] ring-1 ring-[var(--ivory-border)]">
          <div className="flex gap-0.5">
            <span className="w-1.5 h-1.5 bg-[var(--ivory-accent)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-[var(--ivory-accent)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-[var(--ivory-accent)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm text-[var(--ivory-text-2)] italic py-1.5">
            Thinking{buildProviderIndicator()}
          </div>
        </div>
      </div>
    </div>
  )

  // Show provider/model indicator based on chat config
  const buildProviderIndicator = () => {
    if (!activeChat?.model_id) return '...'
    const providerInfo = activeChat.messages.length > 0
      ? ` (using ${activeChat.model_id})`
      : ''
    return providerInfo || '...'
  }

  if (!activeChat || activeChat.messages.length === 0) {
    return (
      <div className="flex flex-col h-full" data-testid="main-chat-panel">
        <div className="flex-1 flex items-center justify-center px-8">
          <div className="text-center max-w-md">
            {/* Aureon mark — larger, softer */}
            <div className="w-20 h-20 rounded-2xl bg-[var(--ivory-accent-light)]/80 flex items-center justify-center mx-auto mb-6 shadow-[var(--shadow-card)]">
              <svg width="32" height="32" viewBox="0 0 64 64" fill="none">
                <circle cx="32" cy="32" r="30" fill="var(--ivory-accent-light)" stroke="var(--ivory-accent)" strokeWidth="1.5" opacity="0.9" />
                <path d="M18 44L26 20H29L21 44H18Z" fill="var(--ivory-accent)" />
                <path d="M46 44L38 20H35L43 44H46Z" fill="var(--ivory-accent)" />
                <rect x="23" y="34" width="18" height="3.5" rx="1" fill="var(--ivory-accent)" />
                <circle cx="32" cy="40" r="1.5" fill="#E8A45C" opacity="0.8" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold tracking-tight mb-3">
              Start a conversation
            </h2>
            <p className="text-[15px] text-[var(--ivory-text-3)] leading-relaxed mb-8">
              Aureon Desk helps you write, build, and explore with AI. Configure a provider, select a model, and start chatting.
            </p>
            {/* Quick actions — card style */}
            <div className="grid grid-cols-2 gap-3 text-left">
              <button
                onClick={() => navigate('/settings/providers')}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--ivory-surface)] hover:bg-[var(--ivory-surface-2)] border border-[var(--ivory-border)] hover:border-[var(--ivory-border-2)] text-[var(--ivory-text-2)] hover:text-[var(--ivory-text)] transition-all duration-150"
              >
                <div className="w-8 h-8 rounded-lg bg-[var(--ivory-accent-light)] flex items-center justify-center shrink-0">
                  <Settings size={14} className="text-[var(--ivory-accent)]" />
                </div>
                <span className="text-sm font-medium">Configure Provider</span>
              </button>
              <button
                onClick={() => navigate('/prompts')}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--ivory-surface)] hover:bg-[var(--ivory-surface-2)] border border-[var(--ivory-border)] hover:border-[var(--ivory-border-2)] text-[var(--ivory-text-2)] hover:text-[var(--ivory-text)] transition-all duration-150"
              >
                <div className="w-8 h-8 rounded-lg bg-[var(--ivory-accent-light)] flex items-center justify-center shrink-0">
                  <BookOpen size={14} className="text-[var(--ivory-accent)]" />
                </div>
                <span className="text-sm font-medium">Prompt Library</span>
              </button>
              <button
                onClick={() => navigate('/projects')}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--ivory-surface)] hover:bg-[var(--ivory-surface-2)] border border-[var(--ivory-border)] hover:border-[var(--ivory-border-2)] text-[var(--ivory-text-2)] hover:text-[var(--ivory-text)] transition-all duration-150"
              >
                <div className="w-8 h-8 rounded-lg bg-[var(--ivory-accent-light)] flex items-center justify-center shrink-0">
                  <FolderOpen size={14} className="text-[var(--ivory-accent)]" />
                </div>
                <span className="text-sm font-medium">Create Project</span>
              </button>
              <button
                onClick={() => navigate('/settings/github')}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--ivory-surface)] hover:bg-[var(--ivory-surface-2)] border border-[var(--ivory-border)] hover:border-[var(--ivory-border-2)] text-[var(--ivory-text-2)] hover:text-[var(--ivory-text)] transition-all duration-150"
              >
                <div className="w-8 h-8 rounded-lg bg-[var(--ivory-accent-light)] flex items-center justify-center shrink-0">
                  <Download size={14} className="text-[var(--ivory-accent)]" />
                </div>
                <span className="text-sm font-medium">Import Skills</span>
              </button>
            </div>
          </div>
        </div>
        <MessageInput onSend={handleSend} disabled={isStreaming} />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full" data-testid="main-chat-panel">
      {/* Messages */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto"
        onScroll={handleScroll}
      >
        <div className="py-2">
          {activeChat.messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {/* Loading indicator while waiting for AI response */}
          {isStreaming && !streamError && <ThinkingBubble />}

          {/* Error bubble after failed completion */}
          {streamError && <ErrorBubble />}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <MessageInput
        onSend={handleSend}
        disabled={isStreaming}
        placeholder={isStreaming ? 'Waiting for response...' : 'Type a message... (Shift+Enter for new line, / for commands & prompts)'}
      />
    </div>
  )
}
