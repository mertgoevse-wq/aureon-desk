import { create } from 'zustand'
import type { ChatListItem, ChatWithMessages, MessageRow, NewMessage } from '@shared/types/chat'

interface ChatState {
  chats: ChatListItem[]
  activeChatId: string | null
  activeChat: ChatWithMessages | null
  isLoadingChats: boolean
  isLoadingMessages: boolean

  setChats: (chats: ChatListItem[]) => void
  setActiveChatId: (id: string | null) => void
  setActiveChat: (chat: ChatWithMessages | null) => void
  addMessage: (message: MessageRow) => void
  updateChatInList: (id: string, updates: Partial<ChatListItem>) => void
  removeChatFromList: (id: string) => void
  setLoadingChats: (loading: boolean) => void
  setLoadingMessages: (loading: boolean) => void
}

export const useChatStore = create<ChatState>((set) => ({
  chats: [],
  activeChatId: null,
  activeChat: null,
  isLoadingChats: false,
  isLoadingMessages: false,

  setChats: (chats) => set({ chats }),
  setActiveChatId: (id) => set({ activeChatId: id }),
  setActiveChat: (chat) => set({ activeChat: chat }),
  addMessage: (message) => set((state) => {
    if (!state.activeChat) return state
    return {
      activeChat: {
        ...state.activeChat,
        messages: [...state.activeChat.messages, message]
      }
    }
  }),
  updateChatInList: (id, updates) => set((state) => ({
    chats: state.chats.map((c) => (c.id === id ? { ...c, ...updates } : c))
  })),
  removeChatFromList: (id) => set((state) => ({
    chats: state.chats.filter((c) => c.id !== id),
    activeChatId: state.activeChatId === id ? null : state.activeChatId,
    activeChat: state.activeChatId === id ? null : state.activeChat
  })),
  setLoadingChats: (loading) => set({ isLoadingChats: loading }),
  setLoadingMessages: (loading) => set({ isLoadingMessages: loading })
}))
