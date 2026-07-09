# Aureon Desk — Studio → LivePreview Canonical Flow Contract

> **Version:** 2.0  
> **Date:** 2026-07-09  
> **Status:** ✅ VERIFIED — Core contract enforced. All 9 demo checks pass. All pre-checks pass (typecheck ✅, 723 tests ✅, build ✅).

---

## Canonical Flow (9 Steps) — Build Pipeline (Current)

```
Studio.tsx              sessionStorage        LivePreview.tsx         IPC/Preload           build-pipeline.service
─────────              ─────────────        ──────────────         ───────────           ──────────────────────
1. User types prompt   
   in hero composer     
   ↓                    
2. handleStartBuilding()                     
   OR Enter key →       
   handleComposerSubmit()
   OR Build App card →  
   handleStartTask()    
   ↓                    
3. Resolves model via   
   modelRouterResolve   
   BestForBuild()       
   ↓                    
4. setAutoBuildPipeline()
   writes sessionStorage:
   - build-pipeline-prompt
   - build-pipeline-theme
   - build-pipeline-platform
   - build-pipeline-mode
   - build-pipeline-model-route
   ↓
5. navigate('/preview')
                        6. useEffect reads                      
                           getAndClearBuildPipeline()            
                           ↓                                     
                        7. api.buildRun({...})                   
                                                    8. IPC invoke                
                                                       'build:run'                
                                                                             9. buildPipelineService.runBuild()
                                                                                → classifyIntent(prompt)
                                                                                → Create build plan (steps list)
                                                                                → generateWithAI() OR
                                                                                  generateDeterministicApp()
                                                                                → computeDeltaFileOperations()
                                                                                → createSandbox()
                                                                                → applyFileOperations()
                                                                                → startPreview()
                                                                                → emitStep() push to renderer
                        10. onBuildStep callback                               
                            → setPipelineSteps()                                
                            → setPipelineFileOps()                              
                            → setStreamingText() (AI)
                            → setPipelinePlan()                                 
                            → setFollowUpSuggestions()                          
                            → setPreviewUrl()                                   
                            → switch to Preview tab                            
                        11. Follow-up suggestion                                
                            clicked →                                            
                            handleFollowUp() →                                  
                            api.buildRun() again                                
```

## SessionStorage Contract — Build Pipeline

| Key | Expected Value | Set By | Read By |
|-----|---------------|--------|---------|
| `build-pipeline-prompt` | User's prompt text | Studio.tsx (via `setAutoBuildPipeline()`) | LivePreview.tsx (via `getAndClearBuildPipeline()`) |
| `build-pipeline-theme` | `'Calming Ivory'` / `'Soft Teal'` / `'Deep Slate'` | Studio.tsx (via `setAutoBuildPipeline()`) | LivePreview.tsx |
| `build-pipeline-platform` | `'Web app'` / `'Desktop app'` / etc. | Studio.tsx (via `setAutoBuildPipeline()`) | LivePreview.tsx |
| `build-pipeline-mode` | `'generate-and-preview'` / `'generate'` / `'plan-only'` | Studio.tsx (via `setAutoBuildPipeline()`) | LivePreview.tsx |
| `build-pipeline-model-route` | Model DB ID string or empty | Studio.tsx (via `setAutoBuildPipeline()`) | LivePreview.tsx |
| `build-pipeline-model-explanation` | Human-readable explanation | Studio.tsx (via `setAutoBuildPipeline()`) | LivePreview.tsx |

**Rule:** Only set these keys via the shared helper `setAutoBuildPipeline()` / `getAndClearBuildPipeline()` in `src/shared/preview-helpers.ts` — never inline.

### Legacy SessionStorage (Deprecated)

| Key | Status |
|-----|--------|
| `auto-build-app-preview` | ⚠️ Legacy — still read by LivePreview.tsx for backward compat |
| `build-app-style` | ⚠️ Legacy |
| `build-app-prompt` | ⚠️ Legacy |
| `build-app-platform` | ⚠️ Legacy |
| `auto-build-app-sandbox-only` | ⚠️ Legacy |

## Single Source of Truth

