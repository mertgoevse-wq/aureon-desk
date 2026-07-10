// === Vibeforge Studio Core — Orchestrator Service ===
// Central orchestrator: accepts user intent, classifies tasks, routes to best model,
// recommends workspace mode, and generates guided prompts.

import type {
  StudioIntentInput,
  StudioOrchestrationResult,
  TaskCategory,
  WorkspaceMode,
  CapabilityId,
  TaskModelPolicy,
} from '../../shared/types/studio-core'
import { TASK_CATEGORIES, AUTONOMY_LEVELS } from '../../shared/types/studio-core'
import { CAPABILITY_REGISTRY, getCapabilitiesByConnector } from '../../shared/capability-registry'
import { logger } from '../utils/logger'

// ---- Task Classification (keyword-based, same pattern as prompt-analyzer) ----

const TASK_KEYWORDS: Array<{ patterns: RegExp[]; category: TaskCategory; weight: number }> = [
  {
    patterns: [
      /\b(build|create|make|scaffold|generate).*(app|application|website|site|desktop app|mobile app|electron app|web app)\b/i,
      /\b(full app|complete app|from scratch).*(app|application)\b/i,
    ],
    category: 'build_app',
    weight: 1.0,
  },
  {
    patterns: [
      /\b(code|program|script|function|class|module|api endpoint|route|hook|component)\b/i,
      /\b(implement|write code|debug|refactor|fix bug|fix error).*(code|function|program)\b/i,
      /\b(typescript|javascript|python|rust|go|c\+\+|java|react|electron)\b/i,
    ],
    category: 'code_program',
    weight: 0.9,
  },
  {
    patterns: [
      /\b(write|draft|compose|generate|create).*(text|article|blog|essay|story|email|documentation|readme)\b/i,
      /\b(text generation|content writing|copywriting)\b/i,
    ],
    category: 'generate_text',
    weight: 0.85,
  },
  {
    patterns: [
      /\b(generate|create|make|draw).*(image|picture|photo|logo|icon|illustration|art|graphic)\b/i,
      /\b(image generation|dall-e|stable diffusion|midjourney)\b/i,
    ],
    category: 'generate_image',
    weight: 0.9,
  },
  {
    patterns: [
      /\b(generate|create|make).*(video|animation|clip|movie|film|motion)\b/i,
      /\b(video generation|veo|sora|runway)\b/i,
    ],
    category: 'generate_video',
    weight: 0.9,
  },
  {
    patterns: [
      /\b(generate|create|make|compose).*(music|song|track|melody|beat|soundtrack|audio)\b/i,
      /\b(music generation|suno|udio)\b/i,
    ],
    category: 'generate_music',
    weight: 0.9,
  },
  {
    patterns: [
      /\b(analyze|examine|inspect|review|check|look at).*(file|document|data|csv|json|log)\b/i,
      /\b(upload.*(file|document)|attach.*(file|document))\b/i,
    ],
    category: 'analyze_file',
    weight: 0.8,
  },
  {
    patterns: [
      /\b(analyze|examine|look at|review).*(screenshot|screen|video|recording|clip)\b/i,
      /\b(what.*(?:see|show|display).*(?:screen|screenshot))\b/i,
    ],
    category: 'analyze_screen_video',
    weight: 0.85,
  },
  {
    patterns: [
      /\b(connect|link|integrate|set up|configure).*(gmail|google|github|api|service|app|account|oauth)\b/i,
      /\b(connector|connection|integration)\b/i,
    ],
    category: 'connect_apps',
    weight: 0.9,
  },
  {
    patterns: [
      /\b(automate|workflow|pipeline|chain|schedule|batch).*(task|process|job|action|step|deploy|operation)\b/i,
      /\b(multi-step|orchestrat|sequence).*(action|task|step)\b/i,
    ],
    category: 'automate_workflow',
    weight: 0.8,
  },
]

function classifyTask(intent: string): { category: TaskCategory; confidence: number } {
  let bestCategory: TaskCategory = 'code_program'
  let bestScore = 0

  for (const rule of TASK_KEYWORDS) {
    let matches = 0
    for (const pattern of rule.patterns) {
      if (pattern.test(intent)) {
        matches++
      }
    }
    const score = matches > 0 ? rule.weight * (matches / rule.patterns.length) : 0
    if (score > bestScore) {
      bestScore = score
      bestCategory = rule.category
    }
  }

  return {
    category: bestCategory,
    confidence: Math.min(bestScore * 2, 1.0),
  }
}

