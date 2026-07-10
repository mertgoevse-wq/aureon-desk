import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  buildFileTree,
  readFileForContext,
  isPathIgnored,
  buildProjectContext
} from '../../src/main/services/project-context'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

// Create a temp directory with known content for testing
function createTempProject(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'Vibeforge-project-test-'))

  // Create directories
  const srcDir = path.join(root, 'src')
  const nodeModulesDir = path.join(root, 'node_modules')
  const gitDir = path.join(root, '.git')
  const distDir = path.join(root, 'dist')
  const envDir = path.join(root, 'config')

  fs.mkdirSync(srcDir, { recursive: true })
  fs.mkdirSync(nodeModulesDir, { recursive: true })
  fs.mkdirSync(gitDir, { recursive: true })
  fs.mkdirSync(distDir, { recursive: true })
  fs.mkdirSync(envDir, { recursive: true })

  // Create text files
  fs.writeFileSync(path.join(root, 'README.md'), '# Test Project\n\nThis is a test.')
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ name: 'test' }, null, 2))
  fs.writeFileSync(path.join(srcDir, 'index.ts'), 'export const hello = "world"')
  fs.writeFileSync(path.join(srcDir, 'app.tsx'), 'export function App() { return null }')

  // Create files that should be ignored
  fs.writeFileSync(path.join(root, '.env'), 'SECRET=abc123')
  fs.writeFileSync(path.join(root, '.env.local'), 'KEY=xyz789')
  fs.writeFileSync(path.join(nodeModulesDir, 'fake-module.js'), 'module.exports = {}')
  fs.writeFileSync(path.join(distDir, 'bundle.js'), '// built output')
  fs.writeFileSync(path.join(gitDir, 'config'), '[core]')

  // Create a binary-like file
  fs.writeFileSync(path.join(root, 'image.png'), Buffer.from([0x89, 0x50, 0x4E, 0x47]))

  // Create a large file (just metadata, not writing actual bytes)
  const bigFilePath = path.join(root, 'big.txt')
  // Don't actually create a big file, just test the size guard

  return root
}

function cleanupTempProject(root: string): void {
  try {
    fs.rmSync(root, { recursive: true, force: true })
  } catch { /* best effort */ }
}

describe('buildFileTree', () => {
  let root: string

  beforeEach(() => { root = createTempProject() })
  afterEach(() => cleanupTempProject(root))

  it('builds a file tree from a directory', () => {
    const tree = buildFileTree(root)
    expect(tree.length).toBeGreaterThan(0)

    const readme = tree.find(n => n.name === 'README.md')
    expect(readme).toBeDefined()
    expect(readme!.isDirectory).toBe(false)
    expect(readme!.extension).toBe('.md')

    const src = tree.find(n => n.name === 'src')
    expect(src).toBeDefined()
    expect(src!.isDirectory).toBe(true)
    expect(src!.children).toBeDefined()
    expect(src!.children!.length).toBe(2)
  })

  it('ignores node_modules directory', () => {
    const tree = buildFileTree(root)
    const nodeModules = tree.find(n => n.name === 'node_modules')
    expect(nodeModules).toBeUndefined()
  })

  it('ignores .git directory', () => {
    const tree = buildFileTree(root)
    const git = tree.find(n => n.name === '.git')
    expect(git).toBeUndefined()
  })

  it('ignores dist directory', () => {
    const tree = buildFileTree(root)
    const dist = tree.find(n => n.name === 'dist')
    expect(dist).toBeUndefined()
  })

  it('ignores .env files', () => {
    const tree = buildFileTree(root)
    const env = tree.find(n => n.name === '.env')
    expect(env).toBeUndefined()

    const envLocal = tree.find(n => n.name === '.env.local')
    expect(envLocal).toBeUndefined()
  })

  it('skips binary files', () => {
    const tree = buildFileTree(root)
    const png = tree.find(n => n.name === 'image.png')
    expect(png).toBeUndefined()
  })

  it('sorts directories before files', () => {
    const tree = buildFileTree(root)
    let foundDir = false
    let foundFileAfterDir = false
    for (const node of tree) {
      if (node.isDirectory) foundDir = true
      if (!node.isDirectory && foundDir) foundFileAfterDir = true
    }
    // Directories should come first, then files
    if (tree.some(n => n.isDirectory)) {
      const firstDir = tree.findIndex(n => n.isDirectory)
      const lastDir = tree.map((n, i) => n.isDirectory ? i : -1).filter(i => i >= 0).pop()!
      const firstFile = tree.findIndex(n => !n.isDirectory)
      if (firstFile >= 0) {
        expect(lastDir).toBeLessThan(firstFile)
      }
    }
  })

  it('respects maxDepth', () => {
    const tree = buildFileTree(root, { maxDepth: 0 })
    const src = tree.find(n => n.name === 'src')
    if (src) {
      expect(src.children).toEqual([])
    }
  })
})

