import { test, expect, waitForAppReady, checkForErrorPage } from './helpers/electronApp'

test.describe('Vibeforge — No-Code Goal Wizard E2E', () => {
  test.beforeEach(async ({ mainWindow }) => {
    await waitForAppReady(mainWindow)
  })

  test('Guided Builder Flow - Website Wizard path', async ({ mainWindow }) => {
    // 1. Ensure wizard is visible by toggling it
    const toggleBtn = mainWindow.getByTestId('toggle-wizard-btn')
    await expect(toggleBtn).toBeVisible({ timeout: 5000 })
    await toggleBtn.click()
    const wizard = mainWindow.getByTestId('goal-wizard')
    await expect(wizard).toBeVisible()

    // 2. Select Website in Step 1
    const websiteCard = mainWindow.getByTestId('wizard-type-website')
    await expect(websiteCard).toBeVisible()
    await websiteCard.click()

    // 3. Click Next to go to Step 2 (Purpose)
    const nextBtn = mainWindow.getByTestId('wizard-next-btn')
    await nextBtn.click()
    await mainWindow.waitForTimeout(500)

    // 4. Select Personal in Step 2
    const personalPurpose = mainWindow.getByTestId('wizard-purpose-personal')
    await expect(personalPurpose).toBeVisible()
    await personalPurpose.click()
    await nextBtn.click()
    await mainWindow.waitForTimeout(500)

    // 5. Select Hero Section and Navigation features in Step 3
    const heroFeat = mainWindow.getByTestId('wizard-feature-hero-section')
    await expect(heroFeat).toBeVisible()
    await heroFeat.click() // click to select / ensure selected
    await nextBtn.click()
    await mainWindow.waitForTimeout(500)

    // 6. Select Ivory Premium in Step 4
    const styleCard = mainWindow.getByTestId('wizard-style-ivory-premium')
    await expect(styleCard).toBeVisible()
    await styleCard.click()
    await nextBtn.click()
    await mainWindow.waitForTimeout(500)

    // 7. Verify generated prompt brief shows in Step 5
    const briefBox = mainWindow.locator('pre')
    const briefText = await briefBox.textContent()
    expect(briefText).toContain('Build a premium Website')
    expect(briefText).toContain('Ivory Premium')

    // 8. Click Build with Preview
    const buildBtn = mainWindow.getByTestId('wizard-build-btn')
    await expect(buildBtn).toBeVisible()
    await buildBtn.click()

    // 9. Should redirect to preview and open LivePreview panel
    await mainWindow.waitForTimeout(2000)
    const previewContent = await mainWindow.$('[data-testid="live-preview-panel"]')
    expect(previewContent).not.toBeNull()
  })

  test('Guided Builder Flow - Android App Wizard path', async ({ mainWindow }) => {
    // 1. Ensure wizard is visible by toggling it
    const toggleBtn = mainWindow.getByTestId('toggle-wizard-btn')
    await expect(toggleBtn).toBeVisible({ timeout: 5000 })
    await toggleBtn.click()
    const wizard = mainWindow.getByTestId('goal-wizard')
    await expect(wizard).toBeVisible()

    // 2. Select Android-style App in Step 1
    const androidCard = mainWindow.getByTestId('wizard-type-android-style-app')
    await expect(androidCard).toBeVisible()
    await androidCard.click()

    // 3. Click Next to Step 2
    const nextBtn = mainWindow.getByTestId('wizard-next-btn')
    await nextBtn.click()
    await mainWindow.waitForTimeout(500)

    // 4. Select Learning Purpose in Step 2
    const learningPurpose = mainWindow.getByTestId('wizard-purpose-learning')
    await expect(learningPurpose).toBeVisible()
    await learningPurpose.click()
    await nextBtn.click()
    await mainWindow.waitForTimeout(500)

    // 5. Select Mobile Layout in Step 3
    const mobileFeat = mainWindow.getByTestId('wizard-feature-mobile-layout')
    await expect(mobileFeat).toBeVisible()
    await mobileFeat.click()
    await nextBtn.click()
    await mainWindow.waitForTimeout(500)

    // 6. Select Emergent Clean style in Step 4
    const styleCard = mainWindow.getByTestId('wizard-style-emergent-clean')
    await expect(styleCard).toBeVisible()
    await styleCard.click()
    await nextBtn.click()
    await mainWindow.waitForTimeout(500)

    // 7. Click Build with Preview
    const buildBtn = mainWindow.getByTestId('wizard-build-btn')
    await expect(buildBtn).toBeVisible()
    await buildBtn.click()

    // 8. Should redirect to preview
    await mainWindow.waitForTimeout(2000)
    const previewContent = await mainWindow.$('[data-testid="live-preview-panel"]')
    expect(previewContent).not.toBeNull()
  })
})
