import React, { useCallback, useEffect, useState } from 'react'
import {
  FileText, Search, Filter, Trash2, Download, Copy, X,
  AlertTriangle, Info, AlertCircle, Bug, Eye,
  Shield, Wrench, FolderOpen, MessageSquare, Globe, Package, Terminal
} from 'lucide-react'
import { Button } from '../../components/shared/Button'
import { Input } from '../../components/shared/Input'
import { Badge } from '../../components/shared/Badge'
import { useIpc } from '../../hooks/useIpc'
import type { AppLogRow, LogFilter, DebugBundle, LogLevel, LogCategory } from '@shared/types/log'

const LEVEL_ICONS: Record<LogLevel, React.ReactElement> = {
  debug: <Bug size={12} />,
  info: <Info size={12} />,
  warn: <AlertTriangle size={12} />,
  error: <AlertCircle size={12} />,
}

const LEVEL_COLORS: Record<LogLevel, string> = {
  debug: 'text-gray-400 bg-gray-50',
  info: 'text-blue-600 bg-blue-50',
  warn: 'text-amber-600 bg-amber-50',
  error: 'text-red-600 bg-red-50',
}

const CATEGORY_ICONS: Record<LogCategory, React.ReactElement> = {
  app: <Info size={12} />,
  routing: <Search size={12} />,
  provider: <Globe size={12} />,
  tool: <Wrench size={12} />,
  import: <Package size={12} />,
  chat: <MessageSquare size={12} />,
  project: <FolderOpen size={12} />,
  security: <Shield size={12} />,
  system: <Terminal size={12} />,
}

const CATEGORY_LABELS: Record<LogCategory, string> = {
  app: 'App', routing: 'Routing', provider: 'Provider',
  tool: 'Tool', import: 'Import', chat: 'Chat',
  project: 'Project', security: 'Security', system: 'System',
}

