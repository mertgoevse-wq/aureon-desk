# Vibeforge — VS Code Agent Prompts

> Copy-paste these prompts into the Vibeforge composer or your VS Code AI assistant to trigger common agent workflows.
> Each prompt is self-contained and deterministic.

---

## 1. Load Project & Review

```
VIBEFORGE — LOAD PROJECT AND REVIEW

Project path:
C:\Users\mertg\Desktop\code

First run:
git status
git branch -a -vv
git log --oneline -8

Then read:
package.json, README.md, CHANGELOG.md, AI_QA_REPORT.md
docs/ISSUES_REGISTER.md, docs/IMPLEMENTATION_LOG.md

Then run:
npm run verify:native
npm run typecheck
npm test
npm run build

Create/update:
docs/VS_CODE_AGENT_HANDOFF.md

Include:
- current branch and latest commits
- uncommitted files
- test results
- build status
- critical issues found
```

---

## 2. Fix Critical Issues

```
VIBEFORGE — FIX CRITICAL ISSUES BEFORE FEATURES

Project path:
C:\Users\mertg\Desktop\code

Read:
docs/ISSUES_REGISTER.md
AI_QA_REPORT.md
CHANGELOG.md

Run:
npm run verify:native
npm run typecheck
npm test
npm run build

If a critical issue exists, fix it first.
Do not implement new features until critical issues are resolved.

Update:
docs/ISSUES_REGISTER.md
AI_QA_REPORT.md
CHANGELOG.md
docs/IMPLEMENTATION_LOG.md

Commit after tests pass:
git add .
git commit -m "fix: <description>"
git push origin main
```

---

## 3. Run Tests

```
VIBEFORGE — RUN FULL TEST SUITE

Project path:
C:\Users\mertg\Desktop\code

Run in order:
1. node scripts/verify-native.js
2. node_modules/.bin/tsc --noEmit -p tsconfig.node.json
3. node_modules/.bin/tsc --noEmit -p tsconfig.web.json
4. node_modules/.bin/vitest run
5. node_modules/.bin/electron-vite build
6. node scripts/demo-coding.mjs

Report:
- tests passed / failed
- typecheck errors (if any)
- build warnings (if any)
- demo checks passed

Update AI_QA_REPORT.md with results.
```

---

## 4. Fix LivePreview

```
VIBEFORGE — FIX LIVEPREVIEW RELIABILITY

Project path:
C:\Users\mertg\Desktop\code

Read:
docs/LIVEPREVIEW_RELIABILITY_REPORT.md
src/main/services/live-preview.service.ts
src/renderer/src/pages/LivePreview.tsx
src/main/ipc/live-preview.ipc.ts

Deterministic test prompt:
"Build a tiny counter app with ivory theme, increment button, reset button, and live preview."

Pass criteria:
- Build starts
- Generated file list visible
- Code tab visible
- Preview tab opens automatically
- iframe renders actual app (not blank)
- Counter buttons visible
- Restart preview works
- Stop preview works
- Diagnostics panel shows URL and status

Fix any issues found. Run:
npm run typecheck
npm test
node scripts/demo-coding.mjs

Commit: git commit -m "fix: stabilize LivePreview rendering"
```

---

## 5. Simplify UI

```
VIBEFORGE — SIMPLIFY UI (CODEX STYLE)

Project path:
C:\Users\mertg\Desktop\code

Goal:
Make Vibeforge feel like a clean Codex-style coding workspace.
Simple, focused, sorted, beginner-friendly.

Design rules:
- Calm ivory palette: #FAF7F2 bg, #F3EFE6 sidebar, #C75B39 accent
- No neon, no glassmorphism, no cyberpunk
- Serif for logo/display only (Crimson Text)
- Sans-serif for all UI (Inter)
- One primary action at a time
- No dead buttons, no duplicate controls

For each screen, identify and fix:
- Duplicate controls
- Dead buttons
- Confusing labels
- Controls that should be in Advanced

Run typecheck and tests after each screen.
Commit when all screens are cleaned.
```

---

## 6. Build Beta

```
VIBEFORGE — BUILD BETA INSTALLER

Project path:
C:\Users\mertg\Desktop\code

Before building:
npm run verify:native
npm run typecheck
npm test

Then build installer:
node_modules/.bin/electron-builder --win --x64

Expected outputs in dist/:
- Vibeforge-Setup-x.x.x-x64.exe
- Vibeforge-Portable-x.x.x-x64.exe

After build:
- Confirm file sizes are reasonable (>50 MB)
- Confirm no secrets in dist/
- Update CHANGELOG.md with release notes
- Commit: git commit -m "chore: build beta vX.X.X"
```

---

## 7. Capture Screenshots

```
VIBEFORGE — CAPTURE HUMAN QA SCREENSHOTS

Project path:
C:\Users\mertg\Desktop\code

Run the human-visible Playwright suite:
node node_modules/@playwright/test/cli.js test tests/e2e/vibeforge-human-visible.spec.ts --headed --workers=1 --timeout=300000

Screenshots will be saved to:
tests/e2e/artifacts/

After run:
- Review screenshots for blank screens, broken layouts, overlapping elements
- Note any screen that fails the visual check
- Update AI_QA_REPORT.md with screenshot results
- Commit screenshots:
  git add tests/e2e/artifacts/
  git commit -m "test: human QA screenshots"
```
