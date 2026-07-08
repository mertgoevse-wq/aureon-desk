import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Code2, FileText, Image, Video, Music,
  FileSearch, MonitorPlay, Plug, Workflow, ChevronRight,
  Sparkles, ShieldCheck, AlertTriangle, Info, ArrowRight,
  Eye, Lightbulb, Zap, FolderCheck
} from 'lucide-react'
import { useIpc } from '../hooks/useIpc'
import { TASK_CATEGORIES, AUTONOMY_LEVELS } from '@shared/types/studio-core'
import type { TaskCategoryInfo, StudioOrchestrationResult, AutonomyLevel } from '@shared/types/studio-core'
import { SafetyNotice } from '../components/vibe/SafetyNotice'

const TASK_ICONS: Record<string, React.ReactElement> = {
  LayoutDashboard: <LayoutDashboard size={22} />,
  Code2: <Code2 size={22} />,
  FileText: <FileText size={22} />,
  Image: <Image size={22} />,
  Video: <Video size={22} />,
  Music: <Music size={22} />,
  FileSearch: <FileSearch size={22} />,
  MonitorPlay: <MonitorPlay size={22} />,
  Plug: <Plug size={22} />,
  Workflow: <Workflow size={22} />,
}

const RISK_ICONS: Record<string, React.ReactElement | null> = {
  low: null,
  medium: <AlertTriangle size={11} className="text-amber-500" />,
  high: <AlertTriangle size={11} className="text-red-500" />,
}

const MODE_LABELS: Record<string, string> = {
  chat: 'Chat',
  cowork: 'Cowork',
  code: 'Code',
  studio: 'Studio',
}

