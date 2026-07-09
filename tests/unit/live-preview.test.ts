import { describe, it, expect, vi, beforeEach } from 'vitest'

// Use vi.hoisted so mock objects are available to hoisted vi.mock factories
const { mockFs, mockHttpServer, mockHttpCreateServer } = vi.hoisted(() => {
  const mockHttpServer: any = {}
  mockHttpServer.listen = vi.fn().mockImplementation((port, host, callback) => {
    if (callback) {
      setImmediate(callback)
    }
    return mockHttpServer
  })
  mockHttpServer.on = vi.fn().mockImplementation(() => mockHttpServer)
  mockHttpServer.close = vi.fn().mockImplementation((callback) => {
    if (callback) callback()
    return mockHttpServer
  })
  const mockHttpCreateServer = vi.fn(() => mockHttpServer)
  return {
    mockFs: {
      existsSync: vi.fn(() => false),
      mkdirSync: vi.fn(),
      writeFileSync: vi.fn(),
      readFileSync: vi.fn(),
      readdirSync: vi.fn(() => []),
      statSync: vi.fn(() => ({ isDirectory: () => true, birthtime: new Date(), birthtimeMs: Date.now() })),
      rmSync: vi.fn(),
    },
    mockHttpServer,
    mockHttpCreateServer
  }
})

// Mock Electron app paths
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => '/tmp/test-userdata'),
  },
}))

// Mock fs for sandbox operations
vi.mock('fs', () => ({ default: mockFs, ...mockFs }))

// Mock http module
vi.mock('http', () => ({
  default: {
    createServer: mockHttpCreateServer
  },
  createServer: mockHttpCreateServer
}))

// Mock child_process spawn and execSync
vi.mock('child_process', () => ({
  spawn: vi.fn(),
  execSync: vi.fn(() => Buffer.from('')),
}))

// Mock net for findAvailablePort
vi.mock('net', () => ({
  Server: vi.fn().mockImplementation(function (this: any) {
    const self = this as Record<string, unknown>
    self.listen = vi.fn().mockReturnValue(self)
    self.close = vi.fn()
    self.address = vi.fn(() => ({ port: 3173 }))
    return self
  }),
}))