// ---- Model Routing by Task ----

const TASK_MODEL_POLICY: Record<TaskCategory, TaskModelPolicy> = {
  build_app: {
    preferredAdapterSlug: null,
    requiredCapabilityFlags: ['text', 'tool_use'],
    preferLocal: false,
    fallbackToFree: false,
    setupGuidance: 'You need a coding-capable model. Configure OpenAI, Anthropic, or Google Gemini with an API key in Settings > Providers.',
  },
  code_program: {
    preferredAdapterSlug: null,
    requiredCapabilityFlags: ['text', 'tool_use'],
    preferLocal: false,
    fallbackToFree: true,
    setupGuidance: 'You need a coding model. Configure OpenAI, Anthropic, Google Gemini, or OpenRouter (free tier available).',
  },
  generate_text: {
    preferredAdapterSlug: null,
    requiredCapabilityFlags: ['text'],
    preferLocal: false,
    fallbackToFree: true,
    setupGuidance: 'You need a text generation model. Configure any provider in Settings > Providers. OpenRouter free tier works.',
  },
  generate_image: {
    preferredAdapterSlug: 'openai',
    requiredCapabilityFlags: ['text'],
    preferLocal: false,
    fallbackToFree: false,
    setupGuidance: 'Image generation requires a provider with image capabilities. Configure OpenAI (DALL-E) or a compatible provider.',
  },
  generate_video: {
    preferredAdapterSlug: 'google',
    requiredCapabilityFlags: ['text'],
    preferLocal: false,
    fallbackToFree: false,
    setupGuidance: 'Video generation requires a provider with video capabilities. Configure Google Gemini or a compatible provider.',
  },
  generate_music: {
    preferredAdapterSlug: null,
    requiredCapabilityFlags: ['text'],
    preferLocal: false,
    fallbackToFree: false,
    setupGuidance: 'Music generation requires a specialized provider. Currently in planning — no built-in provider supports music generation yet.',
  },
  analyze_file: {
    preferredAdapterSlug: null,
    requiredCapabilityFlags: ['text', 'vision'],
    preferLocal: false,
    fallbackToFree: false,
    setupGuidance: 'File analysis needs a vision-capable model. Configure OpenAI (GPT-4o), Anthropic (Claude), or Google Gemini.',
  },
  analyze_screen_video: {
    preferredAdapterSlug: 'google',
    requiredCapabilityFlags: ['text', 'vision'],
    preferLocal: false,
    fallbackToFree: false,
    setupGuidance: 'Video/screen analysis needs a vision-capable model. Google Gemini is recommended for video understanding.',
  },
  connect_apps: {
    preferredAdapterSlug: null,
    requiredCapabilityFlags: ['text'],
    preferLocal: false,
    fallbackToFree: true,
    setupGuidance: 'Connecting apps needs a text model. Configure any provider in Settings > Providers.',
  },
  automate_workflow: {
    preferredAdapterSlug: null,
    requiredCapabilityFlags: ['text', 'tool_use'],
    preferLocal: false,
    fallbackToFree: false,
    setupGuidance: 'Workflow automation needs a tool-capable model. Configure OpenAI, Anthropic, or Google Gemini.',
  },
}

// ---- Main Orchestrator ----

