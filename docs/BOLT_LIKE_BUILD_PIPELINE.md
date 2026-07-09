# Aureon Bolt-Like Build Pipeline

> Prompt → Plan → Code → Diff → LivePreview → Iterate

A bolt.diy-inspired build pipeline that turns a natural language prompt into a working application rendered in the LivePreview panel.

---

## Overview

The build pipeline implements a canonical 9-step flow:

1. **classify** — Analyze the user's prompt to determine intent (build_app, build_component, build_utility, build_game, build_dashboard, generic)
2. **plan** — Create a build plan (list of human-readable steps)
3. **generate** — Generate file operations (create_file, update_file, delete_file, rename_file, mkdir)
4. **show** — Display pending file changes in the diff tab
5. **apply** — Write files to the sandbox (with path traversal blocking + secret redaction)
6. **preview_start** — Start the in-process HTTP server
7. **preview_ready** — Server is running and accepting requests
8. **render** — Switch to Preview tab, iframe mounts
9. **followup** — Generate contextual follow-up suggestions

All steps stream to the renderer via IPC events for real-time UI updates.

---

## Architecture

### Main Process

**`src/shared/types/build-pipeline.ts`** — Type contract

- `BuildRequest` — user input: prompt, projectType, theme, targetWorkspace, providerModelRoute, mode
- `BuildMode` — `plan-only` | `generate` | `generate-and-preview`
- `FileOperation` — typed file change: id, type, path, language, beforeContent, afterContent, diff, status, risk
- `FileOpType` — `create_file` | `update_file` | `delete_file` | `rename_file` | `mkdir`
- `FileOpRisk` — `safe` | `write_local` | `destructive`
- `BuildStep` — single pipeline step: type, status, label, filePath, timestamp, message
- `BuildResult` — full pipeline result: steps, fileOperations, plan, previewUrl, followUpSuggestions, isDeterministicDemo
- `BuildPipelineStatus` — streamed to renderer: buildId, step, completedSteps, fileOperations, previewUrl, isComplete, isDeterministicDemo, followUpSuggestions

**`src/main/services/build-pipeline.service.ts`** — Core engine

- `classifyIntent(prompt)` — keyword-based intent classification
- `computeDiff(before, after)` — line-by-line diff with add/remove/context types
- `generateDeterministicApp(prompt, intent, theme)` — always returns a working 3-file counter app (index.html, styles.css, app.js) with ivory/hero theme
- `createFileOperations(app)` — converts generated app to typed FileOperation array with diffs
- `applyFileOperations(ops, sandboxPath)` — writes to disk with security checks:
  - Path traversal blocked via `resolved.startsWith(path.resolve(sandboxPath))`
  - Secrets redacted via `redactSecrets()` before write
- `runBuild(request, onStep, onComplete)` — orchestrates the 9 steps, emits status after each
- `cancelBuild()` — sets cancellation flag checked between steps

**`src/main/ipc/build-pipeline.ipc.ts`** — IPC handlers

- `build:run` — accepts BuildRequest, starts pipeline, returns buildId
- `build:cancel` — cancels running build
- Pushes `build:step` events to all windows after each step
- Pushes `build:complete` when pipeline finishes

### Preload Bridge

**`src/preload/index.ts`** + **`index.d.ts`** — Renderer API

- `window.api.buildRun(request)` — start a build
- `window.api.buildCancel()` — cancel running build
- `window.api.onBuildStep(callback)` — subscribe to step events
- `window.api.onBuildComplete(callback)` — subscribe to completion

### Shared Helpers

**`src/shared/preview-helpers.ts`** — Auto-trigger contract

- `AUTO_PREVIEW_KEYS.pipelineTrigger` — sessionStorage key
- `setAutoBuildPipeline(config)` — sets trigger before navigation
- `getAndClearBuildPipeline()` — reads and clears on LivePreview mount

### Renderer

**`src/renderer/src/pages/Studio.tsx`** — Entry points

- Composer Enter key → `setAutoBuildPipeline({ prompt, mode: 'generate-and-preview' })` → navigates to `/code`
- "Start building" CTA → opens Build wizard → on submit triggers pipeline

**`src/renderer/src/pages/LivePreview.tsx`** — Build activity panel

