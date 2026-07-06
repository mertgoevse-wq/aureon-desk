import React from 'react'
import { ChatPanel } from '../components/chat/ChatPanel'
import { ModelSelector } from '../components/chat/ModelSelector'
import { useChatStore } from '../stores/chatStore'
import { useIpc } from '../hooks/useIpc'
import { useCallback } from 'react'

export function ChatWorkspace(): React.ReactElement {
  const { activeChat, activeChatId, updateChatInList } = useChatStore()
  const api = useIpc()

  const handleModelChange = useCallback(async (modelId: string | null) => {
    if (!activeChatId) return
    try {
      await api.chatUpdate(activeChatId, { model_id: modelId })
    } catch (err) {
      console.error('Failed to update chat model:', err)
    }
  }, [activeChatId, api])

  if (!activeChat) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4">
        <h2 className="text-2xl font-semibold display-text text-[var(--ivory-text)] mb-2">
          Aureon Desk
        </h2>
        <p className="text-sm text-[var(--ivory-text-3)] max-w-md mb-6">
          Your personal AI workspace. Select a chat from the sidebar or create a new one to get started.
        </p>
        <div className="flex flex-col gap-2 text-sm text-[var(--ivory-text-3)]">
          <span>• Multi-provider chat with API key management</span>
          <span>• System prompt profiles & prompt library</span>
          <span>• Project workspaces with local file access</span>
          <span>• MCP tool integration & tool transcript</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--ivory-border)] bg-[var(--ivory-bg)]">
        <h2 className="text-sm font-semibold display-text text-[var(--ivory-text)]">
          {activeChat.title}
        </h2>
        <ModelSelector
          value={activeChat.model_id}
          onChange={handleModelChange}
        />
      </div>

      {/* Chat Panel */}
      <ChatPanel />
    </div>
  )
}
