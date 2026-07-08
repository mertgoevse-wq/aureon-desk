# Aureon Desk UX Decisions

Last updated: 2026-07-08

## Vibe Coding Guided Builder Expansion (2026-07-08)

Decision: Expand Vibe Coding into a full dashboard with project type cards, quick actions, template gallery, guided builder with safety instructions, and beginner tutorials. All actions are safe: insert into composer only, never auto-execute.

Key changes: 15 templates (up from 8), 8 TUTORIAL_CARDS, 9 BeginnerHelp blocks, ProjectsPage CTA.

---

## Premium UI Repair Session (2026-07-08)

Decision: Implement a comprehensive UI repair targeting the exact issues identified in the DeepSeek source-aware review: brand/header repair, sidebar visual weight reduction, typography normalization, provider layout polish, settings refinement, vibe coding surface, and BeginnerHelp interaction upgrade.

Key changes:
- Sidebar width tightened to 240px default with lighter surface color (#F7F3EC) for less visual divide
- Semantic typography scale introduced (text-ui-caption through text-ui-2xl) to replace arbitrary px values
- Minimum readable text raised from 10px to 11px everywhere except compact badges/kbd
- BrandLockup component created to centralize brand display (mark + title + subtitle)
- Save Key button in ProvidersPage toned down from primary/orange to secondary
- 8 vibe coding suggestion chips added to chat home for beginner discoverability
- BeginnerHelp `<details>` replaced with custom accordion for polished interaction

Decision to defer:
- Provider card full structural reorg (A-E sections) — too large for this session
- Collapsed sidebar width change (48px is functional; 56-68px adds bulk)
- Code mode vibe coding suggestion chips — existing CTA button is sufficient for now

---

## Freebuff Ingestion Session (2026-07-08)

Decision: Conducted a full code-based visual audit without running E2E tests or making code changes. Documented 8 visual issues, 5 duplicate/dead code suspects, and inventoried 5 untracked Nano Banana brand assets.

Key findings for future UX work:
- The inline Aureon SVG mark is too small and repeated in 3+ files — should be a shared component with proper sizing
- Sidebar at 280px is visually dominant — reduce to 220-240px
- Typography scale needs normalization — too many custom pixel sizes (10px, 11px, 12px)
- Two Toggle components exist — deduplicate into one canonical implementation
- Native HTML checkboxes in CoworkPage break visual consistency — replace with custom Toggle
- CapabilitiesPage and CoworkPage have overlapping permission controls with different UI patterns

### Brand Asset Integration Plan
Nano Banana provided 5 brand assets. Integration order:
1. `aureon-mark-monochrome.png` → Replace inline SVG marks in sidebar/topbar/home page
2. `aureon-app-icon.png` → Generate new `icon.ico` and update `windows.ts` icon path
3. `aureon-logo-light.png` → Use for README and documentation
4. `aureon-github-banner.png` → Use as GitHub social preview
5. `aureon-dark-logo-presentation.png` → Reserve for dark mode implementation

---

## Calm Desktop Direction

Decision: Continue moving Aureon Desk toward a calm, premium desktop AI workspace with ivory/light-mode surfaces, rounded but restrained controls, sans-serif UI text, and serif only for brand/display moments.

Why: The exported ChatGPT plan and user feedback ask for an experience closer to Claude Desktop and Codex/Cowork workflows without copying Anthropic/OpenAI assets, exact layouts, logos, fonts, colors, or private behavior.

Files touched in this continuation:
- `src/renderer/src/pages/LivePreview.tsx`
- `src/renderer/src/components/shared/Input.tsx`
- `README.md`
- `SECURITY_NOTES.md`
- `ARCHITECTURE.md`
- `AI_QA_REPORT.md`

Validation:
- `npm run verify:native` PASS
- `npm run typecheck` PASS
- `npm test` PASS, 278 tests
- `npm run build` PASS
- `npm run test:e2e` PASS, 79 tests

## Screenshot-Inspired Workspace Shell

Decision: Implement an original Aureon interpretation of the requested Claude/Codex-style workspace: global `Chat / Cowork / Code` modes, a centered chat home composer, a category-based Settings view, and a less crowded left sidebar.

Why: The app needed the premium spacing and workflow clarity of modern desktop AI tools while staying visually and structurally original.

Refinement after user review:
- Removed the extra `Aureon Desk` text from the bright top header.
- Kept the mode switch as the primary top focal point.
- Simplified the sidebar to one primary `New Chat` button, one compact `New Task` icon, one search row, compact shortcut icons, collapsed workflow placeholders, and a tighter Projects/Tools row.
- Kept unsupported Cowork actions as explicit placeholders instead of broken controls.

Validation:
- `npm run typecheck` PASS
- `npm test` PASS, 283 tests
- `npm run build` PASS

## Provider/Model Identity Display

Decision: Display provider and model together wherever identity matters, especially for OpenRouter-routed models.

Why: A model name alone can imply the wrong adapter. `OpenRouter · Claude Sonnet 4` is materially different from direct `Anthropic · Claude Sonnet 4`.

UI rule:
- Header and assistant bubbles may show provider/model metadata.
- Assistant bubbles use persisted response metadata, not a guessed current selector state.

## LivePreview Static Server

Decision: Use an Electron main-process in-process HTTP server for static HTML and Coding Demo previews, while keeping Vite+React on the npm/Vite path.

Why: Static templates do not need a subprocess. Running them in-process makes Windows startup more reliable, keeps logs and lifecycle under Aureon control, and reduces "server exited" noise. Vite+React still needs its normal toolchain.

Safety:
- Server binds to `127.0.0.1`.
- Static requests are restricted to the resolved sandbox directory.
- Traversal attempts return `403 Forbidden`.
- Logs continue through the existing redaction pipeline.

## Provider Input Paste

Decision: Shared input fields handle paste events explicitly and dispatch controlled `input` events for React state.

Why: Electron/Windows and Playwright can differ in how native clipboard shortcuts propagate. API-key fields must accept typing and paste reliably because provider setup is a primary workflow.

Validation:
- Full E2E confirms provider API-key typing/paste.
- Chat composer typing/paste remains covered separately.

## Custom Frameless Window & Titlebar Controls

Decision: Implement custom frameless window styling (`frame: false`) and custom styled controls for Minimize, Maximize/Restore, and Close matching the calm ivory/terracotta palette, instead of using standard native OS frames.

Why: Native Windows title bars look generic and do not fit the premium warm ivory look. Rerouting window controls directly to Electron via custom IPC allows us to build a beautifully integrated topbar that contains: back/forward navigation buttons, mode-switch tabs, search button, and window controls all in one unified row with proper drag regions and without blocking clicks.

## Empty Chat Home Composer

Decision: Replace the default empty chat welcome layout with a high-fidelity, polished desktop-assistant start screen. This screen includes a time-aware greeting ("Good morning, Mert" / "Good afternoon..."), Aureon's custom vector mark/logo, a large card containing the main message composer, and configuration dropdown selectors for active models, system styles, active projects, and active tools.

Why: A premium desktop assistant needs to feel welcoming and give the user direct options to change configurations before writing their prompt. The large composer card serves as the focal point. To help the user get started quickly, 8 suggestion chips are provided to prepopulate the composer with well-designed instructions (e.g. Plan a feature, Review code, Build a preview, etc.).

## Code Mode Workspace Redesign

Decision: Transform the preview page into a split-pane coding dashboard (`Code Mode`). The left column houses the active project context selector, a files summary list that explicitly filters and marks configuration files (like `.env`, `.git/`, `node_modules/`) as "Ignored by Safety Policy", a warning banner explaining privacy limits, and a task brief composer. The right column houses live preview iframe execution and an interactive console logs panel.

Why: The user needed a useful coding workspace MVP combining local files, task briefs, and interactive previews in one unified view. Restricting configuration directories and warnings guarantees that secrets are never sent to external LLMs.

## Premium Three-Column Settings Redesign

Decision: Reorganize Settings into a three-column premium layout. The far-left column remains the app's navigation sidebar, the middle column displays the 12 settings categories, and the right column scrolls the detail panel. Reusable component primitives (`SettingsSection`, `SettingsRow`, `Toggle`, `StatusPill`, `DangerZone`) provide a consistent, premium look. Fully implemented the **Capabilities** page to control browser/computer autonomy and check OS permission states. Rebuilt the **Developer** page with system paths and export diagnostics.

Why: To match the structure of premium desktop applications (e.g. Claude Desktop) with clean toggles, row-based sections, and clear status columns, while maintaining full compatibility with existing provider databases.

## Remaining UX Direction

Next major UX work should be a bounded refinement of:
- Visual density after real-world use at 1366x768.
- Right inspector simplification with collapsible intent, risk, tools, and keywords.
- Cowork task queue implementation once the placeholder workflow has real backing behavior.

