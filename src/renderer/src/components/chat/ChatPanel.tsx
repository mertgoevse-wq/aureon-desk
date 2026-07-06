import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageBubble } from './MessageBubble'
import { MessageInput } from './MessageInput'
import { EmptyState } from '../shared/EmptyState'
import { useChatStore } from '../../stores/chatStore'
import { useRoutingStore } from '../../stores/routingStore'
import { useIpc } from '../../hooks/useIpc'
import { AlertTriangle, RotateCcw, Wrench } from 'lucide-react'
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

  useEffect(() => {
    scrollToBottom()
  }, [activeChat?.messages])

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

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
          <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-red-100 text-red-600">
            <AlertTriangle size={14} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="font-medium mb-1">Assistant unavailable</p>
              <p className="text-red-600">{streamError}</p>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleRetry}
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-red-100 hover:bg-red-200 text-red-700 transition-colors"
                >
                  <RotateCcw size={12} />
                  Retry
                </button>
                <button
                  onClick={() => navigate('/settings/providers')}
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-red-100 hover:bg-red-200 text-red-700 transition-colors"
                >
                  <Wrench size={12} />
                  Open Provider Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // Thinking bubble component
  const ThinkingBubble = () => (
    <div className="px-4 py-3 bg-[var(--ivory-bg)]">
      <div className="mx-auto max-w-3xl flex gap-3">
        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-[var(--ivory-surface-3)] text-[var(--ivory-text-2)]">
          <div className="flex gap-0.5">
            <span className="w-1 h-1 bg-[var(--ivory-text-2)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1 h-1 bg-[var(--ivory-text-2)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1 h-1 bg-[var(--ivory-text-2)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm text-[var(--ivory-text-2)] italic py-1">
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
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            title="Start a conversation"
            description="Send a message to begin. Configure a provider in Settings to get AI responses."
          />
        </div>
        <MessageInput onSend={handleSend} disabled={isStreaming} />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto"
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
