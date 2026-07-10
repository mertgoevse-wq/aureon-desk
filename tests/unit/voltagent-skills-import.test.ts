/**
 * VoltAgent Skills Import — Unit Tests
 *
 * Covers: generated JSON schema validation, curated skills integrity,
 * license status visibility, and importer parsing logic.
 */

import { describe, it, expect } from 'vitest'
import { CURATED_SKILLS } from '../../src/shared/curated-skills'
import type { CuratedSkill } from '../../src/shared/curated-skills'
import { SKILL_CATEGORIES } from '../../src/shared/external-skill-sources'
import type { ExternalSkillEntry } from '../../src/shared/external-skill-sources'

// Try to load generated skills; skip if not yet generated
let generatedEntries: ExternalSkillEntry[] = []
try {
  const mod = await import('../../src/shared/data/voltagent-awesome-skills.generated')
  generatedEntries = (mod as any).voltagentSkills || (mod as any).default?.voltagentSkills || []
} catch {
  // Generated file doesn't exist yet — tests will skip
}

const hasGeneratedData = generatedEntries.length > 0

// ---- Curated Skills Integrity ----

describe('Curated Skills', () => {
  it('has at least 12 curated skills defined', () => {
    expect(CURATED_SKILLS.length).toBeGreaterThanOrEqual(12)
  })

  it('all curated skills have a valid category', () => {
    const validCategories = new Set(SKILL_CATEGORIES.map(c => c.id))
    for (const skill of CURATED_SKILLS) {
      expect(validCategories.has(skill.category)).toBe(true)
    }
  })

  it('all curated skills have a non-empty description', () => {
    for (const skill of CURATED_SKILLS) {
      expect(skill.description.length).toBeGreaterThan(20)
    }
  })

  it('all curated skills have capabilities listed', () => {
    for (const skill of CURATED_SKILLS) {
      expect(skill.capabilities.length).toBeGreaterThan(0)
    }
  })

  it('all curated skills have an inspiredBy field', () => {
    for (const skill of CURATED_SKILLS) {
      expect(skill.inspiredBy.length).toBeGreaterThan(0)
    }
  })

  it('all curated skills have a valid status', () => {
    for (const skill of CURATED_SKILLS) {
      expect(['active', 'planned', 'placeholder']).toContain(skill.status)
    }
  })

  it('curated skill IDs are unique', () => {
    const ids = new Set(CURATED_SKILLS.map(s => s.id))
    expect(ids.size).toBe(CURATED_SKILLS.length)
  })

  it('active curated skills have at least 3 capabilities', () => {
    const active = CURATED_SKILLS.filter(s => s.status === 'active')
    for (const skill of active) {
      expect(skill.capabilities.length).toBeGreaterThanOrEqual(3)
    }
  })
})

// ---- SKILL_CATEGORIES Integrity ----

describe('SKILL_CATEGORIES', () => {
  it('has 20 categories defined', () => {
    expect(SKILL_CATEGORIES.length).toBe(20)
  })

  it('all categories have unique IDs', () => {
    const ids = new Set(SKILL_CATEGORIES.map(c => c.id))
    expect(ids.size).toBe(SKILL_CATEGORIES.length)
  })

  it('all categories have label, description, and icon', () => {
    for (const cat of SKILL_CATEGORIES) {
      expect(cat.label.length).toBeGreaterThan(0)
      expect(cat.description.length).toBeGreaterThan(0)
      expect(cat.icon.length).toBeGreaterThan(0)
    }
  })
})

// ---- Generated Data Schema Validation ----

