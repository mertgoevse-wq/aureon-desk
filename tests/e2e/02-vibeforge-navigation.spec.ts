import { test, expect, waitForAppReady, checkForErrorPage, screenshot } from './helpers/electronApp'

test.describe('Vibeforge — Navigation', () => {
  test.beforeEach(async ({ mainWindow }) => {
    await waitForAppReady(mainWindow)
  })

  const navTargets = [
    { testId: 'nav-chats', label: 'Chats' },
    { testId: 'nav-prompts', label: 'Prompts' },
    { testId: 'nav-projects', label: 'Projects' },
    { testId: 'nav-tools', label: 'Tools' }
  ]

  for (const { testId, label } of navTargets) {
    test(`Navigate to ${label}`, async ({ mainWindow, pageErrors }) => {
      // Click the navigation button
      const navButton = mainWindow.getByTestId(testId)
      await expect(navButton).toBeVisible({ timeout: 5000 })
      await navButton.click()

      // Wait for navigation to settle
      await mainWindow.waitForTimeout(1000)

      // Check for errors after navigation
      const error = await checkForErrorPage(mainWindow)
      expect(error).toBeNull()

      // No new page errors
      expect(pageErrors.length).toBe(0)

      // Take screenshot
      await screenshot(mainWindow, `navigation_${label.toLowerCase()}`)
    })
  }

  test('Navigate to Settings', async ({ mainWindow, pageErrors }) => {
    const settingsButton = mainWindow.getByTestId('nav-settings')
    await expect(settingsButton).toBeVisible({ timeout: 5000 })
    await settingsButton.click()

    await mainWindow.waitForTimeout(1000)

    // Settings should load the General page by default
    const bodyText = await mainWindow.textContent('body')
    expect(bodyText).toContain('General')
    expect(bodyText).toContain('Browser Use')
    await expect(mainWindow.getByTestId('settings-category-column')).toBeVisible()

    // No errors
    expect(await checkForErrorPage(mainWindow)).toBeNull()
    expect(pageErrors.length).toBe(0)

    await screenshot(mainWindow, 'navigation_settings')
  })

  test('Navigate back to Chats after visiting other pages', async ({ mainWindow, pageErrors }) => {
    // Create a chat first so we have something to come back to
    const newChatButton = mainWindow.getByTestId('new-chat-button').first()
    await expect(newChatButton).toBeVisible({ timeout: 5000 })
    await newChatButton.click()
    await mainWindow.waitForTimeout(1000)

    // Verify we're on the chat view with the chat panel visible
    const chatPanel = mainWindow.getByTestId('main-chat-panel')
    await expect(chatPanel).toBeVisible({ timeout: 5000 })

    // Go to Tools
    const toolsButton = mainWindow.getByTestId('nav-tools')
    await expect(toolsButton).toBeVisible({ timeout: 5000 })
    await toolsButton.click()
    await mainWindow.waitForTimeout(500)

    // Then back to Chats
    const chatsButton = mainWindow.getByTestId('nav-chats')
    await expect(chatsButton).toBeVisible({ timeout: 5000 })
    await chatsButton.click()
    await mainWindow.waitForTimeout(500)

    // Should be back at the chat view with the chat panel visible
    await expect(chatPanel).toBeVisible({ timeout: 5000 })

    expect(await checkForErrorPage(mainWindow)).toBeNull()
    expect(pageErrors.length).toBe(0)

    await screenshot(mainWindow, 'navigation_back_to_chats')
  })

  test('All navigation transitions work without crashes', async ({ mainWindow, pageErrors }) => {
    const allNavs = [
      'nav-chats', 'nav-prompts', 'nav-projects', 'nav-tools', 'nav-settings',
      'nav-chats', 'nav-prompts', 'nav-chats'
    ]

    for (const testId of allNavs) {
      const button = mainWindow.getByTestId(testId)
      await expect(button).toBeVisible({ timeout: 5000 })
      await button.click()
      await mainWindow.waitForTimeout(300)
    }

    // Final check — no errors after rapid navigation
    expect(pageErrors.length).toBe(0)
    expect(await checkForErrorPage(mainWindow)).toBeNull()
  })
})
