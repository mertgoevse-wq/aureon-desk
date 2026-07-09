import React from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Boxes,
  Camera,
  Code2,
  FileText,
  FolderOpen,
  Github,
  KeyRound,
  LockKeyhole,
  Palette,
  ScanLine,
  ScrollText,
  Settings,
  Shield,
  Wrench
} from 'lucide-react'

interface SettingsNavItem {
  icon: React.ReactNode
  label: string
  description: string
  path: string
}

const navItems: SettingsNavItem[] = [
  { icon: <Settings size={16} />, label: 'General', description: 'Workspace behavior', path: '/settings/general' },
  { icon: <KeyRound size={16} />, label: 'Providers & Models', description: 'Keys, models, tests', path: '/settings/providers' },
  { icon: <ScrollText size={16} />, label: 'System Prompts', description: 'Styles and profiles', path: '/settings/prompts' },
  { icon: <Palette size={16} />, label: 'Appearance', description: 'Theme and display', path: '/settings/appearance' },
  { icon: <FolderOpen size={16} />, label: 'Projects', description: 'Local context', path: '/settings/projects' },
  { icon: <Wrench size={16} />, label: 'Tools & MCP', description: 'Tool registry', path: '/settings/tools' },
  { icon: <Github size={16} />, label: 'GitHub Imports', description: 'Repo imports', path: '/settings/github' },
  { icon: <Boxes size={16} />, label: 'Extensions', description: 'Future plugins', path: '/settings/extensions' },
  { icon: <Shield size={16} />, label: 'Privacy & Security', description: 'Local permissions', path: '/settings/security' },
  { icon: <LockKeyhole size={16} />, label: 'Capabilities', description: 'Guarded access', path: '/settings/capabilities' },
  { icon: <FileText size={16} />, label: 'Logs', description: 'Runtime events', path: '/settings/logs' },
  { icon: <Code2 size={16} />, label: 'Developer', description: 'Debug and tests', path: '/settings/developer' },
  { icon: <ScanLine size={16} />, label: 'Self Audit', description: 'Inspect & improve', path: '/settings/self-audit' },
  { icon: <Camera size={16} />, label: 'Device Inputs', description: 'Cam, mic, screen', path: '/settings/device-inputs' }
]

function isActivePath(currentPath: string, itemPath: string): boolean {
  if (currentPath === '/settings' && itemPath === '/settings/general') return true
  return currentPath === itemPath
}

export function SettingsLayout(): React.ReactElement {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div className="h-full min-h-0 bg-[var(--ivory-bg)] overflow-hidden" data-testid="settings-layout">
      <div className="h-full flex">
        <aside
          className="w-[264px] shrink-0 border-r border-[var(--ivory-border)] bg-[var(--ivory-surface)] flex flex-col"
          role="navigation"
          aria-label="Settings categories"
          data-testid="settings-category-column"
        >
          <div className="px-4 py-4 border-b border-[var(--ivory-border)]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-[var(--ivory-accent-light)] text-[var(--ivory-accent)] flex items-center justify-center ring-1 ring-[var(--ivory-accent)]/15">
                <Settings size={17} />
              </div>
              <div className="min-w-0">
                <h2 className="text-[15px] font-semibold text-[var(--ivory-text)]">Settings</h2>
                <p className="text-[10px] text-[var(--ivory-text-3)] truncate">Aureon workspace controls</p>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
            {navItems.map((item) => {
              const isActive = isActivePath(location.pathname, item.path)
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full text-left px-3 py-2.5 rounded-2xl transition-all duration-[var(--transition-fast)] flex items-start gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35
                    ${isActive
                      ? 'bg-[var(--ivory-active-bg)] text-[var(--ivory-text)] font-semibold shadow-[var(--shadow-xs)]'
                      : 'text-[var(--ivory-text-2)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)] font-medium'}`}
                  data-testid={`settings-nav-${item.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                >
                  <span className={`mt-0.5 shrink-0 ${isActive ? 'text-[var(--ivory-accent)]' : 'text-[var(--ivory-text-3)]'}`}>
                    {item.icon}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[12px] leading-tight truncate">{item.label}</span>
                    <span className="block text-[10px] leading-tight text-[var(--ivory-text-3)] truncate mt-1">{item.description}</span>
                  </span>
                </button>
              )
            })}
          </div>
          <div className="p-3 border-t border-[var(--ivory-border)]/40">
            <button
              type="button"
              onClick={() => navigate('/chat')}
              className="w-full h-10 rounded-2xl border border-[var(--ivory-bronze)]/15 bg-[var(--ivory-bronze-light)]/50 text-[12px] font-semibold text-[var(--ivory-bronze)] hover:text-[var(--ivory-bronze-hover)] hover:bg-[var(--ivory-bronze-light)] hover:border-[var(--ivory-bronze)]/25 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35 cursor-pointer"
            >
              Back to Chat
            </button>
          </div>
        </aside>

        <main className="flex-1 min-w-0 overflow-y-auto bg-[var(--ivory-bg)]" data-testid="settings-detail-panel">
          <div className="max-w-5xl mx-auto px-6 py-7 w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
