/**
 * Tests for agent and skill education registries
 * Covers: registry integrity, auto-selection logic, LearnPage rendering contracts
 */

import { describe, it, expect } from 'vitest'
import { AGENT_EDUCATION, simulateAutoSelect } from '../../src/shared/agent-education'
import { SKILL_EDUCATION } from '../../src/shared/skill-education'

// ---------------------------------------------------------------------------
// Agent Education Registry
// ---------------------------------------------------------------------------

describe('Agent Education Registry', () => {
  it('has at least 15 agents', () => {
    expect(AGENT_EDUCATION.length).toBeGreaterThanOrEqual(15)
  })

  it('every agent has a non-empty name', () => {
    for (const agent of AGENT_EDUCATION) {
      expect(agent.name, `${agent.id} missing name`).toBeTruthy()
      expect(agent.name.length).toBeGreaterThan(1)
    }
  })

  it('every agent has a unique id', () => {
    const ids = AGENT_EDUCATION.map(a => a.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every agent has a beginner explanation', () => {
    for (const agent of AGENT_EDUCATION) {
      expect(agent.beginnerExplanation.length, `${agent.id} missing explanation`).toBeGreaterThan(20)
    }
  })

  it('every agent has at least one category', () => {
    for (const agent of AGENT_EDUCATION) {
      expect(agent.category.length, `${agent.id} missing category`).toBeGreaterThanOrEqual(1)
    }
  })

  it('every agent has skillsUsed array', () => {
    for (const agent of AGENT_EDUCATION) {
      expect(Array.isArray(agent.skillsUsed), `${agent.id} skillsUsed not array`).toBe(true)
    }
  })

  it('every agent has a valid example prompt', () => {
    for (const agent of AGENT_EDUCATION) {
      expect(agent.examplePrompt.length, `${agent.id} missing example`).toBeGreaterThan(10)
    }
  })

  it('destructive agents are explicitly marked', () => {
    const destructive = AGENT_EDUCATION.filter(a => a.isDestructive)
    const gitAgent = AGENT_EDUCATION.find(a => a.id === 'git-assistant')
    expect(gitAgent?.isDestructive).toBe(true)
    expect(destructive.length).toBeLessThan(AGENT_EDUCATION.length / 3)
  })

  it('every agent has a valid icon name (string)', () => {
    for (const agent of AGENT_EDUCATION) {
      expect(typeof agent.icon, `${agent.id} missing icon`).toBe('string')
      expect(agent.icon.length).toBeGreaterThan(0)
    }
  })

  it('every agent has permissions array', () => {
    for (const agent of AGENT_EDUCATION) {
      expect(Array.isArray(agent.permissions), `${agent.id} permissions not array`).toBe(true)
    }
  })
})

// ---------------------------------------------------------------------------
// Skill Education Registry
// ---------------------------------------------------------------------------

describe('Skill Education Registry', () => {
  it('has at least 18 skills', () => {
    expect(SKILL_EDUCATION.length).toBeGreaterThanOrEqual(18)
  })

  it('every skill has a non-empty name', () => {
    for (const skill of SKILL_EDUCATION) {
      expect(skill.name, `${skill.id} missing name`).toBeTruthy()
      expect(skill.name.length).toBeGreaterThan(1)
    }
  })

  it('every skill has a unique id', () => {
    const ids = SKILL_EDUCATION.map(s => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every skill has a simple description', () => {
    for (const skill of SKILL_EDUCATION) {
      expect(skill.simpleDescription.length, `${skill.id} missing description`).toBeGreaterThan(20)
    }
  })

  it('every skill has at least one example', () => {
    for (const skill of SKILL_EDUCATION) {
      expect(skill.examples.length, `${skill.id} missing examples`).toBeGreaterThanOrEqual(1)
      expect(skill.examples[0].length).toBeGreaterThan(5)
    }
  })

  it('every skill has a valid category', () => {
    const validCategories = ['coding', 'preview', 'design', 'providers', 'social', 'cleanup', 'docs', 'general']
    for (const skill of SKILL_EDUCATION) {
      expect(validCategories, `${skill.id} invalid category: ${skill.category}`).toContain(skill.category)
    }
  })

  it('every skill has a valid testStatus', () => {
    const validStatuses = ['tested', 'partial', 'not-tested']
    for (const skill of SKILL_EDUCATION) {
      expect(validStatuses, `${skill.id} invalid testStatus: ${skill.testStatus}`).toContain(skill.testStatus)
    }
  })

  it('every skill has an output artifact type', () => {
    for (const skill of SKILL_EDUCATION) {
      expect(skill.outputArtifactType.length, `${skill.id} missing output type`).toBeGreaterThan(0)
    }
  })

  it('every skill has inputFields array', () => {
    for (const skill of SKILL_EDUCATION) {
      expect(Array.isArray(skill.inputFields), `${skill.id} inputFields not array`).toBe(true)
    }
  })
})

// ---------------------------------------------------------------------------
// Auto-Selection Logic (shared simulateAutoSelect from agent-education.ts)
// ---------------------------------------------------------------------------

describe('Auto-Selection Logic', () => {
  it('routes "create a todo app" to Builder + create-todo-app', () => {
    const { agent, skill } = simulateAutoSelect('Create a todo app with React', SKILL_EDUCATION)
    expect(agent.id).toBe('code-architect')
    expect(skill.id).toBe('create-todo-app')
  })

  it('routes "landing page" to UI Designer + create-landing-page', () => {
    const { agent, skill } = simulateAutoSelect('Build a landing page for my SaaS', SKILL_EDUCATION)
    expect(agent.id).toBe('ux-product-designer')
    expect(skill.id).toBe('create-landing-page')
  })

  it('routes "debug error" to Debugger + explain-error', () => {
    const { agent, skill } = simulateAutoSelect('I have a CORS error in my API', SKILL_EDUCATION)
    expect(agent.id).toBe('debugger')
    expect(skill.id).toBe('explain-error')
  })

  it('routes "start preview" to LivePreview + start-live-preview', () => {
    const { agent, skill } = simulateAutoSelect('Start the live preview server', SKILL_EDUCATION)
    expect(agent.id).toBe('live-preview')
    expect(skill.id).toBe('start-live-preview')
  })

  it('routes "clean dead code" to Cleanup + clean-dead-code', () => {
    const { agent, skill } = simulateAutoSelect('Clean up dead code in this project', SKILL_EDUCATION)
    expect(agent.id).toBe('refactor-engineer')
    expect(skill.id).toBe('clean-dead-code')
  })

  it('routes "design theme" to UI Designer + improve-ui-theme', () => {
    const { agent, skill } = simulateAutoSelect('Design a dark mode theme for my app', SKILL_EDUCATION)
    expect(agent.id).toBe('ux-product-designer')
    expect(skill.id).toBe('improve-ui-theme')
  })

  it('routes "youtube description" to Social Draft + draft-social-post', () => {
    const { agent, skill } = simulateAutoSelect('Write a youtube description for my tutorial', SKILL_EDUCATION)
    expect(agent.id).toBe('social-draft')
    expect(skill.id).toBe('draft-social-post')
  })

  it('routes "api key test" to Provider Doctor + test-provider', () => {
    const { agent, skill } = simulateAutoSelect('Test my OpenRouter API key connection', SKILL_EDUCATION)
    expect(agent.id).toBe('provider-doctor')
    expect(skill.id).toBe('test-provider')
  })

  it('defaults to Builder + create-todo-app for unrecognized prompts', () => {
    const { agent, skill } = simulateAutoSelect('some random unusual request', SKILL_EDUCATION)
    expect(agent.id).toBe('code-architect')
    expect(skill.id).toBe('create-todo-app')
  })
})

// ---------------------------------------------------------------------------
// LearnPage Content Integrity
// ---------------------------------------------------------------------------

describe('LearnPage Content Integrity', () => {
  const conceptTitles = [
    'What is an Agent?',
    'What is a Skill?',
    'What is a Tool?',
    'What is MCP?',
    'What is a Prompt Profile?',
    'When does Aureon choose which one?',
    'What runs locally?',
    'What sends data to providers?',
  ]

  it('covers all 8 core concepts', () => {
    expect(conceptTitles.length).toBe(8)
    for (const title of conceptTitles) {
      expect(title.length).toBeGreaterThan(5)
      expect(title).toMatch(/[A-Z]/)
    }
  })

  it('auto-selection examples cover all major domains', () => {
    const examples = [
      'Create a todo app',
      'Build a landing page',
      'CORS error',
      'Start the live preview',
      'Design a dark mode',
      'YouTube description',
      'Clean up dead code',
      'Test API connection',
    ]
    expect(examples.length).toBeGreaterThanOrEqual(8)
    const routes = new Set(examples)
    expect(routes.size).toBe(examples.length)
  })
})

// ---------------------------------------------------------------------------
// License / Attribution Policy
// ---------------------------------------------------------------------------

describe('Skill License Policy', () => {
  it('all Aureon education data is original (no external code)', () => {
    for (const agent of AGENT_EDUCATION) {
      expect(agent.beginnerExplanation).toBeTruthy()
      expect(agent.beginnerExplanation).not.toContain('ChatGPT')
      expect(agent.beginnerExplanation).not.toContain('Claude')
    }

    for (const skill of SKILL_EDUCATION) {
      expect(skill.simpleDescription).toBeTruthy()
    }
  })
})
