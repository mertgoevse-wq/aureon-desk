import { _electron as electron, ElectronApplication, Page, test as base } from '@playwright/test'
import { resolve } from 'path'
import { existsSync } from 'fs'

const MAIN_ENTRY = resolve(__dirname, '../../../out/main/index.js')

interface ElectronFixture {
  electronApp: ElectronApplication
  mainWindow: Page
  consoleErrors: string[]
  pageErrors: string[]
}

/**
 * Extended test fixture that provides:
 * - electronApp: the launched Electron application
 * - mainWindow: the first BrowserWindow's Page
 * - consoleErrors: captured console.error messages
 * - pageErrors: captured uncaught page errors
 */
export const test = base.extend<ElectronFixture>({
  electronApp: async ({}, use) => {
    // Verify the build exists
    if (!existsSync(MAIN_ENTRY)) {
      throw new Error(
        `Electron main entry not found at ${MAIN_ENTRY}. ` +
        `Run "npm run build" first before running E2E tests.`
      )
    }

    // Retry Electron launch on Windows — DevTools WebSocket connection can flake
    // due to SQLite WAL checkpoint timing from previous test cleanup
    // Up to 3 total attempts (initial + 2 retries)
    let app: ElectronApplication | undefined
    let lastError: Error | undefined
    const maxRetries = 2
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        app = await electron.launch({
          args: [MAIN_ENTRY],
          timeout: 60_000
        })
        break
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err))
        if (attempt < maxRetries) {
          // Wait longer for OS to release file handles before retry
          await new Promise(resolve => setTimeout(resolve, 5000))
        }
      }
    }
    if (!app) {
      throw lastError || new Error('Failed to launch Electron after retries')
    }

    await use(app)

    // Always close the app after test, then wait for cleanup
    try {
      await app.close()
    } catch {
      // Process may already be gone
    }

    // Let the OS fully release file handles (SQLite WAL, etc.) before next launch
    await new Promise(resolve => setTimeout(resolve, 5000))
  },

  mainWindow: async ({ electronApp }, use) => {
    // Wait for the first BrowserWindow to appear
    const page = await electronApp.firstWindow()

    // Listen for unexpected crashes
    page.on('crash', () => {
      console.error('Electron renderer process crashed!')
    })

    await use(page)
  },

  consoleErrors: async ({ mainWindow }, use) => {
    const errors: string[] = []
    mainWindow.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })
    await use(errors)
  },

  pageErrors: async ({ mainWindow }, use) => {
    const errors: string[] = []
    mainWindow.on('pageerror', (error) => {
      errors.push(error.message)
    })
    await use(errors)
  }
})

export { expect } from '@playwright/test'

/**
 * Helper: Take a screenshot with a descriptive name.
 */
export async function screenshot(page: Page, name: string): Promise<void> {
  await page.screenshot({
    path: `tests/e2e/artifacts/${name.replace(/[^a-z0-9_-]/gi, '_')}.png`,
    fullPage: false
  })
}

/**
 * Helper: Wait for the app to finish rendering (no spinners, no loading text).
 */
export async function waitForAppReady(page: Page, timeout = 15_000): Promise<void> {
  // Wait for the app shell to be visible
  await page.waitForSelector('[data-testid="app-shell"]', { timeout })
  // Give React a moment to hydrate
  await page.waitForTimeout(500)
}

/**
 * Helper: Check for common error indicators in the page.
 */
export async function checkForErrorPage(page: Page): Promise<string | null> {
  // Check for React error boundary text
  const errorTexts = [
    'Application error',
    'Something went wrong',
    'Cannot read properties of undefined',
    'TypeError',
    'ReferenceError',
    'Uncaught Error',
    'IPC API is not available'
  ]

  const bodyText = await page.textContent('body').catch(() => '')

  for (const txt of errorTexts) {
    if (bodyText?.includes(txt)) {
      return txt
    }
  }

  return null
}
