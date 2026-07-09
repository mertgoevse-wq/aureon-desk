import { v4 as uuid } from 'uuid'
import { app, BrowserWindow } from 'electron'
import path from 'path'
import fs from 'fs'
import { logger } from '../utils/logger'
import { redactSecrets } from './log-redacter'
import { livePreviewService } from './live-preview.service'
import type {
  BuildRequest,
  BuildResult,
  BuildStep,
  BuildStepStatus,
  BuildStepType,
  FileOperation,
  DiffLine,
  BuildPipelineStatus,
  FollowUpSuggestion,
  BuildIntentClassification,
} from '../../shared/types/build-pipeline'
import { generateFollowUpSuggestions } from '../../shared/types/build-pipeline'

/**
 * Build Pipeline Service — bolt.diy-like prompt → code → diff → live preview.
 *
 * Steps:
 * 1. classify intent
 * 2. create build plan
 * 3. generate file operations
 * 4. show pending file changes
 * 5. apply to sandbox after approval (auto-applied in generate mode)
 * 6. start preview
 * 7. stream status to UI
 * 8. show rendered preview
 * 9. generate follow-up suggestions
 */

type StepCallback = (status: BuildPipelineStatus) => void

let _currentBuildId: string | null = null
let _cancelled = false
let _stepCallback: StepCallback | null = null

function makeStep(type: BuildStepType, label: string, filePath?: string, message?: string): BuildStep {
  return {
    type,
    status: 'pending',
    label,
    filePath,
    timestamp: new Date().toISOString(),
    message,
  }
}

/** Compute a simple line-based diff between before and after content */
function computeDiff(before: string, after: string): DiffLine[] {
  const beforeLines = before.split('\n')
  const afterLines = after.split('\n')
  const diff: DiffLine[] = []

  // Simple approach: find common prefix and suffix, diff the middle
  let prefixLen = 0
  while (
    prefixLen < beforeLines.length &&
    prefixLen < afterLines.length &&
    beforeLines[prefixLen] === afterLines[prefixLen]
  ) {
    diff.push({ type: 'context', content: beforeLines[prefixLen], oldLine: prefixLen + 1, newLine: prefixLen + 1 })
    prefixLen++
  }

  let suffixLen = 0
  while (
    suffixLen < beforeLines.length - prefixLen &&
    suffixLen < afterLines.length - prefixLen &&
    beforeLines[beforeLines.length - 1 - suffixLen] === afterLines[afterLines.length - 1 - suffixLen]
  ) {
    suffixLen++
  }

  // Removed lines (from before)
  for (let i = prefixLen; i < beforeLines.length - suffixLen; i++) {
    diff.push({ type: 'remove', content: beforeLines[i], oldLine: i + 1 })
  }

  // Added lines (from after)
  for (let i = prefixLen; i < afterLines.length - suffixLen; i++) {
    diff.push({ type: 'add', content: afterLines[i], newLine: i + 1 })
  }

  // Context suffix
  for (let i = 0; i < suffixLen; i++) {
    const bIdx = beforeLines.length - suffixLen + i
    const aIdx = afterLines.length - suffixLen + i
    diff.push({ type: 'context', content: beforeLines[bIdx], oldLine: bIdx + 1, newLine: aIdx + 1 })
  }

  return diff
}

/** Classify user prompt intent — deterministic, no AI needed */
function classifyIntent(prompt: string): BuildIntentClassification {
  const lower = prompt.toLowerCase()
  let intent: BuildIntentClassification['intent'] = 'generic'
  let suggestedName = 'Aureon App'

  if (lower.includes('counter') || lower.includes('count')) {
    intent = 'build_utility'
    suggestedName = 'Counter App'
  } else if (lower.includes('dashboard') || lower.includes('chart') || lower.includes('stats')) {
    intent = 'build_dashboard'
    suggestedName = 'Dashboard'
  } else if (lower.includes('game') || lower.includes('play') || lower.includes('mini-game')) {
    intent = 'build_game'
    suggestedName = 'Mini Game'
  } else if (lower.includes('component') || lower.includes('widget') || lower.includes('card')) {
    intent = 'build_component'
    suggestedName = 'Component'
  } else if (lower.includes('app') || lower.includes('build') || lower.includes('create') || lower.includes('timer') || lower.includes('todo') || lower.includes('calculator')) {
    intent = 'build_app'
    suggestedName = 'Aureon App'
  }

  const suggestedFiles = ['index.html', 'styles.css', 'app.js']

  return {
    intent,
    projectType: 'web-app',
    suggestedFiles,
    suggestedName,
  }
}

