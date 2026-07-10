# Vibeforge — Full Autonomous QA & Production Overhaul Spec

> **Created:** 2026-07-09
> **Based on:** Multi-round user interview (6 rounds, 18 questions)
> **Scope:** Deep restructuring — every placeholder wired, real AI agents, visible QA, full agent ecosystem

---

## 1. Baseline State (Pre-Spec)

| Check | Result |
|-------|--------|
| `npm run typecheck` | ❌ 5 errors in `build-pipeline.service.ts` (pre-existing) |
| `npm test` | ✅ 706 tests passing (28 files) |
| `npm run build` | ✅ PASS |
| Current commit | `1dad7f0` (Bolt-like pipeline) |
| Known placeholders | Cowork (simulated), MCP tools (registry only), Connectors (setup contracts), Extensions/Security settings (empty) |
| Pipeline | Deterministic demo only (always counter app) — not wired to real AI |

---

## 2. User Requirements Summary

### Core Mandate
The user wants Vibeforge to be a **fully autonomous, production-grade AI workspace** that:
1. Works end-to-end with no broken flows or dead ends
2. Visibly tests itself on the desktop in real-time
3. Uses real AI agents (not simulations) via OpenRouter
4. Can build any type of app (Android, web, etc.) from any prompt
5. Has a full agent ecosystem that auto-selects the right agents based on prompt analysis

### Priority (all equal, no single top priority)
- ✅ Everything working end-to-end
- ✅ Visible AI QA testing on desktop
- ✅ Build Android app + webpage demos

### User's Explicit Preferences (from 18 interview answers)

| Topic | User's Choice |
|-------|---------------|
| **Scope depth** | Deep restructuring OK — refactor, delete dead code, rewire architecture |
| **QA approach** | Both: Playwright headed E2E + built-in test runner UI page |
| **Agent execution** | OpenRouter API for real AI calls |
| **QA depth** | Comprehensive stress testing — every flow, edge cases, error states, rapid interactions |
| **Inspiration** | Multiple projects: bolt.diy, Claude Code, Cursor, v0.dev, Lovable |
| **App complexity** | Any prompt, any complexity |
| **Agent ecosystem** | Full: web browsing, code editing, planning/reasoning |
| **Autonomy level** | Full autonomy — analyze, execute, report (no confirmation prompts) |
| **Real AI gen** | Yes — wire real AI via OpenRouter |
| **Placeholders** | Wire them all for real — no more simulations |
| **Code watching** | Real-time streaming edits + side-by-side diffs + live file system tree |
| **Features to copy** | All: full pipeline (bolt), agents (Claude Code), diffing (Cursor), iteration (v0.dev) |
| **Test runner UI** | New settings page: Settings → QA & Testing |
| **Clean start** | Yes — clean rebuild first |
| **Phasing** | I (Buffy) decide optimal order |

---

## 3. Phased Implementation Plan

### Phase 0: Clean Rebuild & Baseline Fix (Pre-requisite)
**Goal:** Start from a clean, verified state. Fix all pre-existing type errors.

| # | Task | Details |
|---|------|---------|
| 0.1 | Run `git clean -fdX` (safe clean) | Remove dist/, out/, cache files |
| 0.2 | Fix 5 pre-existing typecheck errors in `build-pipeline.service.ts` | `_generateComponent`, `_generateLandingPage`, `_generateCounter` missing; wrong argument counts at lines 497, 501 |
| 0.3 | `npm run typecheck` → MUST PASS | Zero errors |
| 0.4 | `npm test` → MUST PASS | All 706 tests |
| 0.5 | `npm run build` → MUST PASS | Clean production build |
| 0.6 | `npm run dev` quick launch | Verify Electron window opens without crash |
| 0.7 | Secret scan | `git grep "sk-or-v1"` — only docs/tests |

