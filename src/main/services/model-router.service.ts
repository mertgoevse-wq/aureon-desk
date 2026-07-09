import { providerService } from './provider.service'
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
}
