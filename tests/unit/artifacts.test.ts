/**
 * Artifact Renderer System — Unit Tests
 *
 * Covers: artifact creation helpers, parseArtifactsFromContent, artifact type integrity.
 */

import { describe, it, expect } from 'vitest'
import {
  codeArtifactFromFileOp,
  promptArtifactFromTemplate,
  diffArtifactFromDiff,
  buildPlanArtifact,
  parseArtifactsFromContent,
  createArtifactId,
} from '../../src/shared/artifacts'
import type {
  CodeArtifact,
  PromptArtifact,
  DiffArtifact,
  BuildPlanArtifact,
} from '../../src/shared/artifacts'

// ---- Creation Helpers ----

describe('codeArtifactFromFileOp', () => {
  it('creates a CodeArtifact from a file operation', () => {
    const op = {
      id: 'op-1',
      path: 'src/index.html',
      language: 'html',
      afterContent: '<div>Hello World</div>',
      type: 'create_file',
    }

    const artifact = codeArtifactFromFileOp(op)

    expect(artifact.type).toBe('code')
    expect(artifact.title).toBe('index.html')
    expect(artifact.subtitle).toBe('src/index.html')
    expect(artifact.filename).toBe('src/index.html')
    expect(artifact.language).toBe('html')
    expect(artifact.code).toBe('<div>Hello World</div>')
    expect(artifact.generated).toBe(true)
    expect(artifact.actions).toHaveLength(2)
    expect(artifact.actions!.find(a => a.id === 'copy')).toBeDefined()
  })

  it('generates a unique artifact ID', () => {
    const op = { id: 'op1', path: 'a.ts', language: 'typescript', afterContent: '', type: 'create_file' }
    const a1 = codeArtifactFromFileOp(op)
    const a2 = codeArtifactFromFileOp({ ...op, id: 'op2' })
    expect(a1.id).not.toBe(a2.id)
  })
})

describe('promptArtifactFromTemplate', () => {
  it('creates a PromptArtifact from a vibe template', () => {
    const template = {
      id: 'tpl-1',
      label: 'Build a counter',
      prompt: 'Create a React counter component with increment/decrement.',
      category: 'web',
    }

    const artifact = promptArtifactFromTemplate(template)

    expect(artifact.type).toBe('prompt')
    expect(artifact.title).toBe('Build a counter')
    expect(artifact.subtitle).toBe('Category: web')
    expect(artifact.prompt).toContain('React counter')
    expect(artifact.templateId).toBe('tpl-1')
    expect(artifact.actions).toHaveLength(2)
    expect(artifact.actions!.find(a => a.id === 'copy')).toBeDefined()
    expect(artifact.actions!.find(a => a.id === 'send')).toBeDefined()
  })
})

describe('diffArtifactFromDiff', () => {
  it('creates a DiffArtifact from diff lines', () => {
    const lines = [
      { type: 'context' as const, content: 'const x = 1;' },
      { type: 'remove' as const, content: 'console.log(x);' },
      { type: 'add' as const, content: 'console.log("value:", x);' },
    ]

    const artifact = diffArtifactFromDiff('src/app.ts', 'typescript', lines)

    expect(artifact.type).toBe('diff')
    expect(artifact.title).toBe('app.ts')
    expect(artifact.filePath).toBe('src/app.ts')
    expect(artifact.language).toBe('typescript')
    expect(artifact.lines).toHaveLength(3)
    expect(artifact.lines[1].type).toBe('remove')
    expect(artifact.lines[2].type).toBe('add')
  })
})

describe('buildPlanArtifact', () => {
  it('creates a BuildPlanArtifact', () => {
    const prompt = 'Build a todo app'
    const steps = ['Create HTML structure', 'Add CSS styling', 'Wire JavaScript']

    const artifact = buildPlanArtifact(prompt, steps)

    expect(artifact.type).toBe('build-plan')
    expect(artifact.prompt).toBe('Build a todo app')
    expect(artifact.steps).toHaveLength(3)
    expect(artifact.subtitle).toBe('3 steps')
    expect(artifact.actions).toHaveLength(1)
  })
})

// ---- Content Parsing ----

