#!/usr/bin/env node

/**
 * Aureon Desk — Manual QA Guide
 *
 * Usage: node scripts/manual-qa-guide.mjs
 *
 * This script prints the human QA checklist and setup instructions.
 * It does NOT run automated tests — it's a guide for visual manual testing.
 */

import { readFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = join(__dirname, '..')

const SECTIONS = [
  {
    title: '1. Pre-flight Checks',
    steps: [
      'Run: npm run verify:native',
      'Run: npm run typecheck',
      'Run: npm test',
      'Run: npm run build',
      'Run: git grep "sk-or-v1" | grep -v docs | grep -v test',
      'Check: git status (should be clean or only intended changes)',
    ]
  },
  {
    title: '2. Launch the App',
    steps: [
      'Run: npm run dev',
      'Wait for Electron window to open (~10-15 seconds)',
      'Verify window title shows "Aureon Desk"',
      'Resize window to 1920×1080 for initial testing',
    ]
  },
  {
    title: '3. Window Basics (7 checks)',
    steps: [
      '✓ App launches without crash',
      '✓ Window title is "Aureon Desk"',
      '✓ Native window controls work (min/max/close)',
      '✓ Taskbar icon shows correctly',
      '✓ Window resizes without breaking layout',
      '✓ Test at 1366×768 — no overlapping panels',
      '✓ Test at 1920×1080 — layout uses space well',
    ]
  },
  {
    title: '4. Logo & Branding (5 checks)',
    steps: [
      '✓ Sidebar logo renders (SVG, no blur)',
      '✓ No fake vendor logos in Connectors page',
      '✓ Studio hero icon renders correctly',
      '✓ No broken image icons anywhere',
      '✓ BrandLockup shows "Aureon Desk" text',
    ]
  },
  {
    title: '5. Sidebar (10 checks)',
    steps: [
      '✓ "New Chat" button works — creates new chat',
      '✓ Chat list populates and updates',
      '✓ Clicking a chat navigates to it',
      '✓ Studio nav button goes to /studio',
      '✓ Chat/Prompts/Code/Cowork nav buttons work',
      '✓ Collapse/expand sidebar works',
      '✓ Sidebar resizes with drag handle',
      '✓ Settings button at bottom navigates',
      '✓ No Workflow section (removed)',
      '✓ No duplicate New button (removed)',
    ]
  },
  {
    title: '6. Chat Home (7 checks)',
    steps: [
      '✓ Greeting shows time-aware text',
      '✓ Composer card visible with selectors',
      '✓ Composer accepts text input',
      '✓ Send button visible and clickable',
      '✓ Recent chats list shows (if any)',
      '✓ No branding mark in greeting (removed)',
      '✓ No "Try asking" suggestion box (removed)',
    ]
  },
  {
    title: '7. Chat (Active) (10 checks)',
    steps: [
      '✓ New chat creates and appears in sidebar',
      '✓ Text generation works (if provider configured)',
      '✓ Model selector shows correct provider/model',
      '✓ Model displayed matches model used',
      '✓ System prompt selector works',
      '✓ Slash commands open palette (/fix, /explain)',
      '✓ Shift+Enter inserts line break',
      '✓ Enter sends message',
      '✓ Copy/paste works in composer',
      '✓ No "Cancel generation" text in composer',
    ]
  },
  {
    title: '8. Create Studio (16 checks)',
    steps: [
      'Navigate to /studio',
      '✓ 10 task cards visible',
      '✓ Each card: icon, label, description, mode badge',
      '✓ Click a card — see orchestration details',
      '✓ No inline Start button on cards (removed)',
      '✓ Autonomy levels 1-4 visible (level 0 removed)',
      '✓ Safety notice visible at bottom',
      '✓ "Build App" → routes to code/chat',
      '✓ "Code Program" → routes to code/chat',
      '✓ "Generate Text" → routes to chat',
      '✓ "Generate Image" → shows provider setup',
      '✓ "Generate Video" → shows provider guidance',
      '✓ "Generate Music" → shows no built-in support',
      '✓ "Connect Apps" → routes to connectors settings',
      '✓ Missing capability → links to Connectors',
      'Click every card — no crashes',
    ]
  },
  {
    title: '9. Vibe Coding (7 checks)',
    steps: [
      'Navigate to /vibe',
      '✓ 3-tab navigation works',
      '✓ Project type cards clickable',
      '✓ Quick actions grid visible',
      '✓ Guided builder steps work',
      '✓ Generated prompt can be sent to Chat/Code',
      '✓ Learn tab shows tutorial cards',
      '✓ No crashes across tabs',
    ]
  },
  {
    title: '10. Code Mode / LivePreview (8 checks)',
    steps: [
      'Navigate to /preview',
      '✓ LivePreview UI visible',
      '✓ Template type selector shows options',
      '✓ Create Sandbox works',
      '✓ Start Server shows URL',
      '✓ Stop Server works',
      '✓ URL bar shows localhost with copy button',
      '✓ No crash on rapid start/stop',
      '✓ Coding Demo template works',
    ]
  },
  {
    title: '11. Cowork (4 checks)',
    steps: [
      'Navigate to /cowork',
      '✓ Task composer visible',
      '✓ Safety notices visible',
      '✓ No broken permissions panel',
      '✓ Layout is clean, no giant center panels',
    ]
  },
  {
    title: '12. Settings — Providers (10 checks)',
    steps: [
      'Navigate to /settings/providers',
      '✓ All adapters shown',
      '✓ Status badges correct',
      '✓ API key entry and save works',
      '✓ Masked key display works',
      '✓ Test Connection button works',
      '✓ Local provider help cards visible',
      '✓ Enable/disable toggle works',
      '✓ Delete key works',
      '✓ No overlapping buttons in layout',
      '✓ Custom provider form opens as modal',
    ]
  },
  {
    title: '13. Settings — Connectors (11 checks)',
    steps: [
      'Navigate to /settings/connectors',
      '✓ 12 connector cards visible',
      '✓ Each has status badge',
      '✓ Expand shows: auth type, capabilities, permissions, risk notes',
      '✓ Configure button navigates correctly',
      '✓ Test button works for connected providers',
      '✓ Disconnect button visible for connected',
      '✓ Phone Companion shows "Planned"',
      '✓ Gmail shows confirmation requirements',
      '✓ Brand policy notice at bottom',
      '✓ No fake vendor logos — all Lucide icons',
      '✓ No broken image references',
    ]
  },
  {
    title: '14. Settings — MCP Tools (9 checks)',
    steps: [
      'Navigate to /tools',
      '✓ Master-detail layout loads',
      '✓ At least 3 built-in mock tools in list',
      '✓ Click tool — details show on right',
      '✓ Safety check button works',
      '✓ Run Test works for mock tools',
      '✓ Call history visible',
      '✓ Tool suggestions do not auto-run',
      '✓ Destructive permissions show warnings',
      '✓ Imported tools disabled by default',
    ]
  },
  {
    title: '15. Compact / Responsive (9 checks)',
    steps: [
      '✓ Modals close with ESC',
      '✓ Modals close on click outside',
      '✓ Drawer closes with ESC',
      '✓ Drawer closes on click outside/overlay',
      '✓ Popovers close on ESC and click outside',
      '✓ Resize to 1366×768 — no panel overlap',
      '✓ At 1366×768 — all text readable',
      '✓ Command palette: Ctrl+K opens, ESC closes',
      '✓ Shortcuts help: Ctrl+/ or F1 opens, ESC closes',
    ]
  },
  {
    title: '16. Safety Gates (6 checks)',
    steps: [
      '✓ Gmail connector: shows confirmation required',
      '✓ MCP tools: do not auto-run',
      '✓ Studio cards: never execute on click alone',
      '✓ Default autonomy = 2 (Ask Before Acting)',
      '✓ No raw API keys visible in DOM or console',
      '✓ Secret scan clean (no sk-or-v1 in source)',
    ]
  },
]

// ---- Main ----

console.log('\n╔════════════════════════════════════════════════╗')
console.log('║   Aureon Desk — Manual QA Guide               ║')
console.log('╚════════════════════════════════════════════════╝')
console.log('')
console.log('📋 Total checks: 127 across 16 sections')
console.log('🖥️  Test at: 1920×1080 and 1366×768')
console.log('📸  Save screenshots to: docs/qa-screenshots/human-qa/')
console.log('📝  Record findings in: docs/HUMAN_QA_REPORT.md')
console.log('')

// Ensure screenshot directory exists
const screenshotsDir = join(PROJECT_ROOT, 'docs', 'qa-screenshots', 'human-qa')
if (!existsSync(screenshotsDir)) {
  mkdirSync(screenshotsDir, { recursive: true })
  console.log(`📁 Created: ${screenshotsDir}`)
}

// Print all sections
for (const section of SECTIONS) {
  console.log(`\n┌── ${section.title} ──┐`)
  for (const step of section.steps) {
    console.log(`│  ${step}`)
  }
  console.log(`└${'─'.repeat(section.title.length + 6)}┘`)
}

console.log('\n─────────────────────────────────────────────────')
console.log('  ⚠️  This is a MANUAL testing guide.')
console.log('  Open the app with: npm run dev')
console.log('  Click through every check above.')
console.log('  Record results in docs/HUMAN_QA_REPORT.md')
console.log('─────────────────────────────────────────────────')
console.log('')

// Print summary
const totalChecks = SECTIONS.reduce((sum, s) => sum + s.steps.length, 0)
console.log(`📊 Total: ${totalChecks} manual checks across ${SECTIONS.length} sections`)
console.log('')
