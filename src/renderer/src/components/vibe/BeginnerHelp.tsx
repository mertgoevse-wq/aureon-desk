import React, { useState } from 'react'
import { HelpCircle, KeyRound, Cpu, FolderOpen, Monitor, Package, ShieldCheck, Shield, CheckCircle, ChevronDown } from 'lucide-react'

interface HelpBlock {
  icon: React.ReactElement
  question: string
  answer: string
}

const HELP_BLOCKS: HelpBlock[] = [
  {
    icon: <KeyRound size={15} />,
    question: 'What is a provider?',
    answer: 'A provider is the company or service that runs the AI model. Examples: OpenAI (ChatGPT), Anthropic (Claude), Google (Gemini), or OpenRouter (access to many models). You need an API key from a provider to use Aureon Desk.'
  },
  {
    icon: <Cpu size={15} />,
    question: 'What is a model?',
    answer: 'A model is the actual AI brain that responds to your prompts. Different models have different strengths: some are fast, some are smart, some are free. You select a model before starting a chat.'
  },
  {
    icon: <FolderOpen size={15} />,
    question: 'What is a project?',
    answer: 'A project is a folder on your computer that contains your code. Aureon can read files from your project to understand context and help you better. Your files are only sent to the AI when you explicitly use them in a chat.'
  },
  {
    icon: <Monitor size={15} />,
    question: 'What is LivePreview?',
    answer: 'LivePreview lets you see your app running in real time inside Aureon Desk. You can build HTML pages, React apps, or run the Coding Demo. It runs on your computer only — not accessible from the internet.'
  },
  {
    icon: <ShieldCheck size={15} />,
    question: 'What is a safe local folder?',
    answer: 'A safe local folder is a project folder on your computer that Aureon can read from. Sensitive files like .env (API keys), .git folders, and node_modules are automatically excluded. Never put passwords or real API keys in project files — use the secure credential vault in Settings instead.'
  },
  {
    icon: <Shield size={15} />,
    question: 'What should I never paste into chat?',
    answer: 'Never paste real passwords, API keys, credit card numbers, or private credentials into chat. These are sent to the AI provider. Use the secure credential vault in Settings > Providers for API keys. Aureon automatically redacts detected secrets, but you should still be careful.'
  },
  {
    icon: <CheckCircle size={15} />,
    question: 'How do I test before pushing to GitHub?',
    answer: 'Before pushing code: (1) run typecheck to catch errors, (2) run tests to verify nothing is broken, (3) run build to make sure the app compiles, (4) check for secrets with git grep. Aureon can help you with all of these — just ask!'
  },
  {
    icon: <Package size={15} />,
    question: 'What does "build" mean?',
    answer: 'Building turns your code into a runnable app. For web apps, it means creating the HTML/CSS/JS files. For desktop apps, it means packaging them into an installer (.exe). Aureon can help generate and preview code instantly.'
  },
  {
    icon: <ShieldCheck size={15} />,
    question: 'Is it safe to send my code to AI?',
    answer: 'Your chat text and any files you reference are sent to the AI provider. Aureon automatically excludes sensitive files like .env (API keys), .git folders, and node_modules. Never paste passwords or real API keys into chat. Use the secure credential vault in Settings instead.'
  }
]

export function BeginnerHelp(): React.ReactElement {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="rounded-2xl border border-[var(--ivory-border)]/60 bg-[var(--ivory-surface)]/60 p-4" data-testid="beginner-help">
      <div className="flex items-center gap-2 mb-3">
        <HelpCircle size={15} className="text-[var(--ivory-accent)]" />
        <h3 className="text-sm font-bold text-[var(--ivory-text)]">Beginner's Guide</h3>
      </div>
      <div className="space-y-2.5">
        {HELP_BLOCKS.map((block, i) => {
          const isOpen = openIndex === i
          return (
            <div key={i} className="rounded-xl border border-[var(--ivory-border)]/50 bg-[var(--ivory-elevated)] overflow-hidden" data-testid={`help-${i}`}>
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-[var(--ivory-text-2)] hover:text-[var(--ivory-text)] transition-colors text-left focus:outline-none"
              >
                <span className="text-[var(--ivory-accent)] shrink-0">{block.icon}</span>
                <span className="flex-1">{block.question}</span>
                <ChevronDown size={13} className={`text-[var(--ivory-text-3)] shrink-0 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen && (
                <div className="px-3 pb-3 pt-1 text-ui-caption text-[var(--ivory-text-2)] leading-relaxed border-t border-[var(--ivory-border)]/30 animate-fade-in">
                  {block.answer}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
