/**
 * Vibeforge — Mobile Platform Adapter (Placeholder)
 *
 * This adapter is used by the Capacitor/Android build. It provides graceful
 * fallbacks for desktop-only features and throws clear errors for features that
 * are not yet implemented on mobile.
 */

import type { PlatformAdapter, PreviewSession, NotificationOptions } from './platform-adapter'
import { safeLocalStorageGet, safeLocalStorageSet, safeLocalStorageRemove } from '../local-storage'

export class MobileAdapter implements PlatformAdapter {
  readonly platform = 'mobile' as const

  // File System
  async pickFiles(_options?: { multiple?: boolean; accept?: string }): Promise<string[]> {
    throw new Error('File picker not yet implemented on mobile. Use the companion file picker plugin.')
  }

  async readTextFile(_path: string): Promise<string> {
    throw new Error('Direct file read not yet implemented on mobile.')
  }

  async writeTextFile(_path: string, _content: string): Promise<void> {
    throw new Error('Direct file write not yet implemented on mobile.')
  }

  async deleteFile(_path: string): Promise<void> {
    throw new Error('Direct file delete not yet implemented on mobile.')
  }

  async getSandboxRoot(): Promise<string> {
    // On mobile we use a virtual sandbox path; actual files are stored via
    // Capacitor Filesystem in the app directory.
    return '/sandbox'
  }

  // Storage / Settings
  async getSetting(key: string): Promise<string | null> {
    return safeLocalStorageGet(key)
  }

  async setSetting(key: string, value: string): Promise<void> {
    safeLocalStorageSet(key, value)
  }

  // Credential Vault
  async getVault(key: string): Promise<string | null> {
    // TODO: replace with Android Keystore plugin
    return safeLocalStorageGet(`vault:${key}`)
  }

  async setVault(key: string, value: string): Promise<void> {
    // TODO: replace with Android Keystore plugin
    safeLocalStorageSet(`vault:${key}`, value)
  }

  async deleteVault(key: string): Promise<void> {
    safeLocalStorageRemove(`vault:${key}`)
  }

  // Preview
  async createSandbox(templateType?: string): Promise<{ success: boolean; sandboxPath: string; error?: string }> {
    return {
      success: true,
      sandboxPath: `/sandbox/${templateType || 'default'}`,
    }
  }

  async startPreview(sandboxPath: string, _port?: number): Promise<PreviewSession> {
    return {
      id: sandboxPath,
      url: sandboxPath,
      status: 'running',
    }
  }

  async stopPreview(_sessionId: string): Promise<void> {
    // no-op on mobile placeholder
  }

  async getPreviewStatus(sessionId: string): Promise<PreviewSession> {
    return {
      id: sessionId,
      url: sessionId,
      status: 'running',
    }
  }

  // Notifications
  async showNotification(options: NotificationOptions): Promise<void> {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(options.title, { body: options.body, icon: options.icon })
    }
  }

  // Companion Sync
  async getCompanionStatus(): Promise<{ paired: boolean; deviceName?: string; lastSync?: string }> {
    return { paired: false }
  }

  async sendCompanionCommand(_command: Record<string, unknown>): Promise<void> {
    throw new Error('Companion sync not yet implemented on mobile.')
  }

  // Provider Calls
  async fetchProvider(url: string, init?: RequestInit & { timeoutMs?: number }): Promise<Response> {
    const { timeoutMs, ...rest } = init || {}
    const controller = new AbortController()
    let timer: ReturnType<typeof setTimeout> | undefined
    if (timeoutMs && !rest.signal) {
      timer = setTimeout(() => controller.abort(), timeoutMs)
    }
    try {
      return await fetch(url, { ...rest, signal: rest.signal ?? controller.signal })
    } finally {
      if (timer) clearTimeout(timer)
    }
  }

  // Window / Shell
  async openExternal(url: string): Promise<void> {
    window.open(url, '_blank')
  }

  minimizeWindow(): void {
    // no-op on mobile
  }

  maximizeWindow(): void {
    // no-op on mobile
  }

  closeWindow(): void {
    // no-op on mobile
  }
}
