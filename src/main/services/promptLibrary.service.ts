import { v4 as uuid } from 'uuid'
import { getDb } from '../db/connection'
import { prompts } from '../db/schema'
import { eq, like, desc, or, and } from 'drizzle-orm'
import type { PromptRow, NewPrompt, PromptExport } from '../../shared/types/prompt'
import {
  exportPrompts,
  validateImport,
  sanitizeImported,
  parseMarkdownPrompts,
  parseYamlPrompts,
  detectFormat,
  extractVariables
} from './prompt-io.service'
import { logger } from '../utils/logger'

type PromptRowWithFav = PromptRow & { favorite: number; variables: string | null; usage_count: number }

export const promptLibraryService = {
  /** List all prompts, optionally filtered by search, tags, category, favorites */
  listPrompts(filters?: {
    search?: string
    tags?: string[]
    category?: string
    favoritesOnly?: boolean
  }): PromptRow[] {
    const db = getDb()
    const conditions: ReturnType<typeof eq>[] = []

    if (filters?.search) {
      const searchTerm = `%${filters.search}%`
      conditions.push(or(like(prompts.title, searchTerm), like(prompts.content, searchTerm))!)
    }

    if (filters?.category) {
      conditions.push(eq(prompts.category, filters.category))
    }

    let query = db.select().from(prompts)
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query
    }

    let results = query.orderBy(desc(prompts.updated_at)).all() as PromptRowWithFav[]

    // Client-side tag filtering
    if (filters?.tags && filters.tags.length > 0) {
      results = results.filter(row => {
        if (!row.tags) return false
        try {
          const rowTags: string[] = JSON.parse(row.tags)
          return filters.tags!.some(t => rowTags.includes(t))
        } catch {
          return false
        }
      })
    }

    // Client-side favorites filter
    if (filters?.favoritesOnly) {
      results = results.filter(row => !!row.favorite)
    }

    return results as PromptRow[]
  },

  getPrompt(id: string): PromptRow | undefined {
    const db = getDb()
    return db.select().from(prompts).where(eq(prompts.id, id)).get() as PromptRow | undefined
  },

  createPrompt(input: NewPrompt): PromptRow {
    const db = getDb()
    const now = new Date().toISOString()
    const id = uuid()
    const extractedVars = extractVariables(input.content)

    db.insert(prompts).values({
      id,
      title: input.title,
      content: input.content,
      description: input.description || null,
      variables: input.variables ? JSON.stringify(input.variables) : extractedVars,
      tags: input.tags ? JSON.stringify(input.tags) : null,
      category: input.category || null,
      favorite: 0,
      usage_count: 0,
      is_template: input.is_template ? 1 : 0,
      source: null,
      source_path: null,
      created_at: now,
      updated_at: now,
    }).run()

    logger.info(`Created prompt: ${input.title} (vars: ${extractedVars || 'none'}, template: ${input.is_template})`)
    return this.getPrompt(id)!
  },

  updatePrompt(id: string, input: Partial<NewPrompt>): PromptRow | undefined {
    const db = getDb()
    const now = new Date().toISOString()

    const data: Record<string, unknown> = { updated_at: now }
    if (input.title !== undefined) data.title = input.title
    if (input.content !== undefined) {
      data.content = input.content
      // Re-extract variables when content changes
      if (!input.variables && !input.is_template) {
        data.variables = extractVariables(input.content)
      }
    }
    if (input.description !== undefined) data.description = input.description
    if (input.tags !== undefined) data.tags = JSON.stringify(input.tags)
    if (input.category !== undefined) data.category = input.category
    if (input.is_template !== undefined) data.is_template = input.is_template ? 1 : 0
    if (input.variables !== undefined) data.variables = JSON.stringify(input.variables)

    db.update(prompts).set(data as never).where(eq(prompts.id, id)).run()
    logger.info(`Updated prompt: ${input.title || id}`)

    return this.getPrompt(id)
  },

  deletePrompt(id: string): boolean {
    const db = getDb()
    const result = db.delete(prompts).where(eq(prompts.id, id)).run()
    return result.changes > 0
  },

  /** Toggle favorite status */
  toggleFavorite(id: string): PromptRow | undefined {
    const prompt = this.getPrompt(id)
    if (!prompt) return undefined
    const db = getDb()
    const newFav = prompt.favorite ? 0 : 1
    db.update(prompts).set({ favorite: newFav } as never).where(eq(prompts.id, id)).run()
    return this.getPrompt(id)
  },

  /** Increment usage count (called when prompt is inserted via slash command) */
  incrementUsage(id: string): void {
    const db = getDb()
    const prompt = this.getPrompt(id) as PromptRowWithFav | undefined
    if (!prompt) return
    db.update(prompts).set({
      usage_count: (prompt.usage_count || 0) + 1
    } as never).where(eq(prompts.id, id)).run()
  },

  /** Get all unique tags from all prompts */
  getAllTags(): string[] {
    const db = getDb()
    const rows = db.select({ tags: prompts.tags }).from(prompts).all() as { tags: string | null }[]
    const tagSet = new Set<string>()
    for (const row of rows) {
      if (!row.tags) continue
      try {
        for (const tag of JSON.parse(row.tags) as string[]) tagSet.add(tag)
      } catch { /* skip */ }
    }
    return Array.from(tagSet).sort()
  },

  /** Get all unique categories */
  getAllCategories(): string[] {
    const db = getDb()
    const rows = db.select({ category: prompts.category }).from(prompts).all() as { category: string | null }[]
    const cats = new Set<string>()
    for (const row of rows) {
      if (row.category) cats.add(row.category)
    }
    return Array.from(cats).sort()
  },

  // ---- Import / Export ----

  /** Export all prompts as JSON payload */
  exportAll(): PromptExport {
    const all = this.listPrompts()
    return exportPrompts(all)
  },

  /** Import prompts from JSON string, with validation */
  importFromJson(jsonString: string): { imported: number; errors: string[] } {
    const errors: string[] = []
    try {
      const parsed = JSON.parse(jsonString)
      if (!validateImport(parsed)) {
        errors.push('Invalid prompt export format — expected { version, exportedAt, prompts[] }')
        return { imported: 0, errors }
      }

      const sanitized = sanitizeImported(parsed.prompts)
      const db = getDb()
      let imported = 0

      for (const item of sanitized) {
        if (!item.title || !item.content) continue
        try {
          db.insert(prompts).values(item as never).run()
          imported++
        } catch (err) {
          errors.push(`Failed to import "${item.title}": ${String(err)}`)
        }
      }

      logger.info(`Imported ${imported} prompts from JSON`)
      return { imported, errors }
    } catch (err) {
      errors.push(`JSON parse error: ${String(err)}`)
      return { imported: 0, errors }
    }
  },

  /** Import prompts from Markdown or YAML string */
  importFromText(text: string, format: 'markdown' | 'yaml' = 'markdown'): { imported: number; errors: string[] } {
    const errors: string[] = []
    try {
      const parsed = format === 'yaml' ? parseYamlPrompts(text) : parseMarkdownPrompts(text)
      if (parsed.length === 0) {
        errors.push('No prompts found in the input')
        return { imported: 0, errors }
      }

      const now = new Date().toISOString()
      const db = getDb()
      let imported = 0

      for (const item of parsed) {
        if (!item.title || !item.content) continue
        try {
          db.insert(prompts).values({
            id: uuid(),
            title: item.title.slice(0, 200),
            content: item.content,
            description: item.description || null,
            variables: extractVariables(item.content),
            tags: item.tags ? JSON.stringify(item.tags) : null,
            category: item.category || null,
            favorite: 0,
            usage_count: 0,
            source: `import:${format}`,
            source_path: null,
            is_template: 0,
            created_at: now,
            updated_at: now,
          } as never).run()
          imported++
        } catch (err) {
          errors.push(`Failed to import "${item.title}": ${String(err)}`)
        }
      }

      logger.info(`Imported ${imported} prompts from ${format}`)
      return { imported, errors }
    } catch (err) {
      errors.push(`Parse error: ${String(err)}`)
      return { imported: 0, errors }
    }
  },

  /** Auto-detect format and import */
  importAuto(text: string, extension?: string): { imported: number; errors: string[] } {
    const format = detectFormat(text, extension)
    if (format === 'json') return this.importFromJson(text)
    return this.importFromText(text, format === 'yaml' ? 'yaml' : 'markdown')
  },

  // ---- Slash Commands ----

  /**
   * Resolve a slash command. Returns the content to insert, or null if not a known command.
   * Built-in commands: /fix, /explain, /refactor, /commit, /test, /plan, /review, /summarize, /skill, /system
   */
  resolveSlashCommand(command: string): { content: string; label: string; isPrompt: boolean } | null {
    const builtins: Record<string, { content: string; label: string }> = {
      fix: {
        label: 'Fix Code',
        content: 'Please fix the following code. Identify bugs, edge cases, and improvements:\n\n```\n{{code}}\n```\n\nExplain each fix you make.'
      },
      explain: {
        label: 'Explain Code',
        content: 'Please explain the following code in detail. Walk through what it does, how it works, and any notable patterns or techniques used:\n\n```\n{{code}}\n```'
      },
      refactor: {
        label: 'Refactor Code',
        content: 'Please refactor the following code to be cleaner, more efficient, and more maintainable. Preserve all existing behavior:\n\n```\n{{code}}\n```\n\nDescribe each refactoring you apply and why.'
      },
      commit: {
        label: 'Generate Commit Message',
        content: 'Based on the following git diff, generate a concise, well-formatted commit message following conventional commits:\n\n```diff\n{{diff}}\n```'
      },
      test: {
        label: 'Write Tests',
        content: 'Please write comprehensive unit tests for the following code. Cover happy paths, edge cases, and error handling:\n\n```\n{{code}}\n```\n\nUse the testing framework already in use in this project.'
      },
      plan: {
        label: 'Create Plan',
        content: 'I need a detailed implementation plan for the following task:\n\n{{task}}\n\nPlease break it down into clear, ordered steps with technical details.'
      },
      review: {
        label: 'Code Review',
        content: 'Please review the following code. Evaluate it for:\n- Correctness and edge cases\n- Performance and efficiency\n- Security concerns\n- Readability and maintainability\n- Adherence to best practices\n\n```\n{{code}}\n```'
      },
      summarize: {
        label: 'Summarize',
        content: 'Please provide a concise summary of the following:\n\n{{text}}\n\nFocus on the key points and takeaways.'
      },
      skill: {
        label: 'Apply Skill',
        content: 'Act as a specialist with the following skill:\n\n{{skill}}\n\nNow, help me with:\n\n{{task}}'
      },
      system: {
        label: 'System / Meta',
        content: 'Rules:\n- {{rules}}\n\nNow proceed with the following task:\n\n{{task}}'
      }
    }

    const cmd = command.toLowerCase()
    if (builtins[cmd]) {
      return { ...builtins[cmd], isPrompt: false }
    }

    // Check if it matches a prompt library entry by title prefix
    const allPrompts = this.listPrompts()
    const match = allPrompts.find(
      p => p.title.toLowerCase().startsWith(cmd) || p.title.toLowerCase() === cmd
    )
    if (match) {
      this.incrementUsage(match.id)
      return { content: match.content, label: match.title, isPrompt: true }
    }

    return null
  }
}
