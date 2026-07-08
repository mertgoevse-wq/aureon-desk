import React, { useCallback, useEffect, useState } from 'react'
import {
  Wrench, Plus, Trash2, Shield, AlertTriangle, CheckCircle,
  Eye, EyeOff, Zap, Terminal, Globe, Server, FileText, Database,
  Clipboard, Key, ChevronDown, ChevronRight,
  Play, Ban, Clock, History, Activity, XCircle
} from 'lucide-react'
import { Button } from '../../components/shared/Button'
import { Input } from '../../components/shared/Input'
import { Toggle } from '../../components/shared/Toggle'
import { Badge, type BadgeVariant } from '../../components/shared/Badge'
import { Card } from '../../components/shared/Card'
import { Modal } from '../../components/shared/Modal'
import { EmptyState } from '../../components/shared/EmptyState'
import { showToast } from '../../components/shared/Toast'
import { useIpc } from '../../hooks/useIpc'
import type { ToolRow, ToolCallLog, SafetyCheckResult, ToolPermission, TransportType } from '@shared/types/tool'

const PERMISSION_ICONS: Record<string, React.ReactElement> = {
  file_read: <FileText size={10} />,
  file_write: <FileText size={10} />,
  shell_command: <Terminal size={10} />,
  network: <Globe size={10} />,
  browser: <Globe size={10} />,
  git: <Globe size={10} />,
  database: <Database size={10} />,
  clipboard: <Clipboard size={10} />,
  secrets: <Key size={10} />,
}

const PERMISSION_DESCRIPTIONS: Record<string, string> = {
  file_read: 'Read files from disk',
  file_write: 'Write/modify files on disk',
  shell_command: 'Execute shell commands',
  network: 'Make network requests',
  browser: 'Open and control browser',
  git: 'Perform git operations (push/pull/commit)',
  database: 'Read/write database records',
  clipboard: 'Read/write clipboard',
  secrets: 'Access stored credentials and secrets',
}

const DESTRUCTIVE_PERMISSIONS = new Set(['file_write', 'shell_command', 'git', 'database', 'secrets'])

const TRANSPORT_LABELS: Record<string, string> = {
  stdio: 'Command (stdio)',
  http: 'HTTP endpoint',
  sse: 'SSE stream',
  websocket: 'WebSocket',
  local: 'Local (built-in)',
}

const STATUS_VARIANTS: Record<string, BadgeVariant> = {
  approved: 'success',
  denied: 'error',
  blocked_untrusted: 'warning',
  blocked_disabled: 'warning',
  blocked_unknown: 'error',
  error: 'error',
}

const STATUS_LABELS: Record<string, string> = {
  approved: 'Approved',
  denied: 'Denied',
  blocked_untrusted: 'Blocked (untrusted)',
  blocked_disabled: 'Blocked (disabled)',
  blocked_unknown: 'Blocked (unknown)',
  error: 'Execution error',
}