### Phase 1: Real AI Pipeline (bolt.diy-style)
**Goal:** Replace deterministic demo with real OpenRouter-powered code generation. The pipeline must handle any prompt and generate real, unique code.

| # | Task | Details |
|---|------|---------|
| 1.1 | Wire `build-pipeline.service.ts` to call OpenRouter via existing `chat-completion.service.ts` | Use the existing adapter infrastructure — the app already has 10 providers and the model router |
| 1.2 | Implement `generateWithAI()` properly | Send user prompt + system instructions to OpenRouter; parse JSON response into `FileOperation[]` |
| 1.3 | Implement real file operations | `update_file`, `delete_file`, `rename_file`, `mkdir` — not just `create_file` |
| 1.4 | Add streaming character-by-character display | Show code being written in real-time as tokens arrive from OpenRouter |
| 1.5 | Add side-by-side diff view | Show original vs generated code with unified diff highlighting |
| 1.6 | Add live file system tree | Real-time updating tree showing created/modified/deleted files during generation |
| 1.7 | Implement `npm install` / package handling | When AI generates code with dependencies, install them in the sandbox |
| 1.8 | Support multiple project types | Web app, Android app (via WebView/React Native template), desktop app, API server — classified from prompt |
| 1.9 | Add iteration loop | After preview renders, user can chat with the preview to refine (v0.dev-style) |
| 1.10 | Graceful fallback | If AI fails (rate limit, error), fall back to deterministic demo with clear "Demo Mode" badge |

### Phase 2: Agent Ecosystem
**Goal:** Research and implement a full agent ecosystem from GitHub community projects. Auto-select agents based on prompt analysis.

| # | Task | Details |
|---|------|---------|
| 2.1 | Research top GitHub agent frameworks | Search for: agent-sdk, agent-swarm, multi-agent-orchestrator, task-decomposition agents |
| 2.2 | Research bolt.diy agent architecture | How they decompose prompts into sub-tasks and assign to specialized agents |
| 2.3 | Research Claude Code agent patterns | How they use tool-use agents, file editors, and terminal agents |
| 2.4 | Research npx skills ecosystem | Search `npx skills find` for relevant community skills — install top matches |
| 2.5 | Implement agent registry | Central registry of available agents with capabilities, tools, and selection criteria |
| 2.6 | Implement agent orchestrator | Analyzes user prompt → classifies intent → selects best agents → coordinates execution |
| 2.7 | Implement specialized agents | At minimum: code-generator, code-reviewer, web-researcher, file-editor, terminal-runner, planner |
| 2.8 | Implement auto-routing | All prompts pass through the orchestrator — no manual agent selection needed |
| 2.9 | Agent sandboxing | Agents run in isolated contexts, can't access files outside sandbox without permission |

### Phase 3: Placeholder Elimination
**Goal:** Replace ALL simulated/placeholder features with real implementations.

| # | Task | Details |
|---|------|---------|
| 3.1 | CoworkPage: real task execution | Replace `setTimeout` simulation with real agent orchestration using the agent ecosystem from Phase 2 |
| 3.2 | MCP Tools: real execution | Wire tool registry to actually execute commands — file operations, git, web requests, shell commands |
| 3.3 | MCP Tools: import from GitHub | Support importing MCP servers from GitHub repos (commanded in v0.11.0 roadmap) |
| 3.4 | Connectors: real OAuth flows | Implement Google OAuth for Gmail, Drive, Calendar connectors |
| 3.5 | Connectors: real API calls | Wire social connectors (X/Twitter, LinkedIn, etc.) with real API calls behind confirmation gates |
| 3.6 | Extensions settings page | Remove placeholder — either implement real functionality or redirect |
| 3.7 | Security settings page | Remove placeholder — implement real security settings (session management, data export, etc.) |
| 3.8 | Dark mode / theme toggle | Wire existing UI to actually apply dark theme (CSS already defined in tokens.css) |
| 3.9 | Project file context injection | Wire file reading to actually inject project context into chat prompts |
| 3.10 | Chat title auto-generation | Generate chat titles from first message using AI |
| 3.11 | File attachment UI | Add file upload button to composer with safe file preview |

