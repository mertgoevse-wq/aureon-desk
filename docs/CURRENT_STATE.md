# Vibeforge — Current State

> **Last updated:** 2026-07-10
> **Branch:** main

---

## Features That Exist and Work

### Core Shell
- **Chat / Cowork / Code** mode switch in top header (pill tabs)
- **Left Sidebar**: resizable, collapsible; New Chat, New Task, search (command palette), shortcut icons (Chat/Prompts/Code), workflow accordion, Projects/Tools shortcuts, chat list (Recents), user profile footer with Settings
- **Right Inspector**: resizable, collapsible; shows prompt routing analysis (intent, agent, risk, keywords)
- **Top header**: centered mode switch, Ctrl+K search button
- **Command Palette** (Ctrl+K): 16 actions
- **Keyboard Shortcuts**: Ctrl+N (new chat), Ctrl+B (toggle sidebar), Ctrl+I (inspector), Ctrl+K (palette), Ctrl+, (settings), Ctrl+L (focus composer), F1/Ctrl+/ (shortcuts help)
- **Error Boundary**: catches React errors gracefully

### Chat Mode
- **Empty state**: Aureon Desk greeting with Sparkles icon, "Start a new chat" CTA, 4 feature cards
- **Active chat header**: title, system profile badge, model label (provider · model)
- **System profile selector**: dropdown with all non-archived system prompts
- **Model selector**: dropdown with all enabled models (grouped by provider)
- **Chat panel**: time-aware greeting ("Good morning/afternoon/evening"), 6 starter prompts, message thread, composer
- **Composer**: textarea (auto-resize), paste handling (Ctrl+V), send button (Ctrl+Enter), prompt library button, model/project context toolbar
- **Message bubbles**: user (right-aligned), assistant (left-aligned with provider metadata + copy button)
- **Streaming**: real-time token streaming with loading state
- **Provider error cards**: if no model configured — shows setup card with OpenRouter/Ollama/LM Studio/Settings options

### Settings
- **Providers & Models**: list of all providers with key status, enable/disable, Test Center (test individual + Test All sequential), Add Custom Provider
- **System Prompts**: create/edit/delete system prompt profiles
- **Appearance**: theme/font settings (placeholder toggles)
- **Projects**: create/manage projects with instructions and file path
- **Tools & MCP**: registry, explicit trust/enable state, real stdio/SSE connection lifecycle, discovery, redacted logs, and per-action confirmation for destructive permissions
- **GitHub Imports**: repo clone, parse, safety scan, approve items
- **Logs**: structured app log viewer with export/debug bundle
- **Developer**: developer settings (placeholder)
- **General**: workspace behavior settings

### LivePreview / Code Mode
- Template selector: HTML, Vite+React, Coding Demo
- In-process HTTP server (no subprocess for HTML/demo)
- URL bar + copy URL button
- iframe preview
- Process log panel
- Restart / Stop / Open in Browser controls
- Coding Demo: generates counter app, verifies HTML content via Playwright

### Cowork Mode
- Safe placeholder shell: 4 workflow cards (Scheduled, Dispatch, Ideas, Customize) all labeled "Placeholder"
- Permissions panel showing Browser/Computer/Accessibility/Screen Recording all Off
- Links to Chat and Code modes

### Provider System
- 10 providers pre-seeded on first launch
- Canonical model resolution (resolveCanonicalModelReference)
- Stale-selection guard (expectedModelId check)
- API keys stored via Electron SafeStorage vault
- Key redaction in all logs
- OpenRouter-routed models labeled correctly (not implying direct provider)

### GitHub Import System
- Clone public repos locally
- Parse markdown/JSON files for prompts, system prompts, skills
- Safety scan for injection patterns
- Review and approve items into the library
- 29-item curated star list available

---

## What Is Incomplete / Placeholder

| Feature | Status |
|---------|--------|
| Cowork workflow queue | Placeholder (no real task execution) |
| Browser/Computer Use | Off — placeholder labels only |
| Capabilities settings | Placeholder page |
| External MCP integration | Connection/discovery/execution infrastructure exists, but a configured third-party server still needs visible end-to-end validation |
| Privacy & Security settings | Placeholder page |
| Extensions | Placeholder page |
| Dark mode / theme toggle | UI exists, not wired |
| Project file context injection | Partial (instructions injected, file reading not exposed in UI) |
| Tool execution (MCP call) | Registry exists, execution not wired to live calls |
| Chat title auto-generation | Uses "New Chat" default; no AI title generation |
| Attachments | Schema exists, no upload UI |
| Prompt chip suggestions in home | Basic only (4 feature cards, not dynamic) |

---

## Known Issues / Observations

1. **Cowork workflow items** all navigate to `/cowork` rather than to distinct sub-pages — intentional (placeholder)
2. **Right Inspector** only shows on `/` (Chat) route — not on other pages
3. **No frameless window / custom titlebar** — uses OS native title bar; Prompt 5 (shell polish) is intended to address this
4. **Settings category column** is fixed at 264px (not resizable)
5. **Chat list** in sidebar has no search/filter within the list itself (global search is command palette)
6. **Model selector label** correctly shows "Provider · Model" when data loads

---

## Design Direction

- **Theme**: Warm ivory (`#FAF7F2` bg, `#F3EFE6` sidebar, `#FFFFFF` cards), brown-charcoal text (`#221A0F`)
- **Accent**: Terracotta/copper (`#C75B39`)
- **Typography**: Crimson Text (serif, display/logo only), Inter (UI/body/forms/chat)
- **No**: neon, glassmorphism, dark mode (yet), cyberpunk, Anthropic/OpenAI assets
- **Radius**: rounded-xl to rounded-[28px] throughout; pill tabs; 9px scrollbar
- **Shadows**: warm-tinted, very subtle

---

## Architecture Summary

```
Electron (main)  ←→  preload contextBridge  ←→  React renderer
       ↓                                              ↓
  better-sqlite3                              Zustand stores
  drizzle-orm                                React Router (hash)
  SafeStorage vault                          Tailwind CSS v4 + CSS tokens
  IPC: 13 handler files                      Lucide React icons
  22 service files
```

---

## Important Commands

```bash
npm run dev           # Start dev (Vite HMR + Electron)
npm run typecheck     # TypeScript check — PASS
npm test              # Unit tests — 283 PASS
npm run build         # Build — PASS
npm run test:e2e      # E2E — 84 tests (last known: all PASS)
npm run verify:native # Native binary check — PASS
```

---

## Screenshots / Reports

- Unit test results: console output (`npm test`)
- E2E screenshots: `tests/e2e/artifacts/`
- Playwright HTML report: `playwright-report/`
- QA doc: `AI_QA_REPORT.md`
- Visual audit: `docs/VISUAL_AUDIT.md`

---

## Next Prompt to Run

**Prompt 5:** `AUREON DESK DESKTOP SHELL POLISH — WINDOW TOPBAR NAVIGATION PREMIUM FEEL`

This prompt should implement:
- Custom frameless or semi-custom window shell (traffic lights / window controls)
- Premium topbar with drag region
- Possibly integrated mode switch + search into a unified topbar
- Window min/max/close controls with Aureon style
- Verified at 1366×768 and maximized

**Status before Prompt 5:** ✅ Ready — baseline is clean, all tests pass, no secrets, docs updated.
