import React, { useState, useEffect, useCallback } from 'react'
import { Settings as SettingsIcon, ShieldCheck, Eye, EyeOff } from 'lucide-react'
import { SettingsSection, SettingsRow, Toggle } from '../../components/settings/SettingsComponents'
import { Select } from '../../components/shared/Select'
import { useUIStore } from '../../stores/uiStore'
import { applyTheme } from '../../utils/theme'

export function GeneralSettingsPage(): React.ReactElement {
  const [startOnBoot, setStartOnBoot] = useState(false)
  const [defaultMode, setDefaultMode] = useState('chat')
  const [collapsibleSidebar, setCollapsibleSidebar] = useState(true)
  const [themeMode, setThemeMode] = useState('ivory')
  const [unhideApps, setUnhideApps] = useState(false)
  const [notifications, setNotifications] = useState(true)
  const { simpleMode, toggleSimpleMode } = useUIStore()

  // Load persisted theme on mount
  useEffect(() => {
    ;(async () => {
      try {
        if (!window.api) return
        const saved = await window.api.settingsGet('ui.theme')
        if (saved && saved !== 'ivory') {
          setThemeMode(saved)
          applyTheme(saved)
        }
      } catch { /* ignore */ }
    })()
  }, [])

  const handleThemeChange = useCallback((mode: string) => {
    setThemeMode(mode)
    applyTheme(mode)
  }, [])

  return (
    <div className="space-y-6" data-testid="settings-general-page">
      {/* Page Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--ivory-border)] bg-[var(--ivory-elevated)] text-[11px] font-semibold text-[var(--ivory-text-3)] mb-3 select-none">
          <ShieldCheck size={13} className="text-[var(--ivory-accent)]" />
          Aureon Workspace Defaults
        </div>
        <h1 className="text-[28px] font-semibold tracking-tight text-[var(--ivory-text)] display-text">General</h1>
        <p className="mt-2 max-w-2xl text-xs leading-relaxed text-[var(--ivory-text-3)]">
          Manage startup options, sidebar configurations, global themes, and notification rules.
        </p>
      </div>

      {/* Startup & Default Modes */}
      <SettingsSection title="App Startup & Mode" description="Configure when the app launches and which workspace mode is active by default.">
        <SettingsRow
          label="Launch on System Startup"
          description="Automatically launch Aureon Desk when your computer starts so it is always ready."
          dataTestId="row-startup"
        >
          <Toggle checked={startOnBoot} onChange={setStartOnBoot} dataTestId="toggle-startup" />
        </SettingsRow>
        
        <SettingsRow
          label="Default Mode Workspace"
          description="Choose which view is shown when Aureon Desk starts."
          dataTestId="row-default-mode"
        >
          <Select
            value={defaultMode}
            onChange={setDefaultMode}
            options={[
              { value: 'chat', label: 'Chat Mode' },
              { value: 'cowork', label: 'Cowork Mode' },
              { value: 'code', label: 'Code Mode' }
            ]}
            data-testid="select-default-mode"
          />
        </SettingsRow>
      </SettingsSection>

      {/* Interface Settings */}
      <SettingsSection title="Interface & Theme" description="Adjust visual sizing, theme coloring, and navigation parameters.">
        <SettingsRow
          label="Collapsible Side Panels"
          description="Allow sidebar and inspector panels to collapse or resize freely using hotkeys."
          dataTestId="row-sidebar-collapsible"
        >
          <Toggle checked={collapsibleSidebar} onChange={setCollapsibleSidebar} dataTestId="toggle-sidebar-collapsible" />
        </SettingsRow>

        <SettingsRow
          label="Color Palette Theme"
          description="Select between sleek dark options and Aureon's premium custom ivory workspace theme."
          dataTestId="row-theme"
        >
          <Select
            value={themeMode}
            onChange={handleThemeChange}
            options={[
              { value: 'ivory', label: 'Calm Ivory Theme' },
              { value: 'dark', label: 'Warm Charcoal (Dark)' }
            ]}
            data-testid="select-theme"
          />
        </SettingsRow>
      </SettingsSection>

      {/* UI Complexity */}
      <SettingsSection title="Interface Mode" description="Choose between a simplified workspace or full access to all technical settings.">
        <SettingsRow
          label="Simple mode"
          description="Shows only essential build, chat, and preview controls. Hides advanced provider config, MCP tools, and debug settings. Recommended for most users."
          dataTestId="row-simple-mode"
        >
          <Toggle checked={simpleMode} onChange={toggleSimpleMode} dataTestId="toggle-simple-mode" />
        </SettingsRow>
        {simpleMode && (
          <div className="mt-3 p-3 rounded-xl bg-[var(--ivory-accent-light)]/50 border border-[var(--ivory-accent)]/15 text-[11px] text-[var(--ivory-text-2)] flex items-start gap-2">
            <Eye size={13} className="shrink-0 mt-0.5 text-[var(--ivory-accent)]" />
            <span>Simple mode is active. Technical settings (providers, MCP, debug) are hidden from navigation. Toggle off to access all controls.</span>
          </div>
        )}
        {!simpleMode && (
          <div className="mt-3 p-3 rounded-xl bg-[var(--ivory-bg)] border border-[var(--ivory-border)] text-[11px] text-[var(--ivory-text-3)] flex items-start gap-2">
            <EyeOff size={13} className="shrink-0 mt-0.5" />
            <span>Advanced mode is active. All technical settings and developer tools are visible.</span>
          </div>
        )}
      </SettingsSection>

      {/* Safety & Notifications */}
      <SettingsSection title="Notifications & Focus" description="Manage app background behaviors and toast notifications.">
        <SettingsRow
          label="Show desktop notifications"
          description="Send push alerts for finished background tasks or workflow completions."
          dataTestId="row-notifications"
        >
          <Toggle checked={notifications} onChange={setNotifications} dataTestId="toggle-notifications" />
        </SettingsRow>

        <SettingsRow
          label="Restore Window Focus"
          description="Restore Aureon window visibility when agent triggers safety approvals or warnings."
          dataTestId="row-restore-focus"
        >
          <Toggle checked={unhideApps} onChange={setUnhideApps} dataTestId="toggle-restore-focus" />
        </SettingsRow>
      </SettingsSection>
    </div>
  )
}
