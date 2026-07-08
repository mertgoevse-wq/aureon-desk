import { test, expect, waitForAppReady, checkForErrorPage } from './helpers/electronApp'

test.describe('Aureon Desk — Premium Settings Redesign E2E', () => {
  test.beforeEach(async ({ mainWindow }) => {
    await waitForAppReady(mainWindow)
  })

  test('navigates through redesigned settings, checks categories and toggles', async ({ mainWindow, pageErrors }) => {
    // Navigate to Settings
    await mainWindow.getByTestId('nav-settings').click()
    await expect(mainWindow.getByTestId('settings-layout')).toBeVisible({ timeout: 10000 })

    // Verify category Nav items render
    await expect(mainWindow.getByTestId('settings-nav-general')).toBeVisible()
    await expect(mainWindow.getByTestId('settings-nav-providers-models')).toBeVisible()
    await expect(mainWindow.getByTestId('settings-nav-capabilities')).toBeVisible()
    await expect(mainWindow.getByTestId('settings-nav-developer')).toBeVisible()

    // 1. General settings
    await mainWindow.getByTestId('settings-nav-general').click()
    await expect(mainWindow.getByTestId('settings-general-page')).toBeVisible()
    await expect(mainWindow.getByTestId('row-startup')).toBeVisible()
    await expect(mainWindow.getByTestId('row-default-mode')).toBeVisible()

    // 2. Capabilities settings
    await mainWindow.getByTestId('settings-nav-capabilities').click()
    await expect(mainWindow.getByTestId('settings-capabilities-page')).toBeVisible()
    await expect(mainWindow.getByTestId('row-browser-use')).toBeVisible()
    await expect(mainWindow.getByTestId('row-fs-access')).toContainText('Project-Only')
    await expect(mainWindow.getByTestId('row-shell-commands')).toContainText('Approval Required')

    // 3. Developer settings
    await mainWindow.getByTestId('settings-nav-developer').click()
    await expect(mainWindow.getByTestId('settings-developer-page')).toBeVisible()
    await expect(mainWindow.getByTestId('row-app-data-path')).toBeVisible()
    await expect(mainWindow.getByTestId('row-database-path')).toBeVisible()
    await expect(mainWindow.getByTestId('export-debug-btn')).toBeVisible()

    expect(pageErrors.length).toBe(0)
    expect(await checkForErrorPage(mainWindow)).toBeNull()
  })
})
