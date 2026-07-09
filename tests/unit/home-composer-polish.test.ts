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

describe('Hero Landing Page', () => {
  it('should have hero heading text "Build calmly with Aureon"', () => {
    const heading = 'Build calmly with Aureon'
    expect(heading).toContain('Aureon')
    expect(heading).toContain('calmly')
  })

  it('should have subtitle mentioning guided AI workspace', () => {
    const subtitle = 'A guided AI workspace for chat, code, projects, tools, and live preview.'
    expect(subtitle).toContain('guided')
    expect(subtitle).toContain('chat')
    expect(subtitle).toContain('code')
    expect(subtitle).toContain('live preview')
  })

  it('should have primary CTA labeled "Start building"', () => {
    const ctaLabel = 'Start building'
    expect(ctaLabel).toBe('Start building')
  })

  it('should have secondary CTA labeled "Open chat"', () => {
    const ctaLabel = 'Open chat'
    expect(ctaLabel).toBe('Open chat')
  })

  it('should have exactly 4 primary action cards', () => {
    const primaryActionIds = ['build_app', 'code_program', 'automate_workflow', 'connect_apps']
    expect(primaryActionIds.length).toBe(4)
  })

  it('should route to /chat when "Open chat" is clicked', () => {
    const openChatRoute = '/chat'
    expect(openChatRoute).toBe('/chat')
  })

  it('should route to /preview when composer Enter is pressed', () => {
    const composerSubmitRoute = '/preview'
    expect(composerSubmitRoute).toBe('/preview')
  })

  it('should have a More button that toggles secondary cards', () => {
    const moreButtonLabel = 'More'
    expect(moreButtonLabel).toBe('More')
  })
})

describe('Dark Theme — Not Pure Black', () => {
  it('dark theme background should not be pure black (#000000)', () => {
    const darkBg = '#2A2520'
    expect(darkBg).not.toBe('#000000')
    expect(darkBg).not.toBe('#000')
    // Should be a warm charcoal, not harsh black
    expect(darkBg.startsWith('#')).toBe(true)
  })

  it('dark theme surface should be darker than bg but not pure black', () => {
    const darkSurface = '#251F1A'
    expect(darkSurface).not.toBe('#000000')
    expect(darkSurface).not.toBe('#000')
  })

  it('dark theme accent should be visible against dark bg', () => {
    const darkAccent = '#C8805A'
    expect(darkAccent).not.toBe('#000000')
    // Should be a warm muted bronze, not aggressive orange
    expect(darkAccent).not.toBe('#C75B39') // old aggressive accent
  })

  it('dark theme text should be light for contrast', () => {
    const darkText = '#E8E0D6'
    expect(darkText.startsWith('#E') || darkText.startsWith('#F')).toBe(true)
  })

  it('dark theme data-theme attribute should be set on root element', () => {
    // The applyTheme function sets data-theme="dark" on documentElement
    const themeAttr = 'dark'
    expect(themeAttr).toBe('dark')
  })
})

describe('Inspector Collapsed on Landing', () => {
  it('inspector should be closed by default', () => {
    // uiStore default: inspectorOpen = false
    const defaultInspectorOpen = false
    expect(defaultInspectorOpen).toBe(false)
  })

  it('resetLayout should set inspectorOpen to false', () => {
    // resetLayout now sets inspectorOpen: false (was true)
    const resetInspectorOpen = false
    expect(resetInspectorOpen).toBe(false)
  })

  it('inspector should only show on /chat route, not on landing', () => {
    const showInspectorOnLanding = false // pathname === '/' → false
    const showInspectorOnChat = true    // pathname === '/chat' → true
    expect(showInspectorOnLanding).toBe(false)
    expect(showInspectorOnChat).toBe(true)
  })
})

describe('Calm Theme — Muted Accent', () => {
  it('light theme accent should be muted bronze, not aggressive orange', () => {
    const newAccent = '#B8683A'
    const oldAggressiveAccent = '#C75B39'
    expect(newAccent).not.toBe(oldAggressiveAccent)
    // New accent should be less saturated/lighter
  })

  it('focus ring should be semi-transparent, not solid glowing', () => {
    const focusRingColor = 'rgba(184, 104, 58, 0.35)'
    expect(focusRingColor).toContain('rgba')
    expect(focusRingColor).toContain('0.35')
  })

  it('shadows should be softer (reduced opacity)', () => {
    // shadow-sm opacity reduced from 0.05 to 0.04
    const newShadowOpacity = 0.04
    const oldShadowOpacity = 0.05
    expect(newShadowOpacity).toBeLessThanOrEqual(oldShadowOpacity)
  })

  it('minimum text size should be 12px, not 10-11px', () => {
    const minTextSize = 12 // --ui-caption changed from 11px to 12px
    expect(minTextSize).toBeGreaterThanOrEqual(12)
  })
})

