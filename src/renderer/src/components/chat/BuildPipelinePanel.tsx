/**
 * BuildPipelinePanel — Extracted from LivePreview.tsx
 *
 * Renders the build pipeline activity tabs: Preview, Code, Files, Diff, Plan, Cards.
 * Includes cancel button, model selector, streaming preview, follow-up suggestions.
 */

import React, { useMemo } from 'react'
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
  ListChecks,
  Lightbulb,
  Layers3,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  FileText,
  Zap,
  X,
  Sparkles
} from 'lucide-react'
import { ModelSelector } from './ModelSelector'
import { ArtifactCard } from '../artifacts/ArtifactCard'
import type { ArtifactActionHandlers } from '../artifacts/ArtifactCard'
import { codeArtifactFromFileOp, buildPlanArtifact, diffArtifactFromDiff } from '@shared/artifacts'
import type { BuildPipelineStatus, FileOperation, BuildStep, FollowUpSuggestion } from '@shared/types/build-pipeline'

export type ArtifactTab = 'preview' | 'code' | 'files' | 'diff' | 'plan' | 'cards'

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
  selectedModelId: string | null
  followUpSuggestions: FollowUpSuggestion[]
  activeTab: ArtifactTab
  selectedFile: FileOperation | null
  onTabChange: (tab: ArtifactTab) => void
  onFileSelect: (file: FileOperation) => void
  onCancel: () => void
  onModelChange: (id: string | null) => void
  onFollowUp: (suggestion: FollowUpSuggestion) => void
}

