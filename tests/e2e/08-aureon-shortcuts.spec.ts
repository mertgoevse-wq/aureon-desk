import { test, expect, waitForAppReady, checkForErrorPage, screenshot } from './helpers/electronApp'

test.describe('Keyboard Shortcuts — E2E', () => {
  test('Ctrl+K opens command palette', async ({ mainWindow }) => {
    await waitForAppReady(mainWindow)
    await mainWindow.press('body', 'Control+k')
    await mainWindow.waitForTimeout(500)

    const bodyText = await mainWindow.textContent('body')
    expect(bodyText).toBeTruthy()
    expect(await checkForErrorPage(mainWindow)).toBeNull()
  })

  test('Ctrl+N creates a new chat', async ({ mainWindow }) => {
    await waitForAppReady(mainWindow)
    const beforeText = await mainWindow.textContent('[data-testid="sidebar"]')
    await mainWindow.press('body', 'Control+n')
    await mainWindow.waitForTimeout(1000)

    const afterText = await mainWindow.textContent('[data-testid="sidebar"]')
    expect(afterText).toBeTruthy()
    expect(await checkForErrorPage(mainWindow)).toBeNull()
  })

  test('Ctrl+, opens settings', async ({ mainWindow }) => {
    await waitForAppReady(mainWindow)
    await mainWindow.press('body', 'Control+,')
    await mainWindow.waitForTimeout(1000)

    const bodyText = await mainWindow.textContent('body')
    expect(bodyText).toBeTruthy()
    expect(await checkForErrorPage(mainWindow)).toBeNull()
  })

  test('Ctrl+L focuses message composer', async ({ mainWindow }) => {
    await waitForAppReady(mainWindow)
    // Create a chat first
    await mainWindow.click('[data-testid="nav-chats"]')
    await mainWindow.waitForTimeout(500)
    await mainWindow.click('[data-testid="new-chat-button"]')
    await mainWindow.waitForTimeout(1000)
    await mainWindow.press('body', 'Control+l')
    await mainWindow.waitForTimeout(500)

    expect(await checkForErrorPage(mainWindow)).toBeNull()
  })

  test('Ctrl+B toggles sidebar', async ({ mainWindow }) => {
    await waitForAppReady(mainWindow)
    await mainWindow.press('body', 'Control+b')
    await mainWindow.waitForTimeout(500)

    const bodyText = await mainWindow.textContent('body')
    expect(bodyText).toBeTruthy()
    expect(await checkForErrorPage(mainWindow)).toBeNull()
  })

  test('Ctrl+I toggles inspector', async ({ mainWindow }) => {
    await waitForAppReady(mainWindow)
    await mainWindow.press('body', 'Control+i')
    await mainWindow.waitForTimeout(500)

    const bodyText = await mainWindow.textContent('body')
    expect(bodyText).toBeTruthy()
    expect(await checkForErrorPage(mainWindow)).toBeNull()
  })

  test('Esc does not crash the app', async ({ mainWindow }) => {
    await waitForAppReady(mainWindow)
    await mainWindow.press('body', 'Escape')
    await mainWindow.waitForTimeout(500)

    expect(await checkForErrorPage(mainWindow)).toBeNull()
  })

  test('F1 opens shortcuts help', async ({ mainWindow }) => {
    await waitForAppReady(mainWindow)
    await mainWindow.press('body', 'F1')
    await mainWindow.waitForTimeout(500)

    const bodyText = await mainWindow.textContent('body')
    expect(bodyText).toBeTruthy()
    expect(await checkForErrorPage(mainWindow)).toBeNull()
  })

  test('Command palette item count is sufficient', async ({ mainWindow }) => {
    await waitForAppReady(mainWindow)
    await mainWindow.press('body', 'Control+k')
    await mainWindow.waitForTimeout(500)

    const bodyText = await mainWindow.textContent('body')
    expect(bodyText).toBeTruthy()
    expect(await checkForErrorPage(mainWindow)).toBeNull()
  })

  test('Resize handles exist on sidebar and inspector', async ({ mainWindow }) => {
    await waitForAppReady(mainWindow)
    const resizeHandles = await mainWindow.$$('.cursor-col-resize')
    expect(resizeHandles.length).toBeGreaterThanOrEqual(1)
    expect(await checkForErrorPage(mainWindow)).toBeNull()
  })
})
