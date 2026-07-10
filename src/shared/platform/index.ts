/**
 * Vibeforge — Platform Adapter Factory
 *
 * Returns the correct adapter for the current runtime:
 *   - Electron renderer → DesktopAdapter
 *   - Capacitor / mobile web → MobileAdapter
 *
 * The adapter is lazy-loaded so the desktop build never imports mobile-only
 * code and vice versa.
 */

import type { PlatformAdapter } from './platform-adapter'

let adapter: PlatformAdapter | null = null

function isCapacitor(): boolean {
  return typeof window !== 'undefined' && !!(window as any).Capacitor
}

function isElectron(): boolean {
  return typeof window !== 'undefined' && !!(window as any).api
}

export async function getPlatformAdapter(): Promise<PlatformAdapter> {
  if (adapter) return adapter

  if (isElectron()) {
    const { DesktopAdapter } = await import('./desktop-adapter')
    adapter = new DesktopAdapter()
  } else {
    const { MobileAdapter } = await import('./mobile-adapter')
    adapter = new MobileAdapter()
  }

  return adapter
}

export function getPlatformAdapterSync(): PlatformAdapter {
  if (adapter) return adapter
  throw new Error('Platform adapter not initialized. Call getPlatformAdapter() first.')
}

export function resetPlatformAdapter(): void {
  adapter = null
}
