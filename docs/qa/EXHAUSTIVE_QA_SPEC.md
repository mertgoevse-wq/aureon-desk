# Aureon Desk — Exhaustive QA Testing Spec

> **Created:** 2026-07-09
> **Purpose:** Comprehensive manual + automated QA pass covering every feature, every clickable element, every edge case, and real AI code generation with multiple providers. Fix everything found.

---

## Table of Contents

1. [Scope & Decisions](#1-scope--decisions)
2. [Pre-Flight Gates](#2-pre-flight-gates)
3. [Test Environments](#3-test-environments)
4. [Section A: Launch & Window (7 checks)](#section-a-launch--window-7-checks)
5. [Section B: Logo & Branding (5 checks)](#section-b-logo--branding-5-checks)
6. [Section C: Sidebar (10 checks)](#section-c-sidebar-10-checks)
7. [Section D: Chat Home (7 checks)](#section-d-chat-home-7-checks)
8. [Section E: Chat Active — With Real AI Provider (10+ checks)](#section-e-chat-active--with-real-ai-provider-10-checks)
9. [Section F: Studio — Hero, Composer, Cards, Drawers (16 checks)](#section-f-studio--hero-composer-cards-drawers-16-checks)
10. [Section G: Vibe Coding (7 checks)](#section-g-vibe-coding-7-checks)
11. [Section H: Code Mode / LivePreview (8 checks)](#section-h-code-mode--livepreview-8-checks)
12. [Section I: Cowork (4 checks)](#section-i-cowork-4-checks)
13. [Section J: Settings — Providers & API Keys (10+ checks)](#section-j-settings--providers--api-keys-10-checks)
14. [Section K: Settings — Connectors (11+ checks)](#section-k-settings--connectors-11-checks)
15. [Section L: Settings — MCP Tools (9 checks)](#section-l-settings--mcp-tools-9-checks)
16. [Section M: Result Quality — Real AI Code Generation (8+ checks)](#section-m-result-quality--real-ai-code-generation-8-checks)
17. [Section N: Build Pipeline — Full Flow (12+ checks)](#section-n-build-pipeline--full-flow-12-checks)
18. [Section O: Smart Model Selection & Routing (10+ checks)](#section-o-smart-model-selection--routing-10-checks)
19. [Section P: Token Usage Display (6 checks)](#section-p-token-usage-display-6-checks)
20. [Section Q: Edge Cases (18+ checks)](#section-q-edge-cases-18-checks)
21. [Section R: Settings — Other Pages (12+ checks)](#section-r-settings--other-pages-12-checks)
22. [Section S: E2E Test Suite Verification (6 checks)](#section-s-e2e-test-suite-verification-6-checks)
23. [Section T: Bug Fix Protocol](#section-t-bug-fix-protocol)
24. [Section U: Final Report Template](#section-u-final-report-template)

---

## 1. Scope & Decisions

| Decision | Choice |
|----------|--------|
| **Test depth** | Full stack — visible app click-testing + code-level inspection of IPC handlers, services, and build pipeline |
| **API key** | Test with real API keys (OpenRouter, NVIDIA NIM, Google Gemini or Anthropic) |
| **Bug handling** | Fix everything found — no bug left behind |
| **QA checklist** | Follow the 127-item `docs/qa/HUMAN_QA_CHECKLIST.md` + add new feature coverage |
| **Render quality** | Functional + visual sanity — verify elements visible, buttons work, no broken layouts; take screenshots |
| **Provider choice** | Multiple: OpenRouter + NVIDIA NIM (free tier) + one more (Google Gemini or Anthropic) |
| **Report format** | Create `docs/qa/HUMAN_QA_REPORT_v2.md` with structured pass/fail tables, bug tracker, and executive summary |
| **Edge cases** | All edge cases: empty states, rapid clicks, invalid inputs, network failures, resize, keyboard nav, dark mode, error recovery |
| **Time budget** | Exhaustive — no time limit, methodical coverage |

**New features covered beyond the 127-item checklist:**
- Smart model selection & routing (NVIDIA NIM, exhaustion tracking, fallback)
- Token usage display panel in Providers
- Provider smoke test ("Sample" button)
- Connector preset catalog + Social connectors hub
- Build pipeline tabs (Code, Files, Diff, Plan)
- Follow-up suggestions
- Hero composer with suggestion chips
- Pipeline E2E test suite

---

## 2. Pre-Flight Gates

Run before starting ANY testing. All must PASS.

```bash
git status                          # Verify on main, clean working tree
npm run verify:native               # better-sqlite3 binary loads
npm run typecheck                   # Zero TS errors
npm test                            # All unit tests pass (660 expected)
npm run build                       # Production build succeeds
git grep "sk-or-v1"                 # Secret scan — only docs/tests
npm run dev                         # App launches visibly
```

| Gate | Required Result | Status |
|------|----------------|--------|
| Git status | On `main`, clean or tracked changes only | ⬜ |
| `npm run verify:native` | PASS | ⬜ |
| `npm run typecheck` | PASS, zero errors | ⬜ |
| `npm test` | PASS, all 660+ tests | ⬜ |
| `npm run build` | PASS | ⬜ |
| Secret scan | Only docs/test mock references | ⬜ |
| `npm run dev` | Vite + Electron window visible | ⬜ |

---

## 3. Test Environments

### Environment A: Offline (No API Keys)
- **Purpose:** Test deterministic demo pipeline, mock tools, UI rendering, navigation
- **Setup:** No API keys configured. All providers set to "not configured."
- **Resolution:** 1920×1080 (primary)
- **OS:** Windows

### Environment B: OpenRouter (Single Key, Multi-Model)
- **Purpose:** Test real AI chat, code generation, model routing, fallback behavior
- **Setup:** Configure OpenRouter API key in Settings → Providers
- **Expected behavior:** Smart model selector prefers OpenRouter models; chat generates real responses; build pipeline uses AI code generation
- **Resolution:** 1920×1080

### Environment C: NVIDIA NIM (Free Tier)
- **Purpose:** Test free-tier model preference, exhaustion tracking, fallback routing
- **Setup:** Configure NVIDIA NIM API key in Settings → Providers
- **Expected behavior:** Smart model selector prefers NVIDIA free-tier models for code generation; exhaustion tracking works after rate limit; auto-falls back to next model
- **Resolution:** 1920×1080

### Environment D: Multi-Provider
- **Purpose:** Test multi-provider routing, model selection across providers
- **Setup:** OpenRouter + NVIDIA NIM + one more (Google Gemini or Anthropic) all configured
- **Expected behavior:** Smart selector picks best model across all providers; exhaustion on one provider falls back to another
- **Resolution:** 1920×1080

### Environment E: Compact (1366×768)
- **Purpose:** Test responsive layout, no overlapping panels, all text readable
- **Setup:** Resize window to 1366×768
- **Resolution:** 1366×768

---

## Section A: Launch & Window (7 checks)

**Source:** `docs/qa/HUMAN_QA_CHECKLIST.md` items 1.1–1.7

| # | Check | How to test | Expected result |
|---|-------|-------------|-----------------|
| A.1 | App launches without crash | `npm run dev` → Electron window appears | Window visible, no white screen, no crash dialog |
| A.2 | Window title "Aureon Desk" | Check title bar text | Displays "Aureon Desk" |
| A.3 | Native window controls work | Click minimize, maximize, restore, close | Each control responds correctly |
| A.4 | Taskbar icon shows correctly | Check Windows taskbar | Aureon Desk icon visible (not generic Electron icon) |
| A.5 | Window resize without breaking layout | Drag window edges to various sizes | Layout adapts, no elements cut off or overlapping |
| A.6 | 1366×768 — no overlapping panels | Resize to 1366×768, navigate all pages | No horizontal scroll, no overlapping elements |
| A.7 | 1920×1080 — layout uses space well | Resize to 1920×1080, navigate all pages | Content centered, not stretched awkwardly |

---

## Section B: Logo & Branding (5 checks)

**Source:** `docs/qa/HUMAN_QA_CHECKLIST.md` items 2.1–2.5

| # | Check | How to test | Expected result |
|---|-------|-------------|-----------------|
| B.1 | Sidebar logo renders (SVG, no blur) | Look at sidebar top | AureonMark SVG crisp, no pixelation |
| B.2 | No fake vendor logos in Connectors page | Settings → Connectors | All icons are neutral Lucide icons (no brand logos) |
| B.3 | Studio hero icon renders correctly | Navigate to Studio | AureonMark visible at top of hero |
| B.4 | No broken image icons anywhere | Quick scan all pages | No [broken image] placeholders |
| B.5 | BrandLockup shows "Aureon Desk" text | Check sidebar header | Text "Aureon Desk" visible next to mark |

---

## Section C: Sidebar (10 checks)

**Source:** `docs/qa/HUMAN_QA_CHECKLIST.md` items 3.1–3.10

| # | Check | How to test | Expected result |
|---|-------|-------------|-----------------|
| C.1 | "New Chat" button works | Click New Chat button in sidebar | New chat created, appears in chat list, navigates to /chat |
| C.2 | Chat list populates and updates | Create multiple chats | List shows all chats with titles |
| C.3 | Clicking a chat navigates to it | Click a chat in the list | Navigates to that chat, messages visible |
| C.4 | Studio nav button works | Click Studio in sidebar | Navigates to / (Studio page) |
| C.5 | All nav buttons work | Click Chat, Prompts, Code, Cowork | Each navigates to correct route |
| C.6 | Collapse/expand sidebar works | Click collapse handle | Sidebar shrinks to ~56px, expands back |
| C.7 | Sidebar resizes with drag handle | Drag resize handle | Width changes smoothly, content adjusts |
| C.8 | Settings button at bottom navigates | Click settings gear icon | Navigates to /settings |
| C.9 | No Workflow section | Scan sidebar | No "Workflow" nav item (removed in cleanup) |
| C.10 | No duplicate New button | Scan sidebar | Only one "New Chat" button (removed duplicate) |

---

## Section D: Chat Home (7 checks)

**Source:** `docs/qa/HUMAN_QA_CHECKLIST.md` items 4.1–4.7

| # | Check | How to test | Expected result |
|---|-------|-------------|-----------------|
| D.1 | Greeting shows time-aware text | Navigate to /chat (no active chat) | Shows "Good morning/afternoon/evening" based on time |
| D.2 | Composer card visible | Look at center of page | Composer with model/profile/project selectors |
| D.3 | Composer accepts text input | Type into composer | Text appears, no lag |
| D.4 | Send button visible and clickable | Look for send button | Button visible, enabled when text present |
| D.5 | Recent chats list shows (if any) | Create a chat then go home | Recent chats appear below composer |
| D.6 | No branding mark in greeting | Check greeting area | No AureonMark in greeting (removed in cleanup) |
| D.7 | No "Try asking" suggestion box | Check below composer | No suggestion box (removed in cleanup) |

---

## Section E: Chat Active — With Real AI Provider (10+ checks)

**Source:** `docs/qa/HUMAN_QA_CHECKLIST.md` items 5.1–5.10 + new features

| # | Check | How to test | Expected result |
|---|-------|-------------|-----------------|
| E.1 | New chat creates and appears in sidebar | Click New Chat, type message | Chat appears in sidebar list |
| E.2 | Real text generation (OpenRouter) | Type "Hello, write a haiku about coding" → Send | Coherent, sensible response from AI |
| E.3 | Real text generation (NVIDIA NIM) | Switch to NVIDIA model, send message | Coherent response from NVIDIA model |
| E.4 | Model selector shows correct provider/model | Check model selector dropdown | Shows currently active model with provider badge |
| E.5 | Model displayed in header matches model used | Send message, check header | Header model matches the model that generated response |
| E.6 | System prompt selector works | Click system prompt selector | Dropdown shows available prompts, selection changes |
| E.7 | Slash commands open palette | Type `/` in composer | Palette opens with `/fix`, `/explain`, etc. |
| E.8 | Shift+Enter inserts line break | Type text, Shift+Enter, more text | Line break inserted, message not sent |
| E.9 | Enter sends message | Type text, press Enter | Message sent |
| E.10 | Copy/paste works in composer | Ctrl+C text elsewhere, Ctrl+V in composer | Text pasted correctly |
| E.11 | Error handling — no provider configured | Remove all API keys, try to send | Shows setup guidance, no crash |
| E.12 | Error handling — invalid API key | Enter invalid key, try to send | Shows meaningful error, no crash |
| E.13 | Token usage increments after chat | Send message → Settings → Providers → Token Usage | Request count incremented for model used |
| E.14 | Provider smoke test works | Settings → Providers → Sample button → check result | Passed/failed with model name, duration |
| E.15 | Rate limit / exhaustion recovery | Send rapid messages to free-tier model | Exhaustion tracked, fallback to next model |

---

## Section F: Studio — Hero, Composer, Cards, Drawers (16 checks)

**Source:** `docs/qa/HUMAN_QA_CHECKLIST.md` items 6.1–6.16 + hero composer

| # | Check | How to test | Expected result |
|---|-------|-------------|-----------------|
| F.1 | Studio page loads at / | Navigate to Studio | Page renders with hero, composer, cards |
| F.2 | Hero mark renders | Look at top of page | AureonMark visible, properly sized |
| F.3 | Hero heading and subtitle | Read hero text | "Build calmly with Aureon" + subtitle |
| F.4 | Hero composer accepts text | Type into central composer | Text appears, placeholder disappears |
| F.5 | Suggestion chips populate composer | Click "A pomodoro timer" chip | Composer fills with "A pomodoro timer" |
| F.6 | All 4 primary cards visible | Look at grid below composer | Build, Code, Create, Connect cards |
| F.7 | Each card shows icon, label, description | Inspect each card | Correct icon, label, description, arrow hint |
| F.8 | Clicking a card opens drawer | Click Build card | Drawer slides in from right with task details |
| F.9 | Drawer has wizard selectors | Check Build drawer | Platform, style, output format selectors visible |
| F.10 | Wizard selectors are interactive | Click different platform/style options | Selection highlights, state updates |
| F.11 | Drawer prompt editor editable | Type in "Starter Prompt" textarea | Text updates, Enter triggers Start Task Flow |
| F.12 | Start Task Flow button works | Fill prompt, click Start Task Flow | Navigates to correct route (/preview or /chat) |
| F.13 | Autonomy levels 1-4 visible | Look at bottom autonomy selector | 4 icon buttons for levels 1-4 |
| F.14 | Autonomy level selector changes active | Click different levels | Active level highlights, tooltip on hover |
| F.15 | "Open chat" secondary button works | Click "Open chat" button below composer | Navigates to /chat |
| F.16 | "More" drawer toggle works | Click "More" button | Secondary cards appear/disappear with animation |

---

## Section G: Vibe Coding (7 checks)

**Source:** `docs/qa/HUMAN_QA_CHECKLIST.md` items 7.1–7.7

| # | Check | How to test | Expected result |
|---|-------|-------------|-----------------|
| G.1 | Vibe Coding page loads at /vibe | Navigate to Vibe Coding | Page renders with tabs and cards |
| G.2 | 3-tab navigation works | Click Quick Start, Guided Builder, Learn | Each tab shows correct content |
| G.3 | Project type cards visible and clickable | Click a project type card | Card highlights, routes or opens detail |
| G.4 | Quick actions grid visible | Check Quick Start tab | Action cards displayed |
| G.5 | Guided builder steps progress | Go through builder steps | Selections accumulate, prompt builds |
| G.6 | Generated prompt can be sent | Complete builder, click Send | Prompt inserts into composer or routes to chat |
| G.7 | Learn tab shows tutorial cards | Click Learn tab | Tutorial cards visible with content |

---

## Section H: Code Mode / LivePreview (8 checks)

**Source:** `docs/qa/HUMAN_QA_CHECKLIST.md` items 8.1–8.8 + build pipeline

| # | Check | How to test | Expected result |
|---|-------|-------------|-----------------|
| H.1 | Code mode loads at /preview | Navigate to /preview | Split-pane layout with explorer + preview |
| H.2 | Template type selector shows options | Check dropdown | HTML, Vite+React, Coding Demo options |
| H.3 | "Create & Build" creates sandbox | Type brief, click Create & Build | Sandbox path appears, server starts |
| H.4 | "Start Server" starts preview with URL | Click Start Server | URL appears, "Running" badge, iframe renders |
| H.5 | "Stop Server" stops the preview | Click Stop | Server stops, badge shows "Stopped" |
| H.6 | URL bar shows localhost URL and copy | Check URL display | URL visible, copy button works |
| H.7 | "Run Coding Demo App" works | Click Run Coding Demo App | Counter app renders in iframe |
| H.8 | No crash on rapid start/stop | Click Start, Stop, Start, Stop rapidly | No crash, each toggle works |

---

## Section I: Cowork (4 checks)

**Source:** `docs/qa/HUMAN_QA_CHECKLIST.md` items 9.1–9.4

| # | Check | How to test | Expected result |
|---|-------|-------------|-----------------|
| I.1 | Cowork page loads at /cowork | Navigate to Cowork | Page renders without error |
| I.2 | Task composer visible | Look for text input | Composer area present |
| I.3 | Safety notices visible | Scan page | Safety/permission notices displayed |
| I.4 | No broken permissions panel | Check permissions area | No layout breaks or missing content |

---

## Section J: Settings — Providers & API Keys (10+ checks)

**Source:** `docs/qa/HUMAN_QA_CHECKLIST.md` items 10.1–10.10 + new features

| # | Check | How to test | Expected result |
|---|-------|-------------|-----------------|
| J.1 | Settings page loads | Navigate to /settings | Settings layout renders |
| J.2 | Providers page shows all adapters | Scroll through provider cards | All adapters listed (OpenAI, Gemini, OpenRouter, Anthropic, NVIDIA, Ollama, LM Studio, Groq) |
| J.3 | Provider cards show correct status | Check status badges | "Configured" if key present, "No API key" if not |
| J.4 | API key can be entered and saved | Type key → Save Key → check badge | Badge updates to "Configured", toast confirms |
| J.5 | Saved key shows masked value | Check after save | "●●●●●●●● Key configured" text shown |
| J.6 | Test Connection button works | Click Test connection | Shows success/failure with latency |
| J.7 | Provider Smoke Test works | Click "Sample" button | Runs code gen test, shows passed/failed + model + duration |
| J.8 | Local providers show help cards | Check Ollama/LM Studio cards | Info cards about running locally, no key needed |
| J.9 | Provider toggle enable/disable works | Toggle provider off/on | Status updates, provider disabled in model selector |
| J.10 | Delete provider key works | Click trash icon, confirm | Key removed, badge shows "No API key" |
| J.11 | NVIDIA NIM adapter visible | Check for NVIDIA card | NVIDIA NIM card with 3 models listed |
| J.12 | Token Usage panel visible | Scroll to Token Usage section | Panel with "No requests recorded yet" or usage rows |
| J.13 | Token Usage increments after build | Run a build, check Token Usage | Request count appears for model used |
| J.14 | Provider Test Center — Test All | Click "Test All" button | Each provider tested, results shown |

---

## Section K: Settings — Connectors (11+ checks)

**Source:** `docs/qa/HUMAN_QA_CHECKLIST.md` items 11.1–11.11

| # | Check | How to test | Expected result |
|---|-------|-------------|-----------------|
| K.1 | Connectors page loads | Navigate to /settings/connectors | Page renders with preset cards |
| K.2 | All connector cards visible | Scroll through | 15+ preset cards displayed |
| K.3 | Status badges correct | Check each card | Available/Planned/Manual setup badges |
| K.4 | Configure drawer opens | Click a card | Right drawer opens with setup details |
| K.5 | Drawer shows auth type, scopes, risk | Inspect drawer content | Fields, permissions, limitations all shown |
| K.6 | Configure button navigates | Click Configure button | Navigates to correct settings page |
| K.7 | Test button shows mock message | Click Test in drawer | "Mock mode only" or similar placeholder |
| K.8 | Phone Companion shows "Planned" | Find Phone Companion card | Planned status, no live actions |
| K.9 | Gmail shows OAuth scopes | Open Gmail preset drawer | OAuth scopes listed, confirmation requirements shown |
| K.10 | Brand policy notice visible | Scroll to bottom | Vendor logo/brand policy notice |
| K.11 | No fake vendor logos | Check all icons | All use neutral Lucide icons |
| K.12 | Social connectors section visible | Scroll down | Facebook, Instagram, YouTube, TikTok, X, LinkedIn, WhatsApp cards |
| K.13 | Social drawer shows action contracts | Open social preset drawer | Draft/publish actions listed, confirmation required |
| K.14 | Social confirmation modal works | Click a draft action | Modal with content preview, cancel button |
| K.15 | Search/filter works | Type "gmail" in search | Filters to Gmail preset only |

---

## Section L: Settings — MCP Tools (9 checks)

**Source:** `docs/qa/HUMAN_QA_CHECKLIST.md` items 12.1–12.9

| # | Check | How to test | Expected result |
|---|-------|-------------|-----------------|
| L.1 | Tools page loads with master-detail | Navigate to /settings/tools | Left tool list + right detail panel |
| L.2 | At least 3 built-in mock tools | Check tool list | file_search_mock, git_status_mock, project_summary_mock |
| L.3 | Click tool — details show | Click a tool in list | Details appear in right panel |
| L.4 | Safety check button works | Click Safety Check | Safety assessment shown |
| L.5 | Run Test button works for mock | Click Run Test on mock tool | Test result shown (mock response) |
| L.6 | Tool call history visible | Check call history section | Timestamped logs with status labels |
| L.7 | No auto-run of tools | Refresh page | No tools execute automatically |
| L.8 | Destructive tools show warning | Check tool with destructive permissions | Warning badge or text visible |
| L.9 | Untrusted tools disabled by default | Add a tool, check initial state | Disabled, "Untrusted" badge shown |

---

## Section M: Result Quality — Real AI Code Generation (8+ checks)

**Source:** `docs/HUMAN_QA_CHECKLIST.md` items 13.1–13.8

**Prerequisite:** At least one real API key configured (OpenRouter).

| # | Check | How to test | Expected result |
|---|-------|-------------|-----------------|
| M.1 | Text generation: coherent response | Chat → "Write a short poem about coding" | Sensible, on-topic response, not placeholder |
| M.2 | Code generation: valid code | Chat → "Write a Python function to reverse a string" | Valid, runnable code in response |
| M.3 | App building: routes to Code mode | Studio → "Build me a pomodoro timer" → Start building | Navigates to /preview, pipeline starts |
| M.4 | App building: AI generates real code | After pipeline runs → check Files tab | Multiple files: index.html, styles.css, app.js with real content |
| M.5 | App building: LivePreview renders correctly | Check iframe after pipeline | Pomodoro timer visible with start/pause/reset buttons |
| M.6 | App building: app is interactive | Click buttons in iframe | Buttons respond (counter changes, timer starts) |
| M.7 | App building: theme/style applied | Check visual appearance | Selected theme colors applied, no raw/unstyled elements |
| M.8 | Model displayed matches model used | Check model explanation badge in Studio | Explanation mentions actual model used |
| M.9 | Follow-up suggestions after build | Wait for pipeline to complete | Suggestion buttons appear (Improve styling, Add features, etc.) |
| M.10 | Follow-up rebuild works | Click a follow-up suggestion | New build starts with follow-up prompt |

---

## Section N: Build Pipeline — Full Flow (12+ checks)

**New feature — not in original checklist.**

| # | Check | How to test | Expected result |
|---|-------|-------------|-----------------|
| N.1 | Pipeline panel appears after build start | Studio → Start building → wait | Pipeline panel with tabs appears below server controls |
| N.2 | Code tab shows pipeline steps | Click Code tab | Step timeline visible with status icons (running/done/error) |
| N.3 | Files tab shows generated files | Click Files tab | File cards with paths and language labels |
| N.4 | Diff tab shows line-by-line changes | Click a file → Diff tab | Color-coded additions/removals |
| N.5 | Plan tab shows build plan | Click Plan tab | Build plan steps or prompt shown |
| N.6 | Preview tab shows iframe render | Click Preview tab | Live preview of generated app |
| N.7 | Cancel button stops pipeline | Click Cancel during build | Pipeline stops, running state cleared |
| N.8 | Pipeline error shows error panel | Force error (invalid project) | Error panel with retry, logs, diagnostic buttons |
| N.9 | Retry button re-runs pipeline | Click Retry after error | Pipeline restarts, error cleared |
| N.10 | "Local Demo" badge on demo builds | Run without API key | "Local Demo" badge shown on pipeline |
| N.11 | Follow-up suggestions after completion | Wait for build to finish | Suggestion buttons appear below tabs |
| N.12 | Smart model route in follow-ups | Click follow-up suggestion | New build uses smart model selection |
| N.13 | Old chat/messages preserved during build | Start build from chat context | Previous messages still visible |

---

## Section O: Smart Model Selection & Routing (10+ checks)

**New feature — not in original checklist.**

| # | Check | How to test | Expected result |
|---|-------|-------------|-----------------|
| O.1 | "Resolving model" state on Start building | Type prompt → Start building | Button shows "Resolving model…" briefly |
| O.2 | Model explanation badge appears | After model resolved | Badge shows "Selected [model] for Code Generation" |
| O.3 | NVIDIA free-tier preferred for code | Configure NVIDIA key → build app | NVIDIA model selected if available |
| O.4 | OpenRouter fallback when NVIDIA exhausted | Trigger rate limit on NVIDIA → retry | Falls back to OpenRouter model |
| O.5 | Demo fallback when no provider | Remove all keys → build | Falls back to deterministic demo, no error |
| O.6 | Exhaustion cooldown works | Mark model exhausted → wait 5 min | Model becomes available again |
| O.7 | Clear exhaustion works | Exhaust a model → clear all | Model immediately available |
| O.8 | Vision keywords route to vision task | Prompt: "Describe this image" | Vision model selected |
| O.9 | Code keywords route to code gen task | Prompt: "Build me a calculator" | Code generation model selected |
| O.10 | Fast inference keywords route correctly | Prompt: "Quick summary of..." | Fast inference model selected |

---

## Section P: Token Usage Display (6 checks)

**New feature — not in original checklist.**

| # | Check | How to test | Expected result |
|---|-------|-------------|-----------------|
| P.1 | Token Usage panel visible | Settings → Providers → scroll | Panel with header, refresh/reset buttons |
| P.2 | Usage empty state | Fresh app, no requests | "No requests recorded yet" message |
| P.3 | Usage increments after chat | Send chat message, check panel | Model appears with request count = 1 |
| P.4 | Usage increments after build | Build an app, check panel | Request count incremented for model |
| P.5 | Free tier models highlighted | Check usage rows | Free tier models have green "Free" badge + accent background |
| P.6 | Reset clears all usage | Click reset button | All rows cleared, shows empty state |

---

## Section Q: Edge Cases (18+ checks)

**All edge cases requested.**

### Q.1: Empty States
| # | Check | How to test | Expected result |
|---|-------|-------------|-----------------|
| Q.1.1 | Empty chat list | Delete all chats, go to /chat | Empty state with "No chats yet" or similar |
| Q.1.2 | Empty prompt library | Go to Prompts with no saved prompts | Empty state message |
| Q.1.3 | No providers configured | Remove all API keys | Setup guidance on relevant pages |
| Q.1.4 | Empty task brief | Studio → leave prompt blank → Start building | Opens drawer instead of navigating |

### Q.2: Error Recovery
| # | Check | How to test | Expected result |
|---|-------|-------------|-----------------|
| Q.2.1 | Invalid API key | Enter garbage key → test connection | "Connection failed" with explanation, no crash |
| Q.2.2 | Network offline (mock) | Disconnect network → try API call | Graceful error, no crash |
| Q.2.3 | Provider timeout | Use wrong base URL → test | Timeout message, no crash |
| Q.2.4 | Pipeline cancel mid-build | Start build → immediately cancel | Clean stop, state reset |
| Q.2.5 | LivePreview error recovery | Force sandbox error → retry | Retry button works, error panel shows |

### Q.3: Rapid Interactions
| # | Check | How to test | Expected result |
|---|-------|-------------|-----------------|
| Q.3.1 | Rapid Start/Stop preview | Click Start, Stop, Start, Stop quickly | No crash, each action completes |
| Q.3.2 | Rapid Studio card clicks | Click multiple cards rapidly | Last clicked card opens, no error |
| Q.3.3 | Rapid navigation | Click nav buttons rapidly | Navigates to last clicked, no error |

### Q.4: Keyboard Navigation
| # | Check | How to test | Expected result |
|---|-------|-------------|-----------------|
| Q.4.1 | Tab through interactive elements | Press Tab repeatedly | Focus moves logically through elements |
| Q.4.2 | Focus visible ring | Tab through elements | Visible focus ring on each element |
| Q.4.3 | ESC closes modals/drawers | Open modal, press ESC | Modal closes |
| Q.4.4 | Ctrl+K opens command palette | Press Ctrl+K | Command palette opens |
| Q.4.5 | Enter in composer sends | Type text, press Enter | Message sent |
| Q.4.6 | Shift+Enter inserts newline | Type text, Shift+Enter | Newline inserted, not sent |

### Q.5: Dark Mode
| # | Check | How to test | Expected result |
|---|-------|-------------|-----------------|
| Q.5.1 | Dark theme applies | Settings → Appearance → Dark | Theme changes to warm charcoal |
| Q.5.2 | Dark theme persists | Toggle dark → navigate away → back | Theme remains dark |
| Q.5.3 | Dark theme on all pages | Navigate all pages in dark mode | All pages render correctly in dark |

### Q.6: Resize
| # | Check | How to test | Expected result |
|---|-------|-------------|-----------------|
| Q.6.1 | 1366×768 — all pages | Resize, navigate each page | No horizontal scroll, no overlapping |
| Q.6.2 | 1920×1080 — all pages | Resize, navigate each page | Content uses space well, not stretched |
| Q.6.3 | Sidebar collapsed at narrow width | Shrink window to ~1024px | Sidebar auto-collapses or remains usable |
| Q.6.4 | Modal at 1366×768 | Open modal at small resolution | Modal fits screen, not cut off |

---

## Section R: Settings — Other Pages (12+ checks)

**Not fully covered in original checklist.**

| # | Check | How to test | Expected result |
|---|-------|-------------|-----------------|
| R.1 | General Settings page loads | Settings → General | Page renders with toggles/inputs |
| R.2 | Appearance page loads | Settings → Appearance | Theme preview, font settings |
| R.3 | Capabilities page loads | Settings → Capabilities | Toggle list for capabilities |
| R.4 | Developer Settings loads | Settings → Developer | Debug tools, bundle export |
| R.5 | Logs page loads | Settings → Logs | Log viewer with search/filter |
| R.6 | Log search works | Type in log search | Filters log entries |
| R.7 | Log export works | Click export | Downloads log file |
| R.8 | GitHub Imports page loads | Settings → GitHub Imports | Import UI with star list button |
| R.9 | Prompts Settings page loads | Settings → Prompts | Prompt library settings |
| R.10 | Prompt Library page works | Navigate to /prompts | Card grid, search, filters |
| R.11 | Prompt Editor works | Open a prompt to edit | Editor with tag input, variable filler |
| R.12 | Self-Audit page loads | Navigate to /settings/self-audit | Audit UI with tabs |

---

## Section S: E2E Test Suite Verification (6 checks)

| # | Check | How to test | Expected result |
|---|-------|-------------|-----------------|
| S.1 | Unit tests all pass | `npm test` | All 660+ tests pass |
| S.2 | E2E smoke test passes | `npx playwright test tests/e2e/01-aureon-smoke.spec.ts` | All tests pass |
| S.3 | E2E studio-vibe-flow passes | `npx playwright test tests/e2e/18-aureon-studio-vibe-flow.spec.ts` | All 12 tests pass |
| S.4 | E2E pipeline test passes | `npx playwright test tests/e2e/19-aureon-studio-pipeline-e2e.spec.ts` | All 6 tests pass |
| S.5 | Full E2E suite | `npx playwright test` | No new failures beyond known flakes |
| S.6 | No regression in unit tests | `npm test` after all fixes | Same or higher test count, all pass |

---

## Section T: Bug Fix Protocol

When a bug is found during testing:

1. **Capture:** Screenshot (`tests/e2e/artifacts/qa-bug-###.png`) + describe in report
2. **Classify:** Severity (Critical / Major / Minor / Cosmetic)
3. **Root cause:** Read relevant source files, trace the issue to its origin
4. **Fix:** Apply the fix in code
5. **Verify:** Re-test the specific flow
6. **Regression check:** Run `npm run typecheck && npm test` after each fix
7. **Document:** Record fix in the report with before/after description

### Severity Definitions

| Severity | Definition | Examples |
|----------|-----------|----------|
| **Critical** | App crashes, data loss, security leak, core flow broken | White screen, build pipeline crash, secret in logs |
| **Major** | Feature doesn't work, route broken, incorrect behavior | Button doesn't respond, wrong page loads |
| **Minor** | Works but has issues, visual glitch, edge case | Alignment off, missing hover state, slow response |
| **Cosmetic** | Visual polish only, no functional impact | Typo, spacing, color shade |

### Bug Tracker Table

| ID | Severity | Section | Check # | Description | Root Cause File | Fix Applied | Status |
|----|----------|---------|---------|-------------|-----------------|-------------|--------|
| B-001 | | | | | | | ⬜ |
| B-002 | | | | | | | ⬜ |

---

## Section U: Final Report Template

Report will be created at `docs/qa/HUMAN_QA_REPORT_v2.md` with this structure:

```
# Aureon Desk — Human QA Report v2

## Session Info
- Date
- Branch & commit
- QA spec reference
- Environments tested

## Pre-Flight Gates
(Table with all 7 gates, results)

## Results by Section
(For each section A-S: summary table + pass/fail counts + notable findings)

## Bug Tracker
(All bugs found, classified by severity, with root cause and fix)

## Fixes Applied
(Code changes made, files modified, commits)

## Edge Case Results
(All Q.1–Q.6 results)

## E2E Test Results
(All S.1–S.6 results)

## Executive Summary
- Total checks: ___
- Passed: ___
- Failed: ___ (all fixed or documented)
- Bugs found: ___
- Bugs fixed: ___
- Known limitations (deferred): ___
- Overall assessment: [READY / NEEDS WORK / BLOCKED]
```

---

## Execution Order

1. **Pre-Flight Gates** (Section 2) — all must PASS before starting
2. **Section A-B: Launch & Branding** — quick, verify basic integrity
3. **Section J: Providers** — configure real API keys (OpenRouter, NVIDIA, one more)
4. **Section F: Studio** — test hero, composer, cards, drawers
5. **Section N: Build Pipeline** — test with real AI code generation (Environment B/C/D)
6. **Section H: Code Mode / LivePreview** — verify rendering, iframe, interaction
7. **Section M: Result Quality** — verify AI-generated code quality + visual sanity
8. **Section O: Smart Model Selection** — test routing, exhaustion, fallback
9. **Section P: Token Usage** — verify counts after chat and build
10. **Section E: Chat Active** — test real AI chat with all providers
11. **Section C-D: Sidebar & Chat Home**
12. **Section G: Vibe Coding**
13. **Section I: Cowork**
14. **Section K: Connectors**
15. **Section L: MCP Tools**
16. **Section R: Other Settings Pages**
17. **Section Q: Edge Cases** — empty states, error recovery, rapid clicks, keyboard nav, dark mode, resize
18. **Section S: E2E Test Suite** — verify all tests pass
19. **Section U: Final Report** — compile findings, executive summary
```

---

*End of spec. Ready for execution.*
