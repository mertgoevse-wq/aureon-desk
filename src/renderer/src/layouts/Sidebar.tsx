import React, { memo, useCallback, useEffect, useRef, useState } from 'react'
import {
  MessageSquare,
  Sparkles,
  Monitor,
  Code2,
  FolderOpen,
  Bot,
  Wrench,
  KeyRound,
  Settings,
  Plug,
  Boxes,
  FileText,
  Package,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  UserCircle,
} from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useUIStore } from '../stores/uiStore'
import { useChatStore } from '../stores/chatStore'
import { ChatList } from '../components/sidebar/ChatList'
import { useIpc } from '../hooks/useIpc'
import { VibeForgeBrandLockup, VibeForgeBrandLockupCompact } from '../components/shared/VibeForgeBrandLockup'
import type { ChatListItem } from '@shared/types/chat'

export const Sidebar = memo(function Sidebar(): React.ReactElement {
  const navigate = useNavigate()
  const location = useLocation()
  const { sidebarCollapsed, toggleSidebar, sidebarWidth, setSidebarWidth } = useUIStore()
  const { setChats, setLoadingChats, setActiveChatId, setActiveChat } = useChatStore()
  const api = useIpc()
  const resizeRef = useRef<{ startX: number; startWidth: number } | null>(null)

  const [showAdvancedNav, setShowAdvancedNav] = useState(() => {
    return localStorage.getItem('vb_show_advanced_nav') === 'true'
  })

  const toggleAdvancedNav = useCallback(() => {
    const nextVal = !showAdvancedNav
    setShowAdvancedNav(nextVal)
    localStorage.setItem('vb_show_advanced_nav', String(nextVal))
  }, [showAdvancedNav])

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
    navigate('/chat')
  }, [api, setChats, setActiveChatId, setActiveChat, navigate])

  const handleSelectChat = useCallback(async (id: string) => {
    setActiveChatId(id)
    navigate('/chat')
    try {
      const chat = await api.chatGet(id)
      setActiveChat(chat || null)
    } catch (err) {
      console.error('Failed to load chat:', err)
    }
  }, [api, navigate, setActiveChatId, setActiveChat])

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname === '/studio'
    }
    if (path.startsWith('/learn')) {
      return location.pathname.startsWith('/learn')
    }
    return location.pathname.startsWith(path)
  }

  // Navigation definition lists
  const primaryLinks = [
    { label: 'Build', icon: <Sparkles size={13} />, path: '/', testId: 'nav-studio' },
    { label: 'Chat', icon: <MessageSquare size={13} />, path: '/chat', testId: 'nav-chats' },
    { label: 'Code', icon: <Monitor size={13} />, path: '/preview', testId: 'nav-preview' },
    { label: 'Projects', icon: <FolderOpen size={13} />, path: '/projects', testId: 'nav-projects' },
  ]

  const secondaryLinks = [
    { label: 'Agents', icon: <Bot size={13} />, path: '/learn?tab=agents', testId: 'nav-agents' },
    { label: 'Skills', icon: <Wrench size={13} />, path: '/skills', testId: 'nav-skills' },
    { label: 'Vibe Coding', icon: <Code2 size={13} />, path: '/vibe', navigateTo: '/', testId: 'nav-vibe' },
    { label: 'Providers', icon: <KeyRound size={13} />, path: '/settings/providers', testId: 'nav-providers' },
    { label: 'Settings', icon: <Settings size={13} />, path: '/settings/general', testId: 'nav-settings' },
  ]

  const advancedLinks = [
    { label: 'MCP', icon: <Plug size={13} />, path: '/settings/tools', testId: 'nav-mcp' },
    { label: 'Connectors', icon: <Boxes size={13} />, path: '/settings/connectors', testId: 'nav-connectors' },
    { label: 'Logs', icon: <FileText size={13} />, path: '/settings/logs', testId: 'nav-logs' },
    { label: 'Developer Setup', icon: <Package size={13} />, path: '/settings/developer-setup', testId: 'nav-devsetup' },
    { label: 'Beta/Release', icon: <Code2 size={13} />, path: '/settings/developer', testId: 'nav-beta' },
  ]

  if (sidebarCollapsed) {
    return (
      <div
        className="flex flex-col items-center w-14 h-full border-r border-[var(--ivory-border)] bg-[var(--ivory-surface)] py-3 gap-1.5 shrink-0 select-none"
        role="navigation"
        aria-label="Sidebar navigation"
        data-testid="sidebar"
      >
        <VibeForgeBrandLockupCompact size={28} className="mb-1" />
        <button
          type="button"
          onClick={toggleSidebar}
          className="p-1.5 rounded-[var(--radius-md)] text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)] transition-colors duration-[var(--transition-fast)] mb-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35 cursor-pointer"
          aria-label="Expand sidebar"
        >
          <ChevronLeft size={16} className="rotate-180" />
        </button>

        <button
          type="button"
          onClick={handleNewChat}
          className="p-2 rounded-[var(--radius-md)] text-[var(--ivory-accent)] hover:text-[var(--ivory-accent-hover)] hover:bg-[var(--ivory-surface-2)] transition-colors duration-[var(--transition-fast)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35 cursor-pointer"
          aria-label="New chat"
          data-testid="new-chat-button"
        >
          <Plus size={18} />
        </button>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
          className="p-2 rounded-[var(--radius-md)] text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)] transition-colors duration-[var(--transition-fast)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35 cursor-pointer"
          aria-label="Search"
          data-testid="sidebar-search"
        >
          <Search size={17} />
        </button>

        <div className="w-5 border-t border-[var(--ivory-border)] my-1" />

        {/* Collapsed Primary Icons */}
        <div className="flex flex-col gap-1 w-full items-center">
          {primaryLinks.map((link) => (
            <button
              key={link.path}
              type="button"
              onClick={() => navigate(('navigateTo' in link ? link.navigateTo : link.path) as string)}
              title={link.label}
              className={`p-2 rounded-xl transition cursor-pointer ${isActive(link.path) ? 'text-[var(--ivory-accent)] bg-[var(--ivory-active-bg)] shadow-[var(--shadow-xs)]' : 'text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)]'}`}
              data-testid={link.testId}
            >
              {link.icon}
            </button>
          ))}
        </div>

        <div className="w-5 border-t border-[var(--ivory-border)] my-1" />

        {/* Collapsed Secondary Icons */}
        <div className="flex flex-col gap-1 w-full items-center">
          {secondaryLinks.map((link) => (
            <button
              key={link.path}
              type="button"
              onClick={() => navigate(link.path)}
              title={link.label}
              className={`p-2 rounded-xl transition cursor-pointer ${isActive(link.path) ? 'text-[var(--ivory-accent)] bg-[var(--ivory-active-bg)] shadow-[var(--shadow-xs)]' : 'text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)]'}`}
              data-testid={link.testId}
            >
              {link.icon}
            </button>
          ))}
        </div>

        <div className="w-5 border-t border-[var(--ivory-border)] my-1" />

        {/* Collapsed Advanced Toggle */}
        <button
          type="button"
          onClick={toggleAdvancedNav}
          title="Toggle Advanced Links"
          className="p-2 rounded-xl text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)] transition cursor-pointer"
        >
          {showAdvancedNav ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        {/* Collapsed Advanced Icons */}
        {showAdvancedNav && (
          <div className="flex flex-col gap-1 w-full items-center mt-1">
            {advancedLinks.map((link) => (
              <button
                key={link.path}
                type="button"
                onClick={() => navigate(link.path)}
                title={link.label}
                className={`p-2 rounded-xl transition cursor-pointer ${isActive(link.path) ? 'text-[var(--ivory-accent)] bg-[var(--ivory-active-bg)] shadow-[var(--shadow-xs)]' : 'text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)]'}`}
                data-testid={link.testId}
              >
                {link.icon}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex h-full shrink-0 relative select-none">
      <div
        className="flex flex-col h-full border-r border-[var(--ivory-border)] bg-[var(--ivory-surface)]"
        style={{ width: sidebarWidth }}
        role="navigation"
        aria-label="Main sidebar"
        data-testid="sidebar"
      >
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--ivory-border)]/30 bg-[var(--ivory-surface)]">
          <VibeForgeBrandLockup size={36} />
          <button
            type="button"
            onClick={toggleSidebar}
            className="p-1 rounded-lg text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)] transition duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft size={14} />
          </button>
        </div>

        <div className="px-3 py-2 space-y-1.5 border-b border-[var(--ivory-border)]/30">
          <button
            type="button"
            onClick={handleNewChat}
            className="h-8 w-full inline-flex items-center justify-center gap-1.5 rounded-lg text-[11px] font-semibold text-[var(--ivory-bronze)] bg-[var(--ivory-bronze-light)] hover:bg-[var(--ivory-bronze-light)]/80 border border-[var(--ivory-bronze)]/10 hover:border-[var(--ivory-bronze)]/20 transition shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35 cursor-pointer"
            aria-label="Create new chat"
            data-testid="new-chat-button"
          >
            <Plus size={13} />
            New Chat
          </button>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
            className="w-full h-7 px-3 inline-flex items-center gap-2 rounded-lg bg-[var(--ivory-bg)] border border-[var(--ivory-border)]/30 text-[10px] font-medium text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35 cursor-pointer"
            data-testid="sidebar-search"
          >
            <Search size={12} />
            <span className="truncate">Search...</span>
          </button>
        </div>

        {/* Scrollable Navigation List */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
          
          {/* Primary Links */}
          <div className="space-y-1">
            <p className="px-3 text-[10px] uppercase tracking-[0.06em] font-bold text-[var(--ivory-text-3)] font-body">Workspace</p>
            {primaryLinks.map((link) => {
              const active = isActive(link.path)
              return (
                <button
                  key={link.path}
                  type="button"
                  onClick={() => navigate(('navigateTo' in link ? link.navigateTo : link.path) as string)}
                  className={`w-full h-8 px-3 rounded-lg text-[11px] font-semibold transition cursor-pointer flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35 ${
                    active
                      ? 'bg-[var(--ivory-active-bg)] text-[var(--ivory-accent)] shadow-[var(--shadow-xs)]'
                      : 'text-[var(--ivory-text-2)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)]'
                  }`}
                  data-testid={link.testId}
                >
                  <span className={active ? 'text-[var(--ivory-accent)]' : 'text-[var(--ivory-text-3)]'}>
                    {link.icon}
                  </span>
                  <span>{link.label}</span>
                </button>
              )
            })}
          </div>

          {/* Secondary Links */}
          <div className="space-y-1">
            <p className="px-3 text-[10px] uppercase tracking-[0.06em] font-bold text-[var(--ivory-text-3)] font-body">Library & Setup</p>
            {secondaryLinks.map((link) => {
              const active = isActive(link.path)
              return (
                <button
                  key={link.path}
                  type="button"
                  onClick={() => navigate(link.path)}
                  className={`w-full h-8 px-3 rounded-lg text-[11px] font-semibold transition cursor-pointer flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35 ${
                    active
                      ? 'bg-[var(--ivory-active-bg)] text-[var(--ivory-accent)] shadow-[var(--shadow-xs)]'
                      : 'text-[var(--ivory-text-2)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)]'
                  }`}
                  data-testid={link.testId}
                >
                  <span className={active ? 'text-[var(--ivory-accent)]' : 'text-[var(--ivory-text-3)]'}>
                    {link.icon}
                  </span>
                  <span>{link.label}</span>
                </button>
              )
            })}
          </div>

          {/* Advanced Section Header Toggle */}
          <div className="border-t border-[var(--ivory-border)]/20 pt-3">
            <button
              type="button"
              onClick={toggleAdvancedNav}
              className="w-full flex items-center justify-between px-3 py-1 rounded-lg text-[10px] uppercase tracking-[0.06em] font-bold text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)] transition duration-150 cursor-pointer focus:outline-none focus-visible:ring-2"
            >
              <span>Advanced</span>
              {showAdvancedNav ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>

            {/* Advanced Links (Conditional rendering) */}
            {showAdvancedNav && (
              <div className="space-y-1 mt-1.5">
                {advancedLinks.map((link) => {
                  const active = isActive(link.path)
                  return (
                    <button
                      key={link.path}
                      type="button"
                      onClick={() => navigate(link.path)}
                      className={`w-full h-8 px-3 rounded-lg text-[11px] font-semibold transition cursor-pointer flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35 ${
                        active
                          ? 'bg-[var(--ivory-active-bg)] text-[var(--ivory-accent)] shadow-[var(--shadow-xs)]'
                          : 'text-[var(--ivory-text-2)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)]'
                      }`}
                      data-testid={link.testId}
                    >
                      <span className={active ? 'text-[var(--ivory-accent)]' : 'text-[var(--ivory-text-3)]'}>
                        {link.icon}
                      </span>
                      <span>{link.label}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Recents Chat List */}
          <div className="border-t border-[var(--ivory-border)]/20 pt-3">
            <div className="flex items-center justify-between px-3 pb-1">
              <p className="text-[10px] uppercase tracking-[0.06em] font-bold text-[var(--ivory-text-3)] font-body">Recents</p>
              <button
                type="button"
                onClick={() => navigate('/chat')}
                className="text-[10px] font-semibold text-[var(--ivory-text-3)] hover:text-[var(--ivory-accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35 rounded-md cursor-pointer"
              >
                View
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto">
              <ChatList onSelectChat={handleSelectChat} />
            </div>
          </div>

        </div>

        {/* Footer Profile Block */}
        <div className="border-t border-[var(--ivory-border)]/25 p-2.5 bg-[var(--ivory-surface)] flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <UserCircle size={13} className="text-[var(--ivory-text-3)] shrink-0" />
            <span className="text-[10px] font-medium text-[var(--ivory-text-3)] truncate font-body">Local profile</span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/settings/general')}
            className="p-1 rounded-lg text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)] transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35"
            aria-label="Open settings"
            data-testid="nav-settings-footer"
          >
            <Settings size={12} />
          </button>
        </div>
      </div>

      <div
        className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-[var(--ivory-accent)]/30 transition-colors z-10"
        onMouseDown={handleResizeStart}
      />
    </div>
  )
})
