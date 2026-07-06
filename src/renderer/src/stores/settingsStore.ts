import { create } from 'zustand'
import type { AppSettings } from '@shared/types/settings'
import { DEFAULT_SETTINGS } from '@shared/types/settings'

interface SettingsState {
  settings: AppSettings
  isLoaded: boolean

  setSettings: (settings: Partial<AppSettings>) => void
  setLoaded: (loaded: boolean) => void
  resetToDefaults: () => void
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: { ...DEFAULT_SETTINGS },
  isLoaded: false,

  setSettings: (partial) => set((state) => ({
    settings: { ...state.settings, ...partial }
  })),
  setLoaded: (loaded) => set({ isLoaded: loaded }),
  resetToDefaults: () => set({ settings: { ...DEFAULT_SETTINGS } })
}))
