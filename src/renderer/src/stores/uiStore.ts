import { create } from 'zustand'
import { safeLocalStorageGet, safeLocalStorageSet, safeLocalStorageRemove } from '../../../shared/local-storage'

interface UIState {
  sidebarCollapsed: boolean
  inspectorOpen: boolean
  sidebarWidth: number
  inspectorWidth: number
  activeSettingsPage: string | null
  isOnboarding: boolean
  /** When true, hides advanced provider/MCP/debug settings for a cleaner UI */
  simpleMode: boolean
  /** True when the first-run wizard should be shown (vb_first_run_done not set) */
  showFirstRun: boolean

  toggleSidebar: () => void
  toggleInspector: () => void
  setSidebarWidth: (width: number) => void
  setInspectorWidth: (width: number) => void
  setActiveSettingsPage: (page: string | null) => void
  setIsOnboarding: (onboarding: boolean) => void
  toggleSimpleMode: () => void
  setSimpleMode: (simple: boolean) => void
  resetLayout: () => void
  /** Mark first-run wizard as complete — sets localStorage flag */
  dismissFirstRun: () => void
  /** Reset first-run so the wizard shows again (used from Settings → restart onboarding) */
  resetFirstRun: () => void
}

const DEFAULT_SIDEBAR_WIDTH = 232
const DEFAULT_INSPECTOR_WIDTH = 340


export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  inspectorOpen: false,
  sidebarWidth: DEFAULT_SIDEBAR_WIDTH,
  inspectorWidth: DEFAULT_INSPECTOR_WIDTH,
  activeSettingsPage: null,
  isOnboarding: false,
  simpleMode: true, // Simple mode ON by default for cleaner first impression
  showFirstRun: safeLocalStorageGet('vb_first_run_done') !== 'true',

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  toggleInspector: () => set((s) => ({ inspectorOpen: !s.inspectorOpen })),
  toggleSimpleMode: () => set((s) => {
    const next = !s.simpleMode
    try { window.api?.settingsSet('ui.simpleMode', String(next)) } catch { /* */ }
    return { simpleMode: next }
  }),
  setSimpleMode: (simple) => {
    set({ simpleMode: simple })
    try { window.api?.settingsSet('ui.simpleMode', String(simple)) } catch { /* */ }
  },
  setSidebarWidth: (width) => {
    const clamped = Math.max(188, Math.min(500, Math.round(width)))
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
  dismissFirstRun: () => {
    safeLocalStorageSet('vb_first_run_done', 'true')
    set({ showFirstRun: false, isOnboarding: false })
  },
  resetFirstRun: () => {
    safeLocalStorageRemove('vb_first_run_done')
    set({ showFirstRun: true, isOnboarding: true })
  },
  resetLayout: () => {
    set({
      sidebarWidth: DEFAULT_SIDEBAR_WIDTH,
      inspectorWidth: DEFAULT_INSPECTOR_WIDTH,
      sidebarCollapsed: false,
      inspectorOpen: false,
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
    const sm = await window.api.settingsGet('ui.simpleMode')
    const store = useUIStore.getState()
    if (sw) store.setSidebarWidth(Number(sw))
    if (iw) store.setInspectorWidth(Number(iw))
    if (sm !== null && sm !== undefined) store.setSimpleMode(sm === 'true' || sm === true)
  } catch { /* settings may not be available */ }
}
