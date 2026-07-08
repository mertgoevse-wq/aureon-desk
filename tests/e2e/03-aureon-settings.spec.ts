import type { Page } from '@playwright/test'
import { test, expect, waitForAppReady, checkForErrorPage, screenshot } from './helpers/electronApp'

async function openProviderSettings(mainWindow: Page): Promise<void> {
  const settingsButton = mainWindow.getByTestId('nav-settings')
  await expect(settingsButton).toBeVisible({ timeout: 5000 })
  await settingsButton.click()
  await mainWindow.waitForTimeout(500)
  const providersNav = mainWindow.getByTestId('settings-nav-providers-models')
  await expect(providersNav).toBeVisible({ timeout: 5000 })
  await providersNav.click()
  await mainWindow.waitForTimeout(1000)
}

test.describe('Aureon Desk — Settings & Providers', () => {
  test.beforeEach(async ({ mainWindow }) => {
    await waitForAppReady(mainWindow)
  })

  test('Settings page shows provider cards', async ({ mainWindow, pageErrors }) => {
    await openProviderSettings(mainWindow)
    const bodyText = await mainWindow.textContent('body')

    // Should contain provider-related text
    expect(bodyText).toContain('Providers')
    expect(bodyText).toContain('API')

    // No errors on settings page
    expect(pageErrors.length).toBe(0)
    expect(await checkForErrorPage(mainWindow)).toBeNull()

    await screenshot(mainWindow, 'settings_providers')
  })

  test('Settings page mentions key encryption/security', async ({ mainWindow }) => {
    await openProviderSettings(mainWindow)

    const bodyText = await mainWindow.textContent('body')

    // Should mention encryption or security
    // The current tokens page mentions DPAPI or OS credentials
    expect(bodyText).toMatch(/encrypt|DPAPI|OS credential|Key configured/i)
  })

  test('Provider cards show adapter information', async ({ mainWindow }) => {
    await openProviderSettings(mainWindow)

    const bodyText = await mainWindow.textContent('body')

    // Should list at least one known provider type
    const knownProviders = ['OpenAI', 'Anthropic', 'Ollama', 'LM Studio', 'OpenRouter', 'Gemini']
    const found = knownProviders.some(name => bodyText?.includes(name))
    expect(found).toBe(true)
  })

  test('Provider Test Center shows test actions and status labels', async ({ mainWindow }) => {
    await openProviderSettings(mainWindow)

    await expect(mainWindow.getByText('Provider Test Center')).toBeVisible({ timeout: 5000 })
    await expect(mainWindow.getByRole('button', { name: /Test All/i })).toBeVisible()

    const bodyText = await mainWindow.textContent('body')
    expect(bodyText).toContain('Not tested yet.')
    expect(bodyText).toMatch(/Missing key|Key stored|No key needed/)
  })

  test('Provider API key inputs accept typing and paste', async ({ mainWindow }) => {
    await openProviderSettings(mainWindow)

    const keyInput = mainWindow.locator('input[placeholder^="Enter your"]').first()
    await expect(keyInput).toBeVisible({ timeout: 5000 })

    await keyInput.click({ position: { x: 20, y: 10 } })
    await mainWindow.keyboard.type('provider-typed-ok')
    await expect(keyInput).toHaveValue('provider-typed-ok')

    await keyInput.evaluate((el, text) => {
      const data = new DataTransfer()
      data.setData('text/plain', text)
      el.dispatchEvent(new ClipboardEvent('paste', {
        bubbles: true,
        cancelable: true,
        clipboardData: data
      }))
    }, '-provider-pasted-ok')
    await expect(keyInput).toHaveValue('provider-typed-ok-provider-pasted-ok')
  })

  test('Add custom provider UI is accessible', async ({ mainWindow, pageErrors }) => {
    await openProviderSettings(mainWindow)

    // Look for the "Add Custom" button
    const addCustomButton = mainWindow.getByText('Add Custom')
    const count = await addCustomButton.count()

    if (count > 0) {
      await addCustomButton.first().click()
      await mainWindow.waitForTimeout(500)

      // The custom provider form should appear
      const displayNameInput = mainWindow.getByPlaceholder('My Provider')
      const count2 = await displayNameInput.count()
      expect(count2).toBeGreaterThan(0)

      await screenshot(mainWindow, 'settings_custom_provider_form')

      // Close the form
      const closeButton = mainWindow.locator('button').filter({ hasText: /^(×|X)$/ })
      const closeCount = await closeButton.count()
      if (closeCount > 0) {
        // The X button — find by role or position
        await mainWindow.keyboard.press('Escape')
      }
    }

    expect(pageErrors.length).toBe(0)
    expect(await checkForErrorPage(mainWindow)).toBeNull()
  })

  test('Appearance settings page loads', async ({ mainWindow, pageErrors }) => {
    // Navigate to Settings first
    const settingsButton = mainWindow.getByTestId('nav-settings')
    await expect(settingsButton).toBeVisible({ timeout: 5000 })
    await settingsButton.click()
    await mainWindow.waitForTimeout(1000)

    // Try to find and click appearance tab/button
    const appearanceLink = mainWindow.getByText('Appearance')
    const count = await appearanceLink.count()
    if (count > 0) {
      await appearanceLink.first().click()
      await mainWindow.waitForTimeout(1000)

      const bodyText = await mainWindow.textContent('body')
      expect(bodyText).toContain('Color Palette')

      await screenshot(mainWindow, 'settings_appearance')
    }

    expect(pageErrors.length).toBe(0)
    expect(await checkForErrorPage(mainWindow)).toBeNull()
  })

  test('No API keys are visible in DOM text by default', async ({ mainWindow }) => {
    await openProviderSettings(mainWindow)

    const bodyText = await mainWindow.textContent('body')

    // Should not contain raw API key patterns like sk-... (OpenAI) or sk-ant-... (Anthropic)
    // unless they're properly masked
    const rawKeyPatterns = [
      /sk-[a-zA-Z0-9]{20,}/,
      /sk-ant-[a-zA-Z0-9]{20,}/,
      /AIza[a-zA-Z0-9_-]{20,}/
    ]

    for (const pattern of rawKeyPatterns) {
      expect(bodyText).not.toMatch(pattern)
    }
  })
})
