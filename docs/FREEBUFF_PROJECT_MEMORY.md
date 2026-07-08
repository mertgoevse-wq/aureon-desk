# Aureon Desk — Freebuff Project Memory

> **Created:** 2026-07-08
> **Branch:** main
> **Commit:** c670501 `docs: update CONTINUATION_NOTES.md for handoff`
> **Version:** 0.9.0

---

## Architecture Map

```
Electron Main Process (src/main/)
├── index.ts              → App boot: vault → migrations → seed → IPC → window
├── windows.ts            → BrowserWindow: frameless, 1400x900, paste handler
├── db/
│   ├── schema.ts         → 15+ Drizzle ORM tables
│   ├── connection.ts     → better-sqlite3 + WAL mode
│   ├── migrate.ts        → Additive migration runner
│   └── seed.ts           → 10 providers, models, mock tools, system prompts
├── ipc/                  → 13 handler files (chat, credentials, github, live-preview, log, project, prompt, promptLibrary, provider, routing, settings, tool, window)
├── services/             → 22 business logic files
│   ├── chat-completion.service.ts  → 10 provider adapters + streaming
│   ├── provider.service.ts         → CRUD + canonical model resolver
│   ├── live-preview.service.ts     → In-process HTTP sandbox server
│   ├── github-import.service.ts    → Repo clone + parse + safety scan
│   ├── routing-policy.ts           → Intent → agent → skill → tool routing
│   └── ...
├── security/vault.ts      → Electron safeStorage (DPAPI) wrapper
└── utils/
    ├── logger.ts          → Structured logger (DB + console)
    └── paths.ts           → App data path helpers

Preload Bridge (src/preload/)
├── index.ts               → contextBridge.exposeInMainWorld (typed API)
└── index.d.ts             → Global type declarations

React Renderer (src/renderer/src/)
├── App.tsx                → Hash router with all routes
├── layouts/
│   ├── AppShell.tsx       → Topbar (back/fwd, mode switch, search, window controls)
│   ├── Sidebar.tsx        → Left nav (brand, new chat, search, shortcuts, recents, profile)
│   ├── RightInspector.tsx → Right panel (intent, agent, risk, skills, project context)
│   └── SettingsLayout.tsx → Settings (category column 264px + detail panel)
├── pages/
│   ├── ChatWorkspace.tsx  → Home page (time greeting, composer card, suggestions, recents)
│   ├── CoworkPage.tsx     → Safe agent dashboard (task lifecycle, permissions)
│   ├── LivePreview.tsx    → Code Mode (project selector, file tree, preview iframe)
│   ├── ProjectsPage.tsx, PromptLibrary.tsx
│   └── settings/          → 10 settings pages
├── components/
│   ├── chat/              → ChatPanel, MessageBubble, MessageInput, ModelSelector
│   ├── sidebar/ChatList.tsx
│   ├── settings/SettingsComponents.tsx (SettingsSection, SettingsRow, Toggle, StatusPill, DangerZone)
│   └── shared/            → 13 shared components (Button, Input, Modal, Select, Tabs, Toast, etc.)
├── stores/                → 8 Zustand stores (ui, chat, provider, prompt, promptLibrary, routing, settings, project)
├── theme/
│   ├── tokens.css         → Full design token system (colors, shadows, spacing, radius, animations)
│   └── typography.css     → Font imports (Crimson Text, Inter, JetBrains Mono)
└── hooks/useIpc.ts        → Typed IPC hook

Shared (src/shared/)
├── constants.ts           → 10 provider adapters with default models
├── star-list.ts           → 29 curated GitHub repos
└── types/                 → 9 type files (chat, github, log, project, prompt, provider, routing, settings, tool)

Tests/
├── unit/                  → 18 test files, 305 tests (Vitest)
└── e2e/                   → 17 spec files (Playwright Electron)
```

---

## Current UI State (Code-Based Analysis)

### What Works Well
- **App Shell**: Frameless custom titlebar with back/forward, mode switch (Chat/Cowork/Code), search button, and custom min/max/close controls
- **Home Page**: Time-aware greeting, Aureon SVG mark, centered composer card with model/project/system-prompt selectors, 8 suggestion chips, recent chats list
- **Chat Mode**: Message bubbles (user right, assistant left), streaming, model selector with Local/Cloud badges, system prompt selector
- **Settings**: 12-category sidebar layout, Provider Test Center with Test All, Capabilities with toggles, Developer with debug bundle export
- **Provider System**: 10 adapters, canonical model resolution, SafeStorage vault, secret redaction

### Visual Issues (User-Reported + Code-Confirmed)

