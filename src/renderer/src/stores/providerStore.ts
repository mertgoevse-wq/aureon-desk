import { create } from 'zustand'
import type { ProviderAdapterInfo, ProviderRow, ModelRow } from '@shared/types/provider'

interface ProviderState {
  providers: (ProviderRow & { models: ModelRow[] })[]
  adapters: ProviderAdapterInfo[]
  isLoading: boolean

  setProviders: (providers: (ProviderRow & { models: ModelRow[] })[]) => void
  setAdapters: (adapters: ProviderAdapterInfo[]) => void
  updateProvider: (id: string, updates: Partial<ProviderRow & { models: ModelRow[] }>) => void
  setLoading: (loading: boolean) => void
}

export const useProviderStore = create<ProviderState>((set) => ({
  providers: [],
  adapters: [],
  isLoading: false,

  setProviders: (providers) => set({ providers }),
  setAdapters: (adapters) => set({ adapters }),
  updateProvider: (id, updates) => set((state) => ({
    providers: state.providers.map((p) => (p.id === id ? { ...p, ...updates } : p))
  })),
  setLoading: (loading) => set({ isLoading: loading })
}))
