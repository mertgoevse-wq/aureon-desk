# Aureon Desk UX Decisions

Last updated: 2026-07-08

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

## Remaining UX Direction

Next major UX work should be a bounded implementation of:
- Top-level `Chat / Cowork / Code` segmented mode switch.
- Claude/Codex-inspired but original home screen with large composer, model/profile/project controls, and suggestion chips.
- Three-column settings layout: app sidebar, settings category column, detail panel.
- Quieter right inspector with collapsible sections for intent, agent, risk, skills, tools, and keywords.
