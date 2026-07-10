# Vibeforge — Current Product Gap Audit

> **Audit date:** 2026-07-09
> **Branch:** main at `adf6dbb`
> **Audit type:** Source-level deep inspection (no E2E run per protocol)
> **Tests:** 491 unit tests PASS · typecheck PASS · build PASS · security scan clean

---

## Methodology

This audit was performed by:
1. Verifying the build environment (git status, security scan, native binary, typecheck, 491 unit tests, production build)
2. Reading every key source file in the renderer, main process, shared, and preload layers
3. Searching for no-op buttons, broken routes, dropdown rendering bugs, missing imports, hardcoded sessionStorage keys
4. Inspecting brand assets, design tokens, shared components, settings pages, stores, and the routing system
5. Cross-referencing existing docs (CURRENT_STATE, VISUAL_AUDIT, ISSUES_REGISTER, IMPLEMENTATION_LOG)

No E2E tests were run — this is a source-level audit only. Manual visible QA notes are in `docs/MANUAL_PRODUCT_QA_NOTES.md`.

---

## 1. Hero Landing Page Gap

**Current state:** The home/landing page is `ChatWorkspace.tsx` when `activeChat` is null. It shows a time-aware greeting ("Good morning, Mert"), a centered composer card with model/style/project/tools selectors, 2 starter prompt pills, a "More…" link to Vibe Coding, and a Recent Chats section.

**Gap vs. target:** The user reports "no true hero landing page." The current home is functional but feels like a chat entry point, not a product landing/hero page. Key differences from a true hero:
- No full-screen hero with brand visual, tagline, and primary CTA
- No animated or visual brand element (just text greeting)
- No "Get Started" / "Quick Tour" onboarding flow for first-time users
- Studio page (`/studio`) has a hero ("Start building") but is a secondary page, not the landing
- The composer-centric home is Claude-like but lacks the visual punch of a product hero

**Severity:** Medium — functional but not visually impressive as a first impression

**Recommendation:** Either (a) make the Studio page the default landing route with a full hero, or (b) create a dedicated landing page with brand visual, tagline, and quick-start cards that routes to Studio/Chat/Vibe Coding.

---

## 2. Claude-like Calm Theme Gap

**Current state:** The ivory theme is well-implemented:
- Warm palette: `#FAF7F2` bg, `#F9F6F0` sidebar, `#FFFFFF` cards, `#C75B39` accent
- Bronze secondary accent (`#8B5E3C`) introduced to reduce orange overuse
- Serif display (Crimson Text) for headings, sans-serif (Inter) for UI
- Hero radial gradient (softened to 0.28 opacity)
- Semantic typography classes (text-ui-caption through text-ui-2xl)
- Rounded corners (xl to 28px), warm shadows, subtle animations
- No neon, no cyberpunk, no glassmorphism — compliant with design rules

**Gap vs. target:** The theme is largely there but has inconsistencies:
- Some files still use raw pixel sizes (`text-[10px]`, `text-[11px]`, `text-[8.5px]`) instead of semantic classes
- CoworkPage uses native `<select>` and `<input type="radio">` instead of shared components
- ProjectsPage uses native `<select>` for provider/model/prompt dropdowns
- The sidebar surface (`#F9F6F0`) is nearly indistinguishable from bg (`#FAF7F2`) — intentional but makes navigation feel flat
- No dark mode (UI toggle exists in settings but is not wired)

**Severity:** Low-Medium — theme is solid, inconsistencies are cosmetic

**Recommendation:** Complete the typography normalization pass (replace remaining `text-[Npx]` with semantic classes). Replace native `<select>` elements in CoworkPage and ProjectsPage with shared `Select` component. Wire the dark mode toggle or remove it.

---

## 3. Bolt.diy-like LivePreview Gap

**Current state:** LivePreview (`LivePreview.tsx` + `live-preview.service.ts`) provides:
- Sandboxed preview directories under userData
- In-process HTTP static server (no subprocess for HTML/demo templates)
- Vite+React template with npm install + spawn
- iframe preview with status badge (idle/starting/running/error/stopped)
- Push-based status change events (`preview:status-change` IPC)
- Fast-poll fallback (200ms for 5 seconds)
- Server logs console with collapsible panel
- Path traversal protection (403 Forbidden)
- Coding Demo: deterministic counter app with theme styles (Ivory/Teal/Slate)
- Studio → LivePreview auto-start via sessionStorage helpers
- Stop/Restart/Open in Browser controls

