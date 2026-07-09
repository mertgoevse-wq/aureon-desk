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
  // Build pipeline trigger
  pipelinePrompt: 'build-pipeline-prompt',
  pipelineTheme: 'build-pipeline-theme',
  pipelinePlatform: 'build-pipeline-platform',
  pipelineMode: 'build-pipeline-mode',
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
  sessionStorage.removeItem(AUTO_PREVIEW_KEYS.pipelinePrompt)
  sessionStorage.removeItem(AUTO_PREVIEW_KEYS.pipelineTheme)
  sessionStorage.removeItem(AUTO_PREVIEW_KEYS.pipelinePlatform)
  sessionStorage.removeItem(AUTO_PREVIEW_KEYS.pipelineMode)
}

/**
 * Set sessionStorage to trigger the new build pipeline on Code mode mount.
 * This uses the bolt-like prompt → code → diff → preview flow.
 */
export function setAutoBuildPipeline(config: AutoPreviewConfig & { mode?: string }): void {
  sessionStorage.setItem(AUTO_PREVIEW_KEYS.pipelinePrompt, config.prompt)
  sessionStorage.setItem(AUTO_PREVIEW_KEYS.pipelineTheme, config.style)
  sessionStorage.setItem(AUTO_PREVIEW_KEYS.pipelinePlatform, config.platform)
  sessionStorage.setItem(AUTO_PREVIEW_KEYS.pipelineMode, config.mode || 'generate-and-preview')
}

/**
 * Read and clear the build pipeline trigger from sessionStorage.
 * Returns null if no pipeline trigger is set.
 */
export function getAndClearBuildPipeline(): { prompt: string; theme: string; platform: string; mode: string } | null {
  const prompt = sessionStorage.getItem(AUTO_PREVIEW_KEYS.pipelinePrompt)
  if (!prompt) return null
  const theme = sessionStorage.getItem(AUTO_PREVIEW_KEYS.pipelineTheme) || 'Calming Ivory'
  const platform = sessionStorage.getItem(AUTO_PREVIEW_KEYS.pipelinePlatform) || 'Web app'
  const mode = sessionStorage.getItem(AUTO_PREVIEW_KEYS.pipelineMode) || 'generate-and-preview'
  // Clear pipeline keys only
  sessionStorage.removeItem(AUTO_PREVIEW_KEYS.pipelinePrompt)
  sessionStorage.removeItem(AUTO_PREVIEW_KEYS.pipelineTheme)
  sessionStorage.removeItem(AUTO_PREVIEW_KEYS.pipelinePlatform)
  sessionStorage.removeItem(AUTO_PREVIEW_KEYS.pipelineMode)
  return { prompt, theme, platform, mode }
}