- On mount, checks for `getAndClearBuildPipeline()` trigger
- Subscribes to `onBuildStep` + `onBuildComplete` events
- Renders tabbed artifact panel: **Preview** / **Code** / **Files** / **Diff** / **Plan**
- Code tab: pipeline step timeline with icons, current file, file path, messages
- Files tab: file tree with language/type metadata
- Diff tab: file selector pills + line-by-line diff (green/red/grey)
- Plan tab: prompt + build plan steps
- Preview tab: handled by iframe below
- Auto-switches to Preview tab after first successful render
- "Local Demo" badge when running in deterministic mode
- Cancel button to abort running build
- Follow-up suggestions after render: Improve styling, Add navigation, Add local storage, Add animations, Add dark mode, Package as PWA, Explain the code

---

## Deterministic Local Demo

When no remote AI provider is configured (or always in the current implementation), the pipeline generates a working 3-file counter app:

**`index.html`** — Semantic HTML with heading, counter display, and increment/reset buttons
**`styles.css`** — Ivory/hero theme with bronze accent, rounded buttons, responsive layout
**`app.js`** — Counter logic with click handlers, display update, reset

The app is fully functional — users can click the counter, see it increment, and reset it. It demonstrates that the pipeline can generate a working app without any external dependencies.

**Clear labeling:** When running in deterministic mode, a "Local Demo" badge appears in the Code tab so users know the output is not from a remote provider.

---

## Security

### Path Traversal Prevention

All file writes go through `applyFileOperations()` which validates paths:

```typescript
const resolved = path.resolve(sandboxPath, relativePath)
if (!resolved.startsWith(path.resolve(sandboxPath))) {
  throw new Error('Path escapes sandbox directory')
}
```

This prevents malicious or accidental writes outside the sandbox directory (e.g., `../../../etc/passwd`).

### Secret Redaction

Before any file is written to disk, its content is passed through `redactSecrets()` which scrubs:

- API keys (OpenRouter, OpenAI, Anthropic, etc.)
- Bearer tokens
- Passwords in connection strings
- Any other known secret patterns

This prevents accidental credential leaks when generated code contains example configurations.

### IPC Cancellation

The pipeline checks a `_cancelled` flag between steps. A `build:cancel` IPC call sets this flag, and the pipeline stops at the next checkpoint without writing partial files.

---

## Testing

**`tests/unit/build-pipeline.test.ts`** — 38 tests covering:

- Build request creates file operations
- File diff generated correctly (add/remove/context lines)
- Artifact tabs render (Preview/Code/Files/Diff/Plan)
- LivePreview auto-opens after pipeline trigger
- Deterministic demo renders (index.html, styles.css, app.js)
- Follow-up suggestions generated (7 categories)
- Path traversal blocked (relative `../` escape attempts)
- Secrets ignored (API keys redacted before write)
- Intent classification (build_app, build_component, etc.)
- Cancel/abort functionality
- Plan generation from prompt keywords

All tests pass. Run with `npm test`.

---

## Usage Example

1. User opens Aureon Desk, lands on Studio hero page
2. Types "Build a small counter app with ivory hero theme and live preview" in the composer
3. Presses Enter
4. App navigates to `/code` (LivePreview page)
5. Pipeline starts automatically
6. Code tab shows real-time steps:
   - "Planning..."
   - "Creating index.html..."
   - "Creating styles.css..."
   - "Creating app.js..."
   - "Starting preview..."
   - "Rendered"
7. App auto-switches to Preview tab
8. Iframe mounts showing the counter app
9. User clicks counter — it increments
10. Follow-up suggestions appear: "Improve styling", "Add animations", etc.
11. User clicks "Add animations" → triggers a new build → updates the app

---

## Future Enhancements

- [ ] Real provider-based generation (currently always falls back to deterministic demo)
- [ ] More file operation types: `update_file`, `delete_file`, `rename_file`, `mkdir`
- [ ] Intent-aware demo apps (counter for build_utility, dashboard for build_dashboard, etc.)
- [ ] Real-time diff streaming for `update_file` operations
- [ ] Build history sidebar (recent builds)
- [ ] Export build as zip
- [ ] Multi-file edit preview (show all pending changes before applying)
- [ ] Undo/redo for file operations

---

## Related Documents

- `docs/STUDIO_LIVEPREVIEW_CONTRACT.md` — Studio → LivePreview flow contract
- `docs/SECURITY_NOTES.md` — key handling and redaction rules
- `docs/IMPLEMENTATION_LOG.md` — full implementation history
- `ARCHITECTURE.md` — technical deep-dive
