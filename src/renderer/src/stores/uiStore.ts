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
  resetLayout: () => void
}

const DEFAULT_SIDEBAR_WIDTH = 280
const DEFAULT_INSPECTOR_WIDTH = 340

export const useUIStore = create<UIState>((set, get) => ({
  sidebarCollapsed: false,
  inspectorOpen: true,
  sidebarWidth: DEFAULT_SIDEBAR_WIDTH,
  inspectorWidth: DEFAULT_INSPECTOR_WIDTH,
  activeSettingsPage: null,
  isOnboarding: false,

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  toggleInspector: () => set((s) => ({ inspectorOpen: !s.inspectorOpen })),
  setSidebarWidth: (width) => {
    const clamped = Math.max(200, Math.min(500, Math.round(width)))
    set({ sidebarWidth: clamped })
    // Persist to settings
    try {
      window.api?.settingsSet('ui.sidebarWidth', String(clamped))
    } catch { /* settings may not be ready yet */ }
  },
  setInspectorWidth: (width) => {
    const clamped = Math.max(260, Math.min(600, Math.round(width)))
    set({ inspectorWidth: clamped })
    try {
      window.api?.settingsSet('ui.inspectorWidth', String(clamped))
    } catch { /* settings may not be ready yet */ }
  },
  setActiveSettingsPage: (page) => set({ activeSettingsPage: page }),
  setIsOnboarding: (onboarding) => set({ isOnboarding: onboarding }),
  resetLayout: () => {
    set({
      sidebarWidth: DEFAULT_SIDEBAR_WIDTH,
      inspectorWidth: DEFAULT_INSPECTOR_WIDTH,
      sidebarCollapsed: false,
      inspectorOpen: true,
    })
    try {
      window.api?.settingsSet('ui.sidebarWidth', String(DEFAULT_SIDEBAR_WIDTH))
      window.api?.settingsSet('ui.inspectorWidth', String(DEFAULT_INSPECTOR_WIDTH))
    } catch { /* ignore */ }
  },
}))

/** Load persisted panel sizes from settings (call once on app mount) */
export async function loadPanelSizes(): Promise<void> {
  try {
    if (!window.api) return
    const sw = await window.api.settingsGet('ui.sidebarWidth')
    const iw = await window.api.settingsGet('ui.inspectorWidth')
    const store = useUIStore.getState()
    if (sw) store.setSidebarWidth(Number(sw))
    if (iw) store.setInspectorWidth(Number(iw))
  } catch { /* settings may not be available */ }
}
