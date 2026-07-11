import React, { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Boxes,
  Camera,
  Code2,
  FileText,
  FolderOpen,
  Github,
  GraduationCap,
  KeyRound,
  LockKeyhole,
  Package,
  Palette,
  ScanLine,
  ScrollText,
  Settings,
  Shield,
  Smartphone,
  Sparkles,
  Wrench,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { VibeForgeMark } from '../components/shared/VibeForgeMark'

interface SettingsNavItem {
  icon: React.ReactNode
  label: string
  description: string
  path: string
}

const basicItems: SettingsNavItem[] = [
  { icon: <Settings size={16} />, label: 'General', description: 'Workspace behavior', path: '/settings/general' },
  { icon: <KeyRound size={16} />, label: 'Providers & Models', description: 'Keys, models, tests', path: '/settings/providers' },
  { icon: <ScrollText size={16} />, label: 'System Prompts', description: 'Styles and profiles', path: '/settings/prompts' },
  { icon: <Palette size={16} />, label: 'Appearance', description: 'Theme and display', path: '/settings/appearance' },
  { icon: <FolderOpen size={16} />, label: 'Projects', description: 'Local context', path: '/settings/projects' },
  { icon: <Sparkles size={16} />, label: 'Skills & Agents', description: 'Browse and adapt', path: '/settings/skills' },
  { icon: <GraduationCap size={16} />, label: 'Learn', description: 'Concepts explained', path: '/settings/learn' }
]

const advancedItems: SettingsNavItem[] = [
  { icon: <Smartphone size={16} />, label: 'Android Companion', description: 'Phone companion', path: '/settings/companion' },
  { icon: <Wrench size={16} />, label: 'Tools & MCP', description: 'Tool registry', path: '/settings/tools' },
  { icon: <Boxes size={16} />, label: 'Connectors', description: 'Third-party links', path: '/settings/connectors' },
  { icon: <FileText size={16} />, label: 'Logs', description: 'Runtime events', path: '/settings/logs' },
  { icon: <Package size={16} />, label: 'Developer Setup', description: 'Tools & dependencies', path: '/settings/developer-setup' },
  { icon: <Code2 size={16} />, label: 'Beta/Release', description: 'Debug and tests', path: '/settings/developer' },
  { icon: <Github size={16} />, label: 'GitHub Imports', description: 'Repo imports', path: '/settings/github' },
  { icon: <Boxes size={16} />, label: 'Extensions', description: 'Future plugins', path: '/settings/extensions' },
  { icon: <Shield size={16} />, label: 'Privacy & Security', description: 'Local permissions', path: '/settings/security' },
  { icon: <LockKeyhole size={16} />, label: 'Capabilities', description: 'Guarded access', path: '/settings/capabilities' },
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

  const [showAdvanced, setShowAdvanced] = useState(() => {
    return localStorage.getItem('vb_show_advanced_settings') !== 'false'
  })

  const toggleAdvanced = () => {
    const nextVal = !showAdvanced
    setShowAdvanced(nextVal)
    localStorage.setItem('vb_show_advanced_settings', String(nextVal))
  }

  return (
    <div className="h-full min-h-0 bg-[var(--ivory-bg)] overflow-hidden" data-testid="settings-layout">
      <div className="h-full flex">
        <aside
          className="w-[244px] shrink-0 border-r border-[var(--ivory-border)] bg-[var(--ivory-surface)] flex flex-col"
          role="navigation"
          aria-label="Settings categories"
          data-testid="settings-category-column"
        >
          <div className="px-4 py-3 border-b border-[var(--ivory-border)]">
            <div className="flex items-center gap-3">
              <VibeForgeMark size={32} />
              <div className="min-w-0">
                <h2 className="text-[15px] font-semibold text-[var(--ivory-text)] font-display">Settings</h2>
                <p className="text-[10px] text-[var(--ivory-text-3)] truncate font-body">Workspace controls</p>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
            
            {/* Basic Settings */}
            <div className="space-y-1">
              <p className="px-3 text-[10px] font-bold text-[var(--ivory-text-3)] uppercase tracking-wider font-body">Core Settings</p>
              {basicItems.map((item) => {
                const isActive = isActivePath(location.pathname, item.path)
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`w-full text-left px-3 py-2 rounded-xl transition duration-[var(--transition-fast)] flex items-start gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35 cursor-pointer
                      ${isActive
                        ? 'bg-[var(--ivory-active-bg)] text-[var(--ivory-text)] font-semibold shadow-[var(--shadow-xs)]'
                        : 'text-[var(--ivory-text-2)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)] font-medium'}`}
                    data-testid={`settings-nav-${item.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                  >
                    <span className={`mt-0.5 shrink-0 ${isActive ? 'text-[var(--ivory-accent)]' : 'text-[var(--ivory-text-3)]'}`}>
                      {item.icon}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[11px] leading-tight truncate">{item.label}</span>
                      <span className="block text-[9px] leading-tight text-[var(--ivory-text-3)] truncate mt-1">{item.description}</span>
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Advanced Settings Toggle */}
            <div className="border-t border-[var(--ivory-border)]/20 pt-3">
              <button
                type="button"
                onClick={toggleAdvanced}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-[10px] font-bold text-[var(--ivory-text-3)] uppercase tracking-wider hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)] transition duration-150 cursor-pointer focus:outline-none"
              >
                <span>Advanced Settings</span>
                {showAdvanced ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </button>

              {/* Advanced Items list */}
              {showAdvanced && (
                <div className="space-y-1 mt-1.5">
                  {advancedItems.map((item) => {
                    const isActive = isActivePath(location.pathname, item.path)
                    return (
                      <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        aria-current={isActive ? 'page' : undefined}
                        className={`w-full text-left px-3 py-2 rounded-xl transition duration-[var(--transition-fast)] flex items-start gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35 cursor-pointer
                          ${isActive
                            ? 'bg-[var(--ivory-active-bg)] text-[var(--ivory-text)] font-semibold shadow-[var(--shadow-xs)]'
                            : 'text-[var(--ivory-text-2)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)] font-medium'}`}
                        data-testid={item.path === '/settings/developer'
                          ? 'settings-nav-developer'
                          : `settings-nav-${item.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                      >
                        <span className={`mt-0.5 shrink-0 ${isActive ? 'text-[var(--ivory-accent)]' : 'text-[var(--ivory-text-3)]'}`}>
                          {item.icon}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[11px] leading-tight truncate">{item.label}</span>
                          <span className="block text-[9px] leading-tight text-[var(--ivory-text-3)] truncate mt-1">{item.description}</span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

          </div>
          
          <div className="p-3 border-t border-[var(--ivory-border)]/40 shrink-0">
            <button
              type="button"
              onClick={() => navigate('/chat')}
              className="w-full h-9 rounded-xl border border-[var(--ivory-border)] bg-[var(--ivory-bg)] text-[12px] font-semibold text-[var(--ivory-text-2)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35 cursor-pointer"
            >
              Back to Chat
            </button>
          </div>
        </aside>

        <main className="flex-1 min-w-0 overflow-y-auto bg-[var(--ivory-bg)]" data-testid="settings-detail-panel">
          <div className="max-w-5xl mx-auto px-5 py-5 w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
