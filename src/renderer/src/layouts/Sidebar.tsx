import React, { useCallback, useEffect } from 'react'
import { MessageSquare, Library, FolderOpen, Wrench, Settings, ChevronLeft, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
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
  const { sidebarCollapsed, toggleSidebar, sidebarWidth } = useUIStore()
  const { setChats, setLoadingChats, setActiveChatId, setActiveChat } = useChatStore()
  const api = useIpc()

  useEffect(() => {
    loadChats()
  }, [])

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
  }, [api, setChats, setActiveChatId, setActiveChat])

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
    { icon: <Wrench size={18} />, label: 'Tools', path: '/tools' }
  ]

  if (sidebarCollapsed) {
    return (
      <div className="flex flex-col items-center w-12 h-full border-r border-[var(--ivory-border)] bg-[var(--ivory-surface)] py-3 gap-2">
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-[var(--radius-md)] text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)] transition-colors mb-2"
        >
          <ChevronLeft size={16} className="rotate-180" />
        </button>
        <button
          onClick={handleNewChat}
          className="p-2 rounded-[var(--radius-md)] text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)] transition-colors"
          title="New Chat"
        >
          <Plus size={18} />
        </button>
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="p-2 rounded-[var(--radius-md)] text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)] transition-colors"
            title={item.label}
          >
            {item.icon}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div
      className="flex flex-col h-full border-r border-[var(--ivory-border)] bg-[var(--ivory-surface)]"
      style={{ width: sidebarWidth }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--ivory-border)]">
        <h1 className="text-lg font-semibold display-text text-[var(--ivory-text)] select-none">
          Aureon
        </h1>
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-[var(--radius-md)] text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)] transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-[var(--ivory-border)]">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs
              text-[var(--ivory-text-2)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)] transition-colors"
          >
            {item.icon}
            <span className="hidden sm:inline">{item.label}</span>
          </button>
        ))}
      </div>

      {/* New Chat Button */}
      <div className="px-3 py-2">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)]
            text-sm text-[var(--ivory-text-2)] hover:text-[var(--ivory-text)]
            hover:bg-[var(--ivory-surface-2)] border border-dashed border-[var(--ivory-border)]
            hover:border-[var(--ivory-border-2)] transition-colors"
        >
          <Plus size={16} />
          New Chat
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        <ChatList onSelectChat={handleSelectChat} />
      </div>

      {/* Settings */}
      <div className="border-t border-[var(--ivory-border)] p-2">
        <button
          onClick={() => navigate('/settings')}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)]
            text-sm text-[var(--ivory-text-2)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)] transition-colors"
        >
          <Settings size={16} />
          Settings
        </button>
      </div>
    </div>
  )
}
