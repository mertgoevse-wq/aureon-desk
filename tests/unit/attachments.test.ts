/**
 * Attachments Unit Tests
 *
 * Tests the shared safety logic, format utilities, and store behavior.
 * Main-process file reading is tested via integration/e2e tests.
 */
import { describe, it, expect, afterEach } from 'vitest'
import {
  formatFileSize,
  getMimeLabel,
  hasBlockedDir,
  checkExtensionSafety,
  MAX_FILE_SIZE_BYTES,
  BLOCKED_DIRS,
  BLOCKED_EXTENSIONS,
  WARN_EXTENSIONS,
  ALLOWED_IMAGE_TYPES,
  EXTENSION_MIME_MAP,
} from '../../src/shared/attachments'
import { useAttachmentStore } from '../../src/renderer/src/stores/attachmentStore'
import type { AttachmentFile } from '../../src/shared/attachments'

// Helper to create a test attachment
function makeAttachment(overrides: Partial<AttachmentFile> = {}): AttachmentFile {
  return {
    id: 'test-1',
    name: 'test.txt',
    path: '/tmp/test.txt',
    mimeType: 'text/plain',
    sizeBytes: 1024,
    sizeLabel: '1.0 KB',
    status: 'safe',
    isZip: false,
    isIncludedInContext: false,
    ...overrides,
  }
}

describe('formatFileSize', () => {
  it('formats bytes', () => {
    expect(formatFileSize(0)).toBe('0 B')
    expect(formatFileSize(512)).toBe('512 B')
    expect(formatFileSize(1023)).toBe('1023 B')
  })

  it('formats KB', () => {
    expect(formatFileSize(1024)).toBe('1.0 KB')
    expect(formatFileSize(1536)).toBe('1.5 KB')
    expect(formatFileSize(1024 * 50)).toBe('50.0 KB')
  })

  it('formats MB', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1.0 MB')
    expect(formatFileSize(1024 * 1024 * 5)).toBe('5.0 MB')
  })

  it('formats GB', () => {
    expect(formatFileSize(1024 * 1024 * 1024)).toBe('1.00 GB')
    expect(formatFileSize(1024 * 1024 * 1024 * 2.5)).toBe('2.50 GB')
  })

  it('handles MAX_FILE_SIZE_BYTES constant', () => {
    expect(MAX_FILE_SIZE_BYTES).toBe(10 * 1024 * 1024)
    expect(formatFileSize(MAX_FILE_SIZE_BYTES)).toBe('10.0 MB')
  })
})

describe('getMimeLabel', () => {
  it('returns Image for image types', () => {
    expect(getMimeLabel('image/png')).toBe('Image')
    expect(getMimeLabel('image/jpeg')).toBe('Image')
    expect(getMimeLabel('image/gif')).toBe('Image')
  })

  it('returns Text for text types', () => {
    expect(getMimeLabel('text/plain')).toBe('Text')
    expect(getMimeLabel('text/html')).toBe('Text')
    expect(getMimeLabel('text/csv')).toBe('Text')
  })

  it('returns specific labels for known types', () => {
    expect(getMimeLabel('application/json')).toBe('JSON')
    expect(getMimeLabel('application/pdf')).toBe('PDF')
    expect(getMimeLabel('application/zip')).toBe('ZIP Archive')
  })

  it('returns Code for JS/TS types', () => {
    expect(getMimeLabel('text/javascript')).toBe('Code')
    expect(getMimeLabel('text/typescript')).toBe('Code')
  })

  it('returns File for unknown types', () => {
    expect(getMimeLabel('application/octet-stream')).toBe('File')
    expect(getMimeLabel('x-custom/type')).toBe('File')
  })
})

describe('hasBlockedDir', () => {
  it('detects .git in path', () => {
    expect(hasBlockedDir('/project/.git/config')).toBe('.git')
    expect(hasBlockedDir('C:\\project\\.git\\config')).toBe('.git')
  })

  it('detects node_modules in path', () => {
    expect(hasBlockedDir('/project/node_modules/react/index.js')).toBe('node_modules')
  })

  it('detects dist in path', () => {
    expect(hasBlockedDir('/project/dist/main.js')).toBe('dist')
  })

  it('detects out in path', () => {
    expect(hasBlockedDir('/project/out/renderer/index.html')).toBe('out')
  })

  it('detects .env in path', () => {
    expect(hasBlockedDir('/project/.env')).toBe('.env')
    expect(hasBlockedDir('/project/subdir/.env/production')).toBe('.env')
  })

  it('returns null for safe paths', () => {
    expect(hasBlockedDir('/project/src/main.ts')).toBeNull()
    expect(hasBlockedDir('/project/public/index.html')).toBeNull()
    expect(hasBlockedDir('C:\\Users\\docs\\README.md')).toBeNull()
  })

  it('verifies all BLOCKED_DIRS are covered', () => {
    expect(BLOCKED_DIRS).toContain('.git')
    expect(BLOCKED_DIRS).toContain('node_modules')
    expect(BLOCKED_DIRS).toContain('dist')
    expect(BLOCKED_DIRS).toContain('out')
    expect(BLOCKED_DIRS).toContain('.next')
    expect(BLOCKED_DIRS).toContain('build')
    expect(BLOCKED_DIRS.length).toBeGreaterThanOrEqual(8)
  })
})

