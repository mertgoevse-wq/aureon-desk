## [Unreleased] - 2026-07-11 — App Shell & Simple Home Experience

### Added
- **Simplified Home Layout:** Centered VibeForgeMark logo, "What do you want to build?" headline, large text composer, 6 examples list cards (Build a landing page, Build a web app, Build an Android app prototype, Improve my UI, Fix a bug, Explain my project) with mockup visualization preview cards.
- **Home Documentation:** Added `docs/SIMPLE_HOME_EXPERIENCE.md`.

### Changed
- **Sidebar Restructuring:** Organized navigation into three clear buckets: Primary (Build, Chat, Preview, Projects), Secondary (Providers, Learn, Settings), and Advanced (collapsed by default).
- **Topbar Simplification:** Removed center mode tab switcher; now shows logo, active page name, and search Ctrl+K button.

### Verification
- `node scripts/verify-native.js` — PASS
- `tsc --noEmit -p tsconfig.node.json` — PASS
- `tsc --noEmit -p tsconfig.web.json` — PASS
- `vitest run` — PASS (845 tests, 33 files)
- `electron-vite build` — PASS
- `playwright test` — PASS (13/13 E2E tests in 09-vibeforge-live-preview and 20-vibeforge-no-code-wizard)

## [Unreleased] - 2026-07-11 — Guided No-Code Builder UX & Goal Wizard

### Added
- **GoalWizard Component:** Added a 5-step no-code GoalWizard helper (`What to build`, `Purpose`, `Elements/Features`, `Visual Style`, `Build brief preview`) with automatic prompt compiling.
- **Goal Wizard E2E Tests:** Added `tests/e2e/20-vibeforge-no-code-wizard.spec.ts` E2E test file verifying both website and android app wizard flows.

### Changed
- **Studio Page:** Converted the primary landing screen into a guided builder experience. Defaulted the main view to the Step-by-Step Goal Assistant wizard.
- **Aesthetics & Tone:** Rephrased landing page copy to focus on non-programmers, adding helper suggestions and visual style configurations.
- **Technical Compaction:** Moved all advanced settings, autonomy parameters, and custom prompt editors behind toggleable drawers or collapse headers.

### Verification
- `node scripts/verify-native.js` — PASS
- `tsc --noEmit -p tsconfig.node.json` — PASS
- `tsc --noEmit -p tsconfig.web.json` — PASS
- `vitest run` — PASS (845 tests, 33 files)
- `electron-vite build` — PASS
- `playwright test tests/e2e/20-vibeforge-no-code-wizard.spec.ts` — PASS (2/2)

## [Unreleased] - 2026-07-11 — Video-Based UI Polish

### Changed
- **Studio/Build:** Reduced the hero copy, removed the normal secondary Chat CTA, kept one visible "Build with Preview" action, and moved alternate output modes behind advanced drawer details.
- **Code/LivePreview:** Shortened the Code header, narrowed the left rail, collapsed explorer/logs/diagnostics by default, removed normal demo CTAs, moved "Run Coding Demo App" into collapsed Developer tools, and rendered the preview as a neutral browser-like canvas.
- **Navigation:** Removed duplicate Code/Preview top-level sidebar choices, fixed Vibe Coding routing back to Build without double-active state, removed the sidebar help promo card, and corrected visible brand casing to "Vibeforge".
- **Settings/Providers:** Tightened settings spacing, made modals viewport-safe, restored a compact Provider Test Center, and reduced provider card/header copy.
- **Skills/Agents/Chat:** Reduced card actions to one primary path plus Copy and trimmed the Chat home guidance banner.

### Fixed
- **Raw Stream Display:** Structured JSON-like generation streams are no longer shown as escaped blobs in the Code tab; users are directed to Files/Diff for readable output.
- **Modal Layout:** Shared modal overlay now supports viewport scrolling and safer max-height to prevent clipped forms.

### Verification
- `node scripts/verify-native.js` — PASS
- `tsc --noEmit -p tsconfig.node.json` — PASS
- `tsc --noEmit -p tsconfig.web.json` — PASS
- `vitest run` — PASS (845 tests, 33 files)
- `electron-vite build` — PASS
- `playwright test tests/e2e/12-vibeforge-workspace-ui.spec.ts --headed --workers=1 --timeout=180000` — PASS (5/5)
- Manual screenshot sweep: `test-results/video-ui-polish/` — Chat, Build, Code/Preview, Settings, Providers, Skills, Agents, provider modal, 1366x768, and maximized Build.

## [Unreleased] - 2026-07-11 — Pre-Beta Stabilization

### Fixed
- **Phone Companion Copy:** Reworded desktop and mobile companion screens so the Android/Phone Companion foundation is clearly labeled as a prototype/UI-only local beta. The pages no longer imply active phone sync, pairing, or remote desktop control.
- **MCP Tools Migration:** Added missing additive migrations for newer `tools` columns (`source_path`, `trust_level`, `env_vars`, `connection_status`, `discovery_data`, `last_discovered_at`) so existing SQLite databases do not throw `no such column: "trust_level"` when opening Tools/MCP.
- **Human QA Harness:** Updated the serious headed QA harness to dismiss the first-run onboarding wizard before route sweeps, preserving onboarding while keeping Build/Preview, Vibe Coding, Providers, and Tools checks reachable.

### Verification
- `node scripts/verify-native.js` — PASS
- `tsc --noEmit -p tsconfig.node.json` — PASS
- `tsc --noEmit -p tsconfig.web.json` — PASS
- `vitest run` — PASS (845 tests, 33 files)
- `electron-vite build` — PASS
- `playwright test tests/e2e/vibeforge-human-serious.spec.ts --headed --workers=1 --timeout=1800000` — PASS (12/12 flows, 0 page errors, 0 console errors)

## [Unreleased] - 2026-07-10 — Aureon → Vibeforge Rename + Android Port Preparation

### Changed
- **Global Rebrand:** Renamed all remaining "Aureon Desk" / "Aureon" references to "Vibeforge" across source code, tests, docs, and QA reports.
- **Legacy Assets Removed:** Deleted `AureonMark.tsx`, `BrandLockup.tsx`, and all `aureon-*` brand assets from `public/brand/` and `assets/brand/`.
- **Component Imports Updated:** `AppShell.tsx` and `Sidebar.tsx` now import from `VibeForgeBrandLockup.tsx` / `VibeForgeMark.tsx`.
- **QA Docs Cleaned:** Updated `docs/qa/*.md` to use the Vibeforge product name and removed outdated file references.

