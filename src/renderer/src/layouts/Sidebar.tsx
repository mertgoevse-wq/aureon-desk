import React, { useCallback, useEffect, useRef } from 'react'
import { MessageSquare, Library, FolderOpen, Wrench, Settings, Monitor, ChevronLeft, Plus } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useUIStore } from '../stores/uiStore'
import { useChatStore } from '../stores/chatStore'
import { ChatList } from '../components/sidebar/ChatList'
import { useIpc } from '../hooks/useIpc'
import type { ChatListItem } from '@shared/types/chat'

interface NavItem {
  icon: React.ReactNode
  label: string
  path: string
}

export function Sidebar(): React.ReactElement {
  const navigate = useNavigate()
  const location = useLocation()
  const { sidebarCollapsed, toggleSidebar, sidebarWidth, setSidebarWidth } = useUIStore()
  const { setChats, setLoadingChats, setActiveChatId, setActiveChat } = useChatStore()
  const api = useIpc()
  const resizeRef = useRef<{ startX: number; startWidth: number } | null>(null)

  useEffect(() => {
    loadChats()
  }, [])

  // Drag resize handler
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

  const handleSelectChat = useCallback(async (id: string) => {
    setActiveChatId(id)
    try {
      const chat = await api.chatGet(id)
      setActiveChat(chat || null)
    } catch (err) {
      console.error('Failed to load chat:', err)
    }
  }, [api, setActiveChatId, setActiveChat])

  const navItems: NavItem[] = [
    { icon: <MessageSquare size={18} />, label: 'Chats', path: '/' },
    { icon: <Library size={18} />, label: 'Prompts', path: '/prompts' },
    { icon: <FolderOpen size={18} />, label: 'Projects', path: '/projects' },
    { icon: <Wrench size={18} />, label: 'Tools', path: '/tools' },
    { icon: <Monitor size={18} />, label: 'Preview', path: '/preview' }
  ]

  const isNavActive = (path: string) => location.pathname === path || (path === '/' && location.pathname === '/')

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
          className="p-1.5 rounded-[var(--radius-md)] text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)] transition-colors duration-[var(--transition-fast)] mb-2"
          aria-label="Expand sidebar"
        >
          <ChevronLeft size={16} className="rotate-180" />
        </button>
        <button
          onClick={handleNewChat}
          className="p-2 rounded-[var(--radius-md)] text-[var(--ivory-accent)] hover:text-[var(--ivory-accent-hover)] hover:bg-[var(--ivory-surface-2)] transition-colors duration-[var(--transition-fast)]"
          aria-label="New chat"
          data-testid="new-chat-button"
        >
          <Plus size={18} />
        </button>
        <div className="w-5 border-t border-[var(--ivory-border)] my-1" />
        {navItems.map((item) => {
          const active = isNavActive(item.path)
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`p-2 rounded-[var(--radius-md)] transition-colors duration-[var(--transition-fast)]
                ${active
                  ? 'text-[var(--ivory-accent)] bg-[var(--ivory-bg)]'
                  : 'text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)]'}`}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              data-testid={`nav-${item.label.toLowerCase()}`}
            >
              {item.icon}
            </button>
          )
        })}
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
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--ivory-border)]">
          <div className="flex items-center gap-3 select-none">
            {/* Aureon mark */}
            <svg width="26" height="26" viewBox="0 0 64 64" fill="none" className="shrink-0">
              <circle cx="32" cy="32" r="30" fill="var(--color-accent-light)" stroke="var(--color-accent)" strokeWidth="1.5" opacity="0.9" />
              <path d="M18 44L26 20H29L21 44H18Z" fill="var(--color-accent)" />
              <path d="M46 44L38 20H35L43 44H46Z" fill="var(--color-accent)" />
              <rect x="23" y="34" width="18" height="3.5" rx="1" fill="var(--color-accent)" />
              <circle cx="32" cy="40" r="1.5" fill="#E8A45C" opacity="0.8" />
            </svg>
            <h1 className="text-lg font-semibold tracking-tight display-text">
              Aureon
            </h1>
          </div>
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)] transition-all duration-150"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft size={16} />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex flex-col gap-0.5 px-3 py-3 border-b border-[var(--ivory-border)]">
          {navItems.map((item) => {
            const active = isNavActive(item.path)
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px]
                  transition-all duration-150
                  ${active
                    ? 'bg-[var(--ivory-active-bg)] text-[var(--ivory-text)] font-semibold'
                    : 'text-[var(--ivory-text-2)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)] font-medium'}`}
                aria-label={`Navigate to ${item.label}`}
                aria-current={active ? 'page' : undefined}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>

        {/* New Chat Button */}
        <div className="px-3 py-3">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg
              text-[13px] font-medium text-[var(--ivory-text)]
              bg-[var(--ivory-accent-light)] hover:bg-[var(--ivory-accent)]/15
              border border-[var(--ivory-accent)]/20 hover:border-[var(--ivory-accent)]/30
              transition-all duration-150"
            aria-label="Create new chat"
            data-testid="new-chat-button"
          >
            <Plus size={15} />
            New Chat
          </button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          <ChatList onSelectChat={handleSelectChat} />
        </div>

        {/* Settings — anchored at bottom */}
        <div className="border-t border-[var(--ivory-border)] p-3">
          <button
            onClick={() => navigate('/settings')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg
              text-[13px] font-medium text-[var(--ivory-text-2)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)]
              transition-all duration-150"
            aria-label="Open settings"
            data-testid="nav-settings"
          >
            <Settings size={16} />
            Settings
          </button>
        </div>
      </div>

      {/* Drag resize handle */}
      <div
        className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-[var(--ivory-accent)]/30 transition-colors z-10"
        onMouseDown={handleResizeStart}
      />
    </div>
  )
}