| Concern | Canonical File | Function |
|---------|---------------|----------|
| SessionStorage writer (pipeline) | `src/shared/preview-helpers.ts` | `setAutoBuildPipeline()` |
| SessionStorage reader (pipeline) | `src/shared/preview-helpers.ts` | `getAndClearBuildPipeline()` |
| SessionStorage writer (legacy) | `src/shared/preview-helpers.ts` | `setAutoBuildPreview()` |
| Pipeline invocation | `src/renderer/src/pages/LivePreview.tsx` | `useEffect` → `api.buildRun()` |
| Build orchestration | `src/main/services/build-pipeline.service.ts` | `runBuild()` |
| Intent classification | `src/main/services/build-pipeline.service.ts` | `classifyIntent()` |
| Deterministic demo generation | `src/main/services/build-pipeline.service.ts` | `generateDeterministicApp()` + 5 intent generators |
| AI code generation | `src/main/services/build-pipeline.service.ts` | `generateWithAI()` |
| File delta computation | `src/main/services/build-pipeline.service.ts` | `computeDeltaFileOperations()` |
| Sandbox creation | `src/main/services/live-preview.service.ts` | `createSandbox()` |
| Preview server start | `src/main/services/live-preview.service.ts` | `startPreview()` |
| Status push | `src/main/services/build-pipeline.service.ts` | `emitStep()` → IPC `build:step` |
| Build IPC handler | `src/main/ipc/build-pipeline.ipc.ts` | `registerBuildPipelineIPC()` |
| Preload bridge | `src/preload/index.ts` | `buildRun()`, `onBuildStep()`, `onBuildComplete()` |
| Model resolution | `src/main/services/model-router.service.ts` | `resolveBestForBuild()` | |

## IPC Contract — Build Pipeline

```
Renderer                    Main Process
────────                    ────────────
buildRun(request)        →  'build:run'
  BuildRequest {
    prompt: string
    projectType: string
    theme: string
    targetWorkspace: 'code'
    mode: 'plan-only' | 'generate' | 'generate-and-preview'
    providerModelRoute: string | null
  }
  ←  BuildResult {
       success: boolean
       steps: BuildStep[]
       fileOperations: FileOperation[]
       plan: string[]
       previewUrl: string | null
       followUpSuggestions: FollowUpSuggestion[]
       isDeterministicDemo: boolean
       ...
     }

buildCancel()            →  'build:cancel'
  ←  boolean

onBuildStep(cb)          ←  'build:step' (push)
  BuildPipelineStatus      (fires on every pipeline step)

onBuildComplete(cb)      ←  'build:complete' (push)
  BuildResult               (fires on pipeline completion)
```

### Legacy IPC (Still Active)

```
previewStartGenerated()  →  'preview:startGenerated'
onPreviewStatusChange()  ←  'preview:status-change' (push)
```

## Regression Prevention Rules

1. **Never change sessionStorage keys** without updating both `preview-helpers.ts` AND this contract
2. **Never change IPC channel names** (`build:run`, `build:cancel`, `build:step`, `build:complete`) without updating preload, IPC handler, AND renderer
3. **Never change `BuildPipelineStatus` shape** — it's the contract between service, IPC, and renderer
4. **Never skip the `emitStep()` push** — it's the only way renderer receives pipeline state
5. **Always add a regression test** when modifying any step of this pipeline
6. **Always run `npm run demo:coding`** (the standalone smoke test) after changes
7. **Always run `npm run test:e2e -- tests/e2e/19-aureon-studio-pipeline-e2e.spec.ts`** to verify the full UI pipeline

## Verified Button Contract

| Button | Location | Handler | Works Without API Key |
|--------|----------|---------|----------------------|
| Start building | Studio hero composer | `handleStartBuilding()` → `setAutoBuildPipeline()` → `/preview` | ✅ (demo fallback) |
| Enter (composer) | Studio hero composer | `handleComposerSubmit()` → same flow | ✅ |
| Build App card | Studio cards | `handleCardClick()` → drawer → `handleStartTask()` | ✅ |
| Create & Build | Code Mode composer | `handleCreateSandbox()` → sandbox + preview | ✅ |
| Run Coding Demo App | Code Mode composer | `handleRunDemo()` → counter app | ✅ |
| Stop | Preview controls | `handleStop()` → stops server | ✅ |
| Restart | Preview controls | `handleRestart()` → stop + start | ✅ |
| Open Browser | Preview controls | `openExternal()` → opens URL | ✅ (when running) |
| Follow-up suggestions | Pipeline panel | `handleFollowUp()` → new build | ✅ |
| Cancel | Pipeline panel (during build) | `handleCancelPipeline()` → stops build | ✅ |
| Code/Preview/Files/Diff/Plan tabs | Pipeline panel | `setActiveTab()` | ✅ |

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
| 2026-07-09 | Contract created; extracted sessionStorage helper (v1.0) | Buffy |
| 2026-07-09 | Added bolt-like build pipeline (BuildRequest, BuildPipeline, FileOperation) | Buffy |
| 2026-07-09 | **v2.0** — Core contract enforced. Verified 11-button contract (no silent no-ops). Demo smoke 9/9. Typecheck ✅, 723 tests ✅, build ✅. Updated to reflect new build pipeline flow with classifyIntent → generateDeterministicApp → computeDeltaFileOperations → createSandbox → applyFileOperations → startPreview → emitStep. | Buffy |
