/**
 * Vibeforge — companion.ts
 *
 * Type definitions for the Vibeforge Android/Phone Companion feature.
 *
 * Architecture overview:
 *   - Vibeforge Desktop = the main builder (Electron app)
 *   - Companion Device = a phone or tablet on the same local network
 *   - The phone opens /companion in a browser (mobile-first web UI)
 *   - Commands flow: Phone → Desktop approval → execution
 *
 * Security rules (enforced in UI + future IPC layer):
 *   - No remote shell execution without explicit desktop approval
 *   - No file deletion from phone
 *   - No account actions (API key changes, provider add/remove) from phone
 *   - All commands are queued and shown in the desktop approval UI first
 *   - Pairing codes expire after 5 minutes
 *   - Only one paired device at a time (MVP)
 *
 * Status: Local Beta — UI + types only. No real TCP/network in this pass.
 */

// ─── Device ──────────────────────────────────────────────────────────────────

export type PermissionLevel =
  | 'read-only'    // can view status and screenshots only
  | 'prompt-only'  // can send prompts; builder runs them on desktop
  | 'full'         // can also trigger builds and request previews (requires per-action approval)

export interface CompanionDevice {
  id: string
  /** Human-readable name (e.g. "Galaxy A56 5G") */
  name: string
  platform: 'android' | 'ios' | 'web' | 'unknown'
  pairedAt: number // Unix timestamp ms
  lastSeen: number // Unix timestamp ms
  permissionLevel: PermissionLevel
}

// ─── Pairing ─────────────────────────────────────────────────────────────────

export type PairingStatus = 'pending' | 'confirmed' | 'expired' | 'revoked'

export interface PairingSession {
  sessionId: string
  /** 6-digit numeric code shown on desktop and entered on phone */
  pairingCode: string
  /** Base64 QR data URI (planned — empty string in MVP) */
  qrDataUri: string
  expiresAt: number // Unix timestamp ms (now + 5 min)
  status: PairingStatus
}

// ─── Commands ────────────────────────────────────────────────────────────────

export type CommandStatus = 'pending' | 'approved' | 'rejected' | 'completed' | 'failed'

export type CompanionCommandType =
  | 'sendPrompt'       // send a text prompt to the active chat/studio
  | 'startBuild'       // trigger a build in Studio with given prompt
  | 'requestPreview'   // request a screenshot of current LivePreview
  | 'approveAction'    // approve a pending desktop action
  | 'rejectAction'     // reject a pending desktop action
  | 'getStatus'        // request current app status (what page is open, build state)
  | 'openProject'      // request desktop to open a named project

export interface CompanionCommandPayload {
  sendPrompt?: { prompt: string; target: 'chat' | 'studio' }
  startBuild?: { prompt: string }
  requestPreview?: { format: 'screenshot' | 'url' }
  approveAction?: { actionId: string }
  rejectAction?: { actionId: string }
  getStatus?: Record<string, never>
  openProject?: { projectName: string }
}

export interface CompanionCommand {
  id: string
  type: CompanionCommandType
  payload: CompanionCommandPayload
  status: CommandStatus
  deviceId: string
  createdAt: number  // Unix timestamp ms
  resolvedAt?: number // Unix timestamp ms
  /** Desktop approval note (optional) */
  note?: string
}

// ─── App Status (sent to companion on getStatus) ──────────────────────────────

export type AppPage = 'chat' | 'studio' | 'preview' | 'settings' | 'skills' | 'other'

export interface CompanionAppStatus {
  appPage: AppPage
  buildInProgress: boolean
  previewRunning: boolean
  previewUrl?: string
  lastPrompt?: string
  connectedProvider?: string
}

// ─── Companion Config (stored in settings) ───────────────────────────────────

export interface CompanionConfig {
  enabled: boolean
  allowedCommands: CompanionCommandType[]
  pairedDevice?: CompanionDevice
  commandHistory: CompanionCommand[]
}

export const DEFAULT_COMPANION_CONFIG: CompanionConfig = {
  enabled: false,
  allowedCommands: ['sendPrompt', 'getStatus', 'requestPreview'],
  commandHistory: [],
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Generate a random 6-digit pairing code */
export function generatePairingCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

/** Check whether a pairing session has expired */
export function isPairingExpired(session: PairingSession): boolean {
  return Date.now() > session.expiresAt
}

/** Human-readable permission level label */
export const PERMISSION_LABELS: Record<PermissionLevel, string> = {
  'read-only': 'Read Only — view status and screenshots',
  'prompt-only': 'Prompt Only — send prompts to desktop',
  'full': 'Full Access — build, preview, and prompt (with approval)',
}
