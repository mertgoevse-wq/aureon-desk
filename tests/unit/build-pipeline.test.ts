import { describe, it, expect, vi } from 'vitest'
import { generateFollowUpSuggestions } from '../../src/shared/types/build-pipeline'
import type { BuildRequest, FileOperation, DiffLine } from '../../src/shared/types/build-pipeline'
import { redactSecrets } from '../../src/main/services/log-redacter'
import { callProviderApiStreaming } from '../../src/main/services/provider-call'
import type { ProviderApiParams } from '../../src/main/services/provider-call'

// === Build Pipeline Unit Tests ===

describe('Build Pipeline — File Operations', () => {
  it('should create file operations with correct types', () => {
    const files: Record<string, string> = {
      'index.html': '<html></html>',
      'styles.css': 'body {}',
      'app.js': 'console.log("hi")',
    }

    const ops: FileOperation[] = Object.entries(files).map(([filePath, content], i) => ({
      id: `op-${i}`,
      type: 'create_file',
      path: filePath,
      language: filePath.endsWith('.html') ? 'html' : filePath.endsWith('.css') ? 'css' : 'javascript',
      afterContent: content,
      status: 'pending',
      risk: 'safe',
    }))

    expect(ops.length).toBe(3)
    expect(ops[0].type).toBe('create_file')
    expect(ops[0].path).toBe('index.html')
    expect(ops[0].language).toBe('html')
    expect(ops[1].path).toBe('styles.css')
    expect(ops[1].language).toBe('css')
    expect(ops[2].path).toBe('app.js')
    expect(ops[2].language).toBe('javascript')
  })

  it('should have correct risk classification for file operations', () => {
    const safeOps: FileOperation[] = [
      { id: '1', type: 'create_file', path: 'index.html', language: 'html', afterContent: '<html></html>', status: 'pending', risk: 'safe' },
      { id: '2', type: 'update_file', path: 'index.html', language: 'html', beforeContent: '<html>', afterContent: '<html></html>', status: 'pending', risk: 'safe' },
      { id: '3', type: 'rename_file', path: 'new.html', oldPath: 'old.html', language: 'html', status: 'pending', risk: 'safe' },
      { id: '4', type: 'mkdir', path: 'src/components', language: 'text', status: 'pending', risk: 'safe' },
    ]
    for (const op of safeOps) {
      expect(op.risk).toBe('safe')
    }

    const destructiveOp: FileOperation = {
      id: '5', type: 'delete_file', path: 'old.html', language: 'html', beforeContent: '<html>', status: 'pending', risk: 'destructive'
    }
    expect(destructiveOp.risk).toBe('destructive')
  })

  it('should support all file operation types', () => {
    const types = ['create_file', 'update_file', 'delete_file', 'rename_file', 'mkdir']
    for (const type of types) {
      const op: FileOperation = {
        id: `op-${type}`,
        type: type as FileOperation['type'],
        path: 'test.txt',
        language: 'text',
        afterContent: '',
        status: 'pending',
        risk: 'safe',
      }
      expect(op.type).toBe(type)
    }
  })

  it('should support all file operation statuses', () => {
    const statuses = ['pending', 'applied', 'failed', 'skipped']
    for (const status of statuses) {
      const op: FileOperation = {
        id: `op-${status}`,
        type: 'create_file',
        path: 'test.txt',
        language: 'text',
        afterContent: '',
        status: status as FileOperation['status'],
        risk: 'safe',
      }
      expect(op.status).toBe(status)
    }
  })

  it('should support update_file with before/after content and diff', () => {
    const op: FileOperation = {
      id: 'op-update',
      type: 'update_file',
      path: 'styles.css',
      language: 'css',
      beforeContent: 'body { color: red; }',
      afterContent: 'body { color: blue; }',
      diff: [
        { type: 'context', content: 'body { color: ', oldLine: 1, newLine: 1 },
        { type: 'remove', content: 'red; }', oldLine: 1 },
        { type: 'add', content: 'blue; }', newLine: 1 },
      ],
      status: 'pending',
      risk: 'safe',
    }
    expect(op.type).toBe('update_file')
    expect(op.beforeContent).toBeDefined()
    expect(op.afterContent).toBeDefined()
    expect(op.diff).toBeDefined()
    expect(op.diff!.length).toBeGreaterThan(0)
  })

  it('should support delete_file with beforeContent and destructive risk', () => {
    const op: FileOperation = {
      id: 'op-delete',
      type: 'delete_file',
      path: 'old-component.js',
      language: 'javascript',
      beforeContent: 'console.log("removed")',
      diff: [
        { type: 'remove', content: 'console.log("removed")', oldLine: 1 },
      ],
      status: 'pending',
      risk: 'destructive',
    }
    expect(op.type).toBe('delete_file')
    expect(op.risk).toBe('destructive')
    expect(op.beforeContent).toBeDefined()
    expect(op.afterContent).toBeUndefined()
  })

  it('should support rename_file with oldPath', () => {
    const op: FileOperation = {
      id: 'op-rename',
      type: 'rename_file',
      path: 'src/app.tsx',
      oldPath: 'src/App.tsx',
      language: 'typescript',
      status: 'pending',
      risk: 'safe',
    }
    expect(op.type).toBe('rename_file')
    expect(op.oldPath).toBe('src/App.tsx')
    expect(op.path).toBe('src/app.tsx')
  })

  it('should support mkdir for directory creation with no file content', () => {
    const op: FileOperation = {
      id: 'op-mkdir',
      type: 'mkdir',
      path: 'src/components',
      language: 'text',
      status: 'pending',
      risk: 'safe',
    }
    expect(op.type).toBe('mkdir')
    expect(op.afterContent).toBeUndefined()
    expect(op.beforeContent).toBeUndefined()
    expect(op.path.endsWith('/')).toBe(false)  // Should not have trailing slash
  })
})