### Phase 4: QA & Testing System
**Goal:** Build a visible, comprehensive QA system that tests everything and shows results in real-time.

| # | Task | Details |
|---|------|---------|
| 4.1 | Build QA & Testing settings page | New route: `/settings/qa-testing`. Shows test suites, run buttons, live results, screenshots |
| 4.2 | Implement test runner service | Main-process service that orchestrates Playwright tests headedly and streams results to renderer |
| 4.3 | Live test progress display | Real-time progress bar, current test name, pass/fail counts updating live |
| 4.4 | Screenshot gallery | Capture screenshots at key moments, display in a gallery with pass/fail overlays |
| 4.5 | Comprehensive test suite | Test every flow: Studio → LivePreview, Chat, Settings, Providers, MCP, Cowork, Vibe Coding, all routes |
| 4.6 | Stress testing | Rapid clicking, window resize, keyboard shortcuts, theme switching, concurrent operations |
| 4.7 | Error injection testing | Test error states: no provider, API failure, network disconnect, invalid input, path traversal attempts |
| 4.8 | Accessibility testing | Test keyboard navigation, screen reader, focus management, color contrast |
| 4.9 | Visual regression testing | Screenshot comparison between builds to detect visual regressions |
| 4.10 | Human-like click simulation | Use `99-human-click-qa.spec.ts` as base, expand to cover ALL flows with realistic timing |

### Phase 5: Android App & Webpage Demo
**Goal:** Prove the pipeline works by generating real, working outputs.

| # | Task | Details |
|---|------|---------|
| 5.1 | Create Android app template | Scaffold for React Native or WebView-based Android app with proper structure |
| 5.2 | Generate sample Android app | Use real AI pipeline to generate a complete Android app (e.g., task manager, notes app) |
| 5.3 | Create webpage template | Multi-page website template with navigation, responsive design |
| 5.4 | Generate sample webpage | Use real AI pipeline to generate a complete multi-page website |
| 5.5 | Live preview both | Render Android app in iframe/WebView; render webpage in LivePreview iframe |
| 5.6 | QA verify outputs | Automated checks: all files generated, no syntax errors, preview renders, interactivity works |

### Phase 6: Final Polish & Consolidation
**Goal:** Ensure everything is clean, documented, and production-ready.

| # | Task | Details |
|---|------|---------|
| 6.1 | Remove all remaining dead code | Run knip, depcheck, madge — remove unused files, exports, deps |
| 6.2 | Fix all typecheck errors | Zero TypeScript errors across entire project |
| 6.3 | All tests passing | Zero failing tests (including the 2 pre-existing failures from tests/unit/build-pipeline.test.ts) |
| 6.4 | Full E2E suite passing | All Playwright tests pass headed and headless |
| 6.5 | Secret scan | Zero real API keys in tracked files |
| 6.6 | Update all documentation | CHANGELOG, AI_QA_REPORT, ISSUES_REGISTER, IMPLEMENTATION_LOG, CURRENT_STATE, README |
| 6.7 | Build & package | Production build + Windows installer/portable |
| 6.8 | Git commit & push | Single comprehensive commit with detailed message |

---

## 4. Features to Copy from Reference Projects

### From bolt.diy / bolt.new
- **Prompt → full app pipeline**: Classify intent → plan → generate files → install deps → preview
- **Real-time file tree**: Live-updating file explorer showing all generated files
- **Package installation**: Auto-detect dependencies and `npm install` them in the sandbox
- **Stack detection**: Classify what framework/stack the user wants (React, Next.js, Vite, etc.)

