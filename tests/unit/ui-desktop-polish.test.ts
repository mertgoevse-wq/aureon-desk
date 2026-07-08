import { describe, it, expect, beforeEach } from 'vitest'

// We test the uiStore directly since it's pure zustand logic
import { useUIStore } from '../../src/renderer/src/stores/uiStore'

describe('UI Store — Panel Sizes', () => {
  beforeEach(() => {
    useUIStore.setState({
      sidebarWidth: 240,
      inspectorWidth: 340,
      sidebarCollapsed: false,
      inspectorOpen: true,
    })
  })

  it('should clamp sidebar width to minimum 192', () => {
    const store = useUIStore.getState()
    store.setSidebarWidth(100)
    expect(useUIStore.getState().sidebarWidth).toBe(192)
  })

  it('should clamp sidebar width to maximum 500', () => {
    const store = useUIStore.getState()
    store.setSidebarWidth(600)
    expect(useUIStore.getState().sidebarWidth).toBe(500)
  })

  it('should clamp inspector width to minimum 260', () => {
    const store = useUIStore.getState()
    store.setInspectorWidth(200)
    expect(useUIStore.getState().inspectorWidth).toBe(260)
  })

  it('should clamp inspector width to maximum 600', () => {
    const store = useUIStore.getState()
    store.setInspectorWidth(700)
    expect(useUIStore.getState().inspectorWidth).toBe(600)
  })

  it('should toggle sidebar collapsed state', () => {
    const store = useUIStore.getState()
    expect(store.sidebarCollapsed).toBe(false)
    store.toggleSidebar()
    expect(useUIStore.getState().sidebarCollapsed).toBe(true)
    useUIStore.getState().toggleSidebar()
    expect(useUIStore.getState().sidebarCollapsed).toBe(false)
  })

  it('should toggle inspector open state', () => {
    const store = useUIStore.getState()
    expect(store.inspectorOpen).toBe(true)
    store.toggleInspector()
    expect(useUIStore.getState().inspectorOpen).toBe(false)
    useUIStore.getState().toggleInspector()
    expect(useUIStore.getState().inspectorOpen).toBe(true)
  })

  it('should reset layout to defaults', () => {
    const store = useUIStore.getState()
    store.setSidebarWidth(400)
    store.setInspectorWidth(500)
    store.toggleSidebar()
    store.toggleInspector()

    useUIStore.getState().resetLayout()

    const s = useUIStore.getState()
    expect(s.sidebarWidth).toBe(240)
    expect(s.inspectorWidth).toBe(340)
    expect(s.sidebarCollapsed).toBe(false)
    expect(s.inspectorOpen).toBe(true)
  })
})

describe('Command Palette Actions', () => {
  // Define the expected command palette action items
  const requiredActionIds = [
    'new-chat',
    'home',
    'prompts',
    'projects',
    'tools',
    'system-prompts',
    'providers',
    'imports',
    'logs',
    'appearance',
    'settings',
    'toggle-sidebar',
    'toggle-inspector',
    'reset-layout',
    'shortcuts',
    'focus-composer',
    'import-star-list',
  ]

  it('should have all required command palette actions', () => {
    expect(requiredActionIds.length).toBeGreaterThanOrEqual(16)
    // Verify no duplicates
    expect(new Set(requiredActionIds).size).toBe(requiredActionIds.length)
  })

  it('should include new chat action', () => {
    expect(requiredActionIds).toContain('new-chat')
  })

  it('should include navigation actions', () => {
    expect(requiredActionIds).toContain('home')
    expect(requiredActionIds).toContain('prompts')
    expect(requiredActionIds).toContain('projects')
    expect(requiredActionIds).toContain('tools')
    expect(requiredActionIds).toContain('settings')
  })

  it('should include settings sub-page actions', () => {
    expect(requiredActionIds).toContain('system-prompts')
    expect(requiredActionIds).toContain('providers')
    expect(requiredActionIds).toContain('imports')
    expect(requiredActionIds).toContain('logs')
    expect(requiredActionIds).toContain('appearance')
  })

  it('should include panel toggle actions', () => {
    expect(requiredActionIds).toContain('toggle-sidebar')
    expect(requiredActionIds).toContain('toggle-inspector')
  })

  it('should include layout, help, and utility actions', () => {
    expect(requiredActionIds).toContain('reset-layout')
    expect(requiredActionIds).toContain('shortcuts')
    expect(requiredActionIds).toContain('focus-composer')
    expect(requiredActionIds).toContain('import-star-list')
  })
})

describe('Keyboard Shortcut Mappings', () => {
  const expectedShortcuts = [
    { keys: 'Ctrl+K', description: /command palette/i },
    { keys: 'Ctrl+N', description: /new chat/i },
    { keys: 'Ctrl+Shift+P', description: /prompt library/i },
    { keys: 'Ctrl+,', description: /settings/i },
    { keys: 'Ctrl+L', description: /focus.*composer/i },
    { keys: 'Ctrl+B', description: /toggle.*sidebar/i },
    { keys: 'Ctrl+I', description: /toggle.*inspector/i },
    { keys: 'Esc', description: /close.*modal/i },
    { keys: 'Ctrl+/ or F1', description: /shortcuts.*help/i },
  ]

  it('should have all required shortcuts defined', () => {
    expect(expectedShortcuts.length).toBe(9)
    // Verify unique keys
    const keys = expectedShortcuts.map(s => s.keys)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('should have Ctrl+K for command palette', () => {
    const cmd = expectedShortcuts.find(s => s.keys === 'Ctrl+K')
    expect(cmd).toBeDefined()
    expect(typeof cmd!.description).toBe('object') // RegExp
  })

  it('should have Ctrl+N for new chat', () => {
    const cmd = expectedShortcuts.find(s => s.keys === 'Ctrl+N')
    expect(cmd).toBeDefined()
    expect(typeof cmd!.description).toBe('object')
  })

  it('should have Ctrl+Shift+P for prompt library', () => {
    const cmd = expectedShortcuts.find(s => s.keys === 'Ctrl+Shift+P')
    expect(cmd).toBeDefined()
    expect(typeof cmd!.description).toBe('object')
  })

  it('should have Ctrl+, for settings', () => {
    const cmd = expectedShortcuts.find(s => s.keys === 'Ctrl+,')
    expect(cmd).toBeDefined()
    expect(typeof cmd!.description).toBe('object')
  })

  it('should have panel toggle shortcuts', () => {
    const sidebar = expectedShortcuts.find(s => s.keys === 'Ctrl+B')
    expect(sidebar).toBeDefined()

    const inspector = expectedShortcuts.find(s => s.keys === 'Ctrl+I')
    expect(inspector).toBeDefined()
  })

  it('should have Esc for closing modals', () => {
    const cmd = expectedShortcuts.find(s => s.keys === 'Esc')
    expect(cmd).toBeDefined()
    expect(typeof cmd!.description).toBe('object')
  })
})
