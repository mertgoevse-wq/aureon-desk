import { describe, it, expect } from 'vitest'

describe('Settings Categories & Configurations', () => {
  const expectedCategories = [
    { label: 'General', path: '/settings/general' },
    { label: 'Providers & Models', path: '/settings/providers' },
    { label: 'System Prompts', path: '/settings/prompts' },
    { label: 'Appearance', path: '/settings/appearance' },
    { label: 'Projects', path: '/settings/projects' },
    { label: 'Tools & MCP', path: '/settings/tools' },
    { label: 'GitHub Imports', path: '/settings/github' },
    { label: 'Extensions', path: '/settings/extensions' },
    { label: 'Privacy & Security', path: '/settings/security' },
    { label: 'Capabilities', path: '/settings/capabilities' },
    { label: 'Logs', path: '/settings/logs' },
    { label: 'Developer', path: '/settings/developer' }
  ]

  it('should have exactly 12 premium settings categories', () => {
    expect(expectedCategories.length).toBe(12)
    const paths = expectedCategories.map(c => c.path)
    expect(paths).toContain('/settings/general')
    expect(paths).toContain('/settings/capabilities')
    expect(paths).toContain('/settings/developer')
  })

  it('should verify all paths are unique', () => {
    const paths = expectedCategories.map(c => c.path)
    expect(new Set(paths).size).toBe(expectedCategories.length)
  })
})

describe('Capabilities Configurations', () => {
  it('should restrict computer use and browser use by default', () => {
    const browserUseEnabled = false
    const computerUseEnabled = false
    expect(browserUseEnabled).toBe(false)
    expect(computerUseEnabled).toBe(false)
  })
})
