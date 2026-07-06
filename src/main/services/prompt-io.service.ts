import { v4 as uuid } from 'uuid'
import type { PromptRow, PromptExport, ParsedPromptImport } from '../../shared/types/prompt'
import { logger } from '../utils/logger'

/**
 * Service for importing and exporting the prompt library.
 * Supports JSON (native), Markdown, and YAML formats.
 * Never executes imported code — all parsing is safe.
 */

/** Export all prompts as a versioned JSON payload */
export function exportPrompts(prompts: PromptRow[]): PromptExport {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    prompts
  }
}

/** Validate imported JSON payload structure */
export function validateImport(payload: unknown): payload is PromptExport {
  if (!payload || typeof payload !== 'object') return false
  const p = payload as Record<string, unknown>
  if (typeof p.version !== 'number' || !Array.isArray(p.prompts)) return false
  for (const prompt of p.prompts) {
    if (!prompt || typeof prompt !== 'object') return false
    if (typeof (prompt as PromptRow).title !== 'string') return false
    if (typeof (prompt as PromptRow).content !== 'string') return false
  }
  return true
}

/** Sanitize imported prompts — strip secrets, assign new IDs, set safe defaults */
export function sanitizeImported(prompts: Partial<PromptRow>[]): Partial<PromptRow>[] {
  return prompts.map(p => {
    const now = new Date().toISOString()
    return {
      id: uuid(),                         // Always new ID to avoid collisions
      title: (p.title || 'Imported Prompt').slice(0, 200),
      content: stripSecrets(p.content || ''),
      description: (p.description || '').slice(0, 500) || undefined,
      variables: extractVariables(p.content || ''),
      tags: p.tags || null,
      category: p.category || null,
      favorite: 0,
      usage_count: 0,
      source: 'import',
      source_path: null,
      is_template: p.is_template ?? 0,
      created_at: now,
      updated_at: now
    }
  })
}

/**
 * Parse a Markdown string into prompt import items.
 * Expected format — each prompt is a heading with optional YAML frontmatter:
 *
 *   ## Prompt Title
 *   Tags: react, frontend
 *   Category: Code Generation
 *
 *   The prompt content goes here...
 *
 * Or use ```prompt code fences:
 *
 *   ## Another Prompt
 *   ```prompt
 *   Content inside a code fence
 *   ```
 */
