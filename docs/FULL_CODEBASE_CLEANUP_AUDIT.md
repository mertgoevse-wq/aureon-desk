# Aureon Desk — Full Codebase Cleanup Audit

> Generated: 2026-07-10 | Branch: `main` | Commit: pre-cleanup `95b7c00`

## Summary

The codebase is **clean, well-organized, and free of major structural issues**. No duplicate components, zero circular dependencies, and no TODO/FIXME comments in source code. The cleanup focused on code quality improvements: extracting duplicated logic, splitting oversized components, and creating comprehensive documentation.

---

## 1. Directory Structure

| Directory | Files | Status |
|-----------|-------|--------|
| `src/main/services/` | 30 service files | ✅ Clean, well-named |
| `src/main/ipc/` | 18 IPC handlers + index.ts | ✅ Clean |
| `src/main/db/` | schema.ts + migrations | ✅ Clean |
| `src/main/security/` | vault.ts | ✅ Clean |
| `src/main/utils/` | logger.ts | ✅ Clean |
| `src/preload/` | index.ts + index.d.ts | ✅ Clean |
| `src/shared/` | 17 files + types/ + data/ | ✅ Clean |
| `src/shared/types/` | 11 type files | ✅ Clean |
| `src/shared/data/` | voltagent-skills.generated.* | ✅ 919KB generated file |
| `src/renderer/src/pages/` | 10 main pages + settings/ | ✅ Clean |
| `src/renderer/src/pages/settings/` | 12 settings pages | ✅ Clean |
| `src/renderer/src/components/shared/` | 18 components | ✅ Clean, no duplicates |
| `src/renderer/src/components/chat/` | 5 components (was 4) | ✅ +BuildPipelinePanel |
| `src/renderer/src/components/artifacts/` | 14 components + barrel | ✅ Clean |
| `src/renderer/src/layouts/` | AppShell, Sidebar, SettingsLayout, RightInspector | ✅ Clean |
| `src/renderer/src/stores/` | 9 Zustand stores | ✅ Clean |
| `tests/unit/` | 33 test files | ✅ 845 tests |
| `tests/e2e/` | 22 spec files | ✅ Clean |
| `scripts/` | 10 scripts | ✅ Clean |
| `docs/` | 45 docs | ✅ Some duplicates (archive/, qa/) |
| `assets/` | brand assets | ✅ Clean |
| `build/` | icon files | ✅ Generated |
| `public/` | brand PNGs | ✅ Generated |

---

## 2. Changes Made

### 2.1 — DRY: Extracted style replacement helper (live-preview.service.ts)

**Before:** ~30 lines of color replacement code duplicated twice — once in `createSandbox()` and once in `startGeneratedPreview()`. Each handled "Soft Teal" and "Deep Slate" themes with identical `.replace()` chains.

**After:** Single `applyStyleToHtml()` helper function used by both call sites. Reduced ~60 lines of duplicated code to ~25 lines.

```typescript
function applyStyleToHtml(html: string, style: string): string {
  if (style === 'Soft Teal') { /* 5 color replacements */ }
  if (style === 'Deep Slate') { /* 10 color replacements */ }
  return html
}
```

### 2.2 — Component Extraction: BuildPipelinePanel from LivePreview

**Before:** LivePreview.tsx was ~850 lines with a massive inline 6-tab pipeline panel (Code, Files, Diff, Plan, Preview, Cards tabs + follow-up suggestions). 15+ Lucide icons imported only for the pipeline section.

**After:**
- **BuildPipelinePanel.tsx** (NEW) — ~260 lines, standalone component with clear props interface
- **LivePreview.tsx** — reduced to ~600 lines, cleaner imports (removed 15 unused Lucide icons)
- Separate sub-components for each tab: `CodeTab`, `FilesTab`, `DiffTab`, `PlanTab`, `CardsTab`
- All `data-testid` attributes preserved for E2E tests

### 2.3 — Import Cleanup (LivePreview.tsx)