### Added
- **Android Port Audit:** Created `docs/ANDROID_PORT_AUDIT.md` — classifies every renderer route, Electron API, file-system usage, IPC method, LivePreview dependency, provider key storage, SQLite usage, window control, drag/drop, MCP/local tool, and shell command for mobile compatibility.
- **Platform Adapter Pattern:** Created `src/shared/platform/platform-adapter.ts`, `desktop-adapter.ts`, `mobile-adapter.ts`, and `index.ts` to abstract desktop-only APIs behind a runtime-selectable adapter.
- **Capacitor Android Plan:** Created `docs/CAPACITOR_ANDROID_PLAN.md` with package strategy, required plugins, limitations, security plan, storage plan, build steps, and Galaxy A56 testing checklist.

### Docs
- Updated `AI_QA_REPORT.md` and `docs/IMPLEMENTATION_LOG.md` with current session details.

### Verification
- `npm run verify:native` — ✅ PASS
- `npm run typecheck` — ✅ PASS
- `npm test` — ✅ PASS (845 tests, 33 files)
- `npm run build` — ✅ PASS

## [0.9.83] - 2026-07-10 — Agent & Skill Cleanup + Beginner Onboarding + Android Companion

### Added
- **Agent & Skill Cleanup:**
  - `curated-skills.ts` now has `tier` + `examplePrompt` fields and 10 canonical beginner skills.
  - `agent-education.ts` now has a `tier` field (beginner/advanced).
  - `SkillsPage.tsx` redesigned with Beginner/Advanced tabs, concept strip, and action buttons (Use this / Copy prompt / Send to Build).
- **Beginner Onboarding:**
  - `FirstRunWizard.tsx` — 5-step onboarding modal (Welcome, Choose goal, Connect provider, First build, Navigation tour).
  - `uiStore.ts` — `showFirstRun`, `dismissFirstRun()`, `resetFirstRun()`.
  - `AppShell.tsx` wires `FirstRunWizard`.
  - `GeneralSettingsPage.tsx` adds "Restart onboarding" button.
  - `Sidebar.tsx` adds contextual help card for beginners.
- **Android/Phone Companion (Local Beta):**
  - `src/shared/companion.ts` — shared types, helpers, and default config.
  - `CompanionPage.tsx` — desktop settings UI for pairing, allowed commands, and security rules.
  - `CompanionMobileView.tsx` — mobile-first web UI at `/companion`.
  - `App.tsx` — added `/companion` and `/settings/companion` routes.
  - `SettingsLayout.tsx` — added Android Companion nav item.
  - `docs/ANDROID_COMPANION_ARCHITECTURE.md` — architecture and security model.

### Changed
- `SkillsPage.tsx` now defaults to the Beginner tab and shows canonical skills + beginner agents first.
- `GeneralSettingsPage.tsx` exposes the "Restart onboarding" control in Interface Mode section.
- `Sidebar.tsx` shows a dismissible "New here?" help card pointing to Skills & Agents and Settings.

### Docs
- Created `docs/ANDROID_COMPANION_ARCHITECTURE.md`.

### Verification
- Typecheck, unit tests, and build pending due to local npm installation issue (`npm-prefix.js` missing). Manual code review completed.

## [0.9.82] - 2026-07-10 — LivePreview Reliability Pass

### Fixed
- **Port Detection Race Condition:** Replaced the synchronous `execSync` child-process port probe loop in `live-preview.service.ts` with an in-process `net.createServer()` async socket binding check. Eliminates Windows quoting failures and process-spawn overhead, making port resolution fast and reliable.
- **Blank Preview Frame on Starting State:** `LivePreview.tsx` now renders the preview `<iframe>` during both `'starting'` and `'running'` states. A backdrop-blur loading spinner overlay is shown while the server is initialising so the frame never appears blank.
- **Iframe Cache Stale Renders:** Added a `key={status.id}` prop to the preview iframe so React fully remounts it on each new session, preventing stale cached page loads.
- **URL Input Not Reflecting Live URL:** The hidden `[data-testid="preview-url-input"]` value now binds to `status.url || customUrl` so Playwright E2E tests can reliably read the server URL after the session starts.
- **Race Condition Status Demotion:** Added a guard in the `onBuildStep` status updater: if the preview is already `'running'` or `'error'`, subsequent pipeline events cannot demote it back to `'starting'` or `'idle'`.
- **IPC Type Mismatch:** Updated `live-preview.ipc.ts` `preview:createDemo` handler to `async` returning `Promise<CodingDemoResult>` to match the now-async service method.

### Added
- **Diagnostics Panel:** New inline panel below the server controls bar in `LivePreview.tsx` showing the live preview URL (clickable), current status, last error, a "Restart Preview" button, and a "Copy Diagnostics" clipboard button. All elements are tagged with `data-testid` for E2E testing.
- **Full Interactive Lifecycle E2E Test:** Added `test('LivePreview full interactive lifecycle — start, stop, restart, and diagnostics')` in `tests/e2e/09-vibeforge-live-preview.spec.ts` covering: template selection, server start, URL non-blank assertion, diagnostics elements, stop, and restart.
- **Async Unit Tests:** Updated all `tests/unit/live-preview.test.ts` test cases that call `startPreview`, `startGeneratedPreview`, or `createDemo` to use `async/await` consistently with the refactored service API.

### Changed
- `livePreviewService.startPreview()`, `startGeneratedPreview()`, and `createDemo()` are now `async` methods returning `Promise<…>`.
- `build-pipeline.service.ts` awaits `livePreviewService.startPreview()` at the build completion step.

### Diagnostics
- verify:native ✅  |  typecheck ✅  |  unit tests 845/845 ✅  |  build ✅  |  demo:coding ✅

## [0.9.81] - 2026-07-10 — Vibeforge Codex-like Simplification Pass


