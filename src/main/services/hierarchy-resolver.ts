import type { SystemPromptRow, ResolvedPrompt, PromptLayer, PromptWarning, HierarchyInput } from '../../shared/types/prompt'

// Patterns that suggest secrets
const SECRET_PATTERNS = [
  /sk-[a-zA-Z0-9_-]{20,}/,           // Anthropic key
  /sk-[a-zA-Z0-9]{32,}/,             // OpenAI key
  /AIza[0-9A-Za-z_-]{35}/,           // Google AI key
  /(?:api[_-]?key|apikey|secret|token|password)\s*[:=]\s*['"]?\S{8,}['"]?/i,
  /Bearer\s+\S{20,}/i,
  /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----/,
]

// Patterns that might indicate tool permission bypass attempts
const TOOL_BYPASS_PATTERNS = [
  /ignore\s+(?:all\s+)?(?:previous\s+)?instructions/i,
  /bypass\s+(?:all\s+)?(?:tool\s+)?(?:permissions|restrictions)/i,
  /you\s+(?:are\s+)?now\s+(?:an?\s+)?(?:unrestricted|unlimited|god)/i,
  /forget\s+your\s+(?:training|rules|guidelines)/i,
  /pretend\s+you\s+(?:are|don't\s+have)/i,
  /disable\s+(?:all\s+)?safety/i,
]

/**
 * Resolve the final system prompt from the hierarchy.
 *
 * Hierarchy order (bottom to top):
 *   L0: Global base policy
 *   L1: Project instructions
 *   L2: Selected system prompt profile
 *   L3: Chat-level override
 *   L4: Temporary task instruction
 */
export function resolvePrompt(input: HierarchyInput): ResolvedPrompt {
  const layers: PromptLayer[] = []
  const warnings: PromptWarning[] = []

  // L0: Global base policy
  if (input.globalBasePolicy) {
    layers.push({
      name: 'Global Base Policy',
      content: input.globalBasePolicy,
      priority: 0
    })
  }

  // L1: Project instructions
  if (input.projectInstructions) {
    layers.push({
      name: 'Project Instructions',
      content: input.projectInstructions,
      priority: 10
    })
  }

  // L2: System prompt profile
  if (input.selectedProfile && !input.selectedProfile.is_archived) {
    layers.push({
      name: input.selectedProfile.name,
      content: input.selectedProfile.content,
      priority: 20 + (input.selectedProfile.priority || 0)
    })
  }

  // L3: Chat-level override
  if (input.chatOverride) {
    layers.push({
      name: 'Chat Override',
      content: input.chatOverride,
      priority: 30
    })
  }

  // L4: Temporary task instruction (highest priority)
  if (input.taskInstruction) {
    layers.push({
      name: 'Task Instruction',
      content: input.taskInstruction,
      priority: 40
    })
  }

  // Sort layers by priority ascending
  layers.sort((a, b) => a.priority - b.priority)

  // Merge layers into final prompt text
  const text = layers
    .map(layer => `## ${layer.name}\n\n${layer.content}`)
    .join('\n\n---\n\n')

  // Safety checks
  const allContent = layers.map(l => l.content).join('\n')

  // Secret detection
  for (const pattern of SECRET_PATTERNS) {
    const match = allContent.match(pattern)
    if (match) {
      warnings.push({
        type: 'secret_detected',
        message: `Potential secret detected matching pattern: "${match[0].slice(0, 20)}..."`,
        severity: 'high'
      })
    }
  }

  // Tool bypass detection
  for (const pattern of TOOL_BYPASS_PATTERNS) {
    if (pattern.test(allContent)) {
      warnings.push({
        type: 'tool_bypass',
        message: 'Prompt contains language that may attempt to bypass tool permissions or safety restrictions.',
        severity: 'medium'
      })
      break // One warning per category is enough
    }
  }

  // Empty prompt warning
  if (!text.trim()) {
    warnings.push({
      type: 'empty',
      message: 'The resolved system prompt is empty. No behavior guidance is set.',
      severity: 'low'
    })
  }

  return { text, sources: layers, warnings }
}

/**
 * Detect secrets in a single prompt body (used for inline validation in the editor)
 */
export function detectSecrets(content: string): string[] {
  const detected: string[] = []
  for (const pattern of SECRET_PATTERNS) {
    const matches = content.match(pattern)
    if (matches) {
      for (const match of matches) {
        detected.push(match)
      }
    }
  }
  return detected
}

/**
 * Check for tool bypass attempts in a single prompt body
 */
export function checkToolBypass(content: string): boolean {
  return TOOL_BYPASS_PATTERNS.some(pattern => pattern.test(content))
}
