import { test, expect, waitForAppReady, checkForErrorPage, screenshot } from './helpers/electronApp'

test.describe('LivePreview Workspace — E2E', () => {
  test('Preview navigation item is visible in sidebar', async ({ mainWindow }) => {
    await waitForAppReady(mainWindow)
    
    // The Preview nav item should exist
    const previewNav = await mainWindow.$('[data-testid="nav-preview"]')
    expect(previewNav).not.toBeNull()
  })

  test('Navigate to Preview page opens the LivePreview panel', async ({ mainWindow }) => {
    await waitForAppReady(mainWindow)

    // Click the Preview nav item
    await mainWindow.click('[data-testid="nav-preview"]')
    await mainWindow.waitForTimeout(1000)

    // Should see the LivePreview content
    const previewContent = await mainWindow.$('[data-testid="live-preview-panel"]')
    expect(previewContent).not.toBeNull()
    expect(await checkForErrorPage(mainWindow)).toBeNull()
  })

  test('Preview page shows Create Preview button', async ({ mainWindow }) => {
    await waitForAppReady(mainWindow)

    await mainWindow.click('[data-testid="nav-preview"]')
    await mainWindow.waitForTimeout(1000)

    // The create preview button should be visible
    const createBtn = await mainWindow.$('[data-testid="preview-create-btn"]')
    expect(createBtn).not.toBeNull()
  })

  test('Preview page shows template type selector', async ({ mainWindow }) => {
    await waitForAppReady(mainWindow)

    await mainWindow.click('[data-testid="nav-preview"]')
    await mainWindow.waitForTimeout(1000)

    // Template type selector (HTML, Vite+React, etc.)
    const templateSelect = await mainWindow.$('[data-testid="preview-template-select"]')
    expect(templateSelect).not.toBeNull()
  })

  test('Preview page shows URL input field', async ({ mainWindow }) => {
    await waitForAppReady(mainWindow)

    await mainWindow.click('[data-testid="nav-preview"]')
    await mainWindow.waitForTimeout(1000)

    // URL input for external preview
    const urlInput = await mainWindow.$('[data-testid="preview-url-input"]')
    expect(urlInput).not.toBeNull()
  })

  test('Preview page shows server status indicator', async ({ mainWindow }) => {
    await waitForAppReady(mainWindow)

    await mainWindow.click('[data-testid="nav-preview"]')
    await mainWindow.waitForTimeout(1000)

    // Status badge should show idle
    const statusBadge = await mainWindow.$('[data-testid="preview-status"]')
    expect(statusBadge).not.toBeNull()
    const statusText = await statusBadge.textContent()
    expect(statusText).toMatch(/idle|off|stopped|ready/i)
  })

  test('Preview page shows logs area', async ({ mainWindow }) => {
    await waitForAppReady(mainWindow)

    await mainWindow.click('[data-testid="nav-preview"]')
    await mainWindow.waitForTimeout(1000)

    // Log output panel
    const logPanel = await mainWindow.$('[data-testid="preview-log-panel"]')
    expect(logPanel).not.toBeNull()
  })

  test('Open external browser button is visible', async ({ mainWindow }) => {
    await waitForAppReady(mainWindow)

    await mainWindow.click('[data-testid="nav-preview"]')
    await mainWindow.waitForTimeout(1000)

    const openBrowserBtn = await mainWindow.$('[data-testid="preview-open-external-btn"]')
    expect(openBrowserBtn).not.toBeNull()
  })

  test('Stop server button is visible', async ({ mainWindow }) => {
    await waitForAppReady(mainWindow)

    await mainWindow.click('[data-testid="nav-preview"]')
    await mainWindow.waitForTimeout(1000)

    const stopBtn = await mainWindow.$('[data-testid="preview-stop-btn"]')
    expect(stopBtn).not.toBeNull()
  })

  test('App does not crash when navigating to Preview page', async ({ mainWindow }) => {
    await waitForAppReady(mainWindow)

    await mainWindow.click('[data-testid="nav-preview"]')
    await mainWindow.waitForTimeout(1500)

    const hasError = await checkForErrorPage(mainWindow)
    expect(hasError).toBeNull()

    // Navigate away and back to verify stability
    await mainWindow.click('[data-testid="nav-chats"]')
    await mainWindow.waitForTimeout(500)
    await mainWindow.click('[data-testid="nav-preview"]')
    await mainWindow.waitForTimeout(500)

    expect(await checkForErrorPage(mainWindow)).toBeNull()
  })
})
