## [0.9.64] - 2026-07-09

### Added — Bolt-Like Prompt → Code → LivePreview Pipeline

**Canonical Build Pipeline:**

- New `BuildPipeline` service with 9 steps: classify intent → create plan → generate file operations → show pending changes → apply to sandbox → start preview → stream status → show rendered preview → generate follow-up suggestions
- Typed file operations: `create_file`, `update_file`, `delete_file`, `rename_file`, `mkdir` — each with file path, language, before/after content, computed diff, status, and risk level
- `BuildRequest` and `BuildResult` types with mode: `plan-only` | `generate` | `generate-and-preview`
- `BuildPipelineStatus` streamed to renderer via IPC events for real-time step updates

**Code Activity Panel (LivePreview):**

- Tabbed artifact panel: **Preview** / **Code** / **Files** / **Diff** / **Plan**
- Code tab: pipeline step timeline with spinner/check/error icons, current file being edited, file path in grey, message details
- Files tab: file tree with path, language, type, "View diff" action
- Diff tab: file selector pills + line-by-line diff with green (add) / red (remove) / grey (context) coloring
- Plan tab: prompt + build plan steps
- Auto-switches to Preview tab after first successful render
- "Local Demo" badge when no remote provider is available
- Cancel/Stop button to abort running build
- Follow-up suggestions after render: Improve styling, Add navigation, Add local storage, Add animations, Add dark mode, Package as PWA, Explain the code

**Deterministic Local Demo:**

- When no AI provider is available, pipeline generates a working 3-file counter app (index.html, styles.css, app.js) with ivory/hero theme
- Counter with increment/reset, visible heading, responsive layout
- Clearly labeled "Local Demo" so users know it's not from a remote provider
- Works without any API keys for testing and demo purposes

**Security:**

- Path traversal blocked via `resolved.startsWith(path.resolve(sandboxPath))` check
- Secrets redacted via `redactSecrets()` before writing any file to disk
- IPC cancellation flag prevents partial writes

**Files Created:**

- `src/shared/types/build-pipeline.ts` — typed pipeline contract
- `src/main/services/build-pipeline.service.ts` — core engine
- `src/main/ipc/build-pipeline.ipc.ts` — IPC handlers
- `tests/unit/build-pipeline.test.ts` — 38 unit tests
- `docs/BOLT_LIKE_BUILD_PIPELINE.md` — full pipeline documentation

**Files Modified:**

- `src/main/ipc/index.ts` — registered `registerBuildPipelineIPC`
- `src/preload/index.ts` + `index.d.ts` — exposed `buildRun`, `buildCancel`, `onBuildStep`, `onBuildComplete`
- `src/shared/preview-helpers.ts` — added `setAutoBuildPipeline()` / `getAndClearBuildPipeline()` helpers
- `src/renderer/src/pages/Studio.tsx` — wired composer Enter + Start building to new pipeline
- `src/renderer/src/pages/LivePreview.tsx` — added tabbed artifact panel, pipeline step streaming, file tree, diff view, follow-up suggestions

### Fixed

- **CRITICAL: Cascade parse error in LivePreview.tsx** — missing closing `}` in JSX comment `{/* Diff content */}` caused `Expected "}" but found "&&"` parse error that cascaded to line 762. Fixed by adding the missing `}`.
- **TypeScript `as any` removed** — replaced `s.previewStatus as any || prev.status` with type-safe validation against a `const` array of valid statuses. Honors the AGENTS.md "Don't type cast as `any` type" rule.
- **Non-ASCII character in JSX text** — replaced `·` (middle dot) with `-` in FILES tab file type display to prevent parser edge cases on different platforms.

### Tests Added (38 new)

- `tests/unit/build-pipeline.test.ts`:
  - Build request creates file operations (create_file, update_file)
  - File diff generated (add/remove/context lines)
  - Deterministic demo renders (index.html, styles.css, app.js)
  - Follow-up suggestions generated (7 categories)
  - Path traversal blocked (relative `../` escape attempts)
  - Secrets ignored (API keys redacted before write)
  - Intent classification (build_app, build_component, etc.)
  - Cancel/abort functionality
  - Plan generation from prompt keywords

### Verified

- `npm run typecheck` — ✅ PASS
- `npm test` — ✅ PASS (549 tests, 23 files)
- `npm run build` — ✅ PASS
- Code review — ✅ PASS

### Remaining Limits

- Deterministic demo always generates a counter app regardless of classified intent (MVP only)
- All file operations are `create_file` type for the deterministic demo — no `update_file`/`delete_file`/`rename_file`/`mkdir` operations generated yet
- Real provider-based generation not yet wired (pipeline accepts `providerModelRoute` but always falls back to deterministic demo)
- No real-time diff streaming for `update_file` operations
- No screenshot capture for manual QA docs yet (pending headless dev environment)

---

## [0.9.63] - 2026-07-09

### Added — Hero Landing Page & Calm Theme

**Hero Landing Page:**

- Studio is now the default landing page (index route `/`)
- Large AureonMark (56px) with scale-in animation
- Heading: "Build calmly with Aureon" (serif display font)
- Subtitle: "A guided AI workspace for chat, code, projects, tools, and live preview."
- Central composer with "Start building" (opens Build wizard) and "Open chat" (routes to /chat) CTAs
- 4 compact suggestion pills (pomodoro timer, markdown editor, weather dashboard, contact form)
- 4 primary action cards: Build, Code, Create, Connect
- "More" button toggles secondary creation types (text, image, video, music, file analysis, screen analysis)
- Enter in composer starts build flow directly to LivePreview
- Autonomy selector preserved as compact inline icon row
- All wizard labels bumped from 10-11px to 12px minimum