export function parseMarkdownPrompts(markdown: string): ParsedPromptImport[] {
  const results: ParsedPromptImport[] = []

  // Split by ## headings (level 2)
  const blocks = markdown.split(/^## /m)
  for (const block of blocks) {
    if (!block.trim()) continue
    const lines = block.split('\n')
    const title = lines[0].trim()
    if (!title) continue

    const bodyLines = lines.slice(1)
    let tags: string[] | undefined
    let category: string | undefined
    let description: string | undefined
    let contentStart = 0

    // Parse optional frontmatter lines (Tag: value, Category: value, Description: value)
    for (let i = 0; i < bodyLines.length && i < 4; i++) {
      const line = bodyLines[i].trim()
      const tagMatch = line.match(/^tags?\s*:\s*(.+)$/i)
      const catMatch = line.match(/^category\s*:\s*(.+)$/i)
      const descMatch = line.match(/^description\s*:\s*(.+)$/i)

      if (tagMatch) { tags = tagMatch[1].split(',').map(t => t.trim()).filter(Boolean); contentStart = i + 1 }
      else if (catMatch) { category = catMatch[1].trim(); contentStart = i + 1 }
      else if (descMatch) { description = descMatch[1].trim(); contentStart = i + 1 }
      else break
    }

    // Extract content — prefer ```prompt code fence, otherwise take remaining lines
    const remaining = bodyLines.slice(contentStart).join('\n').trim()
    const fenceMatch = remaining.match(/```(?:prompt)?\s*\n([\s\S]*?)```/)
    const content = fenceMatch ? fenceMatch[1].trim() : remaining

    if (content) {
      results.push({ title, content, tags, category, description })
    }
  }

  return results
}

/**
 * Parse a YAML string into prompt import items.
 * Expected format:
 *
 *   prompts:
 *     - title: Example
 *       content: |
 *         Multi-line content
 *       tags: [tag1, tag2]
 *       category: Code Generation
 */
export function parseYamlPrompts(yaml: string): ParsedPromptImport[] {
  const results: ParsedPromptImport[] = []

  // Simple line-based YAML parser (no dependency needed for basic format)
  const lines = yaml.split('\n')
  let current: Partial<ParsedPromptImport> | null = null
  let contentLines: string[] = []
  let inContent = false

  for (const line of lines) {
    const trimmed = line.trimEnd()

    // Detect new prompt entry
    const titleMatch = trimmed.match(/^\s*-\s+title\s*:\s*(.+)$/)
    if (titleMatch) {
      // Save previous
      if (current) {
        current.content = contentLines.join('\n').trim()
        if (current.content) results.push(current as ParsedPromptImport)
      }
      current = { title: titleMatch[1].trim().replace(/^["']|["']$/g, ''), content: '' }
      contentLines = []
      inContent = false
      continue
    }

    if (!current) continue

    // Content: field with | or >
    const contentField = trimmed.match(/^\s+content\s*:\s*[|>]\s*$/)
    if (contentField) {
      inContent = true
      continue
    }
    const contentInline = trimmed.match(/^\s+content\s*:\s*(.+)$/)
    if (contentInline && !inContent) {
      current.content = contentInline[1].trim().replace(/^["']|["']$/g, '')
      results.push(current as ParsedPromptImport)
      current = null
      continue
    }

    // Content continuation (indented under content: |)
    if (inContent) {
      const indented = trimmed.match(/^(\s+)(.*)$/)
      if (indented && indented[1].length >= 4) {
        contentLines.push(indented[2])
        continue
      } else {
        // End of content block
        current.content = contentLines.join('\n').trim()
        inContent = false
        contentLines = []
      }
    }

    // Tags
    const tagMatch = trimmed.match(/^\s+tags?\s*:\s*\[(.+)\]$/)
    if (tagMatch) {
      current.tags = tagMatch[1].split(',').map(t => t.trim().replace(/^["']|["']$/g, '')).filter(Boolean)
      continue
    }

    // Category
    const catMatch = trimmed.match(/^\s+category\s*:\s*(.+)$/)
    if (catMatch) {
      current.category = catMatch[1].trim().replace(/^["']|["']$/g, '')
      continue
    }

    // Description
    const descMatch = trimmed.match(/^\s+description\s*:\s*(.+)$/)
    if (descMatch) {
      current.description = descMatch[1].trim().replace(/^["']|["']$/g, '')
      continue
    }
  }

  // Save last prompt
  if (current) {
    current.content = contentLines.join('\n').trim()
    if (current.content) results.push(current as ParsedPromptImport)
  }

  return results
}

/** Detect import format from file extension or content */
export function detectFormat(input: string, extension?: string): 'json' | 'markdown' | 'yaml' {
  if (extension) {
    const ext = extension.toLowerCase().replace('.', '')
    if (ext === 'json') return 'json'
    if (ext === 'md' || ext === 'markdown') return 'markdown'
    if (ext === 'yml' || ext === 'yaml') return 'yaml'
  }
  // Try detecting by content
  const trimmed = input.trim()
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) return 'json'
  if (trimmed.includes('prompts:') && !trimmed.startsWith('#')) return 'yaml'
  return 'markdown' // Default fallback
}

/** Extract {{variable}} names from content */
export function extractVariables(content: string): string | null {
  const matches = content.match(/\{\{(\w+)\}\}/g)
  if (!matches) return null
  const vars = [...new Set(matches.map(m => m.slice(2, -2)))]
  return vars.length > 0 ? JSON.stringify(vars) : null
}

// ---- Helpers ----

function stripSecrets(content: string): string {
  // Replace common secret patterns with [REDACTED]
  return content
    .replace(/sk-[a-zA-Z0-9_-]{20,}/g, '[REDACTED_API_KEY]')
    .replace(/Bearer\s+[a-zA-Z0-9._-]{20,}/gi, 'Bearer [REDACTED]')
    .replace(/(?:api[_-]?key|apikey|secret|token)\s*[:=]\s*["']?[a-zA-Z0-9._-]{16,}/gi, '[REDACTED]')
}

logger.info('Prompt I/O service initialized')
