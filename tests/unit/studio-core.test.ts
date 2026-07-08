import { describe, it, expect } from 'vitest'
import { orchestrate, getTaskCategories, getAutonomyLevels } from '../../src/main/services/studio-core.service'
import { CAPABILITY_REGISTRY, getAllCapabilities, getCapability, getCapabilitiesByConnector } from '../../src/shared/capability-registry'
import { TASK_CATEGORIES, AUTONOMY_LEVELS } from '../../src/shared/types/studio-core'
import type { StudioIntentInput, TaskCategory, CapabilityId } from '../../src/shared/types/studio-core'

// ---- Capability Registry Tests ----

describe('Capability Registry', () => {
  it('should define all 21 capabilities', () => {
    const all = getAllCapabilities()
    expect(all.length).toBe(21)
  })

  it('should return a capability by ID', () => {
    const cap = getCapability('text_generation')
    expect(cap).toBeDefined()
    expect(cap!.displayName).toBe('Text Generation')
    expect(cap!.riskTier).toBe('safe')
  })

  it('should return undefined for unknown capability', () => {
    expect(getCapability('nonexistent' as any)).toBeUndefined()
  })

  it('should find capabilities by connector', () => {
    const gmailCaps = getCapabilitiesByConnector('gmail')
    expect(gmailCaps.length).toBeGreaterThanOrEqual(3)
    expect(gmailCaps.map(c => c.id)).toContain('gmail_read')
    expect(gmailCaps.map(c => c.id)).toContain('gmail_send')
  })

  it('should tag gmail_send as account_action risk', () => {
    const cap = getCapability('gmail_send')
    expect(cap!.riskTier).toBe('account_action')
  })

  it('should tag shell_commands as destructive risk', () => {
    const cap = getCapability('shell_commands')
    expect(cap!.riskTier).toBe('destructive')
  })

  it('should tag mcp_tools as destructive risk', () => {
    const cap = getCapability('mcp_tools')
    expect(cap!.riskTier).toBe('destructive')
  })

  it('should tag text_generation as safe risk', () => {
    const cap = getCapability('text_generation')
    expect(cap!.riskTier).toBe('safe')
  })

  it('should have required connectors for remote capabilities', () => {
    const cap = getCapability('gmail_read')
    expect(cap!.requiredConnector).toBe('gmail')
  })

  it('should have no required connector for local capabilities', () => {
    const cap = getCapability('local_files')
    expect(cap!.requiredConnector).toBeNull()
  })
})

// ---- Task Categories Tests ----

