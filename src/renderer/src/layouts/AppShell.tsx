import React, { useEffect, useState, useRef } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
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
  PanelRight, RotateCcw, Keyboard, Sun, Users, Code2
} from 'lucide-react'
import type { ChatListItem } from '@shared/types/chat'

function insertClipboardText(target: HTMLInputElement | HTMLTextAreaElement, text: string): void {
  const start = target.selectionStart ?? target.value.length
  const end = target.selectionEnd ?? target.value.length
  const nextValue = target.value.slice(0, start) + text + target.value.slice(end)
  target.value = nextValue
  const cursor = start + text.length
  target.setSelectionRange(cursor, cursor)
  target.dispatchEvent(new InputEvent('input', {
    bubbles: true,
    cancelable: true,
    inputType: 'insertFromPaste',
    data: text
  }))
}

export function AppShell(): React.ReactElement {
  const navigate = useNavigate()
  const location = useLocation()
  const api = useIpc()
  const { toggleSidebar, toggleInspector, resetLayout, sidebarCollapsed, inspectorOpen } = useUIStore()
  const { setChats, setActiveChatId, setActiveChat } = useChatStore()
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const paletteOpenRef = useRef(false)
  const shortcutsOpenRef = useRef(false)
  const showInspector = location.pathname === '/'
  const modeItems = [
    { id: 'chat', label: 'Chat', path: '/', icon: <MessageSquare size={14} /> },
    { id: 'cowork', label: 'Cowork', path: '/cowork', icon: <Users size={14} /> },
    { id: 'code', label: 'Code', path: '/preview', icon: <Code2 size={14} /> }
  ]
  const activeMode = location.pathname.startsWith('/preview')
    ? 'code'
    : location.pathname.startsWith('/cowork')
      ? 'cowork'
      : 'chat'

  // Keep refs in sync with state
  useEffect(() => { paletteOpenRef.current = paletteOpen }, [paletteOpen])
  useEffect(() => { shortcutsOpenRef.current = shortcutsOpen }, [shortcutsOpen])

  useEffect(() => {
    const openPalette = () => setPaletteOpen(true)
    window.addEventListener('open-command-palette', openPalette)
    return () => window.removeEventListener('open-command-palette', openPalette)
  }, [])

  // Load persisted panel sizes on mount
  useEffect(() => {
    loadPanelSizes()
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey

      // --- ALWAYS check if user is typing in a field first ---
      const tag = (e.target as HTMLElement)?.tagName
      const isEditing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (e.target as HTMLElement)?.isContentEditable || (e.target as HTMLElement)?.getAttribute('role') === 'textbox'

      if (isEditing) {
        // Inside an input/textarea: only handle Escape (blur + close modals)
        // Let all other keys pass through. Ctrl+V gets a fallback because
        // some Electron/Windows paths do not emit an input event for React.
        if (mod && e.key.toLowerCase() === 'v' && (tag === 'INPUT' || tag === 'TEXTAREA')) {
          e.preventDefault()
          const target = e.target as HTMLInputElement | HTMLTextAreaElement
          navigator.clipboard?.readText()
            .then(text => {
              if (text) insertClipboardText(target, text)
            })
            .catch(() => {})
          return
        }
        if (e.key === 'Escape') {
          (e.target as HTMLElement).blur()
          if (paletteOpenRef.current) setPaletteOpen(false)
          if (shortcutsOpenRef.current) setShortcutsOpen(false)
        }
        return
      }

      // --- Global shortcuts (only fire when NOT typing) ---

      // Ctrl+K — Command palette
      if (mod && e.key === 'k') {
        e.preventDefault()
        setPaletteOpen(true)
        return
      }

      // Ctrl+/ or F1 — Shortcuts help
      if ((mod && e.key === '/') || e.key === 'F1') {
        e.preventDefault()
        setShortcutsOpen(true)
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
      id: 'cowork',
      label: 'Cowork',
      description: 'Open the task workflow workspace',
      icon: <Users size={14} />,
      onSelect: () => navigate('/cowork')
    },
    {
      id: 'code-workspace',
      label: 'Code Workspace',
      description: 'Open LivePreview and code-oriented tools',
      icon: <Code2 size={14} />,
      onSelect: () => navigate('/preview')
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
      id: 'focus-composer',
      label: 'Focus Composer',
      description: 'Jump to the message input field',
      icon: <MessageSquare size={14} />,
      onSelect: () => window.dispatchEvent(new CustomEvent('focus-composer'))
    },
    {
      id: 'import-star-list',
      label: 'Import Star List',
      description: 'Import Mert\'s curated GitHub star list (29 repos)',
      icon: <Github size={14} />,
      onSelect: () => navigate('/settings/github')
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
    <div className="flex h-full w-full bg-[var(--ivory-bg)]" data-testid="app-shell">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-[var(--ivory-bg)]">
        <header className="h-14 shrink-0 border-b border-[var(--ivory-border)] bg-[var(--ivory-elevated)]/86 backdrop-blur-xl px-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3 shadow-[var(--shadow-xs)]">
          <div className="min-w-0" />

          <div
            className="inline-flex items-center rounded-2xl border border-[var(--ivory-border)] bg-[var(--ivory-bg)] p-1 shadow-[var(--shadow-xs)]"
            data-testid="mode-switch"
            role="tablist"
            aria-label="Workspace mode"
          >
            {modeItems.map((item) => {
              const selected = activeMode === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => navigate(item.path)}
                  className={`h-8 min-w-[76px] px-3 inline-flex items-center justify-center gap-1.5 rounded-xl text-[12px] font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35
                    ${selected
                      ? 'bg-[var(--ivory-elevated)] text-[var(--ivory-text)] shadow-[var(--shadow-sm)]'
                      : 'text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface)]'}`}
                  data-testid={`mode-${item.id}`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              )
            })}
          </div>

          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="hidden md:inline-flex justify-self-end items-center gap-2 h-9 px-3 rounded-2xl border border-[var(--ivory-border)] bg-[var(--ivory-bg)] text-[12px] font-medium text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35"
            data-testid="top-search-button"
          >
            <Keyboard size={13} />
            <span>Search</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[var(--ivory-surface-2)] text-[var(--ivory-text-3)]">Ctrl K</span>
          </button>
        </header>
        <div className="flex-1 min-h-0">
          <Outlet />
        </div>
      </div>

      {/* Right Inspector */}
      {showInspector && <RightInspector />}

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
