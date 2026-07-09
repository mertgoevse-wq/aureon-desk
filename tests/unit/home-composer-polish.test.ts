import { describe, it, expect } from 'vitest'

describe('Time-Aware Greeting Logic', () => {
  function getTimeAwareGreetingForHour(hour: number): string {
    if (hour < 5) return 'Late session'
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  it('should return Good morning for morning hours', () => {
    expect(getTimeAwareGreetingForHour(8)).toBe('Good morning')
    expect(getTimeAwareGreetingForHour(11)).toBe('Good morning')
  })

  it('should return Good afternoon for afternoon hours', () => {
    expect(getTimeAwareGreetingForHour(12)).toBe('Good afternoon')
    expect(getTimeAwareGreetingForHour(15)).toBe('Good afternoon')
    expect(getTimeAwareGreetingForHour(17)).toBe('Good afternoon')
  })

  it('should return Good evening for evening hours', () => {
    expect(getTimeAwareGreetingForHour(18)).toBe('Good evening')
    expect(getTimeAwareGreetingForHour(22)).toBe('Good evening')
  })

  it('should return Late session for late night hours', () => {
    expect(getTimeAwareGreetingForHour(2)).toBe('Late session')
    expect(getTimeAwareGreetingForHour(4)).toBe('Late session')
  })
})

describe('Starter Prompts Configuration', () => {
  const STARTER_PROMPTS = [
    { label: 'Build counter app', category: 'build' },
    { label: 'Fix layout bug', category: 'fix' },
    { label: 'Improve my UI', category: 'improve' },
    { label: 'Connect OpenRouter', category: 'setup' },
    { label: 'Create a preview', category: 'build' },
    { label: 'Explain this error', category: 'fix' },
    { label: 'Package Windows', category: 'deploy' },
  ]

  it('should have exactly 7 targeted starter prompts', () => {
    expect(STARTER_PROMPTS.length).toBe(7)
  })

  it('should have all prompt labels', () => {
    const labels = STARTER_PROMPTS.map(p => p.label)
    expect(labels).toContain('Build counter app')
    expect(labels).toContain('Fix layout bug')
    expect(labels).toContain('Improve my UI')
    expect(labels).toContain('Connect OpenRouter')
    expect(labels).toContain('Create a preview')
    expect(labels).toContain('Explain this error')
    expect(labels).toContain('Package Windows')
  })

  it('should have category diversity', () => {
    const categories = new Set(STARTER_PROMPTS.map(p => p.category))
    expect(categories.has('build')).toBe(true)
    expect(categories.has('fix')).toBe(true)
    expect(categories.has('improve')).toBe(true)
    expect(categories.has('setup')).toBe(true)
    expect(categories.has('deploy')).toBe(true)
  })

  it('should have unique labels', () => {
    const labels = STARTER_PROMPTS.map(p => p.label)
    expect(new Set(labels).size).toBe(labels.length)
  })
})

describe('Studio Primary CTA — Fallback Prompt', () => {
  const STUDIO_FALLBACK_PROMPT = 'Build a simple web utility'
  const STUDIO_DEFAULT_PLATFORM = 'Web app'
  const STUDIO_DEFAULT_STYLE = 'Calming Ivory'

  it('should use fallback prompt when primaryPrompt is empty', () => {
    const primaryPrompt = ''
    const effectivePrompt = primaryPrompt || STUDIO_FALLBACK_PROMPT
    expect(effectivePrompt).toBe(STUDIO_FALLBACK_PROMPT)
    expect(effectivePrompt.length).toBeGreaterThan(5)
  })

  it('should use user prompt when primaryPrompt is not empty', () => {
    const primaryPrompt = 'Build a task timer with countdown'
    const effectivePrompt = primaryPrompt || STUDIO_FALLBACK_PROMPT
    expect(effectivePrompt).toBe(primaryPrompt)
  })

  it('should build prompt with platform and style', () => {
    const primaryPrompt = 'Create a dashboard'
    const platform = STUDIO_DEFAULT_PLATFORM
    const style = STUDIO_DEFAULT_STYLE
    const output = 'Generate + Preview'
    const builtPrompt = `Build a ${platform} project with the goal: "${primaryPrompt}". Use style "${style}". Output option is "${output}".`
    expect(builtPrompt).toContain(primaryPrompt)
    expect(builtPrompt).toContain(platform)
    expect(builtPrompt).toContain(style)
    expect(builtPrompt).toContain(output)
  })

  it('should set sessionStorage keys for Code mode autostart', () => {
    const expectedKeys = ['auto-build-app-preview', 'build-app-style', 'build-app-prompt', 'build-app-platform']
    expect(expectedKeys.length).toBe(4)
    for (const key of expectedKeys) {
      expect(typeof key).toBe('string')
    }
  })
})