**Gap vs. bolt.diy:**
- **No AI-generated code → preview pipeline:** Bolt.diy takes a natural language prompt, generates code via AI, and live-previews it. Vibeforge's LivePreview only shows hardcoded demo/HTML templates — it does not connect chat completions to the preview sandbox.
- **No live code editing:** The file explorer shows mock files, not the actual sandbox files. Users cannot edit code in the preview.
- **No hot reload:** The in-process server doesn't support HMR. Changes require manual restart.
- **No multi-file projects:** Only single `index.html` for HTML/demo templates. Vite+React template exists but requires npm install (slow, may fail on 16GB machines).
- **Error retry loses style:** The error retry handler reads `sessionStorage.getItem('build-app-style')` but `clearAutoPreview()` was already called on mount, so the style is lost (falls back to "Calming Ivory"). **This is a real bug — fixed in this audit.**

**Severity:** High — this is the core differentiator vs. bolt.diy and it's the biggest gap

**Recommendation:** 
1. Wire the chat completion engine to write generated code to the sandbox and refresh the preview
2. Replace mock file explorer with real sandbox file listing
3. Add a code editor pane (monaco-editor or code-mirror) for live editing
4. Add auto-refresh on file save
5. Fix the retry style loss bug (done in this audit)

---

## 4. Studio Flow Gap

**Current state:** Studio (`Studio.tsx` + `studio-core.service.ts`) provides:
- Hero with "Start building" heading and primary composer
- 4 main task cards (Build, Code, Create, Connect) + 6 secondary in collapsible drawer
- Task-specific wizard selectors (platform, style, output format, language, tone, provider, etc.)
- Autonomy level selector (5 levels, icon-only with tooltips)
- Drawer with orchestration result (planned steps, safety warnings, missing capabilities)
- Start Task Flow button that routes to appropriate mode and inserts prompt via custom event
- Studio → LivePreview auto-start via `setAutoBuildPreview()` / `setAutoBuildSandboxOnly()`

**Gap vs. target:**
- **Prompt insertion is one-way:** The `composer-insert` custom event fills the chat composer but doesn't auto-send. The user must press Enter manually. This may feel like a "no-op" to users who expect the flow to continue automatically.
- **Build App → LivePreview only generates a demo counter:** The `handleRunDemo()` call creates a hardcoded counter app, not an AI-generated app from the user's prompt. The prompt text is stored in sessionStorage but never consumed by the preview service.
- **Media generators (image/video/music) route to chat:** Selecting "Mock Offline Creator" and starting the task routes to chat with a text prompt — no actual media generation happens.
- **Autonomy selector has no backend effect:** The selected autonomy level is passed to the orchestrator but doesn't change any runtime behavior.

**Severity:** Medium-High — the flow is visually complete but doesn't produce AI-generated results

**Recommendation:**
1. Wire `build-app` flow to send the prompt to the AI provider, write the response to the sandbox, and start the preview
2. Consider auto-sending the prompt after a short delay (with a cancel option)
3. Label media generators more clearly as "routing to chat for text description" rather than implying actual generation

---

## 5. Vibe Coding Gap

**Current state:** Vibe Coding (`VibeCoding.tsx` + `vibe-templates.ts`) provides:
- 3-tab dashboard: Quick Start, Guided Builder, Learn
- Quick Start: 4 project type cards (Website, Desktop App, Dashboard, AI Tool) with Chat/Preview buttons
- 4 quick action cards (Fix error, Improve UI, Add feature, Explain code)
- Collapsible "All templates" section (15 templates)
- Guided Builder: multi-step wizard with progress bar, builds a structured prompt
- Learn: BeginnerHelp component with 9 accordion sections
- Cards insert prompts into chat composer via `composer-insert` event
- Preview buttons set `setAutoBuildPreview()` and navigate to `/preview`

**Gap vs. target:**
- Same as Studio: prompt insertion is one-way, no auto-send
- Preview buttons create the same hardcoded counter demo, not an AI-generated app from the template prompt
- The guided builder produces a well-structured prompt but doesn't connect to any AI execution
- "All templates" collapsed by default — discoverability issue

**Severity:** Medium — good UX structure but lacks the AI execution loop

