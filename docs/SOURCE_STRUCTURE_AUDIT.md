# Vibeforge — Source Structure Audit

> **Generated:** 2026-07-09
> **Branch:** main
> **Tests:** 445 unit tests, 22 files

---

## Overview

Vibeforge is an Electron 43 + React 19 + TypeScript + Tailwind CSS v4 + drizzle-orm + better-sqlite3 desktop application.

| Layer | Path | Files | Purpose |
|-------|------|-------|---------|
| Main Process | `src/main/` | ~25 | Electron main, IPC handlers, services, DB |
| Preload Bridge | `src/preload/` | 2 | Context bridge between main & renderer |
| Renderer | `src/renderer/src/` | ~40 | React UI, pages, components, stores |
| Shared Types | `src/shared/` | ~12 | TypeScript types shared across processes |
| Tests (Unit) | `tests/unit/` | 22 | Vitest unit tests |
| Tests (E2E) | `tests/e2e/` | 19 | Playwright E2E tests |
| Scripts | `scripts/` | 9 | CLI utilities and verification |
| Docs — Active | `docs/` | 5 | Current reference docs |
| Docs — Archive | `docs/archive/` | 6 | Historical handoff/audit docs |
| Docs — QA | `docs/qa/` | 4 | QA checklists and reports |
| Docs — Brand | `docs/brand/` | 3 | Brand guidelines and assets |
| Assets | `assets/` | 2 READMEs | Brand source and vendor attribution |
| Public | `public/` | 1 .gitkeep | Web-accessible static files |

---

## src/main/ — Main Process

| File | Purpose |
|------|---------|
| `index.ts` | App entry point, window creation, startup sequence |
| `windows.ts` | Electron BrowserWindow configuration |
| `db/connection.ts` | SQLite database connection (better-sqlite3) |
| `db/schema.ts` | Drizzle ORM schema (10+ tables) |
| `db/migrate.ts` | Additive migrations |
| `db/seed.ts` | Default data seeding (providers, models, tools) |
| `security/vault.ts` | DPAPI safeStorage for API keys |
| `ipc/chat.ipc.ts` | Chat CRUD IPC handlers |
| `ipc/credentials.ipc.ts` | Credential management IPC |
| `ipc/github.ipc.ts` | GitHub imports IPC |
| `ipc/index.ts` | IPC handler registration |
| `ipc/live-preview.ipc.ts` | LivePreview sandbox IPC |
| `ipc/log.ipc.ts` | Logging IPC |
| `ipc/project.ipc.ts` | Project CRUD IPC |
| `ipc/prompt.ipc.ts` | System prompt IPC |
| `ipc/promptLibrary.ipc.ts` | Prompt library IPC |
| `ipc/provider.ipc.ts` | Provider management IPC |
| `ipc/routing.ipc.ts` | Prompt routing/analysis IPC |
| `ipc/settings.ipc.ts` | App settings IPC |
| `ipc/studio-core.ipc.ts` | Studio task orchestration IPC |
| `ipc/tool.ipc.ts` | MCP tools IPC |
| `ipc/window.ipc.ts` | Window control IPC |
| `services/agent-registry.ts` | 12 built-in agent definitions |
| `services/chat-completion.service.ts` | Multi-provider chat completion (8 adapters) |
| `services/chat.service.ts` | Chat CRUD with SQLite |
| `services/github-import.service.ts` | GitHub repo import pipeline |
| `services/hierarchy-resolver.ts` | 5-layer system prompt merge |
| `services/import-parser.ts` | Multi-format import parser (MD/YAML/JSON/TOML) |
| `services/live-preview.service.ts` | Sandbox creation, static HTTP server, Vite management |
| `services/log-redacter.ts` | 9-pattern secret redaction |
| `services/log.service.ts` | Structured logging with SQLite |
| `services/project-context.ts` | File tree builder, context assembly |
| `services/project.service.ts` | Project CRUD with SQLite |
| `services/prompt-analyzer.ts` | Intent classification (12 intents) |
| `services/prompt-io.service.ts` | Prompt import/export engine |
| `services/prompt.service.ts` | System prompt CRUD |
| `services/promptLibrary.service.ts` | Prompt library CRUD |
| `services/provider.service.ts` | Provider/model management |
| `services/repo-classifier.ts` | 8-category repo classification |
| `services/request-builder.ts` | Provider-specific request building |
| `services/routing-policy.ts` | Agent/skill/tool routing engine |
| `services/skill-registry.ts` | 28 built-in skill definitions |
| `services/studio-core.service.ts` | Task orchestration, model routing by task |
| `services/tool-safety-gate.ts` | MCP tool safety gate |
| `services/tool.service.ts` | Tool CRUD, 3 built-in mock tools |
| `utils/logger.ts` | Structured logger |
| `utils/paths.ts` | App data path resolution |

---

## src/preload/ — Preload Bridge

| File | Purpose |
|------|---------|
| `index.ts` | contextBridge API exposure |
| `index.d.ts` | TypeScript type declarations |

---

## src/renderer/src/ — Renderer Process

### Entry & Routing

