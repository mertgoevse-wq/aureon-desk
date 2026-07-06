import type { ImportedItemType, ImportWarning } from '../../shared/types/github'

/**
 * Parse imported files to extract prompt titles, content, and detect item types.
 * Supports: .md, .mdx, .txt, .json, .yaml, .yml, .toml
 */

interface ParsedItem {
  title: string
  content: string
  description: string | null
  tags: string[]
  category: string | null
  itemType: ImportedItemType
  warnings: ParsedWarning[]
}

interface ParsedWarning {
  type: ImportWarning['type']
  message: string
  severity: 'low' | 'medium' | 'high'
  lineNumber: number | null
  context: string | null
}

const ACCEPTED_EXTENSIONS = ['.md', '.mdx', '.txt', '.json', '.yaml', '.yml', '.toml']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const SKIP_PATTERNS = [
  /node_modules/i, /\.git\b/i, /dist\b/i, /build\b/i,
  /\.next\b/i, /__pycache__/i, /vendor\b/i,
]

/** Check if a file should be processed */
export function shouldProcessFile(filePath: string, fileSize: number): { accepted: boolean; reason?: string } {
  if (fileSize > MAX_FILE_SIZE) {
    return { accepted: false, reason: `File too large (${(fileSize / 1024 / 1024).toFixed(1)}MB > 5MB limit)` }
  }
  const ext = filePath.slice(filePath.lastIndexOf('.')).toLowerCase()
  if (!ACCEPTED_EXTENSIONS.includes(ext)) {
    return { accepted: false, reason: `Extension "${ext}" not in accepted list` }
  }
  if (SKIP_PATTERNS.some(p => p.test(filePath))) {
    return { accepted: false, reason: 'Path matches skip pattern (node_modules, .git, etc.)' }
  }
  return { accepted: true }
}

/** Main parser entry: parse a file's content into extracted items */
export function parseFileContent(
  filePath: string,
  content: string
): { items: ParsedItem[]; warnings: ParsedWarning[] } {
  const ext = filePath.slice(filePath.lastIndexOf('.')).toLowerCase()

  switch (ext) {
    case '.json': return parseJson(filePath, content)
    case '.yaml':
    case '.yml': return parseYaml(filePath, content)
    case '.md':
    case '.mdx': return parseMarkdown(filePath, content)
    case '.txt': return parseText(filePath, content)
    case '.toml': return parseToml(filePath, content)
    default: return { items: [], warnings: [] }
  }
}

// ---- Safety Checks ----

