import React from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import { User, Sparkles } from 'lucide-react'
import type { MessageRow } from '@shared/types/chat'

interface MessageBubbleProps {
  message: MessageRow
}

export function MessageBubble({ message }: MessageBubbleProps): React.ReactElement {
  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'
  const isSystem = message.role === 'system'
  const isTool = message.role === 'tool'

  if (isSystem) {
    return (
      <div className="px-4 py-1.5 mx-auto max-w-3xl">
        <div className="text-xs text-[var(--ivory-text-3)] italic py-1 px-2 border-l-2 border-[var(--ivory-border-2)]">
          System: {message.content}
        </div>
      </div>
    )
  }

  if (isTool) {
    return (
      <div className="px-4 py-1 mx-auto max-w-3xl">
        <div className="text-xs bg-[var(--ivory-surface)] text-[var(--ivory-text-2)] rounded-[var(--radius-md)] p-2 border border-[var(--ivory-border)] font-mono whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className={`px-4 py-3 animate-in ${isUser ? '' : 'bg-[var(--ivory-bg)]'}`}>
      <div className="mx-auto max-w-3xl flex gap-3">
        {/* Avatar */}
        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5
          ${isUser
            ? 'bg-[var(--ivory-accent)] text-white'
            : 'bg-[var(--ivory-surface-3)] text-[var(--ivory-text-2)]'}`}
        >
          {isUser ? <User size={14} /> : <Sparkles size={14} />}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className={`text-sm leading-relaxed ${isAssistant ? 'prose' : ''}`}>
            {isAssistant ? (
              <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                {message.content}
              </ReactMarkdown>
            ) : (
              <p className="text-[var(--ivory-text)]">{message.content}</p>
            )}
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-[var(--ivory-text-3)]">
              {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {message.token_count && (
              <span className="text-[10px] text-[var(--ivory-text-3)]">
                {message.token_count} tokens
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
