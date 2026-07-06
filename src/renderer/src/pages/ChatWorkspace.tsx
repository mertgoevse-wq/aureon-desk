import React, { useCallback, useEffect, useState } from 'react'
import { ChatPanel } from '../components/chat/ChatPanel'
import { ModelSelector } from '../components/chat/ModelSelector'
import { useChatStore } from '../stores/chatStore'
import { useIpc } from '../hooks/useIpc'
import { ScrollText, ChevronDown } from 'lucide-react'
import type { SystemPromptRow } from '@shared/types/prompt'

export function ChatWorkspace(): React.ReactElement {
  const { activeChat, activeChatId, updateChatInList } = useChatStore()
  const api = useIpc()
  const [promptsOpen, setPromptsOpen] = useState(false)
  const [systemPrompts, setSystemPrompts] = useState<SystemPromptRow[]>([])
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null)

  useEffect(() => {
    if (activeChat?.system_prompt_id) {
      setSelectedPromptId(activeChat.system_prompt_id)
    } else {
      setSelectedPromptId(null)
    }
    // Load prompts for the dropdown
    api.systemPromptList(false).then(setSystemPrompts).catch(console.error)
  }, [activeChat?.system_prompt_id, activeChatId])

  const selectedPrompt = systemPrompts.find(p => p.id === selectedPromptId)

  const handleModelChange = useCallback(async (modelId: string | null) => {
    if (!activeChatId) return
    try {
      await api.chatUpdate(activeChatId, { model_id: modelId })
    } catch (err) {
      console.error('Failed to update chat model:', err)
    }
  }, [activeChatId, api])

  const handlePromptChange = useCallback(async (promptId: string | null) => {
    if (!activeChatId) return
    try {
      await api.chatUpdate(activeChatId, { system_prompt_id: promptId })
      setSelectedPromptId(promptId)
    } catch (err) {
      console.error('Failed to update chat prompt:', err)
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
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--ivory-border)] bg-[var(--ivory-bg)] gap-3">
        <h2 className="text-sm font-semibold display-text text-[var(--ivory-text)] truncate">
          {activeChat.title}
        </h2>
        <div className="flex items-center gap-2 shrink-0">
          {/* System Prompt Profile Selector */}
          <div className="relative">
            <button
              onClick={() => { setPromptsOpen(!promptsOpen); api.systemPromptList(false).then(setSystemPrompts) }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-[var(--radius-md)]
                bg-[var(--ivory-surface)] border border-[var(--ivory-border)] text-[var(--ivory-text-2)]
                hover:bg-[var(--ivory-surface-2)] transition-colors"
            >
              <ScrollText size={12} className="text-[var(--ivory-accent)]" />
              <span className="max-w-[120px] truncate">
                {selectedPrompt ? selectedPrompt.name : 'No profile'}
              </span>
              <ChevronDown size={12} />
            </button>
            {promptsOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setPromptsOpen(false)} />
                <div className="absolute top-full right-0 mt-1 w-64 z-20 bg-[var(--ivory-bg)] border border-[var(--ivory-border)] rounded-[var(--radius-md)] shadow-[var(--shadow-lg)] max-h-60 overflow-y-auto">
                  <button
                    onClick={() => { handlePromptChange(null); setPromptsOpen(false) }}
                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-[var(--ivory-surface)] transition-colors
                      ${!selectedPromptId ? 'bg-[var(--ivory-surface)] text-[var(--ivory-text)]' : 'text-[var(--ivory-text-3)]'}`}
                  >
                    No profile (bare API call)
                  </button>
                  {systemPrompts.filter(p => !p.is_archived).map(prompt => (
                    <button
                      key={prompt.id}
                      onClick={() => { handlePromptChange(prompt.id); setPromptsOpen(false) }}
                      className={`w-full text-left px-3 py-1.5 text-xs hover:bg-[var(--ivory-surface)] transition-colors
                        ${prompt.id === selectedPromptId ? 'bg-[var(--ivory-surface)] text-[var(--ivory-text)] font-medium' : 'text-[var(--ivory-text-2)]'}`}
                    >
                      {prompt.name}
                      {prompt.is_default === 1 && <span className="text-[var(--ivory-accent)] ml-1">(default)</span>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <ModelSelector
            value={activeChat.model_id}
            onChange={handleModelChange}
          />
        </div>
      </div>

      {/* Chat Panel */}
      <ChatPanel />
    </div>
  )
}
