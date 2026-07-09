import { v4 as uuid } from 'uuid'
import { app, BrowserWindow } from 'electron'
import path from 'path'
import fs from 'fs'
import { logger } from '../utils/logger'
import { redactSecrets } from './log-redacter'
import { livePreviewService } from './live-preview.service'
import { providerService } from './provider.service'
import { modelRouterService } from './model-router.service'
import { callProviderApiStreaming } from './provider-call'
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

/** Generate a deterministic demo app based on the classified intent */
function generateDeterministicApp(
  prompt: string,
  theme: string,
  appName: string,
  intent: BuildIntentClassification['intent'],
): Record<string, string> {
  const t = THEME_COLORS[theme] || THEME_COLORS['Calming Ivory']

  switch (intent) {
    case 'build_dashboard':
      return _generateDashboard(appName, prompt, t)
    case 'build_game':
      return _generateMiniGame(appName, prompt, t)
    case 'build_component':
      return _generateComponent(appName, prompt, t)
    case 'build_app':
      return _generateLandingPage(appName, prompt, t)
    case 'build_utility':
    case 'generic':
    default:
      return _generateCounter(appName, prompt, t)
  }
}

// ─── Theme palette ───────────────────────────────────

const THEME_COLORS: Record<string, { bg: string; surface: string; text: string; accent: string; accentHover: string; border: string; secondary: string }> = {
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

interface ThemeToken { bg: string; surface: string; text: string; accent: string; accentHover: string; border: string; secondary: string }

// ─── Shared CSS helpers ──────────────────────────────

function _sharedCSS(t: ThemeToken): string {
  return `* {
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
  width: 100%;
}

.card {
  background: ${t.surface};
  border-radius: 20px;
  padding: 2.5rem;
  box-shadow: 0 8px 32px rgba(44, 36, 22, 0.06), 0 2px 10px rgba(44, 36, 22, 0.03);
  border: 1px solid ${t.border};
}

h1 {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 1.75rem;
  color: ${t.accent};
  letter-spacing: -0.02em;
  margin-bottom: 0.25rem;
}

h2 {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 1.1rem;
  color: ${t.text};
  margin-bottom: 0.75rem;
}

.subtitle {
  font-size: 0.8rem;
  color: ${t.secondary};
  margin-bottom: 1.5rem;
  font-style: italic;
  opacity: 0.7;
}

.btn-row {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 1rem;
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

.btn-primary {
  background: ${t.accent};
  color: white;
}

.btn-primary:hover {
  background: ${t.accentHover};
}

.btn-secondary {
  background: ${t.border};
  color: ${t.secondary};
}

.btn-secondary:hover {
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
  text-align: center;
}`
}

function _sharedHTMLHead(appName: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${appName}</title>
  <link rel="stylesheet" href="styles.css">
</head>`
}

// ─── Intent-specific generators ──────────────────────

/** build_utility / generic → Counter */
function _generateCounter(appName: string, prompt: string, t: ThemeToken): Record<string, string> {
  const html = `${_sharedHTMLHead(appName)}
<body>
  <div class="app">
    <div class="card" style="max-width:440px;margin:0 auto;text-align:center">
      <h1>${appName}</h1>
      <p class="subtitle">Built with Aureon Desk — Local Demo</p>
      <div class="counter" id="counter" style="font-size:3rem;font-weight:bold;margin:1.25rem 0;font-variant-numeric:tabular-nums;transition:transform 0.15s ease;user-select:none">0</div>
      <div class="btn-row">
        <button class="btn btn-primary" id="btn-increment">Increment</button>
        <button class="btn btn-secondary" id="btn-reset">Reset</button>
      </div>
      <p class="footer">Generated by Aureon Desk</p>
    </div>
  </div>
  <script src="app.js"></script>
</body>
</html>`

  const css = `${_sharedCSS(t)}

.counter.bump {
  transform: scale(1.15);
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

console.log('${appName} initialized.');`

  return { 'index.html': html, 'styles.css': css, 'app.js': js }
}

/** build_dashboard → Stats dashboard with live clock and mock metrics */
function _generateDashboard(appName: string, prompt: string, t: ThemeToken): Record<string, string> {
  const html = `${_sharedHTMLHead(appName)}
<body>
  <div class="app" style="max-width:800px;margin:0 auto">
    <div class="card" style="padding:2rem">
      <h1>${appName}</h1>
      <p class="subtitle">Built with Aureon Desk — Local Demo</p>
      <div class="grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem;margin-bottom:1.5rem">
        <div class="metric" style="background:${t.bg};border-radius:14px;padding:1.25rem;text-align:center;border:1px solid ${t.border}">
          <div style="font-size:2rem;font-weight:bold;color:${t.accent}" id="metric-users">—</div>
          <div style="font-size:0.75rem;color:${t.secondary};margin-top:0.25rem">Active Users</div>
        </div>
        <div class="metric" style="background:${t.bg};border-radius:14px;padding:1.25rem;text-align:center;border:1px solid ${t.border}">
          <div style="font-size:2rem;font-weight:bold;color:${t.accent}" id="metric-revenue">—</div>
          <div style="font-size:0.75rem;color:${t.secondary};margin-top:0.25rem">Revenue</div>
        </div>
        <div class="metric" style="background:${t.bg};border-radius:14px;padding:1.25rem;text-align:center;border:1px solid ${t.border}">
          <div style="font-size:2rem;font-weight:bold;color:${t.accent}" id="metric-uptime">—</div>
          <div style="font-size:0.75rem;color:${t.secondary};margin-top:0.25rem">Uptime</div>
        </div>
        <div class="metric" style="background:${t.bg};border-radius:14px;padding:1.25rem;text-align:center;border:1px solid ${t.border}">
          <div style="font-size:1.5rem;font-weight:bold;color:${t.text}" id="clock">—</div>
          <div style="font-size:0.75rem;color:${t.secondary};margin-top:0.25rem">Live Clock</div>
        </div>
      </div>
      <div class="btn-row">
        <button class="btn btn-primary" id="btn-refresh">Refresh Data</button>
      </div>
      <p class="footer">Generated by Aureon Desk</p>
    </div>
  </div>
  <script src="app.js"></script>
</body>
</html>`

  const css = `${_sharedCSS(t)}

.metric {
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.metric:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(44,36,22,0.06);
}`

  const js = `// ${appName} — Generated by Aureon Desk
// Prompt: ${prompt.replace(/\n/g, ' ').slice(0, 80)}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function updateMetrics() {
  document.getElementById('metric-users').textContent = randomInt(120, 980).toLocaleString();
  document.getElementById('metric-revenue').textContent = '$' + randomInt(1500, 28000).toLocaleString();
  document.getElementById('metric-uptime').textContent = (99 + Math.random()).toFixed(2) + '%';
}

function updateClock() {
  const now = new Date();
  document.getElementById('clock').textContent = now.toLocaleTimeString();
}

updateMetrics();
updateClock();
setInterval(updateClock, 1000);

document.getElementById('btn-refresh').addEventListener('click', function() {
  updateMetrics();
  updateClock();
});

console.log('${appName} initialized.');`

  return { 'index.html': html, 'styles.css': css, 'app.js': js }
}

/** build_app → Landing page with hero, features, and CTA */
function _generateLandingPage(appName: string, prompt: string, t: ThemeToken): Record<string, string> {
  const html = `${_sharedHTMLHead(appName)}
<body>
  <div class="app" style="max-width:800px;margin:0 auto">
    <div class="card" style="text-align:center;padding:3rem 2rem">
      <div style="width:48px;height:48px;border-radius:12px;background:${t.accent};opacity:0.15;margin:0 auto 1.25rem"></div>
      <h1>${appName}</h1>
      <p class="subtitle">A beautifully crafted web experience — built with Aureon Desk.</p>
      <div class="btn-row" style="margin-bottom:2rem">
        <button class="btn btn-primary" id="btn-cta">Get Started</button>
        <button class="btn btn-secondary" id="btn-learn">Learn More</button>
      </div>
      <div class="features" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1.25rem;text-align:left;margin-top:2rem">
        <div class="feature" style="background:${t.bg};border-radius:14px;padding:1.25rem;border:1px solid ${t.border}">
          <div style="font-weight:bold;color:${t.accent};margin-bottom:0.4rem">⚡ Fast</div>
          <div style="font-size:0.8rem;color:${t.secondary}">Lightning-quick performance with zero dependencies.</div>
        </div>
        <div class="feature" style="background:${t.bg};border-radius:14px;padding:1.25rem;border:1px solid ${t.border}">
          <div style="font-weight:bold;color:${t.accent};margin-bottom:0.4rem">🔒 Secure</div>
          <div style="font-size:0.8rem;color:${t.secondary}">Enterprise-grade security built into every layer.</div>
        </div>
        <div class="feature" style="background:${t.bg};border-radius:14px;padding:1.25rem;border:1px solid ${t.border}">
          <div style="font-weight:bold;color:${t.accent};margin-bottom:0.4rem">🎨 Beautiful</div>
          <div style="font-size:0.8rem;color:${t.secondary}">Premium calm-ivory design with smooth transitions.</div>
        </div>
      </div>
      <p class="footer">Generated by Aureon Desk</p>
    </div>
  </div>
  <script src="app.js"></script>
</body>
</html>`

  const css = `${_sharedCSS(t)}

.feature {
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.feature:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(44,36,22,0.06);
}`

  const js = `// ${appName} — Generated by Aureon Desk
// Prompt: ${prompt.replace(/\n/g, ' ').slice(0, 80)}

document.getElementById('btn-cta').addEventListener('click', function() {
  alert('Welcome to ${appName}!\\n\\nThis is a local demo generated by Aureon Desk.');
});

document.getElementById('btn-learn').addEventListener('click', function() {
  document.querySelector('.features').scrollIntoView({ behavior: 'smooth' });
});

console.log('${appName} initialized.');`

  return { 'index.html': html, 'styles.css': css, 'app.js': js }
}

/** build_game → Simple reaction-click mini game */
function _generateMiniGame(appName: string, prompt: string, t: ThemeToken): Record<string, string> {
  const html = `${_sharedHTMLHead(appName)}
<body>
  <div class="app">
    <div class="card" style="max-width:440px;margin:0 auto;text-align:center">
      <h1>${appName}</h1>
      <p class="subtitle">Built with Aureon Desk — Local Demo</p>
      <div style="font-size:0.85rem;color:${t.secondary};margin-bottom:1rem">Click the target as fast as you can!</div>
      <div style="display:flex;gap:1rem;justify-content:center;margin-bottom:1rem">
        <div style="font-size:1.25rem;font-weight:bold;color:${t.accent}">Score: <span id="score">0</span></div>
        <div style="font-size:1.25rem;font-weight:bold;color:${t.text}">Time: <span id="timer">30</span>s</div>
      </div>
      <div id="game-area" style="background:${t.bg};border-radius:16px;height:200px;position:relative;cursor:crosshair;overflow:hidden;border:2px dashed ${t.border};margin-bottom:1rem">
        <div id="target" style="width:50px;height:50px;border-radius:50%;background:${t.accent};position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);transition:top 0.08s,left 0.08s;cursor:pointer;display:none"></div>
        <div id="start-msg" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:${t.secondary};font-style:italic">Press Start to play</div>
      </div>
      <div class="btn-row">
        <button class="btn btn-primary" id="btn-start">Start Game</button>
        <button class="btn btn-secondary" id="btn-reset">Reset</button>
      </div>
      <p class="footer">Generated by Aureon Desk</p>
    </div>
  </div>
  <script src="app.js"></script>
</body>
</html>`

  const css = `${_sharedCSS(t)}

#target {
  box-shadow: 0 0 12px ${t.accent}33;
}`

  const js = `// ${appName} — Generated by Aureon Desk
// Prompt: ${prompt.replace(/\n/g, ' ').slice(0, 80)}

let score = 0;
let timeLeft = 30;
let gameRunning = false;
let timerInterval = null;

const scoreEl = document.getElementById('score');
const timerEl = document.getElementById('timer');
const target = document.getElementById('target');
const gameArea = document.getElementById('game-area');
const startMsg = document.getElementById('start-msg');
const btnStart = document.getElementById('btn-start');
const btnReset = document.getElementById('btn-reset');

function moveTarget() {
  const area = gameArea.getBoundingClientRect();
  const size = 50;
  const x = Math.random() * (area.width - size);
  const y = Math.random() * (area.height - size);
  target.style.left = x + 'px';
  target.style.top = y + 'px';
}

function startGame() {
  score = 0;
  timeLeft = 30;
  gameRunning = true;
  scoreEl.textContent = '0';
  timerEl.textContent = '30';
  target.style.display = 'block';
  startMsg.style.display = 'none';
  btnStart.disabled = true;
  moveTarget();
  timerInterval = setInterval(function() {
    timeLeft--;
    timerEl.textContent = timeLeft;
    if (timeLeft <= 0) endGame();
  }, 1000);
}

function endGame() {
  gameRunning = false;
  clearInterval(timerInterval);
  target.style.display = 'none';
  startMsg.style.display = 'block';
  startMsg.textContent = 'Game over! Final score: ' + score;
  btnStart.disabled = false;
}

target.addEventListener('click', function() {
  if (!gameRunning) return;
  score++;
  scoreEl.textContent = score;
  moveTarget();
});

btnStart.addEventListener('click', startGame);
btnReset.addEventListener('click', function() {
  if (gameRunning) endGame();
  score = 0;
  timeLeft = 30;
  scoreEl.textContent = '0';
  timerEl.textContent = '30';
  startMsg.textContent = 'Press Start to play';
});

console.log('${appName} initialized.');`

  return { 'index.html': html, 'styles.css': css, 'app.js': js }
}

/** build_component → Reusable UI component showcase (tabs, toggle, cards) */
function _generateComponent(appName: string, prompt: string, t: ThemeToken): Record<string, string> {
  const html = `${_sharedHTMLHead(appName)}
<body>
  <div class="app" style="max-width:640px;margin:0 auto">
    <div class="card" style="padding:2rem">
      <h1>${appName}</h1>
      <p class="subtitle">Built with Aureon Desk — Local Demo</p>
      
      <!-- Tabs -->
      <div style="margin-bottom:1.5rem">
        <div class="tab-bar" style="display:flex;gap:0;border-bottom:2px solid ${t.border};margin-bottom:1rem">
          <button class="tab active" data-tab="0" style="flex:1;padding:0.6rem 0;border:none;background:none;font-weight:600;font-size:0.85rem;cursor:pointer;color:${t.accent};border-bottom:2px solid ${t.accent};margin-bottom:-2px;transition:color 0.15s;font-family:inherit">Preview</button>
          <button class="tab" data-tab="1" style="flex:1;padding:0.6rem 0;border:none;background:none;font-weight:600;font-size:0.85rem;cursor:pointer;color:${t.secondary};transition:color 0.15s;font-family:inherit">Code</button>
          <button class="tab" data-tab="2" style="flex:1;padding:0.6rem 0;border:none;background:none;font-weight:600;font-size:0.85rem;cursor:pointer;color:${t.secondary};transition:color 0.15s;font-family:inherit">Settings</button>
        </div>
        <div class="tab-content active" data-content="0" style="padding:1rem;background:${t.bg};border-radius:12px">
          <p style="color:${t.text}">This is the <strong>Preview</strong> tab. Components render here.</p>
        </div>
        <div class="tab-content" data-content="1" style="display:none;padding:1rem;background:${t.bg};border-radius:12px;font-family:monospace;font-size:0.8rem;color:${t.secondary}">
          &lt;Component preview=&quot;live&quot; /&gt;
        </div>
        <div class="tab-content" data-content="2" style="display:none;padding:1rem;background:${t.bg};border-radius:12px;color:${t.secondary}">
          Configure component settings here.
        </div>
      </div>

      <!-- Toggle -->
      <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.5rem;padding:1rem;background:${t.bg};border-radius:12px">
        <span style="font-weight:600;color:${t.text};font-size:0.9rem">Dark Mode</span>
        <button id="toggle" class="toggle" style="width:48px;height:26px;border-radius:13px;border:none;background:${t.border};cursor:pointer;position:relative;transition:background 0.2s;padding:0">
          <span class="toggle-knob" style="display:block;width:20px;height:20px;border-radius:50%;background:white;position:absolute;top:3px;left:3px;transition:left 0.2s;box-shadow:0 1px 3px rgba(0,0,0,0.15)"></span>
        </button>
        <span id="toggle-label" style="font-size:0.8rem;color:${t.secondary}">Off</span>
      </div>

      <p class="footer">Generated by Aureon Desk</p>
    </div>
  </div>
  <script src="app.js"></script>
</body>
</html>`

  const css = `${_sharedCSS(t)}

.toggle.on {
  background: ${t.accent} !important;
}

.toggle.on .toggle-knob {
  left: 25px;
}`

  const js = `// ${appName} — Generated by Aureon Desk
// Prompt: ${prompt.replace(/\n/g, ' ').slice(0, 80)}

// Tab switching
const tabs = document.querySelectorAll('.tab');
const contents = document.querySelectorAll('.tab-content');

tabs.forEach(function(tab) {
  tab.addEventListener('click', function() {
    const idx = this.getAttribute('data-tab');
    tabs.forEach(function(t) {
      t.classList.remove('active');
      t.style.color = '${t.secondary}';
      t.style.borderBottomColor = 'transparent';
    });
    this.classList.add('active');
    this.style.color = '${t.accent}';
    this.style.borderBottomColor = '${t.accent}';
    contents.forEach(function(c) {
      c.style.display = c.getAttribute('data-content') === idx ? 'block' : 'none';
    });
  });
});

// Toggle switch
const toggle = document.getElementById('toggle');
const toggleLabel = document.getElementById('toggle-label');
let isOn = false;

toggle.addEventListener('click', function() {
  isOn = !isOn;
  if (isOn) {
    toggle.classList.add('on');
    toggleLabel.textContent = 'On';
  } else {
    toggle.classList.remove('on');
    toggleLabel.textContent = 'Off';
  }
});

console.log('${appName} initialized.');`

  return { 'index.html': html, 'styles.css': css, 'app.js': js }
}

/**
 * Generate code using an AI provider via its chat completions API.
 * Returns a Record of filename → content, same shape as generateDeterministicApp.
 * Throws on failure so the caller can fall back to the deterministic demo.
 */
async function generateWithAI(
  prompt: string,
  theme: string,
  appName: string,
  modelId: string,
): Promise<Record<string, string>> {
  // Resolve provider/model
  const ref = providerService.resolveCanonicalModelReference(modelId)
  if (!ref) throw new Error('Provider/model not found or disabled')

  const provider = providerService.getProvider(ref.providerId)
  if (!provider) throw new Error('Provider not found')

  const model = provider.models.find(m => m.id === ref.modelId)
  if (!model) throw new Error('Model not found')

  // Get API key (optional for local providers)
  const apiKey = providerService.getApiKey(ref.providerId)
  const isLocal = ref.adapterType === 'ollama' || ref.adapterType === 'lmstudio'
  if (!isLocal && !apiKey) {
    throw new Error(`No API key configured for ${ref.providerName}. Go to Settings → Providers to add your key.`)
  }

  // Build the code-generation system prompt
  const themeColors: Record<string, { bg: string; surface: string; text: string; accent: string; border: string }> = {
    'Calming Ivory': { bg: '#FAF7F2', surface: '#FFFFFF', text: '#221A0F', accent: '#B8683A', border: '#E4DEC9' },
    'Soft Teal': { bg: '#F0F7F6', surface: '#FFFFFF', text: '#1A2F2C', accent: '#2A8A7C', border: '#D0E0DE' },
    'Deep Slate': { bg: '#1E293B', surface: '#334155', text: '#F1F5F9', accent: '#38BDF8', border: '#475569' },
  }
  const tc = themeColors[theme] || themeColors['Calming Ivory']

  const systemPrompt = `You are a web app code generator. Generate a complete, working single-page web application based on the user's request.

IMPORTANT — Output format:
You MUST respond with ONLY a valid JSON object containing these exact keys:
{
  "index.html": "<full HTML content>",
  "styles.css": "<full CSS content>",
  "app.js": "<full JavaScript content>"
}

Design rules:
- Use a subtle, calm design palette: background ${tc.bg}, surface ${tc.surface}, text ${tc.text}, accent ${tc.accent}, border ${tc.border}
- Use Georgia/Times New Roman serif for headings, system sans-serif for body
- Add smooth transitions, rounded corners, and subtle shadows for a premium feel
- Make the app fully functional and interactive
- Include a footer "Generated by Aureon Desk"
- No external dependencies, no CDN links, no API calls
- All code must be self-contained in the three files

Respond with ONLY the JSON object. No markdown, no explanation, no code fences. Just raw JSON.`

  const userMessage = `App name: ${appName}
Theme: ${theme}

User request: ${prompt}

Generate the complete HTML, CSS, and JavaScript files for this app. Output ONLY the JSON object with keys "index.html", "styles.css", and "app.js".`

  // Build the API request
  const baseUrl = ref.baseUrl || provider.base_url || ''
  const adapter = ref.adapterType

  logger.info(`AI code generation: ${ref.providerName}/${ref.modelName} (${adapter})`, {
    providerId: ref.providerId,
    modelId: ref.modelId,
    isLocal,
  })

  const startTime = Date.now()

  // Accumulated streaming text for UI progress
  let streamingText = ''
  let streamingTokens = 0

  // Push streaming progress to renderer
  const onStreamToken = (chunk: string) => {
    streamingText += chunk
    streamingTokens++
    // Only push every ~10 token callbacks to avoid overwhelming IPC
    if (streamingTokens % 10 === 0 && _stepCallback && _currentBuildId) {
      emitStep(makeStep('generate', `Generating code… (${(streamingText.length / 1024).toFixed(1)} KB)`),
        [], [], null, null, false, null, false, [], streamingText, true,
        `${model.display_name || model.name} via ${ref.providerName}`)
    }
  }

  let responseText: string

  try {
    responseText = await callProviderApiStreaming({
      adapter,
      baseUrl,
      apiKey,
      model: model.name,
      systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
      temperature: 0.3,
      maxTokens: 8192,
      timeoutMs: adapter === 'ollama' ? 180000 : 120000,
    }, onStreamToken)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    logger.error(`AI code generation failed: ${msg}`)
    throw err
  }

  const duration = Date.now() - startTime
  logger.info(`AI code generation completed in ${duration}ms`, {
    providerName: ref.providerName,
    modelName: ref.modelName,
    responseLength: responseText.length,
  })

  // Record usage for token tracking
  modelRouterService.recordUsage(model.name)

  // Parse the response — try JSON first, then markdown code blocks
  const files = parseCodeResponse(responseText)
  if (Object.keys(files).length === 0) {
    throw new Error('AI response did not contain valid code files')
  }

  return files
}

/** Parse AI response into files. Tries JSON first, then markdown code blocks.
 * Accepts arbitrary file paths including SVG, nested dirs, and additional assets. */
function parseCodeResponse(text: string): Record<string, string> {
  // Allowed file extensions for safety
  const ALLOWED_EXTS = ['.html', '.css', '.js', '.ts', '.jsx', '.tsx', '.json', '.svg', '.txt', '.md', '.xml']
  function isSafePath(p: string): boolean {
    const normalized = p.replace(/\\/g, '/')
    // Block path traversal
    if (normalized.includes('..')) return false
    const ext = normalized.includes('.') ? normalized.slice(normalized.lastIndexOf('.')) : ''
    return ALLOWED_EXTS.includes(ext.toLowerCase())
  }

  // Try direct JSON parse
  try {
    const trimmed = text.trim()
    // Handle common wrapping patterns
    const jsonStr = trimmed.startsWith('```json') ? trimmed.slice(7, -3).trim()
      : trimmed.startsWith('```') ? trimmed.slice(3, -3).trim()
      : trimmed
    const parsed = JSON.parse(jsonStr) as Record<string, unknown>
    const files: Record<string, string> = {}
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === 'string' && value.length > 10 && isSafePath(key)) {
        files[key] = value
      }
    }
    if (Object.keys(files).length > 0) return files
  } catch {
    // Not valid JSON, try markdown code blocks
  }

  // Try extracting from markdown code blocks (fix: use correct regex groups)
  const files: Record<string, string> = {}
  const codeBlockRegex = /```\s*(html|css|javascript|js|svg)\s*\n([\s\S]*?)```/gi
  const langMap: Record<string, string> = { html: 'index.html', css: 'styles.css', javascript: 'app.js', js: 'app.js', svg: 'icon.svg' }
  let match: RegExpExecArray | null
  while ((match = codeBlockRegex.exec(text)) !== null) {
    const lang = match[1]
    const content = match[2].trim()
    const fileName = langMap[lang]
    if (fileName && content.length > 10 && !files[fileName]) {
      files[fileName] = content
    }
  }

  return files
}

