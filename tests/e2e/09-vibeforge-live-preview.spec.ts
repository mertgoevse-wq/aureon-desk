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

  test('LivePreview full interactive lifecycle - start, stop, restart, and diagnostics', async ({ mainWindow }) => {
    await waitForAppReady(mainWindow)

    await mainWindow.click('[data-testid="nav-preview"]')
    await mainWindow.waitForTimeout(1000)

    // 1. Select "Coding Demo" template
    const templateSelect = await mainWindow.$('[data-testid="preview-template-select"]')
    await templateSelect!.selectOption({ label: 'Coding Demo' })
    await mainWindow.waitForTimeout(300)

    // 2. Start preview (Build with Preview)
    const createBtn = await mainWindow.$('[data-testid="preview-create-btn"]')
    await createBtn!.click()

    // Wait for server to start
    await mainWindow.waitForTimeout(4000)

    // 3. Verify status is running and URL is created (no blank preview)
    const statusBadge = await mainWindow.$('[data-testid="preview-status"]')
    const statusText = await statusBadge!.textContent()
    expect(statusText).toMatch(/Running/i)

    const urlInput = await mainWindow.$('[data-testid="preview-url-input"]')
    const urlValue = await urlInput!.inputValue()
    expect(urlValue).toContain('http://127.0.0.1')
    expect(urlValue.trim()).not.toBe('') // Blank preview fails test

    // Verify diagnostics elements
    const diagUrl = await mainWindow.$('[data-testid="diagnostics-url"]')
    expect(diagUrl).not.toBeNull()
    const diagStatus = await mainWindow.$('[data-testid="diagnostics-status"]')
    expect(await diagStatus!.textContent()).toMatch(/running/i)

    // 4. Click Stop preview
    const stopBtn = await mainWindow.$('[data-testid="preview-stop-btn"]')
    await stopBtn!.click()
    await mainWindow.waitForTimeout(1000)

    // Verify stopped status
    const stoppedText = await statusBadge!.textContent()
    expect(stoppedText).toMatch(/Stopped/i)

    // 5. Start / Restart preview works
    const startBtn = await mainWindow.$('[data-testid="preview-start-btn"]')
    await startBtn!.click()
    await mainWindow.waitForTimeout(1500)

    // Verify back to running
    const runningText2 = await statusBadge!.textContent()
    expect(runningText2).toMatch(/Running/i)
  })
})
