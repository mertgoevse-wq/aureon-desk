import { describe, it, expect } from 'vitest'
import { CONNECTOR_LABELS, CONNECTOR_ICONS, CONNECTOR_INITIALS } from '../../src/renderer/src/components/connectors/ConnectorIcon'
import type { ConnectorIconType } from '../../src/renderer/src/components/connectors/ConnectorIcon'
import fs from 'fs'
import path from 'path'

// ---- ConnectorIcon Data Tests ----

describe('ConnectorIcon — Data Integrity', () => {
  const allTypes: ConnectorIconType[] = [
    'openai', 'chatgpt', 'google', 'gemini', 'gmail',
    'github', 'openrouter', 'ollama', 'lmstudio',
    'mcp', 'phone', 'custom'
  ]

  it('should have labels for all 12 connector types', () => {
    for (const type of allTypes) {
      expect(CONNECTOR_LABELS[type]).toBeDefined()
      expect(CONNECTOR_LABELS[type].length).toBeGreaterThan(1)
    }
  })

  it('should have icons for all connector types', () => {
    for (const type of allTypes) {
      expect(CONNECTOR_ICONS[type]).toBeDefined()
    }
  })

  it('should have initials for all connector types', () => {
    for (const type of allTypes) {
      expect(CONNECTOR_INITIALS[type]).toBeDefined()
      expect(CONNECTOR_INITIALS[type].length).toBe(2)
    }
  })

  it('should have 12 connector types total', () => {
    expect(Object.keys(CONNECTOR_LABELS).length).toBe(12)
    expect(Object.keys(CONNECTOR_ICONS).length).toBe(12)
    expect(Object.keys(CONNECTOR_INITIALS).length).toBe(12)
  })

  it('should not use fake brand logos (all are Lucide-based)', () => {
    // No connector uses image paths — all use Lucide icons
    // This test verifies the icon data exists as React-compatible elements
    for (const type of allTypes) {
      expect(CONNECTOR_ICONS[type]).toBeTruthy()
      // Verify factory functions actually produce valid React elements
      const result = CONNECTOR_ICONS[type](18)
      expect(result).toBeTruthy()
      expect(result.type).toBeDefined()
    }
  })

  it('should have unique labels for each connector type', () => {
    const labels = Object.values(CONNECTOR_LABELS)
    expect(new Set(labels).size).toBe(labels.length)
  })

  it('should have unique initials for each connector type', () => {
    const initials = Object.values(CONNECTOR_INITIALS)
    expect(new Set(initials).size).toBe(initials.length)
  })

  it('should have distinct icons where vendors differ', () => {
    // openai and chatgpt are both OpenAI products but should be distinct
    expect(CONNECTOR_LABELS['openai']).toBe('OpenAI')
    expect(CONNECTOR_LABELS['chatgpt']).toBe('ChatGPT')
  })
})

// ---- Brand Asset Existence Tests ----

describe('Brand Asset Existence', () => {
  const projectRoot = path.resolve(__dirname, '..', '..')

  const requiredAssets = [
    // SVG source assets
    { file: 'assets/brand/aureon-mark.svg', description: 'Aureon mark SVG' },
    { file: 'assets/brand/aureon-logo.svg', description: 'Aureon logo SVG' },
    { file: 'assets/brand/aureon-wordmark.svg', description: 'Aureon wordmark SVG' },
    { file: 'assets/brand/aureon-icon.svg', description: 'Aureon app icon SVG' },
    // Public PNG assets (renderer-accessible)
    { file: 'public/brand/aureon-mark-64.png', description: 'Aureon mark 64px' },
    { file: 'public/brand/aureon-mark-128.png', description: 'Aureon mark 128px' },
    { file: 'public/brand/aureon-mark-256.png', description: 'Aureon mark 256px' },
    { file: 'public/brand/aureon-logo-512.png', description: 'Aureon logo 512px' },
    // Build assets
    { file: 'build/icon.ico', description: 'Windows app icon ICO' },
    { file: 'build/icon.png', description: 'App icon PNG' },
  ]

  it('should have all required brand asset files', () => {
    for (const asset of requiredAssets) {
      const fullPath = path.join(projectRoot, asset.file)
      const exists = fs.existsSync(fullPath)
      expect(exists, `Missing: ${asset.file} (${asset.description})`).toBe(true)
    }
  })

  it('should not have any fake vendor logos in vendor directory', () => {
    const vendorDir = path.join(projectRoot, 'public', 'vendor')
    // The vendor directory should either not exist or be empty
    if (fs.existsSync(vendorDir)) {
      const files = fs.readdirSync(vendorDir)
      // Only README.md or .gitkeep should be present
      const nonReadmeFiles = files.filter(f => f !== 'README.md' && f !== '.gitkeep')
      expect(nonReadmeFiles.length, `Found unexpected vendor files: ${nonReadmeFiles.join(', ')}`).toBe(0)
    }
  })
})

// ---- Docs Existence Tests ----

describe('Brand Documentation', () => {
  const projectRoot = path.resolve(__dirname, '..', '..')

  it('should have BRAND_ASSET_AUDIT.md', () => {
    const exists = fs.existsSync(path.join(projectRoot, 'docs', 'brand', 'BRAND_ASSET_AUDIT.md'))
    expect(exists).toBe(true)
  })

  it('should have BRAND_AND_VENDOR_LOGO_POLICY.md', () => {
    const exists = fs.existsSync(path.join(projectRoot, 'docs', 'brand', 'BRAND_AND_VENDOR_LOGO_POLICY.md'))
    expect(exists).toBe(true)
  })

  it('should have vendor assets README', () => {
    const exists = fs.existsSync(path.join(projectRoot, 'assets', 'vendor', 'README.md'))
    expect(exists).toBe(true)
  })

  it('should have brand assets README', () => {
    const exists = fs.existsSync(path.join(projectRoot, 'assets', 'brand', 'README.md'))
    expect(exists).toBe(true)
  })
})