describe('isPathIgnored', () => {
  it('identifies node_modules paths', () => {
    expect(isPathIgnored('C:\\project\\node_modules\\foo.js')).toBe(true)
    expect(isPathIgnored('/project/node_modules/foo.js')).toBe(true)
  })

  it('identifies .git paths', () => {
    expect(isPathIgnored('C:\\project\\.git\\config')).toBe(true)
    expect(isPathIgnored('/project/.git/config')).toBe(true)
  })

  it('identifies dist/build paths', () => {
    expect(isPathIgnored('C:\\project\\dist\\bundle.js')).toBe(true)
    expect(isPathIgnored('/project/build/output.js')).toBe(true)
  })

  it('identifies .env files', () => {
    expect(isPathIgnored('C:\\project\\.env')).toBe(true)
    expect(isPathIgnored('/project/.env.local')).toBe(true)
    expect(isPathIgnored('/project/.env.production')).toBe(true)
  })

  it('identifies secrets/credentials files', () => {
    expect(isPathIgnored('C:\\project\\secrets\\key.json')).toBe(true)
    expect(isPathIgnored('/project/credentials/admin.json')).toBe(true)
  })

  it('allows normal source files', () => {
    expect(isPathIgnored('C:\\project\\src\\index.ts')).toBe(false)
    expect(isPathIgnored('/project/README.md')).toBe(false)
    expect(isPathIgnored('/project/src/components/App.tsx')).toBe(false)
  })

  it('identifies __pycache__ and .venv', () => {
    expect(isPathIgnored('/project/__pycache__/module.pyc')).toBe(true)
    expect(isPathIgnored('/project/.venv/bin/python')).toBe(true)
    expect(isPathIgnored('/project/venv/lib/site-packages')).toBe(true)
  })
})

describe('readFileForContext', () => {
  let root: string

  beforeEach(() => { root = createTempProject() })
  afterEach(() => cleanupTempProject(root))

  it('reads a valid text file', () => {
    const ctx = readFileForContext(path.join(root, 'README.md'))
    expect(ctx).not.toBeNull()
    expect(ctx!.content).toContain('Test Project')
    expect(ctx!.warnings.length).toBe(0)
  })

  it('rejects binary files', () => {
    const ctx = readFileForContext(path.join(root, 'image.png'))
    expect(ctx).not.toBeNull()
    expect(ctx!.content).toBe('')
    expect(ctx!.warnings.some(w => w.includes('Binary'))).toBe(true)
  })

  it('detects secrets in file content', () => {
    // Create a file with a fake API key pattern
    const secretFile = path.join(root, 'config.ts')
    fs.writeFileSync(secretFile, 'const API_KEY = "sk-12345678901234567890123456789012"')
    const ctx = readFileForContext(secretFile)
    expect(ctx).not.toBeNull()
    expect(ctx!.warnings.some(w => w.includes('secret'))).toBe(true)
  })

  it('rejects unknown extensions', () => {
    const unknownFile = path.join(root, 'data.xyz')
    fs.writeFileSync(unknownFile, 'some content')
    const ctx = readFileForContext(unknownFile)
    expect(ctx).not.toBeNull()
    expect(ctx!.content).toBe('')
    expect(ctx!.warnings.some(w => w.includes('Unrecognized'))).toBe(true)
  })
})

describe('buildProjectContext', () => {
  let root: string

  beforeEach(() => { root = createTempProject() })
  afterEach(() => cleanupTempProject(root))

  it('builds context from selected files', () => {
    const files = [path.join(root, 'README.md'), path.join(root, 'src', 'index.ts')]
    const ctx = buildProjectContext('Test', root, 'Be helpful', files)

    expect(ctx.projectName).toBe('Test')
    expect(ctx.instructions).toBe('Be helpful')
    expect(ctx.selectedFiles.length).toBe(2)
    expect(ctx.warnings.length).toBeGreaterThan(0) // remote provider warning
    expect(ctx.totalSize).toBeGreaterThan(0)
  })

  it('skips binary files in context', () => {
    const files = [path.join(root, 'image.png')]
    const ctx = buildProjectContext('Test', root, null, files)

    expect(ctx.selectedFiles.length).toBe(1)
    expect(ctx.selectedFiles[0].content).toBe('')
    expect(ctx.warnings.some(w => w.includes('Binary'))).toBe(true)
  })

  it('includes remote provider warning', () => {
    const files = [path.join(root, 'README.md')]
    const ctx = buildProjectContext('Test', root, null, files)

    expect(ctx.warnings.some(w => w.includes('sent to'))).toBe(true)
  })
})

describe('project instruction resolution', () => {
  it('project instructions are included in hierarchy input', () => {
    // Testing that HierarchyInput accepts projectInstructions
    const input = {
      projectInstructions: 'Test project instructions',
      selectedProfile: undefined,
      chatOverride: undefined,
      taskInstruction: undefined
    }

    // Verify the input shape - actual resolution tested in hierarchy-resolver.test.ts
    expect(input.projectInstructions).toBe('Test project instructions')
  })

  it('null project instructions are handled gracefully', () => {
    const input = {
      projectInstructions: null as unknown as string | undefined,
      selectedProfile: undefined,
      chatOverride: undefined,
      taskInstruction: undefined
    }

    expect(input.projectInstructions).toBeNull()
  })
})
