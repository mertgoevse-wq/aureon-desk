import React from 'react'
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
  Sparkles,
  Wrench
} from 'lucide-react'
import { AureonMark } from '../components/shared/AureonMark'
import { useUIStore } from '../stores/uiStore'

/** Settings nav items that are hidden in simple mode */
const ADVANCED_PATHS = new Set([
  '/settings/connectors',
  '/settings/github',
  '/settings/extensions',
  '/settings/security',
  '/settings/capabilities',
  '/settings/logs',
  '/settings/developer',
  '/settings/self-audit',
  '/settings/device-inputs',
])

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
  { icon: <Camera size={16} />, label: 'Device Inputs', description: 'Cam, mic, screen', path: '/settings/device-inputs' },
  { icon: <Sparkles size={16} />, label: 'Skills & Agents', description: 'Browse and adapt', path: '/settings/skills' },
  { icon: <GraduationCap size={16} />, label: 'Learn', description: 'Concepts explained', path: '/settings/learn' },
  { icon: <Package size={16} />, label: 'Developer Setup', description: 'Tools & dependencies', path: '/settings/developer-setup' }
]

function isActivePath(currentPath: string, itemPath: string): boolean {
  if (currentPath === '/settings' && itemPath === '/settings/general') return true
  return currentPath === itemPath
}

export function SettingsLayout(): React.ReactElement {
  const navigate = useNavigate()
  const location = useLocation()
  const simpleMode = useUIStore((s) => s.simpleMode)

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
              <AureonMark size={32} />
              <div className="min-w-0">
                <h2 className="text-[15px] font-semibold text-[var(--ivory-text)]">Settings</h2>
                <p className="text-[10px] text-[var(--ivory-text-3)] truncate">Vibeforge workspace controls</p>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
            {navItems
              .filter((item) => !simpleMode || !ADVANCED_PATHS.has(item.path))
              .map((item) => {
              const isActive = isActivePath(location.pathname, item.path)
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full text-left px-3 py-2.5 rounded-2xl transition duration-[var(--transition-fast)] flex items-start gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35
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
            {simpleMode && (
              <div className="mt-4 pt-3 border-t border-[var(--ivory-border)]/30">
                <p className="px-3 text-[10px] font-semibold text-[var(--ivory-text-3)] uppercase tracking-wider">
                  {navItems.filter((i) => ADVANCED_PATHS.has(i.path)).length} advanced settings hidden
                </p>
                <p className="px-3 text-[10px] text-[var(--ivory-text-3)] mt-1 leading-relaxed">
                  Toggle "Simple mode" off in General settings to access all controls.
                </p>
              </div>
            )}
          </div>
          <div className="p-3 border-t border-[var(--ivory-border)]/40">
            <button
              type="button"
              onClick={() => navigate('/chat')}
              className="w-full h-10 rounded-2xl border border-[var(--ivory-bronze)]/15 bg-[var(--ivory-bronze-light)]/50 text-[12px] font-semibold text-[var(--ivory-bronze)] hover:text-[var(--ivory-bronze-hover)] hover:bg-[var(--ivory-bronze-light)] hover:border-[var(--ivory-bronze)]/25 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35 cursor-pointer"
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