export function LogsPage(): React.ReactElement {
  const api = useIpc()
  const [logs, setLogs] = useState<AppLogRow[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  // Filters
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState<LogLevel | ''>('')
  const [categoryFilter, setCategoryFilter] = useState<LogCategory | ''>('')
  const [categories, setCategories] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [limit, setLimit] = useState(200)

  // Detail view
  const [selectedLog, setSelectedLog] = useState<AppLogRow | null>(null)

  // Export state
  const [exporting, setExporting] = useState(false)
  const [debugBundle, setDebugBundle] = useState<DebugBundle | null>(null)
  const [showBundle, setShowBundle] = useState(false)

  // Clear state
  const [clearConfirm, setClearConfirm] = useState<'app' | 'tool' | 'import' | null>(null)

  useEffect(() => { loadCategories(); loadLogs() }, [])

  const loadCategories = useCallback(async () => {
    try {
      const cats = await api.logCategories()
      setCategories(cats)
    } catch { /* optional */ }
  }, [api])

  const loadLogs = useCallback(async () => {
    setIsLoading(true)
    try {
      const filter: LogFilter = { limit, offset: 0 }
      if (search) filter.search = search
      if (levelFilter) filter.level = levelFilter as LogLevel
      if (categoryFilter) filter.category = categoryFilter as LogCategory

      const [results, count] = await Promise.all([
        api.logQuery(filter),
        api.logCount(filter)
      ])
      setLogs(results)
      setTotalCount(count)
    } catch (err) { console.error(err) }
    finally { setIsLoading(false) }
  }, [api, search, levelFilter, categoryFilter, limit])

  const handleClearLogs = useCallback(async (type: 'app' | 'tool' | 'import') => {
    setClearConfirm(null)
    if (type === 'app') {
      await api.logClear()
      loadLogs()
    } else if (type === 'tool') {
      await api.logClearToolCallLogs()
    } else if (type === 'import') {
      await api.logClearImportLogs()
    }
  }, [api, loadLogs])

  const handleExportBundle = useCallback(async () => {
    setExporting(true)
    try {
      const bundle = await api.logExportDebugBundle()
      setDebugBundle(bundle)
      setShowBundle(true)

      // Also download as file
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Vibeforge-debug-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) { console.error(err) }
    finally { setExporting(false) }
  }, [api])

  const handleCopyLog = useCallback((log: AppLogRow) => {
    const text = `[${log.timestamp}] [${log.level.toUpperCase()}] [${log.category}] ${log.message}${log.metadata ? ` ${log.metadata}` : ''}`
    navigator.clipboard.writeText(text).catch(() => {})
  }, [])

  const handleQuickFilter = useCallback((filters: Partial<{ level: LogLevel; category: LogCategory }>) => {
    if (filters.level) setLevelFilter(filters.level)
    else setLevelFilter('')
    if (filters.category) setCategoryFilter(filters.category)
    else setCategoryFilter('')
    setShowFilters(false)
    setTimeout(() => loadLogs(), 0)
  }, [loadLogs])

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--ivory-border)]">
        <div>
          <h1 className="text-xl font-semibold display-text">Logs & Debug</h1>
          <p className="text-xs text-[var(--ivory-text-3)] mt-0.5">
            App events, routing, provider requests, tool calls, imports, and errors.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleExportBundle} disabled={exporting}>
            <Download size={14} /> {exporting ? 'Exporting...' : 'Debug Bundle'}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setClearConfirm('app')}>
            <Trash2 size={14} /> Clear Logs
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-[var(--ivory-border)] bg-[var(--ivory-bg)]">
        <div className="flex-1 flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ivory-text-3)]" />
            <input
              className="w-full bg-[var(--ivory-surface)] border border-[var(--ivory-border)] rounded-[var(--radius-md)] pl-9 pr-3 py-1.5 text-sm text-[var(--ivory-text)]
                placeholder-[var(--ivory-text-3)] focus:outline-none focus:border-[var(--ivory-accent)]"
              placeholder="Search logs..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loadLogs()}
            />
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter size={14} /> Filters
          </Button>
          <Button variant="ghost" size="sm" onClick={loadLogs} disabled={isLoading}>
            <Search size={14} /> {isLoading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
        <span className="text-xs text-[var(--ivory-text-3)]">
          {totalCount} entries
        </span>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="px-6 py-3 border-b border-[var(--ivory-border)] bg-[var(--ivory-bg)] flex items-center gap-4 flex-wrap">
          {/* Level filter */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-[var(--ivory-text-3)] mr-1">Level:</span>
            {(['', 'debug', 'info', 'warn', 'error'] as const).map(l => (
              <button
                key={l}
                onClick={() => { setLevelFilter(l || ''); loadLogs() }}
                className={`px-2 py-0.5 rounded-[var(--radius-sm)] text-xs transition-colors ${
                  levelFilter === l ? 'bg-[var(--ivory-accent)] text-white' : 'text-[var(--ivory-text-2)] hover:bg-[var(--ivory-surface-2)]'
                }`}
              >
                {l ? (
                  <span className="flex items-center gap-1">
                    {LEVEL_ICONS[l as LogLevel]} {l.toUpperCase()}
                  </span>
                ) : 'All'}
              </button>
            ))}
          </div>

          {/* Category filter */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-[var(--ivory-text-3)] mr-1">Category:</span>
            <button
              onClick={() => { setCategoryFilter(''); loadLogs() }}
              className={`px-2 py-0.5 rounded-[var(--radius-sm)] text-xs transition-colors ${
                !categoryFilter ? 'bg-[var(--ivory-accent)] text-white' : 'text-[var(--ivory-text-2)] hover:bg-[var(--ivory-surface-2)]'
              }`}
            >
              All
            </button>
            {categories.slice(0, 9).map(c => (
              <button
                key={c}
                onClick={() => { setCategoryFilter(c as LogCategory); loadLogs() }}
                className={`px-2 py-0.5 rounded-[var(--radius-sm)] text-xs transition-colors flex items-center gap-1 ${
                  categoryFilter === c ? 'bg-[var(--ivory-accent)] text-white' : 'text-[var(--ivory-text-2)] hover:bg-[var(--ivory-surface-2)]'
                }`}
              >
                {CATEGORY_ICONS[c as LogCategory] || <Info size={10} />}
                {CATEGORY_LABELS[c as LogCategory] || c}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <span className="text-xs text-[var(--ivory-text-3)] mr-1">Limit:</span>
            {([100, 200, 500, 1000] as const).map(l => (
              <button
                key={l}
                onClick={() => { setLimit(l); loadLogs() }}
                className={`px-2 py-0.5 rounded-[var(--radius-sm)] text-xs transition-colors ${
                  limit === l ? 'bg-[var(--ivory-accent)] text-white' : 'text-[var(--ivory-text-2)] hover:bg-[var(--ivory-surface-2)]'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Log Table */}
      <div className="flex-1 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <FileText size={36} className="text-[var(--ivory-text-3)] mb-3" strokeWidth={1} />
            <p className="text-sm text-[var(--ivory-text-2)] font-medium mb-1">No log entries</p>
            <p className="text-xs text-[var(--ivory-text-3)]">Logs appear here as app events occur.</p>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-[var(--ivory-bg)] border-b border-[var(--ivory-border)]">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-[var(--ivory-text-2)] w-24">Level</th>
                <th className="text-left px-4 py-2 font-medium text-[var(--ivory-text-2)] w-40">Timestamp</th>
                <th className="text-left px-4 py-2 font-medium text-[var(--ivory-text-2)] w-24">Category</th>
                <th className="text-left px-4 py-2 font-medium text-[var(--ivory-text-2)]">Message</th>
                <th className="text-right px-4 py-2 font-medium text-[var(--ivory-text-2)] w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr
                  key={log.id}
                  className={`border-b border-[var(--ivory-border)] hover:bg-[var(--ivory-surface-2)] cursor-pointer transition-colors ${
                    selectedLog?.id === log.id ? 'bg-[var(--ivory-surface-2)]' : ''
                  }`}
                  onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
                >
                  <td className="px-4 py-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-sm)] text-[10px] font-medium ${LEVEL_COLORS[log.level]}`}>
                      {LEVEL_ICONS[log.level]} {log.level.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-[var(--ivory-text-3)] font-mono text-[10px]">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-2">
                    <span className="inline-flex items-center gap-1 text-[var(--ivory-text-2)]">
                      {CATEGORY_ICONS[log.category] || <Info size={10} />}
                      {CATEGORY_LABELS[log.category] || log.category}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span className="text-[var(--ivory-text)] truncate block max-w-lg">{log.message}</span>
                    {log.metadata && (
                      <span className="text-[10px] text-[var(--ivory-text-3)] block truncate max-w-lg">
                        {log.metadata.slice(0, 120)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={e => { e.stopPropagation(); handleCopyLog(log) }}
                        className="p-1 rounded hover:bg-[var(--ivory-surface)] text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)]"
                        title="Copy sanitized log"
                      >
                        <Copy size={12} />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); setSelectedLog(log) }}
                        className="p-1 rounded hover:bg-[var(--ivory-surface)] text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)]"
                        title="View details"
                      >
                        <Eye size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Log Detail Panel */}
      {selectedLog && (
        <div className="border-t border-[var(--ivory-border)] bg-[var(--ivory-bg)] p-4 max-h-64 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold display-text">Log Detail</h3>
            <button onClick={() => setSelectedLog(null)} className="text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)]">
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
            <div>
              <span className="text-[var(--ivory-text-3)]">ID:</span>
              <span className="ml-2 font-mono text-[10px] text-[var(--ivory-text-2)]">{selectedLog.id}</span>
            </div>
            <div>
              <span className="text-[var(--ivory-text-3)]">Timestamp:</span>
              <span className="ml-2 text-[var(--ivory-text-2)]">{new Date(selectedLog.timestamp).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-[var(--ivory-text-3)]">Level:</span>
              <span className={`ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-sm)] text-[10px] font-medium ${LEVEL_COLORS[selectedLog.level]}`}>
                {LEVEL_ICONS[selectedLog.level]} {selectedLog.level.toUpperCase()}
              </span>
            </div>
            <div>
              <span className="text-[var(--ivory-text-3)]">Category:</span>
              <span className="ml-2 text-[var(--ivory-text-2)]">{selectedLog.category}</span>
            </div>
            {selectedLog.chat_id && (
              <div>
                <span className="text-[var(--ivory-text-3)]">Chat:</span>
                <span className="ml-2 font-mono text-[10px] text-[var(--ivory-text-2)]">{selectedLog.chat_id.slice(0, 12)}...</span>
              </div>
            )}
            {selectedLog.project_id && (
              <div>
                <span className="text-[var(--ivory-text-3)]">Project:</span>
                <span className="ml-2 font-mono text-[10px] text-[var(--ivory-text-2)]">{selectedLog.project_id.slice(0, 12)}...</span>
              </div>
            )}
          </div>
          <div className="mb-2">
            <span className="text-xs font-medium text-[var(--ivory-text-2)]">Message</span>
            <pre className="mt-1 text-xs text-[var(--ivory-text)] bg-[var(--ivory-surface)] p-3 rounded-[var(--radius-md)] border border-[var(--ivory-border)] whitespace-pre-wrap break-all">
              {selectedLog.message}
            </pre>
          </div>
          {selectedLog.metadata && (
            <div>
              <span className="text-xs font-medium text-[var(--ivory-text-2)]">Metadata</span>
              <pre className="mt-1 text-[10px] text-[var(--ivory-text-3)] bg-[var(--ivory-surface)] p-3 rounded-[var(--radius-md)] border border-[var(--ivory-border)] whitespace-pre-wrap break-all max-h-32 overflow-y-auto">
                {JSON.stringify(tryParseJSON(selectedLog.metadata), null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Debug Bundle Preview */}
      {showBundle && debugBundle && (
        <div className="border-t border-[var(--ivory-border)] bg-[var(--ivory-bg)] p-4 max-h-80 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold display-text">Debug Bundle</h3>
              <p className="text-[10px] text-[var(--ivory-text-3)]">
                Exported {new Date(debugBundle.exportedAt).toLocaleString()} — v{debugBundle.appVersion} ({debugBundle.platform}/{debugBundle.arch})
              </p>
            </div>
            <button onClick={() => setShowBundle(false)} className="text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)]">
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="p-2 rounded-[var(--radius-sm)] bg-[var(--ivory-surface)] border border-[var(--ivory-border)] text-center">
              <span className="block text-lg font-semibold text-[var(--ivory-accent)]">{debugBundle.metadata.logCount}</span>
              <span className="text-[10px] text-[var(--ivory-text-3)]">App Logs</span>
            </div>
            <div className="p-2 rounded-[var(--radius-sm)] bg-[var(--ivory-surface)] border border-[var(--ivory-border)] text-center">
              <span className="block text-lg font-semibold text-[var(--ivory-accent)]">{debugBundle.metadata.toolCallCount}</span>
              <span className="text-[10px] text-[var(--ivory-text-3)]">Tool Calls</span>
            </div>
            <div className="p-2 rounded-[var(--radius-sm)] bg-[var(--ivory-surface)] border border-[var(--ivory-border)] text-center">
              <span className="block text-lg font-semibold text-[var(--ivory-accent)]">{debugBundle.metadata.importLogCount}</span>
              <span className="text-[10px] text-[var(--ivory-text-3)]">Import Logs</span>
            </div>
          </div>
          <div className="text-[10px] text-[var(--ivory-success)] flex items-center gap-1 mb-2">
            <Shield size={10} /> All secrets redacted — safe to share
          </div>
          <pre className="text-[10px] text-[var(--ivory-text-3)] bg-[var(--ivory-surface)] p-3 rounded-[var(--radius-md)] border border-[var(--ivory-border)] max-h-40 overflow-y-auto whitespace-pre-wrap break-all">
            {JSON.stringify(debugBundle, null, 2).slice(0, 4000)}
            {JSON.stringify(debugBundle).length > 4000 && '\n... (truncated)'}
          </pre>
        </div>
      )}

      {/* Clear Confirmation Modal */}
      {clearConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setClearConfirm(null)}>
          <div className="bg-[var(--ivory-bg)] rounded-[var(--radius-lg)] border border-[var(--ivory-border)] shadow-xl w-full max-w-sm mx-4 p-6"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold display-text mb-2">Clear Logs?</h3>
            <p className="text-sm text-[var(--ivory-text-2)] mb-4">
              {clearConfirm === 'app' && 'Delete all app log entries? This cannot be undone.'}
              {clearConfirm === 'tool' && 'Delete all tool call logs? This cannot be undone.'}
              {clearConfirm === 'import' && 'Delete all import logs? This cannot be undone.'}
            </p>
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setClearConfirm(null)}>Cancel</Button>
              <Button variant="ghost" size="sm" onClick={() => handleClearLogs('tool')}><Trash2 size={14} /> Tool Logs</Button>
              <Button variant="ghost" size="sm" onClick={() => handleClearLogs('import')}><Trash2 size={14} /> Import Logs</Button>
              <Button size="sm" onClick={() => handleClearLogs(clearConfirm)}>
                <Trash2 size={14} /> Clear
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Security footer */}
      <div className="px-6 py-2 border-t border-[var(--ivory-border)] bg-[var(--ivory-bg)] flex items-center gap-2 text-[10px] text-[var(--ivory-text-3)]">
        <Shield size={10} className="text-[var(--ivory-success)]" />
        <span>All log entries are sanitized — API keys, tokens, and secrets are redacted before storage.</span>
      </div>
    </div>
  )
}

function tryParseJSON(str: string): unknown {
  try { return JSON.parse(str) } catch { return str }
}