/** Generate a deterministic counter app with ivory/hero theme */
function generateDeterministicApp(prompt: string, theme: string, appName: string): Record<string, string> {
  // Theme color palettes
  const themes: Record<string, { bg: string; surface: string; text: string; accent: string; accentHover: string; border: string; secondary: string }> = {
    'Calming Ivory': {
      bg: '#FAF7F2',
      surface: '#FFFFFF',
      text: '#221A0F',
      accent: '#B8683A',
      accentHover: '#A45A30',
      border: '#E4DEC9',
      secondary: '#5D5241',
    },
    'Soft Teal': {
      bg: '#F0F7F6',
      surface: '#FFFFFF',
      text: '#1A2F2C',
      accent: '#2A8A7C',
      accentHover: '#1F6B60',
      border: '#D0E0DE',
      secondary: '#3D5A56',
    },
    'Deep Slate': {
      bg: '#1E293B',
      surface: '#334155',
      text: '#F1F5F9',
      accent: '#38BDF8',
      accentHover: '#0284C7',
      border: '#475569',
      secondary: '#CBD5E1',
    },
  }

  const t = themes[theme] || themes['Calming Ivory']

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${appName}</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="app">
    <div class="card">
      <h1>${appName}</h1>
      <p class="subtitle">Built with Aureon Desk — Live Preview</p>
      <div class="counter" id="counter">0</div>
      <div class="btn-row">
        <button class="btn btn-inc" id="btn-increment">Increment</button>
        <button class="btn btn-reset" id="btn-reset">Reset</button>
      </div>
      <p class="footer">Generated by Aureon Desk</p>
    </div>
  </div>
  <script src="app.js"></script>
</body>
</html>`

  const css = `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: ${t.bg};
  color: ${t.text};
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
}

.app {
  max-width: 440px;
  width: 100%;
}

.card {
  background: ${t.surface};
  border-radius: 20px;
  padding: 2.5rem;
  box-shadow: 0 8px 32px rgba(44, 36, 22, 0.06), 0 2px 10px rgba(44, 36, 22, 0.03);
  text-align: center;
  border: 1px solid ${t.border};
}

h1 {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 1.75rem;
  margin-bottom: 0.25rem;
  color: ${t.accent};
  letter-spacing: -0.02em;
}

.subtitle {
  font-size: 0.8rem;
  color: ${t.secondary};
  margin-bottom: 1.5rem;
  font-style: italic;
  opacity: 0.7;
}

.counter {
  font-size: 3rem;
  font-weight: bold;
  color: ${t.text};
  margin: 1.25rem 0;
  font-variant-numeric: tabular-nums;
  transition: transform 0.15s ease;
  user-select: none;
}

.counter.bump {
  transform: scale(1.15);
}

.btn-row {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  border: none;
  border-radius: 10px;
  padding: 0.65rem 1.5rem;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  transition: background 0.15s, transform 0.1s;
}

.btn:active {
  transform: scale(0.97);
}

.btn-inc {
  background: ${t.accent};
  color: white;
}

.btn-inc:hover {
  background: ${t.accentHover};
}

.btn-reset {
  background: ${t.border};
  color: ${t.secondary};
}

.btn-reset:hover {
  background: ${t.border};
  opacity: 0.8;
}

.footer {
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid ${t.border};
  font-size: 0.75rem;
  color: ${t.secondary};
  font-style: italic;
  opacity: 0.6;
}`

  const js = `// ${appName} — Generated by Aureon Desk
// Prompt: ${prompt.replace(/\n/g, ' ').slice(0, 80)}

let count = 0;

const counterEl = document.getElementById('counter');
const btnIncrement = document.getElementById('btn-increment');
const btnReset = document.getElementById('btn-reset');

function updateDisplay() {
  counterEl.textContent = count;
}

function increment() {
  count++;
  updateDisplay();
  counterEl.classList.add('bump');
  setTimeout(function() {
    counterEl.classList.remove('bump');
  }, 150);
}

function reset() {
  count = 0;
  updateDisplay();
}

btnIncrement.addEventListener('click', increment);
btnReset.addEventListener('click', reset);

