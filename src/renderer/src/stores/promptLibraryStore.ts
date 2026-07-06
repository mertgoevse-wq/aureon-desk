import { create } from 'zustand'
import type { PromptRow } from '@shared/types/prompt'

interface PromptLibraryState {
  prompts: PromptRow[]
  allTags: string[]
  allCategories: string[]
  searchQuery: string
  selectedTags: string[]
  selectedCategory: string | null
  favoritesOnly: boolean
  isLoading: boolean

  setPrompts: (prompts: PromptRow[]) => void
  setAllTags: (tags: string[]) => void
  setAllCategories: (categories: string[]) => void
  setSearchQuery: (query: string) => void
  toggleTag: (tag: string) => void
  setSelectedCategory: (category: string | null) => void
  toggleFavoritesOnly: () => void
  addPrompt: (prompt: PromptRow) => void
  updatePrompt: (id: string, updates: Partial<PromptRow>) => void
  removePrompt: (id: string) => void
  setLoading: (loading: boolean) => void
  clearFilters: () => void
}

export const usePromptLibraryStore = create<PromptLibraryState>((set) => ({
  prompts: [],
  allTags: [],
  allCategories: [],
  searchQuery: '',
  selectedTags: [],
  selectedCategory: null,
  favoritesOnly: false,
  isLoading: false,

  setPrompts: (prompts) => set({ prompts }),
  setAllTags: (tags) => set({ allTags: tags }),
  setAllCategories: (categories) => set({ allCategories: categories }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  toggleTag: (tag) => set((state) => ({
    selectedTags: state.selectedTags.includes(tag)
      ? state.selectedTags.filter(t => t !== tag)
      : [...state.selectedTags, tag]
  })),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  toggleFavoritesOnly: () => set((state) => ({ favoritesOnly: !state.favoritesOnly })),
  addPrompt: (prompt) => set((state) => ({ prompts: [...state.prompts, prompt] })),
  updatePrompt: (id, updates) => set((state) => ({
    prompts: state.prompts.map(p => p.id === id ? { ...p, ...updates } : p)
  })),
  removePrompt: (id) => set((state) => ({
    prompts: state.prompts.filter(p => p.id !== id)
  })),
  setLoading: (loading) => set({ isLoading: loading }),
  clearFilters: () => set({ searchQuery: '', selectedTags: [], selectedCategory: null, favoritesOnly: false })
}))