/** Maps file extensions to language identifiers */
const EXT_TO_LANG: Record<string, string> = {
  '.html': 'html',
  '.css': 'css',
  '.js': 'javascript',
  '.ts': 'typescript',
  '.json': 'json',
  '.md': 'markdown',
}

function fileLanguage(filePath: string): string {
  return EXT_TO_LANG[path.extname(filePath)] || 'text'
}

function fileRisk(opType: FileOperation['type']): FileOperation['risk'] {
  if (opType === 'delete_file') return 'destructive'
  return 'safe'
}

/**
 * Compute file operations by comparing new files against existing sandbox files.
 * This enables the full bolt.diy editing workflow: create, update, delete, rename, mkdir.
 */
function computeDeltaFileOperations(
  existingFiles: Record<string, string> | null,
  newFiles: Record<string, string>,
): FileOperation[] {
  const ops: FileOperation[] = []
  const createdDirs = new Set<string>()

  // Helper: add mkdir operations for parent directories
  function ensureMkdir(filePath: string) {
    const parts = filePath.split('/')
    // Build up partial paths to find directories (skip the filename at the end)
    for (let i = 0; i < parts.length - 1; i++) {
      const dirPath = parts.slice(0, i + 1).join('/')
      if (!createdDirs.has(dirPath)) {
        createdDirs.add(dirPath)
        ops.push({
          id: uuid(),
          type: 'mkdir',
          path: dirPath,
          language: 'text',
          status: 'pending',
          risk: 'safe',
        })
      }
    }
  }

  // If no existing files, all operations are create_file + mkdir for directories
  if (!existingFiles) {
    for (const [filePath, content] of Object.entries(newFiles)) {
      ensureMkdir(filePath)
      ops.push({
        id: uuid(),
        type: 'create_file',
        path: filePath,
        language: fileLanguage(filePath),
        afterContent: content,
        diff: computeDiff('', content),
        status: 'pending',
        risk: 'safe',
      })
    }
    return ops
  }

  // Build lookup of new file paths for quick existence checks
  const newFileSet = new Set(Object.keys(newFiles))

  // Build content-to-path map from existing files for rename detection
  const contentToExistingPath = new Map<string, string>()
  for (const [existingPath, existingContent] of Object.entries(existingFiles)) {
    contentToExistingPath.set(existingContent, existingPath)
  }

  // Track which existing files have been matched to a new file
  const matchedExisting = new Set<string>()

  // Process new files: determine create_file vs update_file vs rename_file
  for (const [newPath, newContent] of Object.entries(newFiles)) {
    ensureMkdir(newPath)

    if (existingFiles[newPath] !== undefined) {
      // File exists at same path
      matchedExisting.add(newPath)
      if (existingFiles[newPath] === newContent) {
        // Content unchanged — skip (no operation needed)
        ops.push({
          id: uuid(),
          type: 'update_file',
          path: newPath,
          language: fileLanguage(newPath),
          beforeContent: existingFiles[newPath],
          afterContent: newContent,
          diff: [],
          status: 'skipped',
          risk: 'safe',
        })
      } else {
        // Content changed — update_file
        ops.push({
          id: uuid(),
          type: 'update_file',
          path: newPath,
          language: fileLanguage(newPath),
          beforeContent: existingFiles[newPath],
          afterContent: newContent,
          diff: computeDiff(existingFiles[newPath], newContent),
          status: 'pending',
          risk: 'safe',
        })
      }
    } else if (contentToExistingPath.has(newContent) && !matchedExisting.has(contentToExistingPath.get(newContent)!)) {
      // Same content exists at a different path — rename_file
      const oldPath = contentToExistingPath.get(newContent)!
      matchedExisting.add(oldPath)
      ops.push({
        id: uuid(),
        type: 'rename_file',
        path: newPath,
        oldPath,
        language: fileLanguage(newPath),
        afterContent: newContent,
        status: 'pending',
        risk: 'safe',
      })
    } else {
      // File doesn't exist — create_file
      ops.push({
        id: uuid(),
        type: 'create_file',
        path: newPath,
        language: fileLanguage(newPath),
        afterContent: newContent,
        diff: computeDiff('', newContent),
        status: 'pending',
        risk: 'safe',
      })
    }
  }

  // Process remaining existing files not matched: they're deleted
  for (const [existingPath, existingContent] of Object.entries(existingFiles)) {
    if (!matchedExisting.has(existingPath) && !newFileSet.has(existingPath)) {
      ops.push({
        id: uuid(),
        type: 'delete_file',
        path: existingPath,
        language: fileLanguage(existingPath),
        beforeContent: existingContent,
        diff: computeDiff(existingContent, ''),
        status: 'pending',
        risk: 'destructive',
      })
    }
  }

  return ops
}