describe('checkExtensionSafety', () => {
  it('blocks secret extensions', () => {
    expect(checkExtensionSafety('.env')).toBe('blocked')
    expect(checkExtensionSafety('.pem')).toBe('blocked')
    expect(checkExtensionSafety('.key')).toBe('blocked')
    expect(checkExtensionSafety('.id_rsa')).toBe('blocked')
    expect(checkExtensionSafety('.pfx')).toBe('blocked')
    expect(checkExtensionSafety('.p12')).toBe('blocked')
  })

  it('warns on sensitive extensions', () => {
    expect(checkExtensionSafety('.sqlite')).toBe('warning')
    expect(checkExtensionSafety('.db')).toBe('warning')
    expect(checkExtensionSafety('.sqlite3')).toBe('warning')
    expect(checkExtensionSafety('.log')).toBe('warning')
  })

  it('returns safe for normal files', () => {
    expect(checkExtensionSafety('.txt')).toBe('safe')
    expect(checkExtensionSafety('.ts')).toBe('safe')
    expect(checkExtensionSafety('.js')).toBe('safe')
    expect(checkExtensionSafety('.png')).toBe('safe')
    expect(checkExtensionSafety('.html')).toBe('safe')
  })

  it('is case-insensitive', () => {
    expect(checkExtensionSafety('.ENV')).toBe('blocked')
    expect(checkExtensionSafety('.PEM')).toBe('blocked')
    expect(checkExtensionSafety('.SQLITE')).toBe('warning')
  })

  it('verifies BLOCKED_EXTENSIONS list', () => {
    expect(BLOCKED_EXTENSIONS).toContain('.env')
    expect(BLOCKED_EXTENSIONS).toContain('.pem')
    expect(BLOCKED_EXTENSIONS).toContain('.key')
    expect(BLOCKED_EXTENSIONS).toContain('.id_rsa')
    expect(BLOCKED_EXTENSIONS.length).toBeGreaterThanOrEqual(6)
  })

  it('verifies WARN_EXTENSIONS list', () => {
    expect(WARN_EXTENSIONS).toContain('.sqlite')
    expect(WARN_EXTENSIONS).toContain('.db')
    expect(WARN_EXTENSIONS).toContain('.log')
  })
})

describe('EXTENSION_MIME_MAP', () => {
  it('maps common code extensions', () => {
    expect(EXTENSION_MIME_MAP['.ts']).toBe('text/typescript')
    expect(EXTENSION_MIME_MAP['.tsx']).toBe('text/typescript')
    expect(EXTENSION_MIME_MAP['.js']).toBe('text/javascript')
    expect(EXTENSION_MIME_MAP['.html']).toBe('text/html')
    expect(EXTENSION_MIME_MAP['.css']).toBe('text/css')
  })

  it('maps image extensions', () => {
    expect(EXTENSION_MIME_MAP['.png']).toBe('image/png')
    expect(EXTENSION_MIME_MAP['.jpg']).toBe('image/jpeg')
    expect(EXTENSION_MIME_MAP['.webp']).toBe('image/webp')
  })

  it('maps archive extensions', () => {
    expect(EXTENSION_MIME_MAP['.zip']).toBe('application/zip')
    expect(EXTENSION_MIME_MAP['.json']).toBe('application/json')
    expect(EXTENSION_MIME_MAP['.pdf']).toBe('application/pdf')
  })
})

describe('ALLOWED_IMAGE_TYPES', () => {
  it('includes common web image formats', () => {
    expect(ALLOWED_IMAGE_TYPES).toContain('image/png')
    expect(ALLOWED_IMAGE_TYPES).toContain('image/jpeg')
    expect(ALLOWED_IMAGE_TYPES).toContain('image/webp')
    expect(ALLOWED_IMAGE_TYPES).toContain('image/gif')
    expect(ALLOWED_IMAGE_TYPES).toContain('image/svg+xml')
  })
})