**Calm Color System:**

- Accent softened from aggressive #C75B39 to muted bronze #B8683A
- Focus ring changed from solid accent to semi-transparent rgba(184, 104, 58, 0.35)
- Shadow opacity reduced across all levels for softer depth
- Hero radial gradient calmed to 0.06 opacity

**Dark Theme (Warm Charcoal):**

- `[data-theme="dark"]` CSS block with warm charcoal palette (never pure black)
- Background #2A2520, surface #251F1A, elevated #322C26
- Text #E8E0D6, accent #C8805A (visible warm bronze)
- All ivory aliases automatically inherit dark values via var() references
- Dark theme hero radial gradient variant
- Theme select in General Settings now actually applies and persists to settings DB
- `src/renderer/src/utils/theme.ts` — extracted applyTheme/loadPersistedTheme utility
- Theme loaded on app mount via AppShell

**Typography Refinement:**

- Minimum caption size raised from 11px to 12px
- Body line-height improved from 1.6 to 1.65
- All elements get consistent 1.5 line-height baseline

**Routing Change:**

- Studio is now the index route (`/`)
- ChatWorkspace moved to `/chat`
- All navigate('/') calls updated to navigate('/chat') across AppShell, Sidebar, VibeCoding, SettingsLayout
- Inspector only shows on `/chat` route (collapsed on landing by default)
- uiStore inspectorOpen default changed to false

**Code Cleanup:**

- Removed dead code: handleNewTask in Sidebar.tsx (unused)
- Removed unused RISK_ICONS and MODE_LABELS constants from Studio.tsx
- Removed unused AlertTriangle import from Studio.tsx
- Fixed circular dependency: theme logic extracted from GeneralSettingsPage to utils/theme.ts
- Fixed handleStartBuilding prompt preservation bug (user's typed prompt no longer overwritten)

### Tests Added

- Hero landing page tests (heading, subtitle, CTAs, action cards, routes)
- Dark theme tests (not pure black, visible accent, light text)
- Inspector collapsed tests (default false, only on /chat)
- Calm theme tests (muted accent, semi-transparent focus ring, softer shadows, 12px minimum)
- Updated ui-desktop-polish tests for new inspectorOpen default

### Verified

- `npm run typecheck` — ✅ PASS
- `npm test` — ✅ PASS (511 tests, 22 files)
- `npm run build` — ✅ PASS
- Code review — ✅ PASS (2 rounds, all issues fixed)

## [0.9.62] - 2026-07-09

### Fixed — Product Stability Audit Bug Fixes

**LivePreview Error Retry Style Loss:**

- Fixed bug where error retry in LivePreview always fell back to "Calming Ivory" theme regardless of user's selected style. Root cause: `clearAutoPreview()` was called on mount, wiping sessionStorage before the retry handler could read the style.
- Now saves the auto-preview style in a `useRef` before clearing sessionStorage, so the retry handler can access the correct theme.
- Replaced hardcoded `'build-app-style'` string with `AUTO_PREVIEW_KEYS.style` constant to maintain the shared helper contract.

**README Banner Path:**

- Fixed broken GitHub banner image path from non-existent `assets/brand/nano-banana/aureon-github-banner.png` to correct `assets/brand/aureon-github-banner-1200.png`.

### Created

- `docs/CURRENT_PRODUCT_GAP_AUDIT.md` — comprehensive 15-section product gap audit covering hero landing, theme, LivePreview, Studio, Vibe Coding, buttons/dropdowns, providers, MCP/connectors, brand assets, onboarding, skills/agents, search, performance, cleanup, and next implementation order
- `docs/MANUAL_PRODUCT_QA_NOTES.md` — source-level manual QA notes with click-through results for all major flows and bug documentation

### Verified

- `npm run typecheck` — ✅ PASS
- `npm test` — ✅ PASS (491 tests, 22 files)
- `npm run build` — ✅ PASS

## [0.9.61] - 2026-07-09

### Changed — Final UI Beauty & Declutter Pass

**Hero Gradient Calmed:**

- Softened hero radial gradient from 0.50 → 0.28 opacity, mid-point from 0.10 → 0.04 for a subtler warm glow

**Reduced Orange Accent Overuse:**

- Studio.tsx: Task card icon backgrounds changed from accent-light (terracotta) to neutral ivory-surface with graphite text. Only hero icons and primary CTAs retain the brand terracotta.
- VibeCoding.tsx: Project type, quick action, All templates, and guided builder option icons all changed from accent-light to neutral ivory-surface. ~15 fewer orange-tinted icon containers.

**Chat Home Decluttered:**

- Starter suggestion pills reduced from 3 → 2
- "More ideas" button changed to muted plain text "More…" pill
- Recent Chats section: removed card border/bg wrapper, shortened label

### Verified

- `npm run typecheck` — ✅ PASS
- `npm test` — ✅ PASS (491 tests, 22 files)
- `npm run build` — ✅ PASS

# Changelog

## [0.9.60] - 2026-07-09
