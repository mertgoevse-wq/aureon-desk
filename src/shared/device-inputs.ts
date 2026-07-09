/**
 * Device Inputs — Safe Camera, Microphone & Screen Capture Foundation
 *
 * Safety rules:
 * - Do NOT enable camera/microphone/screen capture by default
 * - Do NOT record in background
 * - Do NOT send media to remote providers without explicit approval
 * - All capture requires explicit user permission per session
 */

// ---- Device Kinds ----

export type DeviceKind = 'audioinput' | 'videoinput' | 'screen'

const DEVICE_KIND_LABELS: Record<DeviceKind, string> = {
  audioinput: 'Microphone',
  videoinput: 'Camera',
  screen: 'Screen / Window',
}

const DEVICE_KIND_ICONS: Record<DeviceKind, string> = {
  audioinput: 'Mic',
  videoinput: 'Camera',
  screen: 'Monitor',
}

// ---- Device Info (mirrors MediaDeviceInfo) ----

export interface DeviceInfo {
  deviceId: string
  kind: DeviceKind
  label: string
  groupId: string
}

// ---- Screen Source (from desktopCapturer) ----

export interface ScreenSource {
  id: string
  name: string
  thumbnail: string // base64 data URL
  appIcon: string | null // base64 data URL
}

// ---- Permission State ----

export type PermissionState = 'prompt' | 'granted' | 'denied' | 'unavailable'

export const PERMISSION_STATE_LABELS: Record<PermissionState, string> = {
  prompt: 'Ask to allow',
  granted: 'Allowed',
  denied: 'Blocked',
  unavailable: 'Not available',
}

// ---- Capture Mode ----

export type CaptureMode = 'disabled' | 'preview' | 'capture'

// ---- Device Input State (per device category) ----

export interface DeviceInputState {
  category: DeviceCategory
  kind: DeviceKind
  permission: PermissionState
  captureMode: CaptureMode
  selectedDeviceId: string | null
  availableDevices: DeviceInfo[]
  isPreviewing: boolean
  lastError: string | null
}

// ---- Device Categories ----

export type DeviceCategory = 'microphone' | 'camera' | 'screen_capture'

export const DEVICE_CATEGORIES: DeviceCategory[] = ['microphone', 'camera', 'screen_capture']

export const DEVICE_CATEGORY_LABELS: Record<DeviceCategory, string> = {
  microphone: 'Microphone',
  camera: 'Camera',
  screen_capture: 'Screen Capture',
}

export const DEVICE_CATEGORY_DESCRIPTIONS: Record<DeviceCategory, string> = {
  microphone: 'Detect and preview audio input devices. Audio is processed locally — never sent to remote providers without explicit approval.',
  camera: 'Detect and preview video input devices. The camera is disabled by default and requires explicit permission to activate.',
  screen_capture: 'Capture screen or individual windows for visual analysis. Only captures when you explicitly choose a source.',
}

export const DEVICE_CATEGORY_KINDS: Record<DeviceCategory, DeviceKind> = {
  microphone: 'audioinput',
  camera: 'videoinput',
  screen_capture: 'screen',
}

// ---- IPC Types ----

export interface ScreenSourcesRequest {
  types: Array<'screen' | 'window'>
}

export interface ScreenSourcesResult {
  success: boolean
  sources: ScreenSource[]
  error?: string
}

// ---- Media Upload Request (for future use with vision models) ----

// ---- Safety Notices ----

export const SAFETY_NOTICE = '⚠️ Camera, microphone, and screen capture are disabled by default. You must explicitly grant permission each session. No media is recorded in the background or sent to remote providers without your explicit approval.'

export const NO_REMOTE_NOTICE = '🔒 All capture is local-only. Media is never sent to remote AI providers without your explicit approval. Visual analysis requires a configured vision-capable model.'

export const DEFAULT_DEVICE_STATE: DeviceInputState = {
  category: 'camera',
  kind: 'videoinput',
  permission: 'prompt',
  captureMode: 'disabled',
  selectedDeviceId: null,
  availableDevices: [],
  isPreviewing: false,
  lastError: null,
}