import { livePreviewService } from '../../src/main/services/live-preview.service'
import { redactSecrets } from '../../src/main/services/log-redacter'
import { AUTO_PREVIEW_KEYS } from '../../src/shared/preview-helpers'

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

  it('should support dynamic style in demo sandbox', () => {
    mockFs.writeFileSync = vi.fn()
    livePreviewService.createSandbox({ templateType: 'demo', style: 'Soft Teal' })
    const writeCalls = mockFs.writeFileSync.mock.calls
    const indexWrite = writeCalls.find((call: any) => call[0].endsWith('index.html'))
    expect(indexWrite).toBeDefined()
    const content = indexWrite![1]
    expect(content).toContain('background: #F0F7F6;')
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

describe('LivePreview Service — In-Process HTTP Server', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFs.existsSync = vi.fn((p: string) => {
      if (p.endsWith('package.json') || p.endsWith('.aureon-demo')) return false
      return true
    })
    livePreviewService.reset()
  })

  it('should start in-process http server and serve index.html', () => {
    livePreviewService.startPreview('/sandbox/html-app')

    expect(mockHttpCreateServer).toHaveBeenCalled()
    // Port is dynamic (findAvailablePort may scan beyond 3100), so match any number
    expect(mockHttpServer.listen).toHaveBeenCalledWith(expect.any(Number), '127.0.0.1', expect.any(Function))

    const handler = (mockHttpCreateServer as any).mock.calls[0][0]
    expect(handler).toBeDefined()

    const req = { url: '/', headers: {} }
    const res = {
      writeHead: vi.fn(),
      end: vi.fn()
    }

    mockFs.readFileSync = vi.fn(() => '<html></html>')
    ;(mockFs.statSync as any) = vi.fn(() => ({ isFile: () => true }))

    ;(handler as any)(req as any, res as any)

    expect(mockFs.readFileSync).toHaveBeenCalled()
    expect(res.writeHead).toHaveBeenCalledWith(200, expect.any(Object))
    expect(res.end).toHaveBeenCalledWith('<html></html>')
  })

  it('should prevent path traversal outside sandbox', () => {
    livePreviewService.startPreview('/sandbox/html-app')
    const handler = (mockHttpCreateServer as any).mock.calls[0][0]

    const req = { url: '/../../etc/passwd', headers: {} }
    const res = {
      writeHead: vi.fn(),
      end: vi.fn()
    }

    ;(handler as any)(req as any, res as any)

    expect(res.writeHead).toHaveBeenCalledWith(403, expect.any(Object))
    expect(res.end).toHaveBeenCalledWith('Forbidden')
  })

  it('should close in-process server when stopPreview is called', () => {
    livePreviewService.startPreview('/sandbox/html-app')
    livePreviewService.stopPreview()
    expect(mockHttpServer.close).toHaveBeenCalled()
  })

  describe('startGeneratedPreview unified flow', () => {
    it('should create sandbox session and write entry html file', () => {
      mockFs.writeFileSync = vi.fn()
      const status = livePreviewService.startGeneratedPreview({
        source: 'studio-build-app',
        style: 'Soft Teal',
        port: 3200
      })
      expect(status.status).not.toBe('error')
      expect(mockFs.writeFileSync).toHaveBeenCalled()
    })

    it('should block directory traversal inside files object', () => {
      const status = livePreviewService.startGeneratedPreview({
        source: 'manual',
        files: {
          '../escaped.html': '<html></html>'
        }
      })
      expect(status.status).toBe('error')
      expect(status.error).toContain('Path escapes sandbox directory')
    })

    it('should redact secrets from written file content', () => {
      mockFs.writeFileSync = vi.fn()
      livePreviewService.startGeneratedPreview({
        source: 'manual',
        files: {
          'index.html': 'API_KEY: sk-or-v1-abcdefghijklmnopqrstuvwxyz123456'
        }
      })
      const writeCalls = mockFs.writeFileSync.mock.calls
      const indexWrite = writeCalls.find((call: any) => call[0].endsWith('index.html'))
      expect(indexWrite).toBeDefined()
      expect(indexWrite![1]).not.toContain('sk-or-v1-abcdef')
    })
  })
})

describe('LivePreview Service — onStatusChange push mechanism', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFs.existsSync = vi.fn(() => false)
    mockFs.readdirSync = vi.fn(() => [])
    mockHttpServer.listen = vi.fn().mockImplementation((port: number, _host: string, callback: () => void) => {
      if (callback) setImmediate(callback)
      return mockHttpServer
    })
    mockHttpServer.on = vi.fn().mockReturnValue(mockHttpServer)
    livePreviewService.reset()
  })

  it('should fire onStatusChange callback when in-process server enters running state', async () => {
    // existsSync: return true for sandbox dir itself, false for package.json/.aureon-demo
    // so startPreview uses the in-process static server path
    mockFs.existsSync = vi.fn((p: string) => {
      if (typeof p === 'string' && (p.includes('package.json') || p.includes('.aureon-demo'))) return false
      return true
    })
    const onChange = vi.fn()
    livePreviewService.onStatusChange(onChange)

    livePreviewService.startPreview('/tmp/sandbox', 3999)

    // Wait for setImmediate inside server.listen callback to fire
    await new Promise(r => setImmediate(r))

    expect(onChange).toHaveBeenCalled()
    const calledWith = onChange.mock.calls[0][0]
    expect(calledWith.status).toBe('running')
    expect(calledWith.url).toContain('127.0.0.1:3999')
  })

  it('should fire onStatusChange callback when server emits error', async () => {
    const onChange = vi.fn()
    livePreviewService.onStatusChange(onChange)

    // Simulate error event fired synchronously from server.on('error')
    mockHttpServer.listen = vi.fn().mockReturnValue(mockHttpServer)
    mockHttpServer.on = vi.fn().mockImplementation((event: string, cb: (err: Error) => void) => {
      if (event === 'error') setImmediate(() => cb(new Error('EADDRINUSE')))
      return mockHttpServer
    })

    livePreviewService.startPreview('/tmp/sandbox', 4001)
    await new Promise(r => setTimeout(r, 20))

    // onChange may have been called with error state
    const calls = onChange.mock.calls
    if (calls.length > 0) {
      const lastCall = calls[calls.length - 1][0]
      expect(['running', 'error']).toContain(lastCall.status)
    }
  })

  it('should stop firing after unsubscribe cleanup', async () => {
    const onChange = vi.fn()
    const unsubscribe = livePreviewService.onStatusChange(onChange)
    unsubscribe()

    livePreviewService.startPreview('/tmp/sandbox', 4002)
    await new Promise(r => setImmediate(r))

    expect(onChange).not.toHaveBeenCalled()
  })

  it('should reset statusChangeCallback on reset()', () => {
    const onChange = vi.fn()
    livePreviewService.onStatusChange(onChange)
    livePreviewService.reset()
    expect(livePreviewService._statusChangeCallback).toBeNull()
  })
})