| File | Purpose |
|------|---------|
| `index.html` | HTML entry point |
| `main.tsx` | React root render |
| `App.tsx` | React Router routes |

### Pages

| File | Purpose |
|------|---------|
| `ChatWorkspace.tsx` | Chat with home empty state and active chat views |
| `CoworkPage.tsx` | Cowork workflow workspace (safe placeholder) |
| `LivePreview.tsx` | Code mode with sandbox, iframe, logs |
| `ProjectsPage.tsx` | Project management with file tree |
| `PromptLibrary.tsx` | Prompt library with search, favorites, import/export |
| `Studio.tsx` | Studio task launcher with hero, cards, drawer |
| `VibeCoding.tsx` | Vibe coding guided builder (15 templates) |
| `settings/AppearancePage.tsx` | Theme/typography settings |
| `settings/CapabilitiesPage.tsx` | Desktop capabilities toggles |
| `settings/ConnectorsPage.tsx` | 12 connector cards |
| `settings/DeveloperSettingsPage.tsx` | Developer diagnostics |
| `settings/GeneralSettingsPage.tsx` | General settings |
| `settings/GitHubImportsPage.tsx` | GitHub star list imports |
| `settings/LogsPage.tsx` | Log viewer with export |
| `settings/PromptsPage.tsx` | System prompt profiles |
| `settings/ProvidersPage.tsx` | Provider/model management |
| `settings/SettingsPlaceholderPage.tsx` | Placeholder for Extensions/Security |
| `settings/ToolsPage.tsx` | MCP tools master-detail |

### Layouts

| File | Purpose |
|------|---------|
| `AppShell.tsx` | Main app shell: header, mode switch, sidebar, inspector |
| `RightInspector.tsx` | Right inspector panel (routing analysis) |
| `SettingsLayout.tsx` | Settings two-column layout |
| `Sidebar.tsx` | Left sidebar navigation |

### Components

| File | Purpose |
|------|---------|
| `chat/ChatPanel.tsx` | Message list + streaming |
| `chat/MessageBubble.tsx` | Individual message bubble |
| `chat/MessageInput.tsx` | Composer with slash commands |
| `chat/ModelSelector.tsx` | Model dropdown selector |
| `connectors/ConnectorIcon.tsx` | Safe vendor icon system (12 types) |
| `prompts/PromptCard.tsx` | Prompt card with actions |
| `prompts/PromptEditor.tsx` | Prompt create/edit modal |
| `prompts/TagInput.tsx` | Tag input with autocomplete |
| `prompts/VariableFiller.tsx` | Variable fill modal for templates |
| `settings/SettingsComponents.tsx` | SettingsSection, SettingsRow, DangerZone, StatusPill, Toggle re-export |
| `shared/VibeforgeMark.tsx` | Brand mark SVG/PNG component |
| `shared/Badge.tsx` | Color-coded badge |
| `shared/BrandLockup.tsx` | Brand lockup (mark + text) |
| `shared/Button.tsx` | Button with variants |
| `shared/Card.tsx` | Card wrapper |
| `shared/CommandPalette.tsx` | Ctrl+K command palette |
| `shared/Drawer.tsx` | Right slide-in panel |
| `shared/EmptyState.tsx` | Empty state placeholder |
| `shared/ErrorBoundary.tsx` | React error boundary |
| `shared/Input.tsx` | Input + Textarea components |
| `shared/Modal.tsx` | Modal dialog with focus trap |
| `shared/Popover.tsx` | Anchored popover + SelectPopover |
| `shared/Select.tsx` | Native select wrapper |
| `shared/SelectMenu.tsx` | Custom select menu with icons |
| `shared/ShortcutsHelp.tsx` | Keyboard shortcuts modal |
| `shared/Tabs.tsx` | Tab switcher |
| `shared/Toast.tsx` | Toast notifications |
| `shared/Toggle.tsx` | Toggle switch |
| `sidebar/ChatList.tsx` | Recent chats list |
| `vibe/BeginnerHelp.tsx` | Beginner tutorials accordion |
| `vibe/SafetyNotice.tsx` | Safety notice banner |

### Stores (Zustand)

| File | Purpose |
|------|---------|
| `chatStore.ts` | Active chat, chat list, messages |
| `projectStore.ts` | Active project selection |
| `promptLibraryStore.ts` | Prompt library state |
| `promptStore.ts` | System prompt state |
| `providerStore.ts` | Provider/model state |
| `routingStore.ts` | Prompt analysis state |
| `settingsStore.ts` | App settings state |
| `uiStore.ts` | Sidebar, inspector, onboarding |

### Theme

| File | Purpose |
|------|---------|
| `tokens.css` | Design tokens: colors, spacing, shadows, radius, animations |
| `typography.css` | Google Fonts, semantic UI classes, prose styles |

---

## src/shared/ — Shared Types & Constants

