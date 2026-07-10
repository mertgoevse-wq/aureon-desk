/**
 * Vibeforge — First Run Wizard
 *
 * A 5-step onboarding modal shown on first launch (when vb_first_run_done is not set).
 * Can be re-triggered from Settings → General → "Restart onboarding".
 *
 * Steps:
 *   1. Welcome
 *   2. Choose your goal
 *   3. Connect a provider
 *   4. First build
 *   5. Navigation tour
 */

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles, MessageSquare, Hammer, Code2, Globe, KeyRound,
  Eye, Bot, Settings, ArrowRight, X, CheckCircle, Zap,
  ChevronLeft
} from 'lucide-react'
import { useUIStore } from '../../stores/uiStore'

type GoalId = 'chat' | 'build' | 'fix' | 'website' | 'provider'

const GOALS: { id: GoalId; icon: React.ReactNode; label: string; description: string }[] = [
  { id: 'chat', icon: <MessageSquare size={22} />, label: 'Chat with AI', description: 'Ask questions, explain code, or plan a project' },
  { id: 'build', icon: <Hammer size={22} />, label: 'Build an app', description: 'Describe what you want and see it appear live' },
  { id: 'fix', icon: <Code2 size={22} />, label: 'Fix my code', description: 'Paste an error and get a working fix instantly' },
  { id: 'website', icon: <Globe size={22} />, label: 'Create a website', description: 'Landing page, portfolio, or product site' },
  { id: 'provider', icon: <KeyRound size={22} />, label: 'Connect a provider', description: 'Add your OpenRouter, Anthropic, or OpenAI key' },
]

const NAV_TOUR: { icon: React.ReactNode; label: string; description: string }[] = [
  { icon: <Sparkles size={16} />, label: 'Studio', description: 'Main builder — describe and build' },
  { icon: <MessageSquare size={16} />, label: 'Chat', description: 'Conversation with your AI assistant' },
  { icon: <Eye size={16} />, label: 'Preview', description: 'Live preview of your running app' },
  { icon: <Bot size={16} />, label: 'Skills & Agents', description: 'Browse ready-made workflows' },
  { icon: <Settings size={16} />, label: 'Settings', description: 'Providers, themes, and preferences' },
]

const FIRST_BUILD_PROMPT = 'Build a tiny counter app with ivory theme, increment button, reset button, and live preview.'

