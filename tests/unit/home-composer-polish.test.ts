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
    'Plan a feature',
    'Review code',
    'Build a preview',
    'Debug an error',
    'Extract insights',
    'Create project'
  ]

  it('should have exactly 6 calm suggestion prompts', () => {
    expect(STARTER_PROMPTS.length).toBe(6)
    expect(STARTER_PROMPTS).toContain('Plan a feature')
    expect(STARTER_PROMPTS).toContain('Review code')
    expect(STARTER_PROMPTS).toContain('Build a preview')
    expect(STARTER_PROMPTS).toContain('Debug an error')
    expect(STARTER_PROMPTS).toContain('Extract insights')
    expect(STARTER_PROMPTS).toContain('Create project')
  })
})
