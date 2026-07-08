# Aureon Desk — DeepSeek Current Review

> **Review date:** 2026-07-08
> **Branch:** `main`
> **Commit:** `c4cea6d` ("Clean duplicate files dead code and stale artifacts")
> **Tests:** 318 passing (19 files)
> **Build:** ✅ PASS

---

## 1. Architecture Summary

```
Electron 43 (main)  ←→  preload (contextBridge)  ←→  React 19 (renderer)
       ↓                                              ↓
  better-sqlite3 + Drizzle ORM                  Zustand 5 (8 stores)
  SafeStorage vault (DPAPI)                     Tailwind CSS v4
  13 IPC handler files                          React Router v7 (hash)
  22 service files                              Lucide React + Markdown

Shared: src/shared/ (types, constants, vibe-templates, star-list)
Tests: 18 unit files (318 tests) + 17 E2E specs
Build: electron-vite 5 → out/ (main/preload/renderer)
Package: electron-builder → NSIS installer + portable
```

## 2. UI Screens Inventory

| Screen | Route | Component | Status |
|--------|-------|-----------|--------|
| Home / Chat empty | `/` | `ChatWorkspace.tsx` | ✅ Working — greeting + composer + suggestions |
| Active chat | `/` (with activeChat) | `ChatPanel.tsx` + `ChatWorkspace.tsx` | ✅ Working — messages, streaming, model selection |
| Cowork mode | `/cowork` | `CoworkPage.tsx` | ⚠️ Placeholder — simulated task lifecycle |
| Code mode | `/preview` | `LivePreview.tsx` | ✅ Working — project selector, preview iframe, logs |
| Vibe Coding | `/vibe` | `VibeCoding.tsx` | ✅ Working — onboarding cards, guided builder, help |
| Settings | `/settings` | `SettingsLayout.tsx` | ✅ Working — 12 categories, 10+ detail pages |
| Providers | `/settings/providers` | `ProvidersPage.tsx` | ✅ Working — 10 adapters, test center |
| System Prompts | `/settings/prompts` | `PromptsPage.tsx` | ✅ Working — CRUD, archive, hierarchy |
| Prompt Library | `/prompts` | `PromptLibrary.tsx` | ✅ Working — search, tags, favorites |
| Projects | `/projects` | `ProjectsPage.tsx` | ✅ Working — file tree, instructions |
| Tools & MCP | `/tools` | `ToolsPage.tsx` | ⚠️ Registry exists, execution not wired |
| GitHub Imports | `/settings/github` | `GitHubImportsPage.tsx` | ✅ Working — clone, parse, approve |
| Appearance | `/settings/appearance` | `AppearancePage.tsx` | ✅ Working — theme preview (no dark mode toggle) |
| Capabilities | `/settings/capabilities` | `CapabilitiesPage.tsx` | ✅ Working — browser/computer use toggles |
| Logs / Developer | `/settings/logs`, `/settings/developer` | `LogsPage.tsx`, `DeveloperSettingsPage.tsx` | ✅ Working — log viewer, debug export |

## 3. Current Biggest UI Problems (Confirmed from Source)

