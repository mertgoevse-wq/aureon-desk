import { describe, it, expect, vi } from 'vitest'

// Test the keyboard shortcut logic — verify that global shortcuts
// do NOT interfere with typing/copy/paste inside inputs and textareas.
// No DOM required — tests the logic in isolation using plain objects.

interface FakeTarget {
  tagName?: string
  isContentEditable?: boolean
  role?: string | null
}

interface FakeEvent {
  ctrlKey: boolean
  metaKey: boolean
  shiftKey: boolean
  key: string
  target: FakeTarget | null
  preventDefault: ReturnType<typeof vi.fn>
}

function shouldHandleShortcut(e: FakeEvent): boolean {
  const mod = e.ctrlKey || e.metaKey
  const target = e.target
  const tag = target?.tagName
  const isEditing =
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target?.isContentEditable ||
    target?.role === 'textbox'

  if (isEditing) return false
  return !!mod
}

function makeEvent(overrides: Partial<FakeEvent> = {}): FakeEvent {
  return {
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    key: '',
    target: { tagName: 'DIV' },
    preventDefault: vi.fn(),
    ...overrides,
  }
}

describe('Keyboard Shortcut Handler', () => {
  it('should NOT block typing "k" in an INPUT', () => {
    const e = makeEvent({ key: 'k', target: { tagName: 'INPUT' } })
    expect(shouldHandleShortcut(e)).toBe(false)
  })

  it('should NOT block typing "k" in a TEXTAREA', () => {
    const e = makeEvent({ key: 'k', target: { tagName: 'TEXTAREA' } })
    expect(shouldHandleShortcut(e)).toBe(false)
  })

  it('should NOT block typing in a SELECT', () => {
    const e = makeEvent({ key: 'ArrowDown', target: { tagName: 'SELECT' } })
    expect(shouldHandleShortcut(e)).toBe(false)
  })

  it('should NOT block Ctrl+V paste in an INPUT', () => {
    const e = makeEvent({ key: 'v', ctrlKey: true, target: { tagName: 'INPUT' } })
    expect(shouldHandleShortcut(e)).toBe(false)
  })

  it('should NOT block Ctrl+C copy in an INPUT', () => {
    const e = makeEvent({ key: 'c', ctrlKey: true, target: { tagName: 'INPUT' } })
    expect(shouldHandleShortcut(e)).toBe(false)
  })

  it('should NOT block Ctrl+A select-all in an INPUT', () => {
    const e = makeEvent({ key: 'a', ctrlKey: true, target: { tagName: 'INPUT' } })
    expect(shouldHandleShortcut(e)).toBe(false)
  })

  it('should NOT block Ctrl+V paste in a TEXTAREA', () => {
    const e = makeEvent({ key: 'v', ctrlKey: true, target: { tagName: 'TEXTAREA' } })
    expect(shouldHandleShortcut(e)).toBe(false)
  })

  it('should NOT block typing "/" in an INPUT', () => {
    const e = makeEvent({ key: '/', target: { tagName: 'INPUT' } })
    expect(shouldHandleShortcut(e)).toBe(false)
  })

  it('should NOT block typing in a contentEditable div', () => {
    const e = makeEvent({ key: 'h', target: { tagName: 'DIV', isContentEditable: true } })
    expect(shouldHandleShortcut(e)).toBe(false)
  })

  it('should NOT block typing in an element with role="textbox"', () => {
    const e = makeEvent({ key: 'h', target: { tagName: 'DIV', role: 'textbox' } })
    expect(shouldHandleShortcut(e)).toBe(false)
  })

  it('should NOT block typing "Enter" in an INPUT', () => {
    const e = makeEvent({ key: 'Enter', target: { tagName: 'INPUT' } })
    expect(shouldHandleShortcut(e)).toBe(false)
  })

  it('should NOT block typing in a password INPUT', () => {
    const e = makeEvent({ key: 'x', target: { tagName: 'INPUT' } })
    expect(shouldHandleShortcut(e)).toBe(false)
  })

  it('SHOULD allow Ctrl+K outside of inputs (DIV)', () => {
    const e = makeEvent({ key: 'k', ctrlKey: true, target: { tagName: 'DIV' } })
    expect(shouldHandleShortcut(e)).toBe(true)
  })

  it('SHOULD allow Ctrl+N outside of inputs', () => {
    const e = makeEvent({ key: 'n', ctrlKey: true, target: { tagName: 'DIV' } })
    expect(shouldHandleShortcut(e)).toBe(true)
  })

  it('SHOULD allow Ctrl+, outside of inputs', () => {
    const e = makeEvent({ key: ',', ctrlKey: true, target: { tagName: 'DIV' } })
    expect(shouldHandleShortcut(e)).toBe(true)
  })

  it('should NOT trigger shortcut for non-modifier keys outside inputs', () => {
    const e = makeEvent({ key: 'a', target: { tagName: 'DIV' } })
    expect(shouldHandleShortcut(e)).toBe(false)
  })
})