/** Create file operations from generated files — uses delta computation when sandbox has existing files */
function createFileOperations(
  files: Record<string, string>,
  existingFiles?: Record<string, string> | null,
): FileOperation[] {
  return computeDeltaFileOperations(existingFiles || null, files)
}

/** Read all text files from a sandbox directory (recursive) to detect existing state */
function readExistingSandboxFiles(sandboxPath: string): Record<string, string> {
  const files: Record<string, string> = {}
  try {
    function walkDir(dir: string, relativeBase: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        const relPath = relativeBase ? `${relativeBase}/${entry.name}` : entry.name
        if (entry.isDirectory()) {
          // Skip hidden dirs and node_modules
          if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
            walkDir(fullPath, relPath)
          }
        } else if (entry.isFile()) {
          // Only read text files (skip binaries by extension)
          const ext = path.extname(entry.name).toLowerCase()
          const textExts = ['.html', '.css', '.js', '.ts', '.jsx', '.tsx', '.json', '.md', '.txt', '.xml', '.svg', '.yml', '.yaml', '.toml', '.env']
          if (textExts.includes(ext) || ext === '') {
            try {
              files[relPath] = fs.readFileSync(fullPath, 'utf-8')
            } catch {
              // Skip files that can't be read as UTF-8
            }
          }
        }
      }
    }
    walkDir(sandboxPath, '')
  } catch {
    // Sandbox doesn't exist yet — return empty
  }
  return files
}

