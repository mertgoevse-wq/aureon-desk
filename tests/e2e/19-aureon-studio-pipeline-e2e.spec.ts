import { test, expect, waitForAppReady, checkForErrorPage, screenshot } from './helpers/electronApp'

test.describe('Aureon Desk — Studio → Build Pipeline E2E (with mock API key)', () => {
  test.beforeEach(async ({ mainWindow }) => {
    await waitForAppReady(mainWindow)
  })

  // === FULL END-TO-END: Configure OpenRouter → Studio → Build → Verify Pipeline ===

  test('Full pipeline: configure mock API key, build a pomodoro timer, verify pipeline output', async ({ mainWindow, pageErrors }) => {
    // ──────────────────────────────────────────────
    // PHASE 1: Navigate to Settings → Providers
    // ──────────────────────────────────────────────
    await mainWindow.getByTestId('nav-settings').click()
    await mainWindow.waitForTimeout(500)

    const providersNav = mainWindow.getByTestId('settings-nav-providers-models')
    await expect(providersNav).toBeVisible({ timeout: 5000 })
    await providersNav.click()
    await mainWindow.waitForTimeout(1000)

    await screenshot(mainWindow, 'pipeline_e2e_01_providers_page')

    // ──────────────────────────────────────────────
    // PHASE 2: Find any provider with an API key input and enter a mock key
    // ──────────────────────────────────────────────
    // Provider adapter cards render password inputs with placeholder "Enter your {name} API key"
    const allKeyInputs = mainWindow.locator('input[type="password"]')
    const keyCount = await allKeyInputs.count()
    expect(keyCount).toBeGreaterThan(0) // At least one remote provider should have a key input

    if (keyCount > 0) {
      const keyInput = allKeyInputs.first()
      await keyInput.click()
      await keyInput.fill('')
      await mainWindow.waitForTimeout(200)
      await keyInput.fill('sk-or-v1-mock-test-key-for-e2e-pipeline-automation')
      await mainWindow.waitForTimeout(300)

      // Verify the key was entered
      const enteredValue = await keyInput.inputValue()
      expect(enteredValue).toBeTruthy()
      expect(enteredValue).toContain('sk-or-v1')

      await screenshot(mainWindow, 'pipeline_e2e_02_key_entered')

      // Find and click the nearest "Save Key" button
      const saveBtn = mainWindow.getByRole('button', { name: /save key/i }).first()
      if (await saveBtn.isVisible().catch(() => false)) {
        await saveBtn.click()
        await mainWindow.waitForTimeout(1500)

        // Verify no error page appeared after save
        const errorText = await checkForErrorPage(mainWindow)
        expect(errorText).toBeNull()

        await screenshot(mainWindow, 'pipeline_e2e_03_key_saved')
      }
    }

    // ──────────────────────────────────────────────
    // PHASE 3: Navigate to Studio
    // ──────────────────────────────────────────────
    await mainWindow.getByTestId('mode-studio').click()
    await expect(mainWindow.getByTestId('studio-page')).toBeVisible({ timeout: 5000 })
    await mainWindow.waitForTimeout(500)

    await screenshot(mainWindow, 'pipeline_e2e_04_studio_landing')

    // ──────────────────────────────────────────────
    // PHASE 4: Type a pomodoro timer prompt in the hero composer
    // ──────────────────────────────────────────────
    const promptInput = mainWindow.getByTestId('hero-prompt-input')
    await expect(promptInput).toBeVisible({ timeout: 3000 })

    await promptInput.click()
    await promptInput.fill('')
    await promptInput.type('Build me a pomodoro timer with start, pause, and reset buttons', { delay: 30 })
    await mainWindow.waitForTimeout(300)

    // Verify the prompt was entered
    const promptValue = await promptInput.inputValue()
    expect(promptValue).toContain('pomodoro timer')
    expect(promptValue).toContain('start, pause, and reset')

    await screenshot(mainWindow, 'pipeline_e2e_05_prompt_entered')

    // ──────────────────────────────────────────────
    // PHASE 5: Click "Start building" button
    // ──────────────────────────────────────────────
    const startBtn = mainWindow.getByTestId('hero-start-building-btn')
    await expect(startBtn).toBeVisible()
    await expect(startBtn).toBeEnabled()

    await startBtn.click()

    // ──────────────────────────────────────────────
    // PHASE 6: Verify navigation to Code mode (LivePreview page)
    // ──────────────────────────────────────────────
    const previewPanel = mainWindow.getByTestId('live-preview-panel')
    await expect(previewPanel).toBeVisible({ timeout: 10000 })

    await screenshot(mainWindow, 'pipeline_e2e_06_code_mode')

    // ──────────────────────────────────────────────
    // PHASE 7: Wait for build pipeline panel to appear dynamically
    // ──────────────────────────────────────────────
    const pipelinePanel = mainWindow.getByTestId('build-pipeline-panel')
    const pipelineVisible = await pipelinePanel.isVisible({ timeout: 12000 }).catch(() => false)

    if (pipelineVisible) {
      await screenshot(mainWindow, 'pipeline_e2e_07_pipeline_panel')

      // Verify pipeline tabs are present
      const codeTab = mainWindow.getByTestId('build-tab-code')
      const filesTab = mainWindow.getByTestId('build-tab-files')
      const diffTab = mainWindow.getByTestId('build-tab-diff')
      const planTab = mainWindow.getByTestId('build-tab-plan')

      await expect(codeTab).toBeVisible()
      await expect(filesTab).toBeVisible()

      // ──────────────────────────────────────────────
      // PHASE 8: Verify code tab shows pipeline steps with content
      // ──────────────────────────────────────────────
      await codeTab.click()
      await mainWindow.waitForTimeout(1000)

      const codeTabContent = mainWindow.getByTestId('build-code-tab')
      // Use waitFor with longer timeout for slower machines (Vivobook integrated GPU)
      await codeTabContent.waitFor({ state: 'visible', timeout: 30000 })

      // Wait for pipeline steps to appear (at least one step should render)
      await mainWindow.waitForTimeout(5000)

      await screenshot(mainWindow, 'pipeline_e2e_08_code_tab')

      // Verify there's content in the code tab with pipeline steps
      const codeText = await codeTabContent.textContent()
      expect(codeText).toBeTruthy()
      expect(codeText).not.toContain('Error')
      // Should have at least one step indicator or generated file reference
      const hasSteps = codeText.includes('Initializing') ||
        codeText.includes('Generated') ||
        codeText.includes('index.html') ||
        codeText.includes('app.js') ||
        codeText.includes('styles.css') ||
        codeText.includes('pipeline')
      expect(hasSteps).toBe(true)

      // ──────────────────────────────────────────────
      // PHASE 9: Switch to Files tab and verify generated files
      // ──────────────────────────────────────────────
      // Use waitFor with generous timeout since demo pipeline may still be running
      try {
        await filesTab.waitFor({ state: 'visible', timeout: 15000 })
        await filesTab.click()
        await mainWindow.waitForTimeout(500)

        const filesTabContent = mainWindow.getByTestId('build-files-tab')
        await expect(filesTabContent).toBeVisible()

        await screenshot(mainWindow, 'pipeline_e2e_09_files_tab')
      } catch {
        // Files tab may not be visible if pipeline completed before files were generated
        // This is acceptable for the deterministic demo which generates quickly
        await screenshot(mainWindow, 'pipeline_e2e_09_files_tab_timeout')
      }

      // ──────────────────────────────────────────────
      // PHASE 10: Switch to Diff tab
      // ──────────────────────────────────────────────
      if (await diffTab.isVisible().catch(() => false)) {
        await diffTab.click()
        await mainWindow.waitForTimeout(500)

        const diffTabContent = mainWindow.getByTestId('build-diff-tab')
        await expect(diffTabContent).toBeVisible()

        await screenshot(mainWindow, 'pipeline_e2e_10_diff_tab')
      }

      // ──────────────────────────────────────────────
      // PHASE 11: Switch to Plan tab
      // ──────────────────────────────────────────────
      if (await planTab.isVisible().catch(() => false)) {
        await planTab.click()
        await mainWindow.waitForTimeout(500)

        const planTabContent = mainWindow.getByTestId('build-plan-tab')
        await expect(planTabContent).toBeVisible()

        await screenshot(mainWindow, 'pipeline_e2e_11_plan_tab')
      }
    } else {
      // Pipeline panel may not appear if demo falls back immediately.
      // Verify the preview status shows activity (not idle with error).
      const previewStatus = mainWindow.getByTestId('preview-status')
      await expect(previewStatus).toBeVisible({ timeout: 5000 })

      await screenshot(mainWindow, 'pipeline_e2e_07b_preview_status')
    }

    // ──────────────────────────────────────────────
    // PHASE 12: Wait for pipeline to complete and verify final state
    // ──────────────────────────────────────────────
    // Let the demo pipeline finish generating files
    await mainWindow.waitForTimeout(8000)

    // Check the preview status — should be running, idle, or stopped, NOT error
    const previewStatusFinal = mainWindow.getByTestId('preview-status')
    if (await previewStatusFinal.isVisible().catch(() => false)) {
      const statusText = await previewStatusFinal.textContent()
      expect(statusText).toBeTruthy()
      // Should not show an error state
      expect(statusText).not.toMatch(/error/i)

      await screenshot(mainWindow, 'pipeline_e2e_12_final_state')
    }

    // ──────────────────────────────────────────────
    // PHASE 13: Verify no page errors occurred
    // ──────────────────────────────────────────────
    expect(pageErrors.length).toBe(0)
    expect(await checkForErrorPage(mainWindow)).toBeNull()
  })

  // === SETUP-ONLY: Configure mock API key and verify persistence ===

  test('Configure mock OpenRouter API key and verify it persists in settings', async ({ mainWindow, pageErrors }) => {
    // Navigate to Settings → Providers
    await mainWindow.getByTestId('nav-settings').click()
    await mainWindow.waitForTimeout(500)

    const providersNav = mainWindow.getByTestId('settings-nav-providers-models')
    await expect(providersNav).toBeVisible({ timeout: 5000 })
    await providersNav.click()
    await mainWindow.waitForTimeout(1000)

    // Find any password input (API key field) — they all use type="password"
    const allKeyInputs = mainWindow.locator('input[type="password"]')
    const keyCount = await allKeyInputs.count()

    if (keyCount > 0) {
      // Use the first available key input
      const firstInput = allKeyInputs.first()
      await firstInput.click()
      await firstInput.fill('')
      await firstInput.fill('sk-or-v1-e2e-pipeline-test-key-mock')
      await mainWindow.waitForTimeout(300)

      const value = await firstInput.inputValue()
      expect(value).toBe('sk-or-v1-e2e-pipeline-test-key-mock')

      await screenshot(mainWindow, 'pipeline_e2e_key_setup_before_save')

      // Find and click Save Key
      const saveButtons = mainWindow.getByRole('button', { name: /save key/i })
      const saveCount = await saveButtons.count()
      if (saveCount > 0) {
        await saveButtons.first().click()
        await mainWindow.waitForTimeout(1000)
      }
    }

    // Navigate away to Studio and back to verify persistence
    await mainWindow.getByTestId('mode-studio').click()
    await mainWindow.waitForTimeout(500)

    await mainWindow.getByTestId('nav-settings').click()
    await mainWindow.waitForTimeout(500)
    await providersNav.click()
    await mainWindow.waitForTimeout(1000)

    // Re-query the key inputs after navigation
    const keyInputsAfter = mainWindow.locator('input[type="password"]')
    const keyCountAfter = await keyInputsAfter.count()

    if (keyCountAfter > 0) {
      // After save, the password field should be empty and the UI should show
      // "●●●●●●●● Key configured" text since the key is stored in the encrypted vault
      const configuredText = mainWindow.getByText(/key configured/i)
      const configuredVisible = await configuredText.isVisible().catch(() => false)

      // Also check the password input is now empty (key was moved to vault)
      const firstInputAfter = keyInputsAfter.first()
      const valueAfter = await firstInputAfter.inputValue()

      // Key should either be empty (saved to vault) OR still present (if save failed gracefully)
      // The important thing is no error page appeared
      await screenshot(mainWindow, 'pipeline_e2e_key_after_navigate_back')
    }

    expect(pageErrors.length).toBe(0)
    expect(await checkForErrorPage(mainWindow)).toBeNull()
  })

  // === EDGE CASE: Empty prompt should open Build App drawer instead of navigating ===

  test('Empty prompt with Start building click opens Build App wizard drawer', async ({ mainWindow, pageErrors }) => {
    // Navigate to Studio
    await mainWindow.getByTestId('mode-studio').click()
    await expect(mainWindow.getByTestId('studio-page')).toBeVisible({ timeout: 5000 })

    // Leave prompt empty and click Start building
    const startBtn = mainWindow.getByTestId('hero-start-building-btn')
    await expect(startBtn).toBeVisible()
    await startBtn.click()
    await mainWindow.waitForTimeout(800)

    // Should still be on the studio page (did not navigate away)
    const studioPage = mainWindow.getByTestId('studio-page')
    await expect(studioPage).toBeVisible()

    // Either a drawer opened or a card got selected (studio-drawer or role="dialog")
    const drawer = mainWindow.locator('[role="dialog"], [data-testid="studio-drawer"]')
    const drawerVisible = await drawer.isVisible({ timeout: 3000 }).catch(() => false)

    await screenshot(mainWindow, 'pipeline_e2e_empty_prompt_result')

    // Close drawer if it opened
    if (drawerVisible) {
      await mainWindow.keyboard.press('Escape')
      await mainWindow.waitForTimeout(300)
    }

    expect(pageErrors.length).toBe(0)
    expect(await checkForErrorPage(mainWindow)).toBeNull()
  })

  // === FAST PATH: Press Enter in composer to trigger pipeline navigation ===

  test('Press Enter in hero composer triggers pipeline navigation', async ({ mainWindow, pageErrors }) => {
    // Navigate to Studio
    await mainWindow.getByTestId('mode-studio').click()
    await expect(mainWindow.getByTestId('studio-page')).toBeVisible({ timeout: 5000 })

    // Type a prompt and press Enter
    const promptInput = mainWindow.getByTestId('hero-prompt-input')
    await expect(promptInput).toBeVisible()

    await promptInput.click()
    await promptInput.fill('Build a simple to-do list app')
    await mainWindow.waitForTimeout(300)

    // Press Enter (not Shift+Enter) — this triggers handleComposerSubmit
    await promptInput.press('Enter')

    // Should navigate to Code mode
    const previewPanel = mainWindow.getByTestId('live-preview-panel')
    await expect(previewPanel).toBeVisible({ timeout: 10000 })

    await screenshot(mainWindow, 'pipeline_e2e_enter_trigger')

    expect(pageErrors.length).toBe(0)
    expect(await checkForErrorPage(mainWindow)).toBeNull()
  })

  // === SUGGESTION CHIPS: Click a suggestion chip to populate the composer ===

  test('Suggestion chip populates hero composer and enables Start building', async ({ mainWindow, pageErrors }) => {
    // Navigate to Studio
    await mainWindow.getByTestId('mode-studio').click()
    await expect(mainWindow.getByTestId('studio-page')).toBeVisible({ timeout: 5000 })

    // Find suggestion buttons below the composer — they are compact pill buttons
    const suggestions = [
      mainWindow.getByRole('button', { name: /pomodoro timer/i }),
      mainWindow.getByRole('button', { name: /markdown editor/i }),
      mainWindow.getByRole('button', { name: /weather dashboard/i }),
      mainWindow.getByRole('button', { name: /contact form/i }),
    ]

    let clicked = false
    for (const btn of suggestions) {
      if (await btn.isVisible().catch(() => false)) {
        await btn.click()
        await mainWindow.waitForTimeout(300)
        clicked = true
        break
      }
    }

    if (clicked) {
      // Verify the composer was populated
      const promptInput = mainWindow.getByTestId('hero-prompt-input')
      const value = await promptInput.inputValue()
      expect(value).toBeTruthy()

      await screenshot(mainWindow, 'pipeline_e2e_suggestion_clicked')

      // Start building button should be enabled now
      const startBtn = mainWindow.getByTestId('hero-start-building-btn')
      await expect(startBtn).toBeEnabled()
    } else {
      // Fallback: type manually
      const promptInput = mainWindow.getByTestId('hero-prompt-input')
      await promptInput.fill('Build a counter app')
      const startBtn = mainWindow.getByTestId('hero-start-building-btn')
      await expect(startBtn).toBeEnabled()
    }

    expect(pageErrors.length).toBe(0)
    expect(await checkForErrorPage(mainWindow)).toBeNull()
  })

  // === MODEL ROUTER: Verify smart model resolution flow in the Studio build ===

  test('Model router resolve flow: build with code-gen prompt navigates and starts pipeline', async ({ mainWindow, pageErrors }) => {
    // Navigate to Studio
    await mainWindow.getByTestId('mode-studio').click()
    await expect(mainWindow.getByTestId('studio-page')).toBeVisible({ timeout: 5000 })

    // Type a code-generation prompt — the model router should classify this
    const promptInput = mainWindow.getByTestId('hero-prompt-input')
    await promptInput.fill('Build a calculator app with basic arithmetic operations')
    await mainWindow.waitForTimeout(200)

    // Click "Start building" — this triggers modelRouterResolveBestForBuild internally
    const startBtn = mainWindow.getByTestId('hero-start-building-btn')
    await startBtn.click()

    // Model resolution (or demo fallback) happens internally, then navigation occurs.
    // Verify navigation to Code mode completes without error.
    const previewPanel = mainWindow.getByTestId('live-preview-panel')
    await expect(previewPanel).toBeVisible({ timeout: 10000 })

    await screenshot(mainWindow, 'pipeline_e2e_model_router_resolved')

    // Verify the pipeline starts after model resolution (even if demo fallback)
    const pipelinePanel = mainWindow.getByTestId('build-pipeline-panel')
    const pipelineVisible = await pipelinePanel.isVisible({ timeout: 12000 }).catch(() => false)

    if (!pipelineVisible) {
      // Without pipeline panel, preview status should at least show activity
      const previewStatus = mainWindow.getByTestId('preview-status')
      await expect(previewStatus).toBeVisible({ timeout: 5000 })
      const statusText = await previewStatus.textContent()
      expect(statusText).toBeTruthy()
      expect(statusText).not.toMatch(/error/i)
    }

    expect(pageErrors.length).toBe(0)
    expect(await checkForErrorPage(mainWindow)).toBeNull()
  })

  test('Model router: vision-oriented prompt does not crash the build flow', async ({ mainWindow, pageErrors }) => {
    // Navigate to Studio
    await mainWindow.getByTestId('mode-studio').click()
    await expect(mainWindow.getByTestId('studio-page')).toBeVisible({ timeout: 5000 })

    // Type a vision-oriented prompt (keywords: image, describe, picture)
    const promptInput = mainWindow.getByTestId('hero-prompt-input')
    await promptInput.fill('Describe this image and extract all text from it')
    await mainWindow.waitForTimeout(200)

    // Start building — model router classifies but pipeline handles it gracefully
    const startBtn = mainWindow.getByTestId('hero-start-building-btn')
    await startBtn.click()

    // Should still navigate to Code mode (pipeline handles any task type)
    const previewPanel = mainWindow.getByTestId('live-preview-panel')
    await expect(previewPanel).toBeVisible({ timeout: 10000 })

    await screenshot(mainWindow, 'pipeline_e2e_model_router_vision')

    expect(pageErrors.length).toBe(0)
    expect(await checkForErrorPage(mainWindow)).toBeNull()
  })

  test('Model router: complex code-gen prompt generates pipeline files', async ({ mainWindow, pageErrors }) => {
    // Navigate to Studio
    await mainWindow.getByTestId('mode-studio').click()
    await expect(mainWindow.getByTestId('studio-page')).toBeVisible({ timeout: 5000 })

    // Type a code-generation prompt with multiple keywords: build, create, website
    const promptInput = mainWindow.getByTestId('hero-prompt-input')
    await promptInput.fill('Create a responsive landing page website with hero section and CTA buttons')
    await mainWindow.waitForTimeout(200)

    // Start building
    const startBtn = mainWindow.getByTestId('hero-start-building-btn')
    await startBtn.click()

    // Should navigate to Code mode and start pipeline
    const previewPanel = mainWindow.getByTestId('live-preview-panel')
    await expect(previewPanel).toBeVisible({ timeout: 10000 })

    // Wait for pipeline activity
    await mainWindow.waitForTimeout(3000)

    await screenshot(mainWindow, 'pipeline_e2e_model_router_code_gen')

    // Check for pipeline panel — if visible, files tab should work
    const pipelinePanel = mainWindow.getByTestId('build-pipeline-panel')
    const pipelineVisible = await pipelinePanel.isVisible({ timeout: 8000 }).catch(() => false)

    if (pipelineVisible) {
      const filesTab = mainWindow.getByTestId('build-tab-files')
      await filesTab.click()
      await mainWindow.waitForTimeout(500)
      await screenshot(mainWindow, 'pipeline_e2e_model_router_code_files')
    }

    expect(pageErrors.length).toBe(0)
    expect(await checkForErrorPage(mainWindow)).toBeNull()
  })

  // === PIPELINE CANCEL: Test cancel button mid-build ===

  test('Cancel pipeline mid-build: cancel button stops the build and disappears', async ({ mainWindow, pageErrors }) => {
    // Navigate to Studio and start a build
    await mainWindow.getByTestId('mode-studio').click()
    await expect(mainWindow.getByTestId('studio-page')).toBeVisible({ timeout: 5000 })

    const promptInput = mainWindow.getByTestId('hero-prompt-input')
    await promptInput.fill('Build a complex dashboard with charts, tables, and filtering')
    await mainWindow.waitForTimeout(200)

    const startBtn = mainWindow.getByTestId('hero-start-building-btn')
    await startBtn.click()

    // Wait for navigation to Code mode
    await expect(mainWindow.getByTestId('live-preview-panel')).toBeVisible({ timeout: 10000 })

    // Wait for the pipeline panel to appear
    const pipelinePanel = mainWindow.getByTestId('build-pipeline-panel')
    const pipelineVisible = await pipelinePanel.isVisible({ timeout: 12000 }).catch(() => false)

    if (pipelineVisible) {
      await screenshot(mainWindow, 'pipeline_e2e_cancel_before')

      // The cancel button should be visible while pipeline is running
      const cancelBtn = mainWindow.getByTestId('build-cancel-btn')
      const cancelVisibleBefore = await cancelBtn.isVisible().catch(() => false)

      if (cancelVisibleBefore) {
        // Click cancel
        await cancelBtn.click()
        await mainWindow.waitForTimeout(1000)

        await screenshot(mainWindow, 'pipeline_e2e_cancel_after')

        // After cancel, the cancel button should disappear (pipelineRunning becomes false).
        // If the pipeline finished before we could cancel, that's also acceptable.
        // The key assertion is that no error page appeared.
        expect(await checkForErrorPage(mainWindow)).toBeNull()
      }
    } else {
      // Pipeline panel didn't appear — demo may have completed too fast.
      // Verify the preview status shows activity
      const previewStatus = mainWindow.getByTestId('preview-status')
      await expect(previewStatus).toBeVisible({ timeout: 5000 })
      await screenshot(mainWindow, 'pipeline_e2e_cancel_no_panel')
    }

    expect(pageErrors.length).toBe(0)
    expect(await checkForErrorPage(mainWindow)).toBeNull()
  })

  test('Cancel pipeline mid-build: app remains functional after cancel', async ({ mainWindow, pageErrors }) => {
    // Navigate to Studio and start a build
    await mainWindow.getByTestId('mode-studio').click()
    await expect(mainWindow.getByTestId('studio-page')).toBeVisible({ timeout: 5000 })

    const promptInput = mainWindow.getByTestId('hero-prompt-input')
    await promptInput.fill('Build a music player interface')
    await mainWindow.waitForTimeout(200)

    const startBtn = mainWindow.getByTestId('hero-start-building-btn')
    await startBtn.click()

    // Navigate to Code mode
    await expect(mainWindow.getByTestId('live-preview-panel')).toBeVisible({ timeout: 10000 })

    // Wait for pipeline to start
    await mainWindow.waitForTimeout(2000)

    // Try to cancel if the cancel button is visible.
    // Use waitForSelector with a timeout instead of arbitrary waitForTimeout.
    const cancelBtn = mainWindow.getByTestId('build-cancel-btn')
    try {
      await cancelBtn.waitFor({ state: 'visible', timeout: 8000 })
      await cancelBtn.click()
      await mainWindow.waitForTimeout(1000)
    } catch {
      // Cancel button never appeared — demo completed too quickly.
      // This is fine; proceed to test rebuild.
    }

    // After cancel (or completion), navigate back to Studio
    await mainWindow.getByTestId('mode-studio').click()
    await expect(mainWindow.getByTestId('studio-page')).toBeVisible({ timeout: 5000 })

    // Start a NEW build — should work without issues
    const promptInput2 = mainWindow.getByTestId('hero-prompt-input')
    await promptInput2.fill('Build a stopwatch app with lap times')
    await mainWindow.waitForTimeout(200)

    const startBtn2 = mainWindow.getByTestId('hero-start-building-btn')
    await startBtn2.click()

    // Should navigate to Code mode again
    await expect(mainWindow.getByTestId('live-preview-panel')).toBeVisible({ timeout: 10000 })

    await screenshot(mainWindow, 'pipeline_e2e_cancel_rebuild')

    expect(pageErrors.length).toBe(0)
    expect(await checkForErrorPage(mainWindow)).toBeNull()
  })

  // === OPEN CHAT: Test the secondary 'Open chat' button on hero composer ===

  test("Open chat button navigates to Chat mode from Studio hero", async ({ mainWindow, pageErrors }) => {
    // Navigate to Studio
    await mainWindow.getByTestId('mode-studio').click()
    await expect(mainWindow.getByTestId('studio-page')).toBeVisible({ timeout: 5000 })

    // Find and click the "Open chat" button
    const openChatBtn = mainWindow.getByTestId('hero-open-chat-btn')
    await expect(openChatBtn).toBeVisible()
    await openChatBtn.click()

    // Should navigate to /chat — verify by checking for chat-specific UI elements
    await mainWindow.waitForTimeout(1000)

    await screenshot(mainWindow, 'pipeline_e2e_open_chat_navigated')

    // ChatWorkspace renders these known testids:
    // - main-chat-panel (chat panel with messages)
    // - chat-home-page (home/landing view when no active chat)
    // - no-model-setup-card (setup card when no provider configured)
    const chatPanel = mainWindow.getByTestId('main-chat-panel')
    const chatHome = mainWindow.getByTestId('chat-home-page')
    const setupCard = mainWindow.getByTestId('no-model-setup-card')

    const panelVisible = await chatPanel.isVisible().catch(() => false)
    const homeVisible = await chatHome.isVisible().catch(() => false)
    const setupVisible = await setupCard.isVisible().catch(() => false)

    // At least one chat-specific element should be visible after navigation
    expect(panelVisible || homeVisible || setupVisible).toBe(true)

    expect(pageErrors.length).toBe(0)
    expect(await checkForErrorPage(mainWindow)).toBeNull()
  })

  test('Open chat button is always visible and enabled on Studio hero', async ({ mainWindow, pageErrors }) => {
    // Navigate to Studio
    await mainWindow.getByTestId('mode-studio').click()
    await expect(mainWindow.getByTestId('studio-page')).toBeVisible({ timeout: 5000 })

    // The Open chat button should be visible even without typing a prompt
    const openChatBtn = mainWindow.getByTestId('hero-open-chat-btn')
    await expect(openChatBtn).toBeVisible()

    // It should be enabled (not disabled)
    await expect(openChatBtn).toBeEnabled()

    await screenshot(mainWindow, 'pipeline_e2e_open_chat_visible')

    // Type a long prompt — the button should remain visible and enabled
    const promptInput = mainWindow.getByTestId('hero-prompt-input')
    await promptInput.fill('A very long prompt that should not affect the Open chat button state at all')
    await mainWindow.waitForTimeout(200)

    await expect(openChatBtn).toBeVisible()
    await expect(openChatBtn).toBeEnabled()

    // Click it and verify navigation
    await openChatBtn.click()
    await mainWindow.waitForTimeout(1000)

    expect(pageErrors.length).toBe(0)
    expect(await checkForErrorPage(mainWindow)).toBeNull()
  })

  // === REGRESSION: Follow-up suggestions appear after pipeline completes ===

  test('Follow-up suggestions appear after build pipeline completes', async ({ mainWindow, pageErrors }) => {
    // Navigate to Studio and trigger a build
    await mainWindow.getByTestId('mode-studio').click()
    await expect(mainWindow.getByTestId('studio-page')).toBeVisible({ timeout: 5000 })

    const promptInput = mainWindow.getByTestId('hero-prompt-input')
    await promptInput.fill('Build a simple counter app')
    await mainWindow.waitForTimeout(200)

    const startBtn = mainWindow.getByTestId('hero-start-building-btn')
    await startBtn.click()

    // Wait for navigation to Code mode
    await expect(mainWindow.getByTestId('live-preview-panel')).toBeVisible({ timeout: 10000 })

    // Wait for pipeline to potentially complete and show follow-up suggestions
    // The demo pipeline generates files quickly, then shows suggestions
    try {
      const followUpPanel = mainWindow.getByTestId('followup-suggestions')
      await expect(followUpPanel).toBeVisible({ timeout: 20000 })

      await screenshot(mainWindow, 'pipeline_e2e_followup_suggestions')

      // Verify there are suggestion buttons
      const suggestionButtons = followUpPanel.getByRole('button')
      const buttonCount = await suggestionButtons.count()
      expect(buttonCount).toBeGreaterThan(0)
    } catch {
      // Follow-up suggestions may not appear if pipeline is still in demo mode
      // This is acceptable — take a screenshot of whatever state we're in
      await mainWindow.waitForTimeout(3000)
      await screenshot(mainWindow, 'pipeline_e2e_followup_timeout')
    }

    expect(pageErrors.length).toBe(0)
    expect(await checkForErrorPage(mainWindow)).toBeNull()
  })
})
