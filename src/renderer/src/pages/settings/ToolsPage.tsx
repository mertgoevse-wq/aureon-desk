import React, { useCallback, useEffect, useState } from 'react'
import {
  Wrench, Plus, Trash2, Shield, AlertTriangle, CheckCircle,
  Zap, Terminal, Globe, Server, FileText, Database,
  Clipboard, Key,
  Play, Ban, Clock, History, Activity, XCircle, Info,
  FolderOpen, Mail, Link, Unplug, RefreshCw, Download,
  ChevronRight, ArrowRight, Copy,
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
import type { ToolRow, ToolCallLog, SafetyCheckResult, ToolPermission, TransportType, McpDiscoveryResult, McpDiscoveredTool, McpPreset } from '@shared/types/tool'

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

const PRESET_ICONS: Record<string, React.ReactElement> = {
  FolderOpen: <FolderOpen size={18} />,
  Github: <Globe size={18} />,
  Globe: <Globe size={18} />,
  Mail: <Mail size={18} />,
  Wrench: <Wrench size={18} />,
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

const CONNECTION_STATUS_ICONS: Record<string, React.ReactElement> = {
  connected: <CheckCircle size={10} className="text-green-600" />,
  connecting: <RefreshCw size={10} className="text-amber-500 animate-spin" />,
  error: <XCircle size={10} className="text-red-500" />,
  disconnected: <Unplug size={10} className="text-[var(--ivory-text-3)]" />,
}

export function ToolsPage(): React.ReactElement {
  const api = useIpc()
  const [tools, setTools] = useState<ToolRow[]>([])
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null)
  const [callLogs, setCallLogs] = useState<ToolCallLog[]>([])
  const [showLogs, setShowLogs] = useState(false)
  const [selectedToolLogs, setSelectedToolLogs] = useState<string | null>(null)
  const [executing, setExecuting] = useState(false)
  const [safetyChecks, setSafetyChecks] = useState<Record<string, SafetyCheckResult | null>>({})
  const [lastRunTimes, setLastRunTimes] = useState<Record<string, string>>({})

  // Add MCP Server modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [newServer, setNewServer] = useState({
    name: '', command: '', transport: 'stdio' as string, args: '', envVars: '',
    trustLevel: 'local' as string, selectedPreset: ''
  })
  const [addError, setAddError] = useState<string | null>(null)

  // MCP Discovery & Execution
  const [discoveryData, setDiscoveryData] = useState<Record<string, McpDiscoveryResult | null>>({})
  const [connecting, setConnecting] = useState<Record<string, boolean>>({})
  const [discovering, setDiscovering] = useState<Record<string, boolean>>({})
  const [mcpResults, setMcpResults] = useState<Record<string, { toolName: string; output: string; error: string | null; isError: boolean } | null>>({})
  const [showConfirmModal, setShowConfirmModal] = useState<
    | { action: 'connect'; serverId: string; safetyMessage: string }
    | { action: 'execute'; serverId: string; toolName: string; args: Record<string, unknown>; safetyMessage: string }
    | null
  >(null)
  const [presets, setPresets] = useState<McpPreset[]>([])
  const [networkWarnings, setNetworkWarnings] = useState<Record<string, string | null>>({})

  useEffect(() => { loadTools(); loadPresets() }, [])

  const loadPresets = useCallback(async () => {
    try { const p = await api.mcpGetPresets(); setPresets(p) } catch { /* ok */ }
  }, [api])

  const loadTools = useCallback(async () => {
    try {
      const list = await api.toolList()
      setTools(list)
      setSelectedToolId(prev => {
        if (list.length === 0) return null
        if (prev && list.some((t: ToolRow) => t.id === prev)) return prev
        return list[0].id
      })
      // Load network warnings for imported servers
      for (const t of list) {
        if (t.source === 'imported' || t.source === 'mcp') {
          try {
            const w = await api.toolGetNetworkRiskWarning(t.id)
            setNetworkWarnings(prev => ({ ...prev, [t.id]: w }))
          } catch { /* ok */ }
        }
      }
    } catch (e) { console.error(e) }
  }, [api])

  const loadLogs = useCallback(async (toolId?: string) => {
    try {
      const logs = await api.toolGetCallLogs(toolId)
      setCallLogs(logs as ToolCallLog[])
      setSelectedToolLogs(toolId ?? null)
      setShowLogs(true)
      if (logs.length > 0 && toolId) {
        const latest = logs[logs.length - 1] as ToolCallLog
        setLastRunTimes(prev => ({ ...prev, [toolId]: latest.created_at }))
      }
    } catch (e) { console.error(e) }
  }, [api])

  // ---- MCP Lifecycle Handlers ----

  const handleConnect = useCallback(async (serverId: string) => {
    setConnecting(prev => ({ ...prev, [serverId]: true }))
    try {
      const result = await api.mcpConnect(serverId)
      if (result.success) {
        showToast('success', 'MCP server connected')
        loadTools()
      } else if (result.requiresConfirmation) {
        setShowConfirmModal({ action: 'connect', serverId, safetyMessage: result.safetyMessage || result.error || 'Confirmation required' })
      } else {
        showToast('error', result.error || 'Connection failed')
      }
    } catch (e) { showToast('error', String(e)) }
    finally { setConnecting(prev => ({ ...prev, [serverId]: false })) }
  }, [api])

  const handleDisconnect = useCallback(async (serverId: string) => {
    await api.mcpDisconnect(serverId)
    showToast('info', 'MCP server disconnected')
    setDiscoveryData(prev => ({ ...prev, [serverId]: null }))
    loadTools()
  }, [api])

  const handleDiscover = useCallback(async (serverId: string) => {
    setDiscovering(prev => ({ ...prev, [serverId]: true }))
    try {
      const result = await api.mcpDiscover(serverId)
      setDiscoveryData(prev => ({ ...prev, [serverId]: result }))
      if (result) {
        showToast('success', `Discovered ${result.tools.length} tools, ${result.resources.length} resources, ${result.prompts.length} prompts`)
      } else {
        showToast('warning', 'Discovery failed or server not connected')
      }
    } catch (e) { showToast('error', String(e)) }
    finally { setDiscovering(prev => ({ ...prev, [serverId]: false })) }
  }, [api])

  const handleMcpExecute = useCallback(async (serverId: string, toolName: string, args: Record<string, unknown> = {}) => {
    setMcpResults(prev => ({ ...prev, [serverId]: null }))
    // Check if confirmation needed
    const safety = await api.toolCheckSafety(serverId, args)
    if (safety.requiresConfirmation) {
      setShowConfirmModal({ action: 'execute', serverId, toolName, args, safetyMessage: safety.message })
      return
    }

    try {
      const result = await api.mcpExecute(serverId, toolName, args)
      setMcpResults(prev => ({ ...prev, [serverId]: { toolName, output: result.output, error: result.error, isError: !result.success } }))
      if (result.success) {
        showToast('success', `Tool "${toolName}" executed`)
      } else {
        showToast('warning', result.error || 'Execution failed')
      }
      loadLogs(serverId)
    } catch (e) { showToast('error', String(e)) }
  }, [api])

  const handleConfirmedMcpAction = useCallback(async () => {
    if (!showConfirmModal) return
    const confirmation = showConfirmModal
    setShowConfirmModal(null)
    try {
      if (confirmation.action === 'connect') {
        const result = await api.mcpConnect(confirmation.serverId, true)
        if (result.success) {
          showToast('success', 'MCP server connected (confirmed)')
          loadTools()
        } else {
          showToast('warning', result.error || 'Connection failed')
        }
        return
      }

      const result = await api.mcpExecute(confirmation.serverId, confirmation.toolName, confirmation.args, true)
      setMcpResults(prev => ({ ...prev, [confirmation.serverId]: { toolName: confirmation.toolName, output: result.output, error: result.error, isError: !result.success } }))
      if (result.success) {
        showToast('success', `Tool "${confirmation.toolName}" executed (confirmed)`)
      } else {
        showToast('warning', result.error || 'Execution failed')
      }
      loadLogs(confirmation.serverId)
    } catch (e) { showToast('error', String(e)) }
  }, [showConfirmModal, api])

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
    if (selectedToolId === id) setSelectedToolId(null)
    showToast('info', `${tool.name} removed`)
    loadTools()
  }, [api, tools, selectedToolId])

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

  const handlePresetSelect = useCallback((preset: McpPreset) => {
    setNewServer({
      name: preset.name,
      command: preset.command,
      transport: preset.transport,
      args: (preset.args || []).join(' '),
      envVars: '',
      trustLevel: preset.riskLevel === 'safe_read' ? 'local' : preset.riskLevel === 'write_local' ? 'trusted' : 'local',
      selectedPreset: preset.id,
    })
    setShowAddModal(true)
  }, [])

  const handleAddServer = useCallback(async () => {
    if (!newServer.name.trim()) { setAddError('Name is required'); return }
    setAddError(null)
    try {
      const preset = presets.find(p => p.id === newServer.selectedPreset)
      const parsedArgs = newServer.args ? newServer.args.split(/\s+/).filter(Boolean) : []
      const parsedEnvVars = newServer.envVars ? Object.fromEntries(
        newServer.envVars.split('\n').filter(Boolean).map(line => {
          const [k, ...v] = line.split('=')
          return [k.trim(), v.join('=').trim()]
        })
      ) : {}

      const created = await api.toolCreate({
        name: newServer.name.trim(),
        transport: newServer.transport as TransportType,
        command: newServer.command || null,
        source: 'imported',
        description: preset ? preset.description : `MCP server: ${newServer.name}`,
        permissions: preset?.permissions || ['file_read'],
        config: { args: parsedArgs, presetId: newServer.selectedPreset || undefined },
      })

      // If env vars were provided, update the tool with them
      if (Object.keys(parsedEnvVars).length > 0) {
        await api.toolUpdate((created as ToolRow).id, {
          env_vars: JSON.stringify(parsedEnvVars),
        } as any)
      }

      setShowAddModal(false)
      setNewServer({ name: '', command: '', transport: 'stdio', args: '', envVars: '', trustLevel: 'local', selectedPreset: '' })
      showToast('success', 'MCP server added — disabled by default')
      loadTools()
      if (created) setSelectedToolId((created as ToolRow).id)
    } catch (err) { setAddError(String(err)) }
  }, [newServer, api, presets])

  const getStatusIcon = (tool: ToolRow) => {
    const connStatus = (tool as any).connection_status || 'disconnected'
    if (tool.transport !== 'local' && connStatus === 'connected') {
      return CONNECTION_STATUS_ICONS.connected
    }
    if (!tool.is_enabled) return <Ban size={13} className="text-[var(--ivory-text-3)]" />
    if (!tool.is_trusted && tool.source !== 'builtin') return <AlertTriangle size={13} className="text-amber-500" />
    return CONNECTION_STATUS_ICONS[connStatus] || <CheckCircle size={13} className="text-green-600" />
  }

  const permissions = (tool: ToolRow): ToolPermission[] => {
    try { return tool.permissions ? JSON.parse(tool.permissions) : [] }
    catch { return [] }
  }

  const hasDestructive = (tool: ToolRow): boolean => {
    return permissions(tool).some(p => DESTRUCTIVE_PERMISSIONS.has(p))
  }

  const selectedTool = tools.find(t => t.id === selectedToolId) || null
  const selectedDiscovery = selectedToolId ? discoveryData[selectedToolId] : null

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap px-4 py-3 border-b border-[var(--ivory-border)]">
        <div>
          <h2 className="text-lg font-semibold text-[var(--ivory-text)] display-text">Tools &amp; MCP</h2>
          <p className="text-xs text-[var(--ivory-text-3)] mt-0.5 leading-relaxed">
            Connect MCP servers, discover tools, and execute with safety gates. Presets include filesystem, GitHub, search, and Gmail.
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
      <div className="mx-4 mt-3 p-3 rounded-xl bg-[var(--ivory-warning-bg)] border border-[var(--ivory-warning)]/15 text-xs text-[var(--ivory-warning)] flex items-start gap-2.5">
        <Shield size={14} className="shrink-0 mt-0.5" />
        <span className="leading-relaxed">
          All tool calls go through safety gate: enabled → trusted → permissions → confirmation for destructive ops.
          Remote MCP servers are untrusted by default. File writes, shell commands, and network access require approval.
        </span>
      </div>

      {/* Call Logs Panel */}
      {showLogs && (
        <div className="mx-4 mt-3">
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
        </div>
      )}

      {/* MCP Presets — Quick Setup */}
      {tools.length === 0 && presets.length > 0 && (
        <div className="mx-4 mt-3 mb-1">
          <p className="text-xs font-semibold text-[var(--ivory-text-2)] uppercase tracking-wider mb-2">Quick Setup — MCP Presets</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {presets.filter(p => p.id !== 'custom').map(preset => (
              <button
                key={preset.id}
                onClick={() => handlePresetSelect(preset)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-[var(--ivory-border)] bg-[var(--ivory-bg)] hover:bg-[var(--ivory-surface)] hover:border-[var(--ivory-accent)]/30 transition-colors text-center group"
              >
                <div className="w-8 h-8 rounded-lg bg-[var(--ivory-surface-2)] flex items-center justify-center text-[var(--ivory-accent)] group-hover:bg-[var(--ivory-accent-light)]/20 transition-colors">
                  {PRESET_ICONS[preset.icon] || <Wrench size={16} />}
                </div>
                <span className="text-[11px] font-semibold text-[var(--ivory-text)]">{preset.name}</span>
                <span className="text-[10px] text-[var(--ivory-text-3)] leading-tight">{preset.description.slice(0, 60)}</span>
                {preset.setupInstructions && (
                  <span className="text-[9px] text-amber-600 mt-0.5">⚠ Setup required</span>
                )}
              </button>
            ))}
            <button
              onClick={() => setShowAddModal(true)}
              className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl border border-dashed border-[var(--ivory-border)] bg-transparent hover:bg-[var(--ivory-surface)] hover:border-[var(--ivory-accent)]/30 transition-colors text-center"
            >
              <Plus size={18} className="text-[var(--ivory-text-3)]" />
              <span className="text-[11px] font-medium text-[var(--ivory-text-2)]">Custom</span>
            </button>
          </div>
        </div>
      )}

      {/* Master-Detail Layout */}
      {tools.length === 0 && presets.length === 0 ? (
        <div className="flex-1 flex items-center justify-center m-4">
          <Card padding="lg" className="max-w-md">
            <EmptyState
              icon={<Wrench size={40} strokeWidth={1.5} />}
              title="No MCP servers connected"
              description="Add an MCP server to extend Aureon's capabilities. Choose a preset for quick setup or configure a custom server."
              action={<Button size="sm" onClick={() => setShowAddModal(true)}><Plus size={14} /> Add MCP Server</Button>}
            />
          </Card>
        </div>
      ) : (
        <div className="flex-1 flex min-h-0 m-4 gap-4">
          {/* Left: Tool List */}
          <div className="w-[260px] shrink-0 flex flex-col rounded-2xl border border-[var(--ivory-border)] bg-[var(--ivory-elevated)] overflow-hidden shadow-[var(--shadow-xs)]">
            <div className="px-4 py-3 border-b border-[var(--ivory-border)]/60">
              <p className="text-xs font-semibold text-[var(--ivory-text-2)] uppercase tracking-wider">
                Tools &amp; Servers
              </p>
              <p className="text-[11px] text-[var(--ivory-text-3)] mt-0.5">{tools.length} registered</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {tools.map(tool => {
                const isSelected = tool.id === selectedToolId
                const perms = permissions(tool)
                const connStatus = (tool as any).connection_status || 'disconnected'
                return (
                  <button
                    key={tool.id}
                    onClick={() => setSelectedToolId(tool.id)}
                    className={`w-full text-left px-4 py-3 border-b border-[var(--ivory-border)]/40 transition-colors
                      ${isSelected
                        ? 'bg-[var(--ivory-surface)] border-l-2 border-l-[var(--ivory-accent)]'
                        : 'hover:bg-[var(--ivory-surface)]/50'}`}
                  >
                    <div className="flex items-center gap-2">
                      {getStatusIcon(tool)}
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-semibold text-[var(--ivory-text)] truncate block">
                          {tool.name}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <Badge variant={tool.source === 'builtin' ? 'success' : 'default'} size="sm">
                            {tool.source || 'unknown'}
                          </Badge>
                          {tool.transport !== 'local' && connStatus === 'connected' && (
                            <Badge variant="success" size="sm">Connected</Badge>
                          )}
                          {!tool.is_enabled && <Badge variant="default" size="sm">Off</Badge>}
                          {!tool.is_trusted && tool.source !== 'builtin' && (
                            <Badge variant="warning" size="sm">Untrusted</Badge>
                          )}
                          {hasDestructive(tool) && (
                            <Badge variant="warning" size="sm">Destructive</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Network warning */}
                    {networkWarnings[tool.id] && (
                      <div className="mt-1.5 ml-5 text-[10px] text-amber-600 bg-amber-50 rounded-lg px-2 py-1 leading-relaxed">
                        ⚠ {networkWarnings[tool.id]}
                      </div>
                    )}
                    {/* Permission icons row */}
                    {perms.length > 0 && (
                      <div className="flex flex-wrap gap-0.5 mt-1.5 ml-5">
                        {perms.slice(0, 3).map(perm => (
                          <span key={perm} className={`text-[11px]
                            ${DESTRUCTIVE_PERMISSIONS.has(perm) ? 'text-amber-600' : 'text-[var(--ivory-text-3)]'}`}
                            title={PERMISSION_DESCRIPTIONS[perm] || perm}
                          >
                            {PERMISSION_ICONS[perm]}
                          </span>
                        ))}
                        {perms.length > 3 && (
                          <span className="text-[10px] text-[var(--ivory-text-3)]">+{perms.length - 3}</span>
                        )}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Right: Detail Panel */}
          <div className="flex-1 min-w-0 overflow-y-auto rounded-2xl border border-[var(--ivory-border)] bg-[var(--ivory-elevated)] shadow-[var(--shadow-xs)]">
            {selectedTool ? (
              <div className="p-5 space-y-5">
                {/* Tool Header */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-[var(--ivory-surface)] border border-[var(--ivory-border)] flex items-center justify-center text-[var(--ivory-accent)]">
                        <Wrench size={16} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-[15px] font-semibold text-[var(--ivory-text)]">{selectedTool.name}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <Badge variant={selectedTool.source === 'builtin' ? 'success' : 'default'} size="sm">
                            {selectedTool.source || 'unknown'}
                          </Badge>
                          <Badge variant="default" size="sm">v{selectedTool.version}</Badge>
                          {!selectedTool.is_enabled && <Badge variant="default" size="sm">Disabled</Badge>}
                          {!selectedTool.is_trusted && selectedTool.source !== 'builtin' && (
                            <Badge variant="warning" size="sm">Untrusted</Badge>
                          )}
                          {hasDestructive(selectedTool) && <Badge variant="warning" size="sm">Destructive</Badge>}
                          {selectedTool.connection_status === 'connected' && (
                            <Badge variant="success" size="sm">Connected</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Toggle
                        checked={selectedTool.is_enabled === 1}
                        onChange={() => handleToggleEnabled(selectedTool.id)}
                        dataTestId={`toggle-${selectedTool.id}`}
                      />
                    </div>
                  </div>
                  {selectedTool.description && (
                    <p className="text-xs text-[var(--ivory-text-3)] leading-relaxed">{selectedTool.description}</p>
                  )}
                </div>

                {/* MCP Connection Controls (for non-local servers) */}
                {selectedTool.transport !== 'local' && (
                  <Section title="Connection">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleConnect(selectedTool.id)}
                        disabled={connecting[selectedTool.id] || selectedTool.connection_status === 'connected'}
                      >
                        <Link size={12} /> {connecting[selectedTool.id] ? 'Connecting...' : 'Connect'}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleDisconnect(selectedTool.id)}
                        disabled={selectedTool.connection_status !== 'connected'}
                      >
                        <Unplug size={12} /> Disconnect
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleDiscover(selectedTool.id)}
                        disabled={selectedTool.connection_status !== 'connected' || discovering[selectedTool.id]}
                      >
                        <Download size={12} /> {discovering[selectedTool.id] ? 'Discovering...' : 'Discover'}
                      </Button>
                    </div>
                    {/* Connection status */}
                    {selectedTool.connection_status === 'error' && (
                      <p className="text-xs text-[var(--ivory-error)] mt-1.5">Connection error — check server configuration and try again.</p>
                    )}
                  </Section>
                )}

                {/* Transport */}
                <Section title="Transport">
                  <div className="p-3 rounded-xl bg-[var(--ivory-bg)] border border-[var(--ivory-border)]/60 text-xs font-mono text-[var(--ivory-text-2)]">
                    <span className="text-[var(--ivory-text-3)]">type:</span> {selectedTool.transport} ({TRANSPORT_LABELS[selectedTool.transport] || selectedTool.transport})
                    {selectedTool.command && <><br /><span className="text-[var(--ivory-text-3)]">command:</span> {selectedTool.command}</>}
                  </div>
                </Section>

                {/* Permissions */}
                <Section title="Permissions">
                  {permissions(selectedTool).length === 0 ? (
                    <span className="text-xs text-[var(--ivory-text-3)]">None</span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {permissions(selectedTool).map(perm => (
                        <Badge key={perm} variant={DESTRUCTIVE_PERMISSIONS.has(perm) ? 'warning' : 'default'} size="sm">
                          {PERMISSION_ICONS[perm]} {PERMISSION_DESCRIPTIONS[perm] || perm}
                        </Badge>
                      ))}
                    </div>
                  )}
                </Section>

                {/* Status & Risk */}
                <Section title="Status &amp; Risk">
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--ivory-text-3)] w-20">Enabled:</span>
                      <Badge variant={selectedTool.is_enabled ? 'success' : 'default'} size="sm">
                        {selectedTool.is_enabled ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--ivory-text-3)] w-20">Trusted:</span>
                      <Badge variant={selectedTool.is_trusted ? 'success' : 'warning'} size="sm">
                        {selectedTool.is_trusted ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--ivory-text-3)] w-20">Risk Level:</span>
                      <Badge variant={hasDestructive(selectedTool) ? 'warning' : 'success'} size="sm">
                        {hasDestructive(selectedTool) ? 'Destructive' : 'Safe'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--ivory-text-3)] w-20">Approval:</span>
                      <Badge variant={hasDestructive(selectedTool) ? 'warning' : 'success'} size="sm">
                        {hasDestructive(selectedTool) ? 'Required' : 'Not required'}
                      </Badge>
                    </div>
                    {lastRunTimes[selectedTool.id] && (
                      <div className="flex items-center gap-2">
                        <span className="text-[var(--ivory-text-3)] w-20">Last Run:</span>
                        <span className="text-[var(--ivory-text-2)] font-mono">
                          {new Date(lastRunTimes[selectedTool.id]).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {selectedTool.last_discovered_at && (
                      <div className="flex items-center gap-2">
                        <span className="text-[var(--ivory-text-3)] w-20">Discovered:</span>
                        <span className="text-[var(--ivory-text-2)] font-mono">
                          {new Date(selectedTool.last_discovered_at).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </Section>

                {/* Discovery Results */}
                {selectedDiscovery && (
                  <>
                    {selectedDiscovery.tools.length > 0 && (
                      <Section title={`Discovered Tools (${selectedDiscovery.tools.length})`}>
                        <div className="space-y-1.5 max-h-52 overflow-y-auto">
                          {selectedDiscovery.tools.map((tool: McpDiscoveredTool) => (
                            <div key={tool.name} className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--ivory-bg)] border border-[var(--ivory-border)]/50 hover:border-[var(--ivory-accent)]/20 transition-colors">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-semibold text-[var(--ivory-text)]">{tool.name}</span>
                                  <Badge variant={tool.riskLevel === 'destructive' ? 'warning' : tool.riskLevel === 'read_only' ? 'success' : 'default'} size="sm">
                                    {tool.riskLevel}
                                  </Badge>
                                </div>
                                <p className="text-[11px] text-[var(--ivory-text-3)] truncate mt-0.5">{tool.description}</p>
                              </div>
                              <div className="flex items-center gap-1 shrink-0 ml-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleMcpExecute(selectedTool.id, tool.name, {})}
                                  disabled={(selectedTool as any).connection_status !== 'connected'}
                                  title={`Run ${tool.name}`}
                                >
                                  <Play size={11} />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Section>
                    )}
                    {selectedDiscovery.resources.length > 0 && (
                      <Section title={`Resources (${selectedDiscovery.resources.length})`}>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {selectedDiscovery.resources.map(r => (
                            <div key={r.uri} className="text-[11px] text-[var(--ivory-text-2)] p-1.5 rounded-lg hover:bg-[var(--ivory-bg)]">
                              <span className="font-mono text-[var(--ivory-text-3)]">{r.uri}</span>
                              <span className="ml-2">{r.name}</span>
                            </div>
                          ))}
                        </div>
                      </Section>
                    )}
                    {selectedDiscovery.prompts.length > 0 && (
                      <Section title={`Prompts (${selectedDiscovery.prompts.length})`}>
                        <div className="space-y-1">
                          {selectedDiscovery.prompts.map(p => (
                            <div key={p.name} className="text-xs p-1.5">
                              <span className="font-semibold text-[var(--ivory-text)]">{p.name}</span>
                              <span className="text-[var(--ivory-text-3)] ml-2">{p.description}</span>
                            </div>
                          ))}
                        </div>
                      </Section>
                    )}
                  </>
                )}

                {/* MCP Execution Results */}
                {mcpResults[selectedTool.id] && (
                  <Section title={`Result: ${mcpResults[selectedTool.id]!.toolName}`}>
                    <div className={`p-3 rounded-xl border text-xs font-mono whitespace-pre-wrap max-h-48 overflow-y-auto ${
                      mcpResults[selectedTool.id]!.isError
                        ? 'bg-red-50 border-red-200 text-red-700'
                        : 'bg-[var(--ivory-bg)] border-[var(--ivory-border)]/60 text-[var(--ivory-text-2)]'
                    }`}>
                      {mcpResults[selectedTool.id]!.output || mcpResults[selectedTool.id]!.error || '(no output)'}
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(mcpResults[selectedTool.id]!.output || '')
                        showToast('info', 'Copied result to clipboard')
                      }}
                      className="text-[10px] text-[var(--ivory-accent)] hover:underline mt-1 inline-flex items-center gap-1"
                    >
                      <Copy size={10} /> Copy to chat
                    </button>
                  </Section>
                )}

                {/* Test Tool (mock/builtin only) */}
                {selectedTool.transport === 'local' && (
                  <Section title="Test Tool">
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="secondary" onClick={() => handleCheckSafety(selectedTool.id)}>
                        <Shield size={12} /> Check Safety
                      </Button>
                      <Button size="sm" onClick={() => handleExecute(selectedTool.id)} disabled={executing || !selectedTool.is_enabled}>
                        <Play size={12} /> {executing ? 'Running...' : 'Run Test'}
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => loadLogs(selectedTool.id)}>
                        <History size={12} /> View Logs
                      </Button>
                    </div>

                    {/* Safety check result */}
                    {safetyChecks[selectedTool.id] && (
                      <div className={`mt-3 p-3 rounded-xl border text-xs ${
                        safetyChecks[selectedTool.id]!.allowed
                          ? 'bg-[var(--ivory-success-bg)] text-[var(--ivory-success)] border-[var(--ivory-success)]/20'
                          : 'bg-[var(--ivory-error-bg)] text-[var(--ivory-error)] border-[var(--ivory-error)]/20'
                      }`}>
                        <div className="flex items-center gap-1.5 font-medium mb-1">
                          {safetyChecks[selectedTool.id]!.allowed
                            ? <CheckCircle size={12} />
                            : <XCircle size={12} />
                          }
                          {safetyChecks[selectedTool.id]!.message}
                        </div>
                        {safetyChecks[selectedTool.id]!.requiresConfirmation && (
                          <p className="text-ui-caption text-amber-600">User confirmation required before execution</p>
                        )}
                        {safetyChecks[selectedTool.id]!.dryRunPreview && (
                          <p className="text-ui-caption text-[var(--ivory-text-2)] mt-1">Preview: {safetyChecks[selectedTool.id]!.dryRunPreview}</p>
                        )}
                      </div>
                    )}
                  </Section>
                )}

                {/* Actions Footer */}
                <div className="pt-3 border-t border-[var(--ivory-border)]/60 flex items-center gap-2">
                  {selectedTool.source !== 'builtin' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleToggleTrusted(selectedTool.id)}
                    >
                      {selectedTool.is_trusted ? 'Untrust' : 'Trust'}
                    </Button>
                  )}
                  <Button variant="danger" size="sm" onClick={() => handleDelete(selectedTool.id)}>
                    <Trash2 size={13} /> Delete
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full py-16 text-center px-6">
                <div className="max-w-[200px]">
                  <div className="w-12 h-12 rounded-xl bg-[var(--ivory-surface-2)] flex items-center justify-center mx-auto mb-3">
                    <Info size={22} className="text-[var(--ivory-text-3)]" strokeWidth={1.5} />
                  </div>
                  <p className="text-xs text-[var(--ivory-text-3)] leading-relaxed">
                    Select a tool or MCP server from the list to view details, connect, discover tools, and execute.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add MCP Server Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          setAddError(null)
          setNewServer({ name: '', command: '', transport: 'stdio', args: '', envVars: '', trustLevel: 'local', selectedPreset: '' })
        }}
        title={newServer.selectedPreset ? `Add ${newServer.name} Server` : 'Add MCP Server'}
        size="sm"
      >
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-[var(--ivory-warning-bg)] border border-[var(--ivory-warning)]/15 text-xs text-[var(--ivory-warning)]">
            <Shield size={12} className="inline mr-1" />
            MCP servers are disabled by default. Connect, discover tools, and review capabilities before enabling.
          </div>

          {/* Preset picker */}
          {presets.length > 0 && !newServer.selectedPreset && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--ivory-text)]">Choose a Preset</label>
              <div className="grid grid-cols-2 gap-1.5">
                {presets.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handlePresetSelect(p)}
                    className="px-3 py-2 rounded-xl text-xs font-medium border transition text-left bg-[var(--ivory-bg)] border-[var(--ivory-border)] hover:border-[var(--ivory-accent)]/30 hover:bg-[var(--ivory-surface)]"
                  >
                    {PRESET_ICONS[p.icon] && <span className="inline mr-1.5 text-[var(--ivory-accent)]">{PRESET_ICONS[p.icon]}</span>}
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {newServer.selectedPreset && (
            <div className="p-3 rounded-xl bg-[var(--ivory-bg)] border border-[var(--ivory-border)]/60 text-xs">
              <p className="font-semibold text-[var(--ivory-text)]">{newServer.name}</p>
              <p className="text-[var(--ivory-text-3)] mt-0.5">{presets.find(p => p.id === newServer.selectedPreset)?.description}</p>
              {presets.find(p => p.id === newServer.selectedPreset)?.setupInstructions && (
                <p className="text-amber-600 mt-1 text-[10px]">
                  {presets.find(p => p.id === newServer.selectedPreset)?.setupInstructions}
                </p>
              )}
            </div>
          )}

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
                  className={`px-3 py-2 rounded-xl text-xs font-medium border transition text-left
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
            label={newServer.transport === 'stdio' ? 'Command' : 'URL'}
            placeholder={newServer.transport === 'stdio' ? 'npx -y @anthropic/mcp-server-filesystem .' : 'http://localhost:3000/sse'}
            value={newServer.command}
            onChange={e => setNewServer(s => ({ ...s, command: e.target.value }))}
          />

          {newServer.transport === 'stdio' && (
            <Input
              label="Arguments (optional, space-separated)"
              placeholder="-y @anthropic/mcp-server-filesystem ."
              value={newServer.args}
              onChange={e => setNewServer(s => ({ ...s, args: e.target.value }))}
            />
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--ivory-text)]">Environment Variables (one per line, KEY=VALUE)</label>
            <textarea
              value={newServer.envVars}
              onChange={e => setNewServer(s => ({ ...s, envVars: e.target.value }))}
              placeholder="GITHUB_TOKEN=ghp_xxx&#10;NODE_ENV=production"
              rows={3}
              className="w-full resize-none bg-[var(--ivory-bg)] border border-[var(--ivory-border)] rounded-xl px-3 py-2 text-[13px] text-[var(--ivory-text)] placeholder:text-[var(--ivory-text-3)] outline-none focus:border-[var(--ivory-accent)] font-mono"
            />
            <p className="text-[10px] text-[var(--ivory-text-3)]">
              Env vars are stored encrypted and redacted in logs.
            </p>
          </div>

          {addError && <p className="text-xs text-[var(--ivory-error)]">{addError}</p>}

          <Button onClick={handleAddServer} className="w-full">
            <Plus size={14} /> Add Server
          </Button>
        </div>
      </Modal>

      {/* Confirmation Modal for Destructive Operations */}
      <Modal
        isOpen={!!showConfirmModal}
        onClose={() => setShowConfirmModal(null)}
        title={showConfirmModal?.action === 'connect' ? 'Confirm MCP Server Connection' : 'Confirm Tool Execution'}
        size="sm"
      >
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            <span>{showConfirmModal?.safetyMessage}</span>
          </div>

          <div className="p-3 rounded-xl bg-[var(--ivory-bg)] border border-[var(--ivory-border)]/60">
            <p className="text-xs font-semibold text-[var(--ivory-text)]">
              {showConfirmModal?.action === 'connect' ? 'Action: Connect MCP server' : `Tool: ${showConfirmModal?.toolName}`}
            </p>
            {showConfirmModal?.action === 'execute' && Object.keys(showConfirmModal.args).length > 0 && (
              <pre className="text-[11px] text-[var(--ivory-text-3)] mt-1 font-mono">
                {JSON.stringify(showConfirmModal.args, null, 2)}
              </pre>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowConfirmModal(null)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleConfirmedMcpAction} className="flex-1">
              <CheckCircle size={14} /> {showConfirmModal?.action === 'connect' ? 'Confirm & Connect' : 'Confirm & Execute'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }): React.ReactElement {
  return (
    <div>
      <p className="text-xs font-semibold text-[var(--ivory-text-2)] mb-2">{title}</p>
      {children}
    </div>
  )
}
