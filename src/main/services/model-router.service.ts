import { providerService } from './provider.service'
import { callProviderApi } from './provider-call'
import { logger } from '../utils/logger'
import {
  selectBestModel,
  selectModelForPrompt,
  selectFallbackModel,
  explainModelSelection,
  markModelExhausted,
  isModelExhausted,
  getExhaustedModels,
  clearModelExhaustion,
  clearAllExhaustion,
  recordModelUsage,
  getAllModelUsage,
  getModelUsage,
  clearAllUsage,
  MODEL_SCORES,
  type ModelTask,
  type ModelScore,
} from '../../shared/model-selector'

/**
 * Model Router Service — bridges the smart model selector with the main process.
 *
 * Responsibilities:
 * - Query which providers are enabled and have API keys
 * - Select the best model for a given prompt/task
 * - Track token exhaustion and auto-fallback
 * - Provide selection explanations for UI feedback
 */

export const modelRouterService = {
  /**
   * Get the list of available provider slugs (enabled + has API key or is local).
   */
  getAvailableProviders(): string[] {
    const allProviders = providerService.listProviders()
    return allProviders
      .filter(p => p.is_enabled === 1)
      .filter(p => {
        if (p.adapter === 'ollama' || p.adapter === 'lmstudio') return true
        const hasKey = providerService.getMaskedApiKey(p.id)
        return hasKey !== null
      })
      .map(p => p.slug)
  },

  /**
   * Select the best model for a user prompt.
   * Returns the model score + the DB model ID if resolvable.
   */
  selectModelForPrompt(prompt: string): {
    task: ModelTask
    model: ModelScore | null
    modelDbId: string | null
    explanation: string
    availableProviders: string[]
  } {
    const availableProviders = this.getAvailableProviders()
    const result = selectModelForPrompt(prompt, availableProviders)
    const explanation = explainModelSelection(result.task, result.model)

    // Try to resolve the model score to an actual DB model ID
    let modelDbId: string | null = null
    if (result.model) {
      modelDbId = this.resolveModelId(result.model)
    }

    logger.info(`Model selection for prompt: ${explanation}`, {
      task: result.task,
      modelId: modelDbId,
      availableProviders,
    })

    return {
      task: result.task,
      model: result.model,
      modelDbId,
      explanation,
      availableProviders,
    }
  },

  /**
   * Get the fallback model when the primary is exhausted.
   */
  selectFallback(
    task: ModelTask,
    excludeModelId: string,
  ): { model: ModelScore | null; modelDbId: string | null; explanation: string } {
    const availableProviders = this.getAvailableProviders()
    const model = selectFallbackModel(task, availableProviders, excludeModelId, true)
    const explanation = model
      ? `Fallback: ${explainModelSelection(task, model)}`
      : 'No fallback model available'

    let modelDbId: string | null = null
    if (model) {
      modelDbId = this.resolveModelId(model)
    }

    return { model, modelDbId, explanation }
  },

  /**
   * Handle a rate-limit / exhaustion event.
   * Marks the model as exhausted and returns the next best model.
   */
  handleExhaustion(
    exhaustedModelId: string,
    task: ModelTask,
    reason: string = 'Rate limited (429)',
  ): { fallbackModel: ModelScore | null; fallbackDbId: string | null; cooldownMinutes: number } {
    markModelExhausted(exhaustedModelId, reason)
    logger.warn(`Model exhausted: ${exhaustedModelId} — ${reason}. Switching to fallback.`)

    const fallback = this.selectFallback(task, exhaustedModelId)
    return {
      fallbackModel: fallback.model,
      fallbackDbId: fallback.modelDbId,
      cooldownMinutes: 5,
    }
  },

  /**
   * Check if a model is currently exhausted.
   */
  isExhausted(modelId: string): boolean {
    return isModelExhausted(modelId)
  },

  /**
   * Get all currently exhausted models with their reasons.
   */
  getExhausted(): ReturnType<typeof getExhaustedModels> {
    return getExhaustedModels()
  },

  /**
   * Clear exhaustion for a model (e.g., API key was reconfigured).
   */
  clearExhaustion(modelId: string): void {
    clearModelExhaustion(modelId)
  },

  /**
   * Clear all exhaustion tracking.
   */
  clearAllExhaustion(): void {
    clearAllExhaustion()
  },

  /**
   * Get all model scores for UI display.
   */
  getAllScores(): ModelScore[] {
    return MODEL_SCORES
  },

  // ---- Token Usage Tracking ----

  /**
   * Record a successful API request for a model.
   * Called after chat completions or build pipeline code generation succeeds.
   */
  recordUsage(modelId: string): void {
    const score = this.findModelScore(modelId)
    recordModelUsage(
      modelId,
      score?.displayName || modelId,
      score?.provider || 'unknown',
      score?.hasFreeTier || false,
    )
  },

  /**
   * Get usage stats for all models, sorted by request count descending.
   */
  getUsage() {
    return getAllModelUsage()
  },

  /**
   * Clear all usage tracking.
   */
  clearAllUsage(): void {
    clearAllUsage()
  },

  /**
   * Find a ModelScore entry by modelId.
   * Uses exact match first, then suffix match (for OpenRouter-prefixed names like openai/gpt-4o).
   */
  findModelScore(modelId: string): ModelScore | undefined {
    return MODEL_SCORES.find(m =>
      m.modelId === modelId || modelId.endsWith('/' + m.modelId)
    )
  },

  /**
   * Resolve a ModelScore to an actual DB model ID.
   * Matches by provider slug + model name.
   */
  resolveModelId(score: ModelScore): string | null {
    try {
      const allProviders = providerService.listProviders()
      const provider = allProviders.find(p => p.slug === score.provider)
      if (!provider) return null

      const models = provider.models || []
      const match = models.find(m => m.name === score.modelId)
      return match?.id || null
    } catch {
      return null
    }
  },

  /**
   * Get a fully resolved model reference for the build pipeline.
   * Uses smart selection based on the prompt, falling back to any available model.
   */
  resolveBestModelForBuild(prompt: string): {
    modelDbId: string | null
    explanation: string
    task: ModelTask
    isDemo: boolean
  } {
    const availableProviders = this.getAvailableProviders()

    if (availableProviders.length === 0) {
      return {
        modelDbId: null,
        explanation: 'No providers configured. Using local demo.',
        task: 'code_generation',
        isDemo: true,
      }
    }

    const result = selectModelForPrompt(prompt, availableProviders)
    const modelDbId = result.model ? this.resolveModelId(result.model) : null

    if (!modelDbId) {
      return {
        modelDbId: null,
        explanation: `Could not resolve model. ${explainModelSelection(result.task, result.model)}`,
        task: result.task,
        isDemo: true,
      }
    }

    return {
      modelDbId,
      explanation: explainModelSelection(result.task, result.model),
      task: result.task,
      isDemo: false,
    }
  },

  // ---- Provider Smoke Test ----

  /**
   * Run a quick smoke test on a single provider.
   */
  async smokeTestProvider(providerId: string): Promise<{
    success: boolean
    message: string
    modelUsed: string | null
    durationMs: number
    responsePreview: string | null
  }> {
    const provider = providerService.getProvider(providerId)
    if (!provider) {
      return { success: false, message: 'Provider not found', modelUsed: null, durationMs: 0, responsePreview: null }
    }

    if (provider.is_enabled !== 1) {
      return { success: false, message: 'Provider is disabled. Enable it to run a smoke test.', modelUsed: null, durationMs: 0, responsePreview: null }
    }

    const isLocal = provider.adapter === 'ollama' || provider.adapter === 'lmstudio'
    if (!isLocal) {
      const hasKey = providerService.getMaskedApiKey(providerId)
      if (!hasKey) {
        return { success: false, message: 'No API key configured. Add your key and try again.', modelUsed: null, durationMs: 0, responsePreview: null }
      }
    }

    // Find an enabled model
    const enabledModels = (provider.models || []).filter(m => m.is_enabled === 1)
    if (enabledModels.length === 0) {
      return { success: false, message: 'No enabled models found for this provider.', modelUsed: null, durationMs: 0, responsePreview: null }
    }

    // Try the default model first, then the first enabled
    const model = enabledModels.find(m => m.is_default === 1) || enabledModels[0]
    const modelRef = providerService.resolveCanonicalModelReference(model.id)
    if (!modelRef) {
      return { success: false, message: `Could not resolve model ${model.display_name || model.name}.`, modelUsed: model.display_name || model.name, durationMs: 0, responsePreview: null }
    }

    const apiKey = isLocal ? null : providerService.getApiKey(providerId)
    const baseUrl = modelRef.baseUrl || provider.base_url || ''
    const samplePrompt = 'Respond with exactly: {"status":"ok","message":"Smoke test passed"}'

    logger.info(`Running smoke test for ${provider.name} / ${model.name}`)
    const startTime = Date.now()

    try {
      const responseText = await this._callSmokeTest(baseUrl, apiKey, model.name, provider.adapter)
      const durationMs = Date.now() - startTime

      // Check if response contains expected content
      const hasOk = responseText.toLowerCase().includes('ok') || responseText.includes('smoke')
      const preview = responseText.slice(0, 200)

      logger.info(`Smoke test passed for ${provider.name} in ${durationMs}ms`)

      // Record usage
      this.recordUsage(model.name)

      return {
        success: true,
        message: hasOk
          ? `✅ Response received in ${durationMs}ms — provider is working.`
          : `⚠️ Response received in ${durationMs}ms but didn't match expected format.`,
        modelUsed: model.display_name || model.name,
        durationMs,
        responsePreview: preview,
      }
    } catch (err) {
      const durationMs = Date.now() - startTime
      const msg = err instanceof Error ? err.message : String(err)
      logger.error(`Smoke test failed for ${provider.name}: ${msg}`)

      // Determine a user-friendly error
      let friendlyMsg = msg
      if (msg.includes('401') || msg.includes('403') || msg.includes('Unauthorized') || msg.includes('Authentication')) {
        friendlyMsg = 'Authentication failed. Check your API key.'
      } else if (msg.includes('429')) {
        friendlyMsg = 'Rate limited. Wait a moment and try again.'
      } else if (msg.includes('timeout') || msg.includes('ETIMEDOUT') || msg.includes('aborted')) {
        friendlyMsg = 'Request timed out. The provider may be slow or unreachable.'
      } else if (msg.includes('ECONNREFUSED') || msg.includes('fetch failed') || msg.includes('ENOTFOUND')) {
        friendlyMsg = 'Cannot reach the provider. Check the base URL and network connection.'
      }

      return {
        success: false,
        message: friendlyMsg,
        modelUsed: model.display_name || model.name,
        durationMs,
        responsePreview: null,
      }
    }
  },

  /**
   * Run smoke tests across all configured providers at once.
   * Returns per-provider results with summary counts.
   */
  async smokeTestAllProviders(): Promise<{
    results: Array<{
      providerId: string
      providerName: string
      success: boolean
      message: string
      modelUsed: string | null
      durationMs: number
    }>
    total: number
    passed: number
    failed: number
    skipped: number
  }> {
    const allProviders = providerService.listProviders()
    const enabled = allProviders.filter(p => p.is_enabled === 1)
    const results: Array<{
      providerId: string
      providerName: string
      success: boolean
      message: string
      modelUsed: string | null
      durationMs: number
    }> = []

    let passed = 0
    let failed = 0

    logger.info(`Running smoke tests for ${enabled.length} enabled providers`)

    for (const provider of enabled) {
      // smokeTestProvider handles all validation internally (key, models, etc.)
      const result = await this.smokeTestProvider(provider.id)
      results.push({
        providerId: provider.id,
        providerName: provider.name,
        success: result.success,
        message: result.message,
        modelUsed: result.modelUsed,
        durationMs: result.durationMs,
      })
      if (result.success) passed++
      else failed++
    }

    const skipped = allProviders.length - enabled.length

    logger.info(`Smoke tests complete: ${passed} passed, ${failed} failed, ${skipped} skipped`)

    return {
      results,
      total: allProviders.length,
      passed,
      failed,
      skipped,
    }
  },

  /**
   * Internal: call a provider with a simple smoke-test prompt.
   */
  async _callSmokeTest(
    baseUrl: string,
    apiKey: string | null,
    modelName: string,
    adapter: string,
  ): Promise<string> {
    return callProviderApi({
      adapter,
      baseUrl,
      apiKey,
      model: modelName,
      messages: [{ role: 'user', content: 'Respond with exactly: {"status":"ok","message":"Smoke test passed"}' }],
      temperature: 0,
      maxTokens: 128,
      timeoutMs: 30000,
    })
  },
}