### From Claude Code
- **Agent orchestration**: Central orchestrator that decomposes tasks and assigns to specialized sub-agents
- **Tool-use pattern**: Agents have access to tools (read_file, write_file, terminal, web_search) and use them autonomously
- **Permission model**: Risky operations require approval; safe operations are auto-executed
- **Streaming progress**: Real-time streaming of agent actions and outputs

### From Cursor
- **Inline diffing**: Show changes side-by-side or inline with accept/reject
- **Apply pattern**: Generate a diff → show it → user confirms → apply to file system
- **Multi-file editing**: Edit multiple files in a single operation with cross-file awareness

### From v0.dev
- **Iterate on preview**: Chat with the preview to refine — each message refines the generated output
- **Version history**: Track each iteration so users can go back
- **Quick deploy**: One-click deploy/publish from preview

---

## 5. Architecture Decisions

### Agent Orchestrator Flow
```
User Prompt
    │
    ▼
Intent Classifier (analyzes prompt)
    │
    ▼
Agent Selector (chooses best agents for the task)
    │
    ▼
Orchestrator (coordinates agent execution)
    │
    ├──► Planner Agent (creates task plan)
    ├──► Code Generator Agent (generates code)
    ├──► Code Reviewer Agent (reviews generated code)
    ├──► File Editor Agent (applies changes to sandbox)
    ├──► Terminal Agent (runs commands, installs deps)
    └──► Preview Agent (starts preview server)
    │
    ▼
Result → Preview → Follow-up Suggestions
```

### QA System Architecture
```
Settings → QA & Testing Page
    │
    ├──► Playwright Runner (headed, visible on desktop)
    │       │
    │       ├──► Stream test progress via IPC
    │       ├──► Capture screenshots
    │       └──► Report pass/fail
    │
    ├──► Unit Test Runner
    │       │
    │       └──► Run vitest, stream results
    │
    └──► Visual Regression
            │
            └──► Compare screenshots between runs
```

### Safety Model (Even with Full Autonomy)
- **File system**: Agents can only write within sandbox directory; path traversal blocked
- **Network**: Agents can only make API calls through whitelisted providers
- **Secrets**: All AI responses scanned for secrets before writing to disk; redacted if found
- **Destructive operations**: `rm -rf`, `DROP TABLE`, etc. blocked by safety gate
- **Human-in-the-loop**: Critical: even with "full autonomy," destructive actions on user's actual project files still require confirmation

---

## 6. Success Criteria

| # | Criterion | How Measured |
|---|-----------|--------------|
| 1 | Zero typecheck errors | `npm run typecheck` exits 0 |
| 2 | All tests pass | `npm test` — 0 failures |
| 3 | Build passes | `npm run build` exits 0 |
| 4 | Real AI generates unique code | Prompt "build a todo app" generates a todo app (not counter) |
| 5 | Live code streaming visible | Code appears character-by-character in the Code panel during generation |
| 6 | File system tree updates live | Files appear in tree as they're created during generation |
| 7 | Diff view shows changes | Side-by-side or unified diff visible with color coding |
| 8 | Android app generated | Complete Android app project with manifest, activities, layouts |
| 9 | Webpage generated | Complete multi-page website with HTML, CSS, JS |
| 10 | CoworkPage executes real tasks | Tasks go through agent orchestrator, not setTimeout |
| 11 | MCP tools execute real commands | File operations, git, web requests actually work |
| 12 | QA test runner works | Settings → QA & Testing shows live test progress with pass/fail |
| 13 | All E2E tests pass headed | Playwright --headed shows tests running visibly |
| 14 | No placeholders remain | Every page has real functionality |
| 15 | Prompt auto-routing works | Any prompt gets analyzed and routed to correct agents |
| 16 | Agent ecosystem functional | At least 6 specialized agents operational |

---

## 7. Files That Will Be Created