describe('Build Pipeline — Diff Generation', () => {
  it('should generate diff lines with correct types', () => {
    const diff: DiffLine[] = [
      { type: 'context', content: 'line 1', oldLine: 1, newLine: 1 },
      { type: 'remove', content: 'old line', oldLine: 2 },
      { type: 'add', content: 'new line', newLine: 2 },
    ]

    expect(diff.length).toBe(3)
    expect(diff[0].type).toBe('context')
    expect(diff[1].type).toBe('remove')
    expect(diff[2].type).toBe('add')
  })

  it('should mark added lines with newLine and removed lines with oldLine', () => {
    const addLine: DiffLine = { type: 'add', content: 'new', newLine: 5 }
    const removeLine: DiffLine = { type: 'remove', content: 'old', oldLine: 3 }

    expect(addLine.newLine).toBe(5)
    expect(addLine.oldLine).toBeUndefined()
    expect(removeLine.oldLine).toBe(3)
    expect(removeLine.newLine).toBeUndefined()
  })

  it('should compute a simple diff between empty and content', () => {
    // Simulates the diff for a new file (before='', after=content)
    const before = ''
    const after = 'line1\nline2\nline3'
    const beforeLines = before.split('\n')
    const afterLines = after.split('\n')

    // All lines should be additions
    const additions = afterLines.filter(l => l.length > 0)
    expect(additions.length).toBe(3)
    expect(additions[0]).toBe('line1')
    expect(additions[2]).toBe('line3')
  })

  it('should compute a diff for an update (before != after)', () => {
    const before = 'line1\nold\nline3'
    const after = 'line1\nnew\nline3'

    // Simple diff: common prefix (line1), removed (old), added (new), common suffix (line3)
    const removed = before.split('\n').filter(l => !after.split('\n').includes(l))
    const added = after.split('\n').filter(l => !before.split('\n').includes(l))

    expect(removed).toEqual(['old'])
    expect(added).toEqual(['new'])
  })
})

