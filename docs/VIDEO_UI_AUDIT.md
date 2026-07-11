# Vibeforge Video UI Audit

> Created: 2026-07-11
> Scope: polish visible UX regressions from the recorded click-through without adding product features.

## Findings and Fix Plan

| ID | Observed issue | Impacted files | Severity | Fix plan |
|----|----------------|----------------|----------|----------|
| VUI-01 | Code Mode header is too large and text-heavy. | `src/renderer/src/pages/LivePreview.tsx` | High | Reduce header height, shorten title copy, move details into compact status only. |
| VUI-02 | LivePreview page is overcrowded. | `src/renderer/src/pages/LivePreview.tsx`, `src/renderer/src/components/chat/BuildPipelinePanel.tsx` | Critical | Narrow the left rail, collapse explorer/logs by default, reduce diagnostics, and make pipeline tabs denser. |
| VUI-03 | Demo buttons appear in normal user UI. | `src/renderer/src/pages/LivePreview.tsx` | Critical | Remove demo CTA from idle state and move "Run Coding Demo App" into a collapsed Developer tools section. |
| VUI-04 | Preview inherits too much of the ivory app shell. | `src/renderer/src/pages/LivePreview.tsx` | High | Render iframe inside a neutral browser canvas with compact chrome and white content area. |
| VUI-05 | Raw generated code can show as escaped JSON/text stream. | `src/renderer/src/components/chat/BuildPipelinePanel.tsx` | High | Hide structured JSON-like stream chunks from the visible Code tab and guide users to generated files/diffs. |
| VUI-06 | Settings modals/forms can feel clipped or shifted. | `src/renderer/src/components/shared/Modal.tsx`, `src/renderer/src/layouts/SettingsLayout.tsx`, `src/renderer/src/pages/settings/ProvidersPage.tsx` | High | Add safer viewport sizing, reduce settings padding/header bulk, and make provider cards/forms less wide-action heavy. |
| VUI-07 | Orange buttons are visually dominant and sometimes compete. | `src/renderer/src/components/shared/Button.tsx`, Studio/Preview/Skills action buttons | Medium | Soften primary button color, use neutral secondary styles, and avoid multiple orange actions per view. |
| VUI-08 | Multiple similar actions confuse the user. | `src/renderer/src/layouts/Sidebar.tsx`, `src/renderer/src/pages/Studio.tsx`, `src/renderer/src/pages/LivePreview.tsx`, `src/renderer/src/pages/SkillsPage.tsx` | High | Keep one primary action per surface, remove duplicate Preview/Code sidebar entries, and simplify Skills card actions. |
| VUI-09 | Some drawers/dropdowns/modals do not close cleanly. | `src/renderer/src/components/shared/Drawer.tsx`, `src/renderer/src/pages/LivePreview.tsx`, `src/renderer/src/pages/ChatWorkspace.tsx` | Medium | Improve overlay behavior, ESC handling, and use viewport-safe overflow containers. |
| VUI-10 | App feels like a technical dashboard instead of guided builder. | `src/renderer/src/pages/Studio.tsx`, `src/renderer/src/pages/ChatWorkspace.tsx`, `src/renderer/src/layouts/Sidebar.tsx` | High | Reduce explanatory blocks, shorten headings, keep advanced/dev controls hidden, and use calmer empty states. |

## Gate Checklist

| Gate | Status |
|------|--------|
| Chat less crowded | Fixed — long home guidance removed; prompt surface remains primary |
| Build/Studio has one visible primary action | Fixed — normal hero composer shows only Build with Preview |
| Code/Preview header smaller | Fixed — Code header shortened and copy reduced |
| LivePreview renders in browser-like canvas | Fixed — preview surface uses neutral browser-style canvas |
| Demo controls hidden by default | Fixed — demo execution moved into collapsed Developer tools |
| Code/Diff tabs remain available | Fixed — pipeline tabs preserved; headed workspace QA passes |
| Providers settings remain usable | Fixed — compact Provider Test Center restored; provider modal inspected at 1366x768 |
| Skills/Agents organized with fewer actions | Fixed — cards now use one primary action plus Copy |
| Modals/dropdowns close cleanly | Fixed — modal viewport sizing improved; provider modal opens/closes in screenshot sweep |
| Direct validation commands pass | Fixed — native, node/web typecheck, 845 unit tests, and Electron build pass |

## Validation Evidence

- `node scripts/verify-native.js` — PASS
- `.\node_modules\.bin\tsc.cmd --noEmit -p tsconfig.node.json` — PASS
- `.\node_modules\.bin\tsc.cmd --noEmit -p tsconfig.web.json` — PASS
- `.\node_modules\.bin\vitest.cmd run` — PASS (845 tests, 33 files)
- `.\node_modules\.bin\electron-vite.cmd build` — PASS
- `.\node_modules\.bin\electron-vite.cmd dev` — PASS (dev server on port 5173, Electron main window created)
- `.\node_modules\.bin\playwright.cmd test tests/e2e/12-vibeforge-workspace-ui.spec.ts --headed --workers=1 --timeout=180000` — PASS (5/5)
- Screenshot sweep: `test-results/video-ui-polish/`
