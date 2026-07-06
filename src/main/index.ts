import { app, BrowserWindow } from 'electron'
import { registerAllIPC } from './ipc'
import { runMigrations } from './db/migrate'
import { seed } from './db/seed'
import { createMainWindow, getMainWindow } from './windows'
import { logger } from './utils/logger'
import { vault } from './security/vault'

// Handle creating/removing shortcuts on Windows
if (process.platform === 'win32') {
  app.setAppUserModelId('com.aureon.desk')
}

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const win = getMainWindow()
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
    }
  })
}

app.whenReady().then(async () => {
  logger.init()
  logger.info('Aureon Desk starting...')

  // Initialize security vault
  vault.init()
  logger.info(`SafeStorage available: ${vault.isAvailable()}`)

  // Run database migrations
  runMigrations()

  // Seed default data
  try {
    await seed()
  } catch (err) {
    logger.error('Seeding failed', err)
  }

  // Register IPC handlers
  registerAllIPC()

  // Create main window
  createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })

  logger.info('Aureon Desk ready')
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  logger.info('Aureon Desk shutting down...')
})
