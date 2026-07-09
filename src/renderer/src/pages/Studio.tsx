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
  const [selectedCard, setSelectedCard] = useState<string | null>(null)
  const [orchestration, setOrchestration] = useState<StudioOrchestrationResult | null>(null)
  const [autonomyLevel, setAutonomyLevel] = useState<AutonomyLevel>(2)
  const [showConfirm, setShowConfirm] = useState(false)
  const activeCard = TASK_CATEGORIES.find(c => c.id === selectedCard)

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
          <div className="grid grid-cols-4 gap-1.5">
            {AUTONOMY_LEVELS.filter(l => l.level > 0).map(level => {
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

      <Drawer
        isOpen={!!selectedCard}
        onClose={() => {
          setSelectedCard(null)
          setOrchestration(null)
          setShowConfirm(false)
        }}
        title={activeCard ? `Studio Task: ${activeCard.label}` : 'Task Details'}
      >
        {activeCard && (
          <div className="space-y-5" data-testid="studio-drawer">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ivory-text-3)]">Recommended Mode</span>
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
