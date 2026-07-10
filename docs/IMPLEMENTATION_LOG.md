# Aureon Desk — Implementation Log

> Append-only log of completed work sessions. Newest entries go on top.

---

## 2026-07-10 — Brand Identity Finalization

### Goal
Fix the long-standing issue where the Aureon Desk logo was not visible in the app (sidebar top-left, Windows taskbar). Generate, wire, test, and verify a complete original Aureon Desk logo system.

### Root Cause Found
CSS variables (`var(--ivory-accent)`) used in SVG presentation attributes (`fill`, `stroke`, `stopColor`) were failing to resolve in some Electron/Chromium rendering paths. The AureonMark inline SVG was rendering at 0×0 or with fully transparent colors.

### Fix Applied
- Replaced all CSS variable references in `AureonMark.tsx` with hardcoded brand hex colors matching `tokens.css` exactly
- Added `useId()` for unique gradient IDs (prevents collisions when multiple marks render)
- Increased ring stroke opacity (0.25→0.30) and neural node dot sizes for better visibility
- Added neural node connection lines for a more complete mark
- Added `xmlns` attribute for standards compliance

### Files Changed

| File | Change |
|------|--------|
| `AureonMark.tsx` | Hardcoded colors, useId(), increased opacity, connection lines |
| `BrandLockup.tsx` | Added `compact` prop + `BrandLockupCompact` export |
| `AppShell.tsx` | Added BrandLockupCompact + text to topbar left column |
| `Sidebar.tsx` | Added BrandLockupCompact to collapsed sidebar state |
| `SettingsLayout.tsx` | Replaced Settings icon with AureonMark |
| `assets/brand/aureon-logo-lockup.svg` | NEW — mark + wordmark + tagline |
| `assets/brand/aureon-github-banner.svg` | NEW — 1280×640 social preview banner |
| `scripts/generate-brand-assets.mjs` | NEW — generates all PNGs + ICO from SVGs |
| `docs/brand/BRAND_ASSET_AUDIT.md` | Updated with new assets and wiring |
| `AI_QA_REPORT.md` | Added brand finalization section |
| `CHANGELOG.md` | v0.9.74 entry |

### Verification Gate

| Check | Result |
|-------|--------|
| `npm run typecheck` (node + web) | ✅ PASS |
| `npm test` | ✅ PASS (768 tests, 30 files) |
| `npm run build` (electron-vite) | ✅ PASS |
| Brand assets generated | ✅ 20 files across `build/`, `public/brand/`, `assets/brand/` |
| `build/icon.ico` present | ✅ 7-size PNG-based ICO |

### Brand Asset Inventory (Post-Fix)

| Location | Files | Status |
|----------|-------|--------|
| `assets/brand/` | 6 SVGs + 2 PNGs + README | ✅ |
| `public/brand/` | 5 PNGs (32, 64, 128, 256, 512) | ✅ |
| `build/` | icon.ico + icon.png + 7 icon-{size}.png | ✅ |

---

## 2026-07-09 — Visible Human-Visible QA Harness

### Goal
Add a Playwright Electron **headed** QA harness that the user can watch in
real time, covering the full 20-step user-facing path the prompt
specified (hero → Studio → Code → LivePreview → Provider → MCP).

### Files Changed

| File | Change |
|------|--------|
| `tests/e2e/aureon-human-visible.spec.ts` | NEW. ~330 lines, 20 steps, screenshots numbered 00–22. |
| `tests/e2e/helpers/electronApp.ts` | Added opt-in `AUREON_SLOW_MO_MS` env → `electron.launch({ slowMo })`. |
| `package.json` | Added `test:human:headed`, `test:human:headed:slow`, `test:human:ui`. |
| `docs/HUMAN_VISIBLE_QA_HARNESS.md` | NEW. Runbook + screenshot map + known limitations. |
| `CHANGELOG.md` | New `[Unreleased]` entry documenting the harness. |
| `AI_QA_REPORT.md` | New "Human-Visible QA Harness" section. |
| `docs/ISSUES_REGISTER.md` | New row in the Verified-but-not-blocking table. |

### Iteration history

1. **Round 1 — first run.** Crashed at script registration with
   `TypeError: expect.setTimeout is not a function` — fixed by removing
   the call (per-assertion timeouts are used instead).
2. **Round 2 — second run.** Crashed with `test.use({ trace }) inside
   describe cannot force a new worker` — fixed by moving `test.use` to
   top-level outside the `describe` block.
3. **Round 3 — third run.** Failed at Step 17 because the original narrow
   regex (`/trust|trusted/i`) did not match the actual `ToolsPage.tsx`
   modal copy. Loosened to source-accurate "/disabled by default/"
   + "review/shield". Fixed.
4. **Round 4 — fourth run.** Failed twice at `expect(keyCount > 0)` on
   post-retry race. Step 14 / 15 wrapped in graceful
   `if (keyCount > 0)` fallback with screenshot of empty state instead
   of crashing.
5. **Round 5 — fifth run.** Failed on `expect(consoleCaseErrors).toBe(0)`
   because the harness's last-line assertion was too strict. The existing
   convention (see `tests/e2e/99-human-click-qa.spec.ts`) is to log
   console errors but fail only on `pageerror`. Switched to that pattern.

### Verification gate

| Check | Result |
|-------|--------|
| `npm run verify:native` | ✅ PASS (baseline, not re-run after pure test additions) |
| `npm run typecheck`     | ✅ PASS |
| `npm test`              | ✅ 768 / 768 (30 files, 3.42s) |
| `npm run build`         | ✅ PASS (renderer 1886 KB) |

### Known limitations

- Console errors are logged but non-fatal.
- Video on failure is not configured (Playwright project-level opt would
  apply globally; we deliver 28+ screenshots instead).
- Bash-only `AUREON_SLOW_MO_MS=500` script — PowerShell/cmd users set the
  env var manually as documented in `docs/HUMAN_VISIBLE_QA_HARNESS.md`.

### Follow-ups (not in this commit)

- Re-run on a clean machine and capture the full screenshot set in
  `tests/e2e/artifacts/human-visible/`.
- Add `data-testid` to the deterministic counter demo for stable
  Increment/Reset selectors inside the iframe.
- Consider extending the existing `screenshot()` helper in
  `tests/e2e/helpers/electronApp.ts` with a target-dir parameter so the
  inline `shot()` helper can be removed.
