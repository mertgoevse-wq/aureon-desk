import React from 'react'
import { HelpCircle, KeyRound, Cpu, FolderOpen, Monitor, Package, Globe, ShieldCheck } from 'lucide-react'

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

/**
 * Beginner-friendly help blocks explaining key concepts.
 * Used on the Vibe Coding page to help non-programmers understand the app.
 */
export function BeginnerHelp(): React.ReactElement {
  return (
    <div className="rounded-2xl border border-[var(--ivory-border)]/60 bg-[var(--ivory-surface)]/60 p-4" data-testid="beginner-help">
      <div className="flex items-center gap-2 mb-3">
        <HelpCircle size={15} className="text-[var(--ivory-accent)]" />
        <h3 className="text-[13px] font-bold text-[var(--ivory-text)]">Beginner's Guide</h3>
      </div>
      <div className="space-y-2.5">
        {HELP_BLOCKS.map((block, i) => (
          <details key={i} className="group rounded-xl border border-[var(--ivory-border)]/50 bg-[var(--ivory-elevated)] overflow-hidden" data-testid={`help-${i}`}>
            <summary className="flex items-center gap-2 px-3 py-2.5 cursor-pointer text-[12px] font-semibold text-[var(--ivory-text-2)] hover:text-[var(--ivory-text)] transition-colors list-none">
              <span className="text-[var(--ivory-accent)] shrink-0">{block.icon}</span>
              <span>{block.question}</span>
              <span className="ml-auto text-[10px] text-[var(--ivory-text-3)] group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="px-3 pb-3 pt-1 text-[11px] text-[var(--ivory-text-2)] leading-relaxed border-t border-[var(--ivory-border)]/30">
              {block.answer}
            </div>
          </details>
        ))}
      </div>
    </div>
  )
}
