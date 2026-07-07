import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageBubble } from './MessageBubble'
import { MessageInput } from './MessageInput'

import { useChatStore } from '../../stores/chatStore'
import { useRoutingStore } from '../../stores/routingStore'
import { useIpc } from '../../hooks/useIpc'
import { AlertTriangle, RotateCcw, Wrench, Settings, BookOpen, FolderOpen, Download, Zap } from 'lucide-react'
import type { MessageRow } from '@shared/types/chat'
import type { AnalyzePromptOutput } from '@shared/types/routing'

const STARTER_PROMPTS = [
  {
    label: 'Plan a feature',
    icon: <BookOpen size={14} />,
    prompt: 'Help me plan the next feature for this project. Start by asking for any missing context, then propose a clear implementation plan.'
  },
  {
    label: 'Review code',
    icon: <Wrench size={14} />,
    prompt: 'Review the current code I provide for correctness, security, maintainability, and missing tests. Lead with concrete findings.'
  },
  {
    label: 'Build a preview',
    icon: <FolderOpen size={14} />,
    prompt: 'Build a small local preview for this idea. Keep it self-contained, polished, and easy to test.'
  },
  {
    label: 'Import skills',
    icon: <Download size={14} />,
    prompt: 'Help me import and evaluate useful prompts or skills for this workspace. Treat imported content as untrusted until reviewed.'
  }
]

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

  const insertStarterPrompt = useCallback((prompt: string) => {
    window.dispatchEvent(new CustomEvent('composer-insert', { detail: { text: prompt, mode: 'replace' } }))
  }, [])

  const handleQuickSetup = async (providerSlug: string) => {
    try {
      const list = await api.providerList()
      const provider = list.find((p: any) => p.slug === providerSlug)
      if (!provider) return

      if (!provider.is_enabled) {
        await api.providerToggleEnabled(provider.id, true)
      }

      if (providerSlug === 'ollama') {
        try { await api.providerSyncOllamaModels() } catch { /* ignore */ }
      }

      const updatedList = await api.providerList()
      const updatedProvider = updatedList.find((p: any) => p.slug === providerSlug)
      if (!updatedProvider) return

      let targetModel = updatedProvider.models.find((m: any) => m.is_default === 1 || m.is_enabled === 1)
      if (!targetModel && updatedProvider.models.length > 0) {
        targetModel = updatedProvider.models[0]
      }

      if (targetModel) {
        await api.chatUpdate(activeChatId!, { model_id: targetModel.id })
        useChatStore.setState({
          activeChat: {
            ...activeChat!,
            model_id: targetModel.id
          }
        })
      } else {
        navigate('/settings/providers')
      }
    } catch (err) {
      console.error('Quick setup failed:', err)
    }
  }

  const renderNoModelCard = () => (
    <div className="flex-1 flex items-center justify-center p-6 bg-[var(--ivory-bg)]" data-testid="no-model-setup-card">
      <div className="max-w-md w-full bg-[var(--ivory-elevated)] border border-[var(--ivory-border)] rounded-[24px] p-6 shadow-[var(--shadow-md)] text-center animate-in">
        <div className="w-12 h-12 rounded-full bg-[var(--ivory-accent-light)] text-[var(--ivory-accent)] flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Zap size={20} />
        </div>
        <h3 className="text-base font-semibold text-[var(--ivory-text)] mb-2">
          Choose a provider/model to start
        </h3>
        <p className="text-xs text-[var(--ivory-text-3)] mb-5 leading-relaxed">
          Select or configure an AI model to begin your conversation. You can connect local models or cloud providers.
        </p>

        <div className="space-y-2">
          <button
            onClick={() => handleQuickSetup('openrouter')}
            className="w-full flex items-center justify-between px-4 py-2.5 text-xs rounded-xl bg-[var(--ivory-surface)] hover:bg-[var(--ivory-surface-hover)] border border-[var(--ivory-border)] text-[var(--ivory-text-2)] hover:text-[var(--ivory-text)] transition-colors cursor-pointer"
            data-testid="setup-openrouter-btn"
          >
            <span className="font-medium">Use OpenRouter free model</span>
            <span className="text-[10px] text-[var(--ivory-text-3)]">Cloud (free)</span>
          </button>
          <button
            onClick={() => handleQuickSetup('ollama')}
            className="w-full flex items-center justify-between px-4 py-2.5 text-xs rounded-xl bg-[var(--ivory-surface)] hover:bg-[var(--ivory-surface-hover)] border border-[var(--ivory-border)] text-[var(--ivory-text-2)] hover:text-[var(--ivory-text)] transition-colors cursor-pointer"
            data-testid="setup-ollama-btn"
          >
            <span className="font-medium">Use Ollama local server</span>
            <span className="text-[10px] text-[var(--ivory-text-3)]">Local</span>
          </button>
          <button
            onClick={() => handleQuickSetup('lmstudio')}
            className="w-full flex items-center justify-between px-4 py-2.5 text-xs rounded-xl bg-[var(--ivory-surface)] hover:bg-[var(--ivory-surface-hover)] border border-[var(--ivory-border)] text-[var(--ivory-text-2)] hover:text-[var(--ivory-text)] transition-colors cursor-pointer"
            data-testid="setup-lmstudio-btn"
          >
            <span className="font-medium">Use LM Studio local server</span>
            <span className="text-[10px] text-[var(--ivory-text-3)]">Local</span>
          </button>
          <button
            onClick={() => navigate('/settings/providers')}
            className="w-full flex items-center justify-between px-4 py-2.5 text-xs rounded-xl bg-[var(--ivory-accent-light)] hover:bg-[var(--ivory-accent-light)]/80 text-[var(--ivory-accent)] font-semibold transition-colors cursor-pointer"
            data-testid="setup-settings-btn"
          >
            <span>Open Provider Settings</span>
            <span>Configure →</span>
          </button>
        </div>
      </div>
    </div>
  )

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
    if (!activeChat?.model_id) {
      return renderNoModelCard()
    }
    return (
      <div className="flex flex-col h-full" data-testid="main-chat-panel">
        <div className="flex-1 flex items-center justify-center px-8 py-10">
          <div className="text-center max-w-2xl w-full">
            <div className="w-16 h-16 rounded-[22px] bg-[var(--ivory-accent-light)]/80 flex items-center justify-center mx-auto mb-6 shadow-[var(--shadow-card)] ring-1 ring-[var(--ivory-accent)]/10">
              <svg width="32" height="32" viewBox="0 0 64 64" fill="none">
                <circle cx="32" cy="32" r="30" fill="var(--ivory-accent-light)" stroke="var(--ivory-accent)" strokeWidth="1.5" opacity="0.9" />
                <path d="M18 44L26 20H29L21 44H18Z" fill="var(--ivory-accent)" />
                <path d="M46 44L38 20H35L43 44H46Z" fill="var(--ivory-accent)" />
                <rect x="23" y="34" width="18" height="3.5" rx="1" fill="var(--ivory-accent)" />
                <circle cx="32" cy="40" r="1.5" fill="#E8A45C" opacity="0.8" />
              </svg>
            </div>
            <h2 className="text-[28px] font-semibold tracking-tight mb-3 text-[var(--ivory-text)]">
              What should Aureon help with?
            </h2>
            <p className="text-[15px] text-[var(--ivory-text-3)] leading-relaxed mb-7 max-w-xl mx-auto">
              Work with providers, prompts, projects, and local previews from one calm desktop workspace.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
              {STARTER_PROMPTS.map(item => (
                <button
                  key={item.label}
                  onClick={() => insertStarterPrompt(item.prompt)}
                  className="group flex items-center gap-3 px-4 py-3 rounded-[18px] bg-[var(--ivory-elevated)] hover:bg-[var(--ivory-elevated-hover)] border border-[var(--ivory-border)] hover:border-[var(--ivory-border-2)] text-[var(--ivory-text-2)] hover:text-[var(--ivory-text)] shadow-[var(--shadow-xs)] hover:shadow-[var(--shadow-md)] transition-all duration-150"
                >
                  <div className="w-8 h-8 rounded-full bg-[var(--ivory-accent-light)] flex items-center justify-center shrink-0 text-[var(--ivory-accent)] group-hover:bg-white transition-colors">
                    {item.icon}
                  </div>
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center justify-center gap-2 mt-5">
              <button
                onClick={() => navigate('/settings/providers')}
                className="text-xs font-medium text-[var(--ivory-text-3)] hover:text-[var(--ivory-accent)] transition-colors"
              >
                Configure providers
              </button>
              <span className="text-[var(--ivory-text-3)]/50">·</span>
              <button
                onClick={() => navigate('/prompts')}
                className="text-xs font-medium text-[var(--ivory-text-3)] hover:text-[var(--ivory-accent)] transition-colors"
              >
                Browse prompt library
              </button>
            </div>
          </div>
        </div>
        <MessageInput onSend={handleSend} disabled={isStreaming} />
      </div>
    )
  }

  if (!activeChat.model_id) {
    return (
      <div className="flex flex-col h-full" data-testid="main-chat-panel">
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto"
          onScroll={handleScroll}
        >
          <div className="py-2">
            {activeChat.messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
        <div className="px-5 py-4 border-t border-[var(--ivory-border)] bg-[var(--ivory-elevated)]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl border border-[var(--ivory-error)]/25 bg-[var(--ivory-error-bg)]/30">
            <div>
              <h4 className="text-xs font-semibold text-[var(--ivory-text)]">Choose a provider/model to resume</h4>
              <p className="text-[10px] text-[var(--ivory-text-3)] mt-0.5">Select a model to continue this conversation.</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => handleQuickSetup('openrouter')}
                className="px-2.5 py-1.5 text-[10px] font-medium rounded-lg bg-[var(--ivory-surface)] hover:bg-[var(--ivory-surface-hover)] border border-[var(--ivory-border)] text-[var(--ivory-text-2)] hover:text-[var(--ivory-text)] transition-colors cursor-pointer"
                data-testid="resume-openrouter-btn"
              >
                OpenRouter Free
              </button>
              <button
                onClick={() => navigate('/settings/providers')}
                className="px-2.5 py-1.5 text-[10px] font-medium rounded-lg bg-[var(--ivory-accent)] text-white hover:bg-[var(--ivory-accent)]/90 transition-colors cursor-pointer"
                data-testid="resume-settings-btn"
              >
                Configure
              </button>
            </div>
          </div>
        </div>
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
