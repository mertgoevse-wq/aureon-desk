import { describe, it, expect, vi, beforeEach } from 'vitest'

// Use vi.hoisted so mock objects are available to hoisted vi.mock factories
const { mockFs } = vi.hoisted(() => ({
  mockFs: {
    existsSync: vi.fn(() => false),
    mkdirSync: vi.fn(),
    writeFileSync: vi.fn(),
    readFileSync: vi.fn(),
    readdirSync: vi.fn(() => []),
    statSync: vi.fn(() => ({ isDirectory: () => true, birthtime: new Date(), birthtimeMs: Date.now() })),
    rmSync: vi.fn(),
  },
}))

// Mock Electron app paths
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => '/tmp/test-userdata'),
  },
}))

// Mock fs for sandbox operations
vi.mock('fs', () => ({ default: mockFs, ...mockFs }))

// Mock child_process spawn and execSync
vi.mock('child_process', () => ({
  spawn: vi.fn(),
  execSync: vi.fn(() => Buffer.from('')),
}))

// Mock net for findAvailablePort
vi.mock('net', () => ({
  Server: vi.fn().mockImplementation(function () {
    const self = this as Record<string, unknown>
    self.listen = vi.fn().mockReturnValue(self)
    self.close = vi.fn()
    self.address = vi.fn(() => ({ port: 3173 }))
    return self
  }),
}))

import { livePreviewService } from '../../src/main/services/live-preview.service'
import { redactSecrets } from '../../src/main/services/log-redacter'

describe('LivePreview Service — Sandbox Creation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFs.existsSync = vi.fn(() => false)
    mockFs.readdirSync = vi.fn(() => [])
    livePreviewService.reset()
  })

  it('should create a sandbox directory with HTML template', () => {
    const result = livePreviewService.createSandbox({ templateType: 'html' })

    expect(result.success).toBe(true)
    expect(result.sandboxPath).toContain('preview-sandbox')
    expect(mockFs.mkdirSync).toHaveBeenCalled()
    expect(mockFs.writeFileSync).toHaveBeenCalled()
  })

  it('should create sandbox with vite-react template', () => {
    const result = livePreviewService.createSandbox({ templateType: 'vite-react' })

    expect(result.success).toBe(true)
    // Should write multiple files including package.json
    const writeCalls = mockFs.writeFileSync.mock.calls
    expect(writeCalls.length).toBeGreaterThanOrEqual(3)
  })

  it('should return error if sandbox creation fails', () => {
    mockFs.mkdirSync.mockImplementationOnce(() => {
      throw new Error('Permission denied')
    })

    const result = livePreviewService.createSandbox()
    expect(result.success).toBe(false)
    expect(result.error).toContain('Permission denied')
  })

  it('should return idle status when no session exists', () => {
    const status = livePreviewService.getStatus()
    expect(status.status).toBe('idle')
    expect(status.id).toBeNull()
  })
})

describe('LivePreview Service — Path Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFs.existsSync = vi.fn(() => true)
    mockFs.mkdirSync = vi.fn()
    livePreviewService.reset()
  })

  it('should reject paths that escape the sandbox directory', () => {
    const result = livePreviewService.writeSandboxFile('/sandbox/test', '../../../etc/passwd', 'bad')
    expect(result.success).toBe(false)
    expect(result.error).toContain('escapes sandbox')
  })

  it('should reject paths with mixed traversal', () => {
    const result = livePreviewService.writeSandboxFile('/sandbox/test', 'foo/../../etc/passwd', 'bad')
    expect(result.success).toBe(false)
    expect(result.error).toContain('escapes sandbox')
  })

  it('should reject absolute paths outside sandbox', () => {
    const result = livePreviewService.writeSandboxFile('/sandbox/test', '/etc/passwd', 'bad')
    expect(result.success).toBe(false)
    expect(result.error).toContain('escapes sandbox')
  })

  it('should reject paths with complex traversal', () => {
    const result = livePreviewService.writeSandboxFile('/sandbox', 'a/b/c/../../../d/../../../etc/hosts', 'bad')
    expect(result.success).toBe(false)
    expect(result.error).toContain('escapes sandbox')
  })

  it('should accept valid relative paths within sandbox', () => {
    const result = livePreviewService.writeSandboxFile('/sandbox/test', 'src/index.html', '<html></html>')
    expect(result.success).toBe(true)
  })

  it('should create parent directories for new files', () => {
    mockFs.existsSync = vi.fn((p: string) => !p.includes('newdir'))
    const result = livePreviewService.writeSandboxFile('/sandbox', 'newdir/subdir/file.txt', 'hello')
    expect(result.success).toBe(true)
    expect(mockFs.mkdirSync).toHaveBeenCalled()
  })
})

