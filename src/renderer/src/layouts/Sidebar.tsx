import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Archive,
  ChevronLeft,
  Code2,
  FolderOpen,
  Library,
  MessageSquare,
  Plus,
  Search,
  Settings,
  Sparkles,
  UserCircle,
  Wrench
} from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useUIStore } from '../stores/uiStore'
import { useChatStore } from '../stores/chatStore'
import { ChatList } from '../components/sidebar/ChatList'
import { useIpc } from '../hooks/useIpc'
import { BrandLockup } from '../components/shared/BrandLockup'

import type { ChatListItem } from '@shared/types/chat'

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
    if (path === '/studio') return location.pathname === '/' || location.pathname === '/studio'
    return location.pathname === path
  }

  if (sidebarCollapsed) {
    return (
      <div
        className="flex flex-col items-center w-14 h-full border-r border-[var(--ivory-border)] bg-[var(--ivory-surface)] py-3 gap-1.5 shrink-0"
        role="navigation"
        aria-label="Sidebar navigation"
        data-testid="sidebar"
      >
        <button
          type="button"
          onClick={toggleSidebar}
          className="p-1.5 rounded-[var(--radius-md)] text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)] transition-colors duration-[var(--transition-fast)] mb-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35"
          aria-label="Expand sidebar"
        >
          <ChevronLeft size={16} className="rotate-180" />
        </button>
        <button
          type="button"
          onClick={handleNewChat}
          className="p-2 rounded-[var(--radius-md)] text-[var(--ivory-accent)] hover:text-[var(--ivory-accent-hover)] hover:bg-[var(--ivory-surface-2)] transition-colors duration-[var(--transition-fast)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35"
          aria-label="New chat"
          data-testid="new-chat-button"
        >
          <Plus size={18} />
        </button>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
          className="p-2 rounded-[var(--radius-md)] text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)] transition-colors duration-[var(--transition-fast)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35"
          aria-label="Search"
          data-testid="sidebar-search"
        >
          <Search size={17} />
        </button>
        <div className="w-5 border-t border-[var(--ivory-border)] my-1" />
        <button
          type="button"
          onClick={() => navigate('/')}
          className={`p-2 rounded-[var(--radius-md)] transition-colors duration-[var(--transition-fast)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35 ${isActive('/studio') ? 'text-[var(--ivory-accent)] bg-[var(--ivory-bg)]' : 'text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)]'}`}
          aria-label="Studio"
          data-testid="nav-studio"
        >
          <Sparkles size={18} />
        </button>
        <button
          type="button"
          onClick={() => navigate('/chat')}
          className={`p-2 rounded-[var(--radius-md)] transition-colors duration-[var(--transition-fast)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35 ${isActive('/chat') ? 'text-[var(--ivory-accent)] bg-[var(--ivory-bg)]' : 'text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)]'}`}
          aria-label="Chat"
          data-testid="nav-chats"
        >
          <MessageSquare size={18} />
        </button>
        <button
          type="button"
          onClick={() => navigate('/prompts')}
          className={`p-2 rounded-[var(--radius-md)] transition-colors duration-[var(--transition-fast)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35 ${isActive('/prompts') ? 'text-[var(--ivory-accent)] bg-[var(--ivory-bg)]' : 'text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)]'}`}
          aria-label="Prompts"
          data-testid="nav-prompts"
        >
          <Library size={18} />
        </button>
        <button
          type="button"
          onClick={() => navigate('/preview')}
          className={`p-2 rounded-[var(--radius-md)] transition-colors duration-[var(--transition-fast)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35 ${isActive('/preview') ? 'text-[var(--ivory-accent)] bg-[var(--ivory-bg)]' : 'text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)]'}`}
          aria-label="Preview"
          data-testid="nav-preview"
        >
          <Code2 size={18} />
        </button>
        <button
          type="button"
          onClick={() => navigate('/cowork')}
          className={`p-2 rounded-[var(--radius-md)] transition-colors duration-[var(--transition-fast)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35 ${isActive('/cowork') ? 'text-[var(--ivory-accent)] bg-[var(--ivory-bg)]' : 'text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)]'}`}
          aria-label="Cowork"
          data-testid="nav-cowork"
        >
          <Archive size={18} />
        </button>
        <button
          type="button"
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
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--ivory-border)]/30 bg-[var(--ivory-surface)]">
          <BrandLockup size={36} />
          <button
            type="button"
            onClick={toggleSidebar}
            className="p-1 rounded-lg text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)] transition-all duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft size={14} />
          </button>
        </div>

        <div className="px-3 py-2 space-y-1.5 border-b border-[var(--ivory-border)]/30">
          <button
            type="button"
            onClick={handleNewChat}
            className="h-8 w-full inline-flex items-center justify-center gap-1.5 rounded-lg text-[11px] font-semibold text-[var(--ivory-bronze)] bg-[var(--ivory-bronze-light)] hover:bg-[var(--ivory-bronze-light)]/80 border border-[var(--ivory-bronze)]/10 hover:border-[var(--ivory-bronze)]/20 transition-all shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35"
            aria-label="Create new chat"
            data-testid="new-chat-button"
          >
            <Plus size={13} />
            New Chat
          </button>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
            className="w-full h-7 px-3 inline-flex items-center gap-2 rounded-lg bg-[var(--ivory-bg)] border border-[var(--ivory-border)]/30 text-[10px] font-medium text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35"
            data-testid="sidebar-search"
          >
            <Search size={12} />
            <span className="truncate">Search...</span>
          </button>
          <div className="grid grid-cols-4 gap-1 pt-0.5" aria-label="Workspace shortcuts">
            <button
              type="button"
              onClick={() => navigate('/')}
              className={`h-8 inline-flex items-center justify-center rounded-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35 cursor-pointer ${isActive('/studio') ? 'bg-[var(--ivory-elevated)] text-[var(--ivory-accent)] shadow-[var(--shadow-xs)]' : 'text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)]'}`}
              aria-label="Studio"
              title="Studio"
              data-testid="nav-studio"
            >
              <Sparkles size={13} />
            </button>
            <button
              type="button"
              onClick={() => navigate('/chat')}
              className={`h-8 inline-flex items-center justify-center rounded-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35 cursor-pointer ${isActive('/chat') ? 'bg-[var(--ivory-elevated)] text-[var(--ivory-accent)] shadow-[var(--shadow-xs)]' : 'text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)]'}`}
              aria-label="Chat"
              title="Chat"
              data-testid="nav-chats"
            >
              <MessageSquare size={13} />
            </button>
            <button
              type="button"
              onClick={() => navigate('/prompts')}
              className={`h-8 inline-flex items-center justify-center rounded-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35 cursor-pointer ${isActive('/prompts') ? 'bg-[var(--ivory-elevated)] text-[var(--ivory-accent)] shadow-[var(--shadow-xs)]' : 'text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)]'}`}
              aria-label="Prompts"
              title="Prompts"
              data-testid="nav-prompts"
            >
              <Library size={13} />
            </button>
            <button
              type="button"
              onClick={() => navigate('/preview')}
              className={`h-8 inline-flex items-center justify-center rounded-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35 cursor-pointer ${isActive('/preview') ? 'bg-[var(--ivory-elevated)] text-[var(--ivory-accent)] shadow-[var(--shadow-xs)]' : 'text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)]'}`}
              aria-label="Code"
              title="Code"
              data-testid="nav-preview"
            >
              <Code2 size={13} />
            </button>
          </div>
        </div>

        <div className="px-3 py-1 border-b border-[var(--ivory-border)]/30">
          <div className="flex items-center justify-between px-1.5 mb-0.5">
            <p className="text-ui-caption uppercase tracking-[0.06em] font-bold text-[var(--ivory-text-3)] font-body">Projects</p>
            <button
              type="button"
              onClick={() => navigate('/projects')}
              className="p-1 rounded-lg text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35 cursor-pointer"
              aria-label="Open projects"
            >
              <Plus size={12} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1 font-body">
            <button
              type="button"
              onClick={() => navigate('/projects')}
              className={`h-8 flex items-center justify-center gap-1.5 px-2 rounded-xl text-[11px] font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35 cursor-pointer
                ${isActive('/projects') ? 'bg-[var(--ivory-elevated)] border border-[var(--ivory-border)] text-[var(--ivory-text)] shadow-[var(--shadow-xs)]' : 'text-[var(--ivory-text-2)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)] border border-transparent'}`}
              data-testid="nav-projects"
            >
              <FolderOpen size={13} className="text-[var(--ivory-accent)]" />
              Projects
            </button>
            <button
              type="button"
              onClick={() => navigate('/tools')}
              className={`h-8 flex items-center justify-center gap-1.5 px-2 rounded-xl text-[11px] font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35 cursor-pointer
                ${isActive('/tools') ? 'bg-[var(--ivory-elevated)] border border-[var(--ivory-border)] text-[var(--ivory-text)] shadow-[var(--shadow-xs)]' : 'text-[var(--ivory-text-2)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)] border border-transparent'}`}
              data-testid="nav-tools"
            >
              <Wrench size={13} className="text-[var(--ivory-accent)]" />
              Tools
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="flex items-center justify-between px-5 pt-2.5 pb-1">
            <p className="text-ui-caption uppercase tracking-[0.06em] font-bold text-[var(--ivory-text-3)] font-body">Recents</p>
            <button
              type="button"
              onClick={() => navigate('/chat')}
              className="text-ui-caption font-semibold text-[var(--ivory-text-3)] hover:text-[var(--ivory-accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35 rounded-md cursor-pointer"
            >
              View
            </button>
          </div>
          <ChatList onSelectChat={handleSelectChat} />
        </div>

        <div className="border-t border-[var(--ivory-border)]/25 p-2.5 bg-[var(--ivory-surface)] flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <UserCircle size={13} className="text-[var(--ivory-text-3)] shrink-0" />
            <span className="text-[10px] font-medium text-[var(--ivory-text-3)] truncate font-body">Local profile</span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="p-1 rounded-lg text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)] transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35"
            aria-label="Open settings"
            data-testid="nav-settings"
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
}
