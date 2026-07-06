import React, { useCallback, useEffect, useState } from 'react'
import {
  Wrench, Plus, Trash2, Shield, AlertTriangle, CheckCircle, XCircle,
  Eye, EyeOff, Zap, Terminal, Globe, Server, FileText, Database,
  Clipboard, Key, RefreshCw, ChevronDown, ChevronRight, ExternalLink,
  Play, Ban, Clock, History
} from 'lucide-react'
import { Button } from '../../components/shared/Button'
import { Badge, type BadgeVariant } from '../../components/shared/Badge'
import { EmptyState } from '../../components/shared/EmptyState'
import { useIpc } from '../../hooks/useIpc'
import type { ToolRow, ToolCallLog, SafetyCheckResult, ToolPermission } from '@shared/types/tool'

const PERMISSION_ICONS: Record<string, React.ReactElement> = {
  file_read: <FileText size={10} />,
  file_write: <FileText size={10} />,
  shell_command: <Terminal size={10} />,
  network: <Globe size={10} />,
  browser: <Globe size={10} />,
  git: <ExternalLink size={10} />,
  database: <Database size={10} />,
  clipboard: <Clipboard size={10} />,
  secrets: <Key size={10} />,
}

const PERMISSION_COLORS: Record<string, string> = {
  file_read: 'default',
  file_write: 'warning',
  shell_command: 'warning',
  network: 'default',
  browser: 'warning',
  git: 'warning',
  database: 'warning',
  clipboard: 'default',
  secrets: 'error',
}

const TRANSPORT_ICONS: Record<string, React.ReactElement> = {
  stdio: <Terminal size={10} />,
  http: <Globe size={10} />,
  sse: <Server size={10} />,
  websocket: <Globe size={10} />,
  local: <Zap size={10} />,
}

const STATUS_COLORS: Record<string, string> = {
  approved: 'text-green-600',
  denied: 'text-red-600',
  blocked_untrusted: 'text-amber-600',
  blocked_disabled: 'text-amber-600',
  blocked_unknown: 'text-red-600',
  error: 'text-red-600',
}

