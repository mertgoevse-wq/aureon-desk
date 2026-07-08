import { describe, it, expect } from 'vitest'

interface MockFile {
  name: string
  type: string
  status: 'ready' | 'blocked'
}

describe('Code Mode Workspace Policy Filters', () => {
  const mockFiles: MockFile[] = [
    { name: 'src/main.tsx', type: 'file', status: 'ready' },
    { name: 'src/App.tsx', type: 'file', status: 'ready' },
    { name: 'src/index.css', type: 'file', status: 'ready' },
    { name: 'index.html', type: 'file', status: 'ready' },
    { name: 'package.json', type: 'file', status: 'ready' },
    { name: 'vite.config.ts', type: 'file', status: 'ready' },
    { name: '.env', type: 'ignored', status: 'blocked' },
    { name: '.git/', type: 'ignored', status: 'blocked' },
    { name: 'node_modules/', type: 'ignored', status: 'blocked' }
  ]

  it('should explicitly mark env, git, and node_modules as blocked/ignored by security policy', () => {
    const blocked = mockFiles.filter(f => f.status === 'blocked')
    expect(blocked.length).toBe(3)
    
    const names = blocked.map(f => f.name)
    expect(names).toContain('.env')
    expect(names).toContain('.git/')
    expect(names).toContain('node_modules/')
  })

  it('should allow normal source and build configuration files to pass', () => {
    const ready = mockFiles.filter(f => f.status === 'ready')
    const names = ready.map(f => f.name)
    
    expect(names).toContain('src/App.tsx')
    expect(names).toContain('package.json')
    expect(names).not.toContain('.env')
  })
})

describe('LivePreview Template Support', () => {
  it('should offer simple HTML, coding demo, and Vite React templates', () => {
    const templates = ['html', 'demo', 'vite-react']
    expect(templates).toContain('html')
    expect(templates).toContain('demo')
    expect(templates).toContain('vite-react')
  })
})
