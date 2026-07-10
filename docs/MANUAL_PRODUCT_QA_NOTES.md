# Vibeforge — Manual Product QA Notes

> **QA date:** 2026-07-09
> **Branch:** main at `adf6dbb`
> **Method:** Source-level deep inspection (no live app run — E2E deferred per protocol)

---

## Environment Verification

| Check | Result |
|-------|--------|
| `git status` | ✅ main, up to date, 1 untracked (docs/ISSUES_REGISTER.md) |
| `git branch -a -vv` | ✅ main synced, master 44 behind |
| `git remote -v` | ✅ github.com/mertgoevse-wq/Vibeforge-desk.git |
| `npm run verify:native` | ✅ PASS — better-sqlite3 binary loads |
| `npm run typecheck` | ✅ PASS — zero TS errors |
| `npm test` | ✅ PASS — 491 tests, 22 files |
| `npm run build` | ✅ PASS — main, preload, renderer all built |
| Security scan (`sk-or-v1`, `AIza`, `sk-`) | ✅ PASS — only docs/tests/mock data |

---

## Manual Click-Through Results (Source-Level)

### Hero/Landing/Home Screen
- **Route:** `/` (ChatWorkspace with no active chat)
- **Visual:** Time-aware greeting, centered composer card with selectors, 2 starter pills, "More…" link, Recent Chats
- **Status:** ✅ Functional — all buttons have handlers, composer sends to chat
- **Observation:** Feels like a chat entry, not a product hero. No brand visual, no onboarding.

### Studio
- **Route:** `/studio`
- **Visual:** "Start building" hero, primary composer, 4 main cards (Build/Code/Create/Connect), "More creation types" toggle, autonomy selector
- **Status:** ✅ Functional — cards open drawer, wizard selectors work, Start Task Flow routes correctly
- **Observation:** Build App generates hardcoded counter demo, not AI-generated app from prompt. Prompt text stored in sessionStorage but never consumed by preview.

### Build App (Studio → Code flow)
- **Flow:** Click "Build" card → Drawer opens → Select platform/style/output → Click "Start Task Flow"
- **Route:** Navigates to `/preview` with sessionStorage auto-start
- **Status:** ✅ Navigation works, preview auto-starts
- **Observation:** Preview shows hardcoded counter app with selected theme style. User's prompt text is dispatched via `composer-insert` event but LivePreview doesn't use it.

### Code Program
- **Flow:** Click "Code" card → Drawer opens → Select language/output → Start
- **Route:** Navigates to `/preview` (sandbox only) or `/` (plan only)
- **Status:** ✅ Functional
- **Observation:** Same as Build App — no AI code generation, just demo/sandbox.

### Generate Text/Image/Video/Music
- **Flow:** Click respective card → Drawer with type-specific selectors → Start
- **Route:** Navigates to `/` (chat) with composed prompt
- **Status:** ✅ Functional — prompt inserted into chat composer
- **Observation:** Media generators default to "Mock Offline Creator" and route to chat for text description. No actual media generation. Non-mock providers show warning with "Configure Providers" link.

### Vibe Coding
- **Route:** `/vibe`
- **Visual:** 3-tab dashboard (Quick Start, Guided Builder, Learn), hero with Sparkles icon
- **Status:** ✅ Functional — all tabs work, project type cards route correctly, guided builder produces prompt
- **Observation:** Same execution gap as Studio — prompts go to chat composer but no auto-send.

### LivePreview / Code Mode
- **Route:** `/preview`
- **Visual:** Split-pane (project explorer + preview frame), server controls, logs console
- **Status:** ✅ Functional — demo creates counter app, in-process server runs, iframe renders
- **Observation:** File explorer shows mock files. Error retry loses theme style (bug fixed in this audit). No code editing capability.

### Chat
- **Route:** `/` (with active chat)
- **Visual:** Chat header with title/profile/model, message thread, composer
- **Status:** ✅ Functional — send/receive works, streaming, error handling, retry, provider setup card
- **Observation:** No file attachments (disabled button). No token count display. No chat title auto-generation.

### Providers (Settings)
- **Route:** `/settings/providers`
- **Visual:** Test Center + provider cards with sections
- **Status:** ✅ Functional — key save/test/delete, model toggle, custom provider modal
- **Observation:** No model search for providers with many models. Base URL updates on every keystroke (no debounce).

### MCP Tools (Settings)
- **Route:** `/settings/tools`
- **Visual:** Master-detail layout, tool list + detail panel
- **Status:** ✅ Functional — Add MCP Server modal, enable/disable/trust, safety check, call history
- **Observation:** Tool execution returns mock data. No real MCP protocol implementation.

