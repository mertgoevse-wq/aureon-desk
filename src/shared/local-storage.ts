/**
 * Vibeforge — Safe localStorage helpers
 *
 * Guards against environments where `localStorage` is not defined
 * (e.g. Vitest, Node, SSR).
 */

export function safeLocalStorageGet(key: string): string | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null
  } catch {
    return null
  }
}

export function safeLocalStorageSet(key: string, value: string): void {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, value)
  } catch { /* ignore */ }
}

export function safeLocalStorageRemove(key: string): void {
  try {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(key)
  } catch { /* ignore */ }
}
