import { test, expect, waitForAppReady, checkForErrorPage, screenshot } from './helpers/electronApp'

test.describe('Vibeforge — Premium workspace UI', () => {
  test.beforeEach(async ({ mainWindow }) => {
    await waitForAppReady(mainWindow)
  })

  test('mode switch is visible and opens Chat, Cowork, and Code surfaces', async ({ mainWindow, pageErrors }) => {
    await expect(mainWindow.getByTestId('mode-switch')).toBeVisible()
    await expect(mainWindow.getByTestId('mode-chat')).toBeVisible()
    await expect(mainWindow.getByTestId('mode-cowork')).toBeVisible()
    await expect(mainWindow.getByTestId('mode-code')).toBeVisible()

    await mainWindow.getByTestId('mode-cowork').click()
    await expect(mainWindow.getByTestId('cowork-page')).toBeVisible({ timeout: 5000 })
    await expect(mainWindow.getByRole('heading', { name: 'Cowork Mode' })).toBeVisible()

    await mainWindow.getByTestId('mode-code').click()
    await expect(mainWindow.getByTestId('live-preview-panel')).toBeVisible({ timeout: 5000 })

    await mainWindow.getByTestId('mode-chat').click()
    await expect(mainWindow.getByTestId('sidebar')).toBeVisible()

    expect(pageErrors.length).toBe(0)
    expect(await checkForErrorPage(mainWindow)).toBeNull()
  })

  test('home composer exposes controls and can send a user message', async ({ mainWindow }) => {
    await mainWindow.getByTestId('new-chat-button').first().click()
    await expect(mainWindow.getByTestId('chat-composer')).toBeVisible({ timeout: 5000 })
    await expect(mainWindow.getByTestId('home-model-control')).toBeVisible()
    await expect(mainWindow.getByTestId('home-style-control')).toBeVisible()
    await expect(mainWindow.getByTestId('home-project-control')).toBeVisible()
    await expect(mainWindow.getByTestId('home-tools-control')).toBeVisible()

    const textarea = mainWindow.getByTestId('message-textarea')
    await textarea.fill('Workspace UI smoke message')
    await mainWindow.getByTestId('send-button').click()
    await expect(mainWindow.getByTestId('main-chat-panel').getByText('Workspace UI smoke message')).toBeVisible({ timeout: 5000 })
  })

  test('settings category column switches General, Providers, and Developer pages', async ({ mainWindow }) => {
    await mainWindow.getByTestId('nav-settings').click()
    await expect(mainWindow.getByTestId('settings-category-column')).toBeVisible({ timeout: 5000 })
    await expect(mainWindow.getByTestId('settings-detail-panel')).toBeVisible()
    await expect(mainWindow.getByTestId('settings-general-page')).toBeVisible()
    await expect(mainWindow.getByText('Launch on System Startup')).toBeVisible()

    await mainWindow.getByTestId('settings-nav-providers-models').click()
    await expect(mainWindow.getByText('Provider Test Center')).toBeVisible({ timeout: 5000 })
    await expect(mainWindow.getByRole('button', { name: /Test All/i })).toBeVisible()

    await mainWindow.getByTestId('settings-nav-developer').click()
    await expect(mainWindow.getByTestId('settings-developer-page')).toBeVisible({ timeout: 5000 })
    await expect(mainWindow.getByText('Export Diagnostics')).toBeVisible()
  })

  test('layout has no horizontal overflow at 1366x768', async ({ mainWindow }) => {
    await mainWindow.setViewportSize({ width: 1366, height: 768 })
    await mainWindow.getByTestId('new-chat-button').first().click()
    await mainWindow.waitForTimeout(500)

    const overflow = await mainWindow.evaluate(() => ({
      documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      bodyOverflow: document.body.scrollWidth - document.body.clientWidth
    }))

    expect(overflow.documentOverflow).toBeLessThanOrEqual(1)
    expect(overflow.bodyOverflow).toBeLessThanOrEqual(1)
    await screenshot(mainWindow, 'workspace_1366_no_overflow')
  })

  test('LivePreview remains reachable from the Code mode', async ({ mainWindow }) => {
    await mainWindow.getByTestId('mode-code').click()
    await expect(mainWindow.getByTestId('live-preview-panel')).toBeVisible({ timeout: 5000 })
    await expect(mainWindow.getByTestId('preview-create-btn').first()).toBeVisible()
    await expect(mainWindow.getByTestId('preview-log-panel').first()).toBeVisible()
  })
})