**Removed imports:**
- 15 unused Lucide icons (EyeOff, Plus, SlidersHorizontal, Loader2, FileCode, FilePlus, FilePen, FileMinus, FileSymlink, FolderPlus, GitCompare, ListChecks, Layers3, Lightbulb, X)
- Duplicate `Sparkles` import
- `ModelSelector` (moved to BuildPipelinePanel)
- `ArtifactCard`, `ArtifactActionHandlers`, `codeArtifactFromFileOp`, `buildPlanArtifact`, `diffArtifactFromDiff` (moved to BuildPipelinePanel)
- Local `ArtifactTab` type (imported from BuildPipelinePanel)
- `useMemo` (replaced with plain object for pipelinePanelProps)

### 2.4 — Performance: Removed unnecessary useMemo

The `pipelinePanelProps` object was wrapped in `useMemo` with 14 dependencies but missing `handleCancelPipeline` and `handleFollowUp` — creating a stale-closure risk. Replaced with a plain object since the component has an internal `if (!show) return <></>` guard.

---

## 3. Audit Results

### 3.1 — No Duplicate Components
All 18 shared components (Button, Card, Modal, Drawer, Toggle, Input, Select, Badge, etc.) are unique with zero duplicates. No competing implementations found.

### 3.2 — No TODO/FIXME/HACK in Source
Only occurrence is in `self-audit.service.ts` which programmatically checks for TODOs. Zero actual TODO/FIXME/HACK comments in production source code.

### 3.3 — Zero Circular Dependencies
Confirmed by `madge` analysis: 0 circular dependencies across 137+ source files.

### 3.4 — Placeholder Inventory (All Known/Intentional)
| Location | Type | Status |
|----------|------|--------|
| `social-connectors.ts` | Social API placeholders | Planned |
| `connector-presets.ts` | OAuth placeholders | Planned |
| `curated-skills.ts` | Spreadsheets & PDFs | Placeholder |
| `CoworkPage.tsx` | Simulated task execution | Placeholder |
| `LivePreview.tsx` | `mockFiles` array | Demo-only |

### 3.5 — Generated Files (No Issue)
| File | Size | Note |
|------|------|------|
| `voltagent-awesome-skills.generated.ts` | ~919KB | 1,179 skills — pre-sliced to 500 in UI |

### 3.6 — Large Files (Monitoring Only)
| File | Lines | Action |
|------|-------|--------|
| `LivePreview.tsx` | ~850 → ~600 | ✅ Extracted pipeline panel |
| `BuildPipelinePanel.tsx` | ~260 | ✅ New file, well-structured |
| `live-preview.service.ts` | ~710 | No change (server logic is inherently complex) |
| `SkillsPage.tsx` | ~500 | Already has 500-item limit |

### 3.7 — Docs Organization
| Directory | Files | Status |
|-----------|-------|--------|
| `docs/` root | 25 files | Primary docs |
| `docs/brand/` | 3 files + README | Brand assets |
| `docs/qa/` | 5 files + README | QA reports |
| `docs/archive/` | 6 files + README | Historical docs |

---

## 4. What Was NOT Changed (Safe Decisions)

- **Test files** — All 845 tests pass unchanged
- **E2E selectors** — All `data-testid` attributes preserved
- **LivePreview service core logic** — Server, sandbox, and preview logic untouched
- **Build pipeline** — No behavioral changes
- **Layouts** — AppShell, Sidebar, SettingsLayout unchanged
- **Stores** — All 9 Zustand stores untouched
- **Generated files** — voltagent-skills.generated.* unchanged
- **Docs/archive** — No historical docs removed

---

## 5. Verification

| Check | Result |
|-------|--------|
| `npm run typecheck` (node + web) | ✅ PASS |
| `npm test` (845 tests, 33 files) | ✅ PASS |
| `npm run build` (electron-vite) | ✅ PASS |
| `npm run demo:coding` | Not run (env constraints) |
| Code review | ✅ 2 rounds, all issues fixed |

---

## 6. Follow-up Recommendations

1. **Wrap `handleCancelPipeline` + `handleFollowUp` in `useCallback`** — Both capture stable `api` ref; wrapping would reduce BuildPipelinePanel re-renders
2. **Extract `mockFiles` to shared constant** — Currently hardcoded in LivePreview.tsx
3. **Consider virtualizing SkillsPage** — 500-item render is fast but 1,179 entries in memory
4. **Archive duplicate QA docs** — `docs/qa/` has 5 files; some overlap with root docs
5. **Reduce `docs/archive/` size** — 6 historical documents; consider external archival
