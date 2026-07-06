import { v4 as uuid } from 'uuid'
import { getDb } from '../db/connection'
import { prompts } from '../db/schema'
import { eq, like, desc, or } from 'drizzle-orm'
import type { PromptRow, NewPrompt } from '../../shared/types/prompt'
import { logger } from '../utils/logger'

export const promptLibraryService = {
  /** List all prompts, optionally filtered by search and tags */
  listPrompts(filters?: { search?: string; tags?: string[]; category?: string }): PromptRow[] {
    const db = getDb()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let rows: any = db.select().from(prompts)
      .orderBy(desc(prompts.updated_at))

    if (filters?.search) {
      const searchTerm = `%${filters.search}%`
      rows = rows.where(
        or(
          like(prompts.title, searchTerm),
          like(prompts.content, searchTerm)
        )
      )
    }

    if (filters?.category) {
      rows = rows.where(eq(prompts.category, filters.category))
    }

    const results = rows.all() as PromptRow[]

    // Client-side tag filtering
    if (filters?.tags && filters.tags.length > 0) {
      return results.filter(row => {
        if (!row.tags) return false
        try {
          const rowTags: string[] = JSON.parse(row.tags)
          return filters.tags!.some(t => rowTags.includes(t))
        } catch {
          return false
        }
      })
    }

    return results
  },

  getPrompt(id: string): PromptRow | undefined {
    const db = getDb()
    return db.select().from(prompts)
      .where(eq(prompts.id, id))
      .get() as PromptRow | undefined
  },

  createPrompt(input: NewPrompt): PromptRow {
    const db = getDb()
    const now = new Date().toISOString()
    const id = uuid()

    db.insert(prompts).values({
      id,
      title: input.title,
      content: input.content,
      description: input.description || null,
      tags: input.tags ? JSON.stringify(input.tags) : null,
      category: input.category || null,
      is_template: input.is_template ? 1 : 0,
      source: null,
      source_path: null,
      created_at: now,
      updated_at: now
    }).run()

    logger.info(`Created prompt: ${input.title}`)
    return this.getPrompt(id)!
  },

  updatePrompt(id: string, input: Partial<NewPrompt>): PromptRow | undefined {
    const db = getDb()
    const now = new Date().toISOString()

    const data: Record<string, unknown> = { updated_at: now }
    if (input.title !== undefined) data.title = input.title
    if (input.content !== undefined) data.content = input.content
    if (input.description !== undefined) data.description = input.description
    if (input.tags !== undefined) data.tags = JSON.stringify(input.tags)
    if (input.category !== undefined) data.category = input.category
    if (input.is_template !== undefined) data.is_template = input.is_template ? 1 : 0

    db.update(prompts)
      .set(data as never)
      .where(eq(prompts.id, id))
      .run()

    return this.getPrompt(id)
  },

  deletePrompt(id: string): boolean {
    const db = getDb()
    const result = db.delete(prompts)
      .where(eq(prompts.id, id))
      .run()
    return result.changes > 0
  },

  getAllTags(): string[] {
    const db = getDb()
    const rows = db.select({ tags: prompts.tags })
      .from(prompts)
      .all() as { tags: string | null }[]

    const tagSet = new Set<string>()
    for (const row of rows) {
      if (!row.tags) continue
      try {
        const parsedTags: string[] = JSON.parse(row.tags)
        for (const tag of parsedTags) {
          tagSet.add(tag)
        }
      } catch { /* skip */ }
    }

    return Array.from(tagSet).sort()
  },

  getAllCategories(): string[] {
    const db = getDb()
    const rows = db.select({ category: prompts.category })
      .from(prompts)
      .all() as { category: string | null }[]

    const cats = new Set<string>()
    for (const row of rows) {
      if (row.category) cats.add(row.category)
    }
    return Array.from(cats).sort()
  }
}
