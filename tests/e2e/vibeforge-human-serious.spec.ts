/**
 * Vibeforge — Serious Human QA Mode
 * ------------------------------------
 * A long-running, observable, headed Playwright Electron harness intended for
 * human review, not CI gating. Exercises real user flows, sends real prompts,
 * evaluates responses, saves evidence (screenshots + JSON + markdown + trace),
 * and optionally keeps the app window open at the end.
 *
 * Environment:
 *   Vibeforge_HUMAN_QA_SLOWMO     Optional slow-motion (ms) for the Electron launch.
 *   Vibeforge_HUMAN_QA_KEEP_OPEN  When "1", keep the window open at the end.
 *
 * Run:
 *   npm run test:human:interactive   (normal, slowMo 500ms)
 *   npm run test:human:debug         (slowMo 800ms, keep open)
 *
 * Artifacts (under tests/e2e/artifacts/human-serious/):
 *   human-qa-results.json
 *   human-qa-report.md
 *   screenshots/*.png
 *   trace/*.zip
 */
import { test, expect, waitForAppReady } from './helpers/electronApp'
import { join, relative } from 'path'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { execSync } from 'child_process'
import type { Page } from '@playwright/test'

const ARTIFACT_DIR = join(__dirname, 'artifacts', 'human-serious')
const SCREENSHOT_DIR = join(ARTIFACT_DIR, 'screenshots')
const TRACE_DIR = join(ARTIFACT_DIR, 'trace')
const RESULT_FILE = join(ARTIFACT_DIR, 'human-qa-results.json')
const REPORT_FILE = join(ARTIFACT_DIR, 'human-qa-report.md')

const SLOW_MO = process.env.Vibeforge_HUMAN_QA_SLOWMO ? Number(process.env.Vibeforge_HUMAN_QA_SLOWMO) : 0
const KEEP_OPEN = process.env.Vibeforge_HUMAN_QA_KEEP_OPEN === '1'
const KEEP_OPEN_DURATION_MS = 5 * 60 * 1000

const startedAt = new Date()
const flowResults: FlowResult[] = []
const criticalIssues: string[] = []
const majorIssues: string[] = []
const fixedIssues: string[] = []

interface FlowResult {
  name: string
  status: 'pass' | 'fail' | 'skipped'
  prompt?: string
  responseSummary?: string
  qualityScore?: number
  screenshots: string[]
  durationMs: number
  startedAt: string
  endedAt: string
  pageErrorDelta: number
  notes?: string
  error?: string
}

interface ReportData {
  commit: string
  branch: string
  startedAt: string
  endedAt: string
  durationMs: number
  environment: {
    slowMo: number
    keepOpen: boolean
    pageErrors: number
    consoleErrors: number
    consoleErrorSamples: string[]
    pageErrorSamples: string[]
  }
  flows: FlowResult[]
  criticalIssues: string[]
  majorIssues: string[]
  fixedIssues: string[]
  remainingBlockers: string[]
}

/* ----------------------------- helpers ---------------------------------- */

function ensureDir(p: string): void {
  if (!existsSync(p)) mkdirSync(p, { recursive: true })
}

async function shot(page: Page, name: string): Promise<string> {
  const safe = name.replace(/[^a-z0-9_-]/gi, '_')
  const file = join(SCREENSHOT_DIR, `${safe}.png`)
  try {
    await page.screenshot({ path: file, fullPage: false })
    return relative(ARTIFACT_DIR, file).replace(/\\/g, '/')
  } catch (err) {
    console.warn(`[human-serious] screenshot ${name} failed:`, err)
    return ''
  }
}

/** Navigate via hash (Electron is a hash-routed SPA — page.goto with custom scheme is unreliable). */
async function gotoHash(page: Page, hash: string): Promise<void> {
  const target = hash.startsWith('#') ? hash : `#${hash}`
  await page.evaluate((h) => { window.location.hash = h }, target)
  await page.waitForTimeout(500)
}

function gitShort(): string {
  try { return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim() } catch { return 'unknown' }
}
function gitBranch(): string {
  try { return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim() } catch { return 'unknown' }
}
function logStep(name: string): void { console.log(`\n[human-serious] === ${name} ===`) }
function logSub(msg: string): void { console.log(`[human-serious]   ${msg}`) }

interface FlowCtx {
  page: Page
  pageErrorsBefore: number
  screenshots: string[]
  pushShot(name: string): Promise<void>
}