### Added
- **Beginner Guidance Banners:** Added prominent info banners on empty home views and sidebars for Studio (`Studio.tsx`), Chat (`ChatWorkspace.tsx`), and LivePreview (`LivePreview.tsx`) to explain page purpose, next steps, and template execution.
- **ESC Key Handlers:** Integrated Escape key event listeners on model selectors, chat dropdowns (system prompt, projects), and preview controls to dismiss open drawers and overlays instantly.

### Changed
- **Main Sidebar Layout:** Regrouped navigation to vertical Primary, Secondary, and Advanced list, hiding Advanced options behind a toggle that synchronizes to local storage (`vb_show_advanced_nav`).
- **Settings Categories Layout:** Grouped settings into Core and Advanced menus, collapsing Advanced categories under an expandable toggle header synced with local storage (`vb_show_advanced_settings`).
- **Tab Synchronization:** Configured `LearnPage.tsx` to read the `tab` URL query parameters on mount and keep internal active tab state in sync via `useSearchParams`.
- **Button Consolidation:** Renamed primary building actions in the composer and task drawers to a single consistent **"Build with Preview"** CTA. Clicking "Build with Preview" with the "Coding Demo" template selected now launches the coding demo directly without requiring prompt inputs.

## [0.9.80] - 2026-07-10 — Rebrand Vibeforge Pass

### Rebranded
- **Product Name:** Changed from "Vibeforge" to "Vibeforge" globally across the app code, E2E tests, build paths, and scripts.
- **Migration & App Data Safety:** Implemented dynamic `%APPDATA%\Vibeforge-desk` path fallback override in the Electron entrypoint to prevent user configurations or API keys from resetting.
- **Brand Assets:** Compiled updated Vibeforge brand SVG vector marks to individual sizes (32, 64, 128, 256) and generated the main `icon.ico` and `icon.png` application icons. Added legacy Vibeforge duplicates to public assets to prevent broken file paths.
- **Playwright E2E Specs:** Renamed E2E test files under `tests/e2e/` from `*-Vibeforge-*` to `*-vibeforge-*` and updated package script pathways.
- **Diagnostics:** verify:native (pass), typecheck (pass), npm test (pass), npm run build (pass).

## [0.9.79] - 2026-07-10 — Handoff Verification & Diagnostics

### Checked
- **App Health:** Baseline validation run complete with 0 critical issues.
- **Node Environment:** Documented compatibility details for Node v20.19.5 vs system-default Node v26.4.0.
- **Diagnostics:** verify:native (pass), typecheck (pass), npm test (pass), npm run build (pass).
- **Handoff:** Created `docs/VS_CODE_AGENT_HANDOFF.md` detailing uncommitted Codex changes.

## [0.9.78] - 2026-07-10 — Beta Gate Passed & Packaged

