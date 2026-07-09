import React from 'react'
import { MessageSquare } from 'lucide-react'
import { useChatStore } from '../../stores/chatStore'

interface ChatListProps {
  onSelectChat: (id: string) => void
}

export function ChatList({ onSelectChat }: ChatListProps): React.ReactElement {
  const { chats, activeChatId, isLoadingChats } = useChatStore()

  if (isLoadingChats) {
    return (
      <div className="px-3 py-4 text-center">
        <span className="text-xs text-[var(--ivory-text-3)]">Loading chats...</span>
      </div>
    )
  }

  if (chats.length === 0) {
    return (
      <div className="px-3 py-8 text-center">
        <p className="text-xs text-[var(--ivory-text-3)]">No chats yet</p>
      </div>
    )
  }

  return (
    <div className="py-2 space-y-1">
      {chats.map((chat) => {
        const isActive = activeChatId === chat.id
        return (
        <button
          key={chat.id}
          onClick={() => onSelectChat(chat.id)}
          className={`text-left px-3 py-2 rounded-xl transition duration-[var(--transition-fast)] mx-2 w-[calc(100%-16px)] block cursor-pointer
            ${isActive
              ? 'bg-[var(--ivory-active-bg)] text-[var(--ivory-text)] font-semibold shadow-[var(--shadow-xs)]'
              : 'text-[var(--ivory-text-2)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)]'}`}
        >
          <div className="flex items-start gap-2.5">
            <MessageSquare size={14} className={`mt-1 shrink-0 ${isActive ? 'text-[var(--ivory-accent)]' : 'text-[var(--ivory-text-3)]'}`} />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] text-[var(--ivory-text)] truncate font-medium">
                {chat.title}
              </p>
              {chat.last_message_preview && (
                <p className="text-[11px] text-[var(--ivory-text-3)] truncate mt-0.5">
                  {chat.last_message_preview}
                </p>
              )}
              <p className="text-[10px] text-[var(--ivory-text-3)] mt-0.5">
                {new Date(chat.updated_at).toLocaleDateString()}
                {chat.message_count > 0 && ` · ${chat.message_count} msgs`}
              </p>
            </div>
          </div>
        </button>
        )
      })}
    </div>
  )
}
