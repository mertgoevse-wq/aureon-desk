import React, { useState } from 'react'
import { Sparkles, ArrowRight, ArrowLeft, Check, Copy, HelpCircle } from 'lucide-react'

export interface GoalCardProps {
  name: string
  desc: string
  active: boolean
  onClick: () => void
  testId?: string
}

export function GoalCard({ name, desc, active, onClick, testId }: GoalCardProps): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
        active
          ? 'border-[var(--ivory-accent)] bg-[var(--ivory-accent-light)] text-[var(--ivory-text)] shadow-sm'
          : 'border-[var(--ivory-border)]/60 bg-[var(--ivory-bg)] hover:bg-[var(--ivory-surface)] text-[var(--ivory-text-2)] hover:text-[var(--ivory-text)]'
      }`}
      data-testid={testId}
    >
      <span className="text-[13px] font-bold block">{name}</span>
      <span className="text-[11px] text-[var(--ivory-text-3)] block mt-0.5 leading-relaxed font-body">{desc}</span>
    </button>
  )
}

export interface StyleCardProps {
  name: string
  desc: string
  active: boolean
  onClick: () => void
  testId?: string
}

export function StyleCard({ name, desc, active, onClick, testId }: StyleCardProps): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
        active
          ? 'border-[var(--ivory-accent)] bg-[var(--ivory-accent-light)] text-[var(--ivory-text)] shadow-sm'
          : 'border-[var(--ivory-border)]/60 bg-[var(--ivory-bg)] hover:bg-[var(--ivory-surface)] text-[var(--ivory-text-2)] hover:text-[var(--ivory-text)]'
      }`}
      data-testid={testId}
    >
      <span className="text-[13px] font-bold block">{name}</span>
      <span className="text-[11px] text-[var(--ivory-text-3)] block mt-0.5 leading-relaxed font-body">{desc}</span>
    </button>
  )
}

export interface BuildBriefPreviewProps {
  brief: string
  onCopy: () => void
  copied: boolean
}

export function BuildBriefPreview({ brief, onCopy, copied }: BuildBriefPreviewProps): React.ReactElement {
  return (
    <div className="relative group">
      <pre className="p-4 bg-[var(--ivory-surface)] border border-[var(--ivory-border)]/60 rounded-2xl text-[12px] text-[var(--ivory-text-2)] leading-relaxed font-mono whitespace-pre-wrap select-text break-words pr-12">
        {brief}
      </pre>
      <button
        type="button"
        onClick={onCopy}
        className="absolute right-3 top-3 p-1.5 rounded-lg border border-[var(--ivory-border)]/80 bg-[var(--ivory-elevated)] hover:bg-[var(--ivory-surface)] text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] transition cursor-pointer"
        title="Copy Brief"
      >
        {copied ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
      </button>
    </div>
  )
}

export interface GuidedNextStepsProps {
  suggestions: string[]
  onSelect: (step: string) => void
}

export function GuidedNextSteps({ suggestions, onSelect }: GuidedNextStepsProps): React.ReactElement {
  return (
    <div className="space-y-2 mt-4" data-testid="guided-next-steps">
      <h4 className="text-[12px] font-bold uppercase tracking-wider text-[var(--ivory-text-3)] flex items-center gap-1.5">
        <HelpCircle size={13} className="text-[var(--ivory-accent)]" /> Propose Next Improvements
      </h4>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((step, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelect(step)}
            className="px-3 py-1.5 rounded-full border border-[var(--ivory-border)]/50 bg-[var(--ivory-elevated)] text-[12px] text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:border-[var(--ivory-accent)]/20 transition cursor-pointer"
          >
            {step}
          </button>
        ))}
      </div>
    </div>
  )
}

export interface GoalWizardProps {
  onBuild: (prompt: string, style: string, platform: string) => void
}

