import React, { useEffect, useRef } from 'react'
import {
  PanelRightClose, PanelRightOpen, Brain, Target, Shield,
  Users, Wrench, AlertTriangle, Info, Zap, ChevronRight, FolderOpen, BookOpen
} from 'lucide-react'
import { useUIStore } from '../stores/uiStore'
import { useRoutingStore } from '../stores/routingStore'
import { useProjectStore } from '../stores/projectStore'
import { Badge } from '../components/shared/Badge'
import type { ProjectRow } from '@shared/types/project'

export function RightInspector(): React.ReactElement {
  const { inspectorOpen, toggleInspector, inspectorWidth, setInspectorWidth } = useUIStore()
  const { currentAnalysis, isLoading, error } = useRoutingStore()
  const { activeProject } = useProjectStore()
  const resizeRef = useRef<{ startX: number; startWidth: number } | null>(null)

  // Drag resize handler
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizeRef.current) return
      const delta = resizeRef.current.startX - e.clientX
      setInspectorWidth(resizeRef.current.startWidth + delta)
    }
    const handleMouseUp = () => {
      resizeRef.current = null
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [setInspectorWidth])

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    resizeRef.current = { startX: e.clientX, startWidth: inspectorWidth }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  if (!inspectorOpen) {
    return (
      <div className="flex flex-col items-center w-10 h-full border-l border-[var(--ivory-border)] bg-[var(--ivory-surface)] py-3 shrink-0">
        <button
          onClick={toggleInspector}
          className="p-1.5 rounded-[var(--radius-md)] text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)] transition-colors"
          title="Open Inspector"
          data-testid="inspector-toggle"
        >
          <PanelRightOpen size={16} />
        </button>
      </div>
    )
  }

  return (
    <div className="flex h-full shrink-0 relative">
      {/* Drag resize handle (left edge) */}
      <div
        className="absolute top-0 left-0 w-1 h-full cursor-col-resize hover:bg-[var(--ivory-accent)]/30 transition-colors z-10"
        onMouseDown={handleResizeStart}
      />

      <div
        className="flex flex-col h-full border-l border-[var(--ivory-border)] bg-[var(--ivory-surface)]"
        style={{ width: inspectorWidth }}
        data-testid="router-panel"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--ivory-border)]/40">
          <div className="flex items-center gap-1.5">
            <Brain size={12} className="text-[var(--ivory-text-3)]" />
            <h2 className="text-[11px] font-semibold text-[var(--ivory-text-2)] uppercase tracking-[0.04em]">
              Inspector
            </h2>
          </div>
          <button
            onClick={toggleInspector}
            className="p-1.5 rounded-lg text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)] transition-colors"
            aria-label="Close inspector"
          >
            <PanelRightClose size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <p className="text-xs text-[var(--ivory-text-3)] animate-pulse-subtle">Analyzing prompt…</p>
            </div>
          ) : error ? (
            <div className="px-4">
              <div className="p-3 rounded-lg bg-[var(--ivory-error-bg)] border border-[var(--ivory-error)]/15">
                <p className="text-xs text-[var(--ivory-error)]">{error}</p>
              </div>
            </div>
          ) : !currentAnalysis ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-5">
              <div className="w-8 h-8 rounded-lg bg-[var(--ivory-surface-2)]/50 flex items-center justify-center mb-2.5">
                <Brain size={14} className="text-[var(--ivory-text-3)]" strokeWidth={1.5} />
              </div>
              <p className="text-xs text-[var(--ivory-text-3)] max-w-[200px] leading-relaxed">
                Send a message to see intent analysis, agent routing, and risk assessment.
              </p>
              <ProjectContextSection project={activeProject} />
            </div>
          ) : (
            <div className="px-3 space-y-2">
              <AnalysisView analysis={currentAnalysis} />
              <ProjectContextSection project={activeProject} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ProjectContextSection({ project }: { project: ProjectRow | null }): React.ReactElement | null {
  if (!project) return null

  return (
    <div className="mt-3">
      <Section icon={<FolderOpen size={12} />} title="Project Context" defaultOpen={true}>
        <div className="space-y-2 text-xs pt-1.5">
          <div className="flex items-center gap-1.5">
            <FolderOpen size={12} className="text-[var(--ivory-text-3)]" />
            <span className="font-semibold text-[var(--ivory-text)]">{project.name}</span>
          </div>
          {project.description && (
            <p className="text-[11px] text-[var(--ivory-text-3)] leading-relaxed">{project.description}</p>
          )}
          {project.instructions ? (
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <BookOpen size={10} className="text-[var(--ivory-text-3)]" />
                <span className="text-[10px] text-[var(--ivory-text-3)] font-medium">Instructions active</span>
              </div>
              <pre className="text-[10px] text-[var(--ivory-text-2)] bg-[var(--ivory-bg)] p-2 rounded-[var(--radius-sm)] border border-[var(--ivory-border)] max-h-24 overflow-y-auto whitespace-pre-wrap break-all leading-normal font-mono">
                {project.instructions.slice(0, 300)}{project.instructions.length > 300 ? '...' : ''}
              </pre>
            </div>
          ) : (
            <p className="text-[10px] text-[var(--ivory-text-3)] italic">No project instructions set.</p>
          )}
          {project.root_path ? (
            <div className="text-[10px] text-[var(--ivory-text-3)] break-all font-mono leading-normal bg-[var(--ivory-bg)] p-1.5 rounded-lg border border-[var(--ivory-border)]/40 mt-1">
              📁 {project.root_path}
            </div>
          ) : (
            <p className="text-[10px] text-[var(--ivory-text-3)] italic">No local folder selected.</p>
          )}
        </div>
      </Section>
    </div>
  )
}

function AnalysisView({ analysis }: { analysis: NonNullable<ReturnType<typeof useRoutingStore.getState>['currentAnalysis']> }): React.ReactElement {
  const { analysis: pa, routing } = analysis

  const riskColors: Record<string, string> = {
    low: 'bg-[var(--ivory-success-bg)] text-[var(--ivory-success)]',
    medium: 'bg-[var(--ivory-warning-bg)] text-[var(--ivory-warning)]',
    high: 'bg-orange-50 text-orange-700',
    destructive: 'bg-[var(--ivory-error-bg)] text-[var(--ivory-error)]',
  }

  const intentColors: Record<string, string> = {
    coding: 'text-blue-600',
    debugging: 'text-red-600',
    writing: 'text-green-600',
    planning: 'text-purple-600',
    research: 'text-indigo-600',
    data_analysis: 'text-cyan-600',
    file_operation: 'text-teal-600',
    github_operation: 'text-orange-600',
    terminal_operation: 'text-amber-600',
    design_request: 'text-pink-600',
    general_chat: 'text-gray-600',
    security_review: 'text-rose-600',
  }

  const intentLabel: Record<string, string> = {
    coding: 'Coding', debugging: 'Debugging', writing: 'Writing',
    planning: 'Planning', research: 'Research', data_analysis: 'Data Analysis',
    file_operation: 'File Operation', github_operation: 'GitHub',
    terminal_operation: 'Terminal', design_request: 'Design',
    general_chat: 'General', security_review: 'Security',
  }

  return (
    <div className="space-y-2.5 text-xs">
      <Section icon={<Target size={12} />} title="Intent" collapsible defaultOpen={true}>
        <div className="flex items-center gap-2">
          <span className={`font-semibold text-sm ${intentColors[pa.intent] || ''}`}>
            {intentLabel[pa.intent] || pa.intent}
          </span>
          <span className="text-[10px] text-[var(--ivory-text-3)]">
            {Math.round(pa.confidence * 100)}% confidence
          </span>
        </div>
        {pa.alternativeIntents.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {pa.alternativeIntents.map(ai => (
              <Badge key={ai} variant="default" size="sm">{intentLabel[ai] || ai}</Badge>
            ))}
          </div>
        )}
      </Section>

      <Section icon={<Users size={12} />} title="Primary Agent">
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-[var(--ivory-text)]">{routing.primaryAgent.name}</span>
          {routing.primaryAgent.isDestructive && (
            <AlertTriangle size={10} className="text-[var(--ivory-error)]" />
          )}
        </div>
        <p className="text-[10px] text-[var(--ivory-text-3)] mt-0.5">
          {routing.primaryAgent.description}
        </p>
      </Section>

      {routing.supportingAgents.length > 0 && (
        <Section icon={<Users size={12} />} title="Supporting Agents">
          {routing.supportingAgents.map(agent => (
            <div key={agent.id} className="flex items-center gap-1.5 py-0.5">
              <ChevronRight size={10} className="text-[var(--ivory-text-3)]" />
              <span className="text-[var(--ivory-text-2)]">{agent.name}</span>
            </div>
          ))}
        </Section>
      )}

      <Section icon={<Shield size={12} />} title="Risk Assessment">
        <span className={`px-2 py-0.5 rounded-[var(--radius-sm)] text-[10px] font-medium ${riskColors[pa.riskLevel] || ''}`}>
          {pa.riskLevel.toUpperCase()}
        </span>
        {routing.riskWarnings.length > 0 && (
          <div className="mt-1.5 space-y-1">
            {routing.riskWarnings.map((w, i) => (
              <div key={i} className="flex items-start gap-1 text-[10px] text-[var(--ivory-text-2)]">
                <Info size={10} className="mt-0.5 shrink-0 text-[var(--ivory-warning)]" />
                <span>{w}</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {routing.selectedSkills.length > 0 && (
        <Section icon={<Zap size={12} />} title="Selected Skills">
          <div className="flex flex-wrap gap-1">
            {routing.selectedSkills.map(skill => (
              <Badge key={skill.id} variant="default" size="sm">{skill.name}</Badge>
            ))}
          </div>
        </Section>
      )}

      {routing.suggestedTools && routing.suggestedTools.length > 0 && (
        <Section icon={<Wrench size={12} />} title="Suggested Tools">
          <div className="space-y-1">
            {routing.suggestedTools.map(tool => (
              <div key={tool.id} className="flex items-center gap-1.5 text-[11px]">
                <Zap size={10} className="text-[var(--ivory-accent)]" />
                <span className="text-[var(--ivory-text)]">{tool.name}</span>
              </div>
            ))}
          </div>
          <p className="text-[9px] text-[var(--ivory-text-3)] mt-1">
            Tools are suggested but not auto-executed. Review in the Tools panel.
          </p>
        </Section>
      )}

      {pa.requiredPermissions.length > 0 && (
        <Section icon={<Shield size={12} />} title="Required Permissions">
          <div className="flex flex-wrap gap-1">
            {pa.requiredPermissions.map(perm => (
              <Badge
                key={perm}
                variant={perm.includes('delete') || perm.includes('push') ? 'error' : 'default'}
                size="sm"
              >
                {perm.replace(/_/g, ' ')}
              </Badge>
            ))}
          </div>
        </Section>
      )}

      {routing.subagentPlan && (
        <Section icon={<Wrench size={12} />} title="Execution Plan">
          <p className="text-[10px] text-[var(--ivory-text-3)] mb-2">
            {routing.subagentPlan.summary}
          </p>
          <div className="space-y-2">
            {routing.subagentPlan.steps.map((step, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded-[var(--radius-sm)] bg-[var(--ivory-bg)] border border-[var(--ivory-border)]">
                <span className="text-[10px] font-mono font-bold text-[var(--ivory-accent)] shrink-0 mt-0.5">
                  {step.order}
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-[var(--ivory-text)]">{step.agentName}</p>
                  <p className="text-[10px] text-[var(--ivory-text-3)]">{step.description}</p>
                  {step.requiresConfirmation && (
                    <span className="inline-block mt-1 text-[9px] text-[var(--ivory-error)]">⚠️ Requires confirmation</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {routing.requiresConfirmation && (
        <div className="p-2 rounded-[var(--radius-sm)] bg-[var(--ivory-error-bg)] border border-[var(--ivory-error)]/20">
          <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--ivory-error)]">
            <AlertTriangle size={12} />
            Confirmation Required
          </div>
          <p className="text-[10px] text-[var(--ivory-error)]/80 mt-0.5">
            This operation requires your confirmation before execution.
          </p>
        </div>
      )}

      {pa.detectedKeywords.length > 0 && (
        <Section icon={<Target size={12} />} title="Detected Keywords" defaultOpen={false}>
          <div className="flex flex-wrap gap-1">
            {pa.detectedKeywords.slice(0, 15).map(kw => (
              <span key={kw} className="text-[10px] px-1.5 py-0.5 rounded-[var(--radius-sm)] bg-[var(--ivory-bg)] text-[var(--ivory-text-3)]">
                {kw}
              </span>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}

interface SectionProps {
  icon: React.ReactElement
  title: string
  children: React.ReactNode
  collapsible?: boolean
  defaultOpen?: boolean
}

function Section({
  icon, title, children, collapsible = true, defaultOpen = false
}: SectionProps): React.ReactElement {
  const [open, setOpen] = React.useState(defaultOpen)
  return (
    <div className="rounded-lg bg-[var(--ivory-elevated)]/40 border border-[var(--ivory-border)]/20 overflow-hidden">
      <button
        onClick={() => collapsible && setOpen(!open)}
        className={`flex items-center justify-between px-2.5 py-1.5 text-[10px] font-medium text-[var(--ivory-text-3)] w-full text-left transition-colors cursor-pointer
          ${collapsible ? 'hover:text-[var(--ivory-text-2)] hover:bg-[var(--ivory-surface)]/50' : ''}`}
      >
        <div className="flex items-center gap-1.5">
          <span className="text-[var(--ivory-text-3)] shrink-0">
            {icon}
          </span>
          <span className="uppercase tracking-[0.05em] text-[10px]">{title}</span>
        </div>
        {collapsible && (
          <ChevronRight
            size={10}
            className={`text-[var(--ivory-text-3)] transition-transform duration-[var(--transition-fast)]
              ${open ? 'rotate-90' : ''}`}
          />
        )}
      </button>
      {open && <div className="px-2.5 pb-2 pt-0.5 border-t border-[var(--ivory-border)]/15 animate-fade-in">{children}</div>}
    </div>
  )
}