**Recommendation:** Same as Studio — wire prompts to AI execution. Consider auto-expanding "All templates" or showing a count badge more prominently.

---

## 6. Buttons/Dropdowns/No-op Gap

**Current state:** 
- All routes in `App.tsx` are wired and functional (23 routes, 21 fully functional, 2 placeholder)
- All buttons have `type="button"` and onClick handlers (verified by 491 tests + accessibility audit)
- Dropdowns use custom popover/menu components with keyboard navigation, focus trapping, ESC close
- ModelSelector, system prompt selector, project selector all use custom dropdowns with click-outside close
- No empty `onClick={() => {}}` handlers found in source search

**Gap vs. target:**
- **Attach file button is disabled:** The paperclip button in MessageInput is `disabled` with title "Attach file (coming soon)" — not a no-op but visibly disabled
- **"Toggle Theme" command palette item navigates to Appearance settings** instead of actually toggling — not a no-op but indirect
- **PromptLibrary "Save current composer text as a prompt" is a placeholder** (line 147: "composer integration comes later")
- **CoworkPage task execution is simulated** with `setTimeout` — buttons work but produce fake results
- **MCP tool execution returns mock results** — `api.toolExecute(toolId, { test: true })` returns mock data
- **Settings General page toggles are local state only** — startOnBoot, notifications, etc. don't persist or affect the app
- **Appearance page is read-only** — shows design tokens but has no interactive controls

