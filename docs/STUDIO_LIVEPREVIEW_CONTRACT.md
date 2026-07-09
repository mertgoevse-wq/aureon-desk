# Aureon Desk — Studio → LivePreview Canonical Flow Contract

> **Version:** 1.0  
> **Date:** 2026-07-09  
> **Purpose:** Single source of truth for the Studio → Code → LivePreview pipeline. Any change to this flow MUST update this document and add/update regression tests.

---

## Canonical Flow (9 Steps)

```
Studio/VibeCoding          LivePreview.tsx           IPC/Preload           live-preview.service
─────────────────          ──────────────           ───────────           ───────────────────
1. User clicks "Build                     
   App" card / "Start                     
   building" button                       
   ↓                                      
2. Wizard configures                      
   prompt, platform,                      
   style, output mode                     
   ↓                                      
3. handleStartTask() writes
   sessionStorage keys:
   - auto-build-app-preview
   - build-app-style
   - build-app-prompt
   - build-app-platform
   ↓
4. navigate('/preview')
                           5. useEffect reads                     
                              sessionStorage                       
                              ↓                                    
                           6. handleRunDemo(style)                 
                              calls previewStartGenerated()        
                                                       7. IPC invoke                  
                                                          'preview:startGenerated'      
                                                                              8. startGeneratedPreview()
                                                                                 → createSandbox (demo template)
                                                                                 → write index.html (style-aware)
                                                                                 → startPreview (in-process HTTP)
                                                                                 → _emitStatusChange() push
                           9. onPreviewStatusChange                                 
                              → setStatus(running)                                  
                              → iframe renders                                      
```

## SessionStorage Contract (MUST NOT CHANGE)

| Key | Expected Value | Set By | Read By |
|-----|---------------|--------|---------|
| `auto-build-app-preview` | `'true'` | Studio.tsx, VibeCoding.tsx | LivePreview.tsx |
| `build-app-style` | `'Calming Ivory'` / `'Soft Teal'` / `'Deep Slate'` | Studio.tsx, VibeCoding.tsx | LivePreview.tsx |
| `build-app-prompt` | User's prompt text | Studio.tsx, VibeCoding.tsx | LivePreview.tsx (debug only) |
| `build-app-platform` | `'Web app'` / `'Desktop app'` / etc. | Studio.tsx, VibeCoding.tsx | (reserved) |

**Rule:** Only set these keys via the shared helper `setAutoBuildPreview(style, prompt, platform)` — never inline.

## Single Source of Truth

| Concern | Canonical File | Function |
|---------|---------------|----------|
| SessionStorage writer | `src/renderer/src/pages/Studio.tsx` | `setAutoBuildPreview()` helper |
| SessionStorage reader | `src/renderer/src/pages/LivePreview.tsx` | `useEffect` auto-start |
| Sandbox creation | `src/main/services/live-preview.service.ts` | `startGeneratedPreview()` |
| Demo HTML template | `src/main/services/live-preview.service.ts` | `DEMO_COUNTER_HTML` constant |
| Style injection | `src/main/services/live-preview.service.ts` | `.replace()` chain in `createSandbox` |
| HTTP server | `src/main/services/live-preview.service.ts` | `http.createServer()` in-process |
| Status push | `src/main/services/live-preview.service.ts` | `onStatusChange()` callback chain |
| IPC handler | `src/main/ipc/live-preview.ipc.ts` | `registerLivePreviewIPC()` |
| Preload bridge | `src/preload/index.ts` | `previewStartGenerated()` |

## IPC Contract (MUST NOT CHANGE)

```
Renderer                    Main Process
────────                    ────────────
previewStartGenerated()  →  'preview:startGenerated'
  input: {
    source: 'studio-build-app' | 'code-demo' | 'manual'
    style?: string           (e.g. 'Calming Ivory')
    entryFile?: string       (default: 'index.html')
    autoOpenCodeMode?: bool  (reserved)
    autoFocusPreview?: bool  (reserved)
  }
  ←  PreviewStatus {
       status: 'running' | 'error' | ...
       url: string | null
       sandboxPath: string | null
       ...
     }

onPreviewStatusChange()  ←  'preview:status-change' (push)
  PreviewStatus             (fires immediately on state transition)
```

## Regression Prevention Rules

1. **Never change sessionStorage keys** without updating `LivePreview.tsx` reader AND this contract
2. **Never change IPC channel names** without updating preload, IPC handler, AND renderer
3. **Never change `PreviewStatus` shape** — it's the contract between service, IPC, and renderer
4. **Never skip the `onStatusChange` push** — it eliminates the 2-second poll delay
5. **Always add a regression test** when modifying any step of this pipeline
6. **Always run `npm run demo:coding`** (the standalone smoke test) after changes

## Error Handling Contract

| Error Point | How Detected | How Displayed |
|-------------|-------------|---------------|
| Sandbox creation fails | `startGeneratedPreview` throws | Red error panel with "Retry Start" button |
| Port not available | `findAvailablePort` scans 100 ports | Error panel with "Copy Diagnostic" |
| HTTP server fails | `server.on('error')` fires `_emitStatusChange` | Error panel + log panel |
| Path traversal attempt | `path.resolve` containment check | 403 Forbidden response |
| npm install fails (vite-react only) | `execSync` throws | Error panel with npm error message |
| Vite starts but crashes | Process `close` event with non-zero code | Error panel with stderr output |

## Demo Script Verification

`scripts/demo-coding.mjs` provides a standalone smoke test:
- No Electron required — runs as pure Node
- Creates sandbox, starts server, verifies 9 checks
- Exit 0 on pass, exit 1 on fail
- Run: `npm run demo:coding`

## Test Coverage

| Unit Tests | File | Count |
|------------|------|-------|
| Sandbox creation | `live-preview.test.ts` | 5 |
| Path validation | `live-preview.test.ts` | 6 |
| Process lifecycle | `live-preview.test.ts` | 5 |
| Secret redaction | `live-preview.test.ts` | 2 |
| In-process HTTP server | `live-preview.test.ts` | 4 |
| Status change push | `live-preview.test.ts` | 4 |
| Generated preview flow | `live-preview.test.ts` | 3 |
| **Total** | | **29** |

| E2E Tests | File | Count |
|-----------|------|-------|
| Studio → LivePreview flow | `18-aureon-studio-vibe-flow.spec.ts` | 4 |
| Coding demo counter | `10-aureon-coding-demo.spec.ts` | 7 |
| LivePreview navigation | `09-aureon-live-preview.spec.ts` | 10 |

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-07-09 | Contract created; extracted sessionStorage helper | Buffy |