| File | Purpose |
|------|---------|
| `capability-registry.ts` | 21 capabilities with risk tiers |
| `connectors.ts` | 12 connector definitions, OAuth scopes, Gmail actions |
| `constants.ts` | 10 provider adapters, APP_NAME |
| `star-list.ts` | Mert's 29 curated GitHub stars |
| `vibe-templates.ts` | 15 vibe coding templates, tutorial cards |
| `types/chat.ts` | Chat, message types |
| `types/github.ts` | GitHub import types |
| `types/log.ts` | Log types |
| `types/project.ts` | Project types |
| `types/prompt.ts` | System prompt, prompt library types |
| `types/provider.ts` | Provider, model types |
| `types/routing.ts` | Routing/analysis types |
| `types/settings.ts` | Settings types |
| `types/studio-core.ts` | 10 task categories, autonomy levels, orchestration types |
| `types/tool.ts` | MCP tool types |

---

## tests/ — Test Suites

### Unit Tests (22 files, 445 tests)

| File | Tests | Focus |
|------|-------|-------|
| `chat-completion.test.ts` | 40 | Multi-provider completion, error handling, redaction |
| `code-workspace.test.ts` | 3 | Code mode workspace assertions |
| `connector-icon.test.ts` | 14 | Connector data integrity |
| `connector-registry.test.ts` | 28 | 12 connectors, Gmail actions, OAuth |
| `cowork-composer.test.ts` | 6 | Cowork composer behaviors |
| `github-import.test.ts` | 33 | Import pipeline, safety checks |
| `hierarchy-resolver.test.ts` | 15 | 5-layer system prompt merge |
| `home-composer-polish.test.ts` | 5 | Home composer UI assertions |
| `input-handling.test.ts` | 16 | Keyboard handler, paste, typing |
| `live-preview.test.ts` | 31 | Sandbox, HTTP server, path traversal |
| `log-manager.test.ts` | 25 | Log redaction, filtering, export |
| `model-selection-and-provider-polish.test.ts` | 6 | Default model, API key redaction |
| `project-manager.test.ts` | 24 | Project CRUD, file tree |
| `prompt-analyzer.test.ts` | 36 | Intent classification, routing |
| `provider-security.test.ts` | 13 | API key masking, redaction |
| `settings-layout.test.ts` | 3 | Settings layout assertions |
| `studio-core.test.ts` | 47 | Task orchestration, model routing |
| `tool-manager.test.ts` | 33 | Tool safety gate, enable/disable |
| `ui-desktop-polish.test.ts` | 20 | Sidebar, shell assertions |
| `vibe-coding.test.ts` | 26 | 15 templates, tutorials |
| `visual-regression.test.ts` | 16 | Visual design token assertions |
| `window-ipc.test.ts` | 5 | Window control IPC |

### E2E Tests (19 files)

All under `tests/e2e/` — see individual files for coverage.

---

## Duplicate Component Audit

| Component Pair | Status | Notes |
|----------------|--------|-------|
| Toggle (shared) vs Toggle (Settings re-export) | ✅ Fine | SettingsComponents re-exports shared Toggle — not a duplicate |
| Modal vs Drawer vs Popover | ✅ Distinct | Modal = dialog, Drawer = slide-in panel, Popover = anchored dropdown |
| Select vs SelectMenu | ✅ Distinct | Select = native wrapper, SelectMenu = custom rich select |
| StatusPill vs Badge | ✅ Distinct | StatusPill = status indicator, Badge = general label |
| BrandLockup vs VibeforgeMark | ✅ Complementary | BrandLockup uses VibeforgeMark internally |
| SettingsSection vs Card | ✅ Distinct | SettingsSection is a specialized settings layout, Card is generic |

**No true duplicates found.** Previous duplicates (two Toggle implementations, inline VibeforgeMark SVGs, large duplicate PNGs) were resolved in earlier cleanup sessions.

---

## Active Docs (docs/)

| File | Purpose |
|------|---------|
| `CURRENT_STATE.md` | Feature status snapshot |
| `IMPLEMENTATION_LOG.md` | Session-by-session change log |
| `PROJECT_INDEX.md` | Full repo file map |
| `SOURCE_STRUCTURE_AUDIT.md` | This file — source tree audit |
| `UX_DECISIONS.md` | UX design decisions log |
| `VISUAL_AUDIT.md` | Screen-by-screen visual audit |

### Archive (docs/archive/)

Historical handoff and planning docs moved here for reference.

### QA (docs/qa/)

QA checklists and reports.

### Brand (docs/brand/)

Brand guidelines and asset audits.

---

## Known Placeholders / Mock-Only Features

| Feature | Location | Status |
|---------|----------|--------|
| Cowork workflow execution | `CoworkPage.tsx` | Safe placeholder — intentional design |
| Google Drive connector | `connectors.ts` | Planned, not implemented |
| Google Calendar connector | `connectors.ts` | Planned, not implemented |
| Phone Companion | `connectors.ts` | Planned, no capabilities |
| MCP tool execution (live) | `tool.service.ts` | 3 mock tools seeded, live execution not wired |
| Settings Extensions | `SettingsPlaceholderPage.tsx` | Placeholder with clear messaging |
| Settings Security | `SettingsPlaceholderPage.tsx` | Placeholder with clear messaging |
| LivePreview mockFiles | `LivePreview.tsx` | Hardcoded demo file list |
| Image/Video/Music "Mock Offline Creator" | `Studio.tsx` | Mock-only provider options |