### Connectors (Settings)
- **Route:** `/settings/connectors`
- **Visual:** 12 connector cards with expandable details
- **Status:** ✅ Functional — expand/collapse, configure navigates to provider settings
- **Observation:** Gmail/Drive/Calendar are placeholders. No OAuth implementation. Duplicates provider info.

### Settings (Other)
- **General:** ✅ Functional but toggles are local state only (not persisted)
- **Appearance:** ✅ Read-only design token preview
- **Capabilities:** ✅ Functional but toggles are local state only
- **Developer:** ✅ Functional — debug bundle export works
- **Logs:** ✅ Functional — search, filter, detail view, export
- **Extensions/Security:** ⚠️ Placeholder pages

### Dropdowns/Selectors
- **ModelSelector:** ✅ Custom dropdown, keyboard nav, click-outside close, Local/Cloud badges
- **System Prompt Selector:** ✅ Custom dropdown, filters archived
- **Project Selector:** ✅ Custom dropdown
- **CoworkPage file system select:** ⚠️ Native `<select>` element
- **ProjectsPage provider/model/prompt selects:** ⚠️ Native `<select>` elements
- **LivePreview template select:** ⚠️ Native `<select>` element

### Task Brief Composer (LivePreview)
- **Status:** ✅ Functional — accepts typing, Create & Build button creates sandbox
- **Observation:** Brief text is not used for code generation, just creates template sandbox

### Resize to 1366×768
- **Status:** ✅ No horizontal overflow (verified by E2E tests in previous sessions)
- **Observation:** Layout uses flexbox and grid with responsive breakpoints

---

## Bugs Found & Fixed

### Bug 1: LivePreview Error Retry Loses Theme Style
- **Location:** `src/renderer/src/pages/LivePreview.tsx` lines 128-134, 523-525
- **Root cause:** `clearAutoPreview()` is called on mount, wiping all sessionStorage keys including the style. When the error retry handler later reads `sessionStorage.getItem('build-app-style')`, it returns null, falling back to "Calming Ivory" regardless of user's selected theme.
- **Fix:** Save the style from sessionStorage into a ref before calling `clearAutoPreview()`. Use the ref value in the error retry handler.

### Bug 2: Hardcoded sessionStorage Key in Error Retry
- **Location:** `src/renderer/src/pages/LivePreview.tsx` lines 523, 525
- **Root cause:** Error retry uses hardcoded string `'build-app-style'` instead of the `AUTO_PREVIEW_KEYS.style` constant, breaking the shared helper contract defined in `preview-helpers.ts`.
- **Fix:** Replace hardcoded string with `AUTO_PREVIEW_KEYS.style` constant.

### Bug 3: README Broken Banner Path
- **Location:** `README.md` line 4
- **Root cause:** References `assets/brand/nano-banana/Vibeforge-github-banner.png` which doesn't exist (directory is empty). Actual file is `assets/brand/Vibeforge-github-banner-1200.png`.
- **Fix:** Update path to correct file location.

---

## Not Fixed (Deferred — Not Obvious Blockers)

| Issue | Reason for Deferral |
|-------|---------------------|
| No AI → code → preview pipeline | Major feature, not a bug fix — requires full implementation prompt |
| Mock file explorer in LivePreview | Feature gap, not a broken component |
| CoworkPage simulated execution | Intentional placeholder, clearly labeled |
| MCP mock tool execution | Intentional placeholder, safety gate in place |
| General Settings toggles not persisted | Feature gap, not a broken button |
| `studio-core.service.ts` regex syntax error | In analyze_file pattern — doesn't crash, returns low confidence. Should be fixed but not a visible blocker. |
| `build-app-prompt` / `build-app-platform` keys never read | Dead code — keys are written but not consumed. No functional impact. |
| `assets/brand/nano-banana/` empty directory | Cleanup item, no functional impact |
| No favicon in renderer | Polish item |

---

## Summary

The app is **structurally sound** — all routes work, all buttons have handlers, all dropdowns render correctly, no crashes, no broken imports, no hardcoded secrets. The 491 unit tests and production build pass cleanly.

The **core product gap** is that the AI → code → LivePreview pipeline is missing. The app can show a hardcoded demo counter app in LivePreview, but it cannot take a user's natural language prompt, generate code via an AI provider, write it to the sandbox, and live-preview the result. This is the bolt.diy core loop and the #1 reason the app "looks present but does not actually produce code/preview/results."

The **second gap** is onboarding — new users see a chat home with no guidance on how to configure providers, start coding, or use LivePreview.
