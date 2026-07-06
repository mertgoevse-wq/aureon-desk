import { v4 as uuid } from 'uuid'
import { getDb } from '../db/connection'
import { systemPrompts } from '../db/schema'
import { eq, desc } from 'drizzle-orm'
import type { SystemPromptRow, NewSystemPrompt } from '../../shared/types/prompt'
import { logger } from '../utils/logger'

export const promptService = {
  /** List all system prompt profiles */
  listSystemPrompts(): SystemPromptRow[] {
    const db = getDb()
    return db.select().from(systemPrompts)
      .orderBy(desc(systemPrompts.updated_at))
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
      .where(eq(systemPrompts.is_default, 1))
      .get() as SystemPromptRow | undefined
  },

  /** Create a new system prompt profile */
  createSystemPrompt(input: NewSystemPrompt): SystemPromptRow {
    const db = getDb()
    const now = new Date().toISOString()
    const id = uuid()

    // If this is set as default, unset all others
    if (input.is_default) {
      db.update(systemPrompts)
        .set({ is_default: 0 } as never)
        .where(eq(systemPrompts.is_default, 1))
        .run()
    }

    db.insert(systemPrompts).values({
      id,
      name: input.name,
      description: input.description || null,
      content: input.content,
      is_default: input.is_default ? 1 : 0,
      created_at: now,
      updated_at: now
    }).run()

    logger.info(`Created system prompt: ${input.name}`)
    return this.getSystemPrompt(id)!
  },

  /** Update an existing system prompt profile */
  updateSystemPrompt(id: string, input: Partial<NewSystemPrompt>): SystemPromptRow | undefined {
    const db = getDb()
    const now = new Date().toISOString()

    // If setting as default, unset all others
    if (input.is_default) {
      db.update(systemPrompts)
        .set({ is_default: 0 } as never)
        .run()
    }

    const updateData: Record<string, unknown> = { updated_at: now }
    if (input.name !== undefined) updateData.name = input.name
    if (input.description !== undefined) updateData.description = input.description
    if (input.content !== undefined) updateData.content = input.content
    if (input.is_default !== undefined) updateData.is_default = input.is_default ? 1 : 0

    db.update(systemPrompts)
      .set(updateData as never)
      .where(eq(systemPrompts.id, id))
      .run()

    logger.info(`Updated system prompt: ${id}`)
    return this.getSystemPrompt(id)
  },

  /** Delete a system prompt profile */
  deleteSystemPrompt(id: string): boolean {
    const db = getDb()
    const result = db.delete(systemPrompts)
      .where(eq(systemPrompts.id, id))
      .run()

    logger.info(`Deleted system prompt: ${id}`)
    return result.changes > 0
  }
}
