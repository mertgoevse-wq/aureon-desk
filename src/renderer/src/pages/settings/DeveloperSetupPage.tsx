import React, { useState, useCallback } from 'react'
import {
  Wrench,
  CheckCircle,
  AlertTriangle,
  Copy,
  ExternalLink,
  Download,
  Package,
  Check,
  X,
  HelpCircle,
  Monitor,
  Cpu,
  HardDrive,
  Terminal,
  Info
} from 'lucide-react'
import { Button } from '../../components/shared/Button'
import { Badge } from '../../components/shared/Badge'
import { Card } from '../../components/shared/Card'
import { showToast } from '../../components/shared/Toast'

// ── Types ────────────────────────────────────────────────────────

interface DependencyInfo {
  name: string
  purpose: string
  required: boolean
  category: 'required' | 'recommended' | 'optional'
  installCmd: string
  downloadUrl: string
  license: string
  detectionCmd: string
  offlineFile: string
  installed: boolean | null
  version: string | null
}

// ── Dependency Definitions ───────────────────────────────────────

const DEPENDENCIES: DependencyInfo[] = [
  // Required
  {
    name: 'Node.js LTS',
    purpose: 'JavaScript runtime needed to build and run developer scripts, tests, and the Electron build pipeline.',
    required: true,
    category: 'required',
    installCmd: 'winget install OpenJS.NodeJS.LTS',
    downloadUrl: 'https://nodejs.org/en/download',
    license: 'MIT',
    detectionCmd: 'node --version',
    offlineFile: 'node-lts-x64.msi',
    installed: null,
    version: null,
  },
  {
    name: 'Git for Windows',
    purpose: 'Version control required to clone the repo, manage branches, and commit changes.',
    required: true,
    category: 'required',
    installCmd: 'winget install Git.Git',
    downloadUrl: 'https://git-scm.com/download/win',
    license: 'GPL v2',
    detectionCmd: 'git --version',
    offlineFile: 'git-for-windows-x64.exe',
    installed: null,
    version: null,
  },
  {
    name: 'VS Build Tools',
    purpose: 'C++ compiler toolchain needed by node-gyp to build native Node.js modules (e.g. better-sqlite3).',
    required: true,
    category: 'required',
    installCmd: 'Download from https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022',
    downloadUrl: 'https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022',
    license: 'Microsoft EULA',
    detectionCmd: 'Check for "Microsoft Visual Studio" in Program Files',
    offlineFile: 'vs-build-tools.exe',
    installed: null,
    version: null,
  },
  // Recommended
  {
    name: 'GitHub CLI',
    purpose: 'Helper for GitHub operations: cloning repos, creating PRs, managing issues from the terminal.',
    required: false,
    category: 'recommended',
    installCmd: 'winget install GitHub.cli',
    downloadUrl: 'https://github.com/cli/cli/releases',
    license: 'MIT',
    detectionCmd: 'gh --version',
    offlineFile: 'github-cli-x64.msi',
    installed: null,
    version: null,
  },
  {
    name: 'Playwright Browsers',
    purpose: 'Chromium browser binary for running end-to-end tests. Installed via npx playwright install chromium.',
    required: false,
    category: 'recommended',
    installCmd: 'npx playwright install chromium',
    downloadUrl: 'https://playwright.dev/docs/intro',
    license: 'Apache 2.0',
    detectionCmd: 'npx playwright install --dry-run chromium',
    offlineFile: '',
    installed: null,
    version: null,
  },
  // Optional AI / Local
  {
    name: 'Ollama',
    purpose: 'Run large language models locally without an internet connection. Powers offline AI features.',
    required: false,
    category: 'optional',
    installCmd: 'winget install Ollama.Ollama',
    downloadUrl: 'https://ollama.com/download',
    license: 'MIT',
    detectionCmd: 'ollama --version',
    offlineFile: 'ollama-windows.exe',
    installed: null,
    version: null,
  },
  {
    name: 'LM Studio',
    purpose: 'Desktop app for discovering, downloading, and running local LLMs with a chat interface.',
    required: false,
    category: 'optional',
    installCmd: 'Download from https://lmstudio.ai',
    downloadUrl: 'https://lmstudio.ai',
    license: 'Proprietary / Free for personal use',
    detectionCmd: 'Check for LM-Studio in %LOCALAPPDATA%',
    offlineFile: '',
    installed: null,
    version: null,
  },
]

const OFFLINE_INSTALLER_FILES = [
  'node-lts-x64.msi',
  'git-for-windows-x64.exe',
  'github-cli-x64.msi',
  'vs-build-tools.exe',
  'ollama-windows.exe',
]

// ── Category Config ──────────────────────────────────────────────

