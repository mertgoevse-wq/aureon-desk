import { describe, it, expect, vi, beforeEach } from 'vitest'
import { registerWindowIPC } from '../../src/main/ipc/window.ipc'
import { ipcMain } from 'electron'

// Mock Electron modules
vi.mock('electron', () => {
  const handlers = new Map<string, Function>()
  const listeners = new Map<string, Function>()

  return {
    ipcMain: {
      on: vi.fn((channel, handler) => {
        listeners.set(channel, handler)
      }),
      handle: vi.fn((channel, handler) => {
        handlers.set(channel, handler)
      }),
      // Helper for testing
      _triggerOn: (channel: string, ...args: any[]) => {
        const cb = listeners.get(channel)
        if (cb) cb({}, ...args)
      },
      _triggerHandle: async (channel: string, ...args: any[]) => {
        const cb = handlers.get(channel)
        return cb ? cb({}, ...args) : undefined
      }
    }
  }
})

// Mock windows module
const mockMinimize = vi.fn()
const mockMaximize = vi.fn()
const mockUnmaximize = vi.fn()
const mockClose = vi.fn()
const mockIsMaximized = vi.fn(() => false)

vi.mock('../../src/main/windows', () => {
  return {
    getMainWindow: () => ({
      minimize: mockMinimize,
      maximize: mockMaximize,
      unmaximize: mockUnmaximize,
      close: mockClose,
      isMaximized: mockIsMaximized
    })
  }
})

describe('Window IPC Registry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should register all window IPC listeners', () => {
    registerWindowIPC()

    expect(ipcMain.on).toHaveBeenCalledWith('window:minimize', expect.any(Function))
    expect(ipcMain.on).toHaveBeenCalledWith('window:maximize', expect.any(Function))
    expect(ipcMain.on).toHaveBeenCalledWith('window:close', expect.any(Function))
    expect(ipcMain.handle).toHaveBeenCalledWith('window:isMaximized', expect.any(Function))
  })

  it('should trigger window minimization on window:minimize', () => {
    registerWindowIPC()
    // Trigger IPC listener
    const trigger = (ipcMain as any)._triggerOn
    trigger('window:minimize')

    expect(mockMinimize).toHaveBeenCalledTimes(1)
  })

  it('should toggle maximize when window:maximize is received', () => {
    registerWindowIPC()
    const trigger = (ipcMain as any)._triggerOn

    // Not maximized case -> should maximize
    mockIsMaximized.mockReturnValueOnce(false)
    trigger('window:maximize')
    expect(mockMaximize).toHaveBeenCalledTimes(1)

    // Maximized case -> should unmaximize
    mockIsMaximized.mockReturnValueOnce(true)
    trigger('window:maximize')
    expect(mockUnmaximize).toHaveBeenCalledTimes(1)
  })

  it('should close window on window:close', () => {
    registerWindowIPC()
    const trigger = (ipcMain as any)._triggerOn
    trigger('window:close')

    expect(mockClose).toHaveBeenCalledTimes(1)
  })

  it('should return window isMaximized status on window:isMaximized invoke', async () => {
    registerWindowIPC()
    const triggerHandle = (ipcMain as any)._triggerHandle

    mockIsMaximized.mockReturnValueOnce(true)
    const res = await triggerHandle('window:isMaximized')
    expect(res).toBe(true)
  })
})
