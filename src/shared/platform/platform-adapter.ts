/**
 * Vibeforge — Platform Adapter Interface
 *
 * Abstracts every desktop-only Electron / Node API so the renderer can run
 * unchanged on Electron (desktop), mobile web, and Capacitor (Android).
 *
 * The desktop adapter is a thin wrapper around the existing Electron/Node code.
 * The mobile adapter returns graceful fallbacks or throws "unsupported" errors.
 */

export interface FileInfo {
  name: string
  path: string
  size: number
  mimeType?: string
}

export interface PreviewSession {
  id: string
  url: string
  status: 'idle' | 'starting' | 'running' | 'error' | 'stopped'
  error?: string
}

export interface VaultValue {
  value: string
  service?: string
  account?: string
}

export interface NotificationOptions {
  title: string
  body: string
  icon?: string
}

export interface PlatformAdapter {
  readonly platform: 'desktop' | 'mobile' | 'web'

  // ── File System ───────────────────────────────────────────────────────────
  pickFiles(options?: { multiple?: boolean; accept?: string }): Promise<string[]>
  readTextFile(path: string): Promise<string>
  writeTextFile(path: string, content: string): Promise<void>
  deleteFile(path: string): Promise<void>
  getSandboxRoot(): Promise<string>

  // ── Storage / Settings ───────────────────────────────────────────────────
  getSetting(key: string): Promise<string | null>
  setSetting(key: string, value: string): Promise<void>

  // ── Credential Vault ──────────────────────────────────────────────────────
  getVault(key: string): Promise<string | null>
  setVault(key: string, value: string): Promise<void>
  deleteVault(key: string): Promise<void>

  // ── Preview ───────────────────────────────────────────────────────────────
  createSandbox(templateType?: string): Promise<{ success: boolean; sandboxPath: string; error?: string }>
  startPreview(sandboxPath: string, port?: number): Promise<PreviewSession>
  stopPreview(sessionId: string): Promise<void>
  getPreviewStatus(sessionId: string): Promise<PreviewSession>

  // ── Notifications ─────────────────────────────────────────────────────────
  showNotification(options: NotificationOptions): Promise<void>

  // ── Companion Sync ───────────────────────────────────────────────────────
  getCompanionStatus(): Promise<{ paired: boolean; deviceName?: string; lastSync?: string }>
  sendCompanionCommand(command: Record<string, unknown>): Promise<void>

  // ── Provider Calls ─────────────────────────────────────────────────────────
  fetchProvider(url: string, init?: RequestInit & { timeoutMs?: number }): Promise<Response>

  // ── Window / Shell ─────────────────────────────────────────────────────────
  openExternal(url: string): Promise<void>
  minimizeWindow?(): void
  maximizeWindow?(): void
  closeWindow?(): void
}