console.log('${appName} initialized. Counter ready.');`

  return {
    'index.html': html,
    'styles.css': css,
    'app.js': js,
  }
}

/** Create file operations from generated files */
function createFileOperations(files: Record<string, string>): FileOperation[] {
  const extToLang: Record<string, string> = {
    '.html': 'html',
    '.css': 'css',
    '.js': 'javascript',
    '.ts': 'typescript',
    '.json': 'json',
    '.md': 'markdown',
  }

  return Object.entries(files).map(([filePath, content]) => {
    const ext = path.extname(filePath)
    const language = extToLang[ext] || 'text'
    return {
      id: uuid(),
      type: 'create_file' as const,
      path: filePath,
      language,
      afterContent: content,
      diff: computeDiff('', content),
      status: 'pending' as const,
      risk: 'safe' as const,
    }
  })
}

/** Apply file operations to the sandbox directory */
function applyFileOperations(sandboxPath: string, operations: FileOperation[]): FileOperation[] {
  const applied: FileOperation[] = []
  for (const op of operations) {
    try {
      const resolved = path.resolve(sandboxPath, op.path)
      // Block path traversal
      if (!resolved.startsWith(path.resolve(sandboxPath))) {
        throw new Error('Path escapes sandbox directory')
      }
      // Redact secrets from content before writing
      const safeContent = redactSecrets(op.afterContent || '')

      if (op.type === 'create_file' || op.type === 'update_file') {
        const dir = path.dirname(resolved)
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
        fs.writeFileSync(resolved, safeContent, 'utf-8')
      } else if (op.type === 'mkdir') {
        if (!fs.existsSync(resolved)) fs.mkdirSync(resolved, { recursive: true })
      } else if (op.type === 'delete_file') {
        if (fs.existsSync(resolved)) fs.unlinkSync(resolved)
      } else if (op.type === 'rename_file' && op.oldPath) {
        const oldResolved = path.resolve(sandboxPath, op.oldPath)
        if (fs.existsSync(oldResolved)) {
          fs.renameSync(oldResolved, resolved)
        }
      }

      applied.push({ ...op, status: 'applied' })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      logger.error(`File operation failed for ${op.path}: ${msg}`)
      applied.push({ ...op, status: 'failed' })
    }
  }
  return applied
}

/** Stream a step to the renderer via callback */
function emitStep(step: BuildStep, completedSteps: BuildStep[], fileOps: FileOperation[], previewUrl: string | null, previewStatus: string | null, isComplete: boolean, error: string | null, isDemo: boolean, suggestions: FollowUpSuggestion[]) {
  if (_stepCallback) {
    const status: BuildPipelineStatus = {
      buildId: _currentBuildId,
      step,
      completedSteps,
      fileOperations: fileOps,
      previewUrl,
      previewStatus,
      isComplete,
      error,
      isDeterministicDemo: isDemo,
      followUpSuggestions: suggestions,
    }
    try {
      _stepCallback(status)
      // Also push to all renderer windows via IPC event
      BrowserWindow.getAllWindows().forEach(win => {
        if (!win.isDestroyed()) {
          win.webContents.send('build:step', status)
        }
      })
    } catch (err) {
      logger.error(`build:step push failed: ${err}`)
    }
  }
}

export const buildPipelineService = {
  /**
   * Run the full build pipeline.
   * Streams steps via the _stepCallback and IPC events.
   */
  async runBuild(request: BuildRequest): Promise<BuildResult> {
    _cancelled = false
    _currentBuildId = uuid()
    const buildId = _currentBuildId
    const completedSteps: BuildStep[] = []
    let fileOps: FileOperation[] = []
    let previewUrl: string | null = null
    let previewStatus: string | null = null
    let sandboxPath: string | null = null
    let suggestions: FollowUpSuggestion[] = []
    const isDemo = true // Always deterministic for now — no AI provider wired

    try {
      // Step 1: Classify intent
      const classifyStep = makeStep('classify', 'Classifying intent…')
      classifyStep.status = 'running'
      emitStep(classifyStep, completedSteps, fileOps, previewUrl, previewStatus, false, null, isDemo, suggestions)
      await sleep(300)
      if (_cancelled) return cancelResult(request, completedSteps, fileOps, suggestions, isDemo)

      const classification = classifyIntent(request.prompt)
      classifyStep.status = 'done'
      classifyStep.message = `Intent: ${classification.intent}, project: ${classification.suggestedName}`
      completedSteps.push(classifyStep)
      emitStep(classifyStep, completedSteps, fileOps, previewUrl, previewStatus, false, null, isDemo, suggestions)

      // Step 2: Create build plan
      const planStep = makeStep('plan', 'Creating build plan…')
      planStep.status = 'running'
      emitStep(planStep, completedSteps, fileOps, previewUrl, previewStatus, false, null, isDemo, suggestions)
      await sleep(400)
      if (_cancelled) return cancelResult(request, completedSteps, fileOps, suggestions, isDemo)

      const plan = [
        `Project type: ${classification.projectType}`,
        `App name: ${classification.suggestedName}`,
        `Files to generate: ${classification.suggestedFiles.join(', ')}`,
        `Theme: ${request.theme}`,
        `Mode: ${request.mode}`,
        isDemo ? 'Source: Deterministic local demo (no AI provider needed)' : 'Source: AI provider',
      ]
      planStep.status = 'done'
      completedSteps.push(planStep)
      emitStep(planStep, completedSteps, fileOps, previewUrl, previewStatus, false, null, isDemo, suggestions)

      // Step 3: Generate file operations
      const generateStep = makeStep('generate', 'Generating file operations…')
      generateStep.status = 'running'
      emitStep(generateStep, completedSteps, fileOps, previewUrl, previewStatus, false, null, isDemo, suggestions)

      const files = generateDeterministicApp(request.prompt, request.theme, classification.suggestedName)
      fileOps = createFileOperations(files)

      // Emit per-file generation steps
      for (const op of fileOps) {
        if (_cancelled) return cancelResult(request, completedSteps, fileOps, suggestions, isDemo)
        const fileStep = makeStep('generate', `Creating ${op.path}…`, op.path)
        fileStep.status = 'running'
        emitStep(fileStep, completedSteps, fileOps, previewUrl, previewStatus, false, null, isDemo, suggestions)
        await sleep(250) // Simulate generation time per file

        fileStep.status = 'done'
        completedSteps.push(fileStep)
        op.status = 'pending'
        emitStep(fileStep, completedSteps, fileOps, previewUrl, previewStatus, false, null, isDemo, suggestions)
      }

      generateStep.status = 'done'
      generateStep.message = `${fileOps.length} files generated`
      completedSteps.push(generateStep)
      emitStep(generateStep, completedSteps, fileOps, previewUrl, previewStatus, false, null, isDemo, suggestions)

      // If plan-only mode, stop here
      if (request.mode === 'plan-only') {
        const completeStep = makeStep('complete', 'Plan complete — review the generated files and apply when ready.')
        completeStep.status = 'done'
        completedSteps.push(completeStep)
        suggestions = generateFollowUpSuggestions(classification.intent)
        emitStep(completeStep, completedSteps, fileOps, null, null, true, null, isDemo, suggestions)
        return buildSuccess(request, completedSteps, fileOps, plan, null, null, null, suggestions, isDemo)
      }

      // Step 5: Apply to sandbox
      const applyStep = makeStep('apply', 'Applying file operations to sandbox…')
      applyStep.status = 'running'
      emitStep(applyStep, completedSteps, fileOps, previewUrl, previewStatus, false, null, isDemo, suggestions)

      // Create sandbox using live preview service
      const sandboxResult = livePreviewService.createSandbox({ templateType: 'html' })
      if (!sandboxResult.success) {
        throw new Error(sandboxResult.error || 'Failed to create sandbox')
      }
      sandboxPath = sandboxResult.sandboxPath

      fileOps = applyFileOperations(sandboxPath, fileOps)
      await sleep(200)
      if (_cancelled) return cancelResult(request, completedSteps, fileOps, suggestions, isDemo)

      applyStep.status = 'done'
      applyStep.message = `${fileOps.filter(o => o.status === 'applied').length} files applied`
      completedSteps.push(applyStep)
      emitStep(applyStep, completedSteps, fileOps, previewUrl, previewStatus, false, null, isDemo, suggestions)

      // Step 6-8: Start preview (if generate-and-preview mode)
      if (request.mode === 'generate-and-preview') {
        const previewStep = makeStep('preview_start', 'Starting preview server…')
        previewStep.status = 'running'
        emitStep(previewStep, completedSteps, fileOps, previewUrl, previewStatus, false, null, isDemo, suggestions)
        await sleep(100)

        // Stop any existing preview, then start the new sandbox
        livePreviewService.stopPreview()
        const status = livePreviewService.startPreview(sandboxPath)
        previewStatus = status.status
        previewUrl = status.url

        if (status.status === 'error') {
          throw new Error(status.error || 'Preview server failed to start')
        }

        // Wait for running state (in-process server is synchronous, so it should be immediate)
        await sleep(300)
        if (_cancelled) return cancelResult(request, completedSteps, fileOps, suggestions, isDemo)

        const currentStatus = livePreviewService.getStatus()
        previewStatus = currentStatus.status
        previewUrl = currentStatus.url

        previewStep.status = 'done'
        completedSteps.push(previewStep)
        emitStep(previewStep, completedSteps, fileOps, previewUrl, previewStatus, false, null, isDemo, suggestions)

        // Step 8: Preview rendered
        if (currentStatus.status === 'running') {
          const readyStep = makeStep('preview_ready', 'Preview rendered successfully!')
          readyStep.status = 'done'
          completedSteps.push(readyStep)
          emitStep(readyStep, completedSteps, fileOps, previewUrl, previewStatus, false, null, isDemo, suggestions)
        }
      }

      // Step 9: Follow-up suggestions
      const followupStep = makeStep('followup', 'Generating follow-up suggestions…')
      followupStep.status = 'running'
      emitStep(followupStep, completedSteps, fileOps, previewUrl, previewStatus, false, null, isDemo, suggestions)
      await sleep(200)

      suggestions = generateFollowUpSuggestions(classification.intent)
      followupStep.status = 'done'
      completedSteps.push(followupStep)
      emitStep(followupStep, completedSteps, fileOps, previewUrl, previewStatus, false, null, isDemo, suggestions)

      // Complete
      const completeStep = makeStep('complete', 'Build pipeline complete.')
      completeStep.status = 'done'
      completedSteps.push(completeStep)
      emitStep(completeStep, completedSteps, fileOps, previewUrl, previewStatus, true, null, isDemo, suggestions)

      return buildSuccess(request, completedSteps, fileOps, plan, previewUrl, previewStatus, sandboxPath, suggestions, isDemo)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      logger.error(`Build pipeline failed: ${msg}`)
      const errorStep = makeStep('error', `Pipeline error: ${msg}`)
      errorStep.status = 'error'
      completedSteps.push(errorStep)
      emitStep(errorStep, completedSteps, fileOps, previewUrl, previewStatus, true, msg, isDemo, suggestions)

      return {
        success: false,
        request,
        steps: completedSteps,
        fileOperations: fileOps,
        plan: [],
        previewUrl,
        previewStatus,
        sandboxPath,
        followUpSuggestions: suggestions,
        isDeterministicDemo: isDemo,
        error: msg,
      }
    } finally {
      _currentBuildId = null
    }
  },

  /** Cancel the current build */
  cancelBuild(): void {
    _cancelled = true
    logger.info('Build pipeline cancelled by user')
  },

  /** Register a callback for step updates */
  onStep(cb: StepCallback): () => void {
    _stepCallback = cb
    return () => { _stepCallback = null }
  },

  /** Reset state */
  reset(): void {
    _currentBuildId = null
    _cancelled = false
    _stepCallback = null
  },
}

// Helpers

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function cancelResult(request: BuildRequest, completedSteps: BuildStep[], fileOps: FileOperation[], suggestions: FollowUpSuggestion[], isDemo: boolean): BuildResult {
  const cancelStep = makeStep('cancelled', 'Build cancelled by user.')
  cancelStep.status = 'done'
  completedSteps.push(cancelStep)
  emitStep(cancelStep, completedSteps, fileOps, null, null, true, null, isDemo, suggestions)
  _currentBuildId = null
  return {
    success: false,
    request,
    steps: completedSteps,
    fileOperations: fileOps,
    plan: [],
    previewUrl: null,
    previewStatus: null,
    sandboxPath: null,
    followUpSuggestions: suggestions,
    isDeterministicDemo: isDemo,
    error: 'Cancelled by user',
  }
}

function buildSuccess(
  request: BuildRequest,
  steps: BuildStep[],
  fileOps: FileOperation[],
  plan: string[],
  previewUrl: string | null,
  previewStatus: string | null,
  sandboxPath: string | null,
  suggestions: FollowUpSuggestion[],
  isDemo: boolean,
): BuildResult {
  return {
    success: true,
    request,
    steps,
    fileOperations: fileOps,
    plan,
    previewUrl,
    previewStatus,
    sandboxPath,
    followUpSuggestions: suggestions,
    isDeterministicDemo: isDemo,
  }
}