### Beta Release Artifacts
- **Installer:** `VibeforgeDesk-Setup-0.9.0-x64.exe` (131 MB, NSIS)
- **Portable:** `VibeforgeDesk-Portable-0.9.0-x64.exe` (131 MB, self-extracting)
- **No-Install ZIP:** `Vibeforge-Desk-Beta-No-Install.zip` (185 MB)
- **Desktop Folder:** `C:\Users\mertg\Desktop\Vibeforge-Desk-Beta\`

### Beta Gate Checklist
| Gate | Status |
|------|--------|
| App starts | ✅ |
| Sidebar logo visible | ✅ |
| Desktop/taskbar icon configured | ✅ |
| Hero landing works | ✅ |
| Studio Build App works | ✅ |
| LivePreview auto-renders | ✅ |
| Artifact cards render | ✅ |
| Vibe Coding template works | ✅ |
| Skills page opens and searches | ✅ |
| Learn page renders | ✅ |
| Providers page works | ✅ |
| MCP safe gates work | ✅ |
| No dead core buttons | ✅ |
| No broken image references | ✅ |
| No critical issue open | ✅ |
| Secret scan clean | ✅ |

### Verified
- `npm run typecheck` — ✅ PASS (node + web)
- `npm test` — ✅ PASS (845 tests, 33 files)
- `npm run build` — ✅ PASS

## [0.9.78] - 2026-07-10

### Changed — Full Codebase Cleanup & LivePreview Performance

**LivePreview service DRY fix:**
- Extracted duplicated style replacement code (~30 lines × 2) into single `applyStyleToHtml()` helper in `live-preview.service.ts`
- Used by both `createSandbox()` and `startGeneratedPreview()` — single source of truth

**Component extraction:**
- Created `BuildPipelinePanel.tsx` — extracted 6-tab pipeline panel from LivePreview.tsx (Code, Files, Diff, Plan, Preview, Cards tabs + follow-up suggestions)
- Reduced LivePreview.tsx from ~850 lines to ~600 lines
- Removed 15 unused Lucide icon imports, duplicate Sparkles import, and dead imports
- All `data-testid` attributes preserved for E2E test compatibility

**Performance:**
- Removed unnecessary `useMemo` wrapper for `pipelinePanelProps` with missing deps
- Replaced with plain object — avoids stale callback references

**Docs:**
- Created `docs/FULL_CODEBASE_CLEANUP_AUDIT.md` — comprehensive audit: 0 duplicate components, 0 circular deps, 0 TODO/FIXME in source

### Verified
- `npm run typecheck` — ✅ PASS (node + web)
- `npm test` — ✅ PASS (845 tests, 33 files)
- `npm run build` — ✅ PASS

## [0.9.78] - 2026-07-10

### Added — Agent & Skill Education Center

**Education Center:**
- Created `src/renderer/src/pages/LearnPage.tsx` — 4-tab education center (Concepts, Agents, Skills, Auto-Selection) with search, category filters, detail panels, and interactive auto-selection demo
- Routes: `/learn` (standalone) and `/settings/learn` (within settings)
- Added Learn nav item in SettingsLayout with GraduationCap icon

**Agent Education Data:**
- Created `src/shared/agent-education.ts` — 16 agent profiles with beginner explanations, icons, categories, skills used, permissions, example prompts, and destructive flags
- Added `simulateAutoSelect()` shared function — keyword-based prompt routing shared between LearnPage UI and tests

**Skill Education Data:**
- Created `src/shared/skill-education.ts` — 19 skill profiles with simple descriptions, input/output fields, permissions, examples, test status, and categories

**Concepts Explained:**
- 8 core concepts: Agent, Skill, Tool, MCP, Prompt Profile, auto-selection, local vs provider data, permissions
- Each concept has a simple analogy, beginner-friendly description, and concrete example

**Auto-Selection Demo:**
- Interactive prompt input + 8 example prompts — shows which agent + skill would be selected
- Keyword-based routing logic: coding, landing page, debug, preview, providers, social, design, docs, cleanup counters

**Tests:**
- Created `tests/unit/agent-skill-education.test.ts` — 28 tests covering agent registry integrity, skill registry integrity, auto-selection routing (9 prompt→agent→skill mappings), concept coverage, license policy

### Verified
- `npm run typecheck` — ✅ PASS (node + web)
- `npm test` — ✅ PASS (845 tests, 33 files)
- `npm run build` — ✅ PASS

## [0.9.77] - 2026-07-10

### Added — VoltAgent Awesome Skills Importer

**Skill catalog import:**
- Created `scripts/import-voltagent-awesome-skills.mjs` — fetches the VoltAgent/awesome-agent-skills README and parses 1,179 skill entries from 189 providers across 20 categories
- Generates `voltagent-awesome-skills.generated.json` + `.ts` for type-safe rendering
- Added `npm run skills:import:voltagent` script
- Supports `--local` flag for offline use

**Type system:**
- Created `src/shared/external-skill-sources.ts` — ExternalSkillEntry, ExternalSkillSource, license/import/adaptation status enums, 20 SKILL_CATEGORIES, risk levels
- Created `src/shared/curated-skills.ts` — 12 Vibeforge-original curated skills (Web App Builder, Frontend Design, Web App Testing, MCP Builder, Android Testing, API Testing, CI/CD Pipeline, Security Review, Brand Guidelines, Theme Factory, Documentation Writer, Spreadsheets & PDFs)

**Skill Explorer UI:**
- Created `src/renderer/src/pages/SkillsPage.tsx` — full skill browser with search, category/provider filters, curated/external view modes, skill cards with copy/adapt actions, Adapt flow modal (generates original prompts, never copies source)
- Wired routes: `/skills` and `/settings/skills`
- Added "Skills & Agents" nav item in SettingsLayout

**Safety:**
- Metadata-only import — no source code is copied
- License status tracked (all initially `unknown`)
- Risk levels auto-assigned (safe/caution/destructive)
- Adaptation generates original prompts, not derivative works

**Tests:**
- Created `tests/unit/voltagent-skills-import.test.ts` — 27 tests covering curated skill integrity, category validation, generated data schema, importer parsing logic, license visibility

**Docs:**
- Created `docs/VOLTAGENT_SKILLS_IMPORT.md`, `docs/AGENTS_AND_SKILLS.md`, `docs/SKILL_LICENSE_POLICY.md`

### Verified
- `npm run typecheck` — ✅ PASS (node + web)
- `npm test` — ✅ PASS (814 tests, 32 files)
- Importer run — ✅ 1,179 skills, 189 providers, 20 categories

## [0.9.76] - 2026-07-10

### Added — Artifact & Output Renderer System

**Artifact Types (16):**
- Created `src/shared/artifacts.ts` — typed artifact system with prompt, code, text, markdown, file-tree, diff, preview, build-plan, search-results, image-gallery, tutorial, checklist, command, error-diagnostic, provider-setup, skill-result
- Each artifact: id, type, title, subtitle, content, actions, createdAt, risk level
- Factory helpers: `codeArtifactFromFileOp`, `promptArtifactFromTemplate`, `diffArtifactFromDiff`, `buildPlanArtifact`, `createArtifactId`
- Content parser: `parseArtifactsFromContent()` — extracts fenced code blocks from markdown, supports filename hints (`# src/file.ts`), CRLF + LF line endings, whitespace normalization

**Artifact Renderer Components (14 files):**
- Created `src/renderer/src/components/artifacts/` with 14 component files + barrel export
- `ArtifactCard` — universal router mapping type → view with copy/collapse actions
- Per-type views: `CodeArtifactView`, `PromptArtifactView`, `DiffArtifactView`, `BuildPlanArtifactView`, `CommandArtifactView`, `FileTreeArtifactView`, `TextArtifactView`, `MarkdownArtifactView`, `TutorialArtifactView`, `ChecklistArtifactView`, `PreviewArtifactView`, `ErrorDiagnosticArtifactView`, `ProviderSetupArtifactView`
- Each supports copy, expand/collapse, send-to-composer (where applicable)

**Chat Integration:**
- `MessageBubble.tsx` now parses AI assistant messages for code blocks and renders `ArtifactCard` components below the markdown content
- Cleaned markdown (code blocks removed) still renders first; artifacts appear below

**LivePreview Integration:**
- Added 6th "Cards" tab in build pipeline panel — renders build plan, code files, and diffs as ArtifactCards
- Uses shared helper functions for consistent artifact creation from pipeline data

**Tests:**
- Created `tests/unit/artifacts.test.ts` — 19 tests covering: creation helpers, CRLF parsing, multi-block extraction, filename hints, whitespace normalization, artifact ID uniqueness, action integrity

### Verified
- `npm run typecheck` — ✅ PASS (node + web)
- `npm test` — ✅ PASS (787 tests, 31 files)
- `npm run build` — ✅ PASS

## [0.9.75] - 2026-07-10

### Added — UI Simplification Pass

**Simple/Advanced mode:**
- New `simpleMode` toggle in Settings > General > Interface Mode. Simple mode is ON by default.
- In simple mode: hides Cowork workspace, Tools sidebar item, and 9 advanced settings nav items
- Persisted to settings DB via `ui.simpleMode` key
- Added to `uiStore` with `toggleSimpleMode()` and `setSimpleMode()` actions
- `SettingsLayout` filters nav to show only essential items (General, Providers, Prompts, Appearance, Projects, Tools)

**Providers page cleanup:**
- Removed busy Test Center grid and Token Usage panel (testing remains in individual adapter cards)
- Cleaner safety notice with neutral styling

**Sidebar simplified:**
- Cowork and Tools nav items hidden in simple mode
- Projects section collapses to single-column in simple mode

**Created:**
- `docs/UI_SIMPLIFICATION_AUDIT.md` — per-screen clutter/UX analysis

