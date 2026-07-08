import { test, expect, waitForAppReady, checkForErrorPage } from './helpers/electronApp'

test.describe('Aureon Desk — Custom Window Controls & Topbar Navigation', () => {
  test.beforeEach(async ({ mainWindow }) => {
    await waitForAppReady(mainWindow)
  })

  test('topbar navigation and custom window controls are visible', async ({ mainWindow, pageErrors }) => {
    // Verify custom titlebar buttons are rendered
    await expect(mainWindow.getByTestId('win-minimize')).toBeVisible()
    await expect(mainWindow.getByTestId('win-maximize')).toBeVisible()
    await expect(mainWindow.getByTestId('win-close')).toBeVisible()

    // Verify back/forward controls are visible
    await expect(mainWindow.getByLabel('Go back')).toBeVisible()
    await expect(mainWindow.getByLabel('Go forward')).toBeVisible()

    // Click back button (should do nothing since there's no history, but should not crash)
    await mainWindow.getByLabel('Go back').click()

    // Switch modes and check that back button can be clicked
    await mainWindow.getByTestId('mode-cowork').click()
    await expect(mainWindow.getByTestId('cowork-page')).toBeVisible()

    await mainWindow.getByLabel('Go back').click()
    // Wait for route transition
    await mainWindow.waitForTimeout(300)

    expect(pageErrors.length).toBe(0)
    expect(await checkForErrorPage(mainWindow)).toBeNull()
  })
})