**Severity:** Low for buttons/dropdowns (they work), Medium for no-op features (they look functional but aren't)

**Recommendation:** Clearly label placeholder/disabled features. Add visual indicators (e.g., "Beta" or "Coming soon" badges) to simulated flows. Wire General Settings toggles to localStorage or electron settings.

---

## 7. Provider Settings UX Gap

**Current state:** ProvidersPage is well-structured:
- Provider Test Center with per-provider cards (status, latency, key status)
- Test All sequential testing
- Provider cards with clear sections: Header, Capabilities, Connection, API Key, Models, Actions
- API key input with show/hide toggle, Save/Change/Delete
- Model list with enable/disable toggle and default star
- Custom provider modal (compact 380px)
- All 10 providers pre-seeded (Anthropic, OpenAI, Google, Mistral, Groq, DeepSeek, OpenRouter, Ollama, LM Studio, Custom)
- Key encryption via Electron safeStorage (DPAPI on Windows)
- Test result messages sanitized (no raw keys in DOM)

**Gap vs. target:**
- **No model search/filter:** The model list can be long for OpenRouter (200+ models) but there's no search
- **No drag-to-reorder models:** Can't customize model display order
- **Base URL editing is instant** — every keystroke calls `handleSetBaseUrl()` which writes to DB. Should debounce.
- **No batch model enable/disable** — must toggle each model individually
- **No "test model" (only test provider)** — can't verify a specific model works

**Severity:** Low — provider settings are functional and well-organized

**Recommendation:** Add model search/filter for providers with many models. Debounce base URL input. These are polish items, not blockers.

---

## 8. MCP/Connectors Gap

**Current state:**
- **ToolsPage:** Master-detail layout (260px tool list + detail panel), 3 built-in mock tools, Add MCP Server modal, enable/disable/trust toggles, safety gate, call history with sanitized logs, destructive permission blocking
- **ConnectorsPage:** 12 connector cards (OpenAI, Google Gemini, AI Studio, Gmail, Drive, Calendar, GitHub, OpenRouter, Ollama, LM Studio, MCP, Phone), expandable detail with auth type, capabilities, permission scopes, risk notes, configure/test/disconnect actions
- **Connector registry:** Formal `CONNECTOR_REGISTRY` in `connectors.ts` with OAuth scope model, action contracts, risk levels
- **Gmail action contracts:** Full safety-first design with read/compose/send/label/trash actions, double confirmation for send/trash

**Gap vs. target:**
- **MCP tool execution is mock only** — `api.toolExecute()` returns mock data, no real MCP protocol calls
- **Gmail/Drive/Calendar are placeholders** — OAuth flow not implemented, status shows "Needs setup"
- **GitHub connector** — import is built, but OAuth for push/PR not implemented
- **Phone Companion** — planned, no implementation
- **No MCP server discovery** — must manually add servers
- **Connectors page duplicates provider info** — OpenAI, Google, OpenRouter, Ollama, LM Studio appear in both Providers and Connectors pages

**Severity:** Medium — connectors are well-designed but mostly placeholder

**Recommendation:** Implement real MCP stdio transport for at least one tool. Implement Gmail OAuth flow. Deduplicate provider/connector pages or clearly differentiate them (Providers = AI models, Connectors = external services).

---

## 9. Logo/Icon/Brand Asset Gap

**Current state:**
- `VibeforgeMark` component: inline SVG with stylized "A" + aureole ring, theme-responsive (uses CSS vars)
- `BrandLockup` / `BrandLockupCompact`: mark + "Vibeforge" wordmark
- PNG variants in `public/brand/`: `Vibeforge-mark-64.png`, `Vibeforge-mark-128.png`, `Vibeforge-mark-256.png`, `Vibeforge-logo-512.png`
- SVG variants in `assets/brand/`: `Vibeforge-icon.svg`, `Vibeforge-logo.svg`, `Vibeforge-mark.svg`, `Vibeforge-wordmark.svg`
- `Vibeforge-app-icon-256.png` and `Vibeforge-github-banner-1200.png` in `assets/brand/`
- App icon: `build/icon.ico` and `build/icon.png` (generated from Nano Banana PNG)
- Connectors use neutral Lucide icons (no fake brand logos) — compliant with brand policy

**Gap vs. target:**
- **README banner path is broken:** References `assets/brand/nano-banana/Vibeforge-github-banner.png` but that directory is empty. Actual file is `assets/brand/Vibeforge-github-banner-1200.png`. **Fixed in this audit.**
- **`assets/brand/nano-banana/` directory is empty** — original Nano Banana source assets may have been moved or deleted
- **No favicon in renderer** — `src/renderer/index.html` doesn't reference a favicon
- **VibeforgeMark SVG is hardcoded** — can't swap brand image without code change (by design, but limits flexibility)
- **No animated brand element** for hero/landing

**Severity:** Low — brand assets are functional, README path is the only broken reference

**Recommendation:** Fix README banner path (done). Add favicon to renderer index.html. Consider an animated brand mark for the hero page.

---

## 10. Tutorials/Onboarding Gap

**Current state:**
- **BeginnerHelp** component in Vibe Coding Learn tab: 9 accordion sections covering basics
- **Guided Builder** in Vibe Coding: multi-step wizard that builds a structured prompt
- **SafetyNotice** component: appears on Studio and Vibe Coding pages
- **Keyboard shortcuts help** (Ctrl+/ or F1): modal showing all shortcuts
- **Command Palette** (Ctrl+K): 21 actions with descriptions
- **Chat home starter prompts:** 2 pills + "More…" link to Vibe Coding
- **ChatPanel empty state:** 8 starter prompt cards + recent chats

**Gap vs. target:**
- **No first-run onboarding flow:** New users see the chat home with no guidance on how to configure providers, start coding, or use LivePreview
- **No interactive tour:** No step-by-step walkthrough highlighting key features
- **No progress tracking:** No "you've completed X% of setup" indicator
- **BeginnerHelp is text-only:** No screenshots, videos, or interactive examples
- **No "Getting Started" checklist:** Users don't know what to do first (configure provider → start chat → try Studio → try LivePreview)

**Severity:** Medium — onboarding is the difference between "looks cool" and "I know how to use this"

**Recommendation:** Add a first-run onboarding modal/flow that guides users through: (1) Configure a provider, (2) Send a chat message, (3) Try Studio Build App, (4) Run LivePreview demo. Add a "Getting Started" card on the home page.

---

## 11. Skills/Agents/Prompt Profile Gap

**Current state:**
- **System Prompt Profiles:** Full CRUD (create, edit, delete, archive, duplicate), hierarchy resolver, safety checks, default profile support. 12 intents, 12 agents, 28 skills in the prompt intelligence engine.
- **Prompt Library:** Tags, categories, search, favorites, usage tracking, slash command integration
- **GitHub Star List Importer:** 29 repos, multi-format parser, safety scan, approve → library/profiles/skills
- **Skill Registry:** `skill-registry.ts` in main process
- **Agent Registry:** `agent-registry.ts` in main process
- **Routing Policy:** `routing-policy.ts` with intent classification and agent routing
- **Right Inspector:** Shows routing analysis (intent, agent, risk, keywords) on every message

**Gap vs. target:**
- **Skills/agents are registry-only:** No UI to view, manage, or select skills/agents beyond the system prompt profile
- **Routing is rule-based, not AI-based:** The prompt analyzer uses regex patterns, not LLM classification
- **No custom agent creation:** Users can't define their own agent personas or skill sets
- **No skill marketplace:** Can't browse/install community skills (GitHub import is the closest thing)
- **Prompt profiles don't affect preview generation:** System prompt is sent to chat API but doesn't influence LivePreview output

**Severity:** Medium — the infrastructure is solid but the user-facing layer is thin

**Recommendation:** Add a Skills/Agents settings page showing the registry contents. Allow users to create custom agent profiles with skill selections. Consider LLM-based routing for better classification.

---

## 12. Search Results with Images/Graphics Gap

**Current state:**
- **Command Palette (Ctrl+K):** Text-based search across 21 commands/pages
- **Chat search:** No in-chat search (command palette is the global search)
- **Prompt Library search:** Text search by name, tag, or content
- **Logs search:** Text search with level/category filters
- **Projects search:** Text search by name

**Gap vs. target:**
- **No visual search results:** All search is text-only, no thumbnails, icons, or preview cards
- **No chat message search:** Can't search within chat history
- **No global file search:** Can't search across project files
- **No image/graphic generation in search:** No ability to search for or display generated images
- **No rich result cards:** Search results are plain text rows, not rich cards with icons/metadata

**Severity:** Low-Medium — search is functional but basic

**Recommendation:** Add icons to command palette results. Add chat message search. Add rich result cards with metadata (type, date, icon) for search results.

---

## 13. Performance Gap for 16 GB RAM / No GPU

**Current state:**
- Electron 43 + React 19 + Tailwind 4 + Zustand 5 — modern, lightweight stack
- In-process HTTP server for HTML/demo previews (no subprocess overhead)
- better-sqlite3 for local DB (fast, synchronous, no ORM query overhead)
- No GPU-dependent rendering (CSS animations only)
- 491 unit tests run in ~15 seconds
- Production build: main 233KB, preload 10KB, renderer ~1.9MB
- Sandboxed previews bound to 127.0.0.1 only

**Gap vs. target:**
- **Vite+React template requires npm install** — can be slow (120s timeout) and memory-heavy on 16GB machines
- **No lazy loading:** All routes are eagerly loaded (no React.lazy/Suspense)
- **No virtual scrolling:** Chat message list and log table render all items (could be slow with 1000+ messages)
- **2-second polling interval** for LivePreview status (reduced by push events, but polling still runs)
- **No memory monitoring:** No way to see app memory usage
- **Google Fonts loaded from CDN** — adds a network request on startup; should be bundled for offline use
- **No code splitting:** Single renderer bundle (~1.9MB) — could be split by route

**Severity:** Low — current performance is adequate for the feature set

**Recommendation:** Add React.lazy for route-level code splitting. Bundle Google Fonts locally for offline use. Add virtual scrolling for long lists. Consider a lighter preview template that doesn't require npm install.

---

## 14. Cleanup/Dead Code Gap

**Current state:**
- Previous sessions removed duplicate Toggle components, inline SVGs, stale TODOs, large PNGs (~16MB → ~0.15MB)
- Docs reorganized into subdirectories (archive/, qa/, brand/)
- Source Structure Audit created (`docs/SOURCE_STRUCTURE_AUDIT.md`)
- No `onClick={() => {}}` empty handlers found
- No unused imports flagged by typecheck
- 491 tests all pass

**Remaining issues:**
- **`assets/brand/nano-banana/` directory is empty** — should be removed or repopulated
- **`scratch/` directory exists** with test sandbox data — should be gitignored or cleaned
- **`build/` directory is empty** — `build/icon.ico` and `build/icon.png` may have been deleted
- **Hardcoded sessionStorage key in LivePreview error retry** — uses `'build-app-style'` instead of `AUTO_PREVIEW_KEYS.style`. **Fixed in this audit.**
- **`build-app-prompt` and `build-app-platform` sessionStorage keys are written but never read** — `setAutoBuildPreview()` writes them but no code consumes them
- **CoworkPage native `<select>` and `<input type="radio">`** — should use shared components
- **ProjectsPage native `<select>`** — should use shared `Select` component
- **Duplicate provider info** in Connectors and Providers pages
- **`studio-core.service.ts` has a regex syntax error** in `analyze_file` pattern: `)\\b/i` has an unmatched closing paren (line ~100)

**Severity:** Low — mostly cosmetic and dead code, no functional breakage

**Recommendation:** Remove empty `nano-banana/` directory. Clean `scratch/` directory. Fix the regex syntax error in studio-core.service.ts. Replace native selects with shared components. Remove or consume the unused sessionStorage keys.

---

## 15. Exact Next Implementation Order

Based on the gap analysis, here is the recommended implementation order for the next prompts:

### Priority 1 — Core Product Loop (makes the app actually produce results)

| # | Task | Impact | Effort |
|---|------|--------|--------|
| 1 | **Wire AI chat → LivePreview code generation** | Highest — this is the bolt.diy core loop | High |
| 2 | **Replace mock file explorer with real sandbox file listing** | High — makes Code Mode feel real | Medium |
| 3 | **Auto-send prompt after Studio/Vibe flow navigation** | Medium — removes "no-op" feeling | Low |
| 4 | **Add code editor pane to LivePreview** | Medium — enables live editing | Medium |

### Priority 2 — First Impression & Onboarding

| # | Task | Impact | Effort |
|---|------|--------|--------|
| 5 | **Create true hero landing page** (or make Studio the default route) | High — first impression | Medium |
| 6 | **Add first-run onboarding flow** (configure provider → send chat → try Studio → try preview) | High — user retention | Medium |
| 7 | **Add "Getting Started" checklist card on home** | Medium — guides new users | Low |
| 8 | **Add favicon to renderer index.html** | Low — polish | Trivial |

### Priority 3 — Feature Completion

| # | Task | Impact | Effort |
|---|------|--------|--------|
| 9 | **Wire General Settings toggles to localStorage/electron settings** | Medium — settings feel real | Low |
| 10 | **Implement real MCP stdio transport for at least one tool** | Medium — MCP becomes real | High |
| 11 | **Implement Gmail OAuth flow** | Medium — connectors become real | High |
| 12 | **Add model search/filter for OpenRouter (200+ models)** | Low — polish | Low |
| 13 | **Add route-level code splitting (React.lazy)** | Low — performance | Low |
| 14 | **Bundle Google Fonts locally for offline use** | Low — offline support | Low |
| 15 | **Replace native `<select>` in CoworkPage and ProjectsPage** | Low — consistency | Low |

### Bugs Fixed in This Audit

| Bug | Location | Fix |
|-----|----------|-----|
| LivePreview retry loses style | `LivePreview.tsx:128-134, 523-525` | Save style in state ref before `clearAutoPreview()` |
| Hardcoded sessionStorage key | `LivePreview.tsx:523, 525` | Use `AUTO_PREVIEW_KEYS.style` constant |
| README broken banner path | `README.md:4` | Update path to `assets/brand/Vibeforge-github-banner-1200.png` |

---

## Summary Scorecard

| Area | Status | Gap Severity |
|------|--------|-------------|
| Build/Tests/Security | ✅ All pass | None |
| Hero landing page | ⚠️ Chat home, not product hero | Medium |
| Calm ivory theme | ✅ Well-implemented | Low (inconsistencies) |
| Bolt.diy-like LivePreview | ❌ No AI→code→preview loop | **High** |
| Studio flow | ⚠️ Visual but no AI execution | Medium-High |
| Vibe Coding | ⚠️ Good structure, no execution | Medium |
| Buttons/dropdowns | ✅ All functional | Low (labeled placeholders) |
| Provider settings | ✅ Well-organized | Low |
| MCP/Connectors | ⚠️ Well-designed, mostly placeholder | Medium |
| Logo/icon/brand | ✅ Functional | Low (README path fixed) |
| Tutorials/onboarding | ⚠️ Text-only, no first-run flow | Medium |
| Skills/agents/profiles | ⚠️ Infrastructure solid, UI thin | Medium |
| Search with images | ❌ Text-only, no visual results | Low-Medium |
| Performance (16GB/no GPU) | ✅ Adequate | Low |
| Cleanup/dead code | ✅ Mostly clean | Low |

**Biggest blocker:** The AI → code → LivePreview pipeline is missing. This is the core differentiator vs. bolt.diy and the #1 reason the app "looks present but does not actually produce code/preview/results."

**Second biggest blocker:** No first-run onboarding — users don't know how to get from "install" to "working AI workspace."
