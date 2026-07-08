import { test, expect, waitForAppReady, checkForErrorPage } from './helpers/electronApp'

test.describe('Aureon Desk — Code Mode Coding Workspace', () => {
  test.beforeEach(async ({ mainWindow }) => {
    await waitForAppReady(mainWindow)
  })

  test('navigates to Code mode and exercises the project files and live preview workspace', async ({ mainWindow, pageErrors }) => {
    // Navigate to Code mode page
    await mainWindow.getByTestId('mode-code').click()
    await expect(mainWindow.getByTestId('live-preview-panel')).toBeVisible({ timeout: 10000 })

    // Verify header title is visible
    await expect(mainWindow.getByRole('heading', { name: 'Code Mode' })).toBeVisible()

    // Verify project selector button is present
    await expect(mainWindow.getByTestId('project-selector-btn')).toBeVisible()

    // Verify source files and ignored files display
    await expect(mainWindow.getByText('src/App.tsx')).toBeVisible()
    await expect(mainWindow.getByText('.env')).toBeVisible()
    await expect(mainWindow.getByRole('button', { name: 'Run Coding Demo App' })).toBeVisible()

    // Verify warning block matches details
    await expect(mainWindow.getByText('Safety Policy:')).toBeVisible()

    // Fill coding task brief
    const brief = mainWindow.locator('textarea[placeholder*="What features do you want to code?"]')
    await expect(brief).toBeVisible()
    await brief.fill('Build a simple counter React component with increment and reset options')

    expect(pageErrors.length).toBe(0)
    expect(await checkForErrorPage(mainWindow)).toBeNull()
  })
})
