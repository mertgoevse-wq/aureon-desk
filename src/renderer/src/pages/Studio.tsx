import React, { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Code2, FileText, Image, Video, Music,
  FileSearch, MonitorPlay, Plug, Workflow, ChevronRight,
  Sparkles, ShieldCheck, AlertTriangle, Info, ArrowRight,
  Eye, Lightbulb, Zap, FolderCheck, ChevronDown
} from 'lucide-react'
import { useIpc } from '../hooks/useIpc'
import { useUIStore } from '../stores/uiStore'
import { TASK_CATEGORIES, AUTONOMY_LEVELS } from '@shared/types/studio-core'
import type { TaskCategoryInfo, StudioOrchestrationResult, AutonomyLevel } from '@shared/types/studio-core'
import { SafetyNotice } from '../components/vibe/SafetyNotice'
import { Drawer } from '../components/shared/Drawer'

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
  const { inspectorOpen, toggleInspector } = useUIStore()

  const [selectedCard, setSelectedCard] = useState<string | null>(null)
  const [orchestration, setOrchestration] = useState<StudioOrchestrationResult | null>(null)
  const [autonomyLevel, setAutonomyLevel] = useState<AutonomyLevel>(2)
  const [showConfirm, setShowConfirm] = useState(false)
  const activeCard = TASK_CATEGORIES.find(c => c.id === selectedCard)

  const [primaryPrompt, setPrimaryPrompt] = useState('')
  const [showMoreTypes, setShowMoreTypes] = useState(false)

  // Collapse right inspector on mount for clean workspace look
  useEffect(() => {
    if (inspectorOpen) {
      toggleInspector()
    }
  }, [])


  // State hooks for configuration wizard
  const [promptText, setPromptText] = useState('')
  const [targetPlatform, setTargetPlatform] = useState('Web app')
  const [projectStyle, setProjectStyle] = useState('Calming Ivory')
  const [outputOption, setOutputOption] = useState('Generate + Preview')
  const [targetLanguage, setTargetLanguage] = useState('TypeScript')
  const [textTone, setTextTone] = useState('Professional')
  const [imageProvider, setImageProvider] = useState('Mock Offline Creator')
  const [imageRatio, setImageRatio] = useState('1:1 Square')
  const [videoProvider, setVideoProvider] = useState('Mock Offline Creator')
  const [videoDuration, setVideoDuration] = useState('5 seconds')
  const [musicProvider, setMusicProvider] = useState('Mock Offline Creator')
  const [musicStyle, setMusicStyle] = useState('Ambient')
  const [fileType, setFileType] = useState('Document (PDF/TXT)')
  const [screenTarget, setScreenTarget] = useState('Main Display')
  const [connectorTarget, setConnectorTarget] = useState('Gmail')
  const [triggerType, setTriggerType] = useState('Time schedule')

  const handleCardClick = useCallback((card: TaskCategoryInfo) => {
    setSelectedCard(card.id)
    setOrchestration(null)
    setShowConfirm(false)
    setPromptText(card.starterPrompt)

    // Reset wizard selectors to defaults
    setTargetPlatform('Web app')
    setProjectStyle('Calming Ivory')
    setOutputOption('Generate + Preview')
    setTargetLanguage('TypeScript')
    setTextTone('Professional')
    setImageProvider('Mock Offline Creator')
    setImageRatio('1:1 Square')
    setVideoProvider('Mock Offline Creator')
    setVideoDuration('5 seconds')
    setMusicProvider('Mock Offline Creator')
    setMusicStyle('Ambient')
    setFileType('Document (PDF/TXT)')
    setScreenTarget('Main Display')
    setConnectorTarget('Gmail')
    setTriggerType('Time schedule')

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

    // Custom build/compiler integration
    if (selectedCard === 'build_app') {
      if (outputOption === 'Generate + Preview') {
        sessionStorage.setItem('auto-build-app-preview', 'true')
        sessionStorage.setItem('build-app-style', projectStyle)
        sessionStorage.setItem('build-app-prompt', promptText)
        sessionStorage.setItem('build-app-platform', targetPlatform)
        targetPath = '/preview'
      } else if (outputOption === 'Generate sandbox') {
        sessionStorage.setItem('auto-build-app-sandbox-only', 'true')
        sessionStorage.setItem('build-app-style', projectStyle)
        sessionStorage.setItem('build-app-prompt', promptText)
        sessionStorage.setItem('build-app-platform', targetPlatform)
        targetPath = '/preview'
      } else {
        targetPath = '/'
      }
    } else if (selectedCard === 'code_program') {
      if (outputOption === 'Generate sandbox') {
        sessionStorage.setItem('auto-build-app-sandbox-only', 'true')
        sessionStorage.setItem('build-app-style', 'Minimalist')
        sessionStorage.setItem('build-app-prompt', `Write a program in ${targetLanguage}: ${promptText}`)
        targetPath = '/preview'
      } else {
        targetPath = '/'
      }
    } else if (mode === 'code') {
      targetPath = '/preview'
    } else if (mode === 'cowork') {
      targetPath = '/cowork'
    } else if (selectedCard === 'connect_apps') {
      targetPath = '/settings/connectors'
    } else if (orchestration.nextUIAction === 'open_connectors') {
      targetPath = '/settings/connectors'
    } else {
      targetPath = '/'
    }

    // Build dynamic custom prompt text based on selectors
    let finalPrompt = promptText
    if (selectedCard === 'build_app') {
      finalPrompt = `Build a ${targetPlatform} project with the goal: "${promptText}". Use style "${projectStyle}". Output option is "${outputOption}".`
    } else if (selectedCard === 'code_program') {
      finalPrompt = `Write a program in ${targetLanguage} matching this spec: "${promptText}"`
    } else if (selectedCard === 'generate_text') {
      finalPrompt = `Write text in a ${textTone} tone: "${promptText}"`
    } else if (selectedCard === 'generate_image') {
      finalPrompt = `Generate an image using ${imageProvider} with aspect ratio ${imageRatio}: "${promptText}"`
    } else if (selectedCard === 'generate_video') {
      finalPrompt = `Generate a video using ${videoProvider} with duration ${videoDuration}: "${promptText}"`
    } else if (selectedCard === 'generate_music') {
      finalPrompt = `Generate music using ${musicProvider} in style "${musicStyle}": "${promptText}"`
    } else if (selectedCard === 'analyze_file') {
      finalPrompt = `Analyze this ${fileType}: "${promptText}"`
    } else if (selectedCard === 'analyze_screen_video') {
      finalPrompt = `Analyze ${screenTarget}: "${promptText}"`
    } else if (selectedCard === 'automate_workflow') {
      finalPrompt = `Automate a workflow triggered by ${triggerType}: "${promptText}"`
    }

    navigate(targetPath)

    // Insert dynamic prompt details into workspace input
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('composer-insert', {
        detail: { text: finalPrompt, mode: 'replace' }
      }))
    }, 150)
  }, [
    orchestration,
    selectedCard,
    promptText,
    targetPlatform,
    projectStyle,
    outputOption,
    targetLanguage,
    textTone,
    imageProvider,
    imageRatio,
    videoProvider,
    videoDuration,
    musicProvider,
    musicStyle,
    fileType,
    screenTarget,
    triggerType,
    navigate
  ])

  const mainCardIds = ['build_app', 'code_program', 'automate_workflow', 'connect_apps']
  const mainCards = TASK_CATEGORIES.filter(c => mainCardIds.includes(c.id))
  const secondaryCards = TASK_CATEGORIES.filter(c => !mainCardIds.includes(c.id))

  const getCardLabel = (card: TaskCategoryInfo) => {
    if (card.id === 'automate_workflow') return 'Create'
    if (card.id === 'connect_apps') return 'Connect'
    if (card.id === 'build_app') return 'Build'
    if (card.id === 'code_program') return 'Code'
    return card.label
  }

  const renderCard = (card: TaskCategoryInfo) => {
    const isSelected = selectedCard === card.id
    const isOrchestrating = isSelected && !orchestration
    return (
      <button
        key={card.id}
        type="button"
        onClick={() => handleCardClick(card)}
        disabled={isOrchestrating}
        data-testid={`studio-card-${card.id}`}
        className={`group relative flex items-start gap-3.5 p-4 rounded-2xl border text-left transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/30 cursor-pointer
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
            <span className="text-[13px] font-semibold text-[var(--ivory-text)]">{getCardLabel(card)}</span>
            {RISK_ICONS[card.riskLevel]}
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--ivory-surface-2)] text-[var(--ivory-text-3)] font-medium font-body">
              {MODE_LABELS[card.recommendedMode]} mode
            </span>
          </div>
          <p className="text-[11px] text-[var(--ivory-text-3)] mt-1 leading-relaxed font-body">
            {card.description}
          </p>

          {/* Hover hint */}
          {!isSelected && (
            <span className="inline-flex items-center gap-1 text-[10px] text-[var(--ivory-accent)] font-semibold mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              Configure <ChevronRight size={10} />
            </span>
          )}
        </div>
      </button>
    )
  }

  const handlePrimaryActionClick = () => {
    sessionStorage.setItem('auto-build-app-preview', 'true')
    sessionStorage.setItem('build-app-style', projectStyle)
    sessionStorage.setItem('build-app-prompt', primaryPrompt || 'Build a simple web utility')
    sessionStorage.setItem('build-app-platform', targetPlatform)
    
    navigate('/preview')

    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('composer-insert', {
        detail: {
          text: `Build a ${targetPlatform} project with the goal: "${primaryPrompt || 'Build a simple web utility'}". Use style "${projectStyle}". Output option is "Generate + Preview".`,
          mode: 'replace'
        }
      }))
    }, 150)
  }

  return (
    <div className="h-full overflow-y-auto bg-[var(--ivory-bg)] bg-hero-radial animate-fade-in" data-testid="studio-page">
      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* === HERO === */}
        <div className="mb-10 text-center flex flex-col items-center">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--ivory-accent-light)] flex items-center justify-center shadow-[var(--shadow-xs)]">
              <Sparkles size={22} className="text-[var(--ivory-accent)]" />
            </div>
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-[var(--ivory-text)] font-display mb-3">
            Create with Aureon
          </h1>
          <p className="text-sm text-[var(--ivory-text-3)] font-body max-w-lg leading-relaxed mb-6">
            A premium desktop space optimized for app building, pair programming, and secure local automation.
          </p>

          {/* Autonomy indicator */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--ivory-surface)] border border-[var(--ivory-border)]/50 text-[10px] font-semibold text-[var(--ivory-text-2)] shadow-[var(--shadow-xs)]">
            <ShieldCheck size={12} className="text-[var(--ivory-accent)]" />
            {AUTONOMY_LEVELS[autonomyLevel].label}: {AUTONOMY_LEVELS[autonomyLevel].description}
          </div>
        </div>

        {/* === CENTRAL PRIMARY COMPOSER ACTION === */}
        <div className="mb-10 max-w-2xl mx-auto rounded-[24px] border border-[var(--ivory-border)] bg-[var(--ivory-elevated)] p-4 shadow-[var(--shadow-md)]">
          <textarea
            value={primaryPrompt}
            onChange={e => setPrimaryPrompt(e.target.value)}
            placeholder="What would you like to build today? (e.g. Build a task manager with countdown timer)"
            className="w-full h-16 p-2 bg-transparent text-xs text-[var(--ivory-text)] placeholder-[var(--ivory-text-3)]/60 border-none focus:outline-none resize-none font-body"
          />
          <div className="flex items-center justify-between border-t border-[var(--ivory-border)]/50 pt-3 mt-2 px-1">
            <div className="flex items-center gap-2">
              <select
                value={targetPlatform}
                onChange={e => setTargetPlatform(e.target.value)}
                title="Target platform"
                aria-label="Target platform"
                className="px-2.5 py-1 text-[10px] rounded-lg bg-[var(--ivory-surface)] border border-[var(--ivory-border)] text-[var(--ivory-text-2)] font-semibold cursor-pointer outline-none"
              >
                <option value="Web app">Web App</option>
                <option value="Desktop widget">Desktop Widget</option>
                <option value="Mobile prototype">Mobile Prototype</option>
              </select>
              <select
                value={projectStyle}
                onChange={e => setProjectStyle(e.target.value)}
                title="Theme style"
                aria-label="Theme style"
                className="px-2.5 py-1 text-[10px] rounded-lg bg-[var(--ivory-surface)] border border-[var(--ivory-border)] text-[var(--ivory-text-2)] font-semibold cursor-pointer outline-none"
              >
                <option value="Calming Ivory">Calming Ivory</option>
                <option value="Soft Teal">Soft Teal</option>
                <option value="Deep Slate">Deep Slate</option>
              </select>
            </div>
            <button
              type="button"
              onClick={handlePrimaryActionClick}
              className="inline-flex h-8 items-center justify-center px-4 rounded-xl bg-[var(--ivory-accent)] hover:bg-[var(--ivory-accent-hover)] text-xs font-bold text-white transition-colors cursor-pointer shadow-[var(--shadow-xs)]"
            >
              Build App <ArrowRight size={12} className="ml-1" />
            </button>
          </div>
        </div>

        <SafetyNotice type="general" />

        {/* === TASK CARDS GRID (4 MAIN CARDS) === */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {mainCards.map(renderCard)}
        </div>

        {/* === MORE CREATION TYPES DRAWER === */}
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => setShowMoreTypes(!showMoreTypes)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[var(--ivory-border)] bg-[var(--ivory-elevated)] hover:bg-[var(--ivory-surface)] text-[11px] font-semibold text-[var(--ivory-text-2)] hover:text-[var(--ivory-text)] transition-colors cursor-pointer shadow-[var(--shadow-xs)] select-none"
          >
            More creation types
            <ChevronDown size={12} className={`transition-transform duration-200 ${showMoreTypes ? 'rotate-180' : ''}`} />
          </button>

          {showMoreTypes && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left animate-in">
              {secondaryCards.map(renderCard)}
            </div>
          )}
        </div>

        {/* === AUTONOMY SELECTOR === */}
        <div className="mt-10">
          <h2 className="text-[12px] font-bold uppercase tracking-wider text-[var(--ivory-text-3)] mb-3 flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-[var(--ivory-accent)]" />
            Autonomy Level
          </h2>
          <div className="grid grid-cols-4 gap-2">
            {AUTONOMY_LEVELS.filter(l => l.level > 0).map(level => {
              const isCurrent = autonomyLevel === level.level
              const IconComponent = (() => {
                switch (level.icon) {
                  case 'Eye': return <Eye size={13} />
                  case 'Lightbulb': return <Lightbulb size={13} />
                  case 'ShieldCheck': return <ShieldCheck size={13} />
                  case 'FolderCheck': return <FolderCheck size={13} />
                  case 'Zap': return <Zap size={13} />
                  default: return <ShieldCheck size={13} />
                }
              })()
              return (
                <button
                  key={level.level}
                  type="button"
                  onClick={() => setAutonomyLevel(level.level)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/30 cursor-pointer
                    ${isCurrent
                      ? 'border-[var(--ivory-accent)]/30 bg-[var(--ivory-accent-light)] shadow-[var(--shadow-sm)]'
                      : 'border-[var(--ivory-border)]/60 bg-[var(--ivory-elevated)] hover:border-[var(--ivory-accent)]/20'
                    }`}
                  data-testid={`autonomy-level-${level.level}`}
                >
                  <span className={isCurrent ? 'text-[var(--ivory-accent)]' : 'text-[var(--ivory-text-3)]'}>
                    {IconComponent}
                  </span>
                  <span className="text-[10px] font-bold text-[var(--ivory-text)]">{level.level}</span>
                  <span className="text-[9px] text-[var(--ivory-text-3)] leading-tight font-body">{level.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* === SAFETY NOTICE === */}
        <div className="mt-8 p-3.5 rounded-2xl border border-[var(--ivory-border)]/50 bg-[var(--ivory-elevated)]/60 shadow-[var(--shadow-xs)]">
          <div className="flex items-start gap-2.5">
            <ShieldCheck size={15} className="shrink-0 mt-0.5 text-[var(--ivory-accent)]" />
            <div>
              <h3 className="text-[11px] font-bold text-[var(--ivory-text)]">Safety First</h3>
              <p className="text-[10px] text-[var(--ivory-text-3)] mt-0.5 leading-relaxed font-body">
                Every destructive or account action requires explicit confirmation.
                No shell commands, file writes, Gmail actions, or account changes execute without your approval.
                Your files are never sent to remote providers unless you explicitly attach them.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Drawer
        isOpen={!!selectedCard}
        onClose={() => {
          setSelectedCard(null)
          setOrchestration(null)
          setShowConfirm(false)
        }}
        title={activeCard ? activeCard.label : ''}
      >
        {activeCard && (
          <div className="space-y-5" data-testid="studio-drawer">
            <div>
              <div className="text-[13px] font-semibold text-[var(--ivory-text)] mt-1 capitalize">
                {activeCard.recommendedMode} Mode
              </div>
            </div>

            {/* Custom Wizard Selector sections */}
            {selectedCard === 'build_app' && (
              <div className="space-y-4 pt-1">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ivory-text-3)]">Target Platform</span>
                  <div className="grid grid-cols-2 gap-2">
                    {['Web app', 'Desktop app', 'PWA', 'Android'].map(target => {
                      const isActive = targetPlatform === target
                      return (
                        <button
                          key={target}
                          type="button"
                          onClick={() => setTargetPlatform(target)}
                          className={`py-2 px-3 text-[11px] font-semibold border rounded-xl transition-all cursor-pointer ${
                            isActive
                              ? 'border-[var(--ivory-accent)] bg-[var(--ivory-accent-light)] text-[var(--ivory-text)] shadow-[var(--shadow-xs)]'
                              : 'border-[var(--ivory-border)]/60 bg-[var(--ivory-bg)] hover:bg-[var(--ivory-surface)] text-[var(--ivory-text-2)] hover:text-[var(--ivory-text)]'
                          }`}
                        >
                          {target}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ivory-text-3)]">Theme Style</span>
                  <div className="grid grid-cols-3 gap-2">
                    {['Calming Ivory', 'Soft Teal', 'Deep Slate'].map(style => {
                      const isActive = projectStyle === style
                      return (
                        <button
                          key={style}
                          type="button"
                          onClick={() => setProjectStyle(style)}
                          className={`py-2 px-2 text-[10px] font-semibold border rounded-xl transition-all cursor-pointer ${
                            isActive
                              ? 'border-[var(--ivory-accent)] bg-[var(--ivory-accent-light)] text-[var(--ivory-text)] shadow-[var(--shadow-xs)]'
                              : 'border-[var(--ivory-border)]/60 bg-[var(--ivory-bg)] hover:bg-[var(--ivory-surface)] text-[var(--ivory-text-2)] hover:text-[var(--ivory-text)]'
                          }`}
                        >
                          {style}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ivory-text-3)]">Output Format</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {['Generate + Preview', 'Generate sandbox', 'Plan only'].map(opt => {
                      const isActive = outputOption === opt
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setOutputOption(opt)}
                          className={`py-2 px-1 text-[9px] font-bold border rounded-xl transition-all cursor-pointer text-center ${
                            isActive
                              ? 'border-[var(--ivory-accent)] bg-[var(--ivory-accent-light)] text-[var(--ivory-text)] shadow-[var(--shadow-xs)]'
                              : 'border-[var(--ivory-border)]/60 bg-[var(--ivory-bg)] hover:bg-[var(--ivory-surface)] text-[var(--ivory-text-2)] hover:text-[var(--ivory-text)]'
                          }`}
                        >
                          {opt}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {selectedCard === 'code_program' && (
              <div className="space-y-4 pt-1">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ivory-text-3)]">Target Language</span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {['TypeScript', 'Python', 'JavaScript', 'Rust'].map(lang => {
                      const isActive = targetLanguage === lang
                      return (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => setTargetLanguage(lang)}
                          className={`py-1.5 px-1 text-[10px] font-semibold border rounded-xl transition-all cursor-pointer text-center ${
                            isActive
                              ? 'border-[var(--ivory-accent)] bg-[var(--ivory-accent-light)] text-[var(--ivory-text)] shadow-[var(--shadow-xs)]'
                              : 'border-[var(--ivory-border)]/60 bg-[var(--ivory-bg)] hover:bg-[var(--ivory-surface)] text-[var(--ivory-text-2)] hover:text-[var(--ivory-text)]'
                          }`}
                        >
                          {lang}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ivory-text-3)]">Output Format</span>
                  <div className="grid grid-cols-2 gap-2">
                    {['Generate sandbox', 'Plan only'].map(opt => {
                      const isActive = outputOption === opt
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setOutputOption(opt)}
                          className={`py-2 px-2 text-[10px] font-semibold border rounded-xl transition-all cursor-pointer text-center ${
                            isActive
                              ? 'border-[var(--ivory-accent)] bg-[var(--ivory-accent-light)] text-[var(--ivory-text)] shadow-[var(--shadow-xs)]'
                              : 'border-[var(--ivory-border)]/60 bg-[var(--ivory-bg)] hover:bg-[var(--ivory-surface)] text-[var(--ivory-text-2)] hover:text-[var(--ivory-text)]'
                          }`}
                        >
                          {opt}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {selectedCard === 'generate_text' && (
              <div className="space-y-2 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ivory-text-3)]">Writing Tone</span>
                <div className="grid grid-cols-2 gap-2">
                  {['Professional', 'Creative', 'Casual', 'Technical'].map(tone => {
                    const isActive = textTone === tone
                    return (
                      <button
                        key={tone}
                        type="button"
                        onClick={() => setTextTone(tone)}
                        className={`py-2 px-3 text-[11px] font-semibold border rounded-xl transition-all cursor-pointer ${
                          isActive
                            ? 'border-[var(--ivory-accent)] bg-[var(--ivory-accent-light)] text-[var(--ivory-text)] shadow-[var(--shadow-xs)]'
                            : 'border-[var(--ivory-border)]/60 bg-[var(--ivory-bg)] hover:bg-[var(--ivory-surface)] text-[var(--ivory-text-2)] hover:text-[var(--ivory-text)]'
                        }`}
                      >
                        {tone}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {selectedCard === 'generate_image' && (
              <div className="space-y-4 pt-1">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ivory-text-3)]">Provider Engine</span>
                  <div className="flex flex-col gap-1.5">
                    {['Mock Offline Creator', 'OpenAI DALL-E', 'Google Imagen'].map(prov => {
                      const isActive = imageProvider === prov
                      return (
                        <button
                          key={prov}
                          type="button"
                          onClick={() => setImageProvider(prov)}
                          className={`py-2 px-3 text-[11px] font-semibold border rounded-xl transition-all cursor-pointer text-left ${
                            isActive
                              ? 'border-[var(--ivory-accent)] bg-[var(--ivory-accent-light)] text-[var(--ivory-text)] shadow-[var(--shadow-xs)]'
                              : 'border-[var(--ivory-border)]/60 bg-[var(--ivory-bg)] hover:bg-[var(--ivory-surface)] text-[var(--ivory-text-2)] hover:text-[var(--ivory-text)]'
                          }`}
                        >
                          {prov}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ivory-text-3)]">Aspect Ratio</span>
                  <div className="grid grid-cols-3 gap-2">
                    {['1:1 Square', '16:9 Landscape', '9:16 Portrait'].map(ratio => {
                      const isActive = imageRatio === ratio
                      return (
                        <button
                          key={ratio}
                          type="button"
                          onClick={() => setImageRatio(ratio)}
                          className={`py-2 px-1 text-[9px] font-bold border rounded-xl transition-all cursor-pointer text-center ${
                            isActive
                              ? 'border-[var(--ivory-accent)] bg-[var(--ivory-accent-light)] text-[var(--ivory-text)] shadow-[var(--shadow-xs)]'
                              : 'border-[var(--ivory-border)]/60 bg-[var(--ivory-bg)] hover:bg-[var(--ivory-surface)] text-[var(--ivory-text-2)] hover:text-[var(--ivory-text)]'
                          }`}
                        >
                          {ratio}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {imageProvider !== 'Mock Offline Creator' && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl text-amber-900 text-[10px] leading-relaxed flex flex-col gap-1.5">
                    <span>⚠️ <strong>{imageProvider}</strong> requires setup or is mock-only. Go to settings to set API credentials, or use <strong>Mock Offline Creator</strong>.</span>
                    <button
                      type="button"
                      onClick={() => navigate('/settings/providers')}
                      className="py-1 px-2.5 text-[9px] font-bold border border-amber-500/30 rounded-lg hover:bg-amber-500/15 text-amber-950 transition-colors w-fit cursor-pointer"
                    >
                      Configure Providers
                    </button>
                  </div>
                )}
              </div>
            )}

            {selectedCard === 'generate_video' && (
              <div className="space-y-4 pt-1">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ivory-text-3)]">Video Engine</span>
                  <div className="flex flex-col gap-1.5">
                    {['Mock Offline Creator', 'Google Veo', 'OpenAI Sora'].map(prov => {
                      const isActive = videoProvider === prov
                      return (
                        <button
                          key={prov}
                          type="button"
                          onClick={() => setVideoProvider(prov)}
                          className={`py-2 px-3 text-[11px] font-semibold border rounded-xl transition-all cursor-pointer text-left ${
                            isActive
                              ? 'border-[var(--ivory-accent)] bg-[var(--ivory-accent-light)] text-[var(--ivory-text)] shadow-[var(--shadow-xs)]'
                              : 'border-[var(--ivory-border)]/60 bg-[var(--ivory-bg)] hover:bg-[var(--ivory-surface)] text-[var(--ivory-text-2)] hover:text-[var(--ivory-text)]'
                          }`}
                        >
                          {prov}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ivory-text-3)]">Duration</span>
                  <div className="grid grid-cols-2 gap-2">
                    {['5 seconds', '10 seconds'].map(dur => {
                      const isActive = videoDuration === dur
                      return (
                        <button
                          key={dur}
                          type="button"
                          onClick={() => setVideoDuration(dur)}
                          className={`py-2 px-2 text-[10px] font-semibold border rounded-xl transition-all cursor-pointer text-center ${
                            isActive
                              ? 'border-[var(--ivory-accent)] bg-[var(--ivory-accent-light)] text-[var(--ivory-text)] shadow-[var(--shadow-xs)]'
                              : 'border-[var(--ivory-border)]/60 bg-[var(--ivory-bg)] hover:bg-[var(--ivory-surface)] text-[var(--ivory-text-2)] hover:text-[var(--ivory-text)]'
                          }`}
                        >
                          {dur}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {videoProvider !== 'Mock Offline Creator' && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl text-amber-900 text-[10px] leading-relaxed flex flex-col gap-1.5">
                    <span>⚠️ <strong>{videoProvider}</strong> requires setup or is mock-only. Go to settings to set API credentials, or use <strong>Mock Offline Creator</strong>.</span>
                    <button
                      type="button"
                      onClick={() => navigate('/settings/providers')}
                      className="py-1 px-2.5 text-[9px] font-bold border border-amber-500/30 rounded-lg hover:bg-amber-500/15 text-amber-950 transition-colors w-fit cursor-pointer"
                    >
                      Configure Providers
                    </button>
                  </div>
                )}
              </div>
            )}

            {selectedCard === 'generate_music' && (
              <div className="space-y-4 pt-1">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ivory-text-3)]">Music Engine</span>
                  <div className="flex flex-col gap-1.5">
                    {['Mock Offline Creator', 'Google Lyria'].map(prov => {
                      const isActive = musicProvider === prov
                      return (
                        <button
                          key={prov}
                          type="button"
                          onClick={() => setMusicProvider(prov)}
                          className={`py-2 px-3 text-[11px] font-semibold border rounded-xl transition-all cursor-pointer text-left ${
                            isActive
                              ? 'border-[var(--ivory-accent)] bg-[var(--ivory-accent-light)] text-[var(--ivory-text)] shadow-[var(--shadow-xs)]'
                              : 'border-[var(--ivory-border)]/60 bg-[var(--ivory-bg)] hover:bg-[var(--ivory-surface)] text-[var(--ivory-text-2)] hover:text-[var(--ivory-text)]'
                          }`}
                        >
                          {prov}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ivory-text-3)]">Style & Mood</span>
                  <div className="grid grid-cols-2 gap-2">
                    {['Upbeat', 'Ambient', 'Lo-Fi', 'Cinematic'].map(style => {
                      const isActive = musicStyle === style
                      return (
                        <button
                          key={style}
                          type="button"
                          onClick={() => setMusicStyle(style)}
                          className={`py-2 px-2 text-[10px] font-semibold border rounded-xl transition-all cursor-pointer text-center ${
                            isActive
                              ? 'border-[var(--ivory-accent)] bg-[var(--ivory-accent-light)] text-[var(--ivory-text)] shadow-[var(--shadow-xs)]'
                              : 'border-[var(--ivory-border)]/60 bg-[var(--ivory-bg)] hover:bg-[var(--ivory-surface)] text-[var(--ivory-text-2)] hover:text-[var(--ivory-text)]'
                          }`}
                        >
                          {style}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {musicProvider !== 'Mock Offline Creator' && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl text-amber-900 text-[10px] leading-relaxed flex flex-col gap-1.5">
                    <span>⚠️ <strong>{musicProvider}</strong> requires setup or is mock-only. Go to settings to set API credentials, or use <strong>Mock Offline Creator</strong>.</span>
                    <button
                      type="button"
                      onClick={() => navigate('/settings/providers')}
                      className="py-1 px-2.5 text-[9px] font-bold border border-amber-500/30 rounded-lg hover:bg-amber-500/15 text-amber-950 transition-colors w-fit cursor-pointer"
                    >
                      Configure Providers
                    </button>
                  </div>
                )}
              </div>
            )}

            {selectedCard === 'analyze_file' && (
              <div className="space-y-2 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ivory-text-3)]">File Category</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {['Document (PDF/TXT)', 'Data (CSV/JSON)', 'Image (PNG/JPG)'].map(type => {
                    const isActive = fileType === type
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFileType(type)}
                        className={`py-2 px-1 text-[8.5px] font-bold border rounded-xl transition-all cursor-pointer text-center ${
                          isActive
                            ? 'border-[var(--ivory-accent)] bg-[var(--ivory-accent-light)] text-[var(--ivory-text)] shadow-[var(--shadow-xs)]'
                            : 'border-[var(--ivory-border)]/60 bg-[var(--ivory-bg)] hover:bg-[var(--ivory-surface)] text-[var(--ivory-text-2)] hover:text-[var(--ivory-text)]'
                        }`}
                      >
                        {type.split(' ')[0]}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {selectedCard === 'analyze_screen_video' && (
              <div className="space-y-2 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ivory-text-3)]">Capture Input</span>
                <div className="grid grid-cols-3 gap-2">
                  {['Main Display', 'Active Window', 'Camera'].map(target => {
                    const isActive = screenTarget === target
                    return (
                      <button
                        key={target}
                        type="button"
                        onClick={() => setScreenTarget(target)}
                        className={`py-2 px-1 text-[9px] font-semibold border rounded-xl transition-all cursor-pointer text-center ${
                          isActive
                            ? 'border-[var(--ivory-accent)] bg-[var(--ivory-accent-light)] text-[var(--ivory-text)] shadow-[var(--shadow-xs)]'
                            : 'border-[var(--ivory-border)]/60 bg-[var(--ivory-bg)] hover:bg-[var(--ivory-surface)] text-[var(--ivory-text-2)] hover:text-[var(--ivory-text)]'
                        }`}
                      >
                        {target}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {selectedCard === 'connect_apps' && (
              <div className="space-y-2 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ivory-text-3)]">Application Connector</span>
                <div className="grid grid-cols-2 gap-2">
                  {['Gmail', 'Google Drive', 'Slack', 'GitHub'].map(target => {
                    const isActive = connectorTarget === target
                    return (
                      <button
                        key={target}
                        type="button"
                        onClick={() => setConnectorTarget(target)}
                        className={`py-2 px-3 text-[11px] font-semibold border rounded-xl transition-all cursor-pointer ${
                          isActive
                            ? 'border-[var(--ivory-accent)] bg-[var(--ivory-accent-light)] text-[var(--ivory-text)] shadow-[var(--shadow-xs)]'
                            : 'border-[var(--ivory-border)]/60 bg-[var(--ivory-bg)] hover:bg-[var(--ivory-surface)] text-[var(--ivory-text-2)] hover:text-[var(--ivory-text)]'
                        }`}
                      >
                        {target}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {selectedCard === 'automate_workflow' && (
              <div className="space-y-2 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ivory-text-3)]">Trigger Source</span>
                <div className="grid grid-cols-2 gap-2">
                  {['Time schedule', 'File update', 'Web hook', 'Manual'].map(trigger => {
                    const isActive = triggerType === trigger
                    return (
                      <button
                        key={trigger}
                        type="button"
                        onClick={() => setTriggerType(trigger)}
                        className={`py-2 px-2 text-[10px] font-semibold border rounded-xl transition-all cursor-pointer ${
                          isActive
                            ? 'border-[var(--ivory-accent)] bg-[var(--ivory-accent-light)] text-[var(--ivory-text)] shadow-[var(--shadow-xs)]'
                            : 'border-[var(--ivory-border)]/60 bg-[var(--ivory-bg)] hover:bg-[var(--ivory-surface)] text-[var(--ivory-text-2)] hover:text-[var(--ivory-text)]'
                        }`}
                      >
                        {trigger}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="space-y-1.5 flex flex-col">
              <label
                htmlFor="studio-prompt-input"
                className="text-[10px] font-bold uppercase tracking-wider text-[var(--ivory-text-3)]"
              >
                Starter Prompt
              </label>
              <textarea
                id="studio-prompt-input"
                data-testid="studio-prompt-input"
                placeholder="Enter or customize starter prompt..."
                className="w-full h-24 p-3 text-[12px] border border-[var(--ivory-border)] rounded-xl bg-[var(--ivory-bg)] text-[var(--ivory-text)] focus:outline-none focus:ring-1 focus:ring-[var(--ivory-accent)]/50 resize-none font-body"
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleStartTask()
                  }
                }}
              />
            </div>

            {orchestration ? (
              <div className="space-y-4 pt-3 border-t border-[var(--ivory-border)]">
                {orchestration.plannedSteps && orchestration.plannedSteps.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ivory-text-3)]">Execution Plan</span>
                    <ul className="list-disc pl-4 text-[11px] text-[var(--ivory-text-2)] mt-1.5 space-y-1">
                      {orchestration.plannedSteps.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {orchestration.safetyWarnings && orchestration.safetyWarnings.length > 0 && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl text-amber-900 text-[11px] leading-relaxed">
                    <span className="font-semibold block mb-1">Safety Warnings:</span>
                    <ul className="list-disc pl-4 space-y-0.5">
                      {orchestration.safetyWarnings.map((warn, idx) => (
                        <li key={idx}>{warn}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {orchestration.missingCapabilities && orchestration.missingCapabilities.length > 0 && (
                  <div className="p-3 bg-red-500/10 border border-red-500/25 rounded-xl text-red-900 text-[11px] leading-relaxed flex flex-col gap-2">
                    <div>
                      <span className="font-semibold block mb-1">Missing Capabilities:</span>
                      <p className="text-[11px]">
                        Needs setup for: {orchestration.missingCapabilities.join(', ')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(orchestration.missingCapabilities.some(c => c.toLowerCase().includes('gmail') || c.toLowerCase().includes('github') || c.toLowerCase().includes('slack') || c.toLowerCase().includes('google')) ? '/settings/connectors' : '/settings/providers')}
                      className="inline-flex items-center justify-center h-7 px-3 text-[10px] font-bold border border-red-500/30 hover:bg-red-500/10 rounded-lg text-red-900 transition-colors w-fit cursor-pointer"
                    >
                      Go Configure Setup
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-[12px] text-[var(--ivory-text-3)] animate-pulse py-4 flex items-center justify-center">
                Orchestrating flow parameters...
              </div>
            )}

            <div className="pt-4 border-t border-[var(--ivory-border)] shrink-0">
              <button
                type="button"
                onClick={handleStartTask}
                disabled={!orchestration}
                data-testid="studio-start-flow-btn"
                className="w-full h-10 bg-[var(--ivory-accent)] hover:bg-[var(--ivory-accent-hover)] text-white text-[12px] font-bold rounded-xl shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Start Task Flow <ArrowRight size={13} />
              </button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
