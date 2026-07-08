# Aureon Desk UX Decisions

Last updated: 2026-07-08

## Product Structure Polish — Reduced Clutter (2026-07-08)

Decision: Reduce visual clutter across key screens by removing redundant actions, collapsed secondary sections, and trimmed suggestion counts.

Chat mode: Starter prompts reduced from 6 to 4 to avoid overwhelming the user. Vibe coding suggestions removed from chat home — they're accessible from the dedicated Vibe Coding page. Recent chats reduced from 3 to 2.

Cowork mode: Removed "Return to Chat" and "Open Live Preview" header buttons — the top mode switch (Chat/Cowork/Code) already provides this navigation, so these buttons were redundant clutter.

Vibe Coding: "All templates" section now collapsed by default, showing only a count badge. Users can expand it when they need more options. This keeps the primary focus on project types and quick actions.

## Drawer & SelectMenu — Overlay System Expansion (2026-07-08)

Decision: Expand the compact overlay system with a Drawer (right slide-in panel) and SelectMenu (simple anchored popover menu without search). Fix ProjectsPage to use the shared Modal instead of its custom inline modal.

Why: The shared overlay system needed a slide-in panel for settings that benefit from side-by-side context (Drawer) and a simpler popover menu for straightforward selections (SelectMenu — lighter than SelectPopover, no search input). ProjectsPage had a custom inline modal with no focus trapping or accessibility — replacing it with the shared Modal brings consistency and proper keyboard/ARIA support.

Components added:
- **Drawer**: Right slide-in panel (420px default), ESC/click-outside close, focus trap, smooth slide animation, ARIA dialog role
- **SelectMenu**: Compact popover menu with keyboard nav (arrow keys, enter, esc), auto-focus, alignment support (left/right/center), ARIA listbox/option roles

## Compact Overlay System (2026-07-08)

Decision: Replace oversized center panels and inline forms with compact modal dialogs and anchored popovers. Create a reusable overlay system that doesn't take over the full center workspace.

Components created:
- **Popover**: Anchored dropdown with ESC/click-outside/focus-loss close, alignment/side positioning. Used for selectors, dropdowns, quick actions.
- **SelectPopover**: Searchable select list built on Popover, with keyboard navigation (arrow keys, enter, esc), auto-focus, and scroll-into-view.
- **Modal** (enhanced): Focus trapping, compact sizing (320-560px), smooth transitions, ARIA attributes, body scroll locking.

First application: ProvidersPage "Add Custom Provider" form — was a full-width inline form; now a compact 380px Modal dialog.

Design principles:
- Small by default, expand only when content requires
- max-width 320-560px depending on use
- ESC closes, click outside closes, focus resides inside
- Smooth scale+opacity transitions (200ms)
- No overlay blocking normal input when closed

---

## Native Window Frame Decision (2026-07-08)

Decision: Remove custom frameless window and switch to native Windows frame with native min/max/close controls.

Why: The custom window controls were problematic — they appeared in a non-standard location and could duplicate native controls on some Windows configurations. Native Windows controls are universally recognized and always positioned correctly in the top-right corner. The premium topbar with mode switch, back/forward, and search remains below the native title bar.

Changes:
- `windows.ts`: Removed `frame: false` — defaults to native frame
- `AppShell.tsx`: Removed custom min/max/close buttons, drag regions, and maximize state tracking
- Header height reduced: 56px→48px (h-14→h-12)

Side effects: The collapsed sidebar brand mark in the topbar no longer needs to appear (native title bar handles brand display). `WebkitAppRegion` drag styling removed from all topbar elements.

## Sidebar Calming (2026-07-08)

Decision: Narrow sidebar default width to 232px (within 228-244px range), widen collapsed state to 56px, lighten surface color closer to background, and collapse the workflow section by default.

Why: The sidebar was visually dominant despite prior narrowing. A lighter surface color (#F9F6F0 vs bg #FAF7F2) creates a gentler visual transition. Collapsing workflow by default reduces initial visual load. Removing the full-width Vibe Coding button from the projects grid simplifies the section to just Projects/Tools.

## Center Workspace Decluttering (2026-07-08)

Decision: Reduce suggestion chips from 8+8 to 6+4, remove the large CTA banner.

Why: The chat home had excessive suggestion chips competing for attention. Progressive disclosure means showing the most useful suggestions and letting the user discover more through the Vibe Coding page or sidebar. The large CTA banner felt like an advertisement rather than a calm assistant feature.

---

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

