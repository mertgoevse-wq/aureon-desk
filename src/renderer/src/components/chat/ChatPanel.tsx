import React, { useCallback, useEffect, useRef } from 'react'
import { MessageBubble } from './MessageBubble'
import { MessageInput } from './MessageInput'
import { EmptyState } from '../shared/EmptyState'
import { useChatStore } from '../../stores/chatStore'
import { useIpc } from '../../hooks/useIpc'
import type { MessageRow } from '@shared/types/chat'

export function ChatPanel(): React.ReactElement {
  const { activeChat, activeChatId, addMessage, updateChatInList } = useChatStore()
  const api = useIpc()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Scroll to bottom when messages change
    scrollToBottom()
  }, [activeChat?.messages])

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleSend = useCallback(async (content: string) => {
    if (!activeChatId) return

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

    // Persist to database
    try {
      await api.messageAdd({
        chat_id: activeChatId,
        role: 'user',
        content
      })

      // Update chat in list
      updateChatInList(activeChatId, {
        last_message_preview: content.slice(0, 100)
      })
    } catch (err) {
      console.error('Failed to save message:', err)
    }
  }, [activeChatId, activeChat, addMessage, api, updateChatInList])

  if (!activeChat || activeChat.messages.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            title="Start a conversation"
            description="Send a message to begin. Your chat history is stored locally."
          />
        </div>
        <MessageInput onSend={handleSend} />
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
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <MessageInput onSend={handleSend} />
    </div>
  )
}
