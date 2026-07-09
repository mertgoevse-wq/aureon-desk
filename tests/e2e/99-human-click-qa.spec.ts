import { test, expect, waitForAppReady, checkForErrorPage } from './helpers/electronApp'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'

const SCREENSHOT_DIR = join(__dirname, '../../docs/qa-screenshots/human-click-qa')

// Helper function to capture screenshots into the correct directory
async function captureScreenshot(page: any, name: string) {
  if (!existsSync(SCREENSHOT_DIR)) {
    mkdirSync(SCREENSHOT_DIR, { recursive: true })
  }
  const path = join(SCREENSHOT_DIR, `${name}.png`)
  await page.screenshot({ path })
  console.log(`[QA] Captured screenshot: ${name}.png`)
}

test.describe('Aureon Desk — Human-Style Visible Manual Click QA', () => {
  test.beforeEach(async ({ mainWindow }) => {
    await waitForAppReady(mainWindow)
  })

  test('Perform human-style click QA across all screens and features', async ({ mainWindow, pageErrors, consoleErrors }) => {
    // Resize to 1366x768 first to check layout responsiveness
    console.log('[QA] Resizing window to 1366x768')
    await mainWindow.setViewportSize({ width: 1366, height: 768 })
    await mainWindow.waitForTimeout(500)
    await captureScreenshot(mainWindow, '01_shell_1366x768')

    // Maximize window (simulate via larger desktop resolution)
    console.log('[QA] Maximizing window to 1920x1080')
    await mainWindow.setViewportSize({ width: 1920, height: 1080 })
    await mainWindow.waitForTimeout(500)
    await captureScreenshot(mainWindow, '01_shell_1920x1080')

    // Note: The app uses native window frame controls now (no custom HTML buttons).


    // --- FLOW 1: Shell Sidebar Collapse/Expand ---
    console.log('[QA] Testing sidebar collapse and expand')
    const collapseBtn = mainWindow.locator('[aria-label="Collapse sidebar"]')
    if (await collapseBtn.isVisible()) {
      await collapseBtn.click()
      await mainWindow.waitForTimeout(500)
      await captureScreenshot(mainWindow, '01_shell_sidebar_collapsed')

      const expandBtn = mainWindow.locator('[aria-label="Expand sidebar"]')
      await expect(expandBtn).toBeVisible()
      await expandBtn.click()
      await mainWindow.waitForTimeout(500)
      await captureScreenshot(mainWindow, '01_shell_sidebar_expanded')
    }

    // --- FLOW 2: Studio Navigation & Card Clicks ---
    console.log('[QA] Testing Studio cards')
    await mainWindow.getByTestId('mode-studio').click()
    await expect(mainWindow.getByTestId('studio-page')).toBeVisible()
    await captureScreenshot(mainWindow, '02_studio_home')

    // Click cards and verify details/drawer appears
    const cards = [
      'build_app',
      'code_program',
      'generate_text',
      'generate_image',
      'generate_video',
      'generate_music',
      'analyze_file',
      'analyze_screen_video',
      'connect_apps',
      'automate_workflow'
    ]

    for (const cardId of cards) {
      console.log(`[QA] Clicking Studio card: ${cardId}`)
      const cardSelector = mainWindow.getByTestId(`studio-card-${cardId}`)
      await expect(cardSelector).toBeVisible()
      await cardSelector.click()
      await mainWindow.waitForTimeout(500)
      await captureScreenshot(mainWindow, `02_studio_card_${cardId}`)

      // Close drawer/modal if it opened
      const drawerCloseBtn = mainWindow.locator('[aria-label="Close drawer"]')
      if (await drawerCloseBtn.isVisible()) {
        await drawerCloseBtn.click()
        await mainWindow.waitForTimeout(200)
      }
    }

    // --- FLOW 3: Build App flow details ---
    console.log('[QA] Testing Build App Flow')
    const buildCard = mainWindow.getByTestId('studio-card-build_app')
    await buildCard.click()
    await mainWindow.waitForTimeout(500)

    // Check if prompt input is available inside the drawer
    const promptInput = mainWindow.getByTestId('studio-prompt-input')
    const startFlowBtn = mainWindow.getByTestId('studio-start-flow-btn')

    if (await promptInput.isVisible()) {
      await promptInput.fill('Build a tiny counter app with an increment button, reset button, ivory theme, and a visible heading.')
      await captureScreenshot(mainWindow, '03_build_app_drawer_filled')
      await expect(startFlowBtn).toBeEnabled()
      await startFlowBtn.click()
      await mainWindow.waitForTimeout(1000)
      await captureScreenshot(mainWindow, '03_build_app_flow_started')
    }

    // --- FLOW 4: Code mode & LivePreview ---
    console.log('[QA] Testing Code mode & LivePreview')
    await mainWindow.getByTestId('mode-code').click()
    await expect(mainWindow.getByTestId('preview-status')).toBeVisible({ timeout: 10000 })
    await captureScreenshot(mainWindow, '04_code_mode_home')

    // Run Coding Demo if available
    const templateSelect = await mainWindow.$('[data-testid="preview-template-select"]')
    if (templateSelect) {
      console.log('[QA] Running Coding Demo template')
      await templateSelect.selectOption({ label: 'Coding Demo' })
      await mainWindow.waitForTimeout(300)
      const createBtn = await mainWindow.$('[data-testid="preview-create-btn"]')
      if (createBtn) {
        await createBtn.click()
        // Wait for preview server start
        await mainWindow.waitForTimeout(5000)
        await captureScreenshot(mainWindow, '04_code_mode_preview_started')
        
        // Double check status and URL input
        const statusText = await mainWindow.getByTestId('preview-status').innerText().catch(() => '')
        console.log(`[QA] LivePreview Status: ${statusText}`)
      }
    }

    // --- FLOW 5: Chat composer, Model & Provider labels ---
    console.log('[QA] Testing Chat Workspace')
    await mainWindow.getByTestId('mode-chat').click()
    await mainWindow.waitForTimeout(500)
    await captureScreenshot(mainWindow, '05_chat_home')

    const newChatBtn = mainWindow.getByTestId('new-chat-button').first()
    if (await newChatBtn.isVisible()) {
      await newChatBtn.click()
      await mainWindow.waitForTimeout(500)
      await captureScreenshot(mainWindow, '05_chat_active')

      const messageTextarea = mainWindow.getByTestId('message-textarea')
      if (await messageTextarea.isVisible()) {
        await messageTextarea.fill('Hello from manual QA!')
        await captureScreenshot(mainWindow, '05_chat_textarea_filled')
        // Send message
        await messageTextarea.press('Enter')
        await mainWindow.waitForTimeout(1000)
        await captureScreenshot(mainWindow, '05_chat_message_sent')
      }
    }

    // --- FLOW 6: Settings & Providers ---
    console.log('[QA] Testing Settings and Providers')
    await mainWindow.getByTestId('nav-settings').click()
    await expect(mainWindow.getByTestId('settings-layout')).toBeVisible({ timeout: 5000 })
    await captureScreenshot(mainWindow, '06_settings_general')

    const providersNav = mainWindow.getByTestId('settings-nav-providers-models')
    await providersNav.click()
    await expect(mainWindow.getByRole('heading', { name: 'Providers & API Keys' })).toBeVisible()
    await captureScreenshot(mainWindow, '06_settings_providers_list')

    // Find and type key into OpenRouter card or input
    // Type fake key
    const openrouterKeyInput = mainWindow.locator('input[placeholder="sk-or-v1-..."]')
    if (await openrouterKeyInput.isVisible()) {
      await openrouterKeyInput.fill('sk-test-not-real')
      await captureScreenshot(mainWindow, '06_settings_provider_key_typed')
      
      const saveBtn = mainWindow.getByRole('button', { name: 'Save' }).first()
      if (await saveBtn.isVisible()) {
        await saveBtn.click()
        await mainWindow.waitForTimeout(500)
      }
      
      const testBtn = mainWindow.getByRole('button', { name: 'Test' }).first()
      if (await testBtn.isVisible()) {
        await testBtn.click()
        await mainWindow.waitForTimeout(1500)
        await captureScreenshot(mainWindow, '06_settings_provider_test_clicked')
      }
    }

    // --- FLOW 7: Tools & MCP ---
    console.log('[QA] Testing Tools and MCP')
    const toolsNav = mainWindow.getByTestId('settings-nav-tools-mcp')
    await toolsNav.click()
    await expect(mainWindow.getByRole('heading', { name: 'Tools & MCP' })).toBeVisible()
    await captureScreenshot(mainWindow, '07_tools_home')

    // Click Add MCP Server
    const addServerBtn = mainWindow.getByRole('button', { name: 'Add MCP Server' })
    if (await addServerBtn.isVisible()) {
      await addServerBtn.click()
      await mainWindow.waitForTimeout(500)
      await captureScreenshot(mainWindow, '07_tools_add_mcp_modal')

      // Close modal with ESC
      await mainWindow.keyboard.press('Escape')
      await mainWindow.waitForTimeout(300)
      
      const closeDialogBtn = mainWindow.locator('[aria-label="Close dialog"]')
      if (await closeDialogBtn.isVisible()) {
        await closeDialogBtn.click()
        await mainWindow.waitForTimeout(300)
      }
      await captureScreenshot(mainWindow, '07_tools_modal_closed_esc')
    }

    // --- FLOW 8: Vibe Coding ---
    console.log('[QA] Testing Vibe Coding')
    // Open Vibe Coding in sidebar
    await mainWindow.getByTestId('nav-prompts').click() // Or vibe coding route directly if nav-vibe exists
    // Let's navigate directly to /vibe to make sure we load it
    await mainWindow.evaluate(() => { window.location.hash = '#/vibe' })
    await mainWindow.waitForTimeout(500)
    await captureScreenshot(mainWindow, '08_vibe_coding_home')

    // --- FLOW 9: LivePreview direct ---
    console.log('[QA] Testing LivePreview Direct')
    await mainWindow.evaluate(() => { window.location.hash = '#/preview' })
    await mainWindow.waitForTimeout(500)
    await captureScreenshot(mainWindow, '09_livepreview_direct')

    // Stop sandbox server
    const stopBtn = mainWindow.getByTestId('preview-stop-btn')
    if (await stopBtn.isVisible() && await stopBtn.isEnabled()) {
      await stopBtn.click()
      await mainWindow.waitForTimeout(1000)
      await captureScreenshot(mainWindow, '09_livepreview_stopped')
    }

    // Record warnings or page errors if any
    console.log(`[QA] Page errors count: ${pageErrors.length}`)
    console.log(`[QA] Console errors count: ${consoleErrors.length}`)
  })
})
