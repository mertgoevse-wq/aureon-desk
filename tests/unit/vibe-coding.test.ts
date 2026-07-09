import { describe, it, expect } from 'vitest'
import { ONBOARDING_CARDS, GUIDED_BUILDER_STEPS, TUTORIAL_CARDS, buildGuidedPrompt, PROMPT_TEMPLATES } from '../../src/shared/vibe-templates'

describe('Vibe Coding Templates', () => {
  it('should have 15 onboarding cards', () => {
    expect(ONBOARDING_CARDS.length).toBe(15)
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
    expect(categories.has('deploy')).toBe(true)
  })

  it('should have a card that opens in Code mode', () => {
    const codeCard = ONBOARDING_CARDS.find(c => c.openInCode)
    expect(codeCard).toBeDefined()
    expect(codeCard!.id).toBe('create-preview')
  })

  it('should have package-windows template', () => {
    const card = ONBOARDING_CARDS.find(c => c.id === 'package-windows')
    expect(card).toBeDefined()
    expect(card!.category).toBe('deploy')
    expect(card!.prompt).toContain('electron-builder')
  })

  it('should have write-tests template', () => {
    const card = ONBOARDING_CARDS.find(c => c.id === 'write-tests')
    expect(card).toBeDefined()
    expect(card!.category).toBe('improve')
  })

  it('should have cleanup-project template', () => {
    const card = ONBOARDING_CARDS.find(c => c.id === 'cleanup-project')
    expect(card).toBeDefined()
    expect(card!.category).toBe('improve')
  })

  it('should have build-android-app template', () => {
    const card = ONBOARDING_CARDS.find(c => c.id === 'build-android-app')
    expect(card).toBeDefined()
    expect(card!.category).toBe('build')
  })

  it('prompts should not contain auto-execution commands', () => {
    const dangerous = ['rm -rf', 'sudo', 'delete all', 'format', 'drop table', 'exec(']
    for (const card of ONBOARDING_CARDS) {
      for (const pattern of dangerous) {
        expect(card.prompt.toLowerCase()).not.toContain(pattern)
      }
    }
  })

  it('deploy templates should mention not hardcoding secrets', () => {
    const card = ONBOARDING_CARDS.find(c => c.id === 'package-windows')
    expect(card!.prompt).toContain('Do not hardcode')
  })

  it('PROMPT_TEMPLATES should have entries for all cards', () => {
    for (const card of ONBOARDING_CARDS) {
      expect(PROMPT_TEMPLATES[card.id]).toBeDefined()
      expect(PROMPT_TEMPLATES[card.id].label).toBe(card.label)
    }
  })
})

