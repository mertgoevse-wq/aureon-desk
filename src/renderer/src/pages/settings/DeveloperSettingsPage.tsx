import React, { useState, useCallback } from 'react'
import {
  Bug,
  FileText,
  Activity,
  Download,
  Folder,
  Database,
  Terminal,
  CheckCircle,
  HelpCircle,
  PlayCircle,
  ShieldCheck
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useIpc } from '../../hooks/useIpc'
import { SettingsSection, SettingsRow } from '../../components/settings/SettingsComponents'

export function DeveloperSettingsPage(): React.ReactElement {
  const navigate = useNavigate()
  const api = useIpc()
  const [exporting, setExporting] = useState(false)
  const [exportStatus, setExportStatus] = useState<string | null>(null)

  // Paths list for Windows/cross-platform debug reference
  const appDataPath = 'C:\\Users\\mertg\\AppData\\Roaming\\AureonDesk'
  const databasePath = 'C:\\Users\\mertg\\AppData\\Roaming\\AureonDesk\\databases\\aureon.db'
  const playwrightReportLink = 'playwright-report/index.html'

  const handleExportBundle = useCallback(async () => {
    setExporting(true)
    setExportStatus('Compiling logs...')
    try {
      const bundle = await api.logExportDebugBundle()
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `aureon-debug-bundle-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
      setExportStatus('Export successful!')
      setTimeout(() => setExportStatus(null), 3000)
    } catch (e) {
      setExportStatus(`Failed: ${String(e)}`)
    } finally {
      setExporting(false)
    }
  }, [api])

  return (
    <div className="space-y-6" data-testid="settings-developer-page">
      {/* Page Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--ivory-border)] bg-[var(--ivory-elevated)] text-[11px] font-semibold text-[var(--ivory-text-3)] mb-3 select-none">
          <Bug size={13} className="text-[var(--ivory-accent)]" />
          App Debug Surface & System Diagnostics
        </div>
        <h1 className="text-[28px] font-semibold tracking-tight text-[var(--ivory-text)] display-text">Developer</h1>
        <p className="mt-2 max-w-2xl text-xs leading-relaxed text-[var(--ivory-text-3)]">
          Inspect directories, database parameters, E2E validation states, and export sanitized diagnostic logs.
        </p>
      </div>

      {/* Diagnostics Section */}
      <SettingsSection title="System Information & Diagnostics" description="Paths, directories, and execution reporting logs.">
        <SettingsRow
          label="App Data Path"
          description="Local directory containing user configuration, cached templates, and secure vaults."
          dataTestId="row-app-data-path"
        >
          <div className="flex items-center gap-2 bg-[var(--ivory-bg)] border border-[var(--ivory-border)] rounded-xl px-3 py-1.5 font-mono text-[10px] text-[var(--ivory-text-2)] max-w-md select-all">
            <Folder size={11} className="text-[var(--ivory-text-3)] shrink-0" />
            <span className="truncate">{appDataPath}</span>
          </div>
        </SettingsRow>

        <SettingsRow
          label="Database Directory"
          description="Local SQLite database file containing structured chat history and prompt library metadata."
          dataTestId="row-database-path"
        >
          <div className="flex items-center gap-2 bg-[var(--ivory-bg)] border border-[var(--ivory-border)] rounded-xl px-3 py-1.5 font-mono text-[10px] text-[var(--ivory-text-2)] max-w-md select-all">
            <Database size={11} className="text-[var(--ivory-text-3)] shrink-0" />
            <span className="truncate">{databasePath}</span>
          </div>
        </SettingsRow>

        <SettingsRow
          label="Sanitized Debug Bundle"
          description="Export app state, recent log events, and tool execution logs with sensitive values redacted."
          dataTestId="row-debug-bundle"
        >
          <div className="flex items-center gap-3">
            {exportStatus && (
              <span className="text-[10px] font-bold text-[var(--ivory-text-3)] animate-pulse">{exportStatus}</span>
            )}
            <button
              onClick={handleExportBundle}
              disabled={exporting}
              className="px-3.5 py-1.5 rounded-xl border border-[var(--ivory-border)] bg-[var(--ivory-bg)] hover:bg-[var(--ivory-surface-2)] text-xs font-semibold text-[var(--ivory-text-2)] hover:text-[var(--ivory-text)] transition-colors inline-flex items-center gap-1.5 shadow-[var(--shadow-xs)] cursor-pointer disabled:opacity-40"
              data-testid="export-debug-btn"
            >
              <Download size={12} />
              {exporting ? 'Exporting...' : 'Export Diagnostics'}
            </button>
          </div>
        </SettingsRow>
      </SettingsSection>

      {/* Playwright and E2E Tests */}
      <SettingsSection title="Validation & Test Center" description="Verify application status against Playwright assertions.">
        <SettingsRow
          label="E2E Test Suite Report"
          description="Local path to recent visual and integration E2E Playwright test run reports."
          dataTestId="row-playwright-report"
        >
          <div className="flex items-center gap-2 bg-[var(--ivory-bg)] border border-[var(--ivory-border)] rounded-xl px-3 py-1.5 font-mono text-[10px] text-[var(--ivory-text-2)] max-w-md select-all">
            <Terminal size={11} className="text-[var(--ivory-text-3)] shrink-0" />
            <span className="truncate">{playwrightReportLink}</span>
          </div>
        </SettingsRow>

        <SettingsRow
          label="Pre-Commit Checklist Commands"
          description="Validation commands expected to pass before building or submitting changes."
          dataTestId="row-qa-commands"
        >
          <div className="flex flex-wrap gap-1.5 justify-end max-w-sm">
            {['npm run typecheck', 'npm test', 'npm run build'].map((command) => (
              <span key={command} className="px-2 py-1 rounded-xl bg-[var(--ivory-bg)] border border-[var(--ivory-border)] text-[9px] font-mono text-[var(--ivory-text-2)]">
                {command}
              </span>
            ))}
          </div>
        </SettingsRow>
      </SettingsSection>
    </div>
  )
}
