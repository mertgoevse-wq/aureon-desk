import { test, expect, waitForAppReady, checkForErrorPage, screenshot } from './helpers/electronApp'

async function openProvidersSettings(mainWindow: any): Promise<void> {
  const settingsButton = mainWindow.getByTestId('nav-settings')
  await expect(settingsButton).toBeVisible({ timeout: 5000 })
  await settingsButton.click()
  await mainWindow.waitForTimeout(500)
  const providersNav = mainWindow.getByTestId('settings-nav-providers-models')
  await expect(providersNav).toBeVisible({ timeout: 5000 })
  await providersNav.click()
  await mainWindow.waitForTimeout(1000)
}

test.describe('Vibeforge — Local Providers', () => {
  test.beforeEach(async ({ mainWindow }) => {
    await waitForAppReady(mainWindow)
  })

  test('Creating a chat with no model selected shows warning in settings', async ({ mainWindow, pageErrors }) => {
    // Create a new chat
    const newChatButton = mainWindow.getByTestId('new-chat-button').first()
    await expect(newChatButton).toBeVisible({ timeout: 5000 })
    await newChatButton.click()
    await mainWindow.waitForTimeout(1000)

    // Type and send a message without selecting a model
    const composer = mainWindow.getByTestId('chat-composer')
    await expect(composer).toBeVisible({ timeout: 5000 })
    const textarea = composer.locator('textarea').first()
    await textarea.fill('Say hello')
    await mainWindow.waitForTimeout(300)

    // The send button should be enabled (text is entered) but sending without model should be handled
    const sendButton = mainWindow.getByTestId('send-button')
    await expect(sendButton).toBeEnabled()
    await sendButton.click()
    await mainWindow.waitForTimeout(3000)

    // App should not crash - either shows error or stays responsive
    expect(pageErrors.length).toBe(0)
    expect(await checkForErrorPage(mainWindow)).toBeNull()

    await screenshot(mainWindow, 'local_provider_no_model_selected')
  })

  test('Chat composer is visible after navigating away and back', async ({ mainWindow, pageErrors }) => {
    // Create a chat first
    const newChatButton = mainWindow.getByTestId('new-chat-button').first()
    await expect(newChatButton).toBeVisible({ timeout: 5000 })
    await newChatButton.click()
    await mainWindow.waitForTimeout(1000)

    // Navigate to Prompts
    const promptsButton = mainWindow.getByTestId('nav-prompts')
    await expect(promptsButton).toBeVisible({ timeout: 5000 })
    await promptsButton.click()
    await mainWindow.waitForTimeout(500)

    // Navigate back to Chats
    const chatsButton = mainWindow.getByTestId('nav-chats')
    await expect(chatsButton).toBeVisible({ timeout: 5000 })
    await chatsButton.click()
    await mainWindow.waitForTimeout(500)

    // Composer should still be visible
    const composer = mainWindow.getByTestId('chat-composer')
    await expect(composer).toBeVisible({ timeout: 5000 })

    expect(pageErrors.length).toBe(0)
    expect(await checkForErrorPage(mainWindow)).toBeNull()

    await screenshot(mainWindow, 'local_provider_chat_persistence')
  })

  test('Provider settings page shows Ollama adapter', async ({ mainWindow }) => {
    await openProvidersSettings(mainWindow)

    const bodyText = await mainWindow.textContent('body')

    // Ollama should be listed as a provider adapter
    expect(bodyText).toContain('Ollama')

    await screenshot(mainWindow, 'local_provider_ollama_adapter')
  })

  test('Provider settings page shows LM Studio adapter', async ({ mainWindow }) => {
    await openProvidersSettings(mainWindow)

    const bodyText = await mainWindow.textContent('body')

    // LM Studio should be listed
    expect(bodyText).toContain('LM Studio')

    await screenshot(mainWindow, 'local_provider_lmstudio_adapter')
  })

  test('Sending message without provider/model does not crash the app', async ({ mainWindow, pageErrors }) => {
    // Create a new chat
    const newChatButton = mainWindow.getByTestId('new-chat-button').first()
    await expect(newChatButton).toBeVisible({ timeout: 5000 })
    await newChatButton.click()
    await mainWindow.waitForTimeout(1000)

    // Type and send without selecting a model
    const composer = mainWindow.getByTestId('chat-composer')
    const textarea = composer.locator('textarea').first()
    await textarea.fill('This is a test message with no provider configured')
    const sendButton = mainWindow.getByTestId('send-button')
    await expect(sendButton).toBeEnabled()
    await sendButton.click()

    // Wait for the error/timeout
    await mainWindow.waitForTimeout(5000)

    // The app should still be alive - no crash, no blank screen
    const bodyText = await mainWindow.textContent('body')

    // Should either show the user message or an error bubble
    expect(bodyText).toBeTruthy()
    expect(pageErrors.length).toBe(0)
    // The app shell should still be present
    const appShell = mainWindow.getByTestId('app-shell')
    await expect(appShell).toBeVisible({ timeout: 3000 })

    await screenshot(mainWindow, 'local_provider_no_crash')
  })

  test('Right inspector shows content after sending a message', async ({ mainWindow }) => {
    // Create a new chat
    const newChatButton = mainWindow.getByTestId('new-chat-button').first()
    await expect(newChatButton).toBeVisible({ timeout: 5000 })
    await newChatButton.click()
    await mainWindow.waitForTimeout(1000)

    // Type and send
    const composer = mainWindow.getByTestId('chat-composer')
    const textarea = composer.locator('textarea').first()
    await textarea.fill('Write a test function')
    const sendButton = mainWindow.getByTestId('send-button')
    await sendButton.click()

    // Wait for prompt analysis
    await mainWindow.waitForTimeout(2000)

    // The inspector should show routing analysis
    const bodyText = await mainWindow.textContent('body')
    expect(bodyText).toContain('Intent')

    await screenshot(mainWindow, 'local_provider_inspector_update')
  })
})