| File | Purpose |
|------|---------|
| `src/shared/types/agent-orchestrator.ts` | Agent types, task decomposition, agent registry types |
| `src/main/services/agent-orchestrator.service.ts` | Core orchestrator: classify → select → coordinate → execute |
| `src/main/services/code-generator.agent.ts` | Specialized agent for code generation via OpenRouter |
| `src/main/services/code-reviewer.agent.ts` | Agent that reviews generated code for issues |
| `src/main/services/file-editor.agent.ts` | Agent that applies file operations to sandbox |
| `src/main/services/web-researcher.agent.ts` | Agent that browses web for documentation/answers |
| `src/main/services/terminal-runner.agent.ts` | Agent that runs shell commands in sandbox |
| `src/main/services/qa-runner.service.ts` | QA test orchestrator — runs Playwright + vitest, streams results |
| `src/renderer/src/pages/settings/QATestingPage.tsx` | QA & Testing settings page with live results |
| `src/main/ipc/agent-orchestrator.ipc.ts` | IPC handlers for agent orchestration |
| `src/main/ipc/qa-runner.ipc.ts` | IPC handlers for QA testing |
| `tests/unit/agent-orchestrator.test.ts` | Unit tests for agent orchestration |
| `tests/unit/qa-runner.test.ts` | Unit tests for QA runner |
| `tests/e2e/19-Vibeforge-full-qa.spec.ts` | Comprehensive E2E test suite |

## 8. Files That Will Be Modified

| File | Changes |
|------|---------|
| `src/main/services/build-pipeline.service.ts` | Wire real AI via OpenRouter; fix 5 typecheck errors; add streaming, all file operation types, package installation, iteration loop |
| `src/main/ipc/build-pipeline.ipc.ts` | Add streaming events for character-by-character display |
| `src/renderer/src/pages/LivePreview.tsx` | Add streaming code display, side-by-side diff, live file tree updates |
| `src/renderer/src/pages/CoworkPage.tsx` | Replace simulation with real agent orchestration |
| `src/renderer/src/pages/settings/ToolsPage.tsx` | Add real tool execution, MCP import from GitHub |
| `src/renderer/src/pages/settings/ConnectorsPage.tsx` | Wire real OAuth and API calls |
| `src/renderer/src/pages/Studio.tsx` | Add prompt analysis display, agent selection preview |
| `src/renderer/src/App.tsx` | Add QA testing route |
| `src/renderer/src/layouts/SettingsLayout.tsx` | Add QA & Testing nav item |
| `src/preload/index.ts` + `index.d.ts` | Add agent orchestrator and QA runner APIs |
| `src/main/ipc/index.ts` | Register new IPC handlers |
| `src/shared/preview-helpers.ts` | Add pipeline streaming keys |
| `src/shared/types/build-pipeline.ts` | Add streaming, iteration, and real AI types |

---

## 9. Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| OpenRouter API costs | Medium | Use cheapest models, cache responses, fallback to demo |
| Agent autonomy causing unintended changes | High | Sandbox isolation, path traversal blocking, safety gate for destructive ops |
| Playwright headed tests flaking on Windows | Medium | Existing retry logic (3 attempts), 5s cleanup delay |
| Scope too large for one session | High | Phase-based approach; each phase produces a working state |
| Real AI generation quality varies | Medium | Validate output structure before applying; fallback to demo on invalid output |
| Community skills/agents quality varies | Medium | Only integrate well-maintained repos with tests; verify before integrating |

---

## 10. Commands Reference

```bash
# Baseline verification
npm run typecheck          # Must pass
npm test                   # All 706+ tests must pass
npm run build              # Must pass

# Clean rebuild
npx rimraf dist out .vite
npm run build

# Secret scan
git grep "sk-or-v1"        # Only docs/tests

# Dead code audit
npx knip --config knip.json
npx depcheck
npx madge --circular --extensions ts,tsx src/

# E2E testing (headed)
npx playwright test --headed

# Skill discovery
npx skills find "agent orchestration"
npx skills find "code generation"
npx skills find "browser automation"
```