### Critical
1. **Sidebar still too visually dominant** — despite narrowing to 260px in v0.9.28, the sidebar consumes significant horizontal space. The `bg-[var(--ivory-surface)]` (#F3EFE6) is darker than the main content `bg-[var(--ivory-bg)]` (#FAF7F2), creating a strong visual divide.

2. **Typography inconsistency** — The codebase mixes `text-[10px]`, `text-[11px]`, `text-[12px]`, `text-[13px]`, `text-xs`, `text-sm` arbitrarily across components. Labels in settings go down to 10px which is below readability thresholds on standard DPI screens.

3. **Provider page still has inline raw inputs** — The API key field in `ProvidersPage.tsx` uses a raw `<input>` element instead of the shared `<Input>` component, creating inconsistency with the rest of the app.

4. **CoworkPage still uses simulated data** — The task lifecycle (`Draft` → `Ready` → `Running` → `Waiting for approval` → `Completed`) is entirely simulated with `setTimeout`. No real backend.

### Moderate
5. **Vibe Coding not prominent enough** — The `/vibe` page exists but the entry point is a single button in the sidebar "Projects/Tools/Vibe Coding" grid and a CTA banner in chat home. It should be a first-class feature more prominently featured.

6. **Orange/Terracotta accent still strong** — `--ivory-accent: #C75B39` is used for all primary buttons, toggles (checked state), and brand marks. While on-brand, it appears on nearly every interactive element.

7. **Two Toggle components merged but re-export remains** — `SettingsComponents.tsx` re-exports Toggle from shared instead of callers importing directly. 4 callers still import from SettingsComponents.

### Minor
8. **Brand assets duplicated** — `assets/brand/` has SVGs (programmatic) + Nano Banana PNGs. `public/brand/` has copies for renderer access. `assets/brand/nano-banana/` has originals. Three locations for essentially the same mark.

9. **Inline Aureon SVG still exists in code** — Despite the `AureonMark` component, the SVG path data is rendered inline in the component. If the brand mark changes, the SVG paths must be updated in code rather than swapping an image file.

10. **ChatWorkspace has 500+ lines** — The home page + active chat logic is in one monolithic component. Should be split into `ChatHome.tsx` and `ChatActive.tsx`.

## 4. Duplicate/Dead-Code Suspects

| Suspect | Detail |
|---------|--------|
| **StatusPill vs Badge** | `SettingsComponents.tsx` StatusPill and `shared/Badge.tsx` serve nearly identical purposes (colored pill with label). Different APIs, same function. |
| **Toggle re-export** | SettingsComponents re-exports Toggle from shared. 4 callers import from settings, 3 from shared directly. |
| **Duplicate brand assets** | Same mark/logo in 3 locations: `assets/brand/`, `public/brand/`, `assets/brand/nano-banana/` |
| **SettingsPlaceholderPage** | Used for `/settings/extensions` and `/settings/security` — both are empty placeholder pages with no functionality. |
| **CoworkPage permissions vs CapabilitiesPage** | Both pages have browser/computer use toggles with independent state — no shared logic. |
| **chat-completion.service.ts** | 8 provider adapters defined but only tested live for OpenRouter. Dead adapter code paths for unused providers may exist. |

## 5. Asset Size Issues

| File | Size | Concern |
|------|------|---------|
| `aureon-logo.png` (Nano Banana) | ~4.8 MB | Way too large for renderer use. Should be optimized to <200KB. |
| `aureon-app-icon.png` | Included in build | Used for icon.ico generation only, fine. |
| `aureon-github-banner.png` | In README | GitHub-hosted, size less critical. |
| `aureon-dark-logo-presentation.png` | ~4.8 MB | Not currently used anywhere — dead weight. |
| `aureon-mark-monochrome.png` | TBD | Used by AureonMark PNG variant. Should be optimized. |

## 6. Provider Layout Issues (from source inspection)

- **API key input** uses raw `<input>` with inline styling instead of shared `<Input>` component (lines 403-411 in ProvidersPage.tsx)
- **Save Key button** is inline beside input — good layout, but the input has no label association for accessibility
- **Test button** uses `variant="ghost"` which makes it visually weak compared to the primary actions
- **Model rows** show only display_name (line 440-453) — model ID was intentionally removed in v0.9.28 but this hides useful technical info
- **Toggle components** in model rows are imported from `shared/Toggle` (3 callers) while provider enable toggle comes from `shared/Toggle` via props — mixing import paths

## 7. Typography Issues (from source)

| Issue | Location | Detail |
|-------|----------|--------|
| `text-[10px]` labels | SettingsLayout.tsx, Sidebar.tsx, multiple settings pages | Below 11px readability threshold |
| Mixed scale | Throughout | `text-[10px]`, `text-[11px]`, `text-[12px]`, `text-[13px]`, `text-xs` (12px), `text-sm` (13px) used arbitrarily |
| Serif on headings | Multiple files | `display-text` class (Crimson Text) applied to h1, h2, h3 in settings but headings.css uses `font-body` |
| Too much muted text | Settings pages | `text-[var(--ivory-text-3)]` (#8E8371) is very low contrast on ivory background |

## 8. Sidebar/Header Issues (from source)

- **Sidebar brand**: 34px AureonMark (SVG) — adequate after v0.9.28 but could be larger for premium feel
- **Collapsed topbar brand**: 22px AureonMark — adequate
- **Mode switch pills**: 76px min-width, 8px height — functional but could be more polished
- **Window controls**: Custom min/max/close buttons — well-implemented
- **Search button**: Hidden on mobile (`hidden md:inline-flex`) — fine for desktop

## 9. Vibe Coding Improvement Opportunities

- **No "Build something" quick action on chat home** — The main suggestion chips are generic ("Plan a feature", "Review code"). Add a prominent "Build an app →" CTA.
- **Guided builder produces prompt but doesn't pre-fill project type** — After completing the 3-step builder, it inserts a text prompt. It could also navigate to Code mode with the project type pre-selected.
- **No template saving** — The user asked for "editable templates" but the vibe-templates.ts data is static. Integration with the prompt library would make templates user-editable.
- **BeginnerHelp uses `<details>` elements** — Native HTML disclosure widgets look unpolished. Should use a custom accordion component.
- **Code mode has a Vibe Coding CTA but it's below the fold** — The button appears after the EmptyState, which requires scrolling to see.

## 10. Next Implementation Order

### Priority 1 — Visual De-Webification
1. Reduce sidebar visual weight (lighter background, less contrast with content)
2. Normalize typography scale (remove all `text-[10px]`, minimum 11px)
3. Replace raw `<input>` in ProvidersPage with shared `<Input>` component
4. Reduce brand asset size (optimize 4.8MB logo PNGs)
5. Replace BeginnerHelp `<details>` with custom styled accordion
6. Fix StatusPill/Badge duplication

### Priority 2 — Feature Polish
7. Make Vibe Coding a first-class tab/entry point
8. Wire CoworkPage to real task execution (or remove simulation)
9. Add dark mode toggle
10. Split ChatWorkspace into ChatHome + ChatActive

### Priority 3 — Quality
11. Remove SettingsComponents Toggle re-export
12. Deduplicate brand assets
13. Run full E2E suite and fix failures
14. Optimize large brand images
