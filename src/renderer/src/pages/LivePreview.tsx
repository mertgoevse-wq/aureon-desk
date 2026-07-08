import React, { useCallback, useEffect, useState, useRef } from 'react'
import {
  Play,
  Square,
  RefreshCw,
  ExternalLink,
  Monitor,
  Terminal,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  FolderOpen,
  EyeOff,
  Plus,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react'
import { Button } from '../components/shared/Button'
import { Badge } from '../components/shared/Badge'
import { EmptyState } from '../components/shared/EmptyState'
import { useIpc } from '../hooks/useIpc'

interface PreviewStatus {
  id: string | null
  status: 'idle' | 'starting' | 'running' | 'error' | 'stopped'
  sandboxPath: string | null
  url: string | null
  port: number | null
  templateType: string | null
  logs: Array<{ timestamp: string; stream: 'stdout' | 'stderr'; text: string }>
  error: string | null
}

export function LivePreview(): React.ReactElement {
  const api = useIpc()
  
  // Projects and Workspace states
  const [projects, setProjects] = useState<any[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false)
  const [briefText, setBriefText] = useState('')

  // Server states
  const [status, setStatus] = useState<PreviewStatus>({
    id: null,
    status: 'idle',
    sandboxPath: null,
    url: null,
    port: null,
    templateType: null,
    logs: [],
    error: null
  })
  const [templateType, setTemplateType] = useState('html')
  const [creating, setCreating] = useState(false)
  const [runningDemo, setRunningDemo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const logRef = useRef<HTMLDivElement>(null)

  const activeProject = projects.find(p => p.id === selectedProjectId)

  const mockFiles = [
    { name: 'src/main.tsx', type: 'file', status: 'ready' },
    { name: 'src/App.tsx', type: 'file', status: 'ready' },
    { name: 'src/index.css', type: 'file', status: 'ready' },
    { name: 'index.html', type: 'file', status: 'ready' },
    { name: 'package.json', type: 'file', status: 'ready' },
    { name: 'vite.config.ts', type: 'file', status: 'ready' },
    { name: '.env', type: 'ignored', status: 'blocked' },
    { name: '.git/', type: 'ignored', status: 'blocked' },
    { name: 'node_modules/', type: 'ignored', status: 'blocked' }
  ]

  const refreshStatus = useCallback(async () => {
    try {
      const s = await api.previewStatus()
      setStatus(s)
    } catch { /* ignore */ }
  }, [api])

  // Load projects list on mount
  useEffect(() => {
    api.projectList(false)
      .then((projs: any[]) => {
        setProjects(projs || [])
        const active = projs.find((p: any) => p.is_active === 1) || projs[0]
        if (active) setSelectedProjectId(active.id)
      })
      .catch(console.error)
  }, [api])

  useEffect(() => {
    refreshStatus()
    const interval = setInterval(refreshStatus, 2000)
    return () => clearInterval(interval)
  }, [refreshStatus])

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [status.logs])

  const handleCopy = useCallback(() => {
    if (status.url) {
      navigator.clipboard.writeText(status.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [status.url])

  const handleCreateSandbox = async () => {
    setCreating(true)
    setError(null)
    try {
      const result = await api.previewCreateSandbox({ templateType })
      if (result.success) {
        await handleStart(result.sandboxPath)
      } else {
        setError(result.error || 'Failed to create sandbox')
      }
    } catch (e) {
      setError(String(e))
    } finally {
      setCreating(false)
    }
  }

  const handleRunDemo = async () => {
    setRunningDemo(true)
    setError(null)
    try {
      const result = await api.previewCreateDemo()
      if (result.success) {
        await refreshStatus()
      } else {
        setError(result.error || 'Demo failed to initialize')
      }
    } catch (e) {
      setError(String(e))
    } finally {
      setRunningDemo(false)
    }
  }

  const handleStart = async (sandboxPath?: string) => {
    setError(null)
    const path = sandboxPath || status.sandboxPath
    if (!path) return
    try {
      await api.previewStart(path)
      await refreshStatus()
    } catch (e) {
      setError(String(e))
    }
  }

  const handleStop = async () => {
    setError(null)
    try {
      await api.previewStop()
      await refreshStatus()
    } catch (e) {
      setError(String(e))
    }
  }

  const handleRestart = async () => {
    setError(null)
    try {
      await api.previewStop()
      const path = status.sandboxPath
      if (path) {
        await api.previewStart(path)
      }
      await refreshStatus()
    } catch (e) {
      setError(String(e))
    }
  }

  const openExternal = () => {
    if (status.url) {
      window.open(status.url, '_blank')
    }
  }

  const statusBadge = () => {
    switch (status.status) {
      case 'running': return <Badge variant="success">Running</Badge>
      case 'starting': return <Badge variant="warning">Starting</Badge>
      case 'error': return <Badge variant="error">Error</Badge>
      case 'stopped': return <Badge>Stopped</Badge>
      default: return <Badge>Idle</Badge>
    }
  }

  const statusIcon = () => {
    switch (status.status) {
      case 'running': return <CheckCircle size={16} className="text-green-600 animate-pulse" />
      case 'starting': return <RefreshCw size={16} className="text-amber-600 animate-spin" />
      case 'error': return <XCircle size={16} className="text-red-600" />
      case 'stopped': return <Clock size={16} className="text-[var(--ivory-text-3)]" />
      default: return <Monitor size={16} className="text-[var(--ivory-text-3)]" />
    }
  }

  const isRunning = status.status === 'running' || status.status === 'starting'
  const hasSandbox = !!status.sandboxPath

  return (
    <div className="flex flex-col h-full bg-[var(--ivory-bg)]" data-testid="live-preview-panel">
      
      {/* Top Header */}
      <div className="px-6 py-4 border-b border-[var(--ivory-border)] flex items-center justify-between shrink-0 bg-[var(--ivory-elevated)]/80">
        <div>
          <h2 className="text-[17px] font-semibold display-text text-[var(--ivory-text)] flex items-center gap-2 select-none">
            <Monitor size={18} className="text-[var(--ivory-accent)]" />
            Code Mode
          </h2>
          <p className="text-xs text-[var(--ivory-text-3)] mt-0.5">
            Safe coding environment combining local files, sandbox live previews, and execution logs.
          </p>
        </div>
      </div>

      {/* Main Workspace Workspace Layout */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-0">
        
        {/* Left Column: Project Explorer & Task composer */}
        <div className="border-r border-[var(--ivory-border)] flex flex-col min-h-0 bg-[var(--ivory-bg)]">
          
          {/* Project & Explorer Selector Header */}
          <div className="p-4 border-b border-[var(--ivory-border)] space-y-3">
            <div className="flex items-center justify-between gap-2.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--ivory-text-3)]">Active Project</span>
              
              {/* Dropdown project selector */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setProjectDropdownOpen(!projectDropdownOpen); api.projectList(false).then(setProjects) }}
                  className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-[var(--ivory-elevated)] border border-[var(--ivory-border)] text-[11px] font-semibold text-[var(--ivory-text-2)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface)] transition-colors focus:outline-none"
                  data-testid="project-selector-btn"
                >
                  <FolderOpen size={11} className="text-[var(--ivory-accent)]" />
                  <span>{activeProject ? activeProject.name : 'Choose project'}</span>
                  <ChevronDown size={10} className="text-[var(--ivory-text-3)]" />
                </button>
                {projectDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setProjectDropdownOpen(false)} />
                    <div className="absolute right-0 mt-1.5 w-60 rounded-xl border border-[var(--ivory-border)] bg-[var(--ivory-elevated)] p-1.5 shadow-[var(--shadow-lg)] z-20 max-h-60 overflow-y-auto text-left">
                      {projects.map(p => (
                        <button
                          key={p.id}
                          onClick={() => { setSelectedProjectId(p.id); setProjectDropdownOpen(false) }}
                          className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors flex items-center gap-2
                            ${selectedProjectId === p.id ? 'bg-[var(--ivory-active-bg)] text-[var(--ivory-text)] font-semibold' : 'text-[var(--ivory-text-2)] hover:bg-[var(--ivory-surface)]'}`}
                        >
                          <span>{p.name}</span>
                          {p.is_active === 1 && <span className="text-[9px] px-1 py-0.5 rounded bg-[var(--ivory-surface-2)] text-[var(--ivory-text-3)] ml-auto font-normal">active</span>}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Folder path */}
            <div className="rounded-xl border border-[var(--ivory-border)] bg-[var(--ivory-surface)] px-3 py-1.5 flex items-center gap-2">
              <span className="text-[10px] text-[var(--ivory-text-3)] font-semibold">Path:</span>
              <span className="text-[10px] text-[var(--ivory-text-2)] font-mono truncate">{activeProject ? activeProject.path : 'None selected'}</span>
            </div>
          </div>

          {/* Explorer File list (ignoring secrets / git files) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--ivory-text-3)] block mb-2">Project files</span>
              <div className="space-y-1 rounded-2xl border border-[var(--ivory-border)] bg-[var(--ivory-surface)] p-2">
                {mockFiles.map(file => (
                  <div
                    key={file.name}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold
                      ${file.status === 'blocked'
                        ? 'opacity-50 bg-[var(--ivory-bg)] border border-dashed border-[var(--ivory-border)]'
                        : 'hover:bg-[var(--ivory-elevated)] border border-transparent'}`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText size={13} className={file.status === 'blocked' ? 'text-[var(--ivory-text-3)]' : 'text-[var(--ivory-accent)]'} />
                      <span className={file.status === 'blocked' ? 'text-[var(--ivory-text-3)] font-mono' : 'text-[var(--ivory-text)]'}>{file.name}</span>
                    </div>
                    {file.status === 'blocked' && (
                      <span className="text-[9px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 uppercase tracking-wide">Ignored</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Warning card for secret context */}
            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/60 shadow-[var(--shadow-sm)] flex gap-2.5 items-start">
              <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed text-amber-800">
                <span className="font-bold">Safety Policy:</span> Sensitive config files (e.g. <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">.env</code>) and credentials are automatically omitted from context to prevent accidental uploads. File writes require user confirmation.
              </div>
            </div>
          </div>

          {/* Coding Brief Composer (bottom anchored) */}
          <div className="p-4 border-t border-[var(--ivory-border)] bg-[var(--ivory-elevated)]/30 space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--ivory-text-3)] block">Task brief composer</span>
            <textarea
              value={briefText}
              onChange={e => setBriefText(e.target.value)}
              placeholder="What features do you want to code? (e.g., Create a countdown widget...)"
              className="w-full h-20 p-2.5 rounded-xl border border-[var(--ivory-border)] bg-[var(--ivory-bg)] text-xs text-[var(--ivory-text)] placeholder-[var(--ivory-text-3)]/60 focus:outline-none focus:border-[var(--ivory-accent)]/40 resize-none transition-colors"
            />
            <div className="flex gap-2">
              <select
                value={templateType}
                onChange={e => setTemplateType(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-xl bg-[var(--ivory-bg)] border border-[var(--ivory-border)] text-[var(--ivory-text-2)] font-semibold cursor-pointer outline-none focus:border-[var(--ivory-accent)]"
              >
                <option value="html">Simple HTML</option>
                <option value="demo">Coding Demo</option>
                <option value="vite-react">Vite + React</option>
              </select>
              <Button
                onClick={handleCreateSandbox}
                disabled={creating || !briefText.trim()}
                size="sm"
                className="cursor-pointer font-semibold rounded-xl flex-1 justify-center gap-1"
              >
                <Play size={12} /> Create & Build
              </Button>
            </div>
            
            {/* Coding Demo trigger button */}
            <button
              type="button"
              onClick={handleRunDemo}
              disabled={runningDemo}
              className="w-full h-8 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[var(--ivory-accent-light)] border border-[var(--ivory-accent)]/20 text-xs font-semibold text-[var(--ivory-text)] hover:bg-[var(--ivory-accent)]/15 transition-all shadow-[var(--shadow-xs)]"
            >
              <Zap size={12} className="text-[var(--ivory-accent)]" />
              {runningDemo ? 'Initializing Coding Demo...' : 'Run Coding Demo App'}
            </button>
          </div>

        </div>

        {/* Right Column: LivePreview Frame, Controls & Server logs */}
        <div className="flex flex-col min-h-0 bg-[var(--ivory-surface)]/30">
          
          {/* Server Controls bar */}
          <div className="px-6 py-3 border-b border-[var(--ivory-border)] flex items-center justify-between gap-3 flex-wrap bg-[var(--ivory-surface)] shrink-0">
            <div className="flex items-center gap-3">
              {statusIcon()}
              <span data-testid="preview-status">{statusBadge()}</span>
              {status.port && <span className="text-xs font-semibold text-[var(--ivory-text-3)]">Port: {status.port}</span>}
            </div>

            <div className="flex items-center gap-2">
              {!hasSandbox ? (
                <>
                  <Button onClick={handleCreateSandbox} disabled={creating} size="sm" data-testid="preview-create-btn" className="cursor-pointer font-semibold rounded-xl">
                    <Play size={12} /> Start Server
                  </Button>
                  <Button onClick={handleStop} variant="secondary" size="sm" disabled data-testid="preview-stop-btn" className="rounded-xl">
                    <Square size={12} /> Stop
                  </Button>
                </>
              ) : (
                <>
                  {isRunning ? (
                    <>
                      <Button onClick={handleStop} variant="danger" size="sm" data-testid="preview-stop-btn" className="cursor-pointer font-semibold rounded-xl">
                        <Square size={12} /> Stop
                      </Button>
                      <Button onClick={handleRestart} variant="secondary" size="sm" data-testid="preview-restart-btn" className="cursor-pointer font-semibold rounded-xl">
                        <RefreshCw size={12} /> Restart
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => handleStart()} variant="primary" size="sm" data-testid="preview-start-btn" className="cursor-pointer font-semibold rounded-xl">
                      <Play size={12} /> Start
                    </Button>
                  )}
                  <Button
                    onClick={openExternal}
                    variant="secondary"
                    size="sm"
                    disabled={status.status !== 'running' || !status.url}
                    data-testid="preview-open-external-btn"
                    className="cursor-pointer font-semibold rounded-xl"
                  >
                    <ExternalLink size={12} /> Open Browser
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Sandbox Directory details (if active) */}
          {status.sandboxPath && (
            <div className="px-6 py-2 border-b border-[var(--ivory-border)] bg-[var(--ivory-bg)] flex items-center gap-2 text-[10px] text-[var(--ivory-text-3)] truncate shrink-0">
              <span className="font-semibold text-[var(--ivory-text-2)] shrink-0">Sandbox:</span>
              <span className="font-mono truncate select-text">{status.sandboxPath}</span>
            </div>
          )}

          {/* Split Preview Panel & Console logs */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            
            {/* Embedded Interactive Iframe Sandbox */}
            {status.status === 'running' && status.url ? (
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--ivory-text-3)] block">Interactive Live Preview Frame</span>
                <div className="rounded-[24px] border border-[var(--ivory-border)] overflow-hidden bg-white shadow-[var(--shadow-md)] h-[360px]">
                  <iframe
                    src={status.url}
                    title="Aureon Live Sandbox Preview"
                    className="w-full h-full border-none bg-white"
                  />
                </div>
              </div>
            ) : (
              <EmptyState
                icon={<Monitor size={36} strokeWidth={1.5} className="text-[var(--ivory-accent)]" />}
                title="Local Server Idle"
                description="Run the Coding Demo App or build a custom task widget. Once compiled, the interactive live application preview will render here."
              />
            )}

            {/* Server logs panel */}
            <div className="rounded-[20px] border border-[var(--ivory-border)] bg-[var(--ivory-elevated)] overflow-hidden shadow-[var(--shadow-xs)]">
              <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--ivory-border)] bg-[var(--ivory-surface)]">
                <Terminal size={12} className="text-[var(--ivory-text-3)]" />
                <span className="text-xs font-semibold text-[var(--ivory-text-2)]">Server Logs Console</span>
                <span className="text-[10px] text-[var(--ivory-text-3)] ml-auto font-medium">
                  {status.logs.length} entries — secrets redacted
                </span>
              </div>
              <div ref={logRef} className="max-h-48 overflow-y-auto font-mono text-[11px] bg-[var(--ivory-bg)] p-3 space-y-1.5" data-testid="preview-log-panel">
                {status.logs.length === 0 ? (
                  <p className="text-[var(--ivory-text-3)] italic text-center py-4">Console idle. Start sandbox execution to stream server logs.</p>
                ) : (
                  status.logs.map((entry, i) => (
                    <div key={i} className={`flex gap-2.5 items-start ${entry.stream === 'stderr' ? 'text-[var(--ivory-error)] bg-[var(--ivory-error-bg)]/20 px-2 py-0.5 rounded' : 'text-[var(--ivory-text-2)]'}`}>
                      <span className="text-[var(--ivory-text-3)] shrink-0 select-none">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="break-all">{entry.text.trim()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  )
}