async function withFlow(
  name: string,
  fn: (ctx: FlowCtx) => Promise<{ prompt?: string; responseSummary?: string; qualityScore?: number; notes?: string }>,
  page: Page,
  pageErrors: string[],
): Promise<void> {
  logStep(name)
  const flowStart = Date.now()
  const flowStartIso = new Date().toISOString()
  const errorsBefore = pageErrors.length
  const localScreenshots: string[] = []
  const ctx: FlowCtx = {
    page,
    pageErrorsBefore: errorsBefore,
    screenshots: localScreenshots,
    pushShot: async (n: string) => {
      const s = await shot(page, n)
      if (s) localScreenshots.push(s)
    },
  }
  const result: FlowResult = {
    name,
    status: 'pass',
    screenshots: [],
    durationMs: 0,
    startedAt: flowStartIso,
    endedAt: flowStartIso,
    pageErrorDelta: 0,
  }
  try {
    const out = await fn(ctx)
    result.prompt = out.prompt
    result.responseSummary = out.responseSummary
    result.qualityScore = out.qualityScore
    result.notes = out.notes
    if (out.qualityScore != null) {
      result.status = out.qualityScore >= 30 ? 'pass' : 'fail'
      if (result.status === 'fail') {
        majorIssues.push(`${name}: ${out.notes ?? 'low quality score'}`)
      }
    }
  } catch (err) {
    result.status = 'fail'
    result.error = err instanceof Error ? err.message : String(err)
    criticalIssues.push(`${name}: ${result.error}`)
  } finally {
    const errorsAfter = pageErrors.length
    result.pageErrorDelta = errorsAfter - errorsBefore
    if (result.pageErrorDelta > 0) {
      criticalIssues.push(`${name}: ${result.pageErrorDelta} page error(s) during flow`)
    }
    result.endedAt = new Date().toISOString()
    result.durationMs = Date.now() - flowStart
    result.screenshots = localScreenshots.slice()
    flowResults.push(result)
    logSub(`status=${result.status} duration=${result.durationMs}ms shots=${result.screenshots.length} pageErrΔ=${result.pageErrorDelta}`)
  }
}

/** Wait for an element to be visible, with a screenshot on failure. */
async function waitVisible(page: Page, selector: string, timeout = 10_000): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { state: 'visible', timeout })
    return true
  } catch {
    return false
  }
}

/** Verify the composer textarea contains expected text after a navigation/event. */
async function verifyComposerText(page: Page, expected: string, timeout = 5_000): Promise<boolean> {
  try {
    await page.waitForFunction(
      (text) => {
        const el = document.querySelector('[data-testid="message-textarea"]') as HTMLTextAreaElement | null
        return el ? el.value.includes(text) : false
      },
      expected,
      { timeout }
    )
    return true
  } catch {
    return false
  }
}

/* ----------------------------- the test --------------------------------- */

test.setTimeout(30 * 60 * 1000) // 30 minutes per file
test.use({ trace: 'retain-on-failure' }) // Keep Playwright traces on failure

