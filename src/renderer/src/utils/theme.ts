/**
 * Theme utility — applies and persists the color theme (light/dark).
 * Extracted from GeneralSettingsPage to avoid layout→page circular imports.
 */

/** Apply theme to the root element and persist it */
export function applyTheme(mode: string): void {
  const root = document.documentElement
  if (mode === 'dark') {
    root.setAttribute('data-theme', 'dark')
  } else {
    root.removeAttribute('data-theme')
  }
  try {
    window.api?.settingsSet('ui.theme', mode)
  } catch { /* settings may not be ready */ }
}

/** Load persisted theme on mount (call once on app startup) */
export async function loadPersistedTheme(): Promise<void> {
  try {
    if (!window.api) return
    const saved = await window.api.settingsGet('ui.theme')
    if (saved && saved !== 'ivory') {
      applyTheme(saved)
    }
  } catch { /* settings may not be available */ }
}