export function ToolsPage(): React.ReactElement {
  const api = useIpc()
  const [tools, setTools] = useState<ToolRow[]>([])
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null)
  const [expandedToolId, setExpandedToolId] = useState<string | null>(null)
  const [callLogs, setCallLogs] = useState<ToolCallLog[]>([])
  const [showLogs, setShowLogs] = useState(false)
  const [testInput, setTestInput] = useState('{"pattern":"*.ts"}')
  const [testResult, setTestResult] = useState<string | null>(null)
  const [testError, setTestError] = useState<string | null>(null)
  const [safetyCheck, setSafetyCheck] = useState<SafetyCheckResult | null>(null)
  const [executing, setExecuting] = useState(false)

  useEffect(() => { loadTools() }, [])

  const loadTools = useCallback(async () => {
    try { setTools(await api.toolList()) } catch (e) { console.error(e) }
  }, [api])

  const loadLogs = useCallback(async (toolId?: string) => {
    try {
      const logs = await api.toolGetCallLogs(toolId)
      setCallLogs(logs as ToolCallLog[])
      setShowLogs(true)
    } catch (e) { console.error(e) }
  }, [api])

  const handleToggleEnabled = useCallback(async (id: string) => {
    const tool = tools.find(t => t.id === id)
    if (!tool) return
    await api.toolSetEnabled(id, !tool.is_enabled)
    loadTools()
  }, [api, tools])

  const handleToggleTrusted = useCallback(async (id: string) => {
    const tool = tools.find(t => t.id === id)
    if (!tool) return
    await api.toolSetTrusted(id, !tool.is_trusted)
    loadTools()
  }, [api, tools])

  const handleDelete = useCallback(async (id: string) => {
    await api.toolDelete(id)
    if (selectedToolId === id) setSelectedToolId(null)
    loadTools()
  }, [api, selectedToolId])

  const handleCheckSafety = useCallback(async (toolId: string) => {
    let input: Record<string, unknown>
    try {
      input = JSON.parse(testInput || '{}')
    } catch {
      input = {}
    }
    const result = await api.toolCheckSafety(toolId, input)
    setSafetyCheck(result as SafetyCheckResult)
    setTestResult(null)
    setTestError(null)
  }, [api, testInput])

  const handleExecute = useCallback(async (toolId: string) => {
    setExecuting(true)
    setTestResult(null)
    setTestError(null)
    try {
      let input: Record<string, unknown>
      try { input = JSON.parse(testInput || '{}') } catch { input = {} }
      const result = await api.toolExecute(toolId, input)
      const r = result as any
      if (r.success) {
        setTestResult(r.output)
        setSafetyCheck(r.safetyCheck)
      } else {
        setTestError(r.error || 'Execution failed')
        setSafetyCheck(r.safetyCheck)
      }
    } catch (e) {
      setTestError(String(e))
    } finally {
      setExecuting(false)
    }
  }, [api, testInput])

  const getStatusIcon = (tool: ToolRow) => {
    if (!tool.is_enabled) return <Ban size={14} className="text-[var(--ivory-text-3)]" />
    if (!tool.is_trusted && tool.source !== 'builtin') return <AlertTriangle size={14} className="text-amber-500" />
    return <CheckCircle size={14} className="text-green-600" />
  }

  const permissions = (tool: ToolRow): ToolPermission[] => {
    try { return tool.permissions ? JSON.parse(tool.permissions) : [] }
    catch { return [] }
  }

  const config = (tool: ToolRow): Record<string, unknown> => {
    try { return tool.config ? JSON.parse(tool.config) : {} }
    catch { return {} }
  }

  return (
    <div className="flex flex-col h-full bg-[var(--ivory-bg)]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[var(--ivory-border)]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold display-text text-[var(--ivory-text)]">Tools & MCP</h2>
            <p className="text-xs text-[var(--ivory-text-3)] mt-0.5">
              {tools.length} tool{tools.length !== 1 ? 's' : ''} registered — all calls pass through safety gate
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => loadLogs()} variant="secondary" size="sm">
              <History size={14} /> View Call Logs
            </Button>
          </div>
        </div>
      </div>

      {/* Logs Panel */}
      {showLogs && (
        <div className="px-6 py-3 border-b border-[var(--ivory-border)] bg-[var(--ivory-surface)]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold display-text text-[var(--ivory-text)]">
              Tool Call Logs ({callLogs.length})
            </h3>
            <button onClick={() => setShowLogs(false)} className="text-xs text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)]">
              <XCircle size={14} />
            </button>
          </div>
          {callLogs.length === 0 ? (
            <p className="text-xs text-[var(--ivory-text-3)]">No tool calls logged yet.</p>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-1">
              {callLogs.map(log => (
                <div key={log.id} className="flex items-center gap-2 text-[11px] py-1 border-b border-[var(--ivory-border)] last:border-0">
                  <span className="font-medium text-[var(--ivory-text)]">{log.tool_name}</span>
                  <span className={`font-medium ${STATUS_COLORS[log.status] || ''}`}>{log.status}</span>
                  <span className="text-[var(--ivory-text-3)] truncate flex-1">{log.input_preview}</span>
                  <span className="text-[10px] text-[var(--ivory-text-3)]">
                    {new Date(log.created_at).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Safety notice */}
      <div className="px-6 py-2 text-[10px] text-[var(--ivory-text-3)] border-b border-[var(--ivory-border)] flex items-center gap-1.5">
        <Shield size={10} />
        Every tool call goes through safety gate: enabled → trusted → permissions → confirmation for destructive ops.
        Imported tools are disabled by default.
      </div>

      {/* Tool List */}
      <div className="flex-1 overflow-y-auto">
        {tools.length === 0 ? (
          <EmptyState
            icon={<Wrench size={40} strokeWidth={1.5} />}
            title="No tools registered"
            description="Built-in mock tools are seeded on app startup. They demonstrate the tool system without touching real files."
          />
        ) : (
          <div className="divide-y divide-[var(--ivory-border)]">
            {tools.map(tool => (
              <div key={tool.id}>
                <div
                  onClick={() => setExpandedToolId(expandedToolId === tool.id ? null : tool.id)}
                  className={`px-6 py-3 cursor-pointer hover:bg-[var(--ivory-surface)] transition-colors ${
                    expandedToolId === tool.id ? 'bg-[var(--ivory-surface)]' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      {expandedToolId === tool.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      {getStatusIcon(tool)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[var(--ivory-text)]">{tool.name}</span>
                        <Badge variant={tool.source === 'builtin' ? 'success' : 'default'} size="sm">
                          {tool.source || 'unknown'}
                        </Badge>
                        <Badge variant="default" size="sm">v{tool.version}</Badge>
                      </div>
                      <p className="text-[11px] text-[var(--ivory-text-3)] mt-0.5 truncate">
                        {tool.description || 'No description'}
                      </p>
                    </div>

                    {/* Permission badges */}
                    <div className="flex items-center gap-1 shrink-0">
                      {permissions(tool).map(perm => (
                        <Badge
                          key={perm}
                          variant={(PERMISSION_COLORS[perm] || 'default') as BadgeVariant}
                          size="sm"
                        >
                          <span className="flex items-center gap-0.5">
                            {PERMISSION_ICONS[perm]} {perm.replace(/_/g, ' ')}
                          </span>
                        </Badge>
                      ))}
                      <Badge variant="default" size="sm">
                        <span className="flex items-center gap-0.5">
                          {TRANSPORT_ICONS[tool.transport]} {tool.transport}
                        </span>
                      </Badge>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                      <Button
                        variant={tool.is_enabled ? 'secondary' : 'primary'}
                        size="sm"
                        onClick={() => handleToggleEnabled(tool.id)}
                        title={tool.is_enabled ? 'Disable' : 'Enable'}
                      >
                        {tool.is_enabled ? 'Disable' : 'Enable'}
                      </Button>
                      {tool.source !== 'builtin' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleToggleTrusted(tool.id)}
                          title={tool.is_trusted ? 'Untrust' : 'Trust'}
                        >
                          {tool.is_trusted ? 'Untrust' : 'Trust'}
                        </Button>
                      )}
                      <button
                        onClick={() => handleDelete(tool.id)}
                        className="p-1.5 text-[var(--ivory-text-3)] hover:text-red-600"
                        title="Delete tool"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded detail */}
                {expandedToolId === tool.id && (
                  <div className="px-6 pb-4 pl-12 space-y-3">
                    {/* Config & Command */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <h4 className="text-[10px] font-semibold text-[var(--ivory-text-3)] uppercase mb-1">
                          Transport & Command
                        </h4>
                        <div className="p-2 rounded-[var(--radius-sm)] bg-[var(--ivory-surface-2)] text-[11px] text-[var(--ivory-text-2)] font-mono">
                          transport: {tool.transport}<br />
                          command: {tool.command || '(none)'}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-[10px] font-semibold text-[var(--ivory-text-3)] uppercase mb-1">
                          Config
                        </h4>
                        <pre className="p-2 rounded-[var(--radius-sm)] bg-[var(--ivory-surface-2)] text-[11px] text-[var(--ivory-text-2)] font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                          {JSON.stringify(config(tool), null, 2)}
                        </pre>
                      </div>
                    </div>

                    {/* Test section */}
                    <div>
                      <h4 className="text-[10px] font-semibold text-[var(--ivory-text-3)] uppercase mb-1">
                        Test Input (JSON)
                      </h4>
                      <div className="flex gap-2">
                        <textarea
                          value={testInput}
                          onChange={e => setTestInput(e.target.value)}
                          rows={3}
                          className="flex-1 px-2 py-1 text-[11px] rounded-[var(--radius-sm)] bg-[var(--ivory-surface)] border border-[var(--ivory-border)] text-[var(--ivory-text)] font-mono focus:outline-none focus:border-[var(--ivory-accent)] resize-none"
                          placeholder='{"pattern":"*.ts"}'
                        />
                        <div className="flex flex-col gap-1">
                          <Button size="sm" onClick={() => handleExecute(tool.id)} disabled={executing}>
                            <Play size={12} /> {executing ? 'Running...' : 'Execute'}
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => handleCheckSafety(tool.id)}>
                            <Shield size={12} /> Check Safety
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => loadLogs(tool.id)}>
                            <History size={12} /> Logs
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Safety check result */}
                    {safetyCheck && (
                      <div className={`p-2 rounded-[var(--radius-sm)] border ${
                        safetyCheck.allowed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                      }`}>
                        <div className="flex items-center gap-1.5 text-[11px] font-medium mb-1">
                          {safetyCheck.allowed
                            ? <CheckCircle size={12} className="text-green-600" />
                            : <XCircle size={12} className="text-red-600" />
                          }
                          <span className={safetyCheck.allowed ? 'text-green-700' : 'text-red-700'}>
                            {safetyCheck.message}
                          </span>
                        </div>
                        {safetyCheck.requiresConfirmation && (
                          <p className="text-[10px] text-amber-600">⚠️ Requires user confirmation</p>
                        )}
                        {safetyCheck.dryRunPreview && (
                          <p className="text-[10px] text-[var(--ivory-text-2)] mt-1">
                            Preview: {safetyCheck.dryRunPreview}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Test result */}
                    {testResult && (
                      <div className="p-2 rounded-[var(--radius-sm)] bg-green-50 border border-green-200">
                        <h4 className="text-[10px] font-semibold text-green-700 mb-1">Output</h4>
                        <pre className="text-[11px] text-green-800 font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                          {testResult}
                        </pre>
                      </div>
                    )}

                    {testError && (
                      <div className="p-2 rounded-[var(--radius-sm)] bg-red-50 border border-red-200">
                        <h4 className="text-[10px] font-semibold text-red-700 mb-1">Error</h4>
                        <pre className="text-[11px] text-red-800 font-mono whitespace-pre-wrap">{testError}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