export function orchestrate(input: StudioIntentInput): StudioOrchestrationResult {
  const {
    userIntent,
    selectedTaskType,
    selectedMode,
    connectedApps = [],
    autonomyLevel,
  } = input

  // 1. Classify task
  const classification = selectedTaskType
    ? { category: selectedTaskType, confidence: 1.0 }
    : classifyTask(userIntent)

  const taskInfo = TASK_CATEGORIES.find(t => t.id === classification.category)!

  // 2. Determine capabilities needed
  const requiredCapabilities = taskInfo.requiredCapabilities

  // 3. Model routing
  const policy = TASK_MODEL_POLICY[classification.category]
  const recommendedAdapter = policy.preferredAdapterSlug
  const recommendedModel = null // resolved at UI layer from available models

  // 4. Safety warnings
  const safetyWarnings: string[] = []

  // Check for risky capabilities
  for (const capId of requiredCapabilities) {
    const cap = CAPABILITY_REGISTRY[capId]
    if (!cap) continue
    if (cap.riskTier === 'account_action') {
      safetyWarnings.push(`⚠️ This task may access external accounts (${cap.displayName}). Every action requires confirmation.`)
    }
    if (cap.riskTier === 'destructive') {
      safetyWarnings.push(`⚠️ This task may perform destructive operations (${cap.displayName}). Review each action carefully.`)
    }
    if (cap.mayUploadRemotely) {
      safetyWarnings.push(`ℹ️ Files or data may be sent to remote AI providers for processing.`)
    }
  }

  // Check autonomy level
  if (autonomyLevel >= 4) {
    safetyWarnings.push('⚠️ Advanced autonomy mode is active. Destructive and account actions still require confirmation.')
  }

  // Check for missing capabilities
  const missingCapabilities: CapabilityId[] = []
  for (const capId of requiredCapabilities) {
    const cap = CAPABILITY_REGISTRY[capId]
    if (!cap) continue
    if (cap.requiredConnector && !connectedApps.includes(cap.requiredConnector)) {
      missingCapabilities.push(capId)
    }
  }

  // 5. Determine mode
  const recommendedMode: WorkspaceMode = selectedMode || taskInfo.recommendedMode

  // 6. Determine next UI action
  let nextUIAction: StudioOrchestrationResult['nextUIAction'] = 'navigate_to_chat'
  if (missingCapabilities.length > 0) {
    nextUIAction = 'show_setup_guidance'
  } else if (taskInfo.requiresConfirmation) {
    nextUIAction = 'show_confirmation'
  } else if (recommendedMode === 'code') {
    nextUIAction = 'navigate_to_code'
  } else if (recommendedMode === 'cowork') {
    nextUIAction = 'navigate_to_cowork'
  } else if (recommendedMode === 'studio') {
    nextUIAction = 'open_connectors'
  }

  // 7. Build planned steps
  const plannedSteps: string[] = []
  if (missingCapabilities.length > 0) {
    plannedSteps.push(`1. Set up required connectors: ${missingCapabilities.map(id => CAPABILITY_REGISTRY[id]?.displayName || id).join(', ')}`)
    plannedSteps.push(`2. ${policy.setupGuidance}`)
  } else {
    plannedSteps.push(`1. Review the suggested prompt and customize if needed`)
    plannedSteps.push(`2. Confirm the task and mode (${recommendedMode})`)
    if (autonomyLevel <= 2) {
      plannedSteps.push(`3. Each action will ask for confirmation before executing`)
    }
    if (autonomyLevel >= 3) {
      plannedSteps.push(`3. Workspace actions will auto-execute; destructive actions still require confirmation`)
    }
  }

  // 8. Required permissions
  const requiredPermissions: string[] = []
  for (const capId of requiredCapabilities) {
    const cap = CAPABILITY_REGISTRY[capId]
    if (!cap) continue
    if (cap.permissionRequired) {
      requiredPermissions.push(cap.displayName)
    }
  }

  const result: StudioOrchestrationResult = {
    taskClassification: classification.category,
    confidence: classification.confidence,
    recommendedMode,
    recommendedAdapter,
    recommendedModel,
    requiredCapabilities,
    requiredPermissions,
    plannedSteps,
    suggestedPrompt: taskInfo.starterPrompt,
    nextUIAction,
    safetyWarnings,
    missingCapabilities,
    requiresConfirmation: taskInfo.requiresConfirmation || missingCapabilities.length > 0,
  }

  logger.info(`Studio orchestrated: task=${classification.category}, mode=${recommendedMode}, confidence=${classification.confidence.toFixed(2)}, missing=${missingCapabilities.length}`)

  return result
}

/** Get all task categories for the launcher UI */
export function getTaskCategories() {
  return TASK_CATEGORIES
}

/** Get autonomy level info for the settings UI */
export function getAutonomyLevels() {
  return AUTONOMY_LEVELS
}


