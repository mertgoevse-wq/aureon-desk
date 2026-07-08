import React from 'react'
import {
  CalendarClock,
  CheckCircle2,
  Code2,
  FileText,
  Lightbulb,
  LockKeyhole,
  MessageSquare,
  SendHorizontal,
  SlidersHorizontal
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const workflowCards = [
  {
    title: 'Scheduled',
    description: 'Plan recurring checks, reminders, and future agent runs.',
    icon: <CalendarClock size={17} />,
    status: 'Placeholder'
  },
  {
    title: 'Dispatch',
    description: 'Queue multi-step work for an assistant once task execution is wired.',
    icon: <SendHorizontal size={17} />,
    status: 'Placeholder'
  },
  {
    title: 'Ideas',
    description: 'Capture rough product, prompt, and project ideas before turning them into chats.',
    icon: <Lightbulb size={17} />,
    status: 'Placeholder'
  },
  {
    title: 'Customize',
    description: 'Keep workspace preferences, house style, and project defaults in one place.',
    icon: <SlidersHorizontal size={17} />,
    status: 'Placeholder'
  }
]

export function CoworkPage(): React.ReactElement {
  const navigate = useNavigate()

  return (
    <div className="h-full overflow-y-auto bg-[var(--ivory-bg)]" data-testid="cowork-page">
      <div className="max-w-6xl mx-auto px-6 py-7">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--ivory-border)] bg-[var(--ivory-elevated)] text-[11px] font-semibold text-[var(--ivory-text-3)] mb-3">
              <CheckCircle2 size={13} className="text-[var(--ivory-accent)]" />
              Safe workflow shell
            </div>
            <h1 className="text-[30px] font-semibold tracking-tight text-[var(--ivory-text)] display-text">
              Cowork
            </h1>
            <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[var(--ivory-text-3)]">
              A dedicated space for task planning, dispatch queues, and future desktop assistance. Unsupported automation is shown as a placeholder until explicit permission and implementation exist.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex h-10 items-center gap-2 rounded-2xl border border-[var(--ivory-border)] bg-[var(--ivory-elevated)] px-4 text-[12px] font-semibold text-[var(--ivory-text-2)] shadow-[var(--shadow-xs)] transition-colors hover:bg-[var(--ivory-surface)] hover:text-[var(--ivory-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35"
            >
              <MessageSquare size={14} />
              New chat from task
            </button>
            <button
              type="button"
              onClick={() => navigate('/preview')}
              className="inline-flex h-10 items-center gap-2 rounded-2xl border border-[var(--ivory-border)] bg-[var(--ivory-elevated)] px-4 text-[12px] font-semibold text-[var(--ivory-text-2)] shadow-[var(--shadow-xs)] transition-colors hover:bg-[var(--ivory-surface)] hover:text-[var(--ivory-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/35"
            >
              <Code2 size={14} />
              Open Code
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
          {workflowCards.map((card) => (
            <section
              key={card.title}
              className="rounded-[24px] border border-[var(--ivory-border)] bg-[var(--ivory-elevated)] p-4 shadow-[var(--shadow-sm)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="w-9 h-9 rounded-2xl bg-[var(--ivory-accent-light)] text-[var(--ivory-accent)] flex items-center justify-center">
                  {card.icon}
                </div>
                <span className="rounded-full border border-[var(--ivory-border)] bg-[var(--ivory-bg)] px-2 py-1 text-[10px] font-semibold text-[var(--ivory-text-3)]">
                  {card.status}
                </span>
              </div>
              <h2 className="mt-4 text-[14px] font-semibold text-[var(--ivory-text)]">{card.title}</h2>
              <p className="mt-2 text-[12px] leading-relaxed text-[var(--ivory-text-3)]">{card.description}</p>
            </section>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4">
          <section className="rounded-[28px] border border-[var(--ivory-border)] bg-[var(--ivory-elevated)] p-5 shadow-[var(--shadow-md)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-[var(--ivory-surface)] border border-[var(--ivory-border)] flex items-center justify-center text-[var(--ivory-accent)]">
                <FileText size={17} />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-[var(--ivory-text)]">Task brief</h2>
                <p className="text-[11px] text-[var(--ivory-text-3)]">Use Chat mode for execution until the queue is implemented.</p>
              </div>
            </div>
            <div className="rounded-[22px] border border-dashed border-[var(--ivory-border)] bg-[var(--ivory-bg)] p-5">
              <p className="text-[13px] leading-relaxed text-[var(--ivory-text-2)]">
                Cowork is intentionally a planning surface right now. It keeps the desktop layout in place without pretending that background agents, browser use, or computer use are enabled.
              </p>
            </div>
          </section>

          <section className="rounded-[28px] border border-[var(--ivory-border)] bg-[var(--ivory-elevated)] p-5 shadow-[var(--shadow-md)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-[var(--ivory-surface)] border border-[var(--ivory-border)] flex items-center justify-center text-[var(--ivory-accent)]">
                <LockKeyhole size={17} />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-[var(--ivory-text)]">Permissions</h2>
                <p className="text-[11px] text-[var(--ivory-text-3)]">Desktop control is not active.</p>
              </div>
            </div>
            <div className="space-y-2">
              {['Browser Use', 'Computer Use', 'Accessibility', 'Screen Recording'].map((label) => (
                <div key={label} className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--ivory-border)] bg-[var(--ivory-bg)] px-3 py-2.5">
                  <span className="text-[12px] font-semibold text-[var(--ivory-text-2)]">{label}</span>
                  <span className="rounded-full bg-[var(--ivory-surface-2)] px-2 py-1 text-[10px] font-semibold text-[var(--ivory-text-3)]">Off</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
