# Vibeforge — Human QA Report

> Generated: 2026-07-08
> Tester: Manual QA agent
> Reference: `docs/HUMAN_QA_CHECKLIST.md` (127 checks)

## Session Info

- **Date**: 2026-07-08
- **Branch**: main
- **Commit**: a542c3f
- **Test run**: typecheck ✅, 409 tests ✅, build ✅
- **Screenshots**: `docs/qa-screenshots/human-qa/`

## Automated Pre-checks

| Check | Result |
|-------|--------|
| `npm run verify:native` | ✅ PASS |
| `npm run typecheck` | ✅ PASS (zero errors) |
| `npm test` | ✅ PASS (409 tests, 21 files) |
| `npm run build` | ✅ PASS |
| Secret scan (`sk-or-v1`) | ✅ CLEAN |

---

## Section Results

### 1. Launch & Window Controls (0/7 checked)

| # | Check | Result |
|---|-------|--------|
| 1.1 | App launches without crash | |
| 1.2 | Window title "Vibeforge" | |
| 1.3 | Native window controls | |
| 1.4 | Taskbar icon | |
| 1.5 | Window resize | |
| 1.6 | 1366×768 layout | |
| 1.7 | 1920×1080 layout | |

### 2. Logo & Branding (0/5 checked)

| # | Check | Result |
|---|-------|--------|
| 2.1 | Sidebar logo renders | |
| 2.2 | No fake vendor logos | |
| 2.3 | Studio hero icon | |
| 2.4 | No broken images | |
| 2.5 | BrandLockup text | |

### 3. Sidebar (0/10 checked)

| # | Check | Result |
|---|-------|--------|
| 3.1 | New Chat button | |
| 3.2 | Chat list updates | |
| 3.3 | Chat click navigates | |
| 3.4 | Studio nav button | |
| 3.5 | All nav buttons | |
| 3.6 | Collapse/expand | |
| 3.7 | Sidebar resize | |
| 3.8 | Settings button | |
| 3.9 | No Workflow section | |
| 3.10 | No duplicate New button | |

### 4. Chat Home (0/7 checked)

| # | Check | Result |
|---|-------|--------|
| 4.1 | Greeting text | |
| 4.2 | Composer card | |
| 4.3 | Text input | |
| 4.4 | Send button | |
| 4.5 | Recent chats list | |
| 4.6 | No branding mark | |
| 4.7 | No suggestion box | |

### 5. Chat Active (0/10 checked)

| # | Check | Result |
|---|-------|--------|
| 5.1 | New chat creates | |
| 5.2 | Text generation | |
| 5.3 | Model selector | |
| 5.4 | Model matches display | |
| 5.5 | System prompt selector | |
| 5.6 | Slash commands | |
| 5.7 | Shift+Enter line break | |
| 5.8 | Enter sends | |
| 5.9 | Copy/paste | |
| 5.10 | No Cancel generation text | |

### 6. Create Studio (0/16 checked)

| # | Check | Result |
|---|-------|--------|
| 6.1 | Page loads | |
| 6.2 | 10 cards visible | |
| 6.3 | Card info correct | |
| 6.4 | Click shows details | |
| 6.5 | No inline Start button | |
| 6.6 | Autonomy 1-4 visible | |
| 6.7 | Autonomy selector | |
| 6.8 | Safety notice | |
| 6.9-6.16 | Individual card routing | |

### 7. Vibe Coding (0/7 checked)

| # | Check | Result |
|---|-------|--------|
| 7.1-7.7 | Vibe Coding page checks | |

### 8. Code Mode (0/8 checked)

| # | Check | Result |
|---|-------|--------|
| 8.1-8.8 | LivePreview checks | |

### 9-15. Remaining Sections (0/X checked)

See `docs/HUMAN_QA_CHECKLIST.md` for the full 127-check list.

---

## Bugs Found

| # | Severity | Description | Screenshot |
|---|----------|-------------|------------|
| 1 | | | |

## UX Issues (non-blocking)

| # | Issue | Suggested Fix |
|---|-------|---------------|
| 1 | | |

## Result Quality Issues

| # | Category | Issue | Notes |
|---|----------|-------|-------|
| 1 | | | |

## Summary

| Category | Total | Passed | Failed | Skipped |
|----------|-------|--------|--------|---------|
| Automated checks | 5 | 5 | 0 | 0 |
| Manual checks | 127 | 0 | 0 | 127 |
| **TOTAL** | **132** | **5** | **0** | **127** |

## Next Steps

1. Complete manual QA pass with visible app (`npm run dev`)
2. Record findings in all section tables above
3. Capture screenshots for any issues
4. Fix critical bugs
5. Re-verify after fixes
6. Run full E2E suite (`npm run test:e2e`)
