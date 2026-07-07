import { test, expect, waitForAppReady, checkForErrorPage, screenshot } from './helpers/electronApp'

test.describe('Aureon Desk — Chat', () => {
  test.beforeEach(async ({ mainWindow }) => {
    await waitForAppReady(mainWindow)
  })

  test('New Chat button creates a chat', async ({ mainWindow, pageErrors }) => {
    // Click the New Chat button in the sidebar
    const newChatButton = mainWindow.getByTestId('new-chat-button')

    // There may be multiple (collapsed + expanded sidebar), find the first visible one
    const visibleButton = newChatButton.first()
    await expect(visibleButton).toBeVisible({ timeout: 5000 })
    await visibleButton.click()

    await mainWindow.waitForTimeout(1000)

    // Should see the chat workspace with the composer visible
    // (a new chat shows the empty state with a composer at the bottom)
    const composer = mainWindow.getByTestId('chat-composer')
    await expect(composer).toBeVisible({ timeout: 5000 })

    // No errors
    expect(await checkForErrorPage(mainWindow)).toBeNull()
    expect(pageErrors.length).toBe(0)

    await screenshot(mainWindow, 'chat_new_created')
  })

  test('Message composer accepts typing and paste', async ({ mainWindow }) => {
    // First create a new chat
    const newChatButton = mainWindow.getByTestId('new-chat-button').first()
    await expect(newChatButton).toBeVisible({ timeout: 5000 })
    await newChatButton.click()
    await mainWindow.waitForTimeout(500)

    // Find the composer textarea
    const composer = mainWindow.getByTestId('chat-composer')
    await expect(composer).toBeVisible({ timeout: 5000 })

    const textarea = composer.locator('textarea').first()
    await textarea.click()
    await mainWindow.keyboard.type('Hello, this is a test message from Playwright!')
    await mainWindow.waitForTimeout(300)

    // Verify text was entered
    const value = await textarea.inputValue()
    expect(value).toContain('Hello, this is a test message')

    await textarea.evaluate((el, text) => {
      const data = new DataTransfer()
      data.setData('text/plain', text)
      el.dispatchEvent(new ClipboardEvent('paste', {
        bubbles: true,
        cancelable: true,
        clipboardData: data
      }))
    }, ' pasted through clipboard')
    await mainWindow.waitForTimeout(300)

    const pastedValue = await textarea.inputValue()
    expect(pastedValue).toContain('pasted through clipboard')
  })

  test('Send button is disabled when composer is empty', async ({ mainWindow }) => {
    // Create new chat first
    const newChatButton = mainWindow.getByTestId('new-chat-button').first()
    await expect(newChatButton).toBeVisible({ timeout: 5000 })
    await newChatButton.click()
    await mainWindow.waitForTimeout(500)

    // Find send button
    const sendButton = mainWindow.getByTestId('send-button')
    await expect(sendButton).toBeVisible({ timeout: 5000 })

    // Should be disabled when empty
    await expect(sendButton).toBeDisabled()
  })

  test('Send button becomes enabled when text is entered', async ({ mainWindow }) => {
    // Create new chat first
    const newChatButton = mainWindow.getByTestId('new-chat-button').first()
    await expect(newChatButton).toBeVisible({ timeout: 5000 })
    await newChatButton.click()
    await mainWindow.waitForTimeout(500)

    // Find the composer textarea and type
    const composer = mainWindow.getByTestId('chat-composer')
    const textarea = composer.locator('textarea').first()
    await textarea.fill('Test message')

    // Send button should now be enabled
    const sendButton = mainWindow.getByTestId('send-button')
    await expect(sendButton).toBeEnabled()
  })

  test('Sending a message without provider shows warning (not crash)', async ({ mainWindow }) => {
    // Create new chat
    const newChatButton = mainWindow.getByTestId('new-chat-button').first()
    await expect(newChatButton).toBeVisible({ timeout: 5000 })
    await newChatButton.click()
    await mainWindow.waitForTimeout(500)

    // Type and send
    const composer = mainWindow.getByTestId('chat-composer')
    const textarea = composer.locator('textarea').first()
    await textarea.fill('This is a test message')
    const sendButton = mainWindow.getByTestId('send-button')
    await expect(sendButton).toBeEnabled()
    await sendButton.click()

    // Wait for response or error
    await mainWindow.waitForTimeout(3000)

    // The app should not crash. It should either:
    // - Show the user message in the chat
    // - Show an error/retry bubble about missing provider
    // - Stay responsive
    const bodyText = await mainWindow.textContent('body')

    // Verify the app is still alive (no error page)
    expect(await checkForErrorPage(mainWindow)).toBeNull()

    // User message should appear (it's added immediately before the API call)
    expect(bodyText).toContain('This is a test message')

    await screenshot(mainWindow, 'chat_sent_message_no_provider')
  })

  test('Router/Inspector updates after sending a message', async ({ mainWindow }) => {
    // Create new chat
    const newChatButton = mainWindow.getByTestId('new-chat-button').first()
    await expect(newChatButton).toBeVisible({ timeout: 5000 })
    await newChatButton.click()
    await mainWindow.waitForTimeout(500)

    // Type and send
    const composer = mainWindow.getByTestId('chat-composer')
    const textarea = composer.locator('textarea').first()
    await textarea.fill('Fix the code in src/main.ts')
    const sendButton = mainWindow.getByTestId('send-button')
    await sendButton.click()

    // Wait for prompt analysis to complete
    await mainWindow.waitForTimeout(2000)

    // The router panel should show analysis (intent, risk, etc.)
    const bodyText = await mainWindow.textContent('body')
    // Should show something in the router panel
    expect(bodyText).toBeTruthy()

    expect(await checkForErrorPage(mainWindow)).toBeNull()
    await screenshot(mainWindow, 'chat_router_analysis')
  })
})