interface CategoryConfig {
  title: string
  description: string
  icon: React.ReactElement
}

const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  required: {
    title: 'Required for Development',
    description: 'These tools are needed to build, test, and package Aureon Desk from source. Normal users do not need them.',
    icon: <Wrench size={14} />,
  },
  recommended: {
    title: 'Recommended',
    description: 'These make development easier — GitHub CLI for repo management, Playwright for E2E tests.',
    icon: <CheckCircle size={14} />,
  },
  optional: {
    title: 'Optional — Local AI',
    description: 'Run AI models on your own hardware. Useful for offline development or testing different providers.',
    icon: <Cpu size={14} />,
  },
}

// ── Component ────────────────────────────────────────────────────

const CHECK_SCRIPT_CMD = 'node scripts/check-prerequisites.mjs'

export function DeveloperSetupPage(): React.ReactElement {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [scriptCopied, setScriptCopied] = useState(false)

  const handleCopyCmd = useCallback(async (cmd: string, depName: string) => {
    try {
      await navigator.clipboard.writeText(cmd)
      setCopiedId(depName)
      showToast('success', 'Install command copied to clipboard')
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      showToast('error', 'Failed to copy — select and copy the text manually')
    }
  }, [])

  const handleCopyScript = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(CHECK_SCRIPT_CMD)
      setScriptCopied(true)
      showToast('success', 'Terminal command copied')
      setTimeout(() => setScriptCopied(false), 2000)
    } catch {
      showToast('error', 'Failed to copy')
    }
  }, [])

  const grouped = {
    required: DEPENDENCIES.filter(d => d.category === 'required'),
    recommended: DEPENDENCIES.filter(d => d.category === 'recommended'),
    optional: DEPENDENCIES.filter(d => d.category === 'optional'),
  }

  return (
    <div className="space-y-6" data-testid="settings-developer-setup-page">
      {/* Page Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--ivory-border)] bg-[var(--ivory-elevated)] text-[11px] font-semibold text-[var(--ivory-text-3)] mb-3 select-none">
          <Package size={13} className="text-[var(--ivory-accent)]" />
          Developer Environment Setup
        </div>
        <h1 className="text-[28px] font-semibold tracking-tight text-[var(--ivory-text)] display-text">Developer Setup</h1>
        <p className="mt-2 max-w-2xl text-xs leading-relaxed text-[var(--ivory-text-3)]">
          Aureon Desk runs standalone for normal users — no extra tools needed.
          This page helps developers install the tools required to build, test, and contribute to the project.
        </p>
      </div>

      {/* Terminal Check Command */}
      <div className="p-4 rounded-xl bg-[var(--ivory-surface)] border border-[var(--ivory-border)]/60">
        <div className="flex items-start gap-3">
          <Terminal size={16} className="text-[var(--ivory-accent)] shrink-0 mt-0.5" />
          <div className="space-y-2 flex-1">
            <p className="text-sm font-semibold text-[var(--ivory-text)]">Run Prerequisite Check</p>
            <p className="text-xs text-[var(--ivory-text-2)] leading-relaxed">
              Run this command in the project root to check which tools are installed. Results are printed to the terminal and saved to <code className="text-[11px] px-1.5 py-0.5 rounded bg-[var(--ivory-bg)] text-[var(--ivory-accent)]">docs/prerequisite-check.json</code>.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-[12px] px-3 py-2 rounded-lg bg-[var(--ivory-bg)] border border-[var(--ivory-border)]/50 text-[var(--ivory-text-2)] font-mono select-all">
                {CHECK_SCRIPT_CMD}
              </code>
              <Button variant="secondary" size="sm" onClick={handleCopyScript}>
                {scriptCopied ? <Check size={13} className="text-[var(--ivory-success)]" /> : <Copy size={13} />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Offline Installers Notice */}
      <div className="p-4 rounded-xl bg-[var(--ivory-surface)] border border-[var(--ivory-border)]/60">
        <div className="flex items-start gap-3">
          <Download size={16} className="text-[var(--ivory-accent)] shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="text-sm font-semibold text-[var(--ivory-text)]">Offline Installer Folder</p>
            <p className="text-xs text-[var(--ivory-text-2)] leading-relaxed">
              Place downloaded installers in <code className="text-[11px] px-1.5 py-0.5 rounded bg-[var(--ivory-bg)] text-[var(--ivory-accent)]">vendor/installers/</code> for offline setup.
              Aureon never silently installs anything — offline installers must be run manually.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {OFFLINE_INSTALLER_FILES.map(file => (
                <span key={file} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--ivory-bg)] border border-[var(--ivory-border)]/50 text-[10px] font-mono text-[var(--ivory-text-2)]">
                  <HardDrive size={10} className="text-[var(--ivory-text-3)]" />
                  {file}
                </span>
              ))}
            </div>
            <p className="text-[10px] text-[var(--ivory-text-3)]">
              See <code className="text-[10px] px-1 py-0.5 rounded bg-[var(--ivory-bg)]">vendor/installers/README.md</code> for download links and license notes.
            </p>
          </div>
        </div>
      </div>

      {/* Dependency Categories */}
      {(['required', 'recommended', 'optional'] as const).map(category => {
        const cfg = CATEGORY_CONFIG[category]
        const items = grouped[category]
        return (
          <div key={category} data-testid={`setup-category-${category}`}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[var(--ivory-accent)]">{cfg.icon}</span>
              <h2 className="text-sm font-semibold text-[var(--ivory-text)]">{cfg.title}</h2>
            </div>
            <p className="text-[11px] text-[var(--ivory-text-3)] mb-4 leading-relaxed">{cfg.description}</p>
            <div className="space-y-3">
              {items.map(dep => (
                <DependencyCard
                  key={dep.name}
                  dep={dep}
                  copiedId={copiedId}
                  onCopy={handleCopyCmd}
                />
              ))}
            </div>
          </div>
        )
      })}

      {/* Footer */}
      <div className="pt-2 pb-4 text-[10px] text-[var(--ivory-text-3)] leading-relaxed">
        <p>
          <strong>Normal users:</strong> Aureon Desk includes a bundled Electron runtime — no Node.js, Git, or VS Build Tools required.
          The installer works out of the box on Windows 10+.
        </p>
        <p className="mt-1">
          See <a href="https://github.com/mertgoevse-wq/aureon-desk/blob/main/docs/INSTALLER_DEPENDENCIES.md" className="text-[var(--ivory-accent)] hover:underline" target="_blank" rel="noopener noreferrer">docs/INSTALLER_DEPENDENCIES.md</a> for the full dependency matrix.
        </p>
      </div>
    </div>
  )
}

