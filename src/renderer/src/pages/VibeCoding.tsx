import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles, ChevronRight, ChevronLeft, Zap, Send, Monitor, Play,
  ShieldCheck, Lightbulb, Hammer, Wrench, Palette, Plus,
  BookOpen, KeyRound, Globe, Gamepad2, LayoutDashboard,
  FilePlus, FolderOpen, Map, FileCode, Eye, Bug, Package, Github,
  Smartphone, Trash2, Shield, CheckCircle, Star
} from 'lucide-react'
import { ONBOARDING_CARDS, GUIDED_BUILDER_STEPS, buildGuidedPrompt } from '@shared/vibe-templates'
import type { VibeTemplate } from '@shared/vibe-templates'
import { BeginnerHelp } from '../components/vibe/BeginnerHelp'
import { SafetyNotice } from '../components/vibe/SafetyNotice'

const LUCIDE_ICONS: Record<string, React.ReactElement> = {
  Wrench: <Wrench size={18} />,
  Palette: <Palette size={18} />,
  Plus: <Plus size={18} />,
  BookOpen: <BookOpen size={18} />,
  Monitor: <Monitor size={18} />,
  KeyRound: <KeyRound size={18} />,
  Github: <Github size={18} />,
  Eye: <Eye size={18} />,
  Lightbulb: <Lightbulb size={18} />,
  Package: <Package size={18} />,
  Shield: <Shield size={18} />,
  Trash2: <Trash2 size={18} />,
  Globe: <Globe size={16} />,
  Gamepad2: <Gamepad2 size={16} />,
  Smartphone: <Smartphone size={16} />,
  LayoutDashboard: <LayoutDashboard size={16} />,
  FilePlus: <FilePlus size={16} />,
  FolderOpen: <FolderOpen size={16} />,
  Map: <Map size={16} />,
  FileCode: <FileCode size={16} />,
  Bug: <Bug size={16} />,
  Play: <Play size={16} />,
}

const SMALL_ICONS: Record<string, React.ReactElement> = {
  Globe: <Globe size={14} />,
  Monitor: <Monitor size={14} />,
  Smartphone: <Smartphone size={14} />,
  Gamepad2: <Gamepad2 size={14} />,
  LayoutDashboard: <LayoutDashboard size={14} />,
  Sparkles: <Sparkles size={14} />,
  Lightbulb: <Lightbulb size={14} />,
}

const PROJECT_TYPES = [
  { id: 'website', label: 'Website', icon: 'Globe', desc: 'HTML, CSS, and JavaScript web pages' },
  { id: 'desktop-app', label: 'Desktop App', icon: 'Monitor', desc: 'Electron + React desktop apps' },
  { id: 'android-app', label: 'Android App', icon: 'Smartphone', desc: 'Simple Android applications' },
  { id: 'mini-game', label: 'Mini-Game', icon: 'Gamepad2', desc: 'Puzzle, clicker, quiz games' },
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', desc: 'Charts, stats, and data views' },
  { id: 'ai-tool', label: 'AI Tool', icon: 'Sparkles', desc: 'Chatbot, analyzer, or generator' },
]

const QUICK_ACTIONS = [
  { id: 'fix-error', label: 'Fix an error', icon: 'Wrench', desc: 'Debug your code', color: 'amber' },
  { id: 'improve-ui', label: 'Improve UI', icon: 'Palette', desc: 'Polish the design', color: 'purple' },
  { id: 'add-feature', label: 'Add feature', icon: 'Plus', desc: 'Extend your app', color: 'green' },
  { id: 'explain-code', label: 'Explain code', icon: 'BookOpen', desc: 'Understand any code', color: 'blue' },
  { id: 'create-preview', label: 'Live Preview', icon: 'Eye', desc: 'See it running', color: 'teal' },
  { id: 'package-windows', label: 'Package app', icon: 'Package', desc: 'Create .exe', color: 'slate' },
]

