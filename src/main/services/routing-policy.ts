import type {
  RoutingResult, SubagentPlan, SubagentStep,
  AnalyzePromptInput, AnalyzePromptOutput, ToolSuggestion
} from '../../shared/types/routing'
import { analyzePrompt } from './prompt-analyzer'
import { findAgentsForIntent, getSupportingAgents } from './agent-registry'
import { findSkillsByIds } from './skill-registry'
import { logger } from '../utils/logger'

/**
 * RoutingPolicy — deterministic rule-based routing engine.
 * Takes prompt analysis, matches it to agents and skills, and produces a routing plan.
 * No LLM calls — all rule-based.
 */

export function routePrompt(input: AnalyzePromptInput): AnalyzePromptOutput {
  const { content, availableSkills = [] } = input

  // Step 1: Analyze the prompt
  const analysis = analyzePrompt(content)

  // Step 2: Find primary agent matching the intent
  const matchingAgents = findAgentsForIntent(analysis.intent)
  const primaryAgent = matchingAgents[0]

  if (!primaryAgent) {
    logger.warn(`No agent found for intent: ${analysis.intent}`)
    return {
      analysis,
      routing: {
        analysis,
        primaryAgent: findAgentsForIntent('general_chat')[0],
        supportingAgents: [],
        selectedSkills: [],
        suggestedSystemPromptId: null,
        requiredTools: [],
        suggestedTools: [],
        subagentPlan: null,
        riskWarnings: [],
        requiresConfirmation: false,
      },
      timestamp: new Date().toISOString()
    }
  }

  // Step 3: Find supporting agents for complementary intents
  const supportingAgents = getSupportingAgents(analysis.intent, primaryAgent.id)

  // Step 4: Select skills — from agent requirements and analysis context
  const allRequiredSkillIds = [
    ...primaryAgent.requiredSkills,
    ...supportingAgents.flatMap(a => a.requiredSkills)
  ]
  const selectedSkills = findSkillsByIds([...new Set(allRequiredSkillIds)])

  // Step 5: Determine required tools
  const requiredTools = [
    ...new Set([
      ...primaryAgent.suggestedTools,
      ...supportingAgents.flatMap(a => a.suggestedTools)
    ])
  ]

  // Step 6: Build subagent plan for complex tasks
  const isComplex =
    supportingAgents.length >= 2 ||
    analysis.riskLevel === 'high' ||
    analysis.riskLevel === 'destructive' ||
    analysis.intent === 'coding' ||
    analysis.intent === 'data_analysis'

  const subagentPlan: SubagentPlan | null = isComplex ? buildSubagentPlan(
    primaryAgent,
    supportingAgents,
    analysis.riskLevel
  ) : null

  // Step 7: Risk warnings
  const riskWarnings: string[] = []
  if (analysis.riskLevel === 'destructive') {
    riskWarnings.push('⚠️ This request involves potentially destructive operations.')
  }
  if (primaryAgent.isDestructive) {
    riskWarnings.push(`Agent "${primaryAgent.name}" can perform destructive operations.`)
  }
  if (analysis.requiredPermissions.some(p => ['git_push', 'file_delete', 'terminal_write'].includes(p))) {
    riskWarnings.push('⚠️ This request requires elevated permissions. Please review each action.')
  }
  if (analysis.confidence < 0.3) {
    riskWarnings.push('Low-confidence intent classification. Results may not match your intent.')
  }

  // Step 8: Determine if confirmation is needed
  const requiresConfirmation =
    analysis.riskLevel === 'destructive' ||
    analysis.riskLevel === 'high' ||
    primaryAgent.isDestructive ||
    analysis.requiredPermissions.includes('git_push') ||
    analysis.requiredPermissions.includes('file_delete')

  // Resolve tool suggestions from requiredTools list
  const suggestedTools: ToolSuggestion[] = requiredTools.map(t => ({
    id: t,
    name: t,
    description: `Suggested tool: ${t}`
  }))

  const routing: RoutingResult = {
    analysis,
    primaryAgent,
    supportingAgents,
    selectedSkills,
    suggestedSystemPromptId: null,  // Will be resolved by the prompt service
    requiredTools,
    suggestedTools,
    subagentPlan,
    riskWarnings,
    requiresConfirmation,
  }

  logger.info(`Routed prompt: intent=${analysis.intent}, agent=${primaryAgent.name}, risk=${analysis.riskLevel}`)

  return {
    analysis,
    routing,
    timestamp: new Date().toISOString()
  }
}

function buildSubagentPlan(
  primary: { id: string; name: string },
  supporting: Array<{ id: string; name: string }>,
  riskLevel: string
): SubagentPlan {
  const steps: SubagentStep[] = []

  // Step 1: Research/analysis agent (if applicable)
  const researchAgent = supporting.find(a => a.id === 'research-synthesizer')
  if (researchAgent) {
    steps.push({
      order: 1,
      agentId: researchAgent.id,
      agentName: researchAgent.name,
      description: 'Research and gather context',
      skills: ['research', 'synthesis'],
      tools: ['network_outbound'],
      riskLevel: 'low',
      requiresConfirmation: false,
    })
  }

  // Step 2: Planning agent (if applicable)
  const plannerAgent = supporting.find(a => a.id === 'code-architect' || a.id === 'prompt-engineer')
  if (plannerAgent) {
    steps.push({
      order: steps.length + 1,
      agentId: plannerAgent.id,
      agentName: plannerAgent.name,
      description: 'Create an execution plan',
      skills: ['architecture', 'planning'],
      tools: [],
      riskLevel: 'low',
      requiresConfirmation: false,
    })
  }

  // Step 3: Primary execution agent
  steps.push({
    order: steps.length + 1,
    agentId: primary.id,
    agentName: primary.name,
    description: 'Execute the primary task',
    skills: [], // Filled by routing policy
    tools: [],
    riskLevel: riskLevel as 'low' | 'medium' | 'high' | 'destructive',
    requiresConfirmation: riskLevel === 'destructive' || riskLevel === 'high',
  })

  // Step 4: Review/testing agent
  const reviewerAgent = supporting.find(a =>
    a.id === 'security-reviewer' || a.id === 'test-engineer' || a.id === 'documentation-writer'
  )
  if (reviewerAgent) {
    steps.push({
      order: steps.length + 1,
      agentId: reviewerAgent.id,
      agentName: reviewerAgent.name,
      description: 'Review and validate results',
      skills: ['code-analysis', 'testing'],
      tools: ['file_read'],
      riskLevel: 'low',
      requiresConfirmation: false,
    })
  }

  const complexity =
    steps.length <= 2 ? 'simple' :
    steps.length === 3 ? 'moderate' :
    'complex'

  return {
    summary: `${steps.length}-step execution plan using ${[...new Set(steps.map(s => s.agentName))].join(', ')}`,
    steps,
    estimatedComplexity: complexity,
  }
}
