import { v4 as uuid } from 'uuid'
import { getDb } from '../db/connection'
import { systemPrompts } from '../db/schema'
import { eq, desc, and } from 'drizzle-orm'
import type { SystemPromptRow, NewSystemPrompt, HierarchyInput, ResolvedPrompt } from '../../shared/types/prompt'
import { resolvePrompt, detectSecrets, checkToolBypass } from './hierarchy-resolver'
import { logger } from '../utils/logger'

export const promptService = {
  /** List all active (non-archived) system prompt profiles */
  listSystemPrompts(includeArchived = false): SystemPromptRow[] {
    const db = getDb()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = db.select().from(systemPrompts)

    if (!includeArchived) {
      query = query.where(eq(systemPrompts.is_archived, 0))
    }

    return query.orderBy(desc(systemPrompts.priority), desc(systemPrompts.updated_at))
      .all() as SystemPromptRow[]
  },

  /** Get a single system prompt */
  getSystemPrompt(id: string): SystemPromptRow | undefined {
    const db = getDb()
    return db.select().from(systemPrompts)
      .where(eq(systemPrompts.id, id))
      .get() as SystemPromptRow | undefined
  },

  /** Get the default system prompt */
  getDefaultSystemPrompt(): SystemPromptRow | undefined {
    const db = getDb()
    return db.select().from(systemPrompts)
      .where(and(eq(systemPrompts.is_default, 1), eq(systemPrompts.is_archived, 0)))
      .get() as SystemPromptRow | undefined
  },

  /** Create a new system prompt profile */
  createSystemPrompt(input: NewSystemPrompt): SystemPromptRow {
    const db = getDb()
    const now = new Date().toISOString()
    const id = uuid()

    if (input.is_default) {
      db.update(systemPrompts)
        .set({ is_default: 0 } as never)
        .run()
    }

    db.insert(systemPrompts).values({
      id,
      name: input.name,
      description: input.description || null,
      content: input.content,
      tags: input.tags ? JSON.stringify(input.tags) : null,
      category: input.category || null,
      is_default: input.is_default ? 1 : 0,
      is_archived: 0,
      priority: input.priority ?? 0,
      created_at: now,
      updated_at: now
    }).run()

    logger.info(`Created system prompt: ${input.name}`)
    return this.getSystemPrompt(id)!
  },

  /** Update an existing system prompt profile */
  updateSystemPrompt(id: string, input: Partial<NewSystemPrompt & { is_archived?: boolean }>): SystemPromptRow | undefined {
    const db = getDb()
    const now = new Date().toISOString()

    if (input.is_default) {
      db.update(systemPrompts).set({ is_default: 0 } as never).run()
    }

    const data: Record<string, unknown> = { updated_at: now }
    if (input.name !== undefined) data.name = input.name
    if (input.description !== undefined) data.description = input.description
    if (input.content !== undefined) data.content = input.content
    if (input.tags !== undefined) data.tags = JSON.stringify(input.tags)
    if (input.category !== undefined) data.category = input.category
    if (input.is_default !== undefined) data.is_default = input.is_default ? 1 : 0
    if (input.is_archived !== undefined) data.is_archived = input.is_archived ? 1 : 0
    if (input.priority !== undefined) data.priority = input.priority

    db.update(systemPrompts)
      .set(data as never)
      .where(eq(systemPrompts.id, id))
      .run()

    logger.info(`Updated system prompt: ${id}`)
    return this.getSystemPrompt(id)
  },

  /** Archive a system prompt (soft delete) */
  archiveSystemPrompt(id: string): SystemPromptRow | undefined {
    return this.updateSystemPrompt(id, { is_archived: true })
  },

  /** Restore an archived system prompt */
  restoreSystemPrompt(id: string): SystemPromptRow | undefined {
    return this.updateSystemPrompt(id, { is_archived: false })
  },

  /** Duplicate a system prompt */
  duplicateSystemPrompt(id: string): SystemPromptRow | undefined {
    const original = this.getSystemPrompt(id)
    if (!original) return undefined

    const copy: NewSystemPrompt = {
      name: `${original.name} (Copy)`,
      description: original.description || undefined,
      content: original.content,
      tags: original.tags ? safeParseTags(original.tags) : undefined,
      category: original.category || undefined,
      is_default: false, // Never auto-set copy as default
      priority: original.priority
    }

    return this.createSystemPrompt(copy)
  },

  /** Delete a system prompt profile (hard delete) */
  deleteSystemPrompt(id: string): boolean {
    const db = getDb()
    const result = db.delete(systemPrompts)
      .where(eq(systemPrompts.id, id))
      .run()

    logger.info(`Deleted system prompt: ${id}`)
    return result.changes > 0
  },

  /** Resolve the prompt hierarchy for a given set of inputs */
  resolveHierarchy(input: HierarchyInput): ResolvedPrompt {
    return resolvePrompt(input)
  },

  /** Validate a single prompt body for secrets */
  validateSecrets(content: string): { hasSecrets: boolean; matches: string[] } {
    const matches = detectSecrets(content)
    return { hasSecrets: matches.length > 0, matches }
  },

  /** Check a single prompt body for tool bypass language */
  validateToolBypass(content: string): boolean {
    return checkToolBypass(content)
  }
}

function safeParseTags(tags: string): string[] {
  try { return JSON.parse(tags) } catch { return [] }
}
