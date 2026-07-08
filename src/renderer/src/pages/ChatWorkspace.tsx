import React, { useCallback, useEffect, useState } from 'react'
import { ChatPanel } from '../components/chat/ChatPanel'
import { ModelSelector } from '../components/chat/ModelSelector'
import { useChatStore } from '../stores/chatStore'
import { useIpc } from '../hooks/useIpc'
import { MessageSquare, ScrollText, FolderOpen, Wrench, ChevronDown, Plus, Sparkles } from 'lucide-react'
import type { SystemPromptRow } from '@shared/types/prompt'
import type { ChatListItem } from '@shared/types/chat'

interface ModelOption {
  id: string
  display_name: string
  provider_name: string
  provider_slug: string
}

export function ChatWorkspace(): React.ReactElement {
  const { activeChat, activeChatId, setChats, setActiveChatId, setActiveChat } = useChatStore()
  const api = useIpc()
  const [promptsOpen, setPromptsOpen] = useState(false)
  const [systemPrompts, setSystemPrompts] = useState<SystemPromptRow[]>([])
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null)
  const [enabledModels, setEnabledModels] = useState<ModelOption[]>([])

  useEffect(() => {
    if (activeChat?.system_prompt_id) {
      setSelectedPromptId(activeChat.system_prompt_id)
    } else {
      setSelectedPromptId(null)
    }
    // Load prompts for the dropdown
    api.systemPromptList(false).then(setSystemPrompts).catch(console.error)
  }, [activeChat?.system_prompt_id, activeChatId])

  useEffect(() => {
    api.modelAllEnabled().then((models: ModelOption[]) => setEnabledModels(models || [])).catch(console.error)
  }, [api, activeChat?.model_id])

  const selectedPrompt = systemPrompts.find(p => p.id === selectedPromptId)
  const selectedModel = enabledModels.find(model => model.id === activeChat?.model_id)
  const selectedModelLabel = selectedModel
    ? `${selectedModel.provider_name} · ${selectedModel.display_name}`
    : activeChat?.model_id
      ? 'Model selected'
      : 'Choose a model to start'

  const handleNewChat = useCallback(async () => {
    const chat = await api.chatCreate({})
    const newItem: ChatListItem = {
      id: chat.id,
      title: chat.title,
      updated_at: chat.updated_at,
      message_count: 0,
      last_message_preview: null
    }
    setChats([newItem, ...useChatStore.getState().chats])
    setActiveChatId(chat.id)
    setActiveChat({ ...chat, messages: [] })
  }, [api, setChats, setActiveChatId, setActiveChat])

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
      <div className="h-full overflow-y-auto bg-[var(--ivory-bg)]">
        <div className="min-h-full flex items-center justify-center px-6 py-8">
          <div className="w-full max-w-4xl text-center">
            <div className="w-16 h-16 rounded-[24px] bg-[var(--ivory-accent-light)]/80 flex items-center justify-center mx-auto mb-5 shadow-[var(--shadow-card)] ring-1 ring-[var(--ivory-accent)]/10">
              <Sparkles size={24} className="text-[var(--ivory-accent)]" />
            </div>
            <h1 className="text-[34px] font-semibold text-[var(--ivory-text)] mb-3 tracking-tight display-text">
              Aureon Desk
            </h1>
            <p className="text-[14px] text-[var(--ivory-text-3)] max-w-xl mx-auto mb-6 leading-relaxed">
              A calm local-first workspace for chats, provider setup, prompt profiles, projects, and live previews.
            </p>
            <button
              type="button"
              onClick={handleNewChat}
              className="h-11 px-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--ivory-accent-light)] border border-[var(--ivory-accent)]/20 text-[13px] font-semibold text-[var(--ivory-text)] hover:bg-[var(--ivory-accent)]/15 transition-colors shadow-[var(--shadow-sm)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35 mb-6"
              data-testid="empty-home-new-chat"
            >
              <Plus size={15} />
              Start a new chat
            </button>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs text-[var(--ivory-text-3)] max-w-3xl mx-auto">
              <div className="flex flex-col items-center gap-1.5 p-4 rounded-[22px] bg-[var(--ivory-surface)] border border-[var(--ivory-border)] shadow-[var(--shadow-xs)]">
                <div className="w-9 h-9 rounded-2xl bg-[var(--ivory-bg)] flex items-center justify-center">
                  <MessageSquare size={14} className="text-[var(--ivory-accent)]" />
                </div>
                <span className="text-[var(--ivory-text-2)] font-semibold">Multi-provider</span>
                <span className="text-[10px]">Cloud and local models</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 p-4 rounded-[22px] bg-[var(--ivory-surface)] border border-[var(--ivory-border)] shadow-[var(--shadow-xs)]">
                <div className="w-9 h-9 rounded-2xl bg-[var(--ivory-bg)] flex items-center justify-center">
                  <ScrollText size={14} className="text-[var(--ivory-accent)]" />
                </div>
                <span className="text-[var(--ivory-text-2)] font-semibold">Profiles</span>
                <span className="text-[10px]">System prompts</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 p-4 rounded-[22px] bg-[var(--ivory-surface)] border border-[var(--ivory-border)] shadow-[var(--shadow-xs)]">
                <div className="w-9 h-9 rounded-2xl bg-[var(--ivory-bg)] flex items-center justify-center">
                  <FolderOpen size={14} className="text-[var(--ivory-accent)]" />
                </div>
                <span className="text-[var(--ivory-text-2)] font-semibold">Projects</span>
                <span className="text-[10px]">Workspace context</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 p-4 rounded-[22px] bg-[var(--ivory-surface)] border border-[var(--ivory-border)] shadow-[var(--shadow-xs)]">
                <div className="w-9 h-9 rounded-2xl bg-[var(--ivory-bg)] flex items-center justify-center">
                  <Wrench size={14} className="text-[var(--ivory-accent)]" />
                </div>
                <span className="text-[var(--ivory-text-2)] font-semibold">Tools</span>
                <span className="text-[10px]">MCP-style setup</span>
              </div>
            </div>
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
            {selectedPrompt ? selectedPrompt.name : 'No system profile'} · {selectedModelLabel}
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
