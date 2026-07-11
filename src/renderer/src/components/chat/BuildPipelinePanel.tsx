import React from 'react'
import {
  Monitor,
  FolderOpen,
  FileCode,
  FilePlus,
  FilePen,
  FileMinus,
  FileSymlink,
  FolderPlus,
  GitCompare,
  Terminal,
  AlertTriangle,
  Play,
  Square,
  RefreshCw,
  ExternalLink,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  FileText
} from 'lucide-react'
import { Button } from '../shared/Button'
import type { BuildPipelineStatus, FileOperation, BuildStep, FollowUpSuggestion } from '@shared/types/build-pipeline'

export type ArtifactTab = 'preview' | 'files' | 'diff' | 'code' | 'logs' | 'diagnostics'

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

export interface BuildPipelinePanelProps {
  pipelineRunning: boolean
  pipelineStatus: BuildPipelineStatus | null
  pipelineSteps: BuildStep[]
  pipelineFileOps: FileOperation[]
  pipelinePlan: string[]
  pipelinePrompt: string | null
  streamingText: string | null
  isStreaming: boolean
  generatingModelLabel: string | null
  followUpSuggestions: FollowUpSuggestion[]
  activeTab: ArtifactTab
  selectedFile: FileOperation | null
  onTabChange: (tab: ArtifactTab) => void
  onFileSelect: (file: FileOperation) => void
  onCancel: () => void
  onFollowUp: (suggestion: FollowUpSuggestion) => void
  // Extended props
  status: PreviewStatus
  showDeveloper: boolean
  setShowDeveloper: (show: boolean) => void
  onRestart: () => void
  error: string | null
  setError: (err: string | null) => void
  autoPreviewStyleRef: React.MutableRefObject<string | null>
  handleRunDemo: (style?: string) => Promise<void>
  handleCreateSandbox: () => Promise<void>
  briefText: string
  setBriefText: (text: string) => void
  templateType: string
  creating: boolean
}

