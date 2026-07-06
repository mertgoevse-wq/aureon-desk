import { create } from 'zustand'
import type { SystemPromptRow } from '@shared/types/prompt'

interface PromptState {
  prompts: SystemPromptRow[]
  isLoading: boolean

  setPrompts: (prompts: SystemPromptRow[]) => void
  addPrompt: (prompt: SystemPromptRow) => void
  updatePrompt: (id: string, updates: Partial<SystemPromptRow>) => void
  removePrompt: (id: string) => void
  setLoading: (loading: boolean) => void
}

export const usePromptStore = create<PromptState>((set) => ({
  prompts: [],
  isLoading: false,

  setPrompts: (prompts) => set({ prompts }),
  addPrompt: (prompt) => set((state) => ({ prompts: [...state.prompts, prompt] })),
  updatePrompt: (id, updates) => set((state) => ({
    prompts: state.prompts.map((p) => (p.id === id ? { ...p, ...updates } : p))
  })),
  removePrompt: (id) => set((state) => ({
    prompts: state.prompts.filter((p) => p.id !== id)
  })),
  setLoading: (loading) => set({ isLoading: loading })
}))
