import { v4 as uuid } from 'uuid'
import { getDb } from '../db/connection'
import { chats, messages, providers, models } from '../db/schema'
import { eq, desc, sql, and } from 'drizzle-orm'
import type { ChatRow, MessageRow, NewChat, NewMessage, ChatWithMessages, ChatListItem } from '../../shared/types/chat'
import { logger } from '../utils/logger'

export const chatService = {
  /** List chats (most recent first) */
  listChats(includeArchived = false): ChatListItem[] {
    const db = getDb()

    const conditions = includeArchived ? undefined : eq(chats.archived, 0)

    const allChats = db.select()
      .from(chats)
      .where(conditions as never)
      .orderBy(desc(chats.updated_at))
      .all() as ChatRow[]

    return allChats.map(chat => {
      // Get message count and last message preview
    const msgCount = db.select({ count: sql`count(*)` })
      .from(messages)
      .where(eq(messages.chat_id, chat.id))
      .get() as { count: number }

      const lastMsg = db.select({ content: messages.content })
        .from(messages)
        .where(eq(messages.chat_id, chat.id))
        .orderBy(desc(messages.sort_order))
        .limit(1)
        .get() as { content: string } | undefined

      return {
        id: chat.id,
        title: chat.title,
        updated_at: chat.updated_at,
        message_count: msgCount?.count || 0,
        last_message_preview: lastMsg
          ? lastMsg.content.slice(0, 100)
          : null
      }
    })
  },

  /** Get a single chat with all its messages */
  getChat(id: string): ChatWithMessages | undefined {
    const db = getDb()

    const chat = db.select().from(chats)
      .where(eq(chats.id, id))
      .get() as ChatRow | undefined

    if (!chat) return undefined

    const msgs = db.select().from(messages)
      .where(eq(messages.chat_id, id))
      .orderBy(messages.sort_order)
      .all() as MessageRow[]

    return { ...chat, messages: msgs }
  },

  /** Create a new chat */
  createChat(input: NewChat): ChatRow {
    const db = getDb()
    const now = new Date().toISOString()
    const id = uuid()

    let modelId = input.model_id || null

    if (!modelId) {
      // Find a default model:
      // First find enabled providers
      const enabledProviders = db.select({ id: providers.id })
        .from(providers)
        .where(eq(providers.is_enabled, 1))
        .all() as { id: string }[]
      
      const enabledProviderIds = enabledProviders.map(p => p.id)
      if (enabledProviderIds.length > 0) {
        // Query models that are enabled
        const allModels = db.select({ id: models.id, is_default: models.is_default, provider_id: models.provider_id })
          .from(models)
          .where(eq(models.is_enabled, 1))
          .all() as { id: string; is_default: number; provider_id: string }[]
        
        const activeModels = allModels.filter(m => enabledProviderIds.includes(m.provider_id))
        
        // Find default model if exists
        const defaultModel = activeModels.find(m => m.is_default === 1)
        if (defaultModel) {
          modelId = defaultModel.id
        } else if (activeModels.length > 0) {
          // Fallback to first active model
          modelId = activeModels[0].id
        }
      }
    }

    db.insert(chats).values({
      id,
      title: input.title || 'New Chat',
      model_id: modelId,
      system_prompt_id: input.system_prompt_id || null,
      project_id: input.project_id || null,
      created_at: now,
      updated_at: now,
      archived: 0
    }).run()

    logger.info(`Created chat: ${id} (model: ${modelId})`)
    return db.select().from(chats).where(eq(chats.id, id)).get() as ChatRow
  },

  /** Update chat metadata */
  updateChat(id: string, updates: Partial<Pick<ChatRow, 'title' | 'model_id' | 'system_prompt_id' | 'archived'>>): ChatRow | undefined {
    const db = getDb()
    const now = new Date().toISOString()

    const data: Record<string, unknown> = { updated_at: now }
    if (updates.title !== undefined) data.title = updates.title
    if (updates.model_id !== undefined) data.model_id = updates.model_id
    if (updates.system_prompt_id !== undefined) data.system_prompt_id = updates.system_prompt_id
    if (updates.archived !== undefined) data.archived = updates.archived

    db.update(chats)
      .set(data as never)
      .where(eq(chats.id, id))
      .run()

    return db.select().from(chats).where(eq(chats.id, id)).get() as ChatRow | undefined
  },

  /** Delete a chat (cascade deletes messages) */
  deleteChat(id: string): boolean {
    const db = getDb()
    const result = db.delete(chats).where(eq(chats.id, id)).run()
    logger.info(`Deleted chat: ${id}`)
    return result.changes > 0
  },

  /** Archive a chat */
  archiveChat(id: string): ChatRow | undefined {
    return this.updateChat(id, { archived: 1 })
  },

  // --- Messages ---

  /** Add a message to a chat */
  addMessage(input: NewMessage): MessageRow {
    const db = getDb()
    const now = new Date().toISOString()
    const id = uuid()

    // Get next sort order
    const maxOrder = db.select({ max: sql`COALESCE(MAX(sort_order), -1)` })
      .from(messages)
      .where(eq(messages.chat_id, input.chat_id))
      .get() as { max: number }

    db.insert(messages).values({
      id,
      chat_id: input.chat_id,
      role: input.role,
      content: input.content,
      tool_calls: input.tool_calls || null,
      tool_call_id: input.tool_call_id || null,
      token_count: input.token_count || null,
      created_at: now,
      sort_order: (maxOrder?.max ?? -1) + 1
    }).run()

    // Update chat's updated_at
    db.update(chats)
      .set({ updated_at: now } as never)
      .where(eq(chats.id, input.chat_id))
      .run()

    return db.select().from(messages).where(eq(messages.id, id)).get() as MessageRow
  },

  /** Get all messages for a chat */
  getMessages(chatId: string): MessageRow[] {
    const db = getDb()
    return db.select().from(messages)
      .where(eq(messages.chat_id, chatId))
      .orderBy(messages.sort_order)
      .all() as MessageRow[]
  },

  /** Update a message */
  updateMessage(id: string, content: string): MessageRow | undefined {
    const db = getDb()
    db.update(messages)
      .set({ content } as never)
      .where(eq(messages.id, id))
      .run()

    return db.select().from(messages).where(eq(messages.id, id)).get() as MessageRow | undefined
  },

  /** Delete a message */
  deleteMessage(id: string): boolean {
    const db = getDb()
    const result = db.delete(messages).where(eq(messages.id, id)).run()
    return result.changes > 0
  },

  /** Delete all messages in a chat */
  clearMessages(chatId: string): void {
    const db = getDb()
    db.delete(messages).where(eq(messages.chat_id, chatId)).run()
    logger.info(`Cleared messages for chat: ${chatId}`)
  }
}
