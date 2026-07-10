/// <reference path="../../preload/index.d.ts" />

/**
 * Vibeforge — Desktop Platform Adapter
 *
 * Thin wrapper around the typed Electron preload bridge (`window.api`).
 * This adapter is intended for use in the renderer process of the Electron
 * build and keeps all existing behavior intact.
 */

import type { PlatformAdapter, PreviewSession, NotificationOptions } from './platform-adapter'

function assertApi(): Window['api'] {
  if (typeof window === 'undefined' || !window.api) {
    throw new Error('DesktopAdapter requires the Electron preload bridge (window.api).')
  }
  return window.api
}

export class DesktopAdapter implements PlatformAdapter {
  readonly platform = 'desktop' as const

  // File System
  async pickFiles(_options?: { multiple?: boolean; accept?: string }): Promise<string[]> {
    // TODO: wire to preload bridge when file picker is added
    throw new Error('File picker not yet implemented on desktop.')
  }

  async readTextFile(_path: string): Promise<string> {
    // TODO: wire to preload bridge when file read is added
    throw new Error('Direct file read not yet implemented on desktop.')
  }

  async writeTextFile(_path: string, _content: string): Promise<void> {
    // TODO: wire to preload bridge when file write is added
    throw new Error('Direct file write not yet implemented on desktop.')
  }

  async deleteFile(_path: string): Promise<void> {
    // TODO: wire to preload bridge when file delete is added
    throw new Error('Direct file delete not yet implemented on desktop.')
  }

  async getSandboxRoot(): Promise<string> {
    // TODO: wire to preload bridge when sandbox root is exposed
    throw new Error('Sandbox root not yet exposed on desktop.')
  }

  // Storage / Settings
  async getSetting(key: string): Promise<string | null> {
    const api = assertApi()
    return api.settingsGet(key)
  }

  async setSetting(key: string, value: string): Promise<void> {
    const api = assertApi()
    await api.settingsSet(key, value)
  }

  // Credential Vault
  // TODO: expose the existing safeStorage vault via preload and route through it.
  async getVault(_key: string): Promise<string | null> {
    throw new Error('Secure vault not yet exposed through the preload bridge on desktop.')
  }

  async setVault(_key: string, _value: string): Promise<void> {
    throw new Error('Secure vault not yet exposed through the preload bridge on desktop.')
  }

  async deleteVault(_key: string): Promise<void> {
    throw new Error('Secure vault not yet exposed through the preload bridge on desktop.')
  }

  // Preview
  async createSandbox(templateType?: string): Promise<{ success: boolean; sandboxPath: string; error?: string }> {
    const api = assertApi()
    return api.previewCreateSandbox({ templateType })
  }

  async startPreview(sandboxPath: string, port?: number): Promise<PreviewSession> {
    const api = assertApi()
    const status = await api.previewStart(sandboxPath, port)
    return {
      id: status?.id ?? '',
      url: status?.url ?? '',
      status: status?.status ?? 'error',
      error: status?.error,
    }
  }

  async stopPreview(_sessionId: string): Promise<void> {
    const api = assertApi()
    await api.previewStop()
  }

  async getPreviewStatus(_sessionId: string): Promise<PreviewSession> {
    const api = assertApi()
    const status = await api.previewStatus()
    return {
      id: status?.id ?? '',
      url: status?.url ?? '',
      status: status?.status ?? 'error',
      error: status?.error,
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
    // TODO: wire to preload bridge when companion IPC is added
    return { paired: false }
  }

  async sendCompanionCommand(_command: Record<string, unknown>): Promise<void> {
    // TODO: wire to preload bridge when companion IPC is added
    throw new Error('Companion sync not yet implemented on desktop.')
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
    // TODO: add openExternal to preload bridge; fallback to browser tab for now
    window.open(url, '_blank')
  }

  minimizeWindow(): void {
    const api = assertApi()
    api.windowMinimize()
  }

  maximizeWindow(): void {
    const api = assertApi()
    api.windowMaximize()
  }

  closeWindow(): void {
    const api = assertApi()
    api.windowClose()
  }
}