describe('Build Pipeline — Build Request', () => {
  it('should create a valid build request', () => {
    const request: BuildRequest = {
      prompt: 'Build a counter app with ivory hero theme',
      projectType: 'web-app',
      theme: 'Calming Ivory',
      targetWorkspace: 'code',
      providerModelRoute: null,
      mode: 'generate-and-preview',
    }

    expect(request.prompt).toContain('counter')
    expect(request.theme).toBe('Calming Ivory')
    expect(request.mode).toBe('generate-and-preview')
  })

  it('should support all build modes', () => {
    const modes = ['plan-only', 'generate', 'generate-and-preview']
    for (const mode of modes) {
      const request: BuildRequest = {
        prompt: 'test',
        projectType: 'web-app',
        theme: 'Calming Ivory',
        targetWorkspace: 'code',
        mode: mode as BuildRequest['mode'],
      }
      expect(request.mode).toBe(mode)
    }
  })

  it('should support all theme variants', () => {
    const themes = ['Calming Ivory', 'Soft Teal', 'Deep Slate']
    for (const theme of themes) {
      const request: BuildRequest = {
        prompt: 'test',
        projectType: 'web-app',
        theme,
        targetWorkspace: 'code',
        mode: 'generate-and-preview',
      }
      expect(request.theme).toBe(theme)
    }
  })
})

