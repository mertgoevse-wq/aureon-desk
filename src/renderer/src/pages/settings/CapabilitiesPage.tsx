import React, { useState } from 'react'
import { KeyRound, ShieldAlert, Monitor, Terminal, Globe, MousePointer, FolderKanban } from 'lucide-react'
import { SettingsSection, SettingsRow, Toggle, StatusPill } from '../../components/settings/SettingsComponents'

export function CapabilitiesPage(): React.ReactElement {
  const [browserUse, setBrowserUse] = useState(false)
  const [computerUse, setComputerUse] = useState(false)

  const deniedApps = ['Slack', 'Discord', 'Steam', 'Google Chrome Passwords', 'Windows Terminal']

  return (
    <div className="space-y-6" data-testid="settings-capabilities-page">
      {/* Page Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--ivory-border)] bg-[var(--ivory-elevated)] text-[11px] font-semibold text-[var(--ivory-text-3)] mb-3 select-none">
          <ShieldAlert size={13} className="text-[var(--ivory-accent)]" />
          Guarded Workspace Capabilities
        </div>
        <h1 className="text-[28px] font-semibold tracking-tight text-[var(--ivory-text)] display-text">Capabilities</h1>
        <p className="mt-2 max-w-2xl text-xs leading-relaxed text-[var(--ivory-text-3)]">
          Control agent execution capabilities. Sensitive system tools are turned off by default and protected by safety approvals.
        </p>
      </div>

      {/* Autonomous Agent Controls */}
      <SettingsSection title="Agent Autonomy" description="Enable or disable advanced autonomous capabilities. These remain off by default for safety.">
        <SettingsRow
          label="Browser Automation (Browser Use)"
          description="Allows agents to spawn local Chromium instances to browse documentation or web interfaces."
          dataTestId="row-browser-use"
        >
          <div className="flex items-center gap-2">
            <StatusPill variant={browserUse ? "warning" : "neutral"}>
              {browserUse ? "Inactive" : "Off"}
            </StatusPill>
            <Toggle checked={browserUse} onChange={setBrowserUse} dataTestId="toggle-browser-use" />
          </div>
        </SettingsRow>

        <SettingsRow
          label="Desktop Interaction (Computer Use)"
          description="Allows agents to capture screen frames and simulate clicks or keyboard inputs to automate tasks."
          dataTestId="row-computer-use"
        >
          <div className="flex items-center gap-2">
            <StatusPill variant={computerUse ? "warning" : "neutral"}>
              {computerUse ? "Inactive" : "Off"}
            </StatusPill>
            <Toggle checked={computerUse} onChange={setComputerUse} dataTestId="toggle-computer-use" />
          </div>
        </SettingsRow>
      </SettingsSection>

      {/* Sandboxing & Scope */}
      <SettingsSection title="Workspace Sandboxing" description="Strict boundaries enforced on environment access.">
        <SettingsRow
          label="File System Access"
          description="Restricts all file system read/write actions strictly inside selected workspace folders."
          dataTestId="row-fs-access"
        >
          <StatusPill variant="success">Project-Only</StatusPill>
        </SettingsRow>

        <SettingsRow
          label="Shell Commands"
          description="Requires manual user verification for every command line proposed by the agent."
          dataTestId="row-shell-commands"
        >
          <StatusPill variant="warning">Approval Required</StatusPill>
        </SettingsRow>

        <SettingsRow
          label="Network Connection Routing"
          description="Limits agent calls strictly to verified model provider API endpoints."
          dataTestId="row-network-access"
        >
          <StatusPill variant="success">Provider-Only</StatusPill>
        </SettingsRow>
      </SettingsSection>

      {/* OS Sourced Permissions & App Shields */}
      <SettingsSection title="Operating System Shields" description="Current system integrations status and blacklisted scopes.">
        <SettingsRow
          label="Accessibility Access"
          description="OS permission status allowing window management. Vibeforge does not request this."
          dataTestId="row-permission-accessibility"
        >
          <StatusPill>Not requested</StatusPill>
        </SettingsRow>

        <SettingsRow
          label="Screen Recording Access"
          description="OS permission status allowing screenshot captures. Vibeforge does not request this."
          dataTestId="row-permission-screen"
        >
          <StatusPill>Not requested</StatusPill>
        </SettingsRow>

        <SettingsRow
          label="Process Blocking (Denied Apps)"
          description="Prevent agents from inspecting or communicating with highly sensitive running processes."
          dataTestId="row-denied-apps"
        >
          <div className="flex flex-wrap gap-1 justify-end max-w-xs">
            {deniedApps.map(app => (
              <span key={app} className="px-2 py-0.5 rounded bg-[var(--ivory-border)]/45 text-[10px] font-semibold text-[var(--ivory-text-2)]">
                {app}
              </span>
            ))}
          </div>
        </SettingsRow>
      </SettingsSection>
    </div>
  )
}
