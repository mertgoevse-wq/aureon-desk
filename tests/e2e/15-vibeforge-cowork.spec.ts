import { test, expect, waitForAppReady, checkForErrorPage } from './helpers/electronApp'

test.describe('Vibeforge — Cowork Safe Agent Dashboard', () => {
  test.beforeEach(async ({ mainWindow }) => {
    await waitForAppReady(mainWindow)
  })

  test('navigates to Cowork and exercises the task composer and permissions dashboard', async ({ mainWindow, pageErrors }) => {
    // Navigate to Cowork page
    await mainWindow.getByTestId('mode-cowork').click()
    await expect(mainWindow.getByTestId('cowork-page')).toBeVisible({ timeout: 10000 })

    // Verify header title is visible
    await expect(mainWindow.getByRole('heading', { name: 'Cowork Mode' })).toBeVisible()

    // Verify safe permission toggles are present and unchecked by default
    const browserToggle = mainWindow.getByTestId('toggle-browser-use')
    const computerToggle = mainWindow.getByTestId('toggle-computer-use')
    const shellToggle = mainWindow.getByTestId('toggle-shell-commands')

    await expect(browserToggle).not.toBeChecked()
    await expect(computerToggle).not.toBeChecked()
    await expect(shellToggle).not.toBeChecked()

    // Verify denied apps section displays
    await expect(mainWindow.getByTestId('denied-apps-card')).toBeVisible()
    await expect(mainWindow.getByText('Google Chrome Passwords')).toBeVisible()

    // Compose a task and submit it
    const composer = mainWindow.getByTestId('cowork-task-composer')
    await composer.fill('Verify secure storage files inside config directory')

    const createBtn = mainWindow.getByTestId('create-task-btn')
    await expect(createBtn).toBeEnabled()
    await createBtn.click()

    // Verify the task is added to list and is in "Ready" status
    const taskButton = mainWindow.getByRole('button', { name: 'Verify secure storage files inside config directory READY' })
    await expect(taskButton).toBeVisible()

    // Start/dispatch the task
    const dispatchBtn = mainWindow.getByRole('button', { name: 'Dispatch Task' })
    await expect(dispatchBtn).toBeVisible()
    await dispatchBtn.click()

    // Verify it transitions to Running state
    const runningButton = mainWindow.getByRole('button', { name: 'Verify secure storage files inside config directory RUNNING' })
    await expect(runningButton).toBeVisible()

    // Wait for the task to trigger approval card (should take ~2 seconds in simulation)
    const approvalCard = mainWindow.getByTestId('approval-card')
    await expect(approvalCard).toBeVisible({ timeout: 5000 })

    // Click Approve
    const approveBtn = mainWindow.getByTestId('approve-task-btn')
    await approveBtn.click()

    // Verify task is completed
    const completedButton = mainWindow.getByRole('button', { name: 'Verify secure storage files inside config directory COMPLETED' })
    await expect(completedButton).toBeVisible()

    expect(pageErrors.length).toBe(0)
    expect(await checkForErrorPage(mainWindow)).toBeNull()
  })
})
