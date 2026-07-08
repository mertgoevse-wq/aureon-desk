import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles, ChevronRight, ChevronLeft, Zap, Send, Monitor,
  Play, ShieldCheck, Lightbulb, Hammer, Wrench, Palette, Plus,
  BookOpen, KeyRound, Globe, Gamepad2, LayoutDashboard, GraduationCap,
  FilePlus, FolderOpen, Map, FileCode, Eye, Bug, Package, Github
} from 'lucide-react'
import { ONBOARDING_CARDS, GUIDED_BUILDER_STEPS, buildGuidedPrompt } from '@shared/vibe-templates'
import type { VibeTemplate } from '@shared/vibe-templates'
import { BeginnerHelp } from '../components/vibe/BeginnerHelp'
import { SafetyNotice } from '../components/vibe/SafetyNotice'
import { AureonMark } from '../components/shared/AureonMark'

const LUCIDE_ICONS: Record<string, React.ReactElement> = {
  Hammer: <Hammer size={18} />,
  Wrench: <Wrench size={18} />,
  Palette: <Palette size={18} />,
  Plus: <Plus size={18} />,
  BookOpen: <BookOpen size={18} />,
  Monitor: <Monitor size={18} />,
  KeyRound: <KeyRound size={18} />,
  Github: <Github size={18} />,
  Globe: <Globe size={16} />,
  Gamepad2: <Gamepad2 size={16} />,
  LayoutDashboard: <LayoutDashboard size={16} />,
  GraduationCap: <GraduationCap size={16} />,
  Lightbulb: <Lightbulb size={16} />,
  FilePlus: <FilePlus size={16} />,
  FolderOpen: <FolderOpen size={16} />,
  Map: <Map size={16} />,
  FileCode: <FileCode size={16} />,
  Eye: <Eye size={16} />,
  Bug: <Bug size={16} />,
  Package: <Package size={16} />,
}