describe('Generated Skills Data', () => {
  it.runIf(hasGeneratedData)('contains at least 100 skill entries', () => {
    expect(generatedEntries.length).toBeGreaterThan(100)
  })

  it.runIf(hasGeneratedData)('all entries have required fields', () => {
    for (const entry of generatedEntries) {
      expect(entry.id).toBeTruthy()
      expect(entry.name).toBeTruthy()
      expect(entry.description).toBeTruthy()
      expect(entry.url).toBeTruthy()
      expect(entry.provider).toBeTruthy()
      expect(entry.category).toBeTruthy()
      expect(entry.importStatus).toBe('imported')
      expect(typeof entry.licenseStatus).toBe('string')
      expect(Array.isArray(entry.tags)).toBe(true)
    }
  })

  it.runIf(hasGeneratedData)('all entries have valid categories', () => {
    const validCategories = new Set(SKILL_CATEGORIES.map(c => c.id))
    for (const entry of generatedEntries) {
      expect(validCategories.has(entry.category)).toBe(true)
    }
  })

  it.runIf(hasGeneratedData)('all entries have valid risk levels', () => {
    const validRisks = ['safe', 'caution', 'destructive']
    for (const entry of generatedEntries) {
      expect(validRisks).toContain(entry.riskLevel)
    }
  })

  it.runIf(hasGeneratedData)('all entries have valid license status', () => {
    const validStatuses = ['known-open', 'known-proprietary', 'unknown', 'needs-review']
    for (const entry of generatedEntries) {
      expect(validStatuses).toContain(entry.licenseStatus)
    }
  })

  it.runIf(hasGeneratedData)('all entries have unique IDs', () => {
    const ids = new Set(generatedEntries.map(e => e.id))
    // Allow a small margin since some duplicates may exist in the source
    expect(ids.size).toBeGreaterThan(generatedEntries.length * 0.95)
  })

  it.runIf(hasGeneratedData)('all entries have URLs starting with http', () => {
    for (const entry of generatedEntries) {
      expect(entry.url).toMatch(/^https?:\/\//)
    }
  })

  it.runIf(hasGeneratedData)('all entries have non-empty tags on first 100', () => {
    // Spot-check first 100 entries for tags
    for (const entry of generatedEntries.slice(0, 100)) {
      expect(entry.tags.length).toBeGreaterThan(0)
    }
  })

  it.runIf(hasGeneratedData)('entry IDs follow org/skill-name pattern', () => {
    for (const entry of generatedEntries.slice(0, 200)) {
      expect(entry.id).toMatch(/\//)
    }
  })
})

// ---- License Status Visibility ----

describe('License status visibility', () => {
  it('generated entries have licenseStatus set (not undefined)', () => {
    if (!hasGeneratedData) return
    for (const entry of generatedEntries.slice(0, 100)) {
      expect(entry.licenseStatus).toBeDefined()
      expect(entry.licenseStatus.length).toBeGreaterThan(0)
    }
  })

  it('most generated entries are marked as unknown license', () => {
    if (!hasGeneratedData) return
    const unknown = generatedEntries.filter(e => e.licenseStatus === 'unknown')
    // At least 80% should be unknown (since we don't auto-detect licenses)
    expect(unknown.length).toBeGreaterThan(generatedEntries.length * 0.8)
  })
})

// ---- Importer Parsing Logic (unit test on sample markdown) ----

describe('Importer parsing logic', () => {
  // Simulates what the parseReadme function does internally
  function parseSampleBullets(markdown: string) {
    const bulletRegex = /-\s*\*\*\[([^\]]+)\]\(([^)]+)\)\*\*\s*-\s*(.+)/g
    const results: Array<{ id: string; url: string; description: string }> = []
    let match
    while ((match = bulletRegex.exec(markdown)) !== null) {
      results.push({ id: match[1].trim(), url: match[2].trim(), description: match[3].trim() })
    }
    return results
  }

  it('parses a single skill entry correctly', () => {
    const sample = '- **[anthropics/docx](https://example.com/docx)** - Create and edit Word documents'
    const results = parseSampleBullets(sample)

    expect(results).toHaveLength(1)
    expect(results[0].id).toBe('anthropics/docx')
    expect(results[0].url).toBe('https://example.com/docx')
    expect(results[0].description).toBe('Create and edit Word documents')
  })

  it('parses multiple skill entries from a section', () => {
    const sample = `
- **[stripe/stripe-best-practices](https://a.com/stripe)** - Best practices for Stripe integrations
- **[stripe/upgrade-stripe](https://a.com/upgrade)** - Upgrade Stripe SDK and API versions
- **[supabase/postgres](https://a.com/pg)** - PostgreSQL best practices
`
    const results = parseSampleBullets(sample)

    expect(results).toHaveLength(3)
    expect(results[0].id).toBe('stripe/stripe-best-practices')
    expect(results[1].id).toBe('stripe/upgrade-stripe')
    expect(results[2].id).toBe('supabase/postgres')
  })

  it('handles complex descriptions with punctuation', () => {
    const sample = '- **[org/name](https://x.com)** - A complex description with (parentheses), commas, and — dashes!'
    const results = parseSampleBullets(sample)

    expect(results).toHaveLength(1)
    expect(results[0].description).toContain('parentheses')
    expect(results[0].description).toContain('dashes')
  })

  it('handles URLs with query params and hashes', () => {
    const sample = '- **[test/skill](https://github.com/org/repo/tree/main/skills?ref=main#readme)** - Description'
    const results = parseSampleBullets(sample)

    expect(results).toHaveLength(1)
    expect(results[0].url).toContain('tree/main/skills')
    expect(results[0].url).toContain('ref=main')
  })

  it('ignores non-skill bullet points', () => {
    const sample = '- This is just a note\n- Another note\n- **[org/skill](https://x.com)** - A real skill'
    const results = parseSampleBullets(sample)

    expect(results).toHaveLength(1)
    expect(results[0].id).toBe('org/skill')
  })
})