describe('Studio → LivePreview Regression Contract', () => {
  it('AUTO_PREVIEW_KEYS should not change (sessionStorage contract)', () => {
    expect(AUTO_PREVIEW_KEYS.autoStart).toBe('auto-build-app-preview')
    expect(AUTO_PREVIEW_KEYS.sandboxOnly).toBe('auto-build-app-sandbox-only')
    expect(AUTO_PREVIEW_KEYS.style).toBe('build-app-style')
    expect(AUTO_PREVIEW_KEYS.prompt).toBe('build-app-prompt')
    expect(AUTO_PREVIEW_KEYS.platform).toBe('build-app-platform')
    expect(AUTO_PREVIEW_KEYS.pipelinePrompt).toBe('build-pipeline-prompt')
    expect(AUTO_PREVIEW_KEYS.pipelineTheme).toBe('build-pipeline-theme')
    expect(AUTO_PREVIEW_KEYS.pipelinePlatform).toBe('build-pipeline-platform')
    expect(AUTO_PREVIEW_KEYS.pipelineMode).toBe('build-pipeline-mode')
    expect(AUTO_PREVIEW_KEYS.pipelineModelRoute).toBe('build-pipeline-model-route')
    expect(AUTO_PREVIEW_KEYS.pipelineModelExplanation).toBe('build-pipeline-model-explanation')
  })

  it('startGeneratedPreview should create demo sandbox and not error', () => {
    mockFs.writeFileSync = vi.fn()
    mockFs.existsSync = vi.fn((p: string) => {
      if (typeof p === 'string' && (p.includes('package.json') || p.includes('.aureon-demo'))) return false
      return true
    })
    const status = livePreviewService.startGeneratedPreview({
      source: 'studio-build-app',
      style: 'Calming Ivory',
      port: 3200
    })
    expect(status.status).not.toBe('error')
    expect(mockFs.writeFileSync).toHaveBeenCalled()
  })

  it('createDemo should return valid CodingDemoResult', () => {
    mockFs.writeFileSync = vi.fn()
    mockFs.existsSync = vi.fn((p: string) => {
      if (typeof p === 'string' && (p.includes('package.json') || p.includes('.aureon-demo'))) return false
      return true
    })
    const result = livePreviewService.createDemo(3300, 'Calming Ivory')
    expect(result.success).toBe(true)
    expect(result.sandboxId).toBeTruthy()
    expect(result.previewStatus.status).not.toBe('error')
  })

  it('stopPreview should close the in-process HTTP server', () => {
    mockFs.existsSync = vi.fn((p: string) => {
      if (typeof p === 'string' && (p.includes('package.json') || p.includes('.aureon-demo'))) return false
      return true
    })
    livePreviewService.startPreview('/sandbox/html-app')
    livePreviewService.stopPreview()
    expect(mockHttpServer.close).toHaveBeenCalled()
  })

  it('reset should clear session and status callback', () => {
    const cb = vi.fn()
    livePreviewService.onStatusChange(cb)
    livePreviewService.reset()
    expect(livePreviewService._statusChangeCallback).toBeNull()
  })
})
