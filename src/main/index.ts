import { app, BrowserWindow, dialog, Menu } from 'electron'
import { registerAllIPC } from './ipc'
import { runMigrations } from './db/migrate'
import { seed } from './db/seed'
import { createMainWindow, getMainWindow } from './windows'
import { logger } from './utils/logger'
import { vault } from './security/vault'

// Redirect userData path to preserve database, settings, and credentials if they exist under the legacy name
try {
  const fs = require('fs')
  const defaultPath = app.getPath('userData')
  if (defaultPath.endsWith('vibeforge') || defaultPath.endsWith('Vibeforge')) {
    const legacyPath = defaultPath.replace(/vibeforge$/i, 'aureon-desk')
    if (fs.existsSync(legacyPath)) {
      app.setPath('userData', legacyPath)
    }
  }
} catch (e) {
  // Ignore filesystem check errors on boot
}

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
  logger.info('Vibeforge starting...')

  // Set up the application menu with Edit roles for native copy/paste support
  const isMac = process.platform === 'darwin'
  const template: Electron.MenuItemConstructorOptions[] = [
    ...(isMac ? [{ role: 'appMenu' as const }] : []),
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' as const },
        { role: 'redo' as const },
        { type: 'separator' as const },
        { role: 'cut' as const },
        { role: 'copy' as const },
        { role: 'paste' as const },
        { role: 'selectAll' as const }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' as const },
        { role: 'forceReload' as const },
        { role: 'toggleDevTools' as const },
        { type: 'separator' as const },
        { role: 'resetZoom' as const },
        { role: 'zoomIn' as const },
        { role: 'zoomOut' as const },
        { type: 'separator' as const },
        { role: 'togglefullscreen' as const }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' as const },
        { role: 'zoom' as const },
        ...(isMac ? [
          { type: 'separator' as const },
          { role: 'front' as const },
          { type: 'separator' as const },
          { role: 'window' as const }
        ] : [
          { role: 'close' as const }
        ])
      ]
    }
  ]
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)

  try {
    // Initialize security vault
    vault.init()
    logger.info(`SafeStorage available: ${vault.isAvailable()}`)

    // Run database migrations (this is where better-sqlite3 is first loaded)
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

    logger.info('Vibeforge ready')
  } catch (err) {
    const msg = String(err)
    logger.error('Failed to start Vibeforge', err instanceof Error ? err : undefined)

    // Check if this is a native module issue
    if (msg.includes('better-sqlite3') || msg.includes('NODE_MODULE_VERSION') || msg.includes('Could not locate')) {
      dialog.showErrorBox(
        'Native Module Missing',
        'Vibeforge cannot start because the SQLite native module is missing or incompatible.\n\n' +
        'To fix this on Windows:\n' +
        '  1. Install Visual Studio Build Tools\n' +
        '     (select "Desktop development with C++" during install)\n' +
        '     https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022\n\n' +
        '  2. Open a terminal in the project folder and run:\n' +
        '     npm run rebuild:native\n\n' +
        '  3. Then run:\n' +
        '     npm start\n\n' +
        `Error details: ${msg}`
      )
    } else {
      dialog.showErrorBox('Startup Error', `Vibeforge encountered an error during startup:\n\n${msg}`)
    }
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  logger.info('Vibeforge shutting down...')
})
