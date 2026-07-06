import { ipcMain } from 'electron'
import { getDb } from '../db/connection'
import { settings } from '../db/schema'
import { eq } from 'drizzle-orm'
import { DEFAULT_SETTINGS } from '../../shared/types/settings'
import type { AppSettings } from '../../shared/types/settings'
import { logger } from '../utils/logger'

export function registerSettingsIPC(): void {
  ipcMain.handle('settings:get', (_event, key: string) => {
    const db = getDb()
    const row = db.select({ value: settings.value })
      .from(settings)
      .where(eq(settings.key, key))
      .get() as { value: string } | undefined
    return row?.value || null
  })

  ipcMain.handle('settings:set', (_event, key: string, value: string) => {
    const db = getDb()

    // Upsert
    const existing = db.select().from(settings)
      .where(eq(settings.key, key))
      .get()

    if (existing) {
      db.update(settings)
        .set({ value } as never)
        .where(eq(settings.key, key))
        .run()
    } else {
      db.insert(settings).values({ key, value }).run()
    }
    return true
  })

  ipcMain.handle('settings:getAll', () => {
    const db = getDb()
    const rows = db.select().from(settings).all()
    const result: Record<string, string> = {}
    for (const row of rows) {
      result[row.key] = row.value
    }
    return result
  })

  ipcMain.handle('settings:getDefaults', () => {
    return DEFAULT_SETTINGS
  })

  logger.info('Settings IPC handlers registered')
}