export function VibeCoding(): React.ReactElement {
  const navigate = useNavigate()

  const [view, setView] = useState<'onboarding' | 'guided' | 'learn'>('onboarding')
  const [step, setStep] = useState(0)
  const [selections, setSelections] = useState<Record<string, string>>({})
  const [builtPrompt, setBuiltPrompt] = useState<string | null>(null)

  const handleCardClick = useCallback((card: VibeTemplate) => {
    if (card.openInCode) {
      navigate('/preview')
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('composer-insert', {
          detail: { text: card.prompt, mode: 'replace' }
        }))
      }, 150)
    } else {
      navigate('/')
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('composer-insert', {
          detail: { text: card.prompt, mode: 'replace' }
        }))
      }, 150)
    }
  }, [navigate])

  const handleProjectTypeClick = useCallback((typeId: string) => {
    const card = ONBOARDING_CARDS.find(c =>
      c.id.includes(typeId) || (typeId === 'website' && c.id === 'build-website') ||
      (typeId === 'desktop-app' && c.id === 'build-desktop-app') ||
      (typeId === 'mini-game' && c.id === 'build-mini-game') ||
      (typeId === 'android-app' && c.id === 'build-android-app')
    )
    if (card) {
      handleCardClick(card)
    } else {
      navigate('/')
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('composer-insert', {
          detail: { text: `I want to build a ${typeId}. Help me plan and create it step by step. I'm a beginner so please explain everything.`, mode: 'replace' }
        }))
      }, 150)
    }
  }, [navigate, handleCardClick])

  const handleQuickAction = useCallback((actionId: string) => {
    const card = ONBOARDING_CARDS.find(c => c.id === actionId)
    if (card) {
      handleCardClick(card)
    }
  }, [handleCardClick])

  const handleGuidedSelect = useCallback((optionId: string) => {
    const currentStep = GUIDED_BUILDER_STEPS[step]
    const nextSelections = { ...selections, [currentStep.id]: optionId }
    setSelections(nextSelections)
    if (step < GUIDED_BUILDER_STEPS.length - 1) {
      setStep(step + 1)
    } else {
      setBuiltPrompt(buildGuidedPrompt(nextSelections))
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

  const handleEnterCodeMode = () => {
    if (!builtPrompt) return
    navigate('/preview')
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('composer-insert', {
        detail: { text: builtPrompt, mode: 'replace' }
      }))
    }, 150)
  }

  const handleReset = () => {
    setStep(0)
    setSelections({})
    setBuiltPrompt(null)
  }

  return (
    <div className="h-full overflow-y-auto bg-[var(--ivory-bg)]" data-testid="vibe-coding-page">
      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* === HERO === */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center mb-5">
            <div className="w-16 h-16 rounded-2xl bg-[var(--ivory-accent-light)] flex items-center justify-center shadow-[var(--shadow-sm)]">
              <Sparkles size={30} className="text-[var(--ivory-accent)]" />
            </div>
          </div>
          <h1 className="text-[32px] font-bold tracking-tight text-[var(--ivory-text)] display-text mb-2">
            What do you want to build?
          </h1>
          <p className="text-[14px] text-[var(--ivory-text-3)] max-w-lg mx-auto leading-relaxed">
            Describe your idea and Aureon helps you build it — no coding experience needed.
            Click any card below to start.
          </p>

          {/* View tabs */}
          <div className="inline-flex items-center gap-1 mt-5 p-1 rounded-2xl bg-[var(--ivory-surface)] border border-[var(--ivory-border)]/50">
            <button onClick={() => { setView('onboarding'); handleReset() }}
              className={`px-4 py-2 rounded-xl text-[12px] font-semibold transition-all ${
                view === 'onboarding'
                  ? 'bg-[var(--ivory-elevated)] text-[var(--ivory-text)] shadow-[var(--shadow-sm)]'
                  : 'text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)]'
              }`}>
              <Sparkles size={13} className="inline mr-1.5 text-[var(--ivory-accent)]" />
              Quick Start
            </button>
            <button onClick={() => { setView('guided'); handleReset() }}
              className={`px-4 py-2 rounded-xl text-[12px] font-semibold transition-all ${
                view === 'guided'
                  ? 'bg-[var(--ivory-elevated)] text-[var(--ivory-text)] shadow-[var(--shadow-sm)]'
                  : 'text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)]'
              }`}>
              <Map size={13} className="inline mr-1.5 text-[var(--ivory-accent)]" />
              Guided Builder
            </button>
            <button onClick={() => setView('learn')}
              className={`px-4 py-2 rounded-xl text-[12px] font-semibold transition-all ${
                view === 'learn'
                  ? 'bg-[var(--ivory-elevated)] text-[var(--ivory-text)] shadow-[var(--shadow-sm)]'
                  : 'text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)]'
              }`}>
              <BookOpen size={13} className="inline mr-1.5 text-[var(--ivory-accent)]" />
              Learn
            </button>
          </div>
        </div>

        {/* === QUICK START VIEW === */}
        {view === 'onboarding' && (
          <div className="space-y-8">
            <SafetyNotice type="general" />

            {/* Project Type Cards */}
            <section>
              <h2 className="text-[15px] font-bold text-[var(--ivory-text)] flex items-center gap-2 mb-4">
                <Star size={15} className="text-[var(--ivory-accent)]" />
                Choose a project type
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {PROJECT_TYPES.map(type => (
                  <button key={type.id} type="button" onClick={() => handleProjectTypeClick(type.id)}
                    data-testid={`vibe-project-${type.id}`}
                    className="group flex items-start gap-3 p-4 rounded-2xl bg-[var(--ivory-elevated)] border border-[var(--ivory-border)]/60 hover:border-[var(--ivory-accent)]/25 hover:shadow-[var(--shadow-md)] transition-all duration-150 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/30">
                    <div className="w-10 h-10 rounded-xl bg-[var(--ivory-accent-light)] flex items-center justify-center shrink-0 text-[var(--ivory-accent)] group-hover:scale-105 transition-transform">
                      {SMALL_ICONS[type.icon] || <Lightbulb size={14} />}
                    </div>
                    <div className="min-w-0">
                      <span className="block text-[13px] font-semibold text-[var(--ivory-text)]">{type.label}</span>
                      <span className="block text-[11px] text-[var(--ivory-text-3)] mt-0.5 leading-relaxed">{type.desc}</span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-[var(--ivory-accent)] font-semibold mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        Start building <ChevronRight size={10} />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Quick Actions */}
            <section>
              <h2 className="text-[15px] font-bold text-[var(--ivory-text)] flex items-center gap-2 mb-4">
                <Zap size={15} className="text-[var(--ivory-accent)]" />
                Quick actions
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {QUICK_ACTIONS.map(action => (
                  <button key={action.id} type="button" onClick={() => handleQuickAction(action.id)}
                    data-testid={`vibe-action-${action.id}`}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-[var(--ivory-elevated)] border border-[var(--ivory-border)]/60 hover:border-[var(--ivory-accent)]/20 hover:shadow-[var(--shadow-sm)] transition-all duration-150 text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/30">
                    <div className="w-9 h-9 rounded-xl bg-[var(--ivory-accent-light)] flex items-center justify-center text-[var(--ivory-accent)]">
                      {LUCIDE_ICONS[action.icon] || <Lightbulb size={16} />}
                    </div>
                    <span className="text-[11px] font-semibold text-[var(--ivory-text)] leading-tight">{action.label}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* All Template Cards */}
            <section>
              <h2 className="text-[15px] font-bold text-[var(--ivory-text)] flex items-center gap-2 mb-4">
                <BookOpen size={15} className="text-[var(--ivory-accent)]" />
                All templates
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ONBOARDING_CARDS.filter(c => !QUICK_ACTIONS.some(q => q.id === c.id) && !PROJECT_TYPES.some(p =>
                  (p.id === 'website' && c.id === 'build-website') ||
                  (p.id === 'desktop-app' && c.id === 'build-desktop-app') ||
                  (p.id === 'mini-game' && c.id === 'build-mini-game') ||
                  (p.id === 'android-app' && c.id === 'build-android-app')
                )).map(card => (
                  <button key={card.id} type="button" onClick={() => handleCardClick(card)}
                    data-testid={`vibe-card-${card.id}`}
                    className="group flex items-start gap-3 p-4 rounded-2xl bg-[var(--ivory-elevated)] border border-[var(--ivory-border)]/60 hover:border-[var(--ivory-accent)]/20 hover:shadow-[var(--shadow-md)] transition-all duration-150 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/30">
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
                      <p className="text-[11px] text-[var(--ivory-text-3)] mt-0.5 leading-relaxed">{card.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* === GUIDED BUILDER VIEW === */}
        {view === 'guided' && (
          <div className="space-y-6 max-w-2xl mx-auto">
            <SafetyNotice type="general" />

            {!builtPrompt ? (
              <>
                {/* Progress bar */}
                <div className="flex items-center gap-1" data-testid="guided-progress">
                  {GUIDED_BUILDER_STEPS.map((s, i) => (
                    <div key={s.id} className="flex-1">
                      <div className={`h-1.5 rounded-full transition-colors ${
                        i < step ? 'bg-[var(--ivory-accent)]' :
                        i === step ? 'bg-[var(--ivory-accent)]/60' :
                        'bg-[var(--ivory-border)]'
                      }`} />
                      <p className="text-[10px] text-[var(--ivory-text-3)] mt-1 text-center font-medium">{s.label.split(' ').slice(0, 2).join(' ')}</p>
                    </div>
                  ))}
                </div>

                {/* Current step */}
                <div className="rounded-2xl border border-[var(--ivory-border)]/60 bg-[var(--ivory-elevated)] p-6 shadow-[var(--shadow-md)]" data-testid="guided-step">
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--ivory-text-3)] mb-1">
                    Step {step + 1} of {GUIDED_BUILDER_STEPS.length}
                  </p>
                  <h2 className="text-[22px] font-semibold text-[var(--ivory-text)] display-text mb-1">
                    {GUIDED_BUILDER_STEPS[step].label}
                  </h2>
                  <p className="text-[12px] text-[var(--ivory-text-3)] mb-5">
                    {GUIDED_BUILDER_STEPS[step].description}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {GUIDED_BUILDER_STEPS[step].options.map(option => {
                      const isSelected = selections[GUIDED_BUILDER_STEPS[step].id] === option.id
                      return (
                        <button key={option.id} type="button" onClick={() => handleGuidedSelect(option.id)}
                          data-testid={`guided-option-${option.id}`}
                          className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/30 ${
                            isSelected
                              ? 'border-[var(--ivory-accent)]/30 bg-[var(--ivory-accent-light)] shadow-[var(--shadow-sm)]'
                              : 'border-[var(--ivory-border)]/60 bg-[var(--ivory-bg)] hover:border-[var(--ivory-accent)]/20 hover:bg-[var(--ivory-surface)]'
                          }`}>
                          <span className="text-[var(--ivory-accent)] shrink-0">
                            {LUCIDE_ICONS[option.icon || ''] || <Lightbulb size={16} />}
                          </span>
                          <div className="min-w-0">
                            <span className="block text-[13px] font-semibold text-[var(--ivory-text)]">{option.label}</span>
                            <span className="block text-[10px] text-[var(--ivory-text-3)] mt-0.5">{option.description}</span>
                          </div>
                          {isSelected && <CheckCircle size={14} className="ml-auto text-[var(--ivory-accent)]" />}
                        </button>
                      )
                    })}
                  </div>

                  {step > 0 && (
                    <button onClick={() => setStep(step - 1)}
                      className="mt-4 inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] transition-colors">
                      <ChevronLeft size={12} /> Back
                    </button>
                  )}
                </div>
              </>
            ) : (
              /* Prompt built */
              <div className="space-y-4" data-testid="guided-result">
                <div className="rounded-2xl border border-[var(--ivory-accent)]/20 bg-[var(--ivory-accent-light)] p-5 shadow-[var(--shadow-sm)]">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle size={16} className="text-[var(--ivory-accent)]" />
                    <h3 className="text-[15px] font-bold text-[var(--ivory-text)]">Your Prompt is Ready!</h3>
                  </div>
                  <pre className="text-[12px] text-[var(--ivory-text-2)] whitespace-pre-wrap leading-relaxed font-sans bg-white/60 rounded-xl p-3 border border-[var(--ivory-border)]/40 max-h-52 overflow-y-auto">
                    {builtPrompt}
                  </pre>
                </div>

                <SafetyNotice type="remote_context" />

                <div className="flex flex-wrap gap-2.5">
                  <button onClick={handleUsePrompt} data-testid="guided-use-chat"
                    className="inline-flex items-center gap-1.5 h-11 px-5 rounded-xl bg-[var(--ivory-accent)] text-white text-[13px] font-semibold hover:bg-[var(--ivory-accent-hover)] transition-colors shadow-[var(--shadow-sm)]">
                    <Send size={14} /> Send to Chat
                  </button>
                  <button onClick={handleEnterCodeMode} data-testid="guided-use-code"
                    className="inline-flex items-center gap-1.5 h-11 px-5 rounded-xl bg-[var(--ivory-elevated)] border border-[var(--ivory-border)] text-[var(--ivory-text)] text-[13px] font-semibold hover:bg-[var(--ivory-surface)] transition-colors shadow-[var(--shadow-xs)]">
                    <Monitor size={14} /> Open in Code Mode
                  </button>
                  <button onClick={handleReset}
                    className="inline-flex items-center gap-1.5 h-11 px-5 rounded-xl text-[13px] font-semibold text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] transition-colors">
                    Start Over
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* === LEARN VIEW === */}
        {view === 'learn' && (
          <div className="space-y-6 max-w-2xl mx-auto">
            <SafetyNotice type="general" />
            <BeginnerHelp />
          </div>
        )}
      </div>
    </div>
  )
}
