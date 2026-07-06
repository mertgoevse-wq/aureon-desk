import { v4 as uuid } from 'uuid'
import { getDb } from '../db/connection'
import { appLogs, toolCallLogs, importLogs, settings } from '../db/schema'
import { eq, desc, and, like, gte, lte, sql } from 'drizzle-orm'
import { redactSecrets } from './log-redacter'
import { logger } from '../utils/logger'
import type { AppLogRow, NewAppLog, LogFilter, DebugBundle, LogLevel, LogCategory } from '../../shared/types/log'
import { app } from 'electron'

export const logService = {
  /** Write a structured log entry to the database */
  writeLog(input: NewAppLog): AppLogRow {
    const db = getDb()
    const id = uuid()
    const now = new Date().toISOString()

    // Redact secrets in message and metadata before storing
    const sanitizedMsg = redactSecrets(input.message)
    const sanitizedMeta = input.metadata
      ? JSON.stringify(redactSecrets(JSON.stringify(input.metadata)))
      : null

    db.insert(appLogs).values({
      id,
      timestamp: now,
      level: input.level,
      category: input.category,
      message: sanitizedMsg,
      metadata: sanitizedMeta,
      chat_id: input.chatId || null,
      project_id: input.projectId || null
    } as never).run()

    return db.select().from(appLogs).where(eq(appLogs.id, id)).get() as AppLogRow
  },

  /** Query logs with optional filters */
  queryLogs(filter: LogFilter = {}): AppLogRow[] {
    const db = getDb()
    const conditions = []

    if (filter.level) conditions.push(eq(appLogs.level, filter.level))
    if (filter.category) conditions.push(eq(appLogs.category, filter.category))
    if (filter.chatId) conditions.push(eq(appLogs.chat_id, filter.chatId))
    if (filter.projectId) conditions.push(eq(appLogs.project_id, filter.projectId))
    if (filter.startDate) conditions.push(gte(appLogs.timestamp, filter.startDate))
    if (filter.endDate) conditions.push(lte(appLogs.timestamp, filter.endDate))

    let query = db.select().from(appLogs) as any

    if (filter.search) {
      conditions.push(like(appLogs.message, `%${filter.search}%`))
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions))
    }

    const limit = filter.limit ?? 200
    const offset = filter.offset ?? 0

    return query
      .orderBy(desc(appLogs.timestamp))
      .limit(limit)
      .offset(offset)
      .all() as AppLogRow[]
  },

  /** Get total log count matching filter */
  countLogs(filter: LogFilter = {}): number {
    const db = getDb()
    const conditions = []

    if (filter.level) conditions.push(eq(appLogs.level, filter.level))
    if (filter.category) conditions.push(eq(appLogs.category, filter.category))
    if (filter.chatId) conditions.push(eq(appLogs.chat_id, filter.chatId))
    if (filter.projectId) conditions.push(eq(appLogs.project_id, filter.projectId))
    if (filter.startDate) conditions.push(gte(appLogs.timestamp, filter.startDate))
    if (filter.endDate) conditions.push(lte(appLogs.timestamp, filter.endDate))

    let query = db.select({ count: sql`count(*)` }).from(appLogs) as any

    if (filter.search) {
      conditions.push(like(appLogs.message, `%${filter.search}%`))
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions))
    }

    const result = query.get() as { count: number }
    return result?.count || 0
  },

  /** Clear all app logs */
  clearLogs(): number {
    const db = getDb()
    const result = db.delete(appLogs).run()
    logger.info(`Cleared ${result.changes} log entries`)
    return result.changes
  },

  /** Clear tool call logs */
  clearToolCallLogs(): number {
    const db = getDb()
    const result = db.delete(toolCallLogs).run()
    logger.info(`Cleared ${result.changes} tool call logs`)
    return result.changes
  },

  /** Clear import logs */
  clearImportLogs(): number {
    const db = getDb()
    const result = db.delete(importLogs).run()
    logger.info(`Cleared ${result.changes} import logs`)
    return result.changes
  },

  /** Export a debug bundle without secrets */
  exportDebugBundle(): DebugBundle {
    const db = getDb()

    // Get recent app logs (already redacted)
    const recentLogs = db.select().from(appLogs)
      .orderBy(desc(appLogs.timestamp))
      .limit(500)
      .all() as AppLogRow[]

    // Get tool call logs (already redacted on input)
    const recentToolLogs = db.select().from(toolCallLogs)
      .orderBy(desc(toolCallLogs.created_at))
      .limit(100)
      .all()

    // Get import logs
    const recentImportLogs = db.select().from(importLogs)
      .orderBy(desc(importLogs.created_at))
      .limit(100)
      .all()

    // Get settings (sanitize for secrets)
    // Get from settings table
    const allSettings = db.select().from(settings).all() as { key: string; value: string }[]
    const safeSettings: Record<string, string> = {}
    for (const s of allSettings) {
      safeSettings[s.key] = redactSecrets(s.value)
    }

    // Counts
    const logCount = (db.select({ count: sql`count(*)` }).from(appLogs).get() as { count: number })?.count || 0
    const toolCallCount = (db.select({ count: sql`count(*)` }).from(toolCallLogs).get() as { count: number })?.count || 0
    const importLogCount = (db.select({ count: sql`count(*)` }).from(importLogs).get() as { count: number })?.count || 0

    return {
      exportedAt: new Date().toISOString(),
      appVersion: app.getVersion(),
      platform: process.platform,
      arch: process.arch,
      settings: safeSettings,
      recentLogs,
      toolCallLogs: recentToolLogs,
      importLogs: recentImportLogs,
      metadata: { logCount, toolCallCount, importLogCount }
    }
  },

  /** Get distinct categories present in logs */
  getCategories(): string[] {
    const db = getDb()
    const rows = db.select({ category: appLogs.category })
      .from(appLogs)
      .all() as { category: string }[]
    return [...new Set(rows.map(r => r.category))]
  },

  /** Get a single log entry */
  getLog(id: string): AppLogRow | undefined {
    const db = getDb()
    return db.select().from(appLogs).where(eq(appLogs.id, id)).get() as AppLogRow | undefined
  }
}
