/**
 * Studio → LivePreview sessionStorage helpers.
 *
 * Single source of truth for the auto-build-preview flow contract.
 * Every call site that triggers auto-preview MUST use these helpers.
 *
 * DO NOT inline sessionStorage.setItem('auto-build-app-preview', ...) —
 * use setAutoBuildPreview() instead. This ensures the contract stays consistent.
 */

export const AUTO_PREVIEW_KEYS = {
  autoStart: 'auto-build-app-preview',
  sandboxOnly: 'auto-build-app-sandbox-only',
  style: 'build-app-style',
  prompt: 'build-app-prompt',
  platform: 'build-app-platform',
} as const

export interface AutoPreviewConfig {
  style: string
  prompt: string
  platform: string
}

/**
 * Set sessionStorage for auto-build-app-preview flow.
 * Writes all 4 required keys atomically.
 */
export function setAutoBuildPreview(config: AutoPreviewConfig): void {
  sessionStorage.setItem(AUTO_PREVIEW_KEYS.autoStart, 'true')
  sessionStorage.setItem(AUTO_PREVIEW_KEYS.style, config.style)
  sessionStorage.setItem(AUTO_PREVIEW_KEYS.prompt, config.prompt)
  sessionStorage.setItem(AUTO_PREVIEW_KEYS.platform, config.platform)
}

/**
 * Set sessionStorage for sandbox-only (no live preview auto-start).
 */
export function setAutoBuildSandboxOnly(config: AutoPreviewConfig): void {
  sessionStorage.setItem(AUTO_PREVIEW_KEYS.sandboxOnly, 'true')
  sessionStorage.setItem(AUTO_PREVIEW_KEYS.style, config.style)
  sessionStorage.setItem(AUTO_PREVIEW_KEYS.prompt, config.prompt)
  sessionStorage.setItem(AUTO_PREVIEW_KEYS.platform, config.platform)
}

/**
 * Clear all auto-build-preview sessionStorage keys.
 */
export function clearAutoPreview(): void {
  sessionStorage.removeItem(AUTO_PREVIEW_KEYS.autoStart)
  sessionStorage.removeItem(AUTO_PREVIEW_KEYS.sandboxOnly)
  sessionStorage.removeItem(AUTO_PREVIEW_KEYS.style)
  sessionStorage.removeItem(AUTO_PREVIEW_KEYS.prompt)
  sessionStorage.removeItem(AUTO_PREVIEW_KEYS.platform)
}