test.describe('Vibeforge — Serious Human QA Mode', () => {

  test('Exercise real flows, evaluate responses, capture evidence', async ({
    mainWindow,
    pageErrors,
    consoleErrors,
  }) => {
    ensureDir(SCREENSHOT_DIR)
    ensureDir(ARTIFACT_DIR)
    ensureDir(TRACE_DIR)

    // 1) Resize to 1366x768
    logStep('Window sizing + initial screenshot')
    await mainWindow.setViewportSize({ width: 1366, height: 768 })
    await waitForAppReady(mainWindow)
    await mainWindow.waitForTimeout(800)
    flowResults.push({
      name: 'Startup',
      status: 'pass',
      screenshots: [await shot(mainWindow, '00_startup')],
      durationMs: 0,
      startedAt: new Date().toISOString(),
      endedAt: new Date().toISOString(),
      pageErrorDelta: 0,
    })

    // 2) UI sweep — sidebar items + major pages
    await withFlow('UI sweep — sidebar + major pages', async (ctx) => {
      const pages = [
        { testid: 'mode-studio', name: 'studio', shot: '01_studio' },
        { testid: 'mode-chat', name: 'chat', shot: '01_chat' },
        { testid: 'nav-settings', name: 'settings', shot: '01_settings' },
      ]
      for (const p of pages) {
        const el = mainWindow.getByTestId(p.testid)
        if (await el.isVisible().catch(() => false)) {
          await el.click()
          await mainWindow.waitForTimeout(600)
          await ctx.pushShot(p.shot)
        }
      }
      // Also visit Cowork, Projects, Prompts via hash to confirm they render
      for (const hash of ['#/cowork', '#/projects', '#/prompts']) {
        await gotoHash(mainWindow, hash)
        await mainWindow.waitForTimeout(600)
        await ctx.pushShot(`01_${hash.replace('#/', '')}`)
      }
      return { notes: 'sidebar items clicked + major pages rendered' }
    }, mainWindow, pageErrors)

    // 3) Studio home — confirm the hero is visible
    await withFlow('Studio home — hero + composer visible', async (ctx) => {
      await gotoHash(mainWindow, '#/')
      const hero = mainWindow.getByTestId('hero-landing')
      await expect(hero).toBeVisible({ timeout: 10_000 })
      const composer = mainWindow.getByTestId('hero-composer')
      await expect(composer).toBeVisible()
      const startBtn = mainWindow.getByTestId('hero-start-building-btn')
      await expect(startBtn).toBeVisible()
      await ctx.pushShot('02_studio_home')
      return { notes: 'hero + composer + Start building all visible' }
    }, mainWindow, pageErrors)

    // 4) Studio Build App — counter app
    await withFlow('Studio Build App — counter app + LivePreview', async (ctx) => {
      const prompt = 'Build a tiny counter app with ivory Claude-like theme, increment button, reset button, and live preview.'
      const input = mainWindow.getByTestId('hero-prompt-input')
      await input.fill(prompt)
      await ctx.pushShot('03_studio_prompt_typed')
      const startBtn = mainWindow.getByTestId('hero-start-building-btn')
      await startBtn.click()
      // Wait for hash change to /preview
      try {
        await mainWindow.waitForFunction(() => window.location.hash === '#/preview', { timeout: 15_000 })
      } catch { /* maybe already there */ }
      await mainWindow.waitForTimeout(2000)
      await ctx.pushShot('03_studio_livepreview_loading')

      // Wait for build pipeline to appear
      const panel = mainWindow.getByTestId('build-pipeline-panel')
      let pipelineVisible = false
      try {
        await expect(panel).toBeVisible({ timeout: 15_000 })
        pipelineVisible = true
      } catch {
        pipelineVisible = await mainWindow.getByTestId('preview-status').isVisible().catch(() => false)
      }
      await ctx.pushShot('03_studio_livepreview_pipeline')

      // Wait for Local Demo badge (deterministic fallback)
      const localDemoBadge = mainWindow.getByText('Local Demo', { exact: true })
      const demoBadgeVisible = await localDemoBadge
        .waitFor({ state: 'visible', timeout: 60_000 })
        .then(() => true)
        .catch(() => false)
      await ctx.pushShot('03_studio_livepreview_demo_badge')

      // Switch to Preview tab
      const previewTab = mainWindow.getByTestId('build-tab-preview')
      if (await previewTab.isVisible().catch(() => false)) {
        await previewTab.click()
        await mainWindow.waitForTimeout(1500)
        await ctx.pushShot('03_studio_livepreview_preview_tab')
      }

      const iframe = mainWindow.locator('iframe[title="Vibeforge Live Sandbox Preview"]')
      const iframeVisible = await iframe.isVisible().catch(() => false)

      // Try to interact with the iframe counter
      let iframeInteraction = 'not attempted'
      if (iframeVisible) {
        try {
          const frame = iframe.contentFrame()
          if (frame) {
            // Look for common counter button labels
            const incrementBtn = frame.locator('button:has-text("Increment"), button:has-text("+")').first()
            if (await incrementBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
              await incrementBtn.click()
              await mainWindow.waitForTimeout(500)
              await ctx.pushShot('03_counter_increment_clicked')
              const resetBtn = frame.locator('button:has-text("Reset"), button:has-text("Reset")').first()
              if (await resetBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
                await resetBtn.click()
                await mainWindow.waitForTimeout(500)
                await ctx.pushShot('03_counter_reset_clicked')
                iframeInteraction = 'increment+reset clicked'
              } else {
                iframeInteraction = 'increment clicked'
              }
            } else {
              iframeInteraction = 'iframe visible but no increment button'
            }
          }
        } catch (err) {
          iframeInteraction = `iframe interaction error: ${err instanceof Error ? err.message : String(err)}`
        }
      }

      if (!iframeVisible && !demoBadgeVisible) {
        majorIssues.push('LivePreview: neither iframe rendered nor Local Demo badge appeared after 60s')
      }

      return {
        prompt,
        responseSummary: `pipelineVisible=${pipelineVisible}, demoBadge=${demoBadgeVisible}, iframeVisible=${iframeVisible}, iframeInteraction=${iframeInteraction}`,
        qualityScore: demoBadgeVisible || iframeVisible ? 70 : 20,
        notes: `pipeline panel: ${pipelineVisible}; demo badge: ${demoBadgeVisible}; iframe: ${iframeVisible}; ${iframeInteraction}`,
      }
    }, mainWindow, pageErrors)

    // 5) Vibe Coding — Guided Builder
    await withFlow('Vibe Coding — Guided Builder + prompt generation', async (ctx) => {
      await gotoHash(mainWindow, '#/vibe')
      const vibePage = mainWindow.getByTestId('vibe-coding-page')
      await expect(vibePage).toBeVisible({ timeout: 10_000 })
      await ctx.pushShot('04_vibe_coding_home')

      // Click Guided Builder tab
      const guidedTab = mainWindow.getByRole('button', { name: /Guided Builder/i }).first()
      if (await guidedTab.isVisible().catch(() => false)) {
        await guidedTab.click()
        await mainWindow.waitForTimeout(800)
        await ctx.pushShot('04_vibe_guided_builder')

        // Select options through the guided steps
        let stepsCompleted = 0
        for (let i = 0; i < 4; i++) {
          const options = mainWindow.locator('[data-testid^="guided-option-"]')
          const count = await options.count().catch(() => 0)
          if (count === 0) break
          await options.first().click()
          await mainWindow.waitForTimeout(600)
          stepsCompleted++
          await ctx.pushShot(`04_vibe_step_${i + 1}`)
        }

        // Verify prompt is built
        const resultPanel = mainWindow.getByTestId('guided-result')
        const promptBuilt = await resultPanel.isVisible({ timeout: 10_000 }).catch(() => false)
        await ctx.pushShot('04_vibe_prompt_built')

        // Click "Open in Code Mode" to route to preview
        const codeModeBtn = mainWindow.getByTestId('guided-use-code')
        if (await codeModeBtn.isVisible().catch(() => false)) {
          await codeModeBtn.click()
          await mainWindow.waitForTimeout(1500)
          await ctx.pushShot('04_vibe_code_mode')
        }

        return {
          notes: `guided steps completed=${stepsCompleted}, promptBuilt=${promptBuilt}, routed to ${mainWindow.url()}`,
          qualityScore: promptBuilt ? 80 : 30,
          responseSummary: `steps=${stepsCompleted}, promptBuilt=${promptBuilt}`,
        }
      }

      // Fallback to Quick Start action
      const fixError = mainWindow.getByTestId('vibe-action-fix-error')
      if (await fixError.isVisible().catch(() => false)) {
        await fixError.click()
        await mainWindow.waitForTimeout(1500)
        await ctx.pushShot('04_vibe_action_clicked')
        const url = mainWindow.url()
        return {
          notes: `action routed to hash=${url.includes('#/chat') ? 'chat' : url.includes('#/preview') ? 'preview' : 'other'}`,
          qualityScore: url.includes('#/chat') || url.includes('#/preview') ? 80 : 30,
          responseSummary: `navigated to ${url}`,
        }
      }
      return { notes: 'no Guided Builder or Quick Action button visible', qualityScore: 10 }
    }, mainWindow, pageErrors)

    // 6) Chat — real prompt
    await withFlow('Chat — real prompt response', async (ctx) => {
      await gotoHash(mainWindow, '#/chat')
      const composer = mainWindow.getByTestId('message-textarea')
      const composerVisible = await composer.isVisible({ timeout: 10_000 }).catch(() => false)
      await ctx.pushShot('05_chat_loaded')

      if (!composerVisible) {
        return { notes: 'composer (message-textarea) not visible — chat may be in empty state', qualityScore: 10 }
      }

      const prompt = 'Explain what Vibeforge can do in 5 bullet points and suggest one thing I should build first.'
      await composer.fill(prompt)
      await ctx.pushShot('05_chat_typed')
      await composer.press('Enter')

      // Wait for an assistant message bubble. The MessageBubble uses .prose
      // on the assistant markdown body; wait for at least one of those.
      const assistantBody = mainWindow.locator('.prose').last()
      let responseText = ''
      const start = Date.now()
      while (Date.now() - start < 90_000) {
        const count = await assistantBody.count().catch(() => 0)
        if (count > 0) {
          const txt = await assistantBody.textContent().catch(() => '')
          if (txt && txt.trim().length > 20) {
            responseText = txt
            break
          }
        }
        await mainWindow.waitForTimeout(2000)
      }
      await ctx.pushShot('05_chat_after_send')

      const bulletCount = (responseText.match(/^\s*[-*•]/gm) || []).length
      const wordCount = responseText.split(/\s+/).filter(Boolean).length
      const saysProviderMissing = /provider.*missing|set up.*provider|no provider configured/i.test(responseText)
      const hasHeading = /<h[1-6]/.test(await assistantBody.innerHTML().catch(() => ''))
      const hasList = /<ul|<ol/.test(await assistantBody.innerHTML().catch(() => ''))

      let qualityScore = 0
      if (wordCount > 100) qualityScore += 20
      if (bulletCount >= 3 || hasList) qualityScore += 30
      if (!saysProviderMissing) qualityScore += 30
      if (wordCount > 300) qualityScore += 10
      if (hasHeading) qualityScore += 10

      return {
        prompt,
        responseSummary: `bullets=${bulletCount} words=${wordCount} providerMissingCopy=${saysProviderMissing} hasHeading=${hasHeading} hasList=${hasList}`,
        qualityScore,
        notes: 'chat response observed via .prose assistant body',
      }
    }, mainWindow, pageErrors)

    // 7) Beautiful landing page prompt
    await withFlow('Studio Build App — landing page', async (ctx) => {
      await gotoHash(mainWindow, '#/')
      const input = mainWindow.getByTestId('hero-prompt-input')
      const prompt = 'Build a premium hero landing page for Vibeforge with calm ivory background, graphite text, bronze accent, a central composer, 4 feature cards, and no neon.'
      await input.fill(prompt)
      await ctx.pushShot('06_landing_typed')
      await mainWindow.getByTestId('hero-start-building-btn').click()
      // Wait for the build pipeline panel to actually appear
      try {
        await mainWindow.waitForSelector('[data-testid="build-pipeline-panel"]', { timeout: 30_000 })
      } catch { /* tolerated; demo badge check below still runs */ }
      await ctx.pushShot('06_landing_livepreview')

      const demoBadge = mainWindow.getByText('Local Demo', { exact: true })
      const demo = await demoBadge.waitFor({ state: 'visible', timeout: 60_000 }).then(() => true).catch(() => false)
      return {
        prompt,
        responseSummary: `demoBadge=${demo}`,
        qualityScore: demo ? 70 : 20,
        notes: 'landing page prompt — checked for Local Demo badge',
      }
    }, mainWindow, pageErrors)

    // 8) LivePreview deep repair — follow-up suggestion
    await withFlow('LivePreview — follow-up suggestion + repair', async (ctx) => {
      await gotoHash(mainWindow, '#/preview')
      // Ensure we have a running preview or start demo
      const status = mainWindow.getByTestId('preview-status')
      const running = await status.isVisible().catch(() => false)
      if (!running) {
        const demoBtn = mainWindow.getByTestId('preview-create-demo-cta')
        if (await demoBtn.isVisible().catch(() => false)) {
          await demoBtn.click()
          await mainWindow.waitForTimeout(2000)
        }
      }
      await ctx.pushShot('07_livepreview_status')

      // Wait for follow-up suggestions
      const suggestions = mainWindow.getByTestId('followup-suggestions')
      const hasSuggestions = await suggestions.isVisible({ timeout: 30_000 }).catch(() => false)
      await ctx.pushShot('07_followup_suggestions')

      if (hasSuggestions) {
        const firstBtn = suggestions.locator('button').first()
        if (await firstBtn.isVisible().catch(() => false)) {
          await firstBtn.click()
          await mainWindow.waitForTimeout(2000)
          await ctx.pushShot('07_followup_clicked')
        }
      }

      // Verify Code tab shows activity
      const codeTab = mainWindow.getByTestId('build-tab-code')
      if (await codeTab.isVisible().catch(() => false)) {
        await codeTab.click()
        await mainWindow.waitForTimeout(800)
        await ctx.pushShot('07_code_tab')
      }

      return {
        notes: `followUpSuggestions=${hasSuggestions}`,
        qualityScore: hasSuggestions ? 80 : 40,
        responseSummary: `followUpSuggestions=${hasSuggestions}`,
      }
    }, mainWindow, pageErrors)

    // 9) Settings — providers + fake key
    await withFlow('Settings — providers + fake key', async (ctx) => {
      await gotoHash(mainWindow, '#/settings/providers')
      const settingsLayout = mainWindow.getByTestId('settings-layout')
      const settingsVisible = await settingsLayout.isVisible({ timeout: 10_000 }).catch(() => false)
      await ctx.pushShot('08_settings_providers')

      if (!settingsVisible) {
        return { notes: 'settings layout not visible', qualityScore: 10 }
      }

      // Per ProvidersPage the input placeholder is "sk-or-v1-..." (matches 99 spec).
      const keyInput = mainWindow.locator('input[placeholder="sk-or-v1-..."]').first()
      const keyVisible = await keyInput.isVisible({ timeout: 5_000 }).catch(() => false)
      if (keyVisible) {
        await keyInput.fill('sk-test-not-real')
        await ctx.pushShot('08_settings_key_typed')
        const saveBtn = mainWindow.getByRole('button', { name: /save key/i }).first()
        if (await saveBtn.isVisible().catch(() => false)) {
          await saveBtn.click()
          await mainWindow.waitForTimeout(1000)
        }
        return { notes: 'typed fake key + clicked Save Key', qualityScore: 80 }
      }
      return { notes: 'key input not found via placeholder', qualityScore: 30 }
    }, mainWindow, pageErrors)

    // 10) Settings — Tools / MCP
    await withFlow('Settings — Tools + MCP safety', async (ctx) => {
      await gotoHash(mainWindow, '#/settings/tools')
      await ctx.pushShot('09_tools_home')

      const addBtn = mainWindow.getByRole('button', { name: /add mcp server/i }).first()
      const addVisible = await addBtn.isVisible({ timeout: 5_000 }).catch(() => false)
      if (addVisible) {
        await addBtn.click()
        await mainWindow.waitForTimeout(800)
        await ctx.pushShot('09_tools_add_mcp_modal')
        const modal = mainWindow.getByRole('dialog')
        const modalVisible = await modal.isVisible({ timeout: 3_000 }).catch(() => false)

        const bodyText = await mainWindow.textContent('body').catch(() => '')
        const hasSafetyCopy = /disabled by default|review.*capabilities/i.test(bodyText ?? '')

        await mainWindow.keyboard.press('Escape')
        await mainWindow.waitForTimeout(300)

        return {
          notes: `modal opened=${modalVisible}, safety copy=${hasSafetyCopy}`,
          qualityScore: modalVisible && hasSafetyCopy ? 80 : 30,
        }
      }
      return { notes: 'Add MCP Server button not found', qualityScore: 20 }
    }, mainWindow, pageErrors)

    // 11) Maximize window
    await withFlow('Maximize window — 1920x1080', async (ctx) => {
      await mainWindow.setViewportSize({ width: 1920, height: 1080 })
      await mainWindow.waitForTimeout(500)
      await ctx.pushShot('10_maximized')
      return { notes: 'window set to 1920x1080' }
    }, mainWindow, pageErrors)

    // 12) Aggregate page errors
    if (pageErrors.length > 0) {
      criticalIssues.push(`pageErrors during run: ${pageErrors.length} (${pageErrors.slice(0, 3).join(' | ')})`)
    }

    // 13) Final screenshot — push BEFORE the report so it's recorded
    const finalShot = await shot(mainWindow, '99_final')
    flowResults.push({
      name: 'Final summary',
      status: 'pass',
      screenshots: [finalShot],
      durationMs: 0,
      startedAt: new Date().toISOString(),
      endedAt: new Date().toISOString(),
      pageErrorDelta: 0,
    })

    // 14) Save results + report (includes Final summary now)
    const endedAt = new Date()
    const result: ReportData = {
      commit: gitShort(),
      branch: gitBranch(),
      startedAt: startedAt.toISOString(),
      endedAt: endedAt.toISOString(),
      durationMs: endedAt.getTime() - startedAt.getTime(),
      environment: {
        slowMo: SLOW_MO,
        keepOpen: KEEP_OPEN,
        pageErrors: pageErrors.length,
        consoleErrors: consoleErrors.length,
        consoleErrorSamples: consoleErrors.slice(0, 5),
        pageErrorSamples: pageErrors.slice(0, 3),
      },
      flows: flowResults,
      criticalIssues,
      majorIssues,
      fixedIssues,
      remainingBlockers: criticalIssues.slice(),
    }
    writeFileSync(RESULT_FILE, JSON.stringify(result, null, 2), 'utf8')
    logSub(`wrote ${RESULT_FILE}`)

    const md = buildMarkdownReport(result)
    writeFileSync(REPORT_FILE, md, 'utf8')
    logSub(`wrote ${REPORT_FILE}`)

    if (KEEP_OPEN) {
      console.log('[human-serious] Human QA complete. Keeping window open for inspection.')
      console.log('[human-serious] Press Ctrl+C in the terminal to abort early.')
      // Prefer page.pause() when available (debugger-friendly), otherwise wait
      try {
        // page.pause() is only available in headed mode and blocks until resumed
        await (mainWindow as any).pause()
      } catch {
        await mainWindow.waitForTimeout(KEEP_OPEN_DURATION_MS)
      }
    }
  })
})

