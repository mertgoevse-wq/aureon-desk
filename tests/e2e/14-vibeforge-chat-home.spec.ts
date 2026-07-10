import { test, expect, waitForAppReady, checkForErrorPage } from './helpers/electronApp'

test.describe('Vibeforge — Empty Chat Home Page Composer', () => {
  test.beforeEach(async ({ mainWindow }) => {
    await waitForAppReady(mainWindow)
  })

  test('renders the greeting, suggestions, and custom composer card on home page', async ({ mainWindow, pageErrors }) => {
    // Navigate to home "/" by clicking sidebar workspace or new chat reset
    // By default the app launches in the home workspace if no chat is active, or we can clear selection
    await expect(mainWindow.getByTestId('chat-home-page')).toBeVisible({ timeout: 10000 })

    // Verify time-aware greeting contains "Mert"
    const greetingText = await mainWindow.getByTestId('chat-home-page').locator('h1').innerText()
    expect(greetingText).toContain('Mert')

    // Verify suggestions grid is visible
    await expect(mainWindow.getByText('Suggestions')).toBeVisible()

    // Click on suggestion chip and verify it populates the composer
    const planChip = mainWindow.getByTestId('suggestion-plan-a-feature')
    if (await planChip.isVisible()) {
      await planChip.click()
      const textarea = mainWindow.getByTestId('message-textarea')
      const value = await textarea.inputValue()
      expect(value).toContain('plan the next feature')
    }

    expect(pageErrors.length).toBe(0)
    expect(await checkForErrorPage(mainWindow)).toBeNull()
  })
})
