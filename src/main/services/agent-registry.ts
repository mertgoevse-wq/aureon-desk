import type { AgentDefinition, IntentType } from '../../shared/types/routing'

/**
 * AgentRegistry — 12 built-in agent definitions.
 * Each agent specializes in a set of intents with matching skills and tool suggestions.
 */

export const AGENT_REGISTRY: AgentDefinition[] = [
  {
    id: 'general-assistant',
    name: 'General Assistant',
    description: 'Versatile assistant for general questions, explanations, file operations, and conversations.',
    category: ['general_chat', 'file_operation'],
    requiredSkills: ['communication', 'explanation'],
    suggestedTools: ['file_read'],
    priority: 1,
    isDestructive: false,
  },
  {
    id: 'code-architect',
    name: 'Code Architect',
    description: 'Designs and implements software architecture, components, APIs, and full features.',
    category: ['coding', 'planning'],
    requiredSkills: ['code-generation', 'architecture', 'typescript', 'react', 'nodejs'],
    suggestedTools: ['file_read', 'file_write'],
    priority: 3,
    isDestructive: false,
  },
  {
    id: 'debugger',
    name: 'Debugger',
    description: 'Analyzes bugs, traces errors, reads stack traces, and proposes fixes.',
    category: ['debugging'],
    requiredSkills: ['debugging', 'code-analysis', 'logging'],
    suggestedTools: ['file_read', 'terminal_read'],
    priority: 3,
    isDestructive: false,
  },
  {
    id: 'refactor-engineer',
    name: 'Refactor Engineer',
    description: 'Improves code structure, readability, and performance while preserving behavior.',
    category: ['coding'],
    requiredSkills: ['refactoring', 'code-quality', 'testing'],
    suggestedTools: ['file_read', 'file_write'],
    priority: 3,
    isDestructive: false,
  },
  {
    id: 'test-engineer',
    name: 'Test Engineer',
    description: 'Writes comprehensive tests: unit, integration, e2e, edge cases, and error paths.',
    category: ['coding'],
    requiredSkills: ['testing', 'code-analysis'],
    suggestedTools: ['file_read', 'file_write'],
    priority: 2,
    isDestructive: false,
  },
  {
    id: 'documentation-writer',
    name: 'Documentation Writer',
    description: 'Creates clear, structured documentation, READMEs, guides, and API docs.',
    category: ['writing'],
    requiredSkills: ['writing', 'explanation', 'markdown'],
    suggestedTools: ['file_write'],
    priority: 2,
    isDestructive: false,
  },
  {
    id: 'git-assistant',
    name: 'Git Assistant',
    description: 'Manages version control: commits, branches, merges, PRs, and git workflows.',
    category: ['github_operation', 'terminal_operation'],
    requiredSkills: ['git', 'version-control'],
    suggestedTools: ['git_read', 'git_write'],
    priority: 3,
    isDestructive: true,
  },
  {
    id: 'prompt-engineer',
    name: 'Prompt Engineer',
    description: 'Crafts effective system prompts, prompt templates, and AI interaction patterns.',
    category: ['writing', 'planning'],
    requiredSkills: ['prompt-engineering', 'writing'],
    suggestedTools: [],
    priority: 2,
    isDestructive: false,
  },
  {
    id: 'research-synthesizer',
    name: 'Research Synthesizer',
    description: 'Researches topics, synthesizes findings from multiple sources, and provides evidence-based answers.',
    category: ['research'],
    requiredSkills: ['research', 'synthesis', 'writing'],
    suggestedTools: ['network_outbound'],
    priority: 2,
    isDestructive: false,
  },
  {
    id: 'data-analyst',
    name: 'Data Analyst',
    description: 'Analyzes data, writes queries, generates insights, and creates visualizations.',
    category: ['data_analysis'],
    requiredSkills: ['data-analysis', 'sql', 'visualization'],
    suggestedTools: ['file_read', 'db_read'],
    priority: 2,
    isDestructive: false,
  },
  {
    id: 'security-reviewer',
    name: 'Security Reviewer',
    description: 'Audits code for security vulnerabilities, injection risks, and best practice violations.',
    category: ['security_review', 'debugging'],
    requiredSkills: ['security', 'code-analysis', 'auditing'],
    suggestedTools: ['file_read'],
    priority: 3,
    isDestructive: false,
  },
  {
    id: 'ux-product-designer',
    name: 'UX/Product Designer',
    description: 'Designs interfaces, user flows, component libraries, and visual styling.',
    category: ['design_request'],
    requiredSkills: ['design', 'ui-ux', 'css', 'accessibility'],
    suggestedTools: ['file_write'],
    priority: 2,
    isDestructive: false,
  },
]

/** Get agents that match a given intent, sorted by priority */
export function findAgentsForIntent(intent: IntentType): AgentDefinition[] {
  return AGENT_REGISTRY
    .filter(a => a.category.includes(intent))
    .sort((a, b) => b.priority - a.priority)
}

/** Get all agent IDs */
export function getAllAgentIds(): string[] {
  return AGENT_REGISTRY.map(a => a.id)
}

/** Get an agent by ID */
export function getAgentById(id: string): AgentDefinition | undefined {
  return AGENT_REGISTRY.find(a => a.id === id)
}

/** Get supporting agents for a primary intent (complementary agents) */
export function getSupportingAgents(intent: IntentType, primaryAgentId: string): AgentDefinition[] {
  // Complementary intent pairs
  const complements: Partial<Record<IntentType, IntentType[]>> = {
    coding: ['debugging', 'security_review', 'writing'],
    debugging: ['coding', 'security_review'],
    planning: ['coding', 'writing', 'research'],
    writing: ['research'],
    data_analysis: ['coding', 'writing'],
    github_operation: ['terminal_operation'],
    terminal_operation: ['github_operation'],
    design_request: ['coding', 'writing'],
    security_review: ['coding', 'debugging'],
  }

  const complementaryIntents = complements[intent] || []
  return AGENT_REGISTRY
    .filter(a =>
      a.id !== primaryAgentId &&
      complementaryIntents.some(ci => a.category.includes(ci))
    )
    .slice(0, 3)
}