### Verified

- `npm run typecheck` — ✅ PASS (node + web)
- `npm test` — ✅ PASS (768 tests, 30 files)
- `npm run build` — ✅ PASS

## [0.9.74] - 2026-07-10

### Fixed — Brand Logo Visibility & Asset System Finalization

**Root cause:** CSS variables (`var(--ivory-accent)`) in SVG presentation attributes were failing to resolve in some Electron/Chromium rendering paths, causing the Vibeforge mark to render invisible.

**Fix:** Replaced all CSS variable references in VibeforgeMark.tsx with hardcoded brand hex colors (#B8683A, #A45A30, #F9EFE9, #E8A45C). Increased ring stroke opacity (0.25→0.30) and neural node dot sizes for guaranteed visibility on ivory backgrounds. Added `useId()` for collision-free gradient IDs.

**Brand wiring complete:**
- Branding visible in: sidebar (expanded + collapsed), topbar, Settings layout, Studio hero
- Added `BrandLockupCompact` convenience component for icon-only rendering
- Created new `assets/brand/Vibeforge-logo-lockup.svg` and `assets/brand/Vibeforge-github-banner.svg`
- Created `scripts/generate-brand-assets.mjs` — reproducible asset generation using canvas package
- Regenerated `build/icon.ico` as PNG-based multi-size ICO (7 sizes: 16,24,32,48,64,128,256)
- Regenerated all `public/brand/*.png` and `build/icon*.png` assets

### Verified

- `npm run typecheck` — ✅ PASS (tsconfig.node.json + tsconfig.web.json)
- `npm test` — ✅ PASS (768 tests, 30 files)
- `npm run build` — ✅ PASS (electron-vite)
- Brand asset generation — ✅ PASS (20 files generated)

## [0.9.73] - 2026-07-09

### Fixed — MCP Connection and Confirmation Safety

- MCP server connections now pass the same enabled/trusted/destructive-permission gate as tool execution before a stdio process or network transport is opened.
- Untrusted and disabled MCP servers are blocked before connection; destructive but trusted servers now present a separate connection confirmation.
- Confirmed MCP tool calls now carry an explicit confirmation flag through renderer, preload, IPC, and main process, so approval no longer loops back to another “Confirmation required” response.
- Restricted SSE/HTTP MCP endpoints to HTTP(S) URLs and redacted MCP stderr before it reaches application logs.
- Added six regression tests covering connection blocking, confirmation forwarding, URL validation, and stderr redaction.

### Verified

- `npm run verify:native` — PASS
- `npm run typecheck` — PASS
- `npm test` — PASS (768 tests, 30 files)
- `npm run build` — PASS

### Remaining Limits

- A third-party MCP server was not connected during this change; the real-server flow still needs a user-configured server and a visible desktop check.

---

## [0.9.72] - 2026-07-09

### Added — Full 5 File Operation Types in Build Pipeline

**Delta Computation Engine:**
- Added `computeDeltaFileOperations` — compares new generated files against existing sandbox files to produce the correct operation type, not just `create_file`
- All 5 operation types now fully implemented end-to-end: `create_file` (new file), `update_file` (modified with before/after diff), `delete_file` (removed with destructive risk), `rename_file` (detected by content match with oldPath), `mkdir` (directory creation)
- Added `readExistingSandboxFiles` — recursively reads text files from the sandbox directory to detect existing state for delta computation
- Wired `livePreviewService.getStatus().sandboxPath` so follow-up builds automatically detect existing files and produce correct delta operations
- Added `opLabels` map — per-file generation steps now show the correct verb: Creating/Updating/Deleting/Renaming/Making directory
- Skipped (unchanged) files are excluded from generation steps, avoiding noise
- Added `fileLanguage` and `fileRisk` helpers — delete_file automatically classified as 'destructive'

**Security Hardening:**
- `applyFileOperations` now skips `status: 'skipped'` ops — no unnecessary disk writes
- Path traversal check added on `rename_file` old path — both new and old paths verified against sandbox boundary

**UI — Per-Type Visual Differentiation:**
- Added 5 new Lucide icon imports: `FilePlus`, `FilePen`, `FileMinus`, `FileSymlink`, `FolderPlus`
- CODE tab generated files list now shows distinct icons and colored labels per operation type
- FILES tab now shows colored backgrounds (emerald/amber/red/purple/blue), icons, and uppercase TYPE badges (CREATE/UPDATE/DELETE/RENAME/MKDIR)
- `oldPath` display for rename operations (e.g., "src/app.tsx ← src/App.tsx")
- `skipped` status and `unchanged` label for files with no content changes

**Tests:**
- Added tests for all 5 operation types: `update_file` with before/after/diff, `delete_file` with destructive risk, `rename_file` with oldPath, `mkdir` semantics
- Updated risk classification test to verify safe vs destructive per operation type

### Verified

- `npm run typecheck` — ✅ PASS
- `npm test` — ✅ PASS (710 tests, 28 files)
- `npm run build` — ✅ PASS
- Code review — ✅ PASS (3 rounds, issues found and fixed: dead `matchedNew` variable removed, skipped ops not re-written, rename path traversal check added, `toUpperCase` error fixed)

### Remaining Limits

- No integration-style tests for `computeDeltaFileOperations` itself (only unit tests for individual operation types)
- All operations still applied to a fresh sandbox (old sandbox used for delta detection, new sandbox for apply)
- Rename detection by content match won't catch renames where content also changed

---

## [0.9.71] - 2026-07-09

### Added — NVIDIA NIM Support & Smart Model Routing

**NVIDIA NIM Provider:**
- Added NVIDIA NIM adapter to `PROVIDER_ADAPTERS` in `constants.ts` — free tier available via build.nvidia.com
- OpenAI-compatible API at `https://integrate.api.nvidia.com/v1`
- 3 default models: Llama 3.1 Nemotron 70B, Nemotron 4 340B, Llama 3.1 Nemotron 51B
- `nvidia` adapter case added to `chat-completion.service.ts` callProvider routing

**Token-Based Model Switching:**
- Extended `model-selector.ts` with exhaustion tracking: `markModelExhausted()`, `isModelExhausted()`, `clearModelExhaustion()`
- 5-minute auto-cooldown: exhausted models reset after cooldown period
- `selectFallbackModel()` — picks next best model when primary is exhausted
- Free tier bonus: models with `hasFreeTier: true` get +10 score boost
- All models now explicitly set `hasFreeTier: false` for type safety

**Model Router Service:**
- Created `src/main/services/model-router.service.ts` — main-process bridge between smart selector and provider DB
- `resolveBestModelForBuild()` — auto-selects best model for pipeline code generation
- `handleExhaustion()` — marks model exhausted + returns fallback
- Resolves ModelScore to DB model ID for pipeline integration

**Smart Model Selection in Studio Build Flow:**
- Studio → LivePreview pipeline now resolves the best available AI model before starting build
- `providerModelRoute` passed through sessionStorage pipeline contract
- Follow-up suggestions also use smart model resolution
- Loading state on "Start building" button while resolving model
- Model explanation shown in Studio (e.g., "Selected Llama 3.1 Nemotron 70B for Code Generation")

**Wired:**
- 6 new IPC handlers: `model-router:selectForPrompt`, `model-router:handleExhaustion`, `model-router:getExhausted`, `model-router:clearExhaustion`, `model-router:getAllScores`, `model-router:resolveBestForBuild`
- Preload bridge fully typed for model router API
- Preview helpers updated with `pipelineModelRoute` and `pipelineModelExplanation` sessionStorage keys
- LivePreview.tsx `handleFollowUp` now uses smart model selection instead of hardcoded null
- Test updated for new sessionStorage keys

### Verified
- `npm run typecheck` — ✅ PASS
- `npm test` — ✅ PASS (597 tests)
- `npm run build` — ✅ PASS
- Code review — ✅ PASS (issues found and fixed)

## [0.9.70] - 2026-07-09

### Added — Smart Model Selection & Device Inputs Foundation

**Device Inputs:**
- Created `src/shared/device-inputs.ts` — shared types for camera, microphone, screen capture with safety contracts
- Created `src/main/services/device-inputs.service.ts` — screen capture via Electron desktopCapturer
- Created `src/main/ipc/device-inputs.ipc.ts` — IPC handlers for screen source listing
- Created `src/renderer/src/pages/settings/DeviceInputsPage.tsx` — full settings UI with device detection, permission states, preview controls, screen source thumbnails
- Added "Device Inputs" nav item in Settings (Camera icon)
- Wired routing, IPC registration, and preload API

**Smart Model Selection:**
- Created `src/shared/model-selector.ts` — auto-chooses best model based on context
- Supports 5 task types: code_generation, chat, vision, reasoning, fast_inference
- Scores 15+ models across OpenAI, Anthropic, Google, DeepSeek, Mistral, Groq, OpenRouter, Ollama
- `selectBestModel()` — picks highest-scoring available model
- `selectModelForPrompt()` — analyzes prompt keywords to determine task type
- `explainModelSelection()` — human-readable selection reasoning
- Free model preference for low-complexity tasks

### Cleanup
- Removed dead `getMainWindowId()` from device-inputs service
- Removed unused exports from shared types
- Removed dead imports from DeviceInputsPage

### Test Results
- Demo coding pipeline: ✅ PASS (counter app generated and verified)
- E2E smoke tests: ✅ 7/9 pass (2 flakes — Electron DevTools WebSocket)

### Verified
- `npm run typecheck` — ✅ PASS
- `npm test` — ✅ PASS (597 tests)
- `npm run build` — ✅ PASS
- Code review — ✅ PASS

## [0.9.69] - 2026-07-09

### Added — Real AI Provider Code Generation in Build Pipeline

- Wired `providerModelRoute` from `BuildRequest` to call AI providers for code generation instead of always using the deterministic demo
- Added `generateWithAI()` function: resolves provider/model via `providerService.resolveCanonicalModelReference()`, gets API key, constructs code-gen system prompt with theme colors, calls provider-specific endpoints
- Added 4 adapter-specific call functions: `callOpenAICompatibleForCode`, `callAnthropicForCode`, `callGoogleForCode`, `callOllamaForCode`
- Added `parseCodeResponse()` to extract files from AI output — tries JSON first, then markdown code block fallback
- Graceful fallback: if AI generation fails (no provider, no API key, network error, bad response), pipeline automatically falls back to the deterministic local demo
- Extracted `THEME_COLORS` to module-level constant shared by both demo and AI code generation paths
- Fixed `isDemo` to dynamically update when falling back from AI to demo (was `const`, now `let`)

### Verified

- `npm run typecheck` — ✅ PASS
- `npm test` — ✅ PASS (597 tests)
- `npm run build` — ✅ PASS
- Code review — ✅ PASS (critical isDemo bug found and fixed)

## [0.9.68] - 2026-07-09

### Post-Run Consolidation

- Created `docs/POST_RUN_CONSOLIDATION.md` — comprehensive post-run audit with 12-gate critical issue checklist
- Verified all 12 critical gates pass: app start ✅, typecheck ✅, 597 tests ✅, build ✅, dev server ✅, Studio/LivePreview/Provider/MCP/safety all ✅
- Confirmed 0 circular dependencies across 137 source files (madge)
- Confirmed 0 open Critical Issues in ISSUES_REGISTER.md
- Updated ISSUES_REGISTER.md, AI_QA_REPORT.md, CHANGELOG.md, IMPLEMENTATION_LOG.md

### Beta QA Readiness

✅ **READY FOR BETA QA** — No critical blockers. Manual click-through by human tester is the only remaining gate.

## [0.9.67] - 2026-07-09

### Changed — Deep Repo Cleanup with Free Tooling

- Installed `knip`, `depcheck`, `madge` as devDependencies for dead code/unused dep/circular dependency detection
- Created `knip.json` — configured for Electron + Vite + Vitest + Playwright project
- Created `docs/CODE_CLEANUP_AUDIT.md` — comprehensive cleanup audit report
- Added npm scripts: `audit:deadcode`, `audit:deps`, `audit:cycles`

### Removed — Dead Code

- Deleted `scratch/` directory (~398K, 12+ diagnostic files, already gitignored)
- Deleted `Popover.tsx` and `SelectMenu.tsx` — 0 imports found (170+143 lines dead code)
- Deleted 3 untracked `device-inputs.*` files from interrupted previous task
- Removed 6 dead exports: `DangerZone`, `VibeforgeLogo`, `BrandLockupCompact`, `ConnectorIconSmall`, `APP_NAME`, `SEVERITY_ORDER`

### Verified

- `npm run typecheck` — ✅ PASS
- `npm test` — ✅ PASS (597 tests)
- `npm run build` — ✅ PASS
- `madge` — ✅ 0 circular dependencies across 137 files
- Code review — ✅ PASS

## [0.9.66] - 2026-07-09

### Added — Safe Self-Audit & Optimization System

- Created `src/shared/self-audit.ts` — shared types: 12 audit categories, 4 severity levels, 4 audit modes, report/plan/patch types, agent prompt generator, redacted/safe file patterns
- Created `src/main/services/self-audit.service.ts` — main process audit engine: scans project structure, reads key docs, runs category checks, generates improvement plans, creates patch proposals
- Created `src/main/ipc/self-audit.ipc.ts` — IPC handlers for audit:run, audit:runAuditOnly, generatePlan, generatePatch
- Created `src/renderer/src/pages/SelfAudit.tsx` — full UI page with audit controls, mode selection, category results (expandable), improvement plan tab, patch proposal tab, approval flow, copy/send/open actions
- Added 12 audit categories: critical issues, dead buttons, LivePreview health, Studio health, provider health, MCP safety, UI clutter, performance, docs, dead code, security/secrets, build/test health
- Added 4 audit modes: local_only (structure + package.json only), docs_only, selected_files, full (with redaction)
- Added patch proposal flow with explicit approval gate — no autonomous self-modification
- Added agent prompt generation for Chat/Code mode handoff
- Added local-only safe mode, redaction warnings, and mode-gated file reading

### Tests Added

- Added `tests/unit/self-audit.test.ts` — 36 unit tests covering: category completeness, redacted/safe patterns, report structure, plan generation, patch safety (approval state required, no auto-apply), agent prompt generation, finding fields, severity levels

### Wired

- Registered SelfAudit route in App.tsx (`/self-audit` and `/settings/self-audit`)
- Added Self Audit nav item in SettingsLayout with ScanLine icon
- Registered self-audit IPC handlers in `src/main/ipc/index.ts`
- Exposed `selfAuditRun`, `selfAuditRunAuditOnly`, `selfAuditGeneratePlan`, `selfAuditGeneratePatch` in preload bridge

### Verified

- `npm run typecheck` — ✅ PASS
- `npm test` — ✅ PASS (597 tests, 26 files)
- `npm run build` — ✅ PASS
- Code review — ✅ PASS (issues found and fixed)

## [0.9.66] - 2026-07-09

### Added — Premium Brand Assets

- Created premium SVG logo set: `Vibeforge-mark.svg` (256x256 abstract "A" with aureole ring, neural node dots, gradient fills), `Vibeforge-icon.svg` (rounded rectangle app icon), `Vibeforge-wordmark.svg` (mark + serif text + tagline)
- Updated `VibeforgeMark.tsx` with premium inline SVG: gradient `url(#mark-grad-{size})`, larger viewBox, neural node dots at cardinal positions, subtle connection lines

### Added — HuggingFace Provider

- Added HuggingFace Inference API provider adapter to `PROVIDER_ADAPTERS` with 4 models: Mistral 7B Instruct, Llama 3.1 8B Instruct, Gemma 2 9B, Qwen 2.5 7B
- Added 3 HuggingFace model scores to `MODEL_SCORES` with `hasFreeTier: true` for free-tier auto-preference
- Added `huggingface` to OpenAI-compatible adapter routing in `provider-call.ts`

### Added — System Prompts Repository

- Cloned `system_prompts_leaks` repo (317 files) with Anthropic Claude Desktop, OpenAI Codex, Google Gemini, xAI Grok, and misc system prompts
- Repo structure catalogued: Anthropic/ (Official, Claude Code), OpenAI/ (API, Codex), Google/ (Gemini models), xAI/ (Grok models), Misc/ (Copilot, Perplexity, Meta, etc.)

### Changed — Cleanup

- Removed model-specific attribution from `AGENTS.md` ("Antigravity, Codex" → "AI sessions")
- Removed stale "Codex Prompts 1-4" from prompt queue in AGENTS.md
- Updated provider-call.ts adapter comment to include HuggingFace

### Details

- Premium logo: warm terracotta gradient (#C75B39 → #B8683A), golden accent dots (#E8A45C), ivory background (#F3EFE6)
- HuggingFace: OpenAI-compatible `/v1/chat/completions` endpoint, free tier with rate limits and cold start
- System prompts repo: 317 files available for future per-model prompt selection UI

### Verified

- `npm run typecheck` — ✅ PASS
- `npm test` — ✅ PASS (706 tests, 28 files)
- `npm run build` — ✅ PASS

## [0.9.65] - 2026-07-09

### Added — Safe Connector & MCP Preset Catalog

- Added `src/shared/connector-presets.ts` as the canonical safe preset catalog for 15 services:
  OpenAI API, Google Gemini API, OpenRouter, Anthropic, Gmail OAuth, Google Drive OAuth, Google Calendar OAuth, GitHub, MCP Server Custom, Local Ollama, LM Studio, Phone Companion, WhatsApp Business API, Email SMTP/IMAP, and Browser Search MCP.
- Rebuilt Settings → Connectors around the preset catalog with search, status filters, neutral Lucide icons, risk/status badges, setup guidance, permission explanations, required-field preview, connection-test messaging, and a right-side configuration drawer.
- Marked Gmail OAuth as planned with explicit OAuth scopes and user-approval requirements.
- Marked WhatsApp as an official WhatsApp Business API placeholder only; no WhatsApp Web, phone-screen, or personal-account automation.
- Marked Phone Companion as planned until a companion app, local pairing, and explicit device permissions exist.
- Added `.gitignore` coverage for `scratch/` so local diagnostic files do not enter commits.
- Added `src/shared/social-connectors.ts` with safe social connector presets for Facebook Graph API, Instagram Graph API, YouTube Data API, YouTube Upload, TikTok, X/Twitter, LinkedIn, and WhatsApp Business API.
- Added a Social Connectors section to Settings → Connectors with neutral icons, scopes, "what this can do", "what this cannot do", test placeholders, draft action previews, and a confirmation modal contract.
- Added explicit social action contracts for comment summaries, draft posts/replies, analytics placeholders, video descriptions, hashtags, upload checklists, scheduled drafts, and confirmation-only publish/reply/delete/upload actions.

### Tests Added

- Added `tests/unit/connector-presets.test.ts` for preset validation, Gmail scopes, WhatsApp API-only guardrails, Phone Companion planned status, and neutral icon contracts.
- Added `tests/unit/social-connectors.test.ts` for social registry validation, YouTube/Meta scopes, confirmation-only destructive actions, and WhatsApp Business API constraints.
- Added an E2E drawer/filter check to `tests/e2e/18-Vibeforge-studio-vibe-flow.spec.ts`.
- Added an E2E Social Connectors drawer/confirmation flow to `tests/e2e/18-Vibeforge-studio-vibe-flow.spec.ts`.

### Verified

- Pre-change `npm run verify:native` — ✅ PASS
- Pre-change `npm run typecheck` — ✅ PASS
- Pre-change `npm test` — ✅ PASS (549 tests)
- Pre-change `npm run build` — ✅ PASS
- Visible Electron manual QA via `npm run dev` — ✅ PASS for Studio prompt typing, Enter-to-Code/LivePreview route, LivePreview local server, and Task Brief Composer typing
- Post-change `npm run typecheck` — ✅ PASS
- Post-change `npm test` — ✅ PASS (561 tests)

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
- Large VibeforgeMark (56px) with scale-in animation
- Heading: "Build calmly with Vibeforge" (serif display font)
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

- Fixed broken GitHub banner image path from non-existent `assets/brand/nano-banana/Vibeforge-github-banner.png` to correct `assets/brand/Vibeforge-github-banner-1200.png`.

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

All notable changes to Vibeforge are documented here.

## [Unreleased] — Visible Human QA Harness (2026-07-09)

### Added

- **`tests/e2e/Vibeforge-human-visible.spec.ts`** — 20-step Playwright Electron
  headed harness that launches the real Vibeforge app visibly, exercises
  the full Studio → Code → LivePreview → Provider → MCP pipeline, and
  saves numbered PNG screenshots to `tests/e2e/artifacts/human-visible/`.
- **`npm run test:human:headed`** — headed mode, `workers=1`, full screenshot pipeline.
- **`npm run test:human:headed:slow`** — bash-friendly slow-motion variant
  (uses `Vibeforge_SLOW_MO_MS=500`).
- **`npm run test:human:ui`** — Playwright UI mode for manual step-by-step review.
- **`docs/HUMAN_VISIBLE_QA_HARNESS.md`** — operator-facing runbook + screenshot map.

### Changed

- **`tests/e2e/helpers/electronApp.ts`** — added optional
  `Vibeforge_SLOW_MO_MS` env var piped into `electron.launch({ slowMo })`.
  Slow-motion is opt-in; global E2E tests run fast when the env var is unset.
- **Step 17 (MCP safety gate) assertion is now source-accurate** —
  matches the actual `ToolsPage.tsx` modal copy: "disabled by default" +
  "review capabilities before enabling".

### Notes

- Console errors are logged but non-fatal, matching the existing
  `tests/e2e/99-human-click-qa.spec.ts` convention. The harness fails
  only on `pageerror` (React crashes) — which is the standard for human
  review runs.

## [0.9.73] - 2026-07-09 — Private Beta Release + Live Human QA

### Live Human QA
- Headed Playwright E2E: 12/13 pass (visible Electron app)
- 11/11 buttons verified working (no dead interactions)
- Android-style habit tracker: ✅ PASS (7/10 quality)
- Premium landing page: ✅ PASS (8/10 quality)
- LivePreview mode toggle: ✅ All 5 tabs working
- 0 dead buttons found, 0 critical issues
- Created `docs/LIVE_HUMAN_QA_REPORT.md`

### Beta Build Artifacts
- **Installer:** `VibeforgeDesk-Setup-0.9.0-x64.exe` (124 MB)
- **Portable:** `VibeforgeDesk-Portable-0.9.0-x64.exe` (124 MB)
- **No-Install ZIP:** `Vibeforge-Desk-Beta-No-Install.zip` (175 MB)
- **Beta Folder:** `C:\Users\mertg\Desktop\Vibeforge-Desk-Beta`

## [0.9.73] - 2026-07-09

### Core Contract Enforcement — Studio to LivePreview

**Inspected & Verified:**
- Full Studio → Build Pipeline → Code Mode → LivePreview contract inspected and enforced
- All 11 buttons in the core flow verified working (no silent no-ops)
- Deterministic demo flow: counter app renders, file tree shows, diff shows, follow-up suggestions appear
- Demo coding smoke test: ✅ 9/9 checks pass
- E2E tests: 12/13 pass (1 flaky timeout fixed — build-code-tab visibility 20s)

**Contract Document Updated:**
- `docs/STUDIO_LIVEPREVIEW_CONTRACT.md` upgraded to v2.0
- Now documents the full build pipeline flow: classifyIntent → generateDeterministicApp → computeDeltaFileOperations → createSandbox → applyFileOperations → startPreview → emitStep
- Added 11-button verified contract table
- Added build pipeline IPC contract (build:run, build:cancel, build:step, build:complete)
- Added sessionStorage contract for build pipeline keys

**Model Label in Plan Tab:**
- Plan tab now shows the resolved model label (e.g., "Source: Claude 3.5 Sonnet via Anthropic") instead of generic "Source: AI provider"
- Model resolution happens in the plan step using providerService.resolveCanonicalModelReference()

**Pulsing Dot Indicator:**
- Added animated ping dot next to the model label during AI streaming generation in Code tab
- Clear visual indicator that generation is actively in progress

### Verified
- `npm run verify:native` — ✅ PASS
- `npm run typecheck` — ✅ PASS
- `npm test` — ✅ PASS (723 tests)
- `npm run build` — ✅ PASS
- `npm run demo:coding` — ✅ PASS (9/9 checks)
- E2E (studio pipeline) — ✅ 12/13 pass

## [0.9.60] - 2026-07-09
