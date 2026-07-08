import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Archive,
  CalendarClock,
  ChevronLeft,
  ChevronDown,
  Code2,
  FolderOpen,
  Lightbulb,
  Library,
  MessageSquare,
  Plus,
  Search,
  SendHorizontal,
  Settings,
  SlidersHorizontal,
  UserCircle,
  Wrench
} from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useUIStore } from '../stores/uiStore'
import { useChatStore } from '../stores/chatStore'
import { ChatList } from '../components/sidebar/ChatList'
import { useIpc } from '../hooks/useIpc'
import type { ChatListItem } from '@shared/types/chat'

interface WorkflowItem {
  icon: React.ReactNode
  label: string
  hint: string
}

const workflowItems: WorkflowItem[] = [
  { icon: <CalendarClock size={15} />, label: 'Scheduled', hint: 'Planned runs' },
  { icon: <SendHorizontal size={15} />, label: 'Dispatch', hint: 'Agent queue' },
  { icon: <Lightbulb size={15} />, label: 'Ideas', hint: 'Draft backlog' },
  { icon: <SlidersHorizontal size={15} />, label: 'Customize', hint: 'Workspace rules' }
]

export function Sidebar(): React.ReactElement {
  const navigate = useNavigate()
  const location = useLocation()
  const { sidebarCollapsed, toggleSidebar, sidebarWidth, setSidebarWidth } = useUIStore()
  const { setChats, setLoadingChats, setActiveChatId, setActiveChat } = useChatStore()
  const api = useIpc()
  const resizeRef = useRef<{ startX: number; startWidth: number } | null>(null)
  const [workflowOpen, setWorkflowOpen] = useState(false)

  useEffect(() => {
    loadChats()
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizeRef.current) return
      const delta = e.clientX - resizeRef.current.startX
      setSidebarWidth(resizeRef.current.startWidth + delta)
    }
    const handleMouseUp = () => {
      resizeRef.current = null
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [setSidebarWidth])

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    resizeRef.current = { startX: e.clientX, startWidth: sidebarWidth }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  const loadChats = useCallback(async () => {
    setLoadingChats(true)
    try {
      const chatList = await api.chatList()
      setChats(chatList)
    } catch (err) {
      console.error('Failed to load chats:', err)
    } finally {
      setLoadingChats(false)
    }
  }, [api, setChats, setLoadingChats])

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
    navigate('/')
  }, [api, setChats, setActiveChatId, setActiveChat, navigate])

  const handleNewTask = useCallback(async () => {
    await handleNewChat()
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent('composer-insert', {
        detail: {
          text: 'Turn this into a practical task plan. Ask for missing context first, then propose the next concrete steps.',
          mode: 'replace'
        }
      }))
    }, 120)
  }, [handleNewChat])

  const handleSelectChat = useCallback(async (id: string) => {
    setActiveChatId(id)
    navigate('/')
    try {
      const chat = await api.chatGet(id)
      setActiveChat(chat || null)
    } catch (err) {
      console.error('Failed to load chat:', err)
    }
  }, [api, navigate, setActiveChatId, setActiveChat])

  const isActive = (path: string) => location.pathname === path || (path === '/' && location.pathname === '/')

  if (sidebarCollapsed) {
    return (
      <div
        className="flex flex-col items-center w-12 h-full border-r border-[var(--ivory-border)] bg-[var(--ivory-surface)] py-3 gap-1.5 shrink-0"
        role="navigation"
        aria-label="Sidebar navigation"
        data-testid="sidebar"
      >
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-[var(--radius-md)] text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)] transition-colors duration-[var(--transition-fast)] mb-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35"
          aria-label="Expand sidebar"
        >
          <ChevronLeft size={16} className="rotate-180" />
        </button>
        <button
          onClick={handleNewChat}
          className="p-2 rounded-[var(--radius-md)] text-[var(--ivory-accent)] hover:text-[var(--ivory-accent-hover)] hover:bg-[var(--ivory-surface-2)] transition-colors duration-[var(--transition-fast)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35"
          aria-label="New chat"
          data-testid="new-chat-button"
        >
          <Plus size={18} />
        </button>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
          className="p-2 rounded-[var(--radius-md)] text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)] transition-colors duration-[var(--transition-fast)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35"
          aria-label="Search"
          data-testid="sidebar-search"
        >
          <Search size={17} />
        </button>
        <div className="w-5 border-t border-[var(--ivory-border)] my-1" />
        <button
          onClick={() => navigate('/')}
          className={`p-2 rounded-[var(--radius-md)] transition-colors duration-[var(--transition-fast)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35 ${isActive('/') ? 'text-[var(--ivory-accent)] bg-[var(--ivory-bg)]' : 'text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)]'}`}
          aria-label="Chat"
          data-testid="nav-chats"
        >
          <MessageSquare size={18} />
        </button>
        <button
          onClick={() => navigate('/prompts')}
          className={`p-2 rounded-[var(--radius-md)] transition-colors duration-[var(--transition-fast)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35 ${isActive('/prompts') ? 'text-[var(--ivory-accent)] bg-[var(--ivory-bg)]' : 'text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)]'}`}
          aria-label="Prompts"
          data-testid="nav-prompts"
        >
          <Library size={18} />
        </button>
        <button
          onClick={() => navigate('/preview')}
          className={`p-2 rounded-[var(--radius-md)] transition-colors duration-[var(--transition-fast)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35 ${isActive('/preview') ? 'text-[var(--ivory-accent)] bg-[var(--ivory-bg)]' : 'text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)]'}`}
          aria-label="Preview"
          data-testid="nav-preview"
        >
          <Code2 size={18} />
        </button>
        <button
          onClick={() => navigate('/cowork')}
          className={`p-2 rounded-[var(--radius-md)] transition-colors duration-[var(--transition-fast)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35 ${isActive('/cowork') ? 'text-[var(--ivory-accent)] bg-[var(--ivory-bg)]' : 'text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)]'}`}
          aria-label="Cowork"
          data-testid="nav-cowork"
        >
          <Archive size={18} />
        </button>
        <button
          onClick={() => navigate('/settings')}
          className="mt-auto p-2 rounded-[var(--radius-md)] text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)] transition-colors duration-[var(--transition-fast)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35"
          aria-label="Settings"
          data-testid="nav-settings"
        >
          <Settings size={18} />
        </button>
      </div>
    )
  }

  return (
    <div className="flex h-full shrink-0 relative">
      <div
        className="flex flex-col h-full border-r border-[var(--ivory-border)] bg-[var(--ivory-surface)]"
        style={{ width: sidebarWidth }}
        role="navigation"
        aria-label="Main sidebar"
        data-testid="sidebar"
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--ivory-border)] bg-[var(--ivory-surface)]">
          <div className="flex items-center gap-3 select-none min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-[var(--ivory-accent-light)] flex items-center justify-center shadow-[var(--shadow-xs)] ring-1 ring-[var(--ivory-accent)]/15 shrink-0">
              <svg width="21" height="21" viewBox="0 0 64 64" fill="none" aria-hidden="true">
                <circle cx="32" cy="32" r="30" fill="var(--ivory-accent-light)" stroke="var(--ivory-accent)" strokeWidth="1.5" opacity="0.9" />
                <path d="M18 44L26 20H29L21 44H18Z" fill="var(--ivory-accent)" />
                <path d="M46 44L38 20H35L43 44H46Z" fill="var(--ivory-accent)" />
                <rect x="23" y="34" width="18" height="3.5" rx="1" fill="var(--ivory-accent)" />
                <circle cx="32" cy="40" r="1.5" fill="#E8A45C" opacity="0.8" />
              </svg>
            </div>
            <div className="min-w-0">
              <h1 className="text-[16px] font-semibold tracking-tight display-text text-[var(--ivory-text)] truncate">
                Aureon Desk
              </h1>
              <p className="text-[10px] text-[var(--ivory-text-3)] truncate">Personal AI workspace</p>
            </div>
          </div>
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)] transition-all duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft size={16} />
          </button>
        </div>

        <div className="px-3 py-3 space-y-2 border-b border-[var(--ivory-border)]">
          <div className="flex gap-2">
            <button
              onClick={handleNewChat}
              className="h-10 flex-1 inline-flex items-center justify-center gap-2 rounded-2xl text-[12px] font-semibold text-[var(--ivory-text)] bg-[var(--ivory-accent-light)] hover:bg-[var(--ivory-accent)]/15 border border-[var(--ivory-accent)]/20 hover:border-[var(--ivory-accent)]/35 transition-all shadow-[var(--shadow-xs)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35"
              aria-label="Create new chat"
              data-testid="new-chat-button"
            >
              <Plus size={14} />
              New Chat
            </button>
            <button
              onClick={handleNewTask}
              className="h-10 w-10 inline-flex items-center justify-center rounded-2xl text-[var(--ivory-text-2)] bg-[var(--ivory-bg)] hover:bg-[var(--ivory-surface-2)] border border-[var(--ivory-border)] transition-all shadow-[var(--shadow-xs)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35"
              aria-label="Create new task"
              title="New Task"
              data-testid="new-task-button"
            >
              <Archive size={14} />
            </button>
          </div>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
            className="w-full h-9 px-3 inline-flex items-center gap-2 rounded-2xl bg-[var(--ivory-bg)] border border-[var(--ivory-border)] text-[12px] font-medium text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35"
            data-testid="sidebar-search"
          >
            <Search size={14} />
            <span className="truncate">Search chats, prompts, commands</span>
          </button>
          <div className="grid grid-cols-3 gap-1.5" aria-label="Workspace shortcuts">
            <button
              type="button"
              onClick={() => navigate('/')}
              className={`h-9 inline-flex items-center justify-center rounded-2xl border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35 ${isActive('/') ? 'border-[var(--ivory-accent)]/20 bg-[var(--ivory-active-bg)] text-[var(--ivory-accent)]' : 'border-[var(--ivory-border)] bg-[var(--ivory-bg)] text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)]'}`}
              aria-label="Chat"
              title="Chat"
              data-testid="nav-chats"
            >
              <MessageSquare size={13} />
            </button>
            <button
              type="button"
              onClick={() => navigate('/prompts')}
              className={`h-9 inline-flex items-center justify-center rounded-2xl border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35 ${isActive('/prompts') ? 'border-[var(--ivory-accent)]/20 bg-[var(--ivory-active-bg)] text-[var(--ivory-accent)]' : 'border-[var(--ivory-border)] bg-[var(--ivory-bg)] text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)]'}`}
              aria-label="Prompts"
              title="Prompts"
              data-testid="nav-prompts"
            >
              <Library size={13} />
            </button>
            <button
              type="button"
              onClick={() => navigate('/preview')}
              className={`h-9 inline-flex items-center justify-center rounded-2xl border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35 ${isActive('/preview') ? 'border-[var(--ivory-accent)]/20 bg-[var(--ivory-active-bg)] text-[var(--ivory-accent)]' : 'border-[var(--ivory-border)] bg-[var(--ivory-bg)] text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)]'}`}
              aria-label="Code"
              title="Code"
              data-testid="nav-preview"
            >
              <Code2 size={13} />
            </button>
          </div>
        </div>

        <div className="px-3 py-2 border-b border-[var(--ivory-border)]">
          <button
            type="button"
            onClick={() => setWorkflowOpen(open => !open)}
            className="w-full flex items-center justify-between px-2 py-2 rounded-xl text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35"
            aria-expanded={workflowOpen}
          >
            <span>Workflow</span>
            <span className="inline-flex items-center gap-1 normal-case tracking-normal text-[10px] font-semibold">
              {workflowItems.length}
              <ChevronDown size={12} className={`transition-transform ${workflowOpen ? 'rotate-180' : ''}`} />
            </span>
          </button>
          {workflowOpen && (
            <div className="mt-1 space-y-1">
              {workflowItems.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => navigate('/cowork')}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35
                    ${location.pathname === '/cowork'
                      ? 'bg-[var(--ivory-active-bg)] text-[var(--ivory-text)]'
                      : 'text-[var(--ivory-text-2)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)]'}`}
                  data-testid={`workflow-${item.label.toLowerCase()}`}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="text-[var(--ivory-text-3)] shrink-0">{item.icon}</span>
                    <span className="min-w-0">
                      <span className="block text-[12px] font-semibold truncate">{item.label}</span>
                      <span className="block text-[10px] text-[var(--ivory-text-3)] truncate">{item.hint}</span>
                    </span>
                  </span>
                  <span className="shrink-0 rounded-full border border-[var(--ivory-border)] bg-[var(--ivory-bg)] px-1.5 py-0.5 text-[9px] font-semibold text-[var(--ivory-text-3)]">
                    Soon
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-3 py-2 border-b border-[var(--ivory-border)]">
          <div className="flex items-center justify-between px-2 mb-2">
            <p className="text-[10px] uppercase tracking-[0.08em] font-bold text-[var(--ivory-text-3)]">Projects</p>
            <button
              type="button"
              onClick={() => navigate('/projects')}
              className="p-1 rounded-lg text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35"
              aria-label="Open projects"
            >
              <Plus size={12} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => navigate('/projects')}
              className={`h-9 flex items-center justify-center gap-1.5 px-2 rounded-xl text-[11px] font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35
                ${isActive('/projects') ? 'bg-[var(--ivory-active-bg)] text-[var(--ivory-text)]' : 'text-[var(--ivory-text-2)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)]'}`}
              data-testid="nav-projects"
            >
              <FolderOpen size={14} className="text-[var(--ivory-accent)]" />
              Projects
            </button>
            <button
              onClick={() => navigate('/tools')}
              className={`h-9 flex items-center justify-center gap-1.5 px-2 rounded-xl text-[11px] font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35
                ${isActive('/tools') ? 'bg-[var(--ivory-active-bg)] text-[var(--ivory-text)]' : 'text-[var(--ivory-text-2)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)]'}`}
              data-testid="nav-tools"
            >
              <Wrench size={14} className="text-[var(--ivory-accent)]" />
              Tools
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="flex items-center justify-between px-5 pt-3 pb-1">
            <p className="text-[10px] uppercase tracking-[0.08em] font-bold text-[var(--ivory-text-3)]">Recents</p>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-[10px] font-semibold text-[var(--ivory-text-3)] hover:text-[var(--ivory-accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35 rounded-md"
            >
              View
            </button>
          </div>
          <ChatList onSelectChat={handleSelectChat} />
        </div>

        <div className="border-t border-[var(--ivory-border)] p-3 bg-[var(--ivory-surface)]">
          <div className="flex items-center gap-2 p-2 rounded-2xl bg-[var(--ivory-bg)] border border-[var(--ivory-border)]">
            <div className="w-8 h-8 rounded-full bg-[var(--ivory-surface-2)] flex items-center justify-center text-[var(--ivory-text-3)] shrink-0">
              <UserCircle size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold text-[var(--ivory-text)] truncate">Local profile</p>
              <p className="text-[10px] text-[var(--ivory-text-3)] truncate">Settings and providers</p>
            </div>
            <button
              onClick={() => navigate('/settings')}
              className="p-2 rounded-xl text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35"
              aria-label="Open settings"
              data-testid="nav-settings"
            >
              <Settings size={15} />
            </button>
          </div>
        </div>
      </div>

      <div
        className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-[var(--ivory-accent)]/30 transition-colors z-10"
        onMouseDown={handleResizeStart}
      />
    </div>
  )
}
