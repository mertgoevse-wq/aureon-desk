import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'
import { getDbPath } from '../utils/paths'
import { logger } from '../utils/logger'

let dbInstance: ReturnType<typeof drizzle> | null = null
let sqliteInstance: Database.Database | null = null

export function getDb(): ReturnType<typeof drizzle> {
  if (!dbInstance) {
    const dbPath = getDbPath()
    logger.info(`Opening database at ${dbPath}`)

    sqliteInstance = new Database(dbPath)
    sqliteInstance.pragma('journal_mode = WAL')
    sqliteInstance.pragma('foreign_keys = ON')
    sqliteInstance.pragma('busy_timeout = 5000')

    dbInstance = drizzle(sqliteInstance, { schema })
    logger.info('Database connection established')
  }
  return dbInstance
}

export function getSqlite(): Database.Database {
  if (!sqliteInstance) {
    getDb() // initialize
  }
  return sqliteInstance!
}

export function closeDb(): void {
  if (sqliteInstance) {
    sqliteInstance.close()
    sqliteInstance = null
    dbInstance = null
    logger.info('Database connection closed')
  }
}
