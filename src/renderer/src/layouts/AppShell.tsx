import React, { useEffect, useState, useRef } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { RightInspector } from './RightInspector'
import { ToastContainer } from '../components/shared/Toast'
import { CommandPalette } from '../components/shared/CommandPalette'
import { ShortcutsHelp } from '../components/shared/ShortcutsHelp'
import type { CommandItem } from '../components/shared/CommandPalette'
import { useUIStore, loadPanelSizes } from '../stores/uiStore'
import { useChatStore } from '../stores/chatStore'
import { useIpc } from '../hooks/useIpc'
import {
  MessageSquare, Library, FolderOpen, Wrench, Settings,
  ScrollText, Server, FileText, Github, Eye, Plus, PanelLeft,
  PanelRight, RotateCcw, Keyboard, Sun
} from 'lucide-react'
import type { ChatListItem } from '@shared/types/chat'

export function AppShell(): React.ReactElement {
  const navigate = useNavigate()
  const api = useIpc()
  const { toggleSidebar, toggleInspector, resetLayout, sidebarCollapsed, inspectorOpen } = useUIStore()
  const { setChats, setActiveChatId, setActiveChat } = useChatStore()
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const paletteOpenRef = useRef(false)
  const shortcutsOpenRef = useRef(false)

  // Keep refs in sync with state
  useEffect(() => { paletteOpenRef.current = paletteOpen }, [paletteOpen])
  useEffect(() => { shortcutsOpenRef.current = shortcutsOpen }, [shortcutsOpen])

  // Load persisted panel sizes on mount
  useEffect(() => {
    loadPanelSizes()
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey

      // Ctrl+K — Command palette
      if (mod && e.key === 'k') {
        e.preventDefault()
        setPaletteOpen(true)
        return
      }

      // Ctrl+/ — Shortcuts help
      if (mod && e.key === '/') {
        e.preventDefault()
        setShortcutsOpen(true)
        return
      }

      // Don't trigger navigation shortcuts when typing in input/textarea
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) {
        // Esc blurs the field AND closes any open modals
        if (e.key === 'Escape') {
          (e.target as HTMLElement).blur()
          if (paletteOpenRef.current) setPaletteOpen(false)
          if (shortcutsOpenRef.current) setShortcutsOpen(false)
        }
        return
      }

      // Esc — Close modals if open
      if (e.key === 'Escape') {
        if (paletteOpenRef.current) { setPaletteOpen(false); return }
        if (shortcutsOpenRef.current) { setShortcutsOpen(false); return }
        return
      }

      if (!mod) return

      // Ctrl+N — New chat
      if (e.key === 'n') {
        e.preventDefault()
        handleNewChat()
        return
      }

      // Ctrl+Shift+P — Prompt library
      if (e.shiftKey && (e.key === 'P' || e.key === 'p')) {
        e.preventDefault()
        navigate('/prompts')
        return
      }

      // Ctrl+, — Settings
      if (e.key === ',') {
        e.preventDefault()
        navigate('/settings')
        return
      }

      // Ctrl+L — Focus message composer
      if (e.key === 'l') {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('focus-composer'))
        return
      }

      // Ctrl+B — Toggle sidebar
      if (e.key === 'b') {
        e.preventDefault()
        toggleSidebar()
        return
      }

      // Ctrl+I — Toggle inspector
      if (e.key === 'i') {
        e.preventDefault()
        toggleInspector()
        return
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [navigate, toggleSidebar, toggleInspector])

  const handleNewChat = async () => {
    try {
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
    } catch { /* ignore */ }
  }

  const commandItems: CommandItem[] = [
    {
      id: 'new-chat',
      label: 'New Chat',
      description: 'Start a new conversation',
      icon: <Plus size={14} />,
      onSelect: () => handleNewChat()
    },
    {
      id: 'home',
      label: 'Chats',
      description: 'View and manage conversations',
      icon: <MessageSquare size={14} />,
      onSelect: () => navigate('/')
    },
    {
      id: 'prompts',
      label: 'Prompt Library',
      description: 'Browse and create reusable prompts',
      icon: <Library size={14} />,
      onSelect: () => navigate('/prompts')
    },
    {
      id: 'projects',
      label: 'Projects',
      description: 'Manage project workspaces',
      icon: <FolderOpen size={14} />,
      onSelect: () => navigate('/projects')
    },
    {
      id: 'tools',
      label: 'Tools & MCP',
      description: 'Configure tool integrations',
      icon: <Wrench size={14} />,
      onSelect: () => navigate('/tools')
    },
    {
      id: 'system-prompts',
      label: 'System Prompt Profiles',
      description: 'Define AI behavior across chats',
      icon: <ScrollText size={14} />,
      onSelect: () => navigate('/settings/system-prompts')
    },
    {
      id: 'providers',
      label: 'Provider Settings',
      description: 'Manage API keys and connections',
      icon: <Server size={14} />,
      onSelect: () => navigate('/settings/providers')
    },
    {
      id: 'imports',
      label: 'GitHub Imports',
      description: 'Import repositories and prompts',
      icon: <Github size={14} />,
      onSelect: () => navigate('/settings/github')
    },
    {
      id: 'logs',
      label: 'Logs & Debug',
      description: 'View logs and export debug bundle',
      icon: <FileText size={14} />,
      onSelect: () => navigate('/settings/logs')
    },
    {
      id: 'appearance',
      label: 'Appearance',
      description: 'Customize theme and typography',
      icon: <Eye size={14} />,
      onSelect: () => navigate('/settings/appearance')
    },
    {
      id: 'settings',
      label: 'Settings',
      description: 'General application settings',
      icon: <Settings size={14} />,
      onSelect: () => navigate('/settings')
    },
    {
      id: 'toggle-sidebar',
      label: sidebarCollapsed ? 'Show Sidebar' : 'Hide Sidebar',
      description: 'Toggle the left sidebar panel',
      icon: <PanelLeft size={14} />,
      onSelect: () => toggleSidebar()
    },
    {
      id: 'toggle-inspector',
      label: inspectorOpen ? 'Hide Inspector' : 'Show Inspector',
      description: 'Toggle the right inspector panel',
      icon: <PanelRight size={14} />,
      onSelect: () => toggleInspector()
    },
    {
      id: 'reset-layout',
      label: 'Reset Layout',
      description: 'Restore default panel sizes and visibility',
      icon: <RotateCcw size={14} />,
      onSelect: () => resetLayout()
    },
    {
      id: 'shortcuts',
      label: 'Keyboard Shortcuts',
      description: 'View all keyboard shortcuts',
      icon: <Keyboard size={14} />,
      onSelect: () => setShortcutsOpen(true)
    },
    {
      id: 'toggle-theme',
      label: 'Toggle Theme',
      description: 'Switch between light and dark theme',
      icon: <Sun size={14} />,
      onSelect: () => { navigate('/settings/appearance'); /* TODO: implement theme toggle */ }
    }
  ]

  return (
    <div className="flex h-full w-full bg-[var(--ivory-bg)]">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-[var(--ivory-bg)]">
        <Outlet />
      </div>

      {/* Right Inspector */}
      <RightInspector />

      {/* Command Palette */}
      <CommandPalette
        isOpen={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        items={commandItems}
        placeholder="Search pages, commands, or actions..."
      />

      {/* Shortcuts Help */}
      <ShortcutsHelp
        isOpen={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />

      {/* Toast notifications */}
      <ToastContainer />
    </div>
  )
}
