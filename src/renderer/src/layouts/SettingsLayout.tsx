import React from 'react'
import { Outlet } from 'react-router-dom'
import { Settings, Key, FileText, Palette, FolderOpen, Github, ScrollText, Wrench } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '../components/shared/Button'
import { useUIStore } from '../stores/uiStore'

interface SettingsNavItem {
  icon: React.ReactNode
  label: string
  path: string
}

const navItems: SettingsNavItem[] = [
  { icon: <Key size={16} />, label: 'Providers & Keys', path: '/settings/providers' },
  { icon: <ScrollText size={16} />, label: 'System Prompts', path: '/settings/prompts' },
  { icon: <Palette size={16} />, label: 'Appearance', path: '/settings/appearance' },
  { icon: <FolderOpen size={16} />, label: 'Projects', path: '/settings/projects' },
  { icon: <Wrench size={16} />, label: 'Tools', path: '/settings/tools' },
  { icon: <Github size={16} />, label: 'GitHub Imports', path: '/settings/github' },
  { icon: <FileText size={16} />, label: 'Logs', path: '/settings/logs' }
]

export function SettingsLayout(): React.ReactElement {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div className="flex h-full bg-[var(--ivory-bg)]">
      {/* Settings nav */}
      <div
        className="w-56 border-r border-[var(--ivory-border)] bg-[var(--ivory-surface)] flex flex-col"
        role="navigation"
        aria-label="Settings navigation"
      >
        <div className="px-4 py-4 border-b border-[var(--ivory-border)]">
          <h2 className="text-sm font-semibold text-[var(--ivory-text)] flex items-center gap-2">
            <Settings size={16} className="text-[var(--ivory-accent)]" />
            Settings
          </h2>
        </div>
        <div className="flex-1 py-3 space-y-0.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                aria-current={isActive ? 'page' : undefined}
                className={`text-left px-3 py-2.5 text-[13px] flex items-center gap-2.5 rounded-xl transition-all duration-[var(--transition-fast)] leading-none mx-2 w-[calc(100%-16px)] block cursor-pointer
                  ${isActive
                    ? 'bg-[var(--ivory-active-bg)] text-[var(--ivory-text)] font-semibold shadow-[var(--shadow-xs)]'
                    : 'text-[var(--ivory-text-2)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)] font-medium'}`}
              >
                <span className={isActive ? 'text-[var(--ivory-accent)]' : 'text-[var(--ivory-text-3)]'}>
                  {item.icon}
                </span>
                {item.label}
              </button>
            )
          })}
        </div>
        <div className="p-3 border-t border-[var(--ivory-border)]">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="w-full cursor-pointer"
            aria-label="Back to Chat"
          >
            ← Back to Chat
          </Button>
        </div>
      </div>

      {/* Settings content */}
      <div className="flex-1 overflow-y-auto bg-[var(--ivory-bg)]">
        <div className="max-w-4xl mx-auto px-8 py-8 w-full">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
