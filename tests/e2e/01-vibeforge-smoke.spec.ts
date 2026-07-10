import { test, expect, waitForAppReady, checkForErrorPage, screenshot } from './helpers/electronApp'

test.describe('Vibeforge — Smoke Test', () => {
  test('Electron app launches and main window appears', async ({ electronApp, mainWindow }) => {
    // Verify the app process is running
    expect(electronApp).toBeTruthy()
    expect(mainWindow).toBeTruthy()

    // Wait for the app shell to render
    await waitForAppReady(mainWindow)

    // Take a screenshot after launch
    await screenshot(mainWindow, 'smoke_app_launched')
  })

  test('Window title includes Vibeforge', async ({ mainWindow }) => {
    await waitForAppReady(mainWindow)

    const title = await mainWindow.title()
    expect(title).toContain('Vibeforge')
  })

  test('No raw React error page is visible', async ({ mainWindow }) => {
    await waitForAppReady(mainWindow)

    const error = await checkForErrorPage(mainWindow)
    expect(error).toBeNull()
  })

  test('No "IPC API is not available" error in page', async ({ mainWindow }) => {
    await waitForAppReady(mainWindow)

    const bodyText = await mainWindow.textContent('body')
    expect(bodyText).not.toContain('IPC API is not available')
  })

  test('Sidebar is visible', async ({ mainWindow }) => {
    await waitForAppReady(mainWindow)

    const sidebar = mainWindow.getByTestId('sidebar')
    await expect(sidebar).toBeVisible()
  })

  test('Main chat panel is visible (after creating a chat)', async ({ mainWindow }) => {
    await waitForAppReady(mainWindow)

    // The app starts with no active chat, showing a welcome screen.
    // Create a chat first to make the chat panel appear.
    const newChatButton = mainWindow.getByTestId('new-chat-button').first()
    await expect(newChatButton).toBeVisible({ timeout: 5000 })
    await newChatButton.click()
    await mainWindow.waitForTimeout(1000)

    const chatPanel = mainWindow.getByTestId('main-chat-panel')
    await expect(chatPanel).toBeVisible({ timeout: 5000 })
  })

  test('Message composer is visible (after creating a chat)', async ({ mainWindow }) => {
    await waitForAppReady(mainWindow)

    const newChatButton = mainWindow.getByTestId('new-chat-button').first()
    await expect(newChatButton).toBeVisible({ timeout: 5000 })
    await newChatButton.click()
    await mainWindow.waitForTimeout(1000)

    const composer = mainWindow.getByTestId('chat-composer')
    await expect(composer).toBeVisible({ timeout: 5000 })
  })

  test('No uncaught renderer errors', async ({ mainWindow, consoleErrors, pageErrors }) => {
    await waitForAppReady(mainWindow)

    // Allow some time for async errors to surface
    await mainWindow.waitForTimeout(2000)

    expect(pageErrors.length).toBe(0)
    // Console errors may include non-critical ones, just warn
    if (consoleErrors.length > 0) {
      console.warn('Console errors detected:', consoleErrors)
    }
  })

  test('Model selector is present (after creating a chat)', async ({ mainWindow }) => {
    await waitForAppReady(mainWindow)

    const newChatButton = mainWindow.getByTestId('new-chat-button').first()
    await expect(newChatButton).toBeVisible({ timeout: 5000 })
    await newChatButton.click()
    await mainWindow.waitForTimeout(1000)

    const modelSelector = mainWindow.getByTestId('model-selector')
    await expect(modelSelector).toBeVisible({ timeout: 5000 })
  })

  test('Router/inspector panel toggle is present', async ({ mainWindow }) => {
    await waitForAppReady(mainWindow)

    // Navigate to Chat page first so the inspector is rendered
    const newChatButton = mainWindow.getByTestId('new-chat-button').first()
    await expect(newChatButton).toBeVisible({ timeout: 5000 })
    await newChatButton.click()
    await mainWindow.waitForTimeout(1000)

    // The inspector may be collapsed; check the toggle button exists
    // Look for the PanelRightOpen icon button (collapsed inspector toggle)
    const toggleButton = mainWindow.locator('button[title="Open Inspector"]')
    const count = await toggleButton.count()

    // Either the toggle button (collapsed) or the full panel (expanded) should exist
    const routerPanel = mainWindow.getByTestId('router-panel')
    const panelCount = await routerPanel.count()

    // At least one of them should be present
    expect(count + panelCount).toBeGreaterThan(0)
  })
})