/** Apply file operations to the sandbox directory */
function applyFileOperations(sandboxPath: string, operations: FileOperation[]): FileOperation[] {
  const applied: FileOperation[] = []
  for (const op of operations) {
    // Skip unchanged files — no need to re-write identical content
    if (op.status === 'skipped') {
      applied.push(op)
      continue
    }
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
        // Also block path traversal on the old path
        if (!oldResolved.startsWith(path.resolve(sandboxPath))) {
          throw new Error('Old path escapes sandbox directory')
        }
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
function emitStep(step: BuildStep, completedSteps: BuildStep[], fileOps: FileOperation[], previewUrl: string | null, previewStatus: string | null, isComplete: boolean, error: string | null, isDemo: boolean, suggestions: FollowUpSuggestion[], streamingRawText?: string, isStreaming?: boolean, generatingModelLabel?: string) {
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
      streamingRawText: streamingRawText || undefined,
      isStreaming: isStreaming || undefined,
      generatingModelLabel: generatingModelLabel || undefined,
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
    const hasProvider = !!request.providerModelRoute
    let isDemo = !hasProvider

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

      // Resolve model label for plan display
      let modelLabel: string | null = null
      if (hasProvider && request.providerModelRoute) {
        try {
          const ref = providerService.resolveCanonicalModelReference(request.providerModelRoute)
          if (ref) {
            const provider = providerService.getProvider(ref.providerId)
            const model = provider?.models.find(m => m.id === ref.modelId)
            if (model) {
              modelLabel = `${model.display_name || model.name} via ${ref.providerName}`
            }
          }
        } catch { /* ignore resolution errors */ }
      }

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
        isDemo ? 'Source: Deterministic local demo (no AI provider needed)' : `Source: ${modelLabel || 'AI provider'}`,
      ]
      planStep.status = 'done'
      completedSteps.push(planStep)
      emitStep(planStep, completedSteps, fileOps, previewUrl, previewStatus, false, null, isDemo, suggestions)

      // Step 3: Generate file operations
      const generateStep = makeStep('generate', 'Generating file operations…')
      generateStep.status = 'running'
      emitStep(generateStep, completedSteps, fileOps, previewUrl, previewStatus, false, null, isDemo, suggestions)

      // Generate files: use AI provider if available, otherwise deterministic demo
      let files: Record<string, string>
      if (hasProvider && request.providerModelRoute) {
        try {
          files = await generateWithAI(request.prompt, request.theme, classification.suggestedName, request.providerModelRoute)
          generateStep.message = `${Object.keys(files).length} files generated by AI`
        } catch (aiErr) {
          const aiMsg = aiErr instanceof Error ? aiErr.message : String(aiErr)
          logger.warn(`AI code generation failed, falling back to deterministic demo: ${aiMsg}`)
          // Update isDemo since we fell back to the local demo
          isDemo = true
          // Generate a warning step about the fallback
          const fallbackMsg: BuildStep = makeStep('generate', `AI generation unavailable (${aiMsg.slice(0, 80)}). Using local demo instead.`)
          fallbackMsg.status = 'done'
          completedSteps.push(fallbackMsg)
          emitStep(fallbackMsg, completedSteps, fileOps, previewUrl, previewStatus, false, null, isDemo, suggestions)
          files = generateDeterministicApp(request.prompt, request.theme, classification.suggestedName, classification.intent)
          generateStep.message = `${Object.keys(files).length} files generated (local demo)`
        }
      } else {
        files = generateDeterministicApp(request.prompt, request.theme, classification.suggestedName, classification.intent)
      }
      // Compute file operations for UI diff display.
      // For fresh/initial builds, don't diff against a previous sandbox —
      // always use null so ALL files show as create_file ops.
      let existingFiles: Record<string, string> | null = null
      if (request.baseSandboxPath) {
        existingFiles = readExistingSandboxFiles(request.baseSandboxPath)
      }
      fileOps = createFileOperations(files, existingFiles)

      // Emit per-file generation steps
      const opLabels: Record<string, string> = {
        create_file: 'Creating',
        update_file: 'Updating',
        delete_file: 'Deleting',
        rename_file: 'Renaming',
        mkdir: 'Making directory',
      }
      for (const op of fileOps) {
        if (op.status === 'skipped') continue // Skip unchanged files
        if (_cancelled) return cancelResult(request, completedSteps, fileOps, suggestions, isDemo)
        const label = opLabels[op.type] || 'Processing'
        const fileStep = makeStep('generate', `${label} ${op.path}…`, op.path)
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

      // Step 5: Apply to sandbox — write FULL file snapshot (not delta-only).
      // Delta ops are for UI display only; the sandbox always gets every generated file.
      const applyStep = makeStep('apply', 'Writing files to sandbox…')
      applyStep.status = 'running'
      emitStep(applyStep, completedSteps, fileOps, previewUrl, previewStatus, false, null, isDemo, suggestions)

      // Create sandbox directory
      const sandboxResult = livePreviewService.createSandbox({ templateType: 'html' })
      if (!sandboxResult.success) {
        throw new Error(sandboxResult.error || 'Failed to create sandbox')
      }
      sandboxPath = sandboxResult.sandboxPath

      // Write ALL generated files into the sandbox (not just delta ops)
      for (const [relPath, content] of Object.entries(files)) {
        const resolved = path.resolve(sandboxPath, relPath)
        if (!resolved.startsWith(path.resolve(sandboxPath))) {
          throw new Error(`Path traversal blocked: ${relPath}`)
        }
        const dir = path.dirname(resolved)
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
        const safeContent = redactSecrets(content)
        fs.writeFileSync(resolved, safeContent, 'utf-8')
      }

      await sleep(200)
      if (_cancelled) return cancelResult(request, completedSteps, fileOps, suggestions, isDemo)

      applyStep.status = 'done'
      applyStep.message = `${Object.keys(files).length} files written to sandbox`
      completedSteps.push(applyStep)
      emitStep(applyStep, completedSteps, fileOps, previewUrl, previewStatus, false, null, isDemo, suggestions)

      // Step 6-8: Start preview server (only for generate-and-preview mode).
      // Files were already written to the sandbox in Step 5 above.
      if (request.mode === 'generate-and-preview') {
        const previewStep = makeStep('preview_start', 'Starting preview server…')
        previewStep.status = 'running'
        emitStep(previewStep, completedSteps, fileOps, previewUrl, previewStatus, false, null, isDemo, suggestions)
        await sleep(100)

        // Stop any existing preview, then start the new sandbox
        livePreviewService.stopPreview()
        const status = livePreviewService.startPreview(sandboxPath!)
        previewStatus = status.status
        previewUrl = status.url

        if (status.status === 'error') {
          throw new Error(status.error || 'Preview server failed to start')
        }

        // Wait for running state
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
