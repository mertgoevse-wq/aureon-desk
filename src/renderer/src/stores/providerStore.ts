import { create } from 'zustand'
import type { ProviderAdapterInfo, ProviderRow } from '@shared/types/provider'

interface ProviderState {
  providers: ProviderRow[]
  adapters: ProviderAdapterInfo[]
  isLoading: boolean

  setProviders: (providers: ProviderRow[]) => void
  setAdapters: (adapters: ProviderAdapterInfo[]) => void
  updateProvider: (id: string, updates: Partial<ProviderRow>) => void
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
