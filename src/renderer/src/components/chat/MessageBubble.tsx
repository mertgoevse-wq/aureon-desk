import React, { memo, useCallback, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import { Sparkles, Copy, Check, Server } from 'lucide-react'
import type { MessageRow } from '@shared/types/chat'
import { parseArtifactsFromContent } from '@shared/artifacts'
import { ArtifactCard } from '../artifacts/ArtifactCard'

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

  // Parse code blocks into artifacts for assistant messages
  const { artifacts, cleanedContent } = useMemo(() => {
    if (isAssistant) {
      return parseArtifactsFromContent(message.content)
    }
    return { artifacts: [], cleanedContent: message.content }
  }, [message.content, isAssistant])
  const providerModelLabel = message.provider_name && message.model_label
    ? `${message.provider_name} · ${message.model_label}`
    : message.model_label || message.provider_name || null

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

  if (isUser) {
    return (
      <div className="px-4 py-3 animate-in">
        <div className="mx-auto max-w-3xl flex justify-end">
          <div className="max-w-[82%] rounded-[22px] rounded-br-[8px] bg-[var(--ivory-elevated)] border border-[var(--ivory-border)] px-4 py-3 shadow-[var(--shadow-xs)]">
            <div className="text-sm leading-relaxed text-[var(--ivory-text)] break-words whitespace-pre-wrap overflow-hidden">
              {message.content}
            </div>
            <div className="flex items-center justify-end gap-2 mt-1.5">
              <span className="text-[10px] text-[var(--ivory-text-3)]">
                {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-4 animate-in">
      <div className="mx-auto max-w-3xl flex gap-3">
        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-[var(--ivory-accent-light)] text-[var(--ivory-accent)] ring-1 ring-[var(--ivory-accent)]/10">
          <Sparkles size={14} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-[var(--ivory-text-2)]">Aureon</span>
            <span className="text-[10px] text-[var(--ivory-text-3)]">
              {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {message.token_count && (
              <span className="text-[10px] text-[var(--ivory-text-3)]">
                {message.token_count} tokens
              </span>
            )}
            {providerModelLabel && (
              <span
                className="inline-flex items-center gap-1 rounded-full border border-[var(--ivory-border)] bg-[var(--ivory-surface)] px-2 py-0.5 text-[10px] font-medium text-[var(--ivory-text-3)]"
                title={message.adapter_type ? `Adapter: ${message.adapter_type}` : undefined}
                data-testid="assistant-provider-model"
              >
                <Server size={9} />
                {providerModelLabel}
                {message.latency_ms ? ` · ${message.latency_ms}ms` : ''}
              </span>
            )}
          </div>

          <div className={`text-sm leading-relaxed break-words overflow-hidden ${isAssistant ? 'prose max-w-full' : 'whitespace-pre-wrap'}`}>
            {cleanedContent ? (
              <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                {cleanedContent}
              </ReactMarkdown>
            ) : artifacts.length > 0 ? null : (
              <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                {message.content}
              </ReactMarkdown>
            )}
          </div>

          {/* Rendered Artifacts (code blocks, prompts, etc.) */}
          {artifacts.length > 0 && (
            <div className="mt-2 space-y-2">
              {artifacts.map((artifact) => (
                <ArtifactCard
                  key={artifact.id}
                  artifact={artifact}
                  handlers={{
                    onCopy: () => {},
                  }}
                />
              ))}
            </div>
          )}

          {isAssistant && (
            <div className="flex items-center justify-start mt-2">
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 text-[10px] font-medium text-[var(--ivory-text-3)] hover:text-[var(--ivory-text-2)] transition-colors px-2 py-1 rounded-full hover:bg-[var(--ivory-surface)]"
                aria-label={copied ? 'Copied' : 'Copy message'}
                title={copied ? 'Copied!' : 'Copy message'}
              >
                {copied ? <Check size={10} className="text-green-600" /> : <Copy size={10} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})
