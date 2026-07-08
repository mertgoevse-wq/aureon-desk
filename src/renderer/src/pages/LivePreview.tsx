import React, { useCallback, useEffect, useState, useRef } from 'react'
import {
  Play, Square, RefreshCw, ExternalLink, Monitor, Terminal,
  FileText, Trash2, Plus, AlertTriangle, CheckCircle, XCircle, Clock, Zap
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
  const [status, setStatus] = useState<PreviewStatus>({
    id: null, status: 'idle', sandboxPath: null, url: null, port: null,
    templateType: null, logs: [], error: null
  })
  const [templateType, setTemplateType] = useState('html')
  const [creating, setCreating] = useState(false)
  const [runningDemo, setRunningDemo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const logRef = useRef<HTMLDivElement>(null)

  const refreshStatus = useCallback(async () => {
    try {
      const s = await api.previewStatus()
      setStatus(s)
    } catch { /* ignore */ }
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
    setCreating(true); setError(null)
    try {
      const result = await api.previewCreateSandbox({ templateType })
      if (result.success) {
        await handleStart(result.sandboxPath)
      } else {
        setError(result.error || 'Failed to create sandbox')
      }
    } catch (e) { setError(String(e)) }
    finally { setCreating(false) }
  }

  const handleRunDemo = async () => {
    setRunningDemo(true); setError(null)
    try {
      const result = await api.previewCreateDemo()
      if (result.success) {
        await refreshStatus()
      } else {
        setError(result.error || 'Demo failed')
      }
    } catch (e) { setError(String(e)) }
    finally { setRunningDemo(false) }
  }

  const handleStart = async (sandboxPath?: string) => {
    setError(null)
    const path = sandboxPath || status.sandboxPath
    if (!path) return
    try {
      await api.previewStart(path)
      await refreshStatus()
    } catch (e) { setError(String(e)) }
  }

  const handleStop = async () => {
    setError(null)
    try {
      await api.previewStop()
      await refreshStatus()
    } catch (e) { setError(String(e)) }
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
    } catch (e) { setError(String(e)) }
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
      case 'running': return <CheckCircle size={16} className="text-green-600" />
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
      {/* Header */}
      <div className="px-6 py-4 border-b border-[var(--ivory-border)]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold display-text text-[var(--ivory-text)] flex items-center gap-2">
              <Monitor size={18} className="text-[var(--ivory-accent)]" />
              Live Preview
            </h2>
            <p className="text-xs text-[var(--ivory-text-3)] mt-0.5">
              Safe sandbox for testing generated code. Runs locally — no data leaves your machine.
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="px-6 py-3 border-b border-[var(--ivory-border)] flex items-center gap-3 flex-wrap bg-[var(--ivory-surface)]">
        {!hasSandbox ? (
          <>
            <select
              value={templateType}
              onChange={e => setTemplateType(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl bg-[var(--ivory-bg)] border border-[var(--ivory-border)] text-[var(--ivory-text)] font-semibold cursor-pointer outline-none focus:border-[var(--ivory-accent)]"
              data-testid="preview-template-select"
            >
              <option value="html">Simple HTML</option>
              <option value="demo">Coding Demo</option>
              <option value="vite-react">Vite + React</option>
            </select>
            <Button onClick={handleCreateSandbox} disabled={creating} size="sm" data-testid="preview-create-btn" className="cursor-pointer font-semibold rounded-xl">
              <Play size={14} /> Create & Start Preview
            </Button>
            <Button onClick={handleStop} variant="secondary" size="sm" disabled data-testid="preview-stop-btn" className="rounded-xl">
              <Square size={14} /> Stop Server
            </Button>
            <Button onClick={openExternal} variant="secondary" size="sm" disabled data-testid="preview-open-external-btn" className="rounded-xl">
              <ExternalLink size={14} /> Open in Browser
            </Button>
          </>
        ) : (
          <>
            {isRunning ? (
              <>
                <Button onClick={handleStop} variant="danger" size="sm" data-testid="preview-stop-btn" className="cursor-pointer font-semibold rounded-xl">
                  <Square size={14} /> Stop Server
                </Button>
                <Button onClick={handleRestart} variant="secondary" size="sm" data-testid="preview-restart-btn" className="cursor-pointer font-semibold rounded-xl">
                  <RefreshCw size={14} /> Restart
                </Button>
              </>
            ) : (
              <Button onClick={() => handleStart()} variant="primary" size="sm" data-testid="preview-start-btn" className="cursor-pointer font-semibold rounded-xl">
                <Play size={14} /> Start Server
              </Button>
            )}
            <Button onClick={refreshStatus} variant="ghost" size="sm" data-testid="preview-refresh-btn" className="cursor-pointer font-semibold rounded-xl">
              <RefreshCw size={14} /> Refresh
            </Button>
            <Button
              onClick={openExternal}
              variant="secondary"
              size="sm"
              disabled={status.status !== 'running' || !status.url}
              data-testid="preview-open-external-btn"
              className="cursor-pointer font-semibold rounded-xl"
            >
              <ExternalLink size={14} /> Open in Browser
            </Button>
          </>
        )}
      </div>

      {/* URL / preview target */}
      {!error && (
        <div className="px-6 py-2 border-b border-[var(--ivory-border)] bg-[var(--ivory-bg)]">
          <div className="flex items-center gap-2.5 text-sm">
            <span className="text-[var(--ivory-text-3)] font-semibold text-xs shrink-0">URL:</span>
            <input
              type="text"
              value={status.url || ''}
              readOnly
              data-testid="preview-url-input"
              placeholder="No local preview server running"
              className="flex-1 px-3 py-1.5 text-xs bg-[var(--ivory-elevated)] border border-[var(--ivory-border)] rounded-xl text-[var(--ivory-text-2)] font-mono outline-none"
            />
            {status.url && (
              <Button
                onClick={handleCopy}
                variant="secondary"
                size="sm"
                className="px-3 py-1 cursor-pointer shrink-0 font-semibold rounded-xl"
              >
                {copied ? 'Copied!' : 'Copy URL'}
              </Button>
            )}
          </div>
        </div>
      )}
      {/* Error banner */}
      {error && (
        <div className="px-6 py-2.5 text-xs bg-[var(--ivory-error-bg)] text-[var(--ivory-error)] border-b border-[var(--ivory-error-bg)] flex items-center gap-2">
          <AlertTriangle size={14} className="shrink-0" />
          <span className="font-semibold flex-1 leading-relaxed">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto cursor-pointer p-0.5 hover:bg-[var(--ivory-error-bg)] rounded"><XCircle size={14} /></button>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-y-auto bg-[var(--ivory-bg)]">
        {!hasSandbox ? (
          <div className="p-6 space-y-6">
            <EmptyState
              icon={<Monitor size={40} strokeWidth={1.5} className="text-[var(--ivory-accent)]" />}
              title="No preview active"
              description="Create a sandbox to test generated code safely. Choose a template and start a local preview server. No data leaves your machine."
              action={
                <Button onClick={handleCreateSandbox} disabled={creating} data-testid="preview-create-btn" className="cursor-pointer rounded-xl">
                  <Play size={14} /> Create & Start Preview
                </Button>
              }
            />
            <div className="max-w-3xl mx-auto space-y-4">
              <div className="p-4 rounded-[var(--radius-lg)] border border-[var(--ivory-border)] bg-[var(--ivory-elevated)] shadow-[var(--shadow-xs)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {statusIcon()}
                    <span data-testid="preview-status">{statusBadge()}</span>
                    <span className="text-sm font-medium text-[var(--ivory-text)]">
                      No sandbox selected
                    </span>
                  </div>
                  <span className="text-xs text-[var(--ivory-text-3)] font-semibold">Local only</span>
                </div>
              </div>

              <div className="rounded-[var(--radius-lg)] border border-[var(--ivory-border)] bg-[var(--ivory-elevated)] shadow-[var(--shadow-xs)] overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--ivory-border)]">
                  <Terminal size={12} className="text-[var(--ivory-text-3)]" />
                  <span className="text-xs font-semibold text-[var(--ivory-text-2)]">Server Logs</span>
                  <span className="text-[10px] text-[var(--ivory-text-3)] ml-auto font-medium">
                    {status.logs.length} entries — secrets redacted
                  </span>
                </div>
                <div ref={logRef} className="max-h-48 overflow-y-auto font-mono text-xs bg-[var(--ivory-bg)]" data-testid="preview-log-panel">
                  <p className="p-4 text-[var(--ivory-text-3)] text-xs italic">No logs yet. Start a sandbox to see server output.</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {/* Status card */}
            <div className="p-4 rounded-[var(--radius-lg)] border border-[var(--ivory-border)] bg-[var(--ivory-elevated)] shadow-[var(--shadow-xs)]">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-[var(--ivory-border)]/40">
                <div className="flex items-center gap-3">
                  {statusIcon()}
                  <span data-testid="preview-status">{statusBadge()}</span>
                  <span className="text-sm font-semibold text-[var(--ivory-text)]">
                    {status.templateType === 'vite-react' ? 'Vite + React' : status.templateType === 'demo' ? 'Coding Demo' : 'Simple HTML'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  {status.port && <span className="font-semibold text-[var(--ivory-text-3)]">Port: {status.port}</span>}
                  {status.url && (
                    <a
                      href={status.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--ivory-accent)] hover:underline flex items-center gap-1 font-semibold"
                      data-testid="preview-url-link"
                    >
                      {status.url} <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </div>
              {status.error && (
                <div className="p-3 rounded-xl bg-[var(--ivory-error-bg)] text-xs text-[var(--ivory-error)] border border-[var(--ivory-error)]/10 font-semibold mb-3 leading-relaxed">
                  {status.error}
                </div>
              )}
              {status.sandboxPath && (
                <div className="text-[11px] text-[var(--ivory-text-3)] break-all font-mono flex flex-col gap-1 leading-normal">
                  <span className="font-semibold text-[var(--ivory-text-2)]">Sandbox Directory:</span>
                  <span className="bg-[var(--ivory-bg)] p-2.5 rounded-xl border border-[var(--ivory-border)]/50 select-text">{status.sandboxPath}</span>
                </div>
              )}
            </div>

            {/* Logs */}
            <div className="rounded-[var(--radius-lg)] border border-[var(--ivory-border)] bg-[var(--ivory-surface)] overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--ivory-border)]">
                <Terminal size={12} className="text-[var(--ivory-text-3)]" />
                <span className="text-xs font-medium text-[var(--ivory-text-2)]">Server Logs</span>
                <span className="text-[10px] text-[var(--ivory-text-3)] ml-auto">
                  {status.logs.length} entries — secrets redacted
                </span>
              </div>
              <div ref={logRef} className="max-h-64 overflow-y-auto font-mono text-xs" data-testid="preview-log-panel">
                {status.logs.length === 0 ? (
                  <p className="p-4 text-[var(--ivory-text-3)] text-xs">No logs yet. Start the server to see output.</p>
                ) : (
                  status.logs.map((entry, i) => (
                    <div key={i} className={`px-4 py-1.5 border-b border-[var(--ivory-border)]/30 last:border-0 flex gap-2 ${
                      entry.stream === 'stderr' ? 'text-[var(--ivory-error)] bg-[var(--ivory-error-bg)]/30' : 'text-[var(--ivory-text-2)]'
                    }`}>
                      <span className="text-[var(--ivory-text-3)] shrink-0">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="break-all">{entry.text.trim()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