/* --------------------------- markdown report ---------------------------- */

function buildMarkdownReport(r: ReportData): string {
  const lines: string[] = []
  lines.push(`# Vibeforge — Serious Human QA Report`)
  lines.push('')
  lines.push(`- **Date:** ${r.startedAt} → ${r.endedAt}`)
  lines.push(`- **Duration:** ${Math.round(r.durationMs / 1000)}s`)
  lines.push(`- **Commit:** \`${r.commit}\` on \`${r.branch}\``)
  lines.push(`- **Environment:** slowMo=${r.environment.slowMo}ms, keepOpen=${r.environment.keepOpen}`)
  lines.push(`- **Page errors:** ${r.environment.pageErrors}`)
  lines.push(`- **Console errors:** ${r.environment.consoleErrors}`)
  lines.push('')
  lines.push(`## Flow results`)
  lines.push('')
  lines.push(`| # | Flow | Status | Quality | Duration (s) | Shots | PageErrΔ |`)
  lines.push(`|---|------|--------|---------|--------------|-------|----------|`)
  r.flows.forEach((f, i) => {
    lines.push(
      `| ${i + 1} | ${f.name} | ${f.status} | ${f.qualityScore ?? '-'} | ${(f.durationMs / 1000).toFixed(1)} | ${f.screenshots.length} | ${f.pageErrorDelta} |`,
    )
  })
  lines.push('')
  lines.push(`## Prompts sent & responses`)
  lines.push('')
  r.flows.filter((f) => f.prompt).forEach((f) => {
    lines.push(`### ${f.name}`)
    lines.push('')
    lines.push('**Prompt:**')
    lines.push('')
    lines.push('```')
    lines.push(f.prompt ?? '')
    lines.push('```')
    lines.push('')
    if (f.responseSummary) {
      lines.push(`**Result:** ${f.responseSummary}`)
      lines.push('')
    }
  })
  lines.push(`## Issues`)
  lines.push('')
  const flowErrors = r.flows.filter((f) => f.error)
  if (flowErrors.length > 0) {
    lines.push(`### Per-flow errors`)
    flowErrors.forEach((f) => lines.push(`- **${f.name}**: ${f.error}`))
    lines.push('')
  }
  lines.push(`### Critical`)
  lines.push(r.criticalIssues.length === 0 ? '_None._' : r.criticalIssues.map((s) => `- ${s}`).join('\n'))
  lines.push('')
  lines.push(`### Major`)
  lines.push(r.majorIssues.length === 0 ? '_None._' : r.majorIssues.map((s) => `- ${s}`).join('\n'))
  lines.push('')
  lines.push(`### Fixed this session`)
  lines.push(r.fixedIssues.length === 0 ? '_None._' : r.fixedIssues.map((s) => `- ${s}`).join('\n'))
  lines.push('')
  lines.push(`## Remaining blockers`)
  lines.push(r.remainingBlockers.length === 0 ? '_None._' : r.remainingBlockers.map((s) => `- ${s}`).join('\n'))
  lines.push('')
  lines.push(`## Beta readiness`)
  const ready = r.criticalIssues.length === 0 && r.environment.pageErrors === 0
  lines.push(ready ? '**YES** — all critical issues resolved, no page errors during flow.' : '**NO** — see blockers above.')
  lines.push('')
  return lines.join('\n')
}