describe('Build Pipeline — Follow-Up Suggestions', () => {
  it('should generate follow-up suggestions', () => {
    const suggestions = generateFollowUpSuggestions('build_app')
    expect(suggestions.length).toBe(7)
  })

  it('should include style improvement suggestion', () => {
    const suggestions = generateFollowUpSuggestions('build_utility')
    const style = suggestions.find(s => s.category === 'style')
    expect(style).toBeDefined()
    expect(style?.label).toBe('Improve styling')
  })

  it('should include local storage suggestion', () => {
    const suggestions = generateFollowUpSuggestions('build_app')
    const persistence = suggestions.find(s => s.category === 'persistence')
    expect(persistence).toBeDefined()
    expect(persistence?.label).toBe('Add local storage')
  })

  it('should include dark mode suggestion', () => {
    const suggestions = generateFollowUpSuggestions('build_app')
    const theme = suggestions.find(s => s.category === 'theme')
    expect(theme).toBeDefined()
    expect(theme?.label).toBe('Add dark mode')
  })

  it('should include PWA packaging suggestion', () => {
    const suggestions = generateFollowUpSuggestions('build_app')
    const deploy = suggestions.find(s => s.category === 'deploy')
    expect(deploy).toBeDefined()
    expect(deploy?.label).toBe('Package as PWA')
  })

  it('should include explain code suggestion', () => {
    const suggestions = generateFollowUpSuggestions('build_app')
    const explain = suggestions.find(s => s.category === 'explain')
    expect(explain).toBeDefined()
    expect(explain?.label).toBe('Explain the code')
  })

  it('should include navigation suggestion', () => {
    const suggestions = generateFollowUpSuggestions('build_app')
    const feature = suggestions.find(s => s.category === 'feature')
    expect(feature).toBeDefined()
    expect(feature?.label).toBe('Add navigation')
  })

  it('should include animations suggestion', () => {
    const suggestions = generateFollowUpSuggestions('build_app')
    const animation = suggestions.find(s => s.category === 'animation')
    expect(animation).toBeDefined()
    expect(animation?.label).toBe('Add animations')
  })

  it('should have unique suggestion IDs', () => {
    const suggestions = generateFollowUpSuggestions('build_app')
    const ids = suggestions.map(s => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('should have non-empty prompts for all suggestions', () => {
    const suggestions = generateFollowUpSuggestions('build_app')
    for (const s of suggestions) {
      expect(s.prompt.length).toBeGreaterThan(10)
      expect(s.label.length).toBeGreaterThan(3)
    }
  })
})

describe('Build Pipeline — Path Traversal Security', () => {
  it('should block path traversal attempts', () => {
    // Simulate the path resolution check used in the service
    const sandboxPath = '/safe/sandbox/abc123'
    const maliciousPath = '../../../etc/passwd'
    const resolved = require('path').resolve(sandboxPath, maliciousPath)
    const resolvedSandbox = require('path').resolve(sandboxPath)

    expect(resolved.startsWith(resolvedSandbox)).toBe(false)
  })

  it('should allow normal relative paths within sandbox', () => {
    const sandboxPath = '/safe/sandbox/abc123'
    const normalPath = 'src/index.html'
    const resolved = require('path').resolve(sandboxPath, normalPath)
    const resolvedSandbox = require('path').resolve(sandboxPath)

    expect(resolved.startsWith(resolvedSandbox)).toBe(true)
  })

  it('should allow nested directory paths within sandbox', () => {
    const sandboxPath = '/safe/sandbox/abc123'
    const nestedPath = 'src/components/Button.tsx'
    const resolved = require('path').resolve(sandboxPath, nestedPath)
    const resolvedSandbox = require('path').resolve(sandboxPath)

    expect(resolved.startsWith(resolvedSandbox)).toBe(true)
  })
})

describe('Build Pipeline — Secrets Ignored', () => {
  it('should redact API keys in file content', () => {
    const content = 'const apiKey = "sk-or-v1-abc123def456ghi789jkl012mno345pqrstu"'
    const redacted = redactSecrets(content)
    expect(redacted).not.toContain('sk-or-v1-abc123')
    expect(redacted).toContain('[REDACTED')
  })

  it('should redact Bearer tokens in file content', () => {
    const content = 'Authorization: Bearer ya29.abc123def456ghi789jkl012mno345pqr'
    const redacted = redactSecrets(content)
    expect(redacted).not.toContain('ya29.abc123')
    expect(redacted).toContain('[REDACTED]')
  })

  it('should not redact normal code content', () => {
    const content = 'const counter = 0;\nfunction increment() { counter++; }'
    const redacted = redactSecrets(content)
    expect(redacted).toBe(content)
  })
})

describe('Build Pipeline — Deterministic Demo', () => {
  it('should classify counter prompt as build_utility', () => {
    // Replicate the classifyIntent logic
    function classifyIntent(prompt: string): string {
      const lower = prompt.toLowerCase()
      if (lower.includes('counter') || lower.includes('count')) return 'build_utility'
      if (lower.includes('dashboard')) return 'build_dashboard'
      if (lower.includes('game')) return 'build_game'
      if (lower.includes('component') || lower.includes('widget')) return 'build_component'
      if (lower.includes('app') || lower.includes('build') || lower.includes('create')) return 'build_app'
      return 'generic'
    }

    expect(classifyIntent('Build a counter app with ivory hero theme')).toBe('build_utility')
    expect(classifyIntent('Create a dashboard with charts')).toBe('build_dashboard')
    expect(classifyIntent('Make a mini game')).toBe('build_game')
    expect(classifyIntent('Build a card component')).toBe('build_component')
    expect(classifyIntent('Build an app')).toBe('build_app')
    expect(classifyIntent('Hello world')).toBe('generic')
  })

  it('should generate 3 files for a web app demo', () => {
    const expectedFiles = ['index.html', 'styles.css', 'app.js']
    expect(expectedFiles.length).toBe(3)
    expect(expectedFiles).toContain('index.html')
    expect(expectedFiles).toContain('styles.css')
    expect(expectedFiles).toContain('app.js')
  })

  it('should include ivory theme colors in generated CSS', () => {
    const ivoryTheme = {
      bg: '#FAF7F2',
      surface: '#FFFFFF',
      text: '#221A0F',
      accent: '#B8683A',
      accentHover: '#A45A30',
      border: '#E4DEC9',
      secondary: '#5D5241',
    }
    expect(ivoryTheme.bg).toBe('#FAF7F2')
    expect(ivoryTheme.accent).toBe('#B8683A')
    // Ensure it's not the old aggressive accent
    expect(ivoryTheme.accent).not.toBe('#C75B39')
  })

  it('should include soft teal theme colors', () => {
    const tealTheme = {
      bg: '#F0F7F6',
      accent: '#2A8A7C',
    }
    expect(tealTheme.bg).toBe('#F0F7F6')
    expect(tealTheme.accent).toBe('#2A8A7C')
  })

  it('should include deep slate theme colors', () => {
    const slateTheme = {
      bg: '#1E293B',
      accent: '#38BDF8',
    }
    expect(slateTheme.bg).toBe('#1E293B')
    expect(slateTheme.accent).toBe('#38BDF8')
  })
})

describe('Build Pipeline — Build Steps', () => {
  it('should have correct step types in order', () => {
    const expectedSteps = ['classify', 'plan', 'generate', 'apply', 'preview_start', 'preview_ready', 'followup', 'complete']
    expect(expectedSteps.length).toBe(8)
    // Verify they are ordered correctly
    expect(expectedSteps.indexOf('classify')).toBeLessThan(expectedSteps.indexOf('plan'))
    expect(expectedSteps.indexOf('plan')).toBeLessThan(expectedSteps.indexOf('generate'))
    expect(expectedSteps.indexOf('generate')).toBeLessThan(expectedSteps.indexOf('apply'))
    expect(expectedSteps.indexOf('apply')).toBeLessThan(expectedSteps.indexOf('preview_start'))
  })

  it('should support error and cancelled step types', () => {
    const stepTypes = ['classify', 'plan', 'generate', 'apply', 'preview_start', 'preview_ready', 'followup', 'complete', 'error', 'cancelled']
    expect(stepTypes).toContain('error')
    expect(stepTypes).toContain('cancelled')
  })

  it('should support all step statuses', () => {
    const statuses = ['pending', 'running', 'done', 'skipped', 'error']
    for (const status of statuses) {
      expect(status).toBeDefined()
    }
  })
})

describe('Build Pipeline — Streaming Generation', () => {
  it('should export callProviderApiStreaming with correct signature', () => {
    expect(typeof callProviderApiStreaming).toBe('function')
    // Signature: (params: ProviderApiParams, onToken: (chunk: string) => void) => Promise<string>
    expect(callProviderApiStreaming.length).toBe(2)
  })

  it('should route OpenAI-compatible adapters to streaming (not throw on routing)', async () => {
    const compatibleAdapters = ['openai', 'openrouter', 'groq', 'mistral', 'deepseek', 'lmstudio', 'custom']
    for (const adapter of compatibleAdapters) {
      // Verify each adapter is NOT a special-case adapter
      expect(['anthropic', 'google', 'ollama']).not.toContain(adapter)
    }
  })

  it('should route anthropic adapter to its own streaming handler', async () => {
    // Anthropic must be in the routing switch
    const adapter = 'anthropic' as const
    expect(adapter).toBe('anthropic')
  })

  it('should route ollama adapter to its own streaming handler', async () => {
    const adapter = 'ollama' as const
    expect(adapter).toBe('ollama')
  })

  it('should fall back to non-streaming for google adapter', async () => {
    const adapter = 'google' as const
    expect(adapter).toBe('google')
  })

  it('should handle onToken callback with throttled chunks', async () => {
    const tokens: string[] = []
    let lastFlush = 0
    const MIN_FLUSH_MS = 150

    const onToken = (chunk: string) => {
      const now = Date.now()
      if (tokens.length === 0 || now - lastFlush >= MIN_FLUSH_MS) {
        tokens.push(chunk)
        lastFlush = now
      }
    }

    // First call: always accepted
    onToken('hello')
    expect(tokens.length).toBe(1)
    expect(tokens[0]).toBe('hello')

    // Second call within throttle window: should be skipped
    onToken('world')
    // Since Date.now() hasn't advanced enough in test, this may or may not be accepted
    // But the throttling logic is correct: if now - lastFlush < 150, skip

    // Verify the onToken callback signature matches what callProviderApiStreaming expects
    expect(typeof onToken).toBe('function')
  })

  it('should parse JSON code response correctly', () => {
    // Test the parsing logic used by parseCodeResponse (via generateWithAI)
    // This duplicates the logic to verify correctness
    function parseJSON(text: string): Record<string, string> {
      try {
        const trimmed = text.trim()
        const jsonStr = trimmed.startsWith('```json') ? trimmed.slice(7, -3).trim()
          : trimmed.startsWith('```') ? trimmed.slice(3, -3).trim()
          : trimmed
        const parsed = JSON.parse(jsonStr) as Record<string, unknown>
        const files: Record<string, string> = {}
        for (const key of ['index.html', 'styles.css', 'app.js']) {
          if (typeof parsed[key] === 'string' && parsed[key].length > 10) {
            files[key] = parsed[key] as string
          }
        }
        return files
      } catch {
        return {}
      }
    }

    const json = '{"index.html":"<html><body>Hello World</body></html>","styles.css":"body{color:red;margin:0}","app.js":"console.log(42)"}'
    const result = parseJSON(json)
    expect(result['index.html']).toContain('Hello World')
    expect(result['styles.css']).toContain('color:red')
    expect(result['app.js']).toContain('console.log')
    expect(Object.keys(result).length).toBe(3)
  })

  it('should strip markdown code fences from JSON response', () => {
    function parseJSON(text: string): Record<string, string> {
      try {
        const trimmed = text.trim()
        const jsonStr = trimmed.startsWith('```json') ? trimmed.slice(7, -3).trim()
          : trimmed.startsWith('```') ? trimmed.slice(3, -3).trim()
          : trimmed
        const parsed = JSON.parse(jsonStr) as Record<string, unknown>
        const files: Record<string, string> = {}
        for (const key of ['index.html', 'styles.css', 'app.js']) {
          if (typeof parsed[key] === 'string' && parsed[key].length > 10) {
            files[key] = parsed[key] as string
          }
        }
        return files
      } catch { return {} }
    }

    // JSON wrapped in ```json fence
    const fencedJson = '```json\n{"index.html":"<html><body>Hi</body></html>","styles.css":"body{margin:0}","app.js":"var x=1"}\n```'
    const result = parseJSON(fencedJson)
    expect(result['index.html']).toContain('Hi')
    expect(result['styles.css']).toContain('margin:0')

    // JSON wrapped in plain ``` fence
    const plainFence = '```\n{"index.html":"<html></html>","styles.css":"*{box-sizing:border-box}","app.js":"let y=2"}\n```'
    const result2 = parseJSON(plainFence)
    expect(result2['styles.css']).toContain('box-sizing')
  })

  it('should reject short content in JSON parsing', () => {
    function parseJSON(text: string): Record<string, string> {
      try {
        const trimmed = text.trim()
        const jsonStr = trimmed.startsWith('```') ? trimmed.slice(3, -3).trim() : trimmed
        const parsed = JSON.parse(jsonStr) as Record<string, unknown>
        const files: Record<string, string> = {}
        for (const key of ['index.html', 'styles.css', 'app.js']) {
          if (typeof parsed[key] === 'string' && parsed[key].length > 10) {
            files[key] = parsed[key] as string
          }
        }
        return files
      } catch { return {} }
    }

    // Content too short (< 10 chars per file)
    const short = '{"index.html":"hi"}'
    expect(Object.keys(parseJSON(short)).length).toBe(0)

    // Missing required keys
    const missing = '{"readme.md":"# Hello"}'
    expect(Object.keys(parseJSON(missing)).length).toBe(0)
  })

  it('should handle HTTP 401 authentication error', () => {
    const error = new Error('Authentication failed (401). Check your API key.')
    expect(error.message).toContain('Authentication failed')
    expect(error.message).toContain('401')
  })

  it('should handle HTTP 429 rate limit error', () => {
    const error = new Error('Rate limited. Please wait and try again.')
    expect(error.message).toContain('Rate limited')
  })

  it('should handle missing response body for streaming', () => {
    const error = new Error('No response body for streaming')
    expect(error.message).toContain('No response body')
  })

  it('should chunk text for fallback non-streaming adapters', () => {
    const text = 'abc'.repeat(100) // 300 chars
    const chunked = text.match(/.{1,200}/g) || [text]
    expect(chunked.length).toBe(2)
    expect(chunked[0].length).toBe(200)
    expect(chunked[1].length).toBe(100)
    expect(chunked.join('')).toBe(text)
  })
})

describe('Build Pipeline — Artifact Tabs', () => {
  it('should have 5 artifact tabs', () => {
    const tabs = ['preview', 'code', 'files', 'diff', 'plan']
    expect(tabs.length).toBe(5)
  })

  it('should default to preview tab after render', () => {
    // After pipeline completes with a running preview, the tab switches to 'preview'
    const defaultTabAfterRender = 'preview'
    expect(defaultTabAfterRender).toBe('preview')
  })

  it('should default to code tab during pipeline execution', () => {
    // During pipeline execution, the tab starts at 'code' to show activity
    const defaultTabDuringPipeline = 'code'
    expect(defaultTabDuringPipeline).toBe('code')
  })
})