export function ToolsPage(): React.ReactElement {
  const api = useIpc()
  const [tools, setTools] = useState<ToolRow[]>([])
  const [expandedToolId, setExpandedToolId] = useState<string | null>(null)
  const [callLogs, setCallLogs] = useState<ToolCallLog[]>([])
  const [showLogs, setShowLogs] = useState(false)
  const [selectedToolLogs, setSelectedToolLogs] = useState<string | null>(null)
  const [executing, setExecuting] = useState(false)
  const [safetyChecks, setSafetyChecks] = useState<Record<string, SafetyCheckResult | null>>({})

  // Add MCP Server modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [newServer, setNewServer] = useState({ name: '', command: '', transport: 'stdio' as string })
  const [addError, setAddError] = useState<string | null>(null)

  useEffect(() => { loadTools() }, [])

  const loadTools = useCallback(async () => {
    try { setTools(await api.toolList()) } catch (e) { console.error(e) }
  }, [api])

  const loadLogs = useCallback(async (toolId?: string) => {
    try {
      const logs = await api.toolGetCallLogs(toolId)
      setCallLogs(logs as ToolCallLog[])
      setSelectedToolLogs(toolId ?? null)
      setShowLogs(true)
    } catch (e) { console.error(e) }
  }, [api])

  const handleToggleEnabled = useCallback(async (id: string) => {
    const tool = tools.find(t => t.id === id)
    if (!tool) return
    await api.toolSetEnabled(id, !tool.is_enabled)
    showToast('info', `${tool.name} ${tool.is_enabled ? 'disabled' : 'enabled'}`)
    loadTools()
  }, [api, tools])

  const handleToggleTrusted = useCallback(async (id: string) => {
    const tool = tools.find(t => t.id === id)
    if (!tool) return
    await api.toolSetTrusted(id, !tool.is_trusted)
    showToast('info', `${tool.name} ${tool.is_trusted ? 'untrusted' : 'trusted'}`)
    loadTools()
  }, [api, tools])

  const handleDelete = useCallback(async (id: string) => {
    const tool = tools.find(t => t.id === id)
    if (!tool || !confirm(`Remove "${tool.name}" from the tool registry?`)) return
    await api.toolDelete(id)
    if (expandedToolId === id) setExpandedToolId(null)
    showToast('info', `${tool.name} removed`)
    loadTools()
  }, [api, tools, expandedToolId])

  const handleExecute = useCallback(async (toolId: string) => {
    setExecuting(true)
    setSafetyChecks(prev => ({ ...prev, [toolId]: null }))
    try {
      const result = await api.toolExecute(toolId, { test: true })
      const r = result as any
      setSafetyChecks(prev => ({ ...prev, [toolId]: r.safetyCheck || null }))
      if (r.success) {
        showToast('success', 'Tool executed successfully')
      } else {
        showToast('warning', r.error || 'Execution blocked')
      }
      loadLogs(toolId)
    } catch (e) {
      showToast('error', String(e))
    } finally {
      setExecuting(false)
    }
  }, [api])

  const handleCheckSafety = useCallback(async (toolId: string) => {
    const result = await api.toolCheckSafety(toolId, {})
    setSafetyChecks(prev => ({ ...prev, [toolId]: result as SafetyCheckResult }))
  }, [api])

  const handleAddServer = useCallback(async () => {
    if (!newServer.name.trim()) { setAddError('Name is required'); return }
    setAddError(null)
    try {
      await api.toolCreate({
        name: newServer.name.trim(),
        transport: newServer.transport as TransportType,
        command: newServer.command || null,
        source: 'imported',
        description: `MCP server: ${newServer.name}`,
        permissions: ['file_read'],
      })
      setShowAddModal(false)
      setNewServer({ name: '', command: '', transport: 'stdio' })
      showToast('success', 'MCP server added — disabled by default')
      loadTools()
    } catch (err) { setAddError(String(err)) }
  }, [newServer, api])

  const getStatusIcon = (tool: ToolRow) => {
    if (!tool.is_enabled) return <Ban size={14} className="text-[var(--ivory-text-3)]" />
    if (!tool.is_trusted && tool.source !== 'builtin') return <AlertTriangle size={14} className="text-amber-500" />
    return <CheckCircle size={14} className="text-green-600" />
  }

  const permissions = (tool: ToolRow): ToolPermission[] => {
    try { return tool.permissions ? JSON.parse(tool.permissions) : [] }
    catch { return [] }
  }

  const hasDestructive = (tool: ToolRow): boolean => {
    return permissions(tool).some(p => DESTRUCTIVE_PERMISSIONS.has(p))
  }

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold text-[var(--ivory-text)] display-text">Tools &amp; MCP</h2>
          <p className="text-xs text-[var(--ivory-text-3)] mt-1 leading-relaxed">
            Manage capability tools and MCP servers. All calls go through safety gate — imported tools start disabled.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => { setSelectedToolLogs(null); loadLogs() }}>
            <History size={14} /> Call History
          </Button>
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            <Plus size={14} /> Add MCP Server
          </Button>
        </div>
      </div>

      {/* Safety notice */}
      <div className="p-3.5 rounded-xl bg-[var(--ivory-warning-bg)] border border-[var(--ivory-warning)]/15 text-xs text-[var(--ivory-warning)] flex items-start gap-2.5">
        <Shield size={14} className="shrink-0 mt-0.5" />
        <span className="leading-relaxed">
          All tool calls go through safety gate: enabled → trusted → permissions → confirmation for destructive ops.
          File writes, shell commands, and network access require approval.
        </span>
      </div>

      {/* Call Logs Panel */}
      {showLogs && (
        <Card padding="md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-[var(--ivory-accent)]" />
              <h3 className="text-sm font-semibold text-[var(--ivory-text)]">
                Call History{selectedToolLogs ? ' — ' + (tools.find(t => t.id === selectedToolLogs)?.name || '') : ''}
              </h3>
              <Badge variant="default" size="sm">{callLogs.length}</Badge>
            </div>
            <button onClick={() => { setShowLogs(false); setSelectedToolLogs(null); setCallLogs([]) }}
              className="p-1 rounded-lg text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface)] transition-colors">
              <XCircle size={14} />
            </button>
          </div>
          {callLogs.length === 0 ? (
            <p className="text-xs text-[var(--ivory-text-3)] py-4 text-center">No tool calls logged yet.</p>
          ) : (
            <div className="max-h-52 overflow-y-auto space-y-1">
              {callLogs.map(log => (
                <div key={log.id} className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-[var(--ivory-bg)] transition-colors text-xs">
                  <Badge variant={STATUS_VARIANTS[log.status] || 'default'} size="sm">
                    {STATUS_LABELS[log.status] || log.status.replace(/_/g, ' ')}
                  </Badge>
                  <span className="font-medium text-[var(--ivory-text)]">{log.tool_name}</span>
                  <span className="text-[var(--ivory-text-3)] truncate flex-1">{log.input_preview}</span>
                  {log.error_message && (
                    <span className="text-[var(--ivory-error)] text-ui-caption truncate max-w-[120px]">{log.error_message}</span>
                  )}
                  <span className="text-ui-caption text-[var(--ivory-text-3)] shrink-0">
                    {new Date(log.created_at).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Tool List */}
      {tools.length === 0 ? (
        <Card padding="lg">
          <EmptyState
            icon={<Wrench size={40} strokeWidth={1.5} />}
            title="No tools or MCP servers"
            description="Add an MCP server to extend Aureon's capabilities. Built-in mock tools are seeded on app startup."
            action={<Button size="sm" onClick={() => setShowAddModal(true)}><Plus size={14} /> Add MCP Server</Button>}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {tools.map(tool => (
            <Card key={tool.id} padding="none">
              {/* Tool Row Header */}
              <div
                onClick={() => setExpandedToolId(expandedToolId === tool.id ? null : tool.id)}
                className="px-5 py-3.5 cursor-pointer hover:bg-[var(--ivory-bg)]/50 transition-colors rounded-t-[var(--radius-lg)]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 shrink-0">
                    {expandedToolId === tool.id ? <ChevronDown size={14} className="text-[var(--ivory-text-3)]" /> : <ChevronRight size={14} className="text-[var(--ivory-text-3)]" />}
                    {getStatusIcon(tool)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-[var(--ivory-text)]">{tool.name}</span>
                      <Badge variant={tool.source === 'builtin' ? 'success' : 'default'} size="sm">
                        {tool.source || 'unknown'}
                      </Badge>
                      <Badge variant="default" size="sm">v{tool.version}</Badge>
                      {!tool.is_enabled && <Badge variant="default" size="sm">Disabled</Badge>}
                      {!tool.is_trusted && tool.source !== 'builtin' && <Badge variant="warning" size="sm">Untrusted</Badge>}
                      {hasDestructive(tool) && <Badge variant="warning" size="sm">Destructive</Badge>}
                    </div>
                    <p className="text-xs text-[var(--ivory-text-3)] mt-0.5 truncate">
                      {tool.description || 'No description'}
                    </p>
                  </div>

                  {/* Permission pills */}
                  <div className="hidden sm:flex items-center gap-1 shrink-0">
                    {permissions(tool).map(perm => (
                      <Badge
                        key={perm}
                        variant={DESTRUCTIVE_PERMISSIONS.has(perm) ? 'warning' : 'default'}
                        size="sm"
                      >
                        {PERMISSION_ICONS[perm]} {PERMISSION_DESCRIPTIONS[perm] || perm}
                      </Badge>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                    <Toggle
                      checked={tool.is_enabled === 1}
                      onChange={() => handleToggleEnabled(tool.id)}
                      dataTestId={`toggle-${tool.id}`}
                    />
                    {tool.source !== 'builtin' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleToggleTrusted(tool.id)}
                      >
                        {tool.is_trusted ? 'Untrust' : 'Trust'}
                      </Button>
                    )}
                    <Button variant="danger" size="sm" onClick={() => handleDelete(tool.id)}>
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Expanded Detail */}
              {expandedToolId === tool.id && (
                <div className="px-5 pb-4 border-t border-[var(--ivory-border)]/60">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
                    {/* Left: Transport & Config */}
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-[var(--ivory-text)] mb-1.5">Transport</p>
                        <div className="p-2.5 rounded-xl bg-[var(--ivory-bg)] border border-[var(--ivory-border)]/60 text-xs font-mono text-[var(--ivory-text-2)]">
                          <span className="text-[var(--ivory-text-3)]">type:</span> {tool.transport} ({TRANSPORT_LABELS[tool.transport] || tool.transport})
                          {tool.command && <><br /><span className="text-[var(--ivory-text-3)]">command:</span> {tool.command}</>}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[var(--ivory-text)] mb-1.5">Permissions</p>
                        <div className="flex flex-wrap gap-1">
                          {permissions(tool).length === 0 ? (
                            <span className="text-xs text-[var(--ivory-text-3)]">None</span>
                          ) : (
                            permissions(tool).map(perm => (
                              <Badge key={perm} variant={DESTRUCTIVE_PERMISSIONS.has(perm) ? 'warning' : 'default'} size="sm">
                                {PERMISSION_ICONS[perm]} {PERMISSION_DESCRIPTIONS[perm] || perm}
                              </Badge>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Test & Actions */}
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-[var(--ivory-text)] mb-1.5">Test Tool</p>
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="secondary" onClick={() => handleCheckSafety(tool.id)}>
                            <Shield size={12} /> Check Safety
                          </Button>
                          <Button size="sm" onClick={() => handleExecute(tool.id)} disabled={executing || !tool.is_enabled}>
                            <Play size={12} /> {executing ? 'Running...' : 'Run Test'}
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => loadLogs(tool.id)}>
                            <History size={12} /> View Logs
                          </Button>
                        </div>
                      </div>

                      {/* Safety check result */}
                      {safetyChecks[tool.id] && (
                        <div className={`p-3 rounded-xl border text-xs ${
                          safetyChecks[tool.id]!.allowed
                            ? 'bg-[var(--ivory-success-bg)] text-[var(--ivory-success)] border-[var(--ivory-success)]/20'
                            : 'bg-[var(--ivory-error-bg)] text-[var(--ivory-error)] border-[var(--ivory-error)]/20'
                        }`}>
                          <div className="flex items-center gap-1.5 font-medium mb-1">
                            {safetyChecks[tool.id]!.allowed
                              ? <CheckCircle size={12} />
                              : <XCircle size={12} />
                            }
                            {safetyChecks[tool.id]!.message}
                          </div>
                          {safetyChecks[tool.id]!.requiresConfirmation && (
                            <p className="text-ui-caption text-amber-600">⚠️ User confirmation required before execution</p>
                          )}
                          {safetyChecks[tool.id]!.dryRunPreview && (
                            <p className="text-ui-caption text-[var(--ivory-text-2)] mt-1">Preview: {safetyChecks[tool.id]!.dryRunPreview}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Add MCP Server Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setAddError(null); setNewServer({ name: '', command: '', transport: 'stdio' }) }}
        title="Add MCP Server"
        size="sm"
      >
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-[var(--ivory-warning-bg)] border border-[var(--ivory-warning)]/15 text-xs text-[var(--ivory-warning)]">
            <Shield size={12} className="inline mr-1" />
            New MCP servers are disabled by default. Review their capabilities before enabling.
          </div>

          <Input
            label="Server Name"
            placeholder="My MCP Server"
            value={newServer.name}
            onChange={e => setNewServer(s => ({ ...s, name: e.target.value }))}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--ivory-text)]">Transport Type</label>
            <div className="grid grid-cols-2 gap-1.5">
              {['stdio', 'http', 'sse'].map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setNewServer(s => ({ ...s, transport: t }))}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all text-left
                    ${newServer.transport === t
                      ? 'border-[var(--ivory-accent)]/30 bg-[var(--ivory-accent-light)] text-[var(--ivory-text)]'
                      : 'border-[var(--ivory-border)] bg-[var(--ivory-bg)] text-[var(--ivory-text-2)] hover:bg-[var(--ivory-surface)]'
                    }`}
                >
                  {t === 'stdio' && <Terminal size={12} className="inline mr-1.5 text-[var(--ivory-accent)]" />}
                  {t === 'http' && <Globe size={12} className="inline mr-1.5 text-[var(--ivory-accent)]" />}
                  {t === 'sse' && <Server size={12} className="inline mr-1.5 text-[var(--ivory-accent)]" />}
                  {TRANSPORT_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Command or URL"
            placeholder={newServer.transport === 'stdio' ? 'node server.js' : 'http://localhost:3000'}
            value={newServer.command}
            onChange={e => setNewServer(s => ({ ...s, command: e.target.value }))}
          />

          {addError && <p className="text-xs text-[var(--ivory-error)]">{addError}</p>}

          <Button onClick={handleAddServer} className="w-full">
            <Plus size={14} /> Add Server
          </Button>
        </div>
      </Modal>
    </div>
  )
}