export function Studio(): React.ReactElement {
  const navigate = useNavigate()
  const api = useIpc()
  const [selectedCard, setSelectedCard] = useState<string | null>(null)
  const [orchestration, setOrchestration] = useState<StudioOrchestrationResult | null>(null)
  const [autonomyLevel, setAutonomyLevel] = useState<AutonomyLevel>(2)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleCardClick = useCallback((card: TaskCategoryInfo) => {
    setSelectedCard(card.id)
    setOrchestration(null)
    setShowConfirm(false)

    // Orchestrate the task
    api.studioOrchestrate({
      userIntent: card.starterPrompt,
      selectedTaskType: card.id,
      selectedMode: card.recommendedMode,
      autonomyLevel,
    }).then((result: StudioOrchestrationResult) => {
      setOrchestration(result)

      // If confirmation is needed, show confirmation dialog
      if (result.requiresConfirmation && result.missingCapabilities.length === 0) {
        setShowConfirm(true)
      }
    }).catch(() => {
      // Reset selection on error so UI doesn't get stuck
      setSelectedCard(null)
      setOrchestration(null)
    })
  }, [api, autonomyLevel])

  const handleStartTask = useCallback(() => {
    if (!orchestration || !selectedCard) return
    const card = TASK_CATEGORIES.find(c => c.id === selectedCard)
    if (!card) return

    const mode = orchestration.recommendedMode
    let targetPath = '/'
    if (mode === 'code') targetPath = '/preview'
    else if (mode === 'cowork') targetPath = '/cowork'
    else if (orchestration.nextUIAction === 'open_connectors') targetPath = '/settings/connectors'
    else targetPath = '/'

    navigate(targetPath)

    // Insert starter prompt into composer after navigation
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('composer-insert', {
        detail: { text: card.starterPrompt, mode: 'replace' }
      }))
    }, 150)
  }, [orchestration, selectedCard, navigate])

  return (
    <div className="h-full overflow-y-auto bg-[var(--ivory-bg)]" data-testid="studio-page">
      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* === HERO === */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="w-14 h-14 rounded-2xl bg-[var(--ivory-accent-light)] flex items-center justify-center shadow-[var(--shadow-sm)]">
              <Sparkles size={26} className="text-[var(--ivory-accent)]" />
            </div>
          </div>
          <h1 className="text-[28px] font-bold tracking-tight text-[var(--ivory-text)] display-text mb-2">
            What would you like to do?
          </h1>
          <p className="text-[13px] text-[var(--ivory-text-3)] max-w-md mx-auto leading-relaxed">
            Choose a task below. Aureon will route you to the right workspace,
            suggest the best model, and never execute dangerous actions without approval.
          </p>

          {/* Autonomy indicator */}
          <div className="inline-flex items-center gap-1.5 mt-4 px-3 py-1.5 rounded-full bg-[var(--ivory-surface)] border border-[var(--ivory-border)]/50 text-[11px] font-medium text-[var(--ivory-text-2)]">
            <ShieldCheck size={12} className="text-[var(--ivory-accent)]" />
            {AUTONOMY_LEVELS[autonomyLevel].label}: {AUTONOMY_LEVELS[autonomyLevel].description}
          </div>
        </div>

        <SafetyNotice type="general" />

        {/* === TASK CARDS GRID === */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TASK_CATEGORIES.map(card => {
            const isSelected = selectedCard === card.id
            const isOrchestrating = isSelected && !orchestration
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => handleCardClick(card)}
                disabled={isOrchestrating}
                data-testid={`studio-card-${card.id}`}
                className={`group relative flex items-start gap-3.5 p-4 rounded-2xl border text-left transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/30
                  ${isSelected
                    ? 'border-[var(--ivory-accent)]/25 bg-[var(--ivory-accent-light)] shadow-[var(--shadow-md)]'
                    : 'border-[var(--ivory-border)]/60 bg-[var(--ivory-elevated)] hover:border-[var(--ivory-accent)]/20 hover:shadow-[var(--shadow-md)]'
                  }
                  ${isOrchestrating ? 'opacity-70 pointer-events-none' : ''}`}
              >
                {/* Icon */}
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105
                  ${isSelected ? 'bg-[var(--ivory-accent)]/15 text-[var(--ivory-accent)]' : 'bg-[var(--ivory-accent-light)] text-[var(--ivory-accent)]'}
                `}>
                  {TASK_ICONS[card.icon] || <Sparkles size={22} />}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] font-semibold text-[var(--ivory-text)]">{card.label}</span>
                    {RISK_ICONS[card.riskLevel]}
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--ivory-surface-2)] text-[var(--ivory-text-3)] font-medium">
                      {MODE_LABELS[card.recommendedMode]} mode
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--ivory-text-3)] mt-1 leading-relaxed">
                    {card.description}
                  </p>

                  {/* Orchestration result inline */}
                  {isSelected && orchestration && !showConfirm && (
                    <div className="mt-3 space-y-2 animate-fade-in">
                      {/* Safety warnings */}
                      {orchestration.safetyWarnings.map((warning, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-[10px] text-[var(--ivory-text-2)] bg-white/60 rounded-lg p-2">
                          <Info size={11} className="shrink-0 mt-0.5 text-[var(--ivory-accent)]" />
                          {warning}
                        </div>
                      ))}

                      {/* Missing capabilities */}
                      {orchestration.missingCapabilities.length > 0 && (
                        <div className="text-[10px] text-amber-600 bg-amber-50 rounded-lg p-2">
                          ⚠️ Missing capabilities. Go to{' '}
                          <button onClick={() => navigate('/settings/connectors')}
                            className="underline font-semibold hover:text-amber-700">
                            Connectors
                          </button>{' '}
                          to set up:{' '}
                          {orchestration.missingCapabilities.map(c => c.replace(/_/g, ' ')).join(', ')}
                        </div>
                      )}

                      {/* Planned steps */}
                      <div className="text-[10px] text-[var(--ivory-text-2)] space-y-0.5">
                        {orchestration.plannedSteps.map((step, i) => (
                          <div key={i} className="flex items-start gap-1.5">
                            <ArrowRight size={10} className="shrink-0 mt-0.5 text-[var(--ivory-accent)]" />
                            {step}
                          </div>
                        ))}
                      </div>

                      {/* Start button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStartTask()
                        }}
                        className="inline-flex items-center gap-1.5 mt-1 h-8 px-4 rounded-xl bg-[var(--ivory-accent)] text-white text-[11px] font-semibold hover:bg-[var(--ivory-accent-hover)] transition-colors shadow-[var(--shadow-sm)]"
                      >
                        Start <ChevronRight size={12} />
                      </button>
                    </div>
                  )}

                  {/* Hover hint */}
                  {!isSelected && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-[var(--ivory-accent)] font-semibold mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      Learn more <ChevronRight size={10} />
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* === AUTONOMY SELECTOR === */}
        <div className="mt-8">
          <h2 className="text-[13px] font-bold text-[var(--ivory-text)] flex items-center gap-2 mb-3">
            <ShieldCheck size={14} className="text-[var(--ivory-accent)]" />
            Autonomy Level
          </h2>
          <div className="grid grid-cols-5 gap-1.5">
            {AUTONOMY_LEVELS.map(level => {
              const isCurrent = autonomyLevel === level.level
              const IconComponent = (() => {
                switch (level.icon) {
                  case 'Eye': return <Eye size={14} />
                  case 'Lightbulb': return <Lightbulb size={14} />
                  case 'ShieldCheck': return <ShieldCheck size={14} />
                  case 'FolderCheck': return <FolderCheck size={14} />
                  case 'Zap': return <Zap size={14} />
                  default: return <ShieldCheck size={14} />
                }
              })()
              return (
                <button
                  key={level.level}
                  type="button"
                  onClick={() => setAutonomyLevel(level.level)}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/30
                    ${isCurrent
                      ? 'border-[var(--ivory-accent)]/30 bg-[var(--ivory-accent-light)] shadow-[var(--shadow-sm)]'
                      : 'border-[var(--ivory-border)]/60 bg-[var(--ivory-bg)] hover:border-[var(--ivory-accent)]/20'
                    }`}
                  data-testid={`autonomy-level-${level.level}`}
                >
                  <span className={isCurrent ? 'text-[var(--ivory-accent)]' : 'text-[var(--ivory-text-3)]'}>
                    {IconComponent}
                  </span>
                  <span className="text-[10px] font-bold text-[var(--ivory-text)]">{level.level}</span>
                  <span className="text-[9px] text-[var(--ivory-text-3)] leading-tight">{level.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* === SAFETY NOTICE === */}
        <div className="mt-8 p-4 rounded-2xl border border-[var(--ivory-border)]/60 bg-[var(--ivory-elevated)]">
          <div className="flex items-start gap-2.5">
            <ShieldCheck size={16} className="shrink-0 mt-0.5 text-[var(--ivory-accent)]" />
            <div>
              <h3 className="text-[12px] font-bold text-[var(--ivory-text)]">Safety First</h3>
              <p className="text-[11px] text-[var(--ivory-text-3)] mt-0.5 leading-relaxed">
                Every destructive or account action requires explicit confirmation.
                No shell commands, file writes, Gmail actions, or account changes execute without your approval.
                Your files are never sent to remote providers unless you explicitly attach them.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
