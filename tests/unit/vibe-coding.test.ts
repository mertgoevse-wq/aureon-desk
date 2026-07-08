import { describe, it, expect } from 'vitest'
import { ONBOARDING_CARDS, GUIDED_BUILDER_STEPS, buildGuidedPrompt } from '../../src/shared/vibe-templates'

describe('Vibe Coding Templates', () => {
  it('should have all 8 onboarding cards', () => {
    expect(ONBOARDING_CARDS.length).toBe(8)
  })

  it('each onboarding card should have required fields', () => {
    for (const card of ONBOARDING_CARDS) {
      expect(card.id).toBeTruthy()
      expect(card.label).toBeTruthy()
      expect(card.icon).toBeTruthy()
      expect(card.description).toBeTruthy()
      expect(card.category).toBeTruthy()
      expect(card.prompt).toBeTruthy()
      expect(card.prompt.length).toBeGreaterThan(50)
    }
  })

  it('should have cards for all required categories', () => {
    const categories = new Set(ONBOARDING_CARDS.map(c => c.category))
    expect(categories.has('build')).toBe(true)
    expect(categories.has('fix')).toBe(true)
    expect(categories.has('improve')).toBe(true)
    expect(categories.has('learn')).toBe(true)
    expect(categories.has('setup')).toBe(true)
  })

  it('should have a card that opens in Code mode', () => {
    const codeCard = ONBOARDING_CARDS.find(c => c.openInCode)
    expect(codeCard).toBeDefined()
    expect(codeCard!.id).toBe('create-preview')
  })

  it('prompts should not contain auto-execution commands', () => {
    const dangerous = ['rm -rf', 'sudo', 'delete all', 'format', 'drop table', 'exec(']
    for (const card of ONBOARDING_CARDS) {
      for (const pattern of dangerous) {
        expect(card.prompt.toLowerCase()).not.toContain(pattern)
      }
    }
  })
})

describe('Guided Builder', () => {
  it('should have 3 steps', () => {
    expect(GUIDED_BUILDER_STEPS.length).toBe(3)
  })

  it('each step should have options', () => {
    for (const step of GUIDED_BUILDER_STEPS) {
      expect(step.id).toBeTruthy()
      expect(step.label).toBeTruthy()
      expect(step.options.length).toBeGreaterThanOrEqual(2)
      for (const opt of step.options) {
        expect(opt.id).toBeTruthy()
        expect(opt.label).toBeTruthy()
        expect(opt.description).toBeTruthy()
      }
    }
  })

  it('should build a prompt from selections', () => {
    const selections = {
      'what-to-build': 'website',
      'starting-point': 'blank',
      'action': 'plan'
    }
    const prompt = buildGuidedPrompt(selections)
    expect(prompt).toContain('website')
    expect(prompt).toContain('blank')
    expect(prompt).toContain('plan')
    expect(prompt).toContain('beginner-friendly')
    expect(prompt).toContain('step by step')
  })

  it('should include safety guidance in prompts', () => {
    const prompt = buildGuidedPrompt({ 'what-to-build': 'website' })
    expect(prompt).toContain('beginner-friendly')
    expect(prompt).toContain('step by step')
  })

  it('should not contain dangerous auto-run instructions', () => {
    const prompt = buildGuidedPrompt({
      'what-to-build': 'website',
      'starting-point': 'blank',
      'action': 'generate'
    })
    expect(prompt).not.toContain('auto')
    expect(prompt).not.toContain('sudo')
    expect(prompt).not.toContain('rm -rf')
  })

  it('should handle missing selections gracefully', () => {
    const prompt = buildGuidedPrompt({})
    expect(prompt).toContain('a project')
    expect(prompt).toContain('a new project')
    expect(prompt).toContain('plan')
  })
})

describe('Vibe Coding Safety', () => {
  it('suggestion cards should not auto-execute', () => {
    // Cards only navigate and insert text into composer — they don't auto-run
    for (const card of ONBOARDING_CARDS) {
      // Prompt templates should describe actions, not execute them
      expect(card.prompt).not.toMatch(/Auto[_-]?[Rr]un/)
      expect(card.prompt).not.toMatch(/auto[_-]?execute/)
    }
  })

  it('guided builder should produce prompts, not commands', () => {
    const prompt = buildGuidedPrompt({
      'what-to-build': 'mini-game',
      'action': 'generate'
    })
    // Should ask AI to generate, not contain actual commands
    expect(prompt).toContain('help me')
    expect(prompt).toContain('generate')
  })
})