export function FirstRunWizard(): React.ReactElement | null {
  const { showFirstRun, dismissFirstRun, setSimpleMode } = useUIStore()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [selectedGoal, setSelectedGoal] = useState<GoalId | null>(null)

  if (!showFirstRun) return null

  const totalSteps = 5

  const handleDismiss = () => {
    dismissFirstRun()
  }

  const handleNext = () => {
    if (step < totalSteps - 1) setStep(s => s + 1)
    else handleDismiss()
  }

  const handleBack = () => {
    if (step > 0) setStep(s => s - 1)
  }

  const handleGoalSelect = (id: GoalId) => {
    setSelectedGoal(id)
    // Pre-configure based on goal
    if (id === 'chat') setSimpleMode(true)
    else if (id === 'provider') setSimpleMode(false)
    setTimeout(() => handleNext(), 300)
  }

  const handleFirstBuild = () => {
    sessionStorage.setItem('vb_prefill_prompt', FIRST_BUILD_PROMPT)
    dismissFirstRun()
    navigate('/studio')
  }

  const handleGoToProviders = () => {
    handleNext()
    navigate('/settings/providers')
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/25"
      data-testid="first-run-wizard"
    >
      <div
        className="bg-[var(--ivory-elevated)] border border-[var(--ivory-border)] rounded-[28px] shadow-[var(--shadow-xl)] w-full max-w-[520px] mx-4 overflow-hidden"
        style={{ maxHeight: '90vh' }}
      >
        {/* Progress bar */}
        <div className="h-1 bg-[var(--ivory-border)]">
          <div
            className="h-full bg-[var(--ivory-accent)] transition-all duration-300"
            style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
          />
        </div>

        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 4px)' }}>
          {/* Skip button */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-1 text-[11px] text-[var(--ivory-text-3)]">
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  className={`inline-block w-1.5 h-1.5 rounded-full transition-colors ${i === step ? 'bg-[var(--ivory-accent)]' : 'bg-[var(--ivory-border)]'}`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              className="text-[11px] text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] flex items-center gap-1 cursor-pointer transition-colors"
              data-testid="wizard-skip-btn"
            >
              <X size={13} /> Skip
            </button>
          </div>

          {/* Step content */}
          {step === 0 && <StepWelcome onNext={handleNext} />}
          {step === 1 && <StepGoal selected={selectedGoal} onSelect={handleGoalSelect} />}
          {step === 2 && <StepProvider onNext={handleNext} onGoToProviders={handleGoToProviders} />}
          {step === 3 && <StepFirstBuild onBuild={handleFirstBuild} onNext={handleNext} />}
          {step === 4 && <StepNavTour onFinish={handleDismiss} />}

          {/* Footer nav */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-[var(--ivory-border)]/50">
            <button
              type="button"
              onClick={handleBack}
              disabled={step === 0}
              className="flex items-center gap-1 text-[11px] text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronLeft size={13} /> Back
            </button>
            {step < 4 && step !== 1 && (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--ivory-accent)] text-white hover:bg-[var(--ivory-accent-hover)] text-[12px] font-semibold transition-colors cursor-pointer"
                data-testid="wizard-next-btn"
              >
                Next <ArrowRight size={12} />
              </button>
            )}
            {step === 4 && (
              <button
                type="button"
                onClick={handleDismiss}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--ivory-accent)] text-white hover:bg-[var(--ivory-accent-hover)] text-[12px] font-semibold transition-colors cursor-pointer"
                data-testid="wizard-finish-btn"
              >
                Start building <Zap size={12} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Step components ──────────────────────────────────────────────────────────

function StepWelcome({ onNext }: { onNext: () => void }): React.ReactElement {
  return (
    <div className="text-center space-y-4">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--ivory-accent-light)] border border-[var(--ivory-accent)]/20 mx-auto">
        <Sparkles size={28} className="text-[var(--ivory-accent)]" />
      </div>
      <div>
        <h2 className="text-[22px] font-semibold text-[var(--ivory-text)] display-text">Welcome to Vibeforge</h2>
        <p className="mt-2 text-[13px] text-[var(--ivory-text-2)] leading-relaxed max-w-[360px] mx-auto">
          Your calm, focused coding workspace. Build apps, chat with AI, and see results live — all in one place.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-3 text-center pt-2">
        {[
          { icon: <Hammer size={16} />, label: 'Build anything' },
          { icon: <Eye size={16} />, label: 'Live preview' },
          { icon: <Bot size={16} />, label: 'AI powered' },
        ].map(item => (
          <div key={item.label} className="p-3 rounded-xl bg-[var(--ivory-surface)] border border-[var(--ivory-border)]">
            <div className="text-[var(--ivory-accent)] mb-1 flex justify-center">{item.icon}</div>
            <span className="text-[10px] font-semibold text-[var(--ivory-text-2)]">{item.label}</span>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onNext}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--ivory-accent)] text-white hover:bg-[var(--ivory-accent-hover)] text-[13px] font-semibold transition-colors cursor-pointer"
        data-testid="wizard-welcome-next"
      >
        Get started <ArrowRight size={14} />
      </button>
    </div>
  )
}