export function VibeCoding(): React.ReactElement {
  const navigate = useNavigate()

  // View mode: 'onboarding' | 'guided' | 'help'
  const [view, setView] = useState<'onboarding' | 'guided' | 'help'>('onboarding')

  // Guided builder state
  const [step, setStep] = useState(0)
  const [selections, setSelections] = useState<Record<string, string>>({})
  const [builtPrompt, setBuiltPrompt] = useState<string | null>(null)

  const handleCardClick = useCallback((card: VibeTemplate) => {
    if (card.openInCode) {
      // Navigate to Code mode and insert prompt
      navigate('/preview')
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('composer-insert', {
          detail: { text: card.prompt, mode: 'replace' }
        }))
      }, 150)
    } else {
      // Insert prompt into chat composer
      navigate('/')
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('composer-insert', {
          detail: { text: card.prompt, mode: 'replace' }
        }))
      }, 150)
    }
  }, [navigate])

  const handleGuidedSelect = useCallback((optionId: string) => {
    const currentStep = GUIDED_BUILDER_STEPS[step]
    const nextSelections = { ...selections, [currentStep.id]: optionId }
    setSelections(nextSelections)

    if (step < GUIDED_BUILDER_STEPS.length - 1) {
      setStep(step + 1)
    } else {
      // All steps complete — build the prompt
      const prompt = buildGuidedPrompt(nextSelections)
      setBuiltPrompt(prompt)
    }
  }, [step, selections])

  const handleUsePrompt = useCallback(() => {
    if (!builtPrompt) return
    navigate('/')
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('composer-insert', {
        detail: { text: builtPrompt, mode: 'replace' }
      }))
    }, 150)
  }, [builtPrompt, navigate])

  const handleReset = () => {
    setStep(0)
    setSelections({})
    setBuiltPrompt(null)
  }

  const handleEnterCodeMode = () => {
    if (!builtPrompt) return
    navigate('/preview')
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('composer-insert', {
        detail: { text: builtPrompt, mode: 'replace' }
      }))
    }, 150)
  }

  return (
    <div className="h-full overflow-y-auto bg-[var(--ivory-bg)]" data-testid="vibe-coding-page">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <AureonMark size={36} />
            <div>
              <h1 className="text-[26px] font-semibold tracking-tight text-[var(--ivory-text)] display-text">
                Vibe Coding
              </h1>
              <p className="text-[13px] text-[var(--ivory-text-3)] mt-0.5">
                Build apps without writing code — describe what you want and Aureon helps you create it
              </p>
            </div>
          </div>

          {/* View switcher */}
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={() => { setView('onboarding'); handleReset() }}
              className={`px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-colors ${
                view === 'onboarding'
                  ? 'bg-[var(--ivory-accent-light)] text-[var(--ivory-accent)] border border-[var(--ivory-accent)]/20'
                  : 'text-[var(--ivory-text-2)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface)] border border-transparent'
              }`}
            >
              Quick Start
            </button>
            <button
              onClick={() => { setView('guided'); handleReset() }}
              className={`px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-colors ${
                view === 'guided'
                  ? 'bg-[var(--ivory-accent-light)] text-[var(--ivory-accent)] border border-[var(--ivory-accent)]/20'
                  : 'text-[var(--ivory-text-2)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface)] border border-transparent'
              }`}
            >
              Guided Builder
            </button>
            <button
              onClick={() => setView('help')}
              className={`px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-colors ${
                view === 'help'
                  ? 'bg-[var(--ivory-accent-light)] text-[var(--ivory-accent)] border border-[var(--ivory-accent)]/20'
                  : 'text-[var(--ivory-text-2)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface)] border border-transparent'
              }`}
            >
              Learn
            </button>
          </div>
        </div>

        {/* Quick Start View */}
        {view === 'onboarding' && (
          <div className="space-y-6">
            <SafetyNotice type="general" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ONBOARDING_CARDS.map(card => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => handleCardClick(card)}
                  data-testid={`vibe-card-${card.id}`}
                  className="group flex items-start gap-4 px-4 py-4 rounded-2xl bg-[var(--ivory-elevated)] border border-[var(--ivory-border)]/60 hover:border-[var(--ivory-accent)]/30 hover:shadow-[var(--shadow-md)] transition-all duration-150 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/30"
                >
                  <div className="w-10 h-10 rounded-xl bg-[var(--ivory-accent-light)] flex items-center justify-center shrink-0 text-[var(--ivory-accent)] group-hover:scale-105 transition-transform">
                    {LUCIDE_ICONS[card.icon] || <Lightbulb size={18} />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-[var(--ivory-text)]">{card.label}</span>
                      {card.openInCode && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--ivory-accent-light)] text-[var(--ivory-accent)] font-medium">Code mode</span>
                      )}
                    </div>
                    <p className="text-[11px] text-[var(--ivory-text-3)] mt-1 leading-relaxed">{card.description}</p>
                    <span className="inline-flex items-center gap-1 text-[10px] text-[var(--ivory-accent)] font-semibold mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      Click to start <ChevronRight size={10} />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Guided Builder View */}
        {view === 'guided' && (
          <div className="space-y-6">
            <SafetyNotice type="general" />

            {!builtPrompt ? (
              <>
                {/* Progress bar */}
                <div className="flex items-center gap-1" data-testid="guided-progress">
                  {GUIDED_BUILDER_STEPS.map((s, i) => (
                    <div key={s.id} className="flex items-center gap-1 flex-1">
                      <div className={`h-1.5 rounded-full flex-1 transition-colors ${
                        i < step ? 'bg-[var(--ivory-accent)]' :
                        i === step ? 'bg-[var(--ivory-accent)]/60' :
                        'bg-[var(--ivory-border)]'
                      }`} />
                    </div>
                  ))}
                </div>

                {/* Current step */}
                <div className="rounded-2xl border border-[var(--ivory-border)]/60 bg-[var(--ivory-elevated)] p-6 shadow-[var(--shadow-md)]" data-testid="guided-step">
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--ivory-text-3)] mb-1">
                    Step {step + 1} of {GUIDED_BUILDER_STEPS.length}
                  </p>
                  <h2 className="text-[18px] font-semibold text-[var(--ivory-text)] display-text mb-1">
                    {GUIDED_BUILDER_STEPS[step].label}
                  </h2>
                  <p className="text-[12px] text-[var(--ivory-text-3)] mb-4">
                    {GUIDED_BUILDER_STEPS[step].description}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {GUIDED_BUILDER_STEPS[step].options.map(option => {
                      const isSelected = selections[GUIDED_BUILDER_STEPS[step].id] === option.id
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => handleGuidedSelect(option.id)}
                          data-testid={`guided-option-${option.id}`}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/30 ${
                            isSelected
                              ? 'border-[var(--ivory-accent)]/30 bg-[var(--ivory-accent-light)] shadow-[var(--shadow-sm)]'
                              : 'border-[var(--ivory-border)]/60 bg-[var(--ivory-bg)] hover:border-[var(--ivory-accent)]/20 hover:bg-[var(--ivory-surface)]'
                          }`}
                        >
                          <span className="text-[var(--ivory-accent)] shrink-0">
                            {LUCIDE_ICONS[option.icon || ''] || <Lightbulb size={16} />}
                          </span>
                          <div className="min-w-0">
                            <span className="block text-[13px] font-semibold text-[var(--ivory-text)]">{option.label}</span>
                            <span className="block text-[10px] text-[var(--ivory-text-3)] mt-0.5">{option.description}</span>
                          </div>
                          {isSelected && <span className="ml-auto text-[10px] text-[var(--ivory-accent)] font-bold">✓</span>}
                        </button>
                      )
                    })}
                  </div>

                  {/* Back button */}
                  {step > 0 && (
                    <button
                      onClick={() => setStep(step - 1)}
                      className="mt-4 inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] transition-colors"
                    >
                      <ChevronLeft size={12} /> Back
                    </button>
                  )}
                </div>
              </>
            ) : (
              /* Prompt built — show result and action buttons */
              <div className="space-y-4" data-testid="guided-result">
                <div className="rounded-2xl border border-[var(--ivory-accent)]/20 bg-[var(--ivory-accent-light)] p-5 shadow-[var(--shadow-sm)]">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={15} className="text-[var(--ivory-accent)]" />
                    <h3 className="text-[14px] font-bold text-[var(--ivory-text)]">Your Prompt is Ready</h3>
                  </div>
                  <pre className="text-[12px] text-[var(--ivory-text-2)] whitespace-pre-wrap leading-relaxed font-sans bg-white/60 rounded-xl p-3 border border-[var(--ivory-border)]/40 max-h-48 overflow-y-auto">
                    {builtPrompt}
                  </pre>
                </div>

                <SafetyNotice type="remote_context" />

                <div className="flex flex-wrap gap-2.5">
                  <button
                    onClick={handleUsePrompt}
                    data-testid="guided-use-chat"
                    className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-[var(--ivory-accent)] text-white text-[12px] font-semibold hover:bg-[var(--ivory-accent-hover)] transition-colors shadow-[var(--shadow-sm)]"
                  >
                    <Send size={13} /> Send to Chat
                  </button>
                  <button
                    onClick={handleEnterCodeMode}
                    data-testid="guided-use-code"
                    className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-[var(--ivory-elevated)] border border-[var(--ivory-border)] text-[var(--ivory-text)] text-[12px] font-semibold hover:bg-[var(--ivory-surface)] transition-colors shadow-[var(--shadow-xs)]"
                  >
                    <Monitor size={13} /> Open in Code Mode
                  </button>
                  <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl text-[12px] font-semibold text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] transition-colors"
                  >
                    Start Over
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Help View */}
        {view === 'help' && (
          <div className="space-y-6">
            <SafetyNotice type="general" />
            <BeginnerHelp />
          </div>
        )}
      </div>
    </div>
  )
}