export function BuildPipelinePanel(props: BuildPipelinePanelProps): React.ReactElement {
  const {
    pipelineRunning, pipelineStatus, pipelineSteps, pipelineFileOps,
    pipelinePrompt, streamingText, isStreaming, generatingModelLabel,
    followUpSuggestions, activeTab, selectedFile,
    onTabChange, onFileSelect, onCancel, onFollowUp,
    status, showDeveloper, setShowDeveloper, onRestart,
    error, setError, autoPreviewStyleRef, handleRunDemo,
    handleCreateSandbox, briefText, setBriefText, templateType,
    creating
  } = props

  const hasSandbox = !!status.sandboxPath
  const isRunning = status.status === 'running' || status.status === 'starting'

  return (
    <div className="flex flex-col h-full bg-[var(--ivory-bg)]" data-testid="build-pipeline-panel">
      {/* Tab bar */}
      <div className="flex items-center gap-1 px-4 pt-2.5 pb-0 border-b border-[var(--ivory-border)] bg-[var(--ivory-surface)] shrink-0">
        {([
          { id: 'preview' as const, label: 'Preview', icon: <Monitor size={13} /> },
          { id: 'files' as const, label: 'Files', icon: <FolderOpen size={13} /> },
          { id: 'diff' as const, label: 'Diff', icon: <GitCompare size={13} /> },
          { id: 'code' as const, label: 'Code', icon: <FileCode size={13} /> },
          { id: 'logs' as const, label: 'Logs', icon: <Terminal size={13} /> },
          { id: 'diagnostics' as const, label: 'Diagnostics', icon: <AlertTriangle size={13} /> },
        ]).map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-[12px] font-semibold transition-colors cursor-pointer border-b-2 ${
              activeTab === tab.id
                ? 'text-[var(--ivory-accent)] border-[var(--ivory-accent)] bg-[var(--ivory-bg)]/50'
                : 'text-[var(--ivory-text-3)] border-transparent hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface)]/50'
            }`}
            data-testid={`build-tab-${tab.id}`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}

        {pipelineRunning && (
          <button
            type="button"
            onClick={onCancel}
            className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[12px] font-semibold text-[var(--ivory-error)] hover:bg-[var(--ivory-error-bg)] transition-colors cursor-pointer"
            data-testid="build-cancel-btn"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Main Tab content container */}
      <div className="flex-1 overflow-y-auto p-5 bg-[#eef1f4] min-h-0">
        
        {/* === PREVIEW TAB === */}
        <div style={{ display: activeTab === 'preview' ? 'block' : 'none' }}>
          {/* Error Panel if compile/start failed */}
          {(error || status.error) && (
            <div className="p-5 bg-red-50/70 border border-red-200 rounded-[24px] space-y-4 shadow-[var(--shadow-sm)] mb-4" data-testid="preview-error-panel">
              <div className="flex gap-3 items-start">
                <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={20} />
                <div className="space-y-1.5 flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-red-950">Live Preview Failed to Start</h4>
                  <p className="text-[11px] leading-relaxed text-red-800 break-words font-mono bg-red-100/50 p-2.5 rounded-xl border border-red-200/40 select-text">
                    {error || status.error}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap items-center">
                <button
                  type="button"
                  onClick={() => {
                    setError(null)
                    const isDemo = status.templateType === 'demo' || autoPreviewStyleRef.current
                    if (isDemo) {
                      const style = autoPreviewStyleRef.current || 'Calming Ivory'
                      handleRunDemo(style)
                    } else {
                      handleCreateSandbox()
                    }
                  }}
                  className="inline-flex h-8 items-center justify-center px-4 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-[var(--shadow-xs)] transition-colors cursor-pointer"
                >
                  Retry Start
                </button>
                <button
                  type="button"
                  onClick={() => onTabChange('logs')}
                  className="inline-flex h-8 items-center justify-center px-3.5 text-xs font-bold bg-white border border-red-200/60 hover:bg-red-50 text-red-900 rounded-xl transition-colors cursor-pointer"
                >
                  Open Logs
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const diagnostic = `Error: ${error || status.error}\nStatus: ${status.status}\nPort: ${status.port}\nTemplate: ${status.templateType}\nSandbox: ${status.sandboxPath}`
                    navigator.clipboard.writeText(diagnostic)
                  }}
                  className="inline-flex h-8 items-center justify-center px-3.5 text-xs font-bold bg-white border border-red-200/60 hover:bg-red-50 text-red-900 rounded-xl transition-colors cursor-pointer"
                >
                  Copy Diagnostics
                </button>
              </div>
            </div>
          )}

          {/* Embedded Interactive Iframe Sandbox */}
          {(status.status === 'running' || status.status === 'starting') && status.url ? (
            <div className="rounded-[18px] border border-slate-200 overflow-hidden bg-white shadow-[var(--shadow-md)] min-h-[420px] relative">
              <div className="h-9 bg-slate-100 border-b border-slate-200 flex items-center gap-2 px-3">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <span className="ml-2 flex-1 h-5 rounded-full bg-white border border-slate-200 px-3 text-[10px] text-slate-500 font-mono flex items-center truncate">
                  {status.url}
                </span>
              </div>
              <div className="h-[380px] relative bg-white">
                {status.status === 'starting' && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 gap-3">
                    <Loader2 className="animate-spin text-[var(--ivory-accent)]" size={24} />
                    <span className="text-xs text-[var(--ivory-text-2)] font-semibold animate-pulse">Starting preview server...</span>
                  </div>
                )}
                <iframe
                  key={status.id || undefined}
                  src={status.url}
                  title="Vibeforge Live Sandbox Preview"
                  className="w-full h-full border-none bg-white"
                  sandbox="allow-scripts allow-forms allow-modals allow-popups allow-same-origin"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          ) : !error && !status.error ? (
            <div className="rounded-[18px] border border-slate-200 bg-white shadow-[var(--shadow-sm)] min-h-[420px] p-8 flex flex-col items-center justify-center gap-6 text-center max-w-xl mx-auto">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                <Monitor size={24} />
              </div>
              <div className="space-y-2">
                <h3 className="text-[16px] font-bold text-slate-800">What would you like to build?</h3>
                <p className="text-[12px] text-slate-500 max-w-sm">
                  Describe your idea, then click Build with Preview.
                </p>
              </div>

              {/* Textarea for typing the prompt */}
              <div className="w-full space-y-3">
                <textarea
                  value={briefText}
                  onChange={e => setBriefText(e.target.value)}
                  placeholder="Describe the app or widget to preview..."
                  className="w-full h-24 p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[var(--ivory-accent)] resize-none transition-colors"
                />
                
                {/* Example prompt */}
                <button
                  type="button"
                  onClick={() => setBriefText("Build a tiny counter app with ivory theme, increment button, reset button, and live preview.")}
                  className="text-[11px] text-left text-slate-600 hover:text-[var(--ivory-accent)] bg-slate-50 hover:bg-slate-100 px-3 py-2 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors w-full flex items-center gap-2"
                >
                  <span className="font-semibold text-[var(--ivory-accent)] shrink-0">Try Example:</span>
                  <span className="truncate">"Build a tiny counter app with ivory theme..."</span>
                </button>
              </div>

              <Button
                onClick={handleCreateSandbox}
                disabled={creating || (templateType !== 'demo' && !briefText.trim())}
                data-testid="preview-create-btn"
                className="w-full justify-center py-2.5 font-bold rounded-xl"
              >
                <Play size={13} className="mr-1.5" />
                {creating ? 'Building...' : 'Build with Preview'}
              </Button>
            </div>
          ) : null}
        </div>

        {/* === FILES TAB === */}
        {activeTab === 'files' && (
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <FilesTab pipelineFileOps={pipelineFileOps} onFileSelect={(file) => { onFileSelect(file); onTabChange('diff') }} />
          </div>
        )}

        {/* === DIFF TAB === */}
        {activeTab === 'diff' && (
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <DiffTab pipelineFileOps={pipelineFileOps} selectedFile={selectedFile} onFileSelect={onFileSelect} />
          </div>
        )}

        {/* === CODE TAB === */}
        {activeTab === 'code' && (
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <CodeTab 
              pipelineFileOps={pipelineFileOps} 
              selectedFile={selectedFile} 
              onFileSelect={onFileSelect}
              pipelineRunning={pipelineRunning}
              pipelineSteps={pipelineSteps}
              isStreaming={isStreaming}
              streamingText={streamingText}
              generatingModelLabel={generatingModelLabel}
            />
          </div>
        )}

        {/* === LOGS TAB === */}
        <div 
          data-testid="preview-log-panel" 
          style={{ display: activeTab === 'logs' ? 'block' : 'none' }}
          className="rounded-[20px] border border-[var(--ivory-border)] bg-[var(--ivory-elevated)] overflow-hidden shadow-[var(--shadow-xs)] bg-white"
        >
          <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--ivory-border)] bg-[var(--ivory-surface)] select-none">
            <Terminal size={12} className="text-[var(--ivory-text-3)]" />
            <span className="text-xs font-semibold text-[var(--ivory-text-2)]">Server Logs Console</span>
            <span className="text-[10px] text-[var(--ivory-text-3)] ml-auto font-medium">
              {status.logs.length} entries
            </span>
          </div>
          <div className="max-h-80 overflow-y-auto font-mono text-[11px] bg-slate-900 text-slate-200 p-4 space-y-1.5 rounded-b-[20px]">
            {status.logs.length === 0 ? (
              <p className="text-slate-400 italic text-center py-4">Console idle. Start sandbox execution to stream server logs.</p>
            ) : (
              status.logs.map((entry, i) => (
                <div key={i} className={`flex gap-2.5 items-start ${entry.stream === 'stderr' ? 'text-red-400 bg-red-950/20 px-2 py-0.5 rounded' : 'text-slate-300'}`}>
                  <span className="text-slate-500 shrink-0 select-none">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="break-all whitespace-pre-wrap">{entry.text.trim()}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* === DIAGNOSTICS TAB === */}
        <div style={{ display: activeTab === 'diagnostics' ? 'block' : 'none' }} className="space-y-4 bg-white p-5 rounded-xl border border-slate-200">
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider text-[11px]">System Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="border border-slate-100 rounded-lg p-3 bg-slate-50">
                <span className="font-bold text-slate-500 block mb-1">URL</span>
                {status.url ? (
                  <a href={status.url} target="_blank" rel="noreferrer" className="text-[var(--ivory-accent)] hover:underline font-mono break-all" data-testid="diagnostics-url">
                    {status.url}
                  </a>
                ) : (
                  <span className="text-slate-400 italic" data-testid="diagnostics-url">none</span>
                )}
              </div>
              <div className="border border-slate-100 rounded-lg p-3 bg-slate-50">
                <span className="font-bold text-slate-500 block mb-1">Status</span>
                <span className="font-semibold uppercase text-slate-700" data-testid="diagnostics-status">{status.status}</span>
              </div>
              <div className="border border-slate-100 rounded-lg p-3 bg-slate-50">
                <span className="font-bold text-slate-500 block mb-1">Port</span>
                <span className="font-mono text-slate-700">{status.port || 'none'}</span>
              </div>
              <div className="border border-slate-100 rounded-lg p-3 bg-slate-50">
                <span className="font-bold text-slate-500 block mb-1">Template</span>
                <span className="font-mono text-slate-700">{status.templateType || 'none'}</span>
              </div>
            </div>
          </div>

          {/* Advanced/Developer Toggle Section */}
          {showDeveloper && (
            <div className="border-t border-slate-100 pt-4 mt-4 space-y-4">
              <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider">Advanced Developer Controls</h4>
              
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg space-y-3">
                {status.sandboxPath && (
                  <div>
                    <span className="font-bold text-slate-600 text-xs block mb-1">Sandbox Path:</span>
                    <span className="font-mono text-xs text-slate-800 break-all select-text">{status.sandboxPath}</span>
                  </div>
                )}
                
                <div className="flex gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={onRestart}
                    disabled={!status.url}
                    className="inline-flex h-8 items-center px-3.5 text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg transition disabled:opacity-50 cursor-pointer"
                    data-testid="diagnostics-restart-btn"
                  >
                    Restart Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const diagnosticText = `Preview URL: ${status.url || 'none'}\nStatus: ${status.status}\nPort: ${status.port || 'none'}\nTemplate: ${status.templateType || 'none'}\nSandbox: ${status.sandboxPath || 'none'}\nError: ${status.error || 'none'}`
                      navigator.clipboard.writeText(diagnosticText)
                    }}
                    className="inline-flex h-8 items-center px-3.5 text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg transition cursor-pointer"
                    data-testid="diagnostics-copy-btn"
                  >
                    Copy Diagnostics
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRunDemo()}
                    className="inline-flex h-8 items-center px-3.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition cursor-pointer"
                  >
                    Run Coding Demo App
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Suggestions & Plan steps showing during builds */}
        {followUpSuggestions.length > 0 && !pipelineRunning && (
          <div className="mt-4 p-4 bg-white rounded-xl border border-slate-200" data-testid="followup-suggestions">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ivory-text-3)] flex items-center gap-1.5 mb-2">
              <Sparkles size={11} className="text-[var(--ivory-accent)]" />
              Follow-up suggestions
            </span>
            <div className="flex flex-wrap gap-1.5">
              {followUpSuggestions.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onFollowUp(s)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-[var(--ivory-border)] bg-[var(--ivory-elevated)] text-[12px] font-medium text-[var(--ivory-text-2)] hover:text-[var(--ivory-accent)] hover:border-[var(--ivory-accent)]/25 transition cursor-pointer"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

// ── Tab Content Subcomponents ──────────────────────────────────────

function FilesTab({ pipelineFileOps, onFileSelect }: {
  pipelineFileOps: FileOperation[]
  onFileSelect: (file: FileOperation) => void
}): React.ReactElement {
  return (
    <div className="space-y-1.5" data-testid="build-files-tab">
      {pipelineFileOps.length === 0 ? (
        <p className="text-[12px] text-[var(--ivory-text-3)] italic text-center py-6">No files generated yet.</p>
      ) : (
        pipelineFileOps.map(op => {
          const OpIcon = op.type === 'create_file' ? FilePlus
            : op.type === 'update_file' ? FilePen
            : op.type === 'delete_file' ? FileMinus
            : op.type === 'rename_file' ? FileSymlink
            : op.type === 'mkdir' ? FolderPlus
            : FileText
          const opColor = op.type === 'create_file' ? 'text-emerald-600'
            : op.type === 'update_file' ? 'text-amber-600'
            : op.type === 'delete_file' ? 'text-red-600'
            : op.type === 'rename_file' ? 'text-purple-600'
            : op.type === 'mkdir' ? 'text-blue-600'
            : 'text-[var(--ivory-text-3)]'
          const opBg = op.type === 'create_file' ? 'bg-emerald-50 border-emerald-200'
            : op.type === 'update_file' ? 'bg-amber-50 border-amber-200'
            : op.type === 'delete_file' ? 'bg-red-50 border-red-200'
            : op.type === 'rename_file' ? 'bg-purple-50 border-purple-200'
            : op.type === 'mkdir' ? 'bg-blue-50 border-blue-200'
            : 'bg-[var(--ivory-elevated)] border-[var(--ivory-border)]/40'
          const typeBadge = op.type === 'create_file' ? 'bg-emerald-100 text-emerald-700'
            : op.type === 'update_file' ? 'bg-amber-100 text-amber-700'
            : op.type === 'delete_file' ? 'bg-red-100 text-red-700'
            : op.type === 'rename_file' ? 'bg-purple-100 text-purple-700'
            : op.type === 'mkdir' ? 'bg-blue-100 text-blue-700'
            : 'bg-[var(--ivory-surface)] text-[var(--ivory-text-3)]'
          return (
            <div key={op.id} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border ${opBg}`}>
              <OpIcon size={14} className={`${opColor} shrink-0`} />
              <div className="min-w-0 flex-1">
                <span className="text-[12px] font-mono text-[var(--ivory-text-2)] block truncate">{op.path}</span>
                <span className="text-[10px] text-[var(--ivory-text-3)]">
                  {op.language}
                  {op.oldPath && <span className="ml-1 opacity-70">← {op.oldPath}</span>}
                </span>
              </div>
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${typeBadge}`}>
                {op.type === 'create_file' ? 'CREATE'
                  : op.type === 'update_file' ? 'UPDATE'
                  : op.type === 'delete_file' ? 'DELETE'
                  : op.type === 'rename_file' ? 'RENAME'
                  : op.type === 'mkdir' ? 'MKDIR'
                  : 'FILE'}
              </span>
              <button type="button" onClick={() => onFileSelect(op)}
                className="text-[10px] font-semibold text-[var(--ivory-accent)] hover:underline cursor-pointer shrink-0">
                View file
              </button>
            </div>
          )
        })
      )}
    </div>
  )
}

function DiffTab({ pipelineFileOps, selectedFile, onFileSelect }: {
  pipelineFileOps: FileOperation[]
  selectedFile: FileOperation | null
  onFileSelect: (file: FileOperation) => void
}): React.ReactElement {
  return (
    <div className="space-y-3" data-testid="build-diff-tab">
      {pipelineFileOps.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {pipelineFileOps.map(op => (
            <button key={op.id} type="button" onClick={() => onFileSelect(op)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold transition-colors cursor-pointer ${(selectedFile ? selectedFile.id : null) === op.id
                ? 'bg-[var(--ivory-accent-light)] text-[var(--ivory-accent)] border border-[var(--ivory-accent)]/30'
                : 'bg-[var(--ivory-surface)] text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] border border-transparent'
              }`}>{op.path}</button>
          ))}
        </div>
      )}
      {selectedFile && selectedFile.diff ? (
        <div className="rounded-xl border border-[var(--ivory-border)] overflow-hidden font-mono text-[11px] bg-[var(--ivory-elevated)]">
          <div className="px-3 py-2 border-b border-[var(--ivory-border)] bg-[var(--ivory-surface)] text-[11px] font-semibold text-[var(--ivory-text-2)] flex items-center gap-2">
            <FileCode size={12} className="text-[var(--ivory-text-3)]" />{selectedFile.path}
          </div>
          <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
            {selectedFile.diff.map((line, i) => (
              <div key={i} className={`flex items-start gap-2 px-3 py-0.5 leading-relaxed ${line.type === 'add' ? 'bg-green-50/60 text-green-800' : line.type === 'remove' ? 'bg-red-50/60 text-red-800' : 'text-[var(--ivory-text-2)]'}`}>
                <span className="shrink-0 w-4 text-center select-none opacity-50">{line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '}</span>
                <span className="break-all whitespace-pre-wrap">{line.content || ' '}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-[12px] text-[var(--ivory-text-3)] italic text-center py-6">Select a file to view its diff.</p>
      )}
    </div>
  )
}

interface CodeTabProps {
  pipelineFileOps: FileOperation[]
  selectedFile: FileOperation | null
  onFileSelect: (file: FileOperation) => void
  pipelineRunning: boolean
  pipelineSteps: BuildStep[]
  isStreaming: boolean
  streamingText: string | null
  generatingModelLabel: string | null
}

function CodeTab(props: CodeTabProps): React.ReactElement {
  const { 
    pipelineFileOps, selectedFile, onFileSelect, 
    pipelineRunning, pipelineSteps, isStreaming, streamingText, generatingModelLabel 
  } = props

  // Auto-select first file if none is selected
  React.useEffect(() => {
    if (!selectedFile && pipelineFileOps.length > 0) {
      const firstFile = pipelineFileOps.find(op => op.type !== 'mkdir')
      if (firstFile) {
        onFileSelect(firstFile)
      }
    }
  }, [pipelineFileOps, selectedFile, onFileSelect])

  return (
    <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-4 min-h-[380px]" data-testid="build-code-tab">
      
      {/* Left side: Build progress + File Tree */}
      <div className="border-r border-slate-100 pr-4 space-y-4 max-h-[380px] overflow-y-auto">
        {pipelineRunning && (
          <div className="space-y-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Build Steps
            </span>
            <div className="space-y-1">
              {pipelineSteps.map((step, i) => (
                <div key={i} className="flex items-start gap-1.5 text-[11px]">
                  <span className="mt-0.5 shrink-0">
                    {step.status === 'running' && <Loader2 size={10} className="text-[var(--ivory-accent)] animate-spin" />}
                    {step.status === 'done' && <CheckCircle size={10} className="text-green-600" />}
                    {step.status === 'error' && <XCircle size={10} className="text-red-600" />}
                    {step.status === 'skipped' && <Clock size={10} className="text-[var(--ivory-text-3)]" />}
                    {step.status === 'pending' && <div className="w-2.5 h-2.5 rounded-full border border-slate-300" />}
                  </span>
                  <span className="truncate max-w-[180px] text-slate-700">{step.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Workspace Files
          </span>
          {pipelineFileOps.length === 0 ? (
            <p className="text-[11px] text-slate-400 italic">No files generated.</p>
          ) : (
            <div className="space-y-1">
              {pipelineFileOps.map(op => {
                const isSelected = selectedFile?.id === op.id
                return (
                  <button
                    key={op.id}
                    type="button"
                    onClick={() => onFileSelect(op)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono truncate transition-colors cursor-pointer block
                      ${isSelected 
                        ? 'bg-[var(--ivory-active-bg)] text-[var(--ivory-text)] font-semibold border border-[var(--ivory-border)]' 
                        : 'text-[var(--ivory-text-2)] hover:bg-[var(--ivory-surface)]'}`}
                  >
                    {op.path.split('/').pop() || op.path}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right side: Formatted Code / Streaming */}
      <div className="min-w-0 flex flex-col h-full">
        {isStreaming && streamingText && (
          <div className="mb-3 p-3 bg-amber-50 border border-amber-100 rounded-xl space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ivory-accent)] flex items-center gap-1.5">
                <Sparkles size={10} /> AI Generating
              </span>
              {generatingModelLabel && (
                <span className="text-[10px] text-slate-500 font-medium">
                  with {generatingModelLabel}
                </span>
              )}
            </div>
            <pre className="text-[10px] font-mono text-slate-700 leading-relaxed max-h-[120px] overflow-y-auto whitespace-pre-wrap break-words">
              {streamingText}
            </pre>
          </div>
        )}

        {selectedFile ? (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between pb-2">
              <span className="text-[11px] font-mono text-slate-600 truncate font-semibold">
                {selectedFile.path}
              </span>
              <span className="text-[9px] font-semibold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                {selectedFile.language || 'text'}
              </span>
            </div>
            <pre className="text-[11px] font-mono text-slate-800 leading-relaxed bg-slate-50 rounded-xl p-4 border border-slate-200 overflow-auto max-h-[320px] whitespace-pre select-text flex-1">
              {selectedFile.afterContent || selectedFile.beforeContent || '// File empty'}
            </pre>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center border border-dashed border-slate-200 rounded-xl p-6 min-h-[200px]">
            <p className="text-[12px] text-slate-400 italic">Select a file to view code</p>
          </div>
        )}
      </div>
    </div>
  )
}
