import React, { memo, useCallback, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import { User, Sparkles, Copy, Check } from 'lucide-react'
import type { MessageRow } from '@shared/types/chat'

interface MessageBubbleProps {
  message: MessageRow
}

export const MessageBubble = memo(function MessageBubble({ message }: MessageBubbleProps): React.ReactElement {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for environments without clipboard API
      const textarea = document.createElement('textarea')
      textarea.value = message.content
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [message.content])
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
          <div className={`text-sm leading-relaxed break-words overflow-hidden ${isAssistant ? 'prose max-w-full' : 'whitespace-pre-wrap'}`}>
            {isUser ? (
              <p className="text-[var(--ivory-text)] break-words whitespace-pre-wrap">{message.content}</p>
            ) : (
              <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                {message.content}
              </ReactMarkdown>
            )}
          </div>

          {/* Copy button (assistant messages only) */}
          {isAssistant && (
            <div className="flex items-center justify-end mt-1">
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-[10px] text-[var(--ivory-text-3)] hover:text-[var(--ivory-text-2)] transition-colors px-1 py-0.5 rounded hover:bg-[var(--ivory-surface)]"
                aria-label={copied ? 'Copied' : 'Copy message'}
                title={copied ? 'Copied!' : 'Copy message'}
              >
                {copied ? <Check size={10} className="text-green-600" /> : <Copy size={10} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          )}

          {/* Metadata */}
          <div className="flex items-center gap-2 mt-0.5">
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
})
