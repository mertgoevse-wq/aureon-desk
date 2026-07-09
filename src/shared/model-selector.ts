/**
 * Smart Model Selector — Auto-choose best model for the user's context.
 *
 * Rules:
 * - For code generation: prefers models with strong coding capability
 * - For chat/conversation: prefers fast, cheap models
 * - For vision/multimodal: requires vision-capable models
 * - Respects provider availability (enabled, has API key)
 * - Falls back gracefully when preferred models unavailable
 */

// ---- Model Capability Scores ----

export type ModelTask = 'code_generation' | 'chat' | 'vision' | 'reasoning' | 'fast_inference'

export interface ModelScore {
  modelId: string
  displayName: string
  provider: string
  scores: Record<ModelTask, number>
  isFree: boolean
  isLocal: boolean
}

/**
 * Known model scores for common providers.
 * Higher score = better for that task.
 * Free models get a bonus to be preferred when API key is free-tier.
 */
export const MODEL_SCORES: ModelScore[] = [
  // OpenAI
  { modelId: 'gpt-4o', displayName: 'GPT-4o', provider: 'openai', scores: { code_generation: 90, chat: 92, vision: 88, reasoning: 90, fast_inference: 60 }, isFree: false, isLocal: false },
  { modelId: 'gpt-4o-mini', displayName: 'GPT-4o Mini', provider: 'openai', scores: { code_generation: 70, chat: 78, vision: 65, reasoning: 60, fast_inference: 90 }, isFree: false, isLocal: false },

  // Anthropic
  { modelId: 'claude-sonnet-4-20250514', displayName: 'Claude Sonnet 4', provider: 'anthropic', scores: { code_generation: 95, chat: 90, vision: 85, reasoning: 92, fast_inference: 55 }, isFree: false, isLocal: false },
  { modelId: 'claude-3-5-haiku-20241022', displayName: 'Claude 3.5 Haiku', provider: 'anthropic', scores: { code_generation: 75, chat: 80, vision: 60, reasoning: 65, fast_inference: 92 }, isFree: false, isLocal: false },

  // Google Gemini
  { modelId: 'gemini-2.5-pro', displayName: 'Gemini 2.5 Pro', provider: 'google', scores: { code_generation: 88, chat: 85, vision: 90, reasoning: 88, fast_inference: 65 }, isFree: false, isLocal: false },
  { modelId: 'gemini-2.5-flash', displayName: 'Gemini 2.5 Flash', provider: 'google', scores: { code_generation: 72, chat: 75, vision: 78, reasoning: 65, fast_inference: 95 }, isFree: false, isLocal: false },

  // DeepSeek
  { modelId: 'deepseek-chat', displayName: 'DeepSeek V3', provider: 'deepseek', scores: { code_generation: 82, chat: 80, vision: 0, reasoning: 85, fast_inference: 70 }, isFree: false, isLocal: false },

  // OpenRouter (allows access to many models, including free ones)
  { modelId: 'openrouter/auto', displayName: 'Auto (best model)', provider: 'openrouter', scores: { code_generation: 85, chat: 85, vision: 80, reasoning: 85, fast_inference: 75 }, isFree: false, isLocal: false },
  { modelId: 'openrouter/free', displayName: 'Free (smoke test)', provider: 'openrouter', scores: { code_generation: 40, chat: 55, vision: 0, reasoning: 35, fast_inference: 85 }, isFree: true, isLocal: false },

  // Mistral
  { modelId: 'mistral-large-latest', displayName: 'Mistral Large', provider: 'mistral', scores: { code_generation: 80, chat: 82, vision: 60, reasoning: 78, fast_inference: 70 }, isFree: false, isLocal: false },
  { modelId: 'codestral-latest', displayName: 'Codestral', provider: 'mistral', scores: { code_generation: 92, chat: 65, vision: 0, reasoning: 75, fast_inference: 72 }, isFree: false, isLocal: false },

  // Groq (fast inference)
  { modelId: 'llama-3.3-70b-versatile', displayName: 'Llama 3.3 70B', provider: 'groq', scores: { code_generation: 75, chat: 78, vision: 0, reasoning: 72, fast_inference: 95 }, isFree: false, isLocal: false },

  // Ollama (local)
  { modelId: 'llama3.2', displayName: 'Llama 3.2 (Local)', provider: 'ollama', scores: { code_generation: 60, chat: 70, vision: 0, reasoning: 60, fast_inference: 65 }, isFree: true, isLocal: true },
]

/** Task descriptions for UI display */
export const TASK_DESCRIPTIONS: Record<ModelTask, string> = {
  code_generation: 'Code Generation',
  chat: 'General Chat',
  vision: 'Vision / Multimodal',
  reasoning: 'Complex Reasoning',
  fast_inference: 'Fast Responses',
}

/**
 * Select the best model for a given task.
 * Returns the highest-scoring model that is available.
 * Prefers free models when the task is low-complexity.
 */
export function selectBestModel(
  task: ModelTask,
  availableProviderSlugs: string[],
  preferFree: boolean = false,
): ModelScore | null {
  const available = MODEL_SCORES
    .filter(m => availableProviderSlugs.includes(m.provider))
    .filter(m => m.scores[task] > 0) // must support the task
    .sort((a, b) => {
      const scoreA = a.scores[task]
      const scoreB = b.scores[task]
      // Boost free models when preferred
      const bonus = preferFree ? 15 : 0
      return (scoreB + (b.isFree ? bonus : 0)) - (scoreA + (a.isFree ? bonus : 0))
    })

  return available[0] || null
}

/**
 * Select the best model for a user prompt based on keyword analysis.
 */
export function selectModelForPrompt(
  prompt: string,
  availableProviderSlugs: string[],
): { task: ModelTask; model: ModelScore | null } {
  const lower = prompt.toLowerCase()

  if (lower.includes('image') || lower.includes('picture') || lower.includes('photo') || lower.includes('screenshot') || lower.includes('vision')) {
    return { task: 'vision', model: selectBestModel('vision', availableProviderSlugs) }
  }

  if (lower.includes('build') || lower.includes('create') || lower.includes('code') || lower.includes('app') || lower.includes('component') || lower.includes('website') || lower.includes('html') || lower.includes('css') || lower.includes('javascript')) {
    return { task: 'code_generation', model: selectBestModel('code_generation', availableProviderSlugs) }
  }

  if (lower.includes('explain') || lower.includes('analyze') || lower.includes('compare') || lower.includes('reason') || lower.includes('why')) {
    return { task: 'reasoning', model: selectBestModel('reasoning', availableProviderSlugs) }
  }

  if (lower.includes('quick') || lower.includes('fast') || lower.includes('summarize') || lower.includes('translate')) {
    return { task: 'fast_inference', model: selectBestModel('fast_inference', availableProviderSlugs) }
  }

  return { task: 'chat', model: selectBestModel('chat', availableProviderSlugs) }
}

/**
 * Generate a human-readable summary of what model was selected and why.
 */
export function explainModelSelection(task: ModelTask, model: ModelScore | null): string {
  if (!model) return 'No suitable model available. Configure a provider in Settings.'
  const taskLabel = TASK_DESCRIPTIONS[task]
  const score = model.scores[task]
  const rating = score >= 90 ? 'excellent' : score >= 75 ? 'good' : score >= 50 ? 'adequate' : 'basic'
  return `Selected ${model.displayName} (${model.provider}) for ${taskLabel} — ${rating} match (score: ${score}/100)${model.isFree ? ' (free tier)' : ''}${model.isLocal ? ' (local)' : ''}`
}