describe('parseArtifactsFromContent', () => {
  it('extracts a single fenced code block', () => {
    const content = 'Here is a code example:\n\n```typescript\nconst x = 1;\n```\n\nEnd of message.'

    const { artifacts, cleanedContent } = parseArtifactsFromContent(content)

    expect(artifacts).toHaveLength(1)
    expect(artifacts[0].type).toBe('code')
    expect((artifacts[0] as CodeArtifact).language).toBe('typescript')
    expect((artifacts[0] as CodeArtifact).code).toBe('const x = 1;')
    expect(cleanedContent).toContain('Here is a code example:')
    expect(cleanedContent).toContain('End of message.')
    expect(cleanedContent).not.toContain('```')
  })

  it('extracts multiple code blocks', () => {
    const content = '```js\nconst a = 1;\n```\n\n```python\nprint("hello")\n```'

    const { artifacts, cleanedContent } = parseArtifactsFromContent(content)

    expect(artifacts).toHaveLength(2)
    expect((artifacts[0] as CodeArtifact).language).toBe('js')
    expect((artifacts[1] as CodeArtifact).language).toBe('python')
    expect(cleanedContent.trim()).toBe('')
  })

  it('parses filename from comment hint (# filename)', () => {
    const content = '```typescript # src/app.ts\nconsole.log("ok");\n```'

    const { artifacts } = parseArtifactsFromContent(content)

    expect(artifacts).toHaveLength(1)
    expect((artifacts[0] as CodeArtifact).filename).toBe('src/app.ts')
  })

  it('handles Windows CRLF line endings', () => {
    const content = '```json\r\n{"key": "value"}\r\n```'

    const { artifacts } = parseArtifactsFromContent(content)

    expect(artifacts).toHaveLength(1)
    expect((artifacts[0] as CodeArtifact).code).toBe('{"key": "value"}')
  })

  it('returns empty artifacts for plain text', () => {
    const content = 'Just a plain message with no code blocks.'

    const { artifacts, cleanedContent } = parseArtifactsFromContent(content)

    expect(artifacts).toHaveLength(0)
    expect(cleanedContent).toBe('Just a plain message with no code blocks.')
  })

  it('normalizes excessive blank lines after removing code blocks', () => {
    const content = 'Before.\n\n\n\n```js\nconst x = 1;\n```\n\n\n\nAfter.'

    const { cleanedContent } = parseArtifactsFromContent(content)

    expect(cleanedContent).toContain('Before.')
    expect(cleanedContent).toContain('After.')
    // Should not have triple+ newlines
    expect(cleanedContent).not.toMatch(/\n{3,}/)
  })

  it('defaults to "text" language when no language specified', () => {
    const content = '```\nplain text snippet\n```'

    const { artifacts } = parseArtifactsFromContent(content)

    expect(artifacts).toHaveLength(1)
    expect((artifacts[0] as CodeArtifact).language).toBe('text')
  })

  it('sets title correctly based on snippet info', () => {
    const content = '```python # utils/helpers.py\ndef helper():\n    pass\n```'

    const { artifacts } = parseArtifactsFromContent(content)

    expect(artifacts).toHaveLength(1)
    expect(artifacts[0].title).toBe('utils/helpers.py')
    expect(artifacts[0].subtitle).toBe('python · utils/helpers.py')
  })

  it('sets title to language snippet when no filename', () => {
    const content = '```css\nbody { color: red; }\n```'

    const { artifacts } = parseArtifactsFromContent(content)

    expect(artifacts).toHaveLength(1)
    expect(artifacts[0].title).toBe('css snippet')
  })
})

// ---- Artifact Type Integrity ----

describe('artifact type integrity', () => {
  it('createArtifactId returns unique string IDs', () => {
    const ids = new Set<string>()
    for (let i = 0; i < 100; i++) {
      ids.add(createArtifactId())
    }
    expect(ids.size).toBe(100)
  })

  it('code artifacts include copy and expand actions', () => {
    const op = { id: 'op-x', path: 'file.txt', language: 'text', afterContent: 'abc', type: 'create_file' }
    const artifact = codeArtifactFromFileOp(op)

    const copyAction = artifact.actions!.find(a => a.id === 'copy')
    const expandAction = artifact.actions!.find(a => a.id === 'expand')

    expect(copyAction).toBeDefined()
    expect(copyAction!.label).toBe('Copy code')
    expect(expandAction).toBeDefined()
    expect(expandAction!.label).toBe('Expand')
  })

  it('prompt artifacts include copy and send actions', () => {
    const tpl = { id: 't', label: 'Test', prompt: 'Test prompt', category: 'test' }
    const artifact = promptArtifactFromTemplate(tpl)

    expect(artifact.actions!.find(a => a.id === 'copy')).toBeDefined()
    expect(artifact.actions!.find(a => a.id === 'send')).toBeDefined()
  })

  it('diff artifacts include copy action', () => {
    const artifact = diffArtifactFromDiff('f.txt', 'text', [{ type: 'add', content: 'new' }])

    expect(artifact.actions!).toHaveLength(1)
    expect(artifact.actions![0].id).toBe('copy')
  })

  it('build plan subtitle reflects step count', () => {
    const artifact = buildPlanArtifact('p', ['a', 'b', 'c', 'd'])
    expect(artifact.subtitle).toBe('4 steps')
  })
})
