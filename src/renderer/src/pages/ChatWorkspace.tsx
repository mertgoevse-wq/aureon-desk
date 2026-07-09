import React, { useCallback, useEffect, useState } from 'react'
import { ChatPanel } from '../components/chat/ChatPanel'
import { ModelSelector } from '../components/chat/ModelSelector'
import { MessageInput } from '../components/chat/MessageInput'
import { useChatStore } from '../stores/chatStore'
import { useUIStore } from '../stores/uiStore'
import { useIpc } from '../hooks/useIpc'
import { useNavigate } from 'react-router-dom'

import {
  MessageSquare, ScrollText, FolderOpen, Wrench, ChevronDown,
  Sparkles, SlidersHorizontal, Clock3, AlertTriangle,
  BookOpen, Zap, Monitor, KeyRound, Package, Bug
} from 'lucide-react'
import type { SystemPromptRow } from '@shared/types/prompt'
import type { ChatListItem } from '@shared/types/chat'

interface ModelOption {
  id: string
  display_name: string
  provider_name: string
  provider_slug: string
}

const STARTER_PROMPTS = [
  {
    label: 'Build counter app',
    icon: <Monitor size={14} />,
    prompt: 'Build a small counter app with increment, decrement, and reset buttons. Use a single HTML file with clean ivory styling and smooth animations. I want to preview it live.'
  },
  {
    label: 'Fix layout bug',
    icon: <Bug size={14} />,
    prompt: 'I have a layout issue in my app. Help me diagnose what might be causing it. Ask me questions about what I see, then propose a step-by-step fix.'
  },
  {
    label: 'Improve my UI',
    icon: <Sparkles size={14} />,
    prompt: 'Help me improve the visual design of my app. Make it look more professional with better spacing, typography, and subtle animations. Keep the calm ivory theme.'
  },
  {
    label: 'Connect OpenRouter',
    icon: <KeyRound size={14} />,
    prompt: 'Help me set up OpenRouter as my AI provider. Guide me through getting an API key and configuring it in Aureon Desk settings.'
  },
  {
    label: 'Create a preview',
    icon: <Monitor size={14} />,
    prompt: 'Build a small self-contained app for me to preview live. Keep it simple — a single HTML page with clean UI, warm ivory colors, and rounded corners.'
  },
  {
    label: 'Explain this error',
    icon: <AlertTriangle size={14} />,
    prompt: 'I am encountering an error. Can you explain what it means in simple terms and show me how to fix it step by step?\n\n```\n[paste your error here]\n```'
  },
  {
    label: 'Package Windows',
    icon: <Package size={14} />,
    prompt: 'I want to package my desktop app for Windows. Help me set up electron-builder, create an installer, and test the build. Do not hardcode any secrets or API keys.'
  }
]

function getTimeAwareGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 5) return 'Late session'
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function ChatWorkspace(): React.ReactElement {
  const { activeChat, activeChatId, setChats, setActiveChatId, setActiveChat } = useChatStore()
  const api = useIpc()
  const navigate = useNavigate()
  const [promptsOpen, setPromptsOpen] = useState(false)
  const [systemPrompts, setSystemPrompts] = useState<SystemPromptRow[]>([])
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null)
  const [enabledModels, setEnabledModels] = useState<ModelOption[]>([])

  // Home states (when activeChat is null)
  const [homeModelId, setHomeModelId] = useState<string | null>(null)
  const [homePromptId, setHomePromptId] = useState<string | null>(null)
  const [homeProjectId, setHomeProjectId] = useState<string | null>(null)
  const [homePromptsOpen, setHomePromptsOpen] = useState(false)
  const [homeProjectsOpen, setHomeProjectsOpen] = useState(false)
  const [toolsCount, setToolsCount] = useState(0)
  const [projects, setProjects] = useState<any[]>([])

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

  // Load defaults for the empty home page
  useEffect(() => {
    if (activeChat) return

    api.modelAllEnabled()
      .then((models: ModelOption[]) => {
        setEnabledModels(models || [])
        const def = models.find((m: any) => m.is_default === 1 || m.is_enabled === 1) || models[0]
        if (def) setHomeModelId(def.id)
      })
      .catch(console.error)

    api.systemPromptList(false)
      .then((prompts: SystemPromptRow[]) => {
        setSystemPrompts(prompts || [])
        const def = prompts.find((p: SystemPromptRow) => p.is_default === 1) || prompts[0]
        if (def) setHomePromptId(def.id)
      })
      .catch(console.error)

    api.projectList(false)
      .then((projs: any[]) => {
        setProjects(projs || [])
        const active = projs.find((p: any) => p.is_active === 1 || p.is_active === true) || projs[0]
        if (active) setHomeProjectId(active.id)
      })
      .catch(console.error)

    api.toolList()
      .then((list: any[]) => {
        const count = list.filter((t: any) => t.is_enabled === 1 || t.is_enabled === true).length
        setToolsCount(count)
      })
      .catch(console.error)
  }, [api, activeChat])

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

  const handleHomeSend = useCallback(async (content: string) => {
    try {
      const chat = await api.chatCreate({
        model_id: homeModelId,
        system_prompt_id: homePromptId,
        project_id: homeProjectId
      })

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

      // Dispatch event for ChatPanel to start streaming completion
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('home-chat-start', { detail: { content } }))
      }, 100)
    } catch (err) {
      console.error('Failed to create home chat:', err)
    }
  }, [api, homeModelId, homePromptId, homeProjectId, setChats, setActiveChatId, setActiveChat])

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
    const selectedHomePrompt = systemPrompts.find(p => p.id === homePromptId)
    const selectedHomeModel = enabledModels.find(m => m.id === homeModelId)
    const selectedHomeProject = projects.find(p => p.id === homeProjectId)

    return (
      <div className="h-full overflow-y-auto bg-[var(--ivory-bg)] bg-hero-radial" data-testid="chat-home-page">
        <div className="min-h-full flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-3xl text-center flex flex-col items-center">
            {/* Greeting */}
            <h1 className="text-4xl font-semibold text-[var(--ivory-text)] tracking-tight font-display mb-7 select-none">
              {getTimeAwareGreeting()}, Mert
            </h1>

            {/* Large Centered Composer Card */}
            <div className="w-full rounded-[28px] border border-[var(--ivory-border)] bg-[var(--ivory-elevated)] shadow-[var(--shadow-lg)] ring-1 ring-white/60 overflow-hidden mb-6">
              <div className="px-4 pt-4 text-left">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {/* Model Selector */}
                  <ModelSelector
                    value={homeModelId}
                    onChange={setHomeModelId}
                  />

                  {/* System Prompt Selector */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => { setHomePromptsOpen(!homePromptsOpen); api.systemPromptList(false).then(setSystemPrompts) }}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-[var(--ivory-bg)] border border-[var(--ivory-border)] text-[11px] font-semibold text-[var(--ivory-text-2)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface)] transition-colors focus:outline-none cursor-pointer"
                    >
                      <SlidersHorizontal size={12} className="text-[var(--ivory-accent)]" />
                      <span>{selectedHomePrompt ? selectedHomePrompt.name : 'System style'}</span>
                      <ChevronDown size={10} className="text-[var(--ivory-text-3)]" />
                    </button>
                    {homePromptsOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setHomePromptsOpen(false)} />
                        <div className="absolute left-0 mt-1.5 w-64 rounded-2xl border border-[var(--ivory-border)] bg-[var(--ivory-elevated)] p-1.5 shadow-[var(--shadow-lg)] z-20 max-h-72 overflow-y-auto text-left">
                          <button
                            type="button"
                            onClick={() => { setHomePromptId(null); setHomePromptsOpen(false) }}
                            className={`w-full text-left px-3 py-2 text-xs rounded-xl transition-colors flex items-center gap-2 cursor-pointer
                              ${!homePromptId ? 'bg-[var(--ivory-active-bg)] text-[var(--ivory-text)] font-semibold' : 'text-[var(--ivory-text-2)] hover:bg-[var(--ivory-surface)]'}`}
                          >
                            No system profile
                          </button>
                          {systemPrompts.map(p => (
                            <button
                              type="button"
                              key={p.id}
                              onClick={() => { setHomePromptId(p.id); setHomePromptsOpen(false) }}
                              className={`w-full text-left px-3 py-2 text-xs rounded-xl transition-colors flex items-center gap-2 cursor-pointer
                                ${homePromptId === p.id ? 'bg-[var(--ivory-active-bg)] text-[var(--ivory-text)] font-semibold' : 'text-[var(--ivory-text-2)] hover:bg-[var(--ivory-surface)]'}`}
                            >
                              <span>{p.name}</span>
                              {p.is_default === 1 && <span className="text-[9px] px-1 py-0.5 rounded bg-[var(--ivory-surface-2)] text-[var(--ivory-text-3)] ml-auto">default</span>}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Project Selector */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => { setHomeProjectsOpen(!homeProjectsOpen); api.projectList(false).then(setProjects) }}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-[var(--ivory-bg)] border border-[var(--ivory-border)] text-[11px] font-semibold text-[var(--ivory-text-2)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface)] transition-colors focus:outline-none cursor-pointer"
                    >
                      <FolderOpen size={12} className="text-[var(--ivory-accent)]" />
                      <span>{selectedHomeProject ? selectedHomeProject.name : 'Choose project'}</span>
                      <ChevronDown size={10} className="text-[var(--ivory-text-3)]" />
                    </button>
                    {homeProjectsOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setHomeProjectsOpen(false)} />
                        <div className="absolute left-0 mt-1.5 w-64 rounded-2xl border border-[var(--ivory-border)] bg-[var(--ivory-elevated)] p-1.5 shadow-[var(--shadow-lg)] z-20 max-h-72 overflow-y-auto text-left">
                          <button
                            type="button"
                            onClick={() => { setHomeProjectId(null); setHomeProjectsOpen(false) }}
                            className={`w-full text-left px-3 py-2 text-xs rounded-xl transition-colors flex items-center gap-2 cursor-pointer
                              ${!homeProjectId ? 'bg-[var(--ivory-active-bg)] text-[var(--ivory-text)] font-semibold' : 'text-[var(--ivory-text-2)] hover:bg-[var(--ivory-surface)]'}`}
                          >
                            No project context
                          </button>
                          {projects.map(p => (
                            <button
                              type="button"
                              key={p.id}
                              onClick={() => { setHomeProjectId(p.id); setHomeProjectsOpen(false) }}
                              className={`w-full text-left px-3 py-2 text-xs rounded-xl transition-colors flex items-center gap-2 cursor-pointer
                                ${homeProjectId === p.id ? 'bg-[var(--ivory-active-bg)] text-[var(--ivory-text)] font-semibold' : 'text-[var(--ivory-text-2)] hover:bg-[var(--ivory-surface)]'}`}
                            >
                              <span>{p.name}</span>
                              {p.is_active === 1 && <span className="text-[9px] px-1 py-0.5 rounded bg-[var(--ivory-surface-2)] text-[var(--ivory-text-3)] ml-auto">active</span>}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Tools Badge */}
                  <button
                    type="button"
                    onClick={() => navigate('/tools')}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-[var(--ivory-bg)] border border-[var(--ivory-border)] text-[11px] font-semibold text-[var(--ivory-text-2)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface)] transition-colors focus:outline-none cursor-pointer"
                  >
                    <Wrench size={11} className="text-[var(--ivory-accent)]" />
                    <span>{toolsCount} tools active</span>
                  </button>

                  {/* Setup Provider Callout Badge */}
                  {enabledModels.length === 0 && (
                    <button
                      type="button"
                      onClick={() => navigate('/settings/providers')}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-red-50 border border-red-200 text-[11px] font-semibold text-red-700 hover:bg-red-100/55 hover:border-red-300 transition-colors focus:outline-none cursor-pointer"
                    >
                      <Zap size={11} className="text-red-500 animate-pulse" />
                      <span>Setup Provider</span>
                    </button>
                  )}
                </div>
              </div>
              <MessageInput
                onSend={handleHomeSend}
                placeholder="How can Aureon help you today?"
              />
            </div>

            {/* Suggestions & Recent Chats Row — Centered & Quiet */}
            <div className="w-full max-w-xl text-left space-y-6">
              {/* Suggestion pills */}
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {STARTER_PROMPTS.slice(0, 2).map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleHomeSend(item.prompt)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--ivory-elevated)] border border-[var(--ivory-border)]/50 hover:border-[var(--ivory-accent)]/25 rounded-full text-[11px] font-semibold text-[var(--ivory-text-2)] hover:text-[var(--ivory-text)] transition-all cursor-pointer shadow-none select-none"
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => navigate('/vibe')}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--ivory-elevated)] border border-[var(--ivory-border)]/60 rounded-full text-[11px] font-medium text-[var(--ivory-text-3)] hover:text-[var(--ivory-text-2)] transition-all cursor-pointer select-none"
                >
                  <span>More…</span>
                </button>
              </div>

              {/* Recent chats list */}
              <div className="mt-3">
                <div className="flex items-center justify-between px-1 mb-2">
                  <div className="flex items-center gap-1.5">
                    <Clock3 size={11} className="text-[var(--ivory-text-3)]" />
                    <p className="text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--ivory-text-3)] font-body">Recent</p>
                  </div>
                  {useChatStore.getState().chats.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (useUIStore.getState().sidebarCollapsed) {
                          useUIStore.getState().toggleSidebar()
                        }
                        window.dispatchEvent(new CustomEvent('open-command-palette'))
                      }}
                      className="text-[10px] font-semibold text-[var(--ivory-accent)] hover:underline cursor-pointer"
                    >
                      View all
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {useChatStore.getState().chats.slice(0, 2).map(chat => (
                    <button
                      key={chat.id}
                      type="button"
                      onClick={async () => {
                        setActiveChatId(chat.id)
                        const fullChat = await api.chatGet(chat.id)
                        setActiveChat(fullChat || null)
                      }}
                      className="flex flex-col p-3 rounded-xl bg-[var(--ivory-elevated)] border border-[var(--ivory-border)]/60 hover:border-[var(--ivory-accent)]/20 transition-all text-left focus:outline-none cursor-pointer"
                    >
                      <span className="block text-[12px] font-semibold text-[var(--ivory-text)] truncate">{chat.title}</span>
                      <span className="block text-[10px] text-[var(--ivory-text-3)] truncate font-body mt-0.5">
                        {chat.last_message_preview || `${chat.message_count} messages`}
                      </span>
                    </button>
                  ))}
                  {useChatStore.getState().chats.length === 0 && (
                    <div className="col-span-1 sm:col-span-2 py-3 rounded-xl bg-[var(--ivory-elevated)] border border-dashed border-[var(--ivory-border)]/60 text-center">
                      <p className="text-[10px] text-[var(--ivory-text-3)] font-body">No recent chats yet.</p>
                    </div>
                  )}
                </div>
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
              type="button"
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
                    type="button"
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
                        type="button"
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