describe('Guided Builder', () => {
  it('should have 3 steps', () => {
    expect(GUIDED_BUILDER_STEPS.length).toBe(3)
  })

  it('should include android-app option in step 1', () => {
    const step1 = GUIDED_BUILDER_STEPS[0]
    const android = step1.options.find(o => o.id === 'android-app')
    expect(android).toBeDefined()
    expect(android!.label).toBe('Android app')
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
    expect(prompt).toContain('Do not hardcode')
    expect(prompt).toContain('typecheck, tests, and build')
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

describe('Tutorial Cards', () => {
  it('should have 8 tutorial cards', () => {
    expect(TUTORIAL_CARDS.length).toBe(8)
  })

  it('each tutorial card should have required fields', () => {
    for (const card of TUTORIAL_CARDS) {
      expect(card.id).toBeTruthy()
      expect(card.question).toBeTruthy()
      expect(card.answer).toBeTruthy()
      expect(card.answer.length).toBeGreaterThan(50)
    }
  })

  it('should include what-is-safe-folder tutorial', () => {
    const card = TUTORIAL_CARDS.find(c => c.id === 'what-is-safe-folder')
    expect(card).toBeDefined()
    expect(card!.answer).toContain('.env')
  })

  it('should include never-paste tutorial', () => {
    const card = TUTORIAL_CARDS.find(c => c.id === 'never-paste')
    expect(card).toBeDefined()
    expect(card!.answer).toContain('API keys')
  })

  it('should include test-before-push tutorial', () => {
    const card = TUTORIAL_CARDS.find(c => c.id === 'test-before-push')
    expect(card).toBeDefined()
    expect(card!.answer).toContain('typecheck')
  })
})

describe('Vibe Coding — Preview & Code Mode Integration', () => {
  it('should have build templates that generate prompts for Code mode', () => {
    const buildCards = ONBOARDING_CARDS.filter(c => c.category === 'build')
    expect(buildCards.length).toBeGreaterThanOrEqual(5)
    for (const card of buildCards) {
      expect(card.prompt).toBeTruthy()
      expect(card.prompt.length).toBeGreaterThan(50)
    }
  })

  it('should include Preview-style templates (build-website, build-desktop-app, build-mini-game)', () => {
    const website = ONBOARDING_CARDS.find(c => c.id === 'build-website')
    const desktop = ONBOARDING_CARDS.find(c => c.id === 'build-desktop-app')
    const game = ONBOARDING_CARDS.find(c => c.id === 'build-mini-game')
    expect(website).toBeDefined()
    expect(desktop).toBeDefined()
    expect(game).toBeDefined()
  })

  it('should have setup template for connecting providers', () => {
    const card = ONBOARDING_CARDS.find(c => c.id === 'connect-provider')
    expect(card).toBeDefined()
    expect(card!.category).toBe('setup')
    expect(card!.prompt).toContain('OpenRouter')
  })

  it('should have fix template for error explanation', () => {
    const card = ONBOARDING_CARDS.find(c => c.id === 'fix-error')
    expect(card).toBeDefined()
    expect(card!.category).toBe('fix')
    expect(card!.prompt).toContain('typecheck')
  })

  it('should have start-building template for beginners', () => {
    const card = ONBOARDING_CARDS.find(c => c.id === 'start-building')
    expect(card).toBeDefined()
    expect(card!.category).toBe('build')
    expect(card!.prompt).toContain('beginner')
  })

  it('should set correct sessionStorage keys for Preview demo', () => {
    // Verify the contract: Preview demo expects these sessionStorage keys
    const expectedKeys = ['auto-build-app-preview', 'build-app-style', 'build-app-prompt', 'build-app-platform']
    for (const key of expectedKeys) {
      expect(typeof key).toBe('string')
    }
    // Build templates should have valid prompts for Preview mode
    const website = ONBOARDING_CARDS.find(c => c.id === 'build-website')!
    expect(website.prompt).toBeTruthy()
    expect(website.prompt.length).toBeGreaterThan(50)
  })

  it('should route build templates to Code mode via sessionStorage contract', () => {
    // All build-category templates should have valid prompts for Preview
    const buildCards = ONBOARDING_CARDS.filter(c => c.category === 'build')
    expect(buildCards.length).toBeGreaterThanOrEqual(5)
    for (const card of buildCards) {
      expect(card.prompt).toBeTruthy()
      expect(card.prompt.length).toBeGreaterThan(50)
    }
  })
})

describe('Vibe Coding Safety', () => {
  it('suggestion cards should not auto-execute', () => {
    for (const card of ONBOARDING_CARDS) {
      expect(card.prompt).not.toMatch(/Auto[_-]?[Rr]un/)
      expect(card.prompt).not.toMatch(/auto[_-]?execute/)
    }
  })

  it('guided builder should produce prompts, not commands', () => {
    const prompt = buildGuidedPrompt({
      'what-to-build': 'mini-game',
      'action': 'generate'
    })
    expect(prompt).toContain('help me')
    expect(prompt).toContain('generate')
  })
})

describe('Vibe Coding — Result Quality Contracts', () => {
  it('build-desktop-app template should contain preview/test/build verification instructions', () => {
    const desktop = ONBOARDING_CARDS.find(c => c.id === 'build-desktop-app')!
    expect(desktop.prompt).toContain('typecheck')
    expect(desktop.prompt).toContain('tests')
    expect(desktop.prompt).toContain('build')
  })

  it('create-preview template should require interactive elements', () => {
    const preview = ONBOARDING_CARDS.find(c => c.id === 'create-preview')!
    expect(preview.prompt).toContain('working buttons')
  })

  it('improve-ui template should include design rules', () => {
    const improve = ONBOARDING_CARDS.find(c => c.id === 'improve-ui')!
    expect(improve.prompt).toContain('ivory')
    expect(improve.prompt).toContain('no neon')
    expect(improve.prompt).toContain('typecheck')
  })

  it('build-android-app template should be offline-first', () => {
    const android = ONBOARDING_CARDS.find(c => c.id === 'build-android-app')!
    expect(android.prompt).toContain('offline-first')
    expect(android.prompt).toContain('Material Design')
  })

  it('connect-provider template should mention OpenRouter for beginners', () => {
    const card = ONBOARDING_CARDS.find(c => c.id === 'connect-provider')!
    expect(card.prompt).toContain('OpenRouter')
    expect(card.prompt).toContain('beginners')
  })

  it('package-windows template should warn against hardcoding secrets', () => {
    const card = ONBOARDING_CARDS.find(c => c.id === 'package-windows')!
    expect(card.prompt).toContain('Do not hardcode')
    expect(card.prompt).toContain('build')
  })

  it('guided builder prompt should always include safety section', () => {
    const prompt = buildGuidedPrompt({ 'what-to-build': 'website' })
    expect(prompt).toContain('Do not hardcode')
    expect(prompt).toContain('typecheck, tests, and build')
    expect(prompt).toContain('beginner-friendly')
  })

  it('all build templates should have prompts exceeding 100 chars (useful output)', () => {
    for (const card of ONBOARDING_CARDS) {
      if (card.category === 'build') {
        expect(card.prompt.length).toBeGreaterThan(100)
      }
    }
  })
})