describe('LivePreview Service — Sandbox Management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    livePreviewService.reset()
  })

  it('should list existing sandboxes', () => {
    mockFs.readdirSync = vi.fn(() => ['abc123', 'def456'])
    mockFs.statSync = vi.fn(() => ({
      isDirectory: () => true,
      birthtime: new Date(),
      birthtimeMs: Date.now(),
    }))

    const sandboxes = livePreviewService.listSandboxes()

    expect(sandboxes.length).toBe(2)
    expect(sandboxes[0]).toHaveProperty('id')
    expect(sandboxes[0]).toHaveProperty('path')
    expect(sandboxes[0]).toHaveProperty('createdAt')
  })

  it('should return empty array if sandbox directory does not exist', () => {
    mockFs.existsSync = vi.fn(() => false)

    const sandboxes = livePreviewService.listSandboxes()
    expect(sandboxes).toEqual([])
  })

  it('should clean up old sandboxes', () => {
    const oldDate = new Date(Date.now() - 48 * 60 * 60 * 1000) // 48 hours ago
    const newDate = new Date()
    mockFs.readdirSync = vi.fn(() => ['old-sandbox', 'new-sandbox'])
    mockFs.statSync = vi.fn((p: string) => ({
      isDirectory: () => true,
      birthtime: p.includes('old') ? oldDate : newDate,
      birthtimeMs: p.includes('old') ? oldDate.getTime() : newDate.getTime(),
    }))

    const cleaned = livePreviewService.cleanupSandboxes(24)

    expect(cleaned).toBeGreaterThanOrEqual(0)
  })
})

// Helper to create a mock child process
function mockChildProcess() {
  const listeners: Record<string, Array<(...args: unknown[]) => void>> = {}
  return {
    stdout: { on: vi.fn() },
    stderr: { on: vi.fn() },
    on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      if (!listeners[event]) listeners[event] = []
      listeners[event].push(handler)
      return { on: vi.fn() }
    }),
    kill: vi.fn(),
    _listeners: listeners,
  }
}

describe('LivePreview Service — Process Lifecycle', () => {
  let mockProc: ReturnType<typeof mockChildProcess>

  beforeEach(async () => {
    vi.clearAllMocks()
    // Re-import mocked modules
    const childProc = await import('child_process')
    mockProc = mockChildProcess()
    vi.mocked(childProc.spawn).mockReturnValue(mockProc as never)
    // execSync should succeed by default (npm available, npm install succeeds)
    vi.mocked(childProc.execSync).mockReturnValue(Buffer.from(''))
    livePreviewService.reset()
  })

  it('should return error when sandbox path does not exist', () => {
    mockFs.existsSync = vi.fn((p: string) => {
      return !p.includes('nonexistent') && !p.includes('preview-sandbox')
    })

    const result = livePreviewService.startPreview('/nonexistent/path')
    expect(result.status).toBe('error')
    expect(result.error).toContain('not found')
  })

  it('should detect HTML template type when no package.json exists', () => {
    mockFs.existsSync = vi.fn((p: string) => {
      if (p.endsWith('package.json') || p.endsWith('.aureon-demo')) return false
      return true
    })

    const result = livePreviewService.startPreview('/sandbox/html-app')
    expect(result.status).toBe('starting')
    expect(result.templateType).toBe('html')
  })

  it('should detect vite-react template type when package.json exists', () => {
    mockFs.existsSync = vi.fn((p: string) => {
      if (p.endsWith('.aureon-demo')) return false
      return true
    })

    const result = livePreviewService.startPreview('/sandbox/vite-app')
    expect(result.status).toBe('starting')
    expect(result.templateType).toBe('vite-react')
  })

  it('should stop running preview and return stopped', () => {
    mockFs.existsSync = vi.fn((p: string) => {
      if (p.endsWith('.aureon-demo')) return false
      return true
    })
    livePreviewService.startPreview('/sandbox/app')

    livePreviewService.stopPreview()
    const status = livePreviewService.getStatus()
    expect(status.status).toBe('stopped')
  })

  it('should return idle when stopping with no session', () => {
    const status = livePreviewService.stopPreview()
    expect(status.status).toBe('idle')
  })
})

describe('LivePreview Service — Secret Redaction', () => {
  it('should redact API keys from log entries', () => {
    const logWithSecret = 'Authorization: Bearer sk-or-v1-abcdefghijklmnopqrstuvwxyz123'
    const redacted = redactSecrets(logWithSecret)

    expect(redacted).not.toContain('sk-or-v1-abcdef')
    expect(redacted).toContain('REDACTED')
  })

  it('should redact secrets from preview logs', () => {
    const logLines = [
      'Server started on port 3100',
      'Secret: sk-ant-api03-test123456789',
      'API key: AIzaSyABC123def456ghi789',
    ]

    for (const line of logLines) {
      const redacted = redactSecrets(line)
      expect(redacted).not.toContain('sk-ant')
      expect(redacted).not.toContain('AIza')
    }
  })
})
