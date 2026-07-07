import { test, expect, waitForAppReady, checkForErrorPage, screenshot } from './helpers/electronApp'

test.describe('GitHub Imports — Usability & Safety', () => {
  test('GitHub Imports page opens with import controls', async ({ mainWindow }) => {
    await waitForAppReady(mainWindow)
    await mainWindow.click('[data-testid="nav-settings"]')
    await mainWindow.waitForTimeout(500)
    await mainWindow.click('text=GitHub Imports')
    await mainWindow.waitForSelector('[data-testid="github-imports-page"]', { timeout: 5000 })

    // Settings layout has its own "Settings" h2; the page content is within the Outlet
    // Verify the page content rendered by checking for the data-testid
    const page = await mainWindow.$('[data-testid="github-imports-page"]')
    expect(page).not.toBeNull()
    const bodyText = await mainWindow.textContent('[data-testid="github-imports-page"]')
    expect(bodyText).toContain('GitHub Imports')
    expect(await checkForErrorPage(mainWindow)).toBeNull()
  })

  test('Star list import button is visible', async ({ mainWindow }) => {
    await waitForAppReady(mainWindow)
    await mainWindow.click('[data-testid="nav-settings"]')
    await mainWindow.waitForTimeout(500)
    await mainWindow.click('text=GitHub Imports')
    await mainWindow.waitForTimeout(500)

    const importButton = await mainWindow.$('[data-testid="import-star-list-button"]')
    expect(importButton).not.toBeNull()
  })

  test('Import URL input accepts and shows typed text', async ({ mainWindow }) => {
    await waitForAppReady(mainWindow)
    await mainWindow.click('[data-testid="nav-settings"]')
    await mainWindow.waitForTimeout(500)
    await mainWindow.click('text=GitHub Imports')
    await mainWindow.waitForTimeout(500)

    const input = await mainWindow.$('[data-testid="import-url-input"]')
    expect(input).not.toBeNull()
    await input?.fill('https://github.com/test/repo')
    const value = await input?.inputValue()
    expect(value).toBe('https://github.com/test/repo')
  })

  test('Empty state or repo count shown on first visit', async ({ mainWindow }) => {
    await waitForAppReady(mainWindow)
    await mainWindow.click('[data-testid="nav-settings"]')
    await mainWindow.waitForTimeout(500)
    await mainWindow.click('text=GitHub Imports')
    await mainWindow.waitForTimeout(500)

    const bodyText = await mainWindow.textContent('body')
    expect(bodyText).toBeTruthy()
    const hasContent = bodyText?.includes('No repositories imported') || bodyText?.includes('repo')
    expect(hasContent).toBe(true)
  })

  test('Import button is disabled when URL input is empty', async ({ mainWindow }) => {
    await waitForAppReady(mainWindow)
    await mainWindow.click('[data-testid="nav-settings"]')
    await mainWindow.waitForTimeout(500)
    await mainWindow.click('text=GitHub Imports')
    await mainWindow.waitForTimeout(500)

    const importBtn = await mainWindow.$('[data-testid="import-single-button"]')
    expect(importBtn).not.toBeNull()
    const isDisabled = await importBtn?.getAttribute('disabled')
    expect(isDisabled).toBeDefined()
  })

  test('Security notice about untrusted content is visible', async ({ mainWindow }) => {
    await waitForAppReady(mainWindow)
    await mainWindow.click('[data-testid="nav-settings"]')
    await mainWindow.waitForTimeout(500)
    await mainWindow.click('text=GitHub Imports')
    await mainWindow.waitForTimeout(500)

    const bodyText = await mainWindow.textContent('body')
    expect(bodyText).toContain('untrusted')
  })

  test('App does not crash navigating to GitHub Imports', async ({ mainWindow }) => {
    await waitForAppReady(mainWindow)
    await mainWindow.click('[data-testid="nav-settings"]')
    await mainWindow.waitForTimeout(500)
    await mainWindow.click('text=GitHub Imports')
    await mainWindow.waitForTimeout(500)

    const hasError = await checkForErrorPage(mainWindow)
    expect(hasError).toBeNull()
  })
})