| # | Issue | Severity | Location |
|---|-------|----------|----------|
| 1 | Aureon logo/top-left is too small (24px SVG in 48px container) | Medium | Sidebar.tsx, AppShell.tsx |
| 2 | Sidebar too wide (default 280px), visually dominant | Medium | Sidebar.tsx, uiStore.ts |
| 3 | Typography feels unfinished — inconsistent font sizes | Medium | Multiple components |
| 4 | UI feels web/HTML-heavy — native checkboxes in CoworkPage | Medium | CoworkPage.tsx, CapabilitiesPage.tsx |
| 5 | Provider page has overlapping/misaligned buttons | Medium | ProvidersPage.tsx |
| 6 | Save/Test buttons visually inconsistent | Low | ProvidersPage.tsx |
| 7 | Some settings text too small (10px labels) | Low | SettingsLayout.tsx, settings pages |
| 8 | Mixed Toggle components: custom vs native HTML checkboxes | Medium | CoworkPage.tsx, CapabilitiesPage.tsx |

### Duplicate/Dead Code Suspects

| Suspect | Location |
|---------|----------|
| Two Toggle components | `components/shared/Toggle.tsx` and `components/settings/SettingsComponents.tsx` |
| Two StatusPill concept implementations | `components/shared/Badge.tsx` and `components/settings/SettingsComponents.tsx` (StatusPill) |
| Native checkboxes used instead of custom Toggle | CoworkPage.tsx uses `<input type="checkbox">` instead of Toggle component |
| Duplicate inline Aureon SVG mark | Rendered inline in Sidebar.tsx, AppShell.tsx, and ChatWorkspace.tsx |
| Two Capabilities implementations | CoworkPage.tsx has full permissions UI; CapabilitiesPage.tsx has settings-style toggles |

### Untracked Files
- `assets/brand/source/` — Brand source files from Nano Banana (needs integration)

---

## Architecture Strengths
- **Security**: DPAPI-encrypted keys, 9-tier secret redaction, sandboxed renderer, path traversal protection
- **Provider System**: Canonical model resolution prevents stale/mismatched model sends
- **Test Coverage**: 305 unit + extensive E2E tests
- **Design Tokens**: Clean CSS custom property system with backward compat aliases
- **IPC**: Well-structured context bridge with typed contracts
- **Error Handling**: Global ErrorBoundary, startup error dialogs, graceful native module failures

---

## Architecture Weaknesses
- **Component Duplication**: Two Toggle components, mixed checkbox implementations
- **Inline SVG Repetition**: Same Aureon mark SVG repeated in 3+ files
- **Typography Inconsistency**: Mix of `text-[10px]`, `text-[11px]`, `text-xs`, `text-sm` without consistent scale
- **Cowork is Placeholder**: Task lifecycle is simulated, no real agent execution
- **MCP Tools Not Wired**: Tool registry exists but no live MCP calls
- **No Dark Mode**: Theme toggle exists but not wired
- **No Responsive Below 900px**: `minWidth: 900` on window

---

## Implementation Order (Recommended)

### Priority 1 — Visual Polish (Prompt 5+)
1. Integrate Nano Banana brand assets from `assets/brand/source/`
2. Fix Aureon logo size in sidebar and topbar (larger, more prominent)
3. Reduce default sidebar width (280px → 240px suggested)
4. Normalize typography scale across all components
5. Replace native HTML checkboxes with custom Toggle in CoworkPage
6. Fix Provider page button alignment
7. Extract inline SVG mark into a shared `AureonMark` component

### Priority 2 — Feature Polish
8. Wire up tool/MCP execution pipeline
9. Implement Cowork task execution backend
10. Add file attachment UI
11. Implement dark mode theme toggle
12. Add suggestion chips to home empty state (currently only in active chat)

### Priority 3 — Quality
13. Run full E2E suite and fix failures
14. Deduplicate Toggle/Badge components
15. Add CSP headers
16. Code signing for Windows installer

---

## Commands Reference

```bash
npm run dev              # Dev mode (Vite HMR + Electron)
npm run build            # Production build
npm run typecheck        # TypeScript check (main + renderer)
npm test                 # Unit tests (305 tests, Vitest)
npm run test:e2e         # Playwright E2E (17 specs)
npm run verify:native    # Check better-sqlite3 binary
npm run demo:coding      # CLI coding agent self-test
npm run qa:ai            # Full QA: typecheck + test + build + e2e
```

---

## Session Notes (2026-07-08)

### Prerequisites Check
- `npm run verify:native` → ✅ PASS
- `npm run typecheck` → ✅ PASS
- `npm test` → ✅ PASS (305 tests)
- `npm run build` → ✅ PASS
- Secret scan → ✅ PASS (only docs/test references)

### Files Inspected
All documentation (14 files), all renderer source (layouts, pages, components, stores, theme), all main process source (index, windows, IPC, services, security, utils), shared types and constants, preload bridge.

### App Start
`npm run dev` attempted — times out as expected (long-running Electron process). User must run manually on desktop.