function StepGoal({
  selected,
  onSelect,
}: {
  selected: GoalId | null
  onSelect: (id: GoalId) => void
}): React.ReactElement {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-[18px] font-semibold text-[var(--ivory-text)]">What do you want to do?</h2>
        <p className="text-[12px] text-[var(--ivory-text-3)] mt-1">Choose your starting goal. You can always change this later.</p>
      </div>
      <div className="space-y-2">
        {GOALS.map(goal => (
          <button
            key={goal.id}
            type="button"
            onClick={() => onSelect(goal.id)}
            className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
              selected === goal.id
                ? 'border-[var(--ivory-accent)] bg-[var(--ivory-accent-light)]/60 shadow-sm'
                : 'border-[var(--ivory-border)] bg-[var(--ivory-surface)] hover:border-[var(--ivory-accent)]/40 hover:bg-[var(--ivory-accent-light)]/20'
            }`}
            data-testid={`goal-${goal.id}`}
          >
            <span className="text-[var(--ivory-accent)] shrink-0">{goal.icon}</span>
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-[var(--ivory-text)]">{goal.label}</div>
              <div className="text-[11px] text-[var(--ivory-text-3)]">{goal.description}</div>
            </div>
            {selected === goal.id && <CheckCircle size={16} className="text-[var(--ivory-accent)] ml-auto shrink-0" />}
          </button>
        ))}
      </div>
    </div>
  )
}

function StepProvider({
  onNext,
  onGoToProviders,
}: {
  onNext: () => void
  onGoToProviders: () => void
}): React.ReactElement {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-[18px] font-semibold text-[var(--ivory-text)]">Connect an AI provider</h2>
        <p className="text-[12px] text-[var(--ivory-text-3)] mt-1">Vibeforge uses AI providers to power chat and building. You need at least one API key to get started.</p>
      </div>
      <div className="space-y-2 text-[12px] text-[var(--ivory-text-2)]">
        <div className="p-3.5 rounded-xl bg-[var(--ivory-surface)] border border-[var(--ivory-border)] space-y-2">
          <div className="font-semibold text-[var(--ivory-text)] text-[13px]">Recommended: OpenRouter</div>
          <p className="text-[11px] leading-relaxed">OpenRouter is a free gateway to many AI models. Get a free API key at <span className="font-mono text-[var(--ivory-accent)]">openrouter.ai</span>, then paste it in Providers settings.</p>
        </div>
        <div className="p-3.5 rounded-xl bg-[var(--ivory-surface)] border border-[var(--ivory-border)] space-y-1">
          <div className="font-semibold text-[var(--ivory-text)] text-[13px]">Also supported</div>
          <p className="text-[11px] text-[var(--ivory-text-3)]">Anthropic Claude, OpenAI GPT, local Ollama models, and more.</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onGoToProviders}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--ivory-accent)] text-white hover:bg-[var(--ivory-accent-hover)] text-[12px] font-semibold transition-colors cursor-pointer"
          data-testid="wizard-goto-providers"
        >
          <KeyRound size={13} /> Open Providers settings
        </button>
        <button
          type="button"
          onClick={onNext}
          className="px-4 py-2.5 rounded-xl border border-[var(--ivory-border)] text-[var(--ivory-text-2)] hover:text-[var(--ivory-text)] text-[12px] font-semibold transition-colors cursor-pointer"
          data-testid="wizard-skip-provider"
        >
          I'll do this later
        </button>
      </div>
    </div>
  )
}

function StepFirstBuild({
  onBuild,
  onNext,
}: {
  onBuild: () => void
  onNext: () => void
}): React.ReactElement {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-[18px] font-semibold text-[var(--ivory-text)]">Try your first build</h2>
        <p className="text-[12px] text-[var(--ivory-text-3)] mt-1">The quickest way to see Vibeforge in action. One click — a working app appears.</p>
      </div>
      <div className="p-4 rounded-2xl bg-[var(--ivory-accent-light)]/50 border border-[var(--ivory-accent)]/20">
        <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--ivory-text-3)] mb-2">Example build prompt</div>
        <p className="text-[13px] text-[var(--ivory-text)] font-medium leading-relaxed">
          "{FIRST_BUILD_PROMPT}"
        </p>
      </div>
      <div className="space-y-2 text-[11px] text-[var(--ivory-text-2)]">
        {[
          'A counter app appears in Studio',
          'File tree and diff shown on the left',
          'LivePreview opens automatically',
          'Counter buttons work in the preview',
        ].map((step, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[var(--ivory-accent-light)] text-[var(--ivory-accent)] text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
            {step}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onBuild}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--ivory-accent)] text-white hover:bg-[var(--ivory-accent-hover)] text-[12px] font-semibold transition-colors cursor-pointer"
          data-testid="wizard-first-build-btn"
        >
          <Zap size={13} /> Build counter app now
        </button>
        <button
          type="button"
          onClick={onNext}
          className="px-4 py-2.5 rounded-xl border border-[var(--ivory-border)] text-[var(--ivory-text-2)] hover:text-[var(--ivory-text)] text-[12px] font-semibold transition-colors cursor-pointer"
        >
          Skip
        </button>
      </div>
    </div>
  )
}

function StepNavTour({ onFinish }: { onFinish: () => void }): React.ReactElement {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-[18px] font-semibold text-[var(--ivory-text)]">Find your way around</h2>
        <p className="text-[12px] text-[var(--ivory-text-3)] mt-1">Everything is in the left sidebar. Here's what each icon does.</p>
      </div>
      <div className="space-y-2">
        {NAV_TOUR.map(item => (
          <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--ivory-surface)] border border-[var(--ivory-border)]">
            <span className="text-[var(--ivory-accent)] w-8 h-8 rounded-xl bg-[var(--ivory-accent-light)] flex items-center justify-center shrink-0">
              {item.icon}
            </span>
            <div>
              <div className="text-[12px] font-semibold text-[var(--ivory-text)]">{item.label}</div>
              <div className="text-[11px] text-[var(--ivory-text-3)]">{item.description}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="p-3 rounded-xl bg-[var(--ivory-surface)] border border-[var(--ivory-border)] text-[11px] text-[var(--ivory-text-2)]">
        <span className="font-semibold text-[var(--ivory-text)]">Tip:</span> If anything is hidden, check Settings → General → toggle off "Simple mode" to reveal advanced options.
      </div>
    </div>
  )
}

// Steps used for dot indicator
const STEPS = [0, 1, 2, 3, 4]
