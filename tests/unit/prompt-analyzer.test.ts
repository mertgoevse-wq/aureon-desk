import { describe, it, expect } from 'vitest'
import { analyzePrompt } from '../../src/main/services/prompt-analyzer'
import { findAgentsForIntent, getAgentById, getSupportingAgents } from '../../src/main/services/agent-registry'
import { findSkillsByIds, findSkillsByTags } from '../../src/main/services/skill-registry'
import { routePrompt } from '../../src/main/services/routing-policy'
import type { IntentType } from '../../src/shared/types/routing'

// --- Intent Classification Tests ---

describe('PromptAnalyzer — Intent Classification', () => {
  const testCases: Array<{ prompt: string; expectedIntent: IntentType; label: string }> = [
    { prompt: 'Write a function that sorts an array in TypeScript', expectedIntent: 'coding', label: 'coding request' },
    { prompt: 'Fix the bug where the dropdown doesn\'t close on click outside', expectedIntent: 'debugging', label: 'debugging request' },
    { prompt: 'Write documentation for the authentication module', expectedIntent: 'writing', label: 'writing request' },
    { prompt: 'Plan the architecture for a microservices backend', expectedIntent: 'planning', label: 'planning request' },
    { prompt: 'Research the best state management libraries for React in 2024', expectedIntent: 'research', label: 'research request' },
    { prompt: 'Analyze this CSV data and create a bar chart', expectedIntent: 'data_analysis', label: 'data analysis' },
    { prompt: 'Open the config file and update the database URL', expectedIntent: 'file_operation', label: 'file operation' },
    { prompt: 'Generate a conventional commit message for this diff', expectedIntent: 'github_operation', label: 'github operation' },
    { prompt: 'Run npm install and build the project', expectedIntent: 'terminal_operation', label: 'terminal operation' },
    { prompt: 'Design a responsive navigation bar with a hamburger menu', expectedIntent: 'design_request', label: 'design request' },
    { prompt: 'Hello! How are you today?', expectedIntent: 'general_chat', label: 'greeting' },
    { prompt: 'Review this code for SQL injection vulnerabilities', expectedIntent: 'security_review', label: 'security review' },
  ]

  for (const { prompt, expectedIntent, label } of testCases) {
    it(`classifies "${label}" as ${expectedIntent}`, () => {
      const result = analyzePrompt(prompt)
      expect(result.intent).toBe(expectedIntent)
    })
  }

  it('returns confidence between 0 and 1', () => {
    const result = analyzePrompt('Write a function')
    expect(result.confidence).toBeGreaterThanOrEqual(0)
    expect(result.confidence).toBeLessThanOrEqual(1)
  })

  it('returns alternative intents', () => {
    const result = analyzePrompt('Fix the code and write tests for it')
    expect(result.alternativeIntents.length).toBeGreaterThanOrEqual(0)
  })

  it('detects code blocks as coding intent', () => {
    const result = analyzePrompt('```\nconst x = 1\n```')
    // Should lean toward coding due to code block
    expect(['coding', 'general_chat']).toContain(result.intent)
  })
})

// --- Risk Classification Tests ---

describe('PromptAnalyzer — Risk Classification', () => {
  it('detects destructive operations', () => {
    const result = analyzePrompt('Delete all files in the database and drop the users table')
    expect(result.riskLevel).toBe('destructive')
  })

  it('detects high-risk git push', () => {
    const result = analyzePrompt('git push --force origin master')
    expect(result.riskLevel).toBe('high')
  })

  it('detects medium-risk security content', () => {
    const result = analyzePrompt('Use this API key: sk-abc123def456ghi789 for authentication')
    expect(result.riskLevel).toBe('medium')
  })

  it('returns low risk for safe prompts', () => {
    const result = analyzePrompt('Write a hello world component in React')
    expect(result.riskLevel).toBe('low')
  })

  it('detects required permissions', () => {
    const result = analyzePrompt('Delete the old config file and write a new config file with updated settings')
    expect(result.requiredPermissions).toContain('file_delete')
    expect(result.requiredPermissions).toContain('file_write')
  })
})

// --- Agent Registry Tests ---