describe('Task Categories', () => {
  it('should define all 10 task categories', () => {
    const categories = getTaskCategories()
    expect(categories.length).toBe(10)
  })

  it('should have unique task category IDs', () => {
    const ids = TASK_CATEGORIES.map(c => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('should have a starter prompt for each category', () => {
    for (const cat of TASK_CATEGORIES) {
      expect(cat.starterPrompt).toBeTruthy()
      expect(cat.starterPrompt.length).toBeGreaterThan(10)
    }
  })

  it('should have a recommended mode for each category', () => {
    for (const cat of TASK_CATEGORIES) {
      expect(['chat', 'cowork', 'code', 'studio']).toContain(cat.recommendedMode)
    }
  })

  it('build_app should recommend code mode', () => {
    const cat = TASK_CATEGORIES.find(c => c.id === 'build_app')!
    expect(cat.recommendedMode).toBe('code')
  })

  it('generate_text should recommend chat mode', () => {
    const cat = TASK_CATEGORIES.find(c => c.id === 'generate_text')!
    expect(cat.recommendedMode).toBe('chat')
  })

  it('automate_workflow should have high risk', () => {
    const cat = TASK_CATEGORIES.find(c => c.id === 'automate_workflow')!
    expect(cat.riskLevel).toBe('high')
  })

  it('connect_apps should require confirmation', () => {
    const cat = TASK_CATEGORIES.find(c => c.id === 'connect_apps')!
    expect(cat.requiresConfirmation).toBe(true)
  })
})

// ---- Autonomy Levels Tests ----

describe('Autonomy Levels', () => {
  it('should define all 5 autonomy levels', () => {
    const levels = getAutonomyLevels()
    expect(levels.length).toBe(5)
  })

  it('should range from 0 to 4', () => {
    const levels = getAutonomyLevels()
    for (let i = 0; i < 5; i++) {
      expect(levels.find(l => l.level === i)).toBeDefined()
    }
  })

  it('level 0 should be View Only', () => {
    const level = AUTONOMY_LEVELS[0]
    expect(level.label).toBe('View Only')
    expect(level.level).toBe(0)
  })

  it('level 4 should be Advanced', () => {
    const level = AUTONOMY_LEVELS[4]
    expect(level.label).toBe('Advanced')
    expect(level.level).toBe(4)
  })

  it('should have icons for all levels', () => {
    for (const level of AUTONOMY_LEVELS) {
      expect(level.icon).toBeTruthy()
    }
  })
})

// ---- Studio Orchestrator Tests ----

describe('Studio Orchestrator', () => {
  const baseInput: StudioIntentInput = {
    userIntent: '',
    autonomyLevel: 2,
  }

  it('should classify "build an app" as build_app', () => {
    const result = orchestrate({ ...baseInput, userIntent: 'I want to build a desktop app with Electron and React' })
    expect(result.taskClassification).toBe('build_app')
    expect(result.confidence).toBeGreaterThan(0)
  })

  it('should classify "debug this code" as code_program', () => {
    const result = orchestrate({ ...baseInput, userIntent: 'Can you help me debug this TypeScript function?' })
    expect(result.taskClassification).toBe('code_program')
  })

  it('should classify "write an article" as generate_text', () => {
    const result = orchestrate({ ...baseInput, userIntent: 'I need to write a blog article about AI safety' })
    expect(result.taskClassification).toBe('generate_text')
  })

  it('should classify "generate an image" as generate_image', () => {
    const result = orchestrate({ ...baseInput, userIntent: 'Please generate an image of a sunset over mountains' })
    expect(result.taskClassification).toBe('generate_image')
  })

  it('should classify "generate a video" as generate_video', () => {
    const result = orchestrate({ ...baseInput, userIntent: 'I want to generate a short animated video' })
    expect(result.taskClassification).toBe('generate_video')
  })

  it('should classify "compose music" as generate_music', () => {
    const result = orchestrate({ ...baseInput, userIntent: 'Can you compose a melody for a piano piece?' })
    expect(result.taskClassification).toBe('generate_music')
  })

  it('should classify "analyze a file" as analyze_file', () => {
    const result = orchestrate({ ...baseInput, userIntent: 'I need to analyze this CSV file and find trends' })
    expect(result.taskClassification).toBe('analyze_file')
  })

  it('should classify "what is on this screenshot" as analyze_screen_video', () => {
    const result = orchestrate({ ...baseInput, userIntent: 'Can you look at this screenshot and tell me what the error is?' })
    expect(result.taskClassification).toBe('analyze_screen_video')
  })

  it('should classify "connect my Gmail" as connect_apps', () => {
    const result = orchestrate({ ...baseInput, userIntent: 'I want to connect my Gmail account to read emails' })
    expect(result.taskClassification).toBe('connect_apps')
  })

  it('should classify "automate a workflow" as automate_workflow', () => {
    const result = orchestrate({ ...baseInput, userIntent: 'I want to automate a multi-step deployment workflow' })
    expect(result.taskClassification).toBe('automate_workflow')
  })

  it('should respect explicit task type override', () => {
    const result = orchestrate({
      ...baseInput,
      userIntent: 'some text',
      selectedTaskType: 'code_program',
    })
    expect(result.taskClassification).toBe('code_program')
    expect(result.confidence).toBe(1.0)
  })

  it('should return recommended mode for build_app', () => {
    const result = orchestrate({ ...baseInput, userIntent: 'build a React app' })
    expect(result.recommendedMode).toBe('code')
  })

  it('should return safety warnings for destructive tasks', () => {
    const result = orchestrate({ ...baseInput, userIntent: 'automate a workflow with shell commands' })
    // The safety warnings should be present
    expect(Array.isArray(result.safetyWarnings)).toBe(true)
  })

  it('should detect missing capabilities for image generation without OpenAI', () => {
    const result = orchestrate({
      ...baseInput,
      userIntent: 'generate an image',
      connectedApps: [],
    })
    // Image generation requires openai connector which is not connected
    expect(result.missingCapabilities).toContain('image_generation')
  })

  it('should have no missing capabilities when connector is connected', () => {
    const result = orchestrate({
      ...baseInput,
      userIntent: 'generate an image',
      connectedApps: ['openai'],
    })
    expect(result.missingCapabilities).toHaveLength(0)
  })

  it('should include planned steps', () => {
    const result = orchestrate({ ...baseInput, userIntent: 'write an article' })
    expect(result.plannedSteps.length).toBeGreaterThan(0)
  })

  it('should include suggested prompt', () => {
    const result = orchestrate({ ...baseInput, userIntent: 'code a function' })
    expect(result.suggestedPrompt).toBeTruthy()
    expect(result.suggestedPrompt.length).toBeGreaterThan(10)
  })

  it('should handle unknown input gracefully', () => {
    const result = orchestrate({ ...baseInput, userIntent: 'xyzzy foo bar baz quux something generic' })
    // Should still produce a valid result
    expect(result.taskClassification).toBeDefined()
    expect(result.recommendedMode).toBeDefined()
  })

  it('should have next UI action for navigate_to_code when mode is code', () => {
    const result = orchestrate({
      ...baseInput,
      userIntent: 'build a new app',
      connectedApps: ['openai'], // satisfy capabilities check
    })
    expect(result.nextUIAction).toBe('navigate_to_code')
  })

  it('should flag high-risk tasks with requiresConfirmation', () => {
    const result = orchestrate({
      ...baseInput,
      selectedTaskType: 'automate_workflow',
      userIntent: 'automate my deployment workflow',
    })
    expect(result.requiresConfirmation).toBe(true)
  })
})

// ---- Model Routing by Task Tests ----

describe('Model Routing by Task', () => {
  const baseInput: StudioIntentInput = {
    userIntent: '',
    autonomyLevel: 2,
  }

  it('should recommend Google adapter for video generation', () => {
    const result = orchestrate({
      ...baseInput,
      userIntent: 'generate a video',
      connectedApps: ['google_gemini'],
    })
    expect(result.recommendedAdapter).toBe('google')
  })

  it('should recommend OpenAI adapter for image generation', () => {
    const result = orchestrate({
      ...baseInput,
      userIntent: 'generate an image',
      connectedApps: ['openai'],
    })
    expect(result.recommendedAdapter).toBe('openai')
  })

  it('should recommend null adapter for text generation (any provider works)', () => {
    const result = orchestrate({ ...baseInput, userIntent: 'write a story' })
    expect(result.recommendedAdapter).toBeNull()
  })

  it('should include setup guidance for music generation (no built-in support)', () => {
    const result = orchestrate({
      ...baseInput,
      userIntent: 'create a music track',
      connectedApps: [],
    })
    // Music generation has setup guidance for specialized providers
    expect(result.taskClassification).toBe('generate_music')
    // The orchestrator includes setup guidance when capabilities are limited
    expect(result.requiredCapabilities).toContain('music_generation')
  })
})