// ── Dependency Card ──────────────────────────────────────────────

function DependencyCard({
  dep,
  copiedId,
  onCopy,
}: {
  dep: DependencyInfo
  copiedId: string | null
  onCopy: (cmd: string, name: string) => void
}): React.ReactElement {
  const statusIcon =
    dep.installed === true ? (
      <Check size={10} />
    ) : dep.installed === false ? (
      <X size={10} />
    ) : (
      <HelpCircle size={10} />
    )

  const statusVariant =
    dep.installed === true ? 'success' : dep.installed === false ? 'warning' : 'default'

  const statusLabel =
    dep.installed === true
      ? dep.version || 'Installed'
      : dep.installed === false
        ? 'Not detected'
        : 'Not checked'

  return (
    <Card padding="md" data-testid={`dep-card-${dep.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-[13px] font-semibold text-[var(--ivory-text)]">{dep.name}</h3>
            {dep.required ? (
              <Badge variant="error" size="sm">Required</Badge>
            ) : (
              <Badge variant="default" size="sm">Optional</Badge>
            )}
            {(dep.installed !== null) && (
              <Badge variant={statusVariant} size="sm">
                <span className="inline-flex items-center gap-1">
                  {statusIcon} {statusLabel}
                </span>
              </Badge>
            )}
          </div>
          <p className="text-[11px] text-[var(--ivory-text-2)] leading-relaxed mb-2">{dep.purpose}</p>
          <p className="text-[10px] text-[var(--ivory-text-3)]">
            License: {dep.license}
            {dep.offlineFile && (
              <span className="ml-2">· Offline: <code className="text-[10px] px-1 py-0.5 rounded bg-[var(--ivory-bg)]">{dep.offlineFile}</code></span>
            )}
          </p>
        </div>
      </div>

      {/* Install Command */}
      <div className="mt-3 pt-3 border-t border-[var(--ivory-border)]/60 flex items-center gap-2">
        <code className="flex-1 text-[11px] px-2.5 py-1.5 rounded-lg bg-[var(--ivory-bg)] border border-[var(--ivory-border)]/50 text-[var(--ivory-text-2)] font-mono break-all select-all">
          {dep.installCmd}
        </code>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onCopy(dep.installCmd, dep.name)}
        >
          {copiedId === dep.name ? (
            <Check size={13} className="text-[var(--ivory-success)]" />
          ) : (
            <Copy size={13} />
          )}
        </Button>
        <a
          href={dep.downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded-lg text-[var(--ivory-text-3)] hover:text-[var(--ivory-accent)] hover:bg-[var(--ivory-surface)] transition-colors"
          title="Open download page"
        >
          <ExternalLink size={13} />
        </a>
      </div>
    </Card>
  )
}
