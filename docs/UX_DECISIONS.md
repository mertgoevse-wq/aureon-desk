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

## Remaining UX Direction

Next major UX work should be a bounded refinement of:
- Visual density after real-world use at 1366x768.
- Right inspector simplification with collapsible intent, risk, tools, and keywords.
- Cowork task queue implementation once the placeholder workflow has real backing behavior.
