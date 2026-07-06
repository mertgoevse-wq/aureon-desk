import { create } from 'zustand'
import type { SystemPromptRow, ResolvedPrompt } from '@shared/types/prompt'

interface PromptState {
  prompts: SystemPromptRow[]
  resolvedPreview: ResolvedPrompt | null
  isLoading: boolean

  setPrompts: (prompts: SystemPromptRow[]) => void
  addPrompt: (prompt: SystemPromptRow) => void
  updatePrompt: (id: string, updates: Partial<SystemPromptRow>) => void
  removePrompt: (id: string) => void
  archivePrompt: (id: string) => void
  restorePrompt: (id: string) => void
  setResolvedPreview: (preview: ResolvedPrompt | null) => void
  setLoading: (loading: boolean) => void
}

export const usePromptStore = create<PromptState>((set) => ({
  prompts: [],
  resolvedPreview: null,
  isLoading: false,

  setPrompts: (prompts) => set({ prompts }),
  addPrompt: (prompt) => set((state) => ({ prompts: [...state.prompts, prompt] })),
  updatePrompt: (id, updates) => set((state) => ({
    prompts: state.prompts.map((p) => (p.id === id ? { ...p, ...updates } : p))
  })),
  removePrompt: (id) => set((state) => ({
    prompts: state.prompts.filter((p) => p.id !== id)
  })),
  archivePrompt: (id) => set((state) => ({
    prompts: state.prompts.filter((p) => p.id !== id) // Hide from active list
  })),
  restorePrompt: (id) => set((state) => ({
    prompts: state.prompts.map((p) => (p.id === id ? { ...p, is_archived: 0 } : p))
  })),
  setResolvedPreview: (preview) => set({ resolvedPreview: preview }),
  setLoading: (loading) => set({ isLoading: loading })
}))
