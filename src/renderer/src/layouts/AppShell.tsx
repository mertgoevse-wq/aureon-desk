import React, { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { RightInspector } from './RightInspector'
import { ToastContainer } from '../components/shared/Toast'
import { CommandPalette } from '../components/shared/CommandPalette'
import type { CommandItem } from '../components/shared/CommandPalette'
import {
  MessageSquare, Library, FolderOpen, Wrench, Settings,
  ScrollText, Server, FileText, Github, Eye
} from 'lucide-react'

export function AppShell(): React.ReactElement {
  const navigate = useNavigate()
  const [paletteOpen, setPaletteOpen] = useState(false)

  // Ctrl+K / Cmd+K to open command palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setPaletteOpen(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const commandItems: CommandItem[] = [
    {
      id: 'home',
      label: 'Chats',
      description: 'View and manage chat conversations',
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
      description: 'Manage project workspaces with local files',
      icon: <FolderOpen size={14} />,
      onSelect: () => navigate('/projects')
    },
    {
      id: 'tools',
      label: 'Tools & MCP',
      description: 'Configure tool integrations and MCP servers',
      icon: <Wrench size={14} />,
      onSelect: () => navigate('/tools')
    },
    {
      id: 'system-prompts',
      label: 'System Prompt Profiles',
      description: 'Define how the AI behaves across chats',
      icon: <ScrollText size={14} />,
      onSelect: () => navigate('/settings/system-prompts')
    },
    {
      id: 'providers',
      label: 'Provider Settings',
      description: 'Manage API keys and provider connections',
      icon: <Server size={14} />,
      onSelect: () => navigate('/settings/providers')
    },
    {
      id: 'imports',
      label: 'GitHub Imports',
      description: 'Import repositories and conversations',
      icon: <Github size={14} />,
      onSelect: () => navigate('/settings/imports')
    },
    {
      id: 'logs',
      label: 'Logs & Debug',
      description: 'View app logs, export debug bundle',
      icon: <FileText size={14} />,
      onSelect: () => navigate('/settings/logs')
    },
    {
      id: 'appearance',
      label: 'Appearance',
      description: 'Customize theme, typography, and spacing',
      icon: <Eye size={14} />,
      onSelect: () => navigate('/settings/appearance')
    },
    {
      id: 'settings',
      label: 'Settings',
      description: 'General application settings',
      icon: <Settings size={14} />,
      onSelect: () => navigate('/settings')
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
        placeholder="Search pages, settings, or commands..."
      />

      {/* Toast notifications */}
      <ToastContainer />
    </div>
  )
}