function runSafetyChecks(content: string): ParsedWarning[] {
  const warnings: ParsedWarning[] = []

  // Secret detection
  const secretPatterns = [
    { regex: /sk-[a-zA-Z0-9_-]{20,}/g, label: 'Potential API key detected' },
    { regex: /Bearer\s+[a-zA-Z0-9._-]{20,}/gi, label: 'Potential bearer token detected' },
    { regex: /(?:api[_-]?key|apikey|secret)\s*[:=]\s*["']?[a-zA-Z0-9._-]{16,}/gi, label: 'Potential secret in key=value pair' },
  ]
  for (const { regex, label } of secretPatterns) {
    if (regex.test(content)) {
      warnings.push({ type: 'secret_detected', message: label, severity: 'high', lineNumber: null, context: null })
      break // One secret warning is enough
    }
  }

  // Prompt injection detection
  const injectionPatterns = [
    /ignore\s+(all\s+)?previous\s+instructions/i,
    /disregard\s+(all\s+)?(prior|previous)\s+instructions/i,
    /forget\s+(all\s+)?(prior|previous)\s+instructions/i,
    /you\s+are\s+now\s+(DAN|jailbroken|unfiltered)/i,
  ]
  for (const pattern of injectionPatterns) {
    if (pattern.test(content)) {
      warnings.push({ type: 'injection_detected', message: 'Prompt injection language detected', severity: 'medium', lineNumber: null, context: null })
      break
    }
  }

  // Proprietary/leaked warning terms
  const proprietaryPatterns = [
    /confidential/i,
    /proprietary/i,
    /internal\s+use\s+only/i,
    /do\s+not\s+(share|distribute|disclose)/i,
    /copyright\s+(20\d{2}|\(c\))/i,
    /all\s+rights\s+reserved/i,
  ]
  for (const pattern of proprietaryPatterns) {
    if (pattern.test(content)) {
      warnings.push({ type: 'proprietary_warning', message: 'Content may be proprietary/copyrighted', severity: 'medium', lineNumber: null, context: null })
      break
    }
  }

  return warnings
}

// ---- Format Parsers ----

function parseMarkdown(filePath: string, content: string): { items: ParsedItem[]; warnings: ParsedWarning[] } {
  const items: ParsedItem[] = []
  const warnings: ParsedWarning[] = [...runSafetyChecks(content)]

  // Extract H2 headings as potential prompt/skill titles
  const blocks = content.split(/^## /m)
  for (const block of blocks) {
    if (!block.trim()) continue
    const lines = block.split('\n')
    const title = lines[0].trim()
    if (!title || title.length < 2 || title.length > 200) continue

    const body = lines.slice(1).join('\n').trim()
    if (body.length < 20) continue // Skip very short blocks

    const itemType = detectItemType(title, body)
    const tags = extractTags(body)

    items.push({
      title: title.slice(0, 200),
      content: body,
      description: body.slice(0, 200),
      tags,
      category: null,
      itemType,
      warnings: [...runSafetyChecks(body)]
    })
  }

  // If no H2 blocks, treat whole file as one item
  if (items.length === 0 && content.trim().length > 20) {
    const ext = filePath.slice(filePath.lastIndexOf('/') + 1)
    const title = ext.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
    items.push({
      title: title || 'Imported Document',
      content: content.trim(),
      description: content.trim().slice(0, 200),
      tags: extractTags(content),
      category: null,
      itemType: detectItemType(title, content),
      warnings: [...runSafetyChecks(content)]
    })
  }

  return { items, warnings }
}

function parseYaml(filePath: string, content: string): { items: ParsedItem[]; warnings: ParsedWarning[] } {
  const items: ParsedItem[] = []
  const warnings: ParsedWarning[] = [...runSafetyChecks(content)]

  // Try to find "prompts:", "skills:", "system_prompts:" top-level keys
  const sections = content.split(/^(?=[a-z])/m)
  let currentSection: string | null = null
  let currentItem: Partial<ParsedItem> | null = null
  let contentLines: string[] = []
  let inContent = false

  const lines = content.split('\n')
  for (const line of lines) {
    const trimmed = line.trimEnd()

    // Detect YAML list items with title
    const titleMatch = trimmed.match(/^\s*-\s+title\s*:\s*(.+)$/)
    if (titleMatch) {
      if (currentItem) {
        // Don't overwrite content if already set from block or inline
        if (!currentItem.content && contentLines.length > 0) {
          currentItem.content = contentLines.join('\n').trim()
        }
        if (currentItem.content && currentItem.title) {
          items.push(currentItem as ParsedItem)
        }
      }
      currentItem = {
        title: titleMatch[1].trim().replace(/^["']|["']$/g, ''),
        content: '',
        description: null,
        tags: [],
        category: null,
        itemType: 'unknown',
        warnings: []
      }
      contentLines = []
      inContent = false
      continue
    }

    // Content field
    if (currentItem) {
      const contentField = trimmed.match(/^\s+content\s*:\s*[|>]\s*$/)
      if (contentField) { inContent = true; continue }
      const contentInline = trimmed.match(/^\s+content\s*:\s*(.+)$/)
      if (contentInline && !inContent) {
        currentItem.content = contentInline[1].trim().replace(/^["']|["']$/g, '')
        // Detect item type
        if (currentItem.title) currentItem.itemType = detectItemType(currentItem.title, currentItem.content)
        continue
      }

      if (inContent) {
        const indented = trimmed.match(/^(\s+)(.*)$/)
        if (indented && indented[1].length >= 4) {
          contentLines.push(indented[2])
          continue
        } else {
          currentItem.content = contentLines.join('\n').trim()
          inContent = false
          contentLines = []
          if (currentItem.title) currentItem.itemType = detectItemType(currentItem.title, currentItem.content)
        }
      }

      const tagMatch = trimmed.match(/^\s+tags?\s*:\s*\[(.+)\]$/)
      if (tagMatch) {
        currentItem.tags = tagMatch[1].split(',').map(t => t.trim().replace(/^["']|["']$/g, '')).filter(Boolean)
        continue
      }

      const catMatch = trimmed.match(/^\s+category\s*:\s*(.+)$/)
      if (catMatch) {
        currentItem.category = catMatch[1].trim().replace(/^["']|["']$/g, '')
        continue
      }

      const descMatch = trimmed.match(/^\s+description\s*:\s*(.+)$/)
      if (descMatch) {
        currentItem.description = descMatch[1].trim().replace(/^["']|["']$/g, '')
        continue
      }

      const typeMatch = trimmed.match(/^\s+type\s*:\s*(.+)$/)
      if (typeMatch) {
        const t = typeMatch[1].trim().toLowerCase()
        if (t === 'skill') currentItem.itemType = 'skill'
        else if (t === 'system_prompt' || t === 'system') currentItem.itemType = 'system_prompt'
        else if (t === 'prompt') currentItem.itemType = 'prompt'
        continue
      }
    }
  }

  // Save last item
  if (currentItem) {
    // Don't overwrite inline content that was already set
    if (contentLines.length > 0 && !currentItem.content) {
      currentItem.content = contentLines.join('\n').trim()
    }
    if (currentItem.content && currentItem.title) {
      currentItem.itemType = currentItem.itemType || detectItemType(currentItem.title, currentItem.content)
      items.push(currentItem as ParsedItem)
    }
  }

  // If no YAML items found, treat entire content as one
  if (items.length === 0 && content.trim().length > 20) {
    const ext = filePath.slice(filePath.lastIndexOf('/') + 1)
    items.push({
      title: ext.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
      content: content.trim(),
      description: content.trim().slice(0, 200),
      tags: extractTags(content),
      category: null,
      itemType: detectItemType(filePath, content),
      warnings: [...runSafetyChecks(content)]
    })
  }

  return { items, warnings }
}

function parseJson(filePath: string, content: string): { items: ParsedItem[]; warnings: ParsedWarning[] } {
  const warnings: ParsedWarning[] = [...runSafetyChecks(content)]
  try {
    const data = JSON.parse(content)

    // Handle array of items
    if (Array.isArray(data)) {
      return {
        items: data.filter((d: any) => d && d.title && d.content).map((d: any) => ({
          title: String(d.title).slice(0, 200),
          content: String(d.content),
          description: d.description ? String(d.description).slice(0, 200) : null,
          tags: Array.isArray(d.tags) ? d.tags : [],
          category: d.category || null,
          itemType: d.type ? mapType(d.type) : detectItemType(d.title, d.content),
          warnings: [...runSafetyChecks(String(d.content))]
        })),
        warnings
      }
    }

    // Handle single object
    if (data && data.title && data.content) {
      return {
        items: [{
          title: String(data.title).slice(0, 200),
          content: String(data.content),
          description: data.description ? String(data.description).slice(0, 200) : null,
          tags: Array.isArray(data.tags) ? data.tags : [],
          category: data.category || null,
          itemType: data.type ? mapType(data.type) : detectItemType(data.title, data.content),
          warnings: [...runSafetyChecks(String(data.content))]
        }],
        warnings
      }
    }

    // Object with sections (prompts, skills, system_prompts)
    const items: ParsedItem[] = []
    for (const [section, sectionData] of Object.entries(data)) {
      if (Array.isArray(sectionData)) {
        for (const item of sectionData) {
          if (item && item.title && item.content) {
            const itemType = section === 'skills' ? 'skill' :
              section === 'system_prompts' ? 'system_prompt' : 'prompt'
            items.push({
              title: String(item.title).slice(0, 200),
              content: String(item.content),
              description: item.description ? String(item.description).slice(0, 200) : null,
              tags: Array.isArray(item.tags) ? item.tags : [],
              category: item.category || null,
              itemType: item.type ? mapType(item.type) : itemType,
              warnings: [...runSafetyChecks(String(item.content))]
            })
          }
        }
      }
    }
    return { items, warnings }
  } catch {
    warnings.push({ type: 'parse_error', message: 'Failed to parse JSON', severity: 'medium', lineNumber: null, context: null })
    return { items: [], warnings }
  }
}

function parseText(filePath: string, content: string): { items: ParsedItem[]; warnings: ParsedWarning[] } {
  const warnings: ParsedWarning[] = [...runSafetyChecks(content)]
  const ext = filePath.slice(filePath.lastIndexOf('/') + 1)
  const title = ext.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
  return {
    items: [{
      title,
      content: content.trim(),
      description: content.trim().slice(0, 200),
      tags: extractTags(content),
      category: null,
      itemType: detectItemType(filePath, content),
      warnings: [...runSafetyChecks(content)]
    }],
    warnings
  }
}

function parseToml(filePath: string, content: string): { items: ParsedItem[]; warnings: ParsedWarning[] } {
  // Simple TOML parser — treat as text if no structured format detected
  return parseText(filePath, content)
}

// ---- Helpers ----

function detectItemType(title: string, content: string): ImportedItemType {
  const combined = `${title} ${content.slice(0, 500)}`.toLowerCase()
  if (/\bsystem\s*(?:[-_]?prompt|profile)\b/i.test(combined)) return 'system_prompt'
  if (/\bskill\b/i.test(combined) && /\b(description|capabilit|tool|helps? with|development)\b/i.test(combined)) return 'skill'
  if (/\b(prompt|template|instruction)\b/i.test(combined)) return 'prompt'
  return 'unknown'
}

function mapType(type: string): ImportedItemType {
  const t = type.toLowerCase()
  if (t === 'skill') return 'skill'
  if (t === 'system_prompt' || t === 'system') return 'system_prompt'
  if (t === 'prompt') return 'prompt'
  return 'unknown'
}

function extractTags(text: string): string[] {
  const tagMatch = text.match(/(?:tags?|keywords?)\s*[:=]\s*\[(.+?)\]/i)
  if (tagMatch) {
    return tagMatch[1].split(',').map(t => t.trim().replace(/^["']|["']$/g, '')).filter(Boolean).slice(0, 10)
  }
  const hashTags = text.match(/#(\w{2,30})/g)
  if (hashTags) return [...new Set(hashTags.map(t => t.slice(1)))].slice(0, 10)
  return []
}
