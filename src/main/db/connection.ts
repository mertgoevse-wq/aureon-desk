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

    try {
      sqliteInstance = new Database(dbPath)
    } catch (err) {
      const msg = String(err)
      if (msg.includes('better_sqlite3') || msg.includes('NODE_MODULE_VERSION') || msg.includes('Could not locate')) {
        throw new Error(
          'better-sqlite3 native module is missing or incompatible with this version of Electron.\n' +
          '\n' +
          'To fix this on Windows:\n' +
          '  1. Install Visual Studio Build Tools (select "Desktop development with C++")\n' +
          '     https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022\n' +
          '  2. Run: npm run rebuild:native\n' +
          '\n' +
          `Original error: ${msg}`
        )
      }
      throw err
    }

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