export function GoalWizard({ onBuild }: GoalWizardProps): React.ReactElement {
  const [step, setStep] = useState<number>(0)
  const [selectedType, setSelectedType] = useState<string>('Website')
  const [selectedPurpose, setSelectedPurpose] = useState<string>('personal')
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(['hero section', 'navigation'])
  const [selectedStyle, setSelectedStyle] = useState<string>('Ivory Premium')
  const [copied, setCopied] = useState<boolean>(false)

  const types = [
    { name: 'Website', desc: 'A clean, multi-page layout describing services or info.' },
    { name: 'Landing Page', desc: 'A single, high-conversion page for a product or service.' },
    { name: 'Web App', desc: 'An interactive website with dynamic features.' },
    { name: 'Android-style App', desc: 'A mobile-first simulation styled like a telephone app.' },
    { name: 'Dashboard', desc: 'A user panel with stats, metrics, and visual cards.' },
    { name: 'Tool', desc: 'A helper utility like a calculator, unit converter, or planner.' },
    { name: 'Portfolio', desc: 'Showcase your work, projects, and personal skills beautifully.' },
    { name: 'Learning App', desc: 'An educational app with quiz cards, text guides, or flashcards.' }
  ]

  const purposes = [
    { name: 'business', label: 'Commercial / Business' },
    { name: 'personal', label: 'Personal Project' },
    { name: 'school', label: 'School / Academic' },
    { name: 'productivity', label: 'Productivity Tool' },
    { name: 'social', label: 'Community / Social' },
    { name: 'learning', label: 'Learning / Tutorial' },
    { name: 'experiment', label: 'Prototype Experiment' }
  ]

  const features = [
    { name: 'hero section', desc: 'Header image/slogan' },
    { name: 'login placeholder', desc: 'User profile sign-in' },
    { name: 'dashboard cards', desc: 'Stats / grid blocks' },
    { name: 'forms', desc: 'Contact or input fields' },
    { name: 'navigation', desc: 'Clean header menu bar' },
    { name: 'mobile layout', desc: 'Responsive mobile frame' },
    { name: 'dark/light mode', desc: 'Instant theme color switch' },
    { name: 'local storage', desc: 'Remember data on refresh' },
    { name: 'preview examples', desc: 'Placeholder database lists' }
  ]

  const styles = [
    { name: 'Ivory Premium', desc: 'Calm cream backgrounds, elegant dark text, orange accents' },
    { name: 'Codex Calm', desc: 'Deep warm neutrals, sans-serif typography, cozy vibes' },
    { name: 'Emergent Clean', desc: 'Clean layout, high contrast, minimalist spacing' },
    { name: 'Minimal App', desc: 'Strict functional palette, light grey accents, subtle lines' },
    { name: 'Soft Dashboard', desc: 'Soft pastel container borders, rounded corners, neat grids' }
  ]

  const toggleFeature = (feat: string) => {
    setSelectedFeatures(prev =>
      prev.includes(feat) ? prev.filter(f => f !== feat) : [...prev, feat]
    )
  }

  // Generate a high-quality no-code brief
  const generatePrompt = (): string => {
    const featureList = selectedFeatures.join(', ')
    const platform = selectedType === 'Android-style App' ? 'Android' : 'Web app'
    return `Build a premium ${selectedType} for ${selectedPurpose} purposes.
It should be styled using the "${selectedStyle}" theme style.
Key features to implement: ${featureList}.
Ensure the design has rounded corners, beautiful spacing, is fully interactive, and feels premium without requiring advanced technical setup.`
  }

  const generatedBrief = generatePrompt()

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedBrief)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleBuildClick = () => {
    const platform = selectedType === 'Android-style App' ? 'Android' : 'Web app'
    onBuild(generatedBrief, selectedStyle, platform)
  }

  return (
    <div className="w-full max-w-2xl bg-[var(--ivory-elevated)] border border-[var(--ivory-border)] rounded-3xl p-6 shadow-[var(--shadow-md)] mt-2" data-testid="goal-wizard">
      {/* Progress Steps header */}
      <div className="flex items-center justify-between border-b border-[var(--ivory-border)]/50 pb-4 mb-5">
        <div className="flex items-center gap-2">
          <Sparkles className="text-[var(--ivory-accent)]" size={18} />
          <h3 className="text-sm font-semibold text-[var(--ivory-text)] font-display">No-Code Goal Assistant</h3>
        </div>
        <div className="text-[11px] text-[var(--ivory-text-3)] font-semibold uppercase tracking-wider">
          Step {step + 1} of 5
        </div>
      </div>

      {/* Step 1: Type */}
      {step === 0 && (
        <div className="space-y-4">
          <div>
            <h4 className="text-[15px] font-bold text-[var(--ivory-text)]">1. What do you want to build?</h4>
            <p className="text-[12px] text-[var(--ivory-text-3)] mt-0.5">Select a category that fits your vision.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {types.map(t => (
              <GoalCard
                key={t.name}
                name={t.name}
                desc={t.desc}
                active={selectedType === t.name}
                onClick={() => setSelectedType(t.name)}
                testId={`wizard-type-${t.name.toLowerCase().replace(/\s+/g, '-')}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Purpose */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h4 className="text-[15px] font-bold text-[var(--ivory-text)]">2. What is this project for?</h4>
            <p className="text-[12px] text-[var(--ivory-text-3)] mt-0.5">Helps Vibeforge tailor default content copy.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {purposes.map(p => (
              <GoalCard
                key={p.name}
                name={p.label}
                desc=""
                active={selectedPurpose === p.name}
                onClick={() => setSelectedPurpose(p.name)}
                testId={`wizard-purpose-${p.name}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Features */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <h4 className="text-[15px] font-bold text-[var(--ivory-text)]">3. What elements should it include?</h4>
            <p className="text-[12px] text-[var(--ivory-text-3)] mt-0.5">Select all elements that you would like us to build.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {features.map(f => {
              const active = selectedFeatures.includes(f.name)
              return (
                <button
                  key={f.name}
                  type="button"
                  onClick={() => toggleFeature(f.name)}
                  className={`p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                    active
                      ? 'border-[var(--ivory-accent)] bg-[var(--ivory-accent-light)] text-[var(--ivory-text)] shadow-sm'
                      : 'border-[var(--ivory-border)]/60 bg-[var(--ivory-bg)] hover:bg-[var(--ivory-surface)] text-[var(--ivory-text-2)] hover:text-[var(--ivory-text)]'
                  }`}
                  data-testid={`wizard-feature-${f.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[12px] font-bold block">{f.name}</span>
                    {active && <Check size={12} className="text-[var(--ivory-accent)] shrink-0 ml-1" />}
                  </div>
                  <span className="text-[10px] text-[var(--ivory-text-3)] block mt-1 leading-normal font-body">{f.desc}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Step 4: Style */}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <h4 className="text-[15px] font-bold text-[var(--ivory-text)]">4. Choose a Visual Style</h4>
            <p className="text-[12px] text-[var(--ivory-text-3)] mt-0.5">Select a gorgeous premium preset theme layout.</p>
          </div>
          <div className="grid grid-cols-1 gap-2.5">
            {styles.map(s => (
              <StyleCard
                key={s.name}
                name={s.name}
                desc={s.desc}
                active={selectedStyle === s.name}
                onClick={() => setSelectedStyle(s.name)}
                testId={`wizard-style-${s.name.toLowerCase().replace(/\s+/g, '-')}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Step 5: Brief Preview */}
      {step === 4 && (
        <div className="space-y-4">
          <div>
            <h4 className="text-[15px] font-bold text-[var(--ivory-text)]">5. Your Generated Build Brief</h4>
            <p className="text-[12px] text-[var(--ivory-text-3)] mt-0.5">Review the structured project specification before building.</p>
          </div>
          <BuildBriefPreview
            brief={generatedBrief}
            onCopy={handleCopy}
            copied={copied}
          />
        </div>
      )}

      {/* Action buttons footer */}
      <div className="flex items-center justify-between pt-4 mt-6 border-t border-[var(--ivory-border)]/40">
        <div>
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl border border-[var(--ivory-border)] hover:bg-[var(--ivory-surface)] text-[12px] font-semibold text-[var(--ivory-text-2)] hover:text-[var(--ivory-text)] transition cursor-pointer"
            >
              <ArrowLeft size={13} /> Back
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep(s => s + 1)}
              className="inline-flex items-center gap-1.5 h-9 px-5 rounded-xl bg-[var(--ivory-bronze)] hover:bg-[var(--ivory-bronze-hover)] text-[12px] font-semibold text-white transition cursor-pointer shadow-[var(--shadow-xs)]"
              data-testid="wizard-next-btn"
            >
              Next <ArrowRight size={13} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleBuildClick}
              className="inline-flex items-center gap-1.5 h-9 px-6 rounded-xl bg-[var(--ivory-accent)] hover:bg-[var(--ivory-accent-hover)] text-[12px] font-semibold text-white transition cursor-pointer shadow-[var(--shadow-xs)]"
              data-testid="wizard-build-btn"
            >
              Build with Preview <Sparkles size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
