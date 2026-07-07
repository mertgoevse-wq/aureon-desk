import React, { useCallback, useEffect, useState } from 'react'
import { ChatPanel } from '../components/chat/ChatPanel'
import { ModelSelector } from '../components/chat/ModelSelector'
import { useChatStore } from '../stores/chatStore'
import { useIpc } from '../hooks/useIpc'
import { MessageSquare, ScrollText, FolderOpen, Wrench, ChevronDown } from 'lucide-react'
import type { SystemPromptRow } from '@shared/types/prompt'

export function ChatWorkspace(): React.ReactElement {
  const { activeChat, activeChatId } = useChatStore()
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
    if (!activeChatId || !activeChat) return
    try {
      await api.chatUpdate(activeChatId, { model_id: modelId })
      useChatStore.setState({
        activeChat: {
          ...activeChat,
          model_id: modelId
        }
      })
    } catch (err) {
      console.error('Failed to update chat model:', err)
    }
  }, [activeChatId, activeChat, api])

  const handlePromptChange = useCallback(async (promptId: string | null) => {
    if (!activeChatId || !activeChat) return
    try {
      await api.chatUpdate(activeChatId, { system_prompt_id: promptId })
      setSelectedPromptId(promptId)
      useChatStore.setState({
        activeChat: {
          ...activeChat,
          system_prompt_id: promptId
        }
      })
    } catch (err) {
      console.error('Failed to update chat prompt:', err)
    }
  }, [activeChatId, activeChat, api])

  if (!activeChat) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6">
        <h1 className="text-3xl font-semibold text-[var(--ivory-text)] mb-3 tracking-tight display-text">
          Aureon Desk
        </h1>
        <p className="text-sm text-[var(--ivory-text-3)] max-w-md mb-8 leading-relaxed">
          Your personal AI workspace. Select a chat from the sidebar or create a new one to get started.
        </p>
        <div className="grid grid-cols-2 gap-3 text-xs text-[var(--ivory-text-3)] max-w-sm">
          <div className="flex flex-col items-center gap-1.5 p-3 rounded-[var(--radius-md)] bg-[var(--ivory-surface)]">
            <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--ivory-bg)] flex items-center justify-center">
              <MessageSquare size={14} className="text-[var(--ivory-accent)]" />
            </div>
            <span className="text-[var(--ivory-text-2)] font-medium">Multi-Provider</span>
            <span className="text-[10px]">OpenAI · Claude · Gemini · Local</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 p-3 rounded-[var(--radius-md)] bg-[var(--ivory-surface)]">
            <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--ivory-bg)] flex items-center justify-center">
              <ScrollText size={14} className="text-[var(--ivory-accent)]" />
            </div>
            <span className="text-[var(--ivory-text-2)] font-medium">Profiles</span>
            <span className="text-[10px]">System prompts & routing</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 p-3 rounded-[var(--radius-md)] bg-[var(--ivory-surface)]">
            <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--ivory-bg)] flex items-center justify-center">
              <FolderOpen size={14} className="text-[var(--ivory-accent)]" />
            </div>
            <span className="text-[var(--ivory-text-2)] font-medium">Projects</span>
            <span className="text-[10px]">Local file access & context</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 p-3 rounded-[var(--radius-md)] bg-[var(--ivory-surface)]">
            <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--ivory-bg)] flex items-center justify-center">
              <Wrench size={14} className="text-[var(--ivory-accent)]" />
            </div>
            <span className="text-[var(--ivory-text-2)] font-medium">Tools</span>
            <span className="text-[10px]">MCP-style integrations</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--ivory-border)] bg-[var(--ivory-elevated)]/80 gap-4 min-w-0 shadow-[var(--shadow-xs)]">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-[var(--ivory-text)] truncate min-w-0">
            {activeChat.title}
          </h2>
          <p className="text-[11px] text-[var(--ivory-text-3)] mt-0.5 truncate">
            {selectedPrompt ? selectedPrompt.name : 'No system profile'} · {activeChat.model_id ? 'Model selected' : 'Choose a model to start'}
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          {/* System Prompt Profile Selector */}
          <div className="relative">
            <button
              onClick={() => { setPromptsOpen(!promptsOpen); api.systemPromptList(false).then(setSystemPrompts) }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full
                bg-[var(--ivory-bg)] border border-[var(--ivory-border)] text-[var(--ivory-text-2)]
                hover:bg-[var(--ivory-surface)] hover:border-[var(--ivory-border-2)] transition-all"
              data-testid="system-profile-selector"
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
                <div className="absolute top-full right-0 mt-2 w-72 z-20 bg-[var(--ivory-elevated)] border border-[var(--ivory-border)] rounded-[18px] shadow-[var(--shadow-xl)] max-h-72 overflow-y-auto p-1 space-y-0.5">
                  <button
                    onClick={() => { handlePromptChange(null); setPromptsOpen(false) }}
                    className={`w-[calc(100%-8px)] mx-1 text-left px-3 py-2 text-xs rounded-xl transition-colors cursor-pointer
                      ${!selectedPromptId ? 'bg-[var(--ivory-surface)] text-[var(--ivory-text)] font-semibold' : 'text-[var(--ivory-text-3)] hover:bg-[var(--ivory-surface)]'}`}
                  >
                    No profile (bare API call)
                  </button>
                  {systemPrompts.filter(p => !p.is_archived).map(prompt => {
                    const isSelected = prompt.id === selectedPromptId
                    return (
                      <button
                        key={prompt.id}
                        onClick={() => { handlePromptChange(prompt.id); setPromptsOpen(false) }}
                        className={`w-[calc(100%-8px)] mx-1 text-left px-3 py-2 text-xs rounded-xl transition-colors cursor-pointer
                          ${isSelected ? 'bg-[var(--ivory-surface)] text-[var(--ivory-text)] font-semibold' : 'text-[var(--ivory-text-2)] hover:bg-[var(--ivory-surface)]'}`}
                      >
                        <span className="truncate">{prompt.name}</span>
                        {prompt.is_default === 1 && <span className="text-[var(--ivory-accent)] ml-1 font-normal text-[10px]">(default)</span>}
                      </button>
                    )
                  })}
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
      <div className="flex-1 min-h-0">
        <ChatPanel />
      </div>
    </div>
  )
}
