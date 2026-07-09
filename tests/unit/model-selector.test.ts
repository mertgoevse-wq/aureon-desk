import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  MODEL_SCORES,
  TASK_DESCRIPTIONS,
  EXHAUSTION_COOLDOWN_MS,
  selectBestModel,
  selectFallbackModel,
  selectModelForPrompt,
  explainModelSelection,
  markModelExhausted,
  isModelExhausted,
  getExhaustedModels,
  clearModelExhaustion,
  clearAllExhaustion,
  type ModelTask,
} from '../../src/shared/model-selector'

describe('MODEL_SCORES — Data Integrity', () => {
  it('should have at least 15 models defined', () => {
    expect(MODEL_SCORES.length).toBeGreaterThanOrEqual(15)
  })

  it('each model should have all required fields', () => {
    for (const m of MODEL_SCORES) {
      expect(m.modelId).toBeTruthy()
      expect(m.displayName).toBeTruthy()
      expect(m.provider).toBeTruthy()
      expect(typeof m.isFree).toBe('boolean')
      expect(typeof m.isLocal).toBe('boolean')
      expect(typeof m.hasFreeTier).toBe('boolean')
    }
  })

  it('each model should have scores for all 5 task types', () => {
    const tasks: ModelTask[] = ['code_generation', 'chat', 'vision', 'reasoning', 'fast_inference']
    for (const m of MODEL_SCORES) {
      for (const task of tasks) {
        expect(m.scores[task]).toBeGreaterThanOrEqual(0)
        expect(m.scores[task]).toBeLessThanOrEqual(100)
      }
    }
  })

  it('should have no duplicate modelIds', () => {
    const ids = MODEL_SCORES.map(m => m.modelId)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('NVIDIA models should have hasFreeTier: true', () => {
    const nvidiaModels = MODEL_SCORES.filter(m => m.provider === 'nvidia')
    expect(nvidiaModels.length).toBeGreaterThanOrEqual(3)
    for (const m of nvidiaModels) {
      expect(m.hasFreeTier).toBe(true)
      expect(m.isFree).toBe(true)
    }
  })

  it('OpenRouter free model should have hasFreeTier: true', () => {
    const orFree = MODEL_SCORES.find(m => m.modelId === 'openrouter/free')
    expect(orFree).toBeDefined()
    expect(orFree!.hasFreeTier).toBe(true)
    expect(orFree!.isFree).toBe(true)
  })

  it('local Ollama model should be isLocal: true', () => {
    const ollama = MODEL_SCORES.find(m => m.provider === 'ollama')
    expect(ollama).toBeDefined()
    expect(ollama!.isLocal).toBe(true)
    expect(ollama!.isFree).toBe(true)
  })

  it('paid models should not have hasFreeTier', () => {
    const paidModels = MODEL_SCORES.filter(m => m.provider === 'openai' || m.provider === 'anthropic')
    expect(paidModels.length).toBeGreaterThanOrEqual(2)
    for (const m of paidModels) {
      expect(m.hasFreeTier).toBe(false)
      expect(m.isFree).toBe(false)
    }
  })
})

describe('TASK_DESCRIPTIONS', () => {
  it('should cover all 5 task types', () => {
    const tasks: ModelTask[] = ['code_generation', 'chat', 'vision', 'reasoning', 'fast_inference']
    for (const task of tasks) {
      expect(TASK_DESCRIPTIONS[task]).toBeTruthy()
      expect(TASK_DESCRIPTIONS[task].length).toBeGreaterThan(2)
    }
  })
})

describe('selectBestModel', () => {
  beforeEach(() => {
    clearAllExhaustion()
  })

  it('should return the highest-scoring model for code generation', () => {
    const model = selectBestModel('code_generation', ['anthropic', 'openai', 'nvidia'])
    expect(model).not.toBeNull()
    expect(model!.scores['code_generation']).toBeGreaterThanOrEqual(85)
  })

  it('should select Claude when only Anthropic is available', () => {
    // NOTE: When NVIDIA is also available, its hasFreeTier bonus makes it win.
    // This test isolates Anthropic to verify Claude scores correctly.
    const model = selectBestModel('code_generation', ['anthropic'])
    expect(model).not.toBeNull()
    expect(model!.provider).toBe('anthropic')
    expect(model!.scores.code_generation).toBe(95)
  })

  it('should return NVIDIA model for code generation when only NVIDIA available', () => {
    const model = selectBestModel('code_generation', ['nvidia'])
    expect(model).not.toBeNull()
    expect(model!.provider).toBe('nvidia')
  })

  it('should return the best vision-capable model', () => {
    const model = selectBestModel('vision', ['openai', 'google', 'anthropic'])
    expect(model).not.toBeNull()
    // Gemini 2.5 Pro has the highest vision score
    expect(model!.scores.vision).toBeGreaterThanOrEqual(85)
  })

  it('should return Gemini for fast inference', () => {
    const model = selectBestModel('fast_inference', ['google', 'groq', 'openai'])
    expect(model).not.toBeNull()
    // Gemini flash or Groq llama should win fast_inference
    expect(model!.scores.fast_inference).toBeGreaterThanOrEqual(90)
  })

  it('should return null when no providers match', () => {
    const model = selectBestModel('code_generation', ['nonexistent-provider'])
    expect(model).toBeNull()
  })

  it('should return null for empty provider list', () => {
    const model = selectBestModel('chat', [])
    expect(model).toBeNull()
  })

  it('should skip models with score 0 for the task', () => {
    // DeepSeek has vision: 0, should not be selected for vision tasks
    const model = selectBestModel('vision', ['deepseek'])
    expect(model).toBeNull()
  })

  it('should give free tier bonus when models have hasFreeTier', () => {
    // NVIDIA has free tier, Anthropic does not
    // With preferFree=false, NVIDIA should get +10 bonus from hasFreeTier
    const model = selectBestModel('code_generation', ['anthropic', 'nvidia'], false)
    expect(model).not.toBeNull()
    // Anthropic (95) vs NVIDIA Nemotron 340B (88 + 10 free tier bonus = 98)
    // So NVIDIA Nemotron 340B should win with the free tier bonus
    expect(model!.provider).toBe('nvidia')
  })

  it('should boost free models when preferFree is true', () => {
    const model = selectBestModel('code_generation', ['nvidia', 'anthropic'], true)
    expect(model).not.toBeNull()
    // NVIDIA is free + hasFreeTier, so it should be heavily preferred
    expect(model!.provider).toBe('nvidia')
  })

  it('should skip exhausted models', () => {
    markModelExhausted('nvidia/llama-3.1-nemotron-70b-instruct')
    markModelExhausted('nvidia/nemotron-4-340b-instruct')
    markModelExhausted('nvidia/llama-3.1-nemotron-51b-instruct')
    // All NVIDIA are exhausted, should fall to next best
    const model = selectBestModel('code_generation', ['anthropic', 'nvidia'])
    expect(model).not.toBeNull()
    expect(model!.provider).toBe('anthropic')
  })
})

describe('selectFallbackModel', () => {
  beforeEach(() => {
    clearAllExhaustion()
  })

  it('should return the next best model excluding the given one', () => {
    const fallback = selectFallbackModel('code_generation', ['anthropic', 'nvidia'], 'claude-sonnet-4-20250514')
    expect(fallback).not.toBeNull()
    expect(fallback!.modelId).not.toBe('claude-sonnet-4-20250514')
    // Should be NVIDIA Nemotron 340B (88) or Llama 3.1 Nemotron 70B (85)
    expect(fallback!.provider).toBe('nvidia')
  })

  it('should return null if only one model available and excluded', () => {
    const fallback = selectFallbackModel('code_generation', ['ollama'], 'llama3.2')
    expect(fallback).toBeNull()
  })

  it('should skip exhausted models', () => {
    markModelExhausted('nvidia/llama-3.1-nemotron-70b-instruct')
    markModelExhausted('nvidia/nemotron-4-340b-instruct')
    markModelExhausted('nvidia/llama-3.1-nemotron-51b-instruct')
    const fallback = selectFallbackModel('code_generation', ['anthropic', 'nvidia'], 'claude-sonnet-4-20250514')
    expect(fallback).not.toBeNull()
    expect(fallback!.provider).not.toBe('nvidia')
  })

  it('should prefer free models when preferFree is true', () => {
    const fallback = selectFallbackModel('code_generation', ['anthropic', 'nvidia', 'ollama'], 'nvidia/nemotron-4-340b-instruct', true)
    expect(fallback).not.toBeNull()
    // Should prefer NVIDIA or Ollama over Anthropic when preferFree
    expect(fallback!.isFree).toBe(true)
  })
})

describe('selectModelForPrompt', () => {
  beforeEach(() => {
    clearAllExhaustion()
  })

  it('should classify image prompts as vision task', () => {
    const result = selectModelForPrompt('Analyze this image and describe it', ['openai', 'google'])
    expect(result.task).toBe('vision')
  })

  it('should classify picture prompts as vision task', () => {
    const result = selectModelForPrompt('What is in this picture?', ['google'])
    expect(result.task).toBe('vision')
  })

  it('should classify screenshot prompts as vision task', () => {
    const result = selectModelForPrompt('Review this screenshot of a UI', ['openai', 'anthropic'])
    expect(result.task).toBe('vision')
  })

  it('should classify build prompts as code_generation', () => {
    const result = selectModelForPrompt('Build me a pomodoro timer app', ['nvidia'])
    expect(result.task).toBe('code_generation')
  })

  it('should classify create prompts as code_generation', () => {
    const result = selectModelForPrompt('Create a new React component for a login form', ['anthropic'])
    expect(result.task).toBe('code_generation')
  })

  it('should classify code prompts as code_generation', () => {
    const result = selectModelForPrompt('Write code to sort an array of objects', ['deepseek'])
    expect(result.task).toBe('code_generation')
  })

  it('should classify website prompts as code_generation', () => {
    const result = selectModelForPrompt('Design a responsive website', ['nvidia', 'anthropic'])
    expect(result.task).toBe('code_generation')
  })

  it('should classify HTML/CSS prompts as code_generation', () => {
    const result = selectModelForPrompt('Fix the CSS layout and update the HTML structure', ['openai'])
    expect(result.task).toBe('code_generation')
  })

  it('should classify explain prompts as reasoning', () => {
    const result = selectModelForPrompt('Explain how garbage collection works in V8', ['anthropic'])
    expect(result.task).toBe('reasoning')
  })

  it('should classify analyze prompts as reasoning', () => {
    const result = selectModelForPrompt('Analyze the tradeoffs between microservices and monolith', ['google'])
    expect(result.task).toBe('reasoning')
  })

  it('should classify compare prompts as reasoning', () => {
    // "compare" triggers reasoning; must avoid code keywords like "react"/"vue"
    const result = selectModelForPrompt('Compare the pros and cons of investing in bonds vs stocks', ['openai'])
    expect(result.task).toBe('reasoning')
  })

  it('should classify why questions as reasoning', () => {
    // "why" triggers reasoning; must avoid code keywords
    const result = selectModelForPrompt('Why do we need to sleep every night?', ['deepseek'])
    expect(result.task).toBe('reasoning')
  })

  it('should classify quick prompts as fast_inference', () => {
    const result = selectModelForPrompt('Quick summary of the latest TypeScript release', ['groq'])
    expect(result.task).toBe('fast_inference')
  })

  it('should classify summarize prompts as fast_inference', () => {
    const result = selectModelForPrompt('Summarize this meeting transcript', ['groq'])
    expect(result.task).toBe('fast_inference')
  })

  it('should classify translate prompts as fast_inference', () => {
    const result = selectModelForPrompt('Translate this paragraph to French', ['anthropic'])
    expect(result.task).toBe('fast_inference')
  })

  it('should classify generic prompts as chat', () => {
    const result = selectModelForPrompt('What is the capital of France?', ['openai'])
    expect(result.task).toBe('chat')
  })

  it('should classify greetings as chat', () => {
    const result = selectModelForPrompt('Hello, how are you today?', ['anthropic'])
    expect(result.task).toBe('chat')
  })

  it('should return null model when no providers available', () => {
    const result = selectModelForPrompt('Build a todo app', [])
    expect(result.task).toBe('code_generation')
    expect(result.model).toBeNull()
  })

  it('should correctly classify a complex build request', () => {
    const result = selectModelForPrompt(
      'Build me a weather dashboard with charts, showing temperature history for 7 days',
      ['nvidia', 'anthropic', 'openai'],
    )
    expect(result.task).toBe('code_generation')
    expect(result.model).not.toBeNull()
  })

  it('should prefer vision task over code generation for image analysis prompts', () => {
    // "image" keyword should trigger vision, even if "code" is also present
    const result = selectModelForPrompt('Look at this image and write code based on it', ['openai', 'google'])
    expect(result.task).toBe('vision')
  })
})

describe('explainModelSelection', () => {
  it('should return a helpful message for a valid model', () => {
    const model = MODEL_SCORES.find(m => m.modelId === 'claude-sonnet-4-20250514')!
    const explanation = explainModelSelection('code_generation', model)
    expect(explanation).toContain('Claude Sonnet 4')
    expect(explanation).toContain('anthropic')
    expect(explanation).toContain('Code Generation')
    expect(explanation).toContain('excellent')
    expect(explanation).toContain('95/100')
  })

  it('should use "good" rating for scores 75-89', () => {
    const model = MODEL_SCORES.find(m => m.modelId === 'nvidia/llama-3.1-nemotron-70b-instruct')!
    const explanation = explainModelSelection('code_generation', model)
    expect(explanation).toContain('good')
    expect(explanation).toContain('85/100')
  })

  it('should use "adequate" rating for scores 50-74', () => {
    const model = MODEL_SCORES.find(m => m.modelId === 'llama3.2')!
    const explanation = explainModelSelection('code_generation', model)
    expect(explanation).toContain('adequate')
    expect(explanation).toContain('60/100')
  })

  it('should use "basic" rating for scores below 50', () => {
    const model = MODEL_SCORES.find(m => m.modelId === 'openrouter/free')!
    const explanation = explainModelSelection('code_generation', model)
    expect(explanation).toContain('basic')
    expect(explanation).toContain('40/100')
  })

  it('should include free tier label for free models', () => {
    const model = MODEL_SCORES.find(m => m.modelId === 'nvidia/llama-3.1-nemotron-70b-instruct')!
    const explanation = explainModelSelection('code_generation', model)
    expect(explanation).toContain('free tier')
  })

  it('should include local label for local models', () => {
    const model = MODEL_SCORES.find(m => m.modelId === 'llama3.2')!
    const explanation = explainModelSelection('chat', model)
    expect(explanation).toContain('local')
  })

  it('should return no-model message for null', () => {
    const explanation = explainModelSelection('chat', null)
    expect(explanation).toContain('No suitable model available')
    expect(explanation).toContain('Configure a provider')
  })

  it('should not include free tier for paid models', () => {
    const model = MODEL_SCORES.find(m => m.modelId === 'gpt-4o')!
    const explanation = explainModelSelection('chat', model)
    expect(explanation).not.toContain('free tier')
  })
})

describe('Exhaustion Tracking', () => {
  let realDateNow: () => number

  beforeEach(() => {
    realDateNow = Date.now
    clearAllExhaustion()
  })

  afterEach(() => {
    Date.now = realDateNow
    clearAllExhaustion()
  })

  it('should mark a model as exhausted', () => {
    markModelExhausted('nvidia/nemotron-4-340b-instruct', 'Rate limit exceeded')
    expect(isModelExhausted('nvidia/nemotron-4-340b-instruct')).toBe(true)
  })

  it('should not be exhausted if never marked', () => {
    expect(isModelExhausted('some-random-model')).toBe(false)
  })

  it('should get all exhausted models', () => {
    markModelExhausted('model-a', 'Rate limited')
    markModelExhausted('model-b', 'Out of credits')
    const exhausted = getExhaustedModels()
    expect(exhausted.length).toBe(2)
    expect(exhausted[0].reason).toBeTruthy()
    expect(exhausted[0].exhaustedAt).toBeGreaterThan(0)
    expect(exhausted[0].cooldownMs).toBe(EXHAUSTION_COOLDOWN_MS)
  })

  it('should clear a specific exhausted model', () => {
    markModelExhausted('model-a')
    markModelExhausted('model-b')
    clearModelExhaustion('model-a')
    expect(isModelExhausted('model-a')).toBe(false)
    expect(isModelExhausted('model-b')).toBe(true)
  })

  it('should clear all exhausted models', () => {
    markModelExhausted('model-a')
    markModelExhausted('model-b')
    markModelExhausted('model-c')
    clearAllExhaustion()
    expect(getExhaustedModels().length).toBe(0)
  })

  it('should auto-clear exhaustion after cooldown period', () => {
    const now = 1000000
    Date.now = () => now

    markModelExhausted('model-a')
    expect(isModelExhausted('model-a')).toBe(true)

    // Advance time past cooldown
    Date.now = () => now + EXHAUSTION_COOLDOWN_MS + 1
    expect(isModelExhausted('model-a')).toBe(false)
  })

  it('should NOT clear exhaustion before cooldown period', () => {
    const now = 1000000
    Date.now = () => now

    markModelExhausted('model-a')

    // Advance time but NOT past cooldown
    Date.now = () => now + EXHAUSTION_COOLDOWN_MS - 1000
    expect(isModelExhausted('model-a')).toBe(true)
  })

  it('should default reason to "Rate limited"', () => {
    markModelExhausted('model-x')
    const exhausted = getExhaustedModels()
    expect(exhausted[0].reason).toBe('Rate limited')
  })

  it('selectBestModel should skip exhausted models', () => {
    // Mark all NVIDIA models as exhausted
    markModelExhausted('nvidia/llama-3.1-nemotron-70b-instruct')
    markModelExhausted('nvidia/nemotron-4-340b-instruct')
    markModelExhausted('nvidia/llama-3.1-nemotron-51b-instruct')

    const model = selectBestModel('code_generation', ['nvidia', 'anthropic'])
    expect(model).not.toBeNull()
    expect(model!.provider).not.toBe('nvidia')
  })

  it('getExhaustedModels should clean up expired entries while keeping active ones', () => {
    const now = 1000000
    Date.now = () => now

    // Mark model-a at time now
    markModelExhausted('model-a')

    // Advance time to just before cooldown and mark model-b
    Date.now = () => now + EXHAUSTION_COOLDOWN_MS - 5000
    markModelExhausted('model-b')

    // Now advance past model-a's cooldown but not model-b's
    Date.now = () => now + EXHAUSTION_COOLDOWN_MS + 1

    const exhausted = getExhaustedModels()
    // model-a should be cleaned up (past cooldown), model-b should remain
    expect(exhausted.length).toBe(1)
    expect(exhausted[0].modelId).toBe('model-b')
  })
})

describe('EXHAUSTION_COOLDOWN_MS', () => {
  it('should be 5 minutes', () => {
    expect(EXHAUSTION_COOLDOWN_MS).toBe(5 * 60 * 1000)
  })
})