describe('useAttachmentStore', () => {
  it('starts with empty attachments', () => {
    const { getState } = useAttachmentStore
    expect(getState().attachments).toEqual([])
  })

  it('adds attachments', () => {
    const { getState } = useAttachmentStore
    const file = makeAttachment()
    getState().addAttachments([file])
    expect(getState().attachments).toHaveLength(1)
    expect(getState().attachments[0].id).toBe('test-1')
  })

  it('avoids duplicate paths', () => {
    const { getState } = useAttachmentStore
    const file1 = makeAttachment({ id: '1', path: '/tmp/a.txt' })
    const file2 = makeAttachment({ id: '2', path: '/tmp/a.txt' })
    getState().addAttachments([file1])
    getState().addAttachments([file2])
    expect(getState().attachments).toHaveLength(1)
    expect(getState().attachments[0].id).toBe('1')
  })

  it('allows different paths', () => {
    const { getState } = useAttachmentStore
    const file1 = makeAttachment({ id: '1', path: '/tmp/a.txt' })
    const file2 = makeAttachment({ id: '2', path: '/tmp/b.txt' })
    getState().addAttachments([file1])
    getState().addAttachments([file2])
    expect(getState().attachments).toHaveLength(2)
  })

  it('removes attachments by ID', () => {
    const { getState } = useAttachmentStore
    const file1 = makeAttachment({ id: '1', path: '/tmp/a.txt' })
    const file2 = makeAttachment({ id: '2', path: '/tmp/b.txt' })
    getState().addAttachments([file1, file2])
    getState().removeAttachment('1')
    expect(getState().attachments).toHaveLength(1)
    expect(getState().attachments[0].id).toBe('2')
  })

  it('toggles context inclusion', () => {
    const { getState } = useAttachmentStore
    const file = makeAttachment()
    getState().addAttachments([file])
    expect(getState().attachments[0].isIncludedInContext).toBe(false)

    getState().toggleContext('test-1')
    expect(getState().attachments[0].isIncludedInContext).toBe(true)

    getState().toggleContext('test-1')
    expect(getState().attachments[0].isIncludedInContext).toBe(false)
  })

  it('updates attachment fields', () => {
    const { getState } = useAttachmentStore
    const file = makeAttachment()
    getState().addAttachments([file])
    getState().updateAttachment('test-1', { status: 'warning', statusMessage: 'Test warning' })
    expect(getState().attachments[0].status).toBe('warning')
    expect(getState().attachments[0].statusMessage).toBe('Test warning')
  })

  it('clears all attachments', () => {
    const { getState } = useAttachmentStore
    getState().addAttachments([makeAttachment(), makeAttachment({ id: '2', path: '/tmp/b.txt' })])
    expect(getState().attachments).toHaveLength(2)
    getState().clearAll()
    expect(getState().attachments).toHaveLength(0)
  })

  it('getContextFiles filters correctly', () => {
    const { getState } = useAttachmentStore
    const included = makeAttachment({ id: '1', path: '/tmp/a.txt', isIncludedInContext: true })
    const excluded = makeAttachment({ id: '2', path: '/tmp/b.txt', isIncludedInContext: false })
    const blocked = makeAttachment({ id: '3', path: '/tmp/.env', status: 'blocked', isIncludedInContext: true })
    getState().addAttachments([included, excluded, blocked])
    const ctx = getState().getContextFiles()
    expect(ctx).toHaveLength(1)
    expect(ctx[0].id).toBe('1')
  })

  it('getContextSummary returns empty for no context files', () => {
    const { getState } = useAttachmentStore
    getState().addAttachments([makeAttachment()])
    expect(getState().getContextSummary()).toBe('')
  })

  it('getContextSummary includes file names and content', () => {
    const { getState } = useAttachmentStore
    const file = makeAttachment({
      id: '1',
      name: 'a.txt',
      path: '/tmp/a.txt',
      isIncludedInContext: true,
      content: 'Hello world',
      sizeLabel: '12 B',
    })
    getState().addAttachments([file])
    const summary = getState().getContextSummary()
    expect(summary).toContain('Attached files')
    expect(summary).toContain('a.txt')
    expect(summary).toContain('12 B')
    expect(summary).toContain('Hello world')
  })

  it('getContextSummary truncates long content', () => {
    const { getState } = useAttachmentStore
    const longContent = 'x'.repeat(600)
    const file = makeAttachment({
      id: '1',
      path: '/tmp/long.txt',
      isIncludedInContext: true,
      content: longContent,
      sizeLabel: '600 B',
    })
    getState().addAttachments([file])
    const summary = getState().getContextSummary()
    expect(summary).toContain('...')
    expect(summary.length).toBeLessThan(longContent.length + 100)
  })

  // Reset store state after tests
  afterEach(() => {
    useAttachmentStore.getState().clearAll()
  })
})