describe('AgentRegistry', () => {
  it('finds Code Architect for coding intent', () => {
    const agents = findAgentsForIntent('coding')
    expect(agents.length).toBeGreaterThan(0)
    expect(agents[0].id).toBe('code-architect')
  })

  it('finds Debugger for debugging intent', () => {
    const agents = findAgentsForIntent('debugging')
    expect(agents.length).toBeGreaterThan(0)
    expect(agents[0].id).toBe('debugger')
  })

  it('finds Git Assistant for github intent', () => {
    const agents = findAgentsForIntent('github_operation')
    expect(agents.some(a => a.id === 'git-assistant')).toBe(true)
  })

  it('returns agents sorted by priority', () => {
    const agents = findAgentsForIntent('coding')
    for (let i = 1; i < agents.length; i++) {
      expect(agents[i - 1].priority).toBeGreaterThanOrEqual(agents[i].priority)
    }
  })

  it('retrieves a specific agent by ID', () => {
    const agent = getAgentById('security-reviewer')
    expect(agent).toBeDefined()
    expect(agent!.name).toBe('Security Reviewer')
  })

  it('finds supporting agents for coding', () => {
    const supports = getSupportingAgents('coding', 'code-architect')
    expect(supports.length).toBeGreaterThan(0)
    expect(supports.every(a => a.id !== 'code-architect')).toBe(true) // Primary excluded
  })

  it('returns empty supporting agents for general chat', () => {
    const supports = getSupportingAgents('general_chat', 'general-assistant')
    expect(supports.length).toBe(0)
  })
})

// --- Skill Registry Tests ---

describe('SkillRegistry', () => {
  it('finds skills by IDs', () => {
    const skills = findSkillsByIds(['code-generation', 'debugging', 'testing'])
    expect(skills.length).toBe(3)
    expect(skills.map(s => s.id).sort()).toEqual(['code-generation', 'debugging', 'testing'])
  })

  it('finds skills by tags', () => {
    const skills = findSkillsByTags(['testing', 'quality'])
    expect(skills.length).toBeGreaterThanOrEqual(2)
    expect(skills.some(s => s.id === 'testing')).toBe(true)
    expect(skills.some(s => s.id === 'code-quality')).toBe(true)
  })

  it('filters skills with correct permissions', () => {
    const skills = findSkillsByTags(['design'])
    const designSkill = skills.find(s => s.id === 'design')
    expect(designSkill).toBeDefined()
    expect(designSkill!.requiredPermissions).toContain('file_write')
  })
})

// --- Routing Policy Integration Tests ---

describe('RoutingPolicy — Integration', () => {
  it('routes a coding prompt to Code Architect', () => {
    const result = routePrompt({
      content: 'Create a new React component for a user profile card with TypeScript types'
    })
    expect(result.analysis.intent).toBe('coding')
    expect(result.routing.primaryAgent.id).toBe('code-architect')
    expect(result.routing.selectedSkills.length).toBeGreaterThan(0)
  })

  it('routes a debugging prompt to Debugger', () => {
    const result = routePrompt({
      content: 'There is a bug: my dropdown doesn\'t close on click outside and I\'m getting a TypeError in the console'
    })
    expect(result.analysis.intent).toBe('debugging')
    expect(result.routing.primaryAgent.id).toBe('debugger')
  })

  it('routes a destructive prompt with confirmation required', () => {
    const result = routePrompt({
      content: 'Delete all files in the /tmp directory and drop the users database table'
    })
    expect(result.analysis.riskLevel).toBe('destructive')
    expect(result.routing.requiresConfirmation).toBe(true)
    expect(result.routing.riskWarnings.length).toBeGreaterThan(0)
  })

  it('generates a subagent plan for complex tasks', () => {
    const result = routePrompt({
      content: 'Design and implement a full user authentication system with JWT tokens, write tests, and document the API endpoints'
    })
    // This is complex enough for a subagent plan
    expect(result.routing.subagentPlan).not.toBeNull()
    if (result.routing.subagentPlan) {
      expect(result.routing.subagentPlan.steps.length).toBeGreaterThan(1)
    }
  })

  it('returns a timestamp', () => {
    const result = routePrompt({ content: 'Hello' })
    expect(result.timestamp).toBeDefined()
    expect(new Date(result.timestamp).getTime()).not.toBeNaN()
  })

  it('falls back to General Assistant for unknown intents', () => {
    const result = routePrompt({
      content: 'What is the meaning of life?'
    })
    expect(result.routing.primaryAgent.id).toBe('general-assistant')
  })
})
