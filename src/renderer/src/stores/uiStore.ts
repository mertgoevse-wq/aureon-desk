import { create } from 'zustand'

interface UIState {
  sidebarCollapsed: boolean
  inspectorOpen: boolean
  sidebarWidth: number
  inspectorWidth: number
  activeSettingsPage: string | null
  isOnboarding: boolean

  toggleSidebar: () => void
  toggleInspector: () => void
  setSidebarWidth: (width: number) => void
  setInspectorWidth: (width: number) => void
  setActiveSettingsPage: (page: string | null) => void
  setIsOnboarding: (onboarding: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  inspectorOpen: true,
  sidebarWidth: 280,
  inspectorWidth: 340,
  activeSettingsPage: null,
  isOnboarding: false,

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  toggleInspector: () => set((s) => ({ inspectorOpen: !s.inspectorOpen })),
  setSidebarWidth: (width) => set({ sidebarWidth: Math.max(200, Math.min(500, width)) }),
  setInspectorWidth: (width) => set({ inspectorWidth: Math.max(260, Math.min(600, width)) }),
  setActiveSettingsPage: (page) => set({ activeSettingsPage: page }),
  setIsOnboarding: (onboarding) => set({ isOnboarding: onboarding })
}))