export function BuildPipelinePanel(props: BuildPipelinePanelProps): React.ReactElement {
  const {
    pipelineRunning, pipelineStatus, pipelineSteps, pipelineFileOps, pipelinePlan,
    pipelinePrompt, streamingText, isStreaming, generatingModelLabel, selectedModelId,
    followUpSuggestions, activeTab, selectedFile,
    onTabChange, onFileSelect, onCancel, onModelChange, onFollowUp
  } = props

  const show = pipelineRunning || pipelineStatus || pipelineFileOps.length > 0
  if (!show) return <></>

  const artifactHandlers: ArtifactActionHandlers = useMemo(() => ({ onCopy: () => {} }), [])

  return (
    <div className="border-b border-[var(--ivory-border)] bg-[var(--ivory-elevated)] shrink-0" data-testid="build-pipeline-panel">
      {/* Tab bar */}
      <div className="flex items-center gap-1 px-4 pt-2.5 pb-0">
        {([
          { id: 'preview' as const, label: 'Preview', icon: <Monitor size={13} /> },
          { id: 'code' as const, label: 'Code', icon: <FileCode size={13} /> },
          { id: 'files' as const, label: 'Files', icon: <FolderOpen size={13} /> },
          { id: 'diff' as const, label: 'Diff', icon: <GitCompare size={13} /> },
          { id: 'plan' as const, label: 'Plan', icon: <ListChecks size={13} /> },
          { id: 'cards' as const, label: 'Cards', icon: <Layers3 size={13} /> },
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
            <X size={12} /> Cancel
          </button>
        )}

        {!pipelineRunning && (
          <div className="ml-auto mr-2">
            <ModelSelector value={selectedModelId} onChange={onModelChange} />
          </div>
        )}

        {pipelineStatus && pipelineStatus.isDeterministicDemo && (
          <span className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium text-[var(--ivory-text-3)] bg-[var(--ivory-surface)] border border-[var(--ivory-border)]">
            <Zap size={10} className="text-[var(--ivory-accent)]" />
            Local Demo
          </span>
        )}
      </div>

      {/* Tab content */}
      <div className="max-h-[420px] overflow-y-auto bg-[var(--ivory-bg)] p-4">
        {/* CODE tab */}
        {activeTab === 'code' && <CodeTab {...props} />}
        {/* FILES tab */}
        {activeTab === 'files' && <FilesTab pipelineFileOps={pipelineFileOps} onFileSelect={onFileSelect} />}
        {/* DIFF tab */}
        {activeTab === 'diff' && <DiffTab pipelineFileOps={pipelineFileOps} selectedFile={selectedFile} onFileSelect={onFileSelect} />}
        {/* PLAN tab */}
        {activeTab === 'plan' && <PlanTab pipelinePrompt={pipelinePrompt} pipelinePlan={pipelinePlan} pipelineSteps={pipelineSteps} />}
        {/* PREVIEW tab */}
        {activeTab === 'preview' && (
          <p className="text-[12px] text-[var(--ivory-text-3)] italic text-center py-6">Preview renders in the iframe below.</p>
        )}
        {/* CARDS tab */}
        {activeTab === 'cards' && (
          <CardsTab pipelinePrompt={pipelinePrompt} pipelinePlan={pipelinePlan} pipelineSteps={pipelineSteps}
            pipelineFileOps={pipelineFileOps} handlers={artifactHandlers} />
        )}
      </div>

      {/* Follow-up suggestions */}
      {followUpSuggestions.length > 0 && !pipelineRunning && (
        <div className="px-4 py-3 border-t border-[var(--ivory-border)] bg-[var(--ivory-surface)]/30" data-testid="followup-suggestions">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ivory-text-3)] flex items-center gap-1.5 mb-2">
            <Lightbulb size={11} className="text-[var(--ivory-accent)]" />
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
  )
}

// ── Tab Content Components ──────────────────────────────────────

function CodeTab(props: BuildPipelinePanelProps): React.ReactElement {
  const { pipelineRunning, pipelineSteps, pipelineFileOps, isStreaming, streamingText, generatingModelLabel } = props
  return (
    <div className="space-y-3" data-testid="build-code-tab">
      <div className="space-y-1.5">
        {pipelineSteps.map((step, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <div className="mt-0.5 shrink-0">
              {step.status === 'running' && <Loader2 size={13} className="text-[var(--ivory-accent)] animate-spin" />}
              {step.status === 'done' && <CheckCircle size={13} className="text-green-600" />}
              {step.status === 'error' && <XCircle size={13} className="text-red-600" />}
              {step.status === 'skipped' && <Clock size={13} className="text-[var(--ivory-text-3)]" />}
              {step.status === 'pending' && <div className="w-3 h-3 rounded-full border border-[var(--ivory-border)]" />}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[12px] font-medium text-[var(--ivory-text)]">{step.label}</span>
              {step.filePath && <span className="text-[11px] text-[var(--ivory-text-3)] font-mono ml-2">{step.filePath}</span>}
              {step.message && <p className="text-[11px] text-[var(--ivory-text-3)] mt-0.5">{step.message}</p>}
            </div>
          </div>
        ))}
        {pipelineRunning && !pipelineSteps.length && (
          <div className="flex items-center gap-2 text-[12px] text-[var(--ivory-text-3)]">
            <Loader2 size={13} className="animate-spin" /> Initializing pipeline...
          </div>
        )}
      </div>

      {isStreaming && streamingText && (
        <div className="mt-3 pt-3 border-t border-[var(--ivory-border)]/50 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ivory-accent)] flex items-center gap-1.5">
              <Sparkles size={10} /> AI Generating
            </span>
            {generatingModelLabel && (
              <span className="text-[10px] text-[var(--ivory-text-3)] font-medium flex items-center gap-1.5 max-w-[280px] min-w-0">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--ivory-accent)] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--ivory-accent)]" />
                </span>
                <span className="truncate">with {generatingModelLabel}</span>
              </span>
            )}
          </div>
          <div className="rounded-xl border border-[var(--ivory-accent)]/20 bg-[var(--ivory-elevated)] p-3 font-mono text-[11px] text-[var(--ivory-text-2)] leading-relaxed max-h-[280px] overflow-y-auto whitespace-pre-wrap break-all">
            {streamingText}
          </div>
        </div>
      )}

      {pipelineFileOps.length > 0 && (
        <div className="mt-3 pt-3 border-t border-[var(--ivory-border)]/50 space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ivory-text-3)]">Generated files</span>
          {pipelineFileOps.map(op => {
            const opIcon = op.type === 'create_file' ? <FilePlus size={12} className="text-emerald-600 shrink-0" />
              : op.type === 'update_file' ? <FilePen size={12} className="text-amber-600 shrink-0" />
              : op.type === 'delete_file' ? <FileMinus size={12} className="text-red-600 shrink-0" />
              : op.type === 'rename_file' ? <FileSymlink size={12} className="text-purple-600 shrink-0" />
              : op.type === 'mkdir' ? <FolderPlus size={12} className="text-blue-600 shrink-0" />
              : <FileText size={12} className="text-[var(--ivory-text-3)] shrink-0" />
            const opLabel = op.type === 'create_file' ? 'new'
              : op.type === 'update_file' ? 'edit'
              : op.type === 'delete_file' ? 'delete'
              : op.type === 'rename_file' ? 'rename'
              : op.type === 'mkdir' ? 'mkdir'
              : op.type
            return (
              <button
                key={op.id}
                type="button"
                onClick={() => { props.onFileSelect(op); props.onTabChange('diff') }}
                className="flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-left hover:bg-[var(--ivory-surface)] transition-colors cursor-pointer"
              >
                {opIcon}
                <span className="text-[12px] font-mono text-[var(--ivory-text-2)] truncate">{op.path}</span>
                {op.type !== 'create_file' && (
                  <span className={`text-[9px] font-semibold rounded-full px-1.5 py-0.5 ml-auto shrink-0 ${op.type === 'update_file' ? 'bg-amber-50 text-amber-700' : op.type === 'delete_file' ? 'bg-red-50 text-red-700' : op.type === 'rename_file' ? 'bg-purple-50 text-purple-700' : op.type === 'mkdir' ? 'bg-blue-50 text-blue-700' : 'bg-[var(--ivory-surface)] text-[var(--ivory-text-3)]'}`}>{opLabel}</span>
                )}
                <span className="text-[10px] text-[var(--ivory-text-3)] shrink-0">
                  {op.status === 'pending' && 'pending'}
                  {op.status === 'applied' && <span className="text-green-600">applied</span>}
                  {op.status === 'failed' && <span className="text-red-600">failed</span>}
                  {op.status === 'skipped' && <span className="text-[var(--ivory-text-3)]">unchanged</span>}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

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
                View diff
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

function PlanTab({ pipelinePrompt, pipelinePlan, pipelineSteps }: {
  pipelinePrompt: string | null
  pipelinePlan: string[]
  pipelineSteps: BuildStep[]
}): React.ReactElement {
  return (
    <div className="space-y-3" data-testid="build-plan-tab">
      {pipelinePrompt && (
        <div className="rounded-xl border border-[var(--ivory-border)] bg-[var(--ivory-elevated)] p-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ivory-text-3)] block mb-1.5">Prompt</span>
          <p className="text-[12px] text-[var(--ivory-text)] leading-relaxed">{pipelinePrompt}</p>
        </div>
      )}
      {pipelinePlan.length > 0 ? (
        <div className="rounded-xl border border-[var(--ivory-border)] bg-[var(--ivory-elevated)] p-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ivory-text-3)] block mb-2">Build Plan</span>
          <ul className="list-disc pl-4 text-[12px] text-[var(--ivory-text-2)] space-y-1">
            {pipelinePlan.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </div>
      ) : pipelineSteps.length > 0 ? (
        <div className="rounded-xl border border-[var(--ivory-border)] bg-[var(--ivory-elevated)] p-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ivory-text-3)] block mb-2">Steps</span>
          <ul className="list-disc pl-4 text-[12px] text-[var(--ivory-text-2)] space-y-1">
            {pipelineSteps.filter(s => s.label).map((step, i) => <li key={i}>{step.label}</li>)}
          </ul>
        </div>
      ) : (
        <p className="text-[12px] text-[var(--ivory-text-3)] italic text-center py-6">No plan generated yet.</p>
      )}
    </div>
  )
}

function CardsTab({ pipelinePrompt, pipelinePlan, pipelineSteps, pipelineFileOps, handlers }: {
  pipelinePrompt: string | null
  pipelinePlan: string[]
  pipelineSteps: BuildStep[]
  pipelineFileOps: FileOperation[]
  handlers: ArtifactActionHandlers
}): React.ReactElement {
  return (
    <div className="space-y-3" data-testid="build-cards-tab">
      {pipelinePrompt && (
        <ArtifactCard
          artifact={buildPlanArtifact(pipelinePrompt, pipelinePlan.length > 0 ? pipelinePlan : pipelineSteps.filter(s => s.label).map(s => s.label))}
          handlers={handlers}
        />
      )}
      {pipelineFileOps.map(op => (
        <ArtifactCard key={op.id} artifact={codeArtifactFromFileOp(op)} handlers={handlers} />
      ))}
      {pipelineFileOps.filter(op => op.diff && op.diff.length > 0).map(op => (
        <ArtifactCard key={`diff-${op.id}`} artifact={diffArtifactFromDiff(op.path, op.language, op.diff!)} handlers={handlers} />
      ))}
      {pipelineFileOps.length === 0 && (
        <p className="text-[12px] text-[var(--ivory-text-3)] italic text-center py-6">
          No artifacts generated yet. Start a build to see structured cards.
        </p>
      )}
    </div>
  )
}
