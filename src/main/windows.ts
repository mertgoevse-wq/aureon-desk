import { BrowserWindow, shell, app, nativeImage, clipboard } from 'electron'
import { join } from 'path'
import { existsSync } from 'fs'
import { logger } from './utils/logger'

let mainWindow: BrowserWindow | null = null

export function createMainWindow(): BrowserWindow {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    show: false,
    title: 'Aureon Desk',
    icon: getAppIcon(),
    backgroundColor: '#FAF8F5',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
    logger.info('Main window shown')
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  mainWindow.webContents.on('before-input-event', (event, input) => {
    const isPaste = (input.control || input.meta) && input.key.toLowerCase() === 'v'
    if (!isPaste) return

    const text = clipboard.readText()
    if (!text) return

    event.preventDefault()
    mainWindow?.webContents.executeJavaScript(`
      (() => {
        const text = ${JSON.stringify(text)};
        const el = document.activeElement;
        if (!el) return false;
        const tag = el.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') {
          const input = el;
          const start = input.selectionStart ?? input.value.length;
          const end = input.selectionEnd ?? input.value.length;
          input.value = input.value.slice(0, start) + text + input.value.slice(end);
          const cursor = start + text.length;
          input.setSelectionRange(cursor, cursor);
          input.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true, inputType: 'insertFromPaste', data: text }));
          return true;
        }
        if (el.isContentEditable) {
          document.execCommand('insertText', false, text);
          return true;
        }
        return false;
      })();
    `).catch(() => {})
  })

  // Load the renderer
  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  logger.info('Main window created')
  return mainWindow
}

function getAppIcon(): string | undefined {
  // Try the icon.ico path (works in dev and production via electron-builder)
  const devPath = join(__dirname, '../../build/icon.ico')
  if (existsSync(devPath)) return devPath
  // In packaged apps, electron-builder handles the icon automatically
  return undefined
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow
}
