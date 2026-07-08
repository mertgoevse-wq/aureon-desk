# Changelog

## [0.9.22] - 2026-07-07

### Added
- **In-Process HTTP Static Preview Server**: Moved the static preview server for `html` and `demo` templates directly into Electron's main process, bypassing standard Node.js subprocess spawns on Windows to completely eliminate "Server exited code 1" errors.
- **Path Traversal Protection**: Implemented a canonical path containment check using `path.resolve` to verify all requested local resources start with the resolved sandbox directory, returning a secure `403 Forbidden` on directory traversals.
- **Copy URL Affordance**: Added a clipboard copy action directly inside the URL preview target bar in the LivePreview interface.
- **Live Preview Server Restart**: Added a "Restart" button allowing users to stop and start the active preview server with one click.
- **Sandbox Directory Display**: Rendered the exact directory path of the active local sandbox inside the status overview panel.
- **Provider model sync hooks**: Added IPC/service paths for LM Studio and OpenRouter model sync, and auto-sync local/OpenRouter models after successful provider tests.

### Fixed
- **Windows Vite Execution**: Added `shell: true` to npm install and Vite spawns for the `vite-react` template on Windows, resolving file location failures.
- **Error Propagation**: Enabled capturing and formatting of child process `stderr` logs to provide helpful, actionable diagnostic descriptions instead of generic exit codes.
- **Provider API key paste handling**: Shared input fields now handle paste events as controlled React updates, keeping API key entry reliable in Electron/Windows and Playwright.
- **Full E2E regression**: Re-ran the complete Electron Playwright suite after the paste fix; all 79 tests passed.

## [0.9.21] - 2026-07-07

### Changed - Premium Layout Refactor
- **Visual Design Tokens Contrast**: Tweaked background, surface, and elevated color variables in `tokens.css` to build a beautiful, three-layered layout hierarchy (darker sand sidebar rail -> warm ivory content background -> pure crisp white card bubbles/composers/settings panels).
- **Expanded Sidebar Rail Layout**: Modernized logo header spacing, redesigned navigation lists with rounded-xl active/hover states, premium unified-height buttons, and polished "New Chat" and "Settings" actions.
- **Header Selector Dropdowns**: Refactored Model Selector and System Prompts selector dropdown panels to use consistent `--ivory-elevated` background, smooth drop-shadows, matching border-radii (`rounded-[18px]`), and modern inset selection lists.
- **Workspace Navigation & Panels**: Constrained Settings outlet layout to `max-w-4xl` and wrapped sub-navigation list items with inset hover/active card visual states.
- **Right Inspector Panel Details**: Polished prompt analyzer Router widgets to render collapsible indicators, rotating chevron icon states, and integrated project context indicators.

## [0.9.20] - 2026-07-07

### Added
- **Model Auto-Selection**: Chats created without an explicit model ID will now automatically assign the enabled default model or fallback to the first active model, preventing users from starting in an unconfigured state.
- **Model Setup Assist Cards**: If a chat has no selected model, a polished setup assistant card is shown (with options for OpenRouter cloud, Ollama local, LM Studio local, and Settings). In chats with history, a resume warning banner is displayed.
- **Model Badges in Header**: The header model selector button now displays a distinct, polished "Local" or "Cloud" badge corresponding to the selected model.

### Fixed
- **Controlled Input Keyboard / Paste Actions**: Removed the custom input paste/input event override hooks in `Input.tsx` and `Textarea.tsx` that interfered with React controlled state synchronization, restoring standard typing, copy, paste, select all, and native editing keys.
- **Chat State Store Synchronization**: Updated `ChatWorkspace.tsx` to update `useChatStore` immediately on model or system prompt changes so all dependent UI elements refresh instantly.

### Verified
- Added 6 unit tests in `tests/unit/model-selection-and-provider-polish.test.ts` for default model selection and API key redaction.
- Added 2 E2E tests in `tests/e2e/11-aureon-model-selection.spec.ts` verifying automatic selection and setup assistant cards.

## [0.9.19] - 2026-07-07

### Changed - Prompt 8 Premium UX Audit
- **Claude-like workspace flow, original Aureon UI**: Re-read the ChatGPT ZIP handoff and applied the requested calm desktop direction without copying Anthropic/Claude assets, branding, exact layouts, fonts, colors, or private behavior.
- **Empty chat start surface**: Reworked the first-run chat view into a quieter assistant start page with compact starter prompts that insert useful text directly into the composer.
- **Composer polish**: The message composer now uses a larger elevated rounded surface, a calmer toolbar, a dedicated prompt-library button, a rounded send affordance, and a `composer-insert` event for prompt chips.
- **Message rhythm**: User messages now render as soft right-aligned bubbles while assistant messages keep a readable left-aligned working-answer layout with Aureon identity and copy controls.
- **Chat header polish**: Active chat headers now show title, current system-profile state, and model-selection state in a softer elevated toolbar.

### Added
- **UX regression checks**: Visual regression tests now assert the elevated composer token and the empty-chat starter-prompt insertion path.

## [0.9.18] - 2026-07-07

### Added - Prompt 5 Provider Test Center
- **Provider Test Center**: Settings now include a consolidated test overview for every provider with key status, enabled/disabled state, local-vs-cloud labeling, sanitized result text, latency, last checked time, per-provider test actions, and a sequential "Test All" flow.
- **Continuation notes**: Added `CONTINUATION_NOTES.md` so a fresh Codex chat can resume from the analyzed ZIP/chat plan, current implementation state, validation status, and next recommended work.
- **E2E coverage**: Settings E2E now asserts the Provider Test Center, Test All action, and per-provider status labels are visible.

### Fixed
- **Tailwind utility reset conflict**: Removed the global margin/padding reset that was overriding layered Tailwind utilities. Settings, cards, buttons, gaps, and input padding now render as designed instead of raw HTML-like controls.
- **LivePreview idle controls**: Preview status, URL, logs, Stop Server, and Open in Browser controls are now present in the idle/no-sandbox state so the workspace is stable and testable.

### Changed
- **Claude-like calm UI polish**: Shared cards, buttons, badges, inputs, typography, sidebar logo text, chat empty state, and settings surfaces now use softer radii, shadows, sans-first UI typography, and warmer elevated surfaces while keeping Aureon's own visual identity.
- **Right inspector scope**: The right inspector is limited to the chat workspace so settings and preview pages have more usable horizontal space.
- **Provider result safety**: Provider test messages shown in the renderer are sanitized for common API-key and bearer-token patterns before display.

## [0.9.17] - 2026-07-07

### Added — Provider UX Finalization
- **Provider status badges**: 5-state indicator (Disabled, Tested, Test failed, Local, Configured, No API key) with color-coded badges and icons on each provider card
- **Test Connection per provider**: Dedicated Test button with spinner animation on each provider card, results displayed inline with success/error banners using design tokens
- **Local provider help cards**: Friendly setup cards for Ollama (🦙) and LM Studio (🖥️) with default URLs, no-API-key-needed notes, and download links
- **OpenRouter help card**: Shows `:free` model note for zero-cost testing, API key acquisition link
- **ModelSelector badges**: Local/Cloud badges with Monitor/Globe icons, providers sorted with local first, provider name + context window display, "Configure providers →" link when no models available
- **13 security tests**: API key masking verification, log redaction coverage (sk-/OpenAI/Anthropic/Google/Bearer/x-api-key patterns), multi-secret redaction, safe text passthrough, real key vs model name detection, encryption availability

### Changed
- `ProvidersPage.tsx`: ProviderStatusBadge component, local/OpenRouter help cards, Test Connection button, removed dead Shield import
- `ModelSelector.tsx`: Local/Cloud badges with Monitor/Globe icons, sorted by local first, wider dropdown (w-72)
- Removed unused `editingBaseUrl` state from ProvidersPage

## [0.9.16] - 2026-07-07

### Changed — Design System Refinement
- **Design tokens modernization**: Added clean semantic token names (`--color-bg`, `--color-surface`, `--color-elevated`, `--color-border-strong`, `--shadow-card`, etc.) with backward-compat aliases for all existing `--ivory-*` tokens. Shadows upgraded to multi-layer for richer depth.
- **Sidebar redesign**: Larger logo mark with accent-light background circle, `px-3` → `px-4` padding, `rounded-lg` on all buttons, New Chat button uses accent-light bg with refined border, `py-3` spacing throughout.
- **Chat empty state refinement**: Larger 80px mark, 32px inline SVG Aureon icon, quick action cards with icon-containers (`rounded-lg` accent-light bg), `rounded-xl` card borders, wider `max-w-md` layout.
- **Error bubble refinements**: Softer borders (`/20` opacity), `rounded-xl`, consistent design-token based risk/error colors.
- **Right Inspector**: Softer cards (`border-[var(--ivory-border)]/60`), `rounded-lg` sections, muted empty state (larger 48px icon, `rounded-xl`), `space-y-2.5` breathing room, consistent risk badge colors.
- **Subtle transitions**: All hover states use `duration-150`, buttons use `transition-all` for smoother feel.

## [0.9.15] - 2026-07-07

### Fixed — Input Handling, Copy/Paste, and Settings UI Polish
- **Keyboard handler fixed**: Input/textarea guard now runs BEFORE all global shortcuts. Ctrl+C/V/A copy/paste/select-all now works inside all inputs. Typing any character (including 'k', '/') works correctly in inputs/textareas/contentEditable/role=textbox elements.
- **Electron Edit menu**: Added native application menu with Edit roles (undo/redo/cut/copy/paste/selectAll) for proper native copy/paste behavior across platforms.
- **Typography overhaul**: Only h1-h3 use serif display font. h4-h6, sidebar nav, settings nav, project names, prompt cards, modals, empty states now use clean sans-serif (Inter).
- **Providers page layout**: Wider max-w-4xl layout, improved card spacing, Save button aligned beside API key input, consistent padding, design-token test result styling.
- **Sidebar & Settings navigation**: Larger padding, sans-serif labels, font-semibold active states, `leading-none` for consistent vertical rhythm.
- **11 regression tests**: Verify keyboard handler doesn't block typing/paste/copy/select-all inside inputs, textareas, contentEditable, and role=textbox elements.

## [0.9.14] - 2026-07-07

### Fixed — Final Smoothness & Accessibility Pass
- **ErrorBoundary**: Global React error boundary with fallback UI, reset, and reload — prevents white screen on crashes
- **MessageBubble overflow**: `break-words`, `overflow-hidden`, and `max-w-full` on message content prevent horizontal page overflow from long text/code
- **MessageBubble memoization**: `React.memo` prevents unnecessary re-renders of message list items
- **Smart scroll in chat**: Only auto-scrolls when user is near the bottom; forces scroll during streaming
- **Paperclip button**: Marked as disabled placeholder until file attachment is implemented
- **ModelSelector a11y**: `aria-label`, `aria-expanded`, and `aria-haspopup` for screen reader support

## [0.9.13] - 2026-07-07

### Added — Self-Test Coding Agent Demo
- **Aureon Counter Demo** template: Deterministic HTML app — ivory background, serif title, counter with increment/reset buttons, animated bump effect, footer "Generated by Aureon Desk" — no external APIs, zero secrets
- **`createDemo()` method**: Generates demo sandbox + starts preview server in one step, returns full result with file list and preview status
- **CLI demo runner** (`scripts/demo-coding.mjs`): Headless verification — creates sandbox, starts server, runs 9 checks (HTTP 200, title, counter, increment/reset buttons, footer text, script functions, no secrets), exits 0 on pass
- **CLI demo command**: `npm run demo:coding` — runs the self-test in ~70ms
- **7 E2E tests** (`10-aureon-coding-demo.spec.ts`): Coding Demo option visibility, demo creation and preview start, counter page HTML verification, Playwright counter clicks (increment/reset), stop button, secret leak check, rapid start/stop stability
- **AI_QA_REPORT**: Coding Demo section with all 9 verification checks, sandbox safety notes, screenshot path

### Changed
- `live-preview.service.ts`: Added `DEMO_COUNTER_HTML` template, `'demo'` template type, `createDemo()` method
- `live-preview.ipc.ts`: Added `preview:createDemo` IPC handler
- `preload/index.ts` + `index.d.ts`: Added `previewCreateDemo()` API
- `LivePreview.tsx`: Added "Coding Demo" option to template selector, `handleRunDemo()` with loading state
- `README.md`: Coding Agent Demo section, `demo:coding` command
- `package.json`: Added `demo:coding` script

## [0.9.12] - 2026-07-07

### Added — LivePreview Workspace
- **LivePreview page** (`LivePreview.tsx`): Full-page UI with template type selector (HTML / Vite+React), sandbox create/start/stop controls, live log viewer, URL input, and external browser launcher
- **LivePreview service** (`live-preview.service.ts`): Sandbox folder creation, HTML template generation, Vite+React project scaffold, dev server process spawn/stop with log capture, port detection, path traversal protection, sandbox cleanup
- **IPC + Preload**: Full IPC handlers for preview lifecycle (create, start, stop, getStatus, getLogs, writeFile, listSandboxes, cleanup) with preload API exposure
- **Sidebar navigation**: New "Preview" nav item with `Play` icon in the main sidebar
- **14 unit tests**: Sandbox creation (HTML + Vite templates), error handling, path validation (escape prevention), sandbox listing/cleanup, idle status, secret redaction from logs
- **10 E2E tests** (`09-aureon-live-preview.spec.ts`): Preview nav visibility, page navigation, create button, template selector, URL input, status indicator, log panel, external browser button, stop button, crash-free navigation

### Security
- **Path traversal protection**: All file paths validated against escaping the sandbox directory
- **Localhost-only binding**: Dev server bound to `127.0.0.1` — not accessible from other machines
- **Log redaction**: All preview stdout/stderr passes through `redactSecrets()` before display
- **User confirmation required**: File writes and server starts require explicit user clicks
- **No arbitrary commands**: Only `npm install` + `npm run dev` in the sandbox directory

### Changed
- `index.ts` (IPC): Registered LivePreview IPC handlers
- `preload/index.ts` + `index.d.ts`: LivePreview preload API methods
- `App.tsx`: Added `/preview` route
- `Sidebar.tsx`: Added Preview navigation item
- `README.md`: LivePreview Workspace section
- `SECURITY_NOTES.md`: LivePreview security details

## [0.9.11] - 2026-07-07

### Added — Secure OpenRouter Free Model Integration Test
- **OpenRouter CLI smoke test** (`scripts/test-openrouter.mjs`): Reads `OPENROUTER_API_KEY` from environment, sends a tiny prompt to OpenRouter, prints results without ever exposing the key. Gracefully skips if key is missing.
- **npm script** `test:openrouter`: Runs the CLI smoke test
- **openrouter/free model**: Added to OpenRouter's default models for smoke testing with free-tier models
- **6 new unit tests**: OpenRouter free model headers (HTTP-Referer, X-Title), rate limit error (429), secret redaction (no raw API keys in error messages), log redaction verification, missing env key skip pattern, no hardcoded keys in test source

### Security
- **No hardcoded API keys**: All keys read from `process.env.OPENROUTER_API_KEY` or the secure credential vault
- **Redaction verified**: Secrets redacted from error messages and log output
- **Key format detection**: Detects `sk-or-v1-*` format and redacts appropriately
- **Repo scanned**: `git grep` confirms no leaked keys in the codebase

### Changed
- `constants.ts`: Added `openrouter/free` model to OpenRouter defaults
- `chat-completion.test.ts`: 6 new security and integration tests
- `package.json`: Added `test:openrouter` script

## [0.9.10] - 2026-07-07

### Added — Original Aureon Desk Brand System
- **Brand assets** (`assets/brand/`): Original SVG mark, wordmark, icon, and full logo
- **Icon design**: Stylized "A" with warm terracotta on ivory, subtle neural node dots, circular aureole ring — warm, professional, calm aesthetic
- **Icon generation script**: Updated `scripts/generate-icon.js` to produce the Aureon mark in multi-size ICO (16, 32, 48, 256px)
- **Canvas-based generator** (`scripts/generate-icons.mjs`): Alternative PNG generator using the `canvas` package for higher quality output
- **Brand README** (`assets/brand/README.md`): Usage guide with color palette, mark guidelines, and typography specs

### Changed
- `windows.ts`: Added `icon` property to BrowserWindow for Windows taskbar/Chrome icon
- `Sidebar.tsx`: Inline SVG Aureon mark beside the "Aureon" heading in the sidebar header
- `README.md`: Logo header at top, new Brand Assets section

### Design
- **Mark**: Abstract A-shape with geometric pillars and rounded crossbar
- **Colors**: Warm ivory (#FAF8F5), terracotta (#C75B39), amber (#E8A45C)
- **Mood**: Calm, premium, professional — no neon, no gradients, no cartoons
- Original design, no AI company branding referenced or copied

## [0.9.9] - 2026-07-07

### Added — Premium UX Polish

**Sidebar Refinement:**
- **Vertical navigation**: Replaced cramped horizontal tab row with clean vertical nav list with icons + labels always visible
- **Active route states**: Nav items highlight with background and text color change using `useLocation`
- **Chat list active state**: Active chat gets accent border-right and icon color change for clear visual feedback
- **Collapsed mode**: Added divider between new-chat and nav items, active state coloring, cleaner spacing
- **New chat button**: Changed from dashed-border to solid-border for a calmer, more polished appearance

**ChatWorkspace:**
- **Refined welcome screen**: Grid of 4 feature cards (Multi-Provider, Profiles, Projects, Tools) with icon containers replacing the old bullet list
- **Header spacing**: Improved padding and gap to prevent control overlap at narrower widths

**ChatPanel:**
- **Inline empty state**: Cleaner centered design with circular icon background replacing the generic EmptyState component

**MessageInput:**
- **Refined composer**: Better padding, hover border effect, smaller send/attach icons, consistent vertical alignment
- **Keyboard hint row**: Split `/` command and `Shift+Enter` hints into left/right aligned footer with styled kbd elements

**RightInspector:**
- **Card-based sections**: Each analysis section now rendered as a bordered card with background for visual separation
- **Refined empty state**: Circular Brain icon background, better centered typography

**Design Tokens:**
- Added `--ivory-accent-light` (#FDF0EB) and `--ivory-active-bg` (#EDE4D8) for active/highlight states

### Changed
- `Sidebar.tsx`: Vertical nav, active states, cleaner new-chat button
- `ChatList.tsx`: Active chat indicator with border-right accent
- `ChatWorkspace.tsx`: Feature card welcome screen
- `ChatPanel.tsx`: Inline empty state (removed EmptyState import)
- `MessageInput.tsx`: Refined composer, kbd hint row
- `RightInspector.tsx`: Card-based analysis sections
- `tokens.css`: New active-state tokens

## [0.9.8] - 2026-07-07

### Added — Desktop UX Polish
- **F1 shortcut**: Opens keyboard shortcuts help (alongside existing `Ctrl+/`)
- **Focus Composer command**: New `Ctrl+L` palette action to jump to message input
- **Import Star List command**: New palette action to navigate directly to GitHub imports
- **README shortcuts table**: Full keyboard shortcuts reference with panel resizing instructions

### Changed
- `ShortcutsHelp.tsx`: Updated F1 key display and footer text
- `AppShell.tsx`: Added F1 handler, added 2 new command palette items (focus-composer, import-star-list)
- `ui-desktop-polish.test.ts`: Updated tests for new command palette items and F1 shortcut

### Tests (20 existing + 10 new E2E)
- 10 E2E tests (`08-aureon-shortcuts.spec.ts`): Ctrl+K, Ctrl+N, Ctrl+,, Ctrl+L, Ctrl+B, Ctrl+I, Esc, F1, palette items, resize handles

## [0.9.7] - 2026-07-07

### Added — Make GitHub Star List Imports Practically Usable

**Approve Imported Items → Real Entities:**
- **Approve as Prompt**: Converts an imported item into a real prompt in the Prompt Library with source tracking (`github-import:<repo_url>`)
- **Approve as System Prompt**: Converts an imported item into a system prompt profile in System Prompt Profiles
- **Approve as Skill**: Converts an imported item into an approved skill that appears in the Skill Registry and is available to the routing engine
- **Duplicate prevention**: Re-approving an already-enabled item returns a clear error instead of creating duplicates
- **Approval provenance**: Item description records what it was approved as (`[APPROVED_AS:prompt]` etc.)

**Retry Failed Imports:**
- **Retry button**: Failed repos now have a retry (↻) button in the repo list that deletes the failed clone and re-imports
- **Retry state**: Shows spinning animation while retry is in progress

**Warning Details:**
- **Expandable warnings**: Click the ⚠ badge on any imported item to expand full warning details with severity (high/medium/low), message, and context
- **Color-coded**: Red for high, amber for medium, muted for low severity
- **Untrusted indicator**: Shield icon with "This content is marked untrusted" note in the warning panel

**Skill Registry Integration:**
- **`approved_skills` table**: New DB table storing skills approved from imports
- **`getAllSkills()`**: Now loads approved skills from DB alongside built-in skills
- **Skill definitions**: Imported skills get proper metadata (tags, description, source tracking) and appear in the routing engine

**UI Improvements:**
- **Three approve buttons per item**: 📑 Approve as Prompt, ⚙ Approve as System Prompt, ⚡ Approve as Skill — each with icon, tooltip, and loading spinner
- **Success/error banners**: Green success banner shows approval result, red error banner for failures, both auto-dismiss
- **Unified action row**: View content, three approve buttons, enable/disable toggle, delete — all in a clean row
- **Status badges**: Each item shows its current status (unreviewed/enabled/disabled/rejected) as a colored badge

**Tests (13 new, 197 total):**
- 7 approve workflow tests (prompt, system_prompt, skill type validation, retry logic, schema verification, skill registry integration, unapproved concept)
- 6 existing approve unit tests merged with retry and integration tests
- 7 E2E tests (`07-aureon-github-imports.spec.ts`): page opens, star list button, URL input, empty state, disabled button, security notice, no crash

### Changed
- `GitHubImportsPage.tsx`: Complete UI rewrite with approve/retry/warning-detail features
- `github-import.service.ts`: Added `approveItem()` and `retryImport()` methods
- `skill-registry.ts`: Added `getApprovedSkills()` loading from DB
- `schema.ts` + `migrate.ts`: Added `approved_skills` table
- `github.ipc.ts`: Added `github:approveItem` and `github:retryImport` handlers
- `preload/index.ts` + `index.d.ts`: Added `githubApproveItem()` and `githubRetryImport()` methods

## [0.9.6] - 2026-07-07

### Added — Remote Provider Test Coverage
- **OpenRouter unit tests**: Header verification (HTTP-Referer, X-Title, Authorization), missing API key handling
- **Gemini unit tests**: generateContent endpoint payload, safety filter block handling, auth failure
- **Anthropic unit tests**: Authentication failure error normalization
- **Remote provider E2E tests** (`06-aureon-remote-providers.spec.ts`): 7 tests — provider listing, API key masking, no raw keys in DOM, security notice, custom provider form, capability badges, enable/disable toggles
- **README**: Remote provider setup instructions for Anthropic, OpenRouter, Google Gemini with API key acquisition links

### Total Tests: 190 unit tests | 42 E2E tests

## [0.9.5] - 2026-07-07

### Added — Local Provider Improvements
- **Ollama native /api/chat endpoint**: Direct integration with Ollama's native API with automatic fallback to OpenAI-compatible `/v1/chat/completions` if native fails
- **Ollama model auto-detection**: `providerService.syncOllamaModels()` fetches available models from `/api/tags` and adds them as selectable models
- **Ollama model fetching**: `chatCompletionService.fetchOllamaModels()` returns model list for programmatic use
- **LM Studio model listing**: `testConnection()` now shows how many models are loaded in LM Studio
- **Friendly offline errors**: When Ollama/LM Studio is unreachable, error messages include actionable fix instructions ("Start Ollama with ollama serve")

### Changed — Provider Connection Testing
- **Ollama test**: Now uses `/api/tags` instead of `/v1/models` for more reliable detection and model count
- **LM Studio test**: Now shows loaded model count from `/v1/models` response
- **Offline detection**: Connection refused errors for local providers include server start instructions

### IPC + Preload
- **`provider:syncOllamaModels`**: New IPC handler to trigger Ollama model sync from UI
- **`provider:fetchOllamaModels`**: New IPC handler to fetch Ollama model list
- **Preload API**: Added `providerSyncOllamaModels()` and `providerFetchOllamaModels()` methods

### Tests (8 new, 22 total for chat completion)
- Ollama native API payload format test
- Ollama fallback to OpenAI-compatible on failure
- Ollama no-API-key-required test
- LM Studio OpenAI-compatible endpoint test
- Offline Ollama error test
- Offline LM Studio error test
- Ollama model fetching test (+ offline model fetch test)

## [0.9.4] - 2026-07-07

### Added — Playwright Electron QA Harness
- **Playwright E2E configuration**: `playwright.config.ts` with Electron launch support, artifact capture (screenshots on failure, traces on retry), and HTML reporter
- **Electron launch helper** (`tests/e2e/helpers/electronApp.ts`): Reusable fixture with `electronApp`, `mainWindow`, `consoleErrors`, `pageErrors` tracking, plus `waitForAppReady`, `checkForErrorPage`, and `screenshot` utilities
- **4 E2E test suites (29 tests total — all passing)**:
  - **Smoke test** (`01-aureon-smoke.spec.ts`): 9 tests — app launch, window title, error page detection, sidebar/chat/composer/model visibility (after creating chat), renderer errors, inspector toggle
  - **Navigation test** (`02-aureon-navigation.spec.ts`): 7 tests — Chats/Prompts/Projects/Tools/Settings clicks, back navigation, rapid transitions without crashes
  - **Settings test** (`03-aureon-settings.spec.ts`): 6 tests — provider cards, security info, adapter listing, custom provider UI, API key masking, appearance page
  - **Chat test** (`04-aureon-chat.spec.ts`): 6 tests — new chat creation, composer input, send button states, sending without provider (no crash), router analysis after message
- **27 `data-testid` attributes**: Added to AppShell, Sidebar (nav items, new-chat, settings), ChatPanel, MessageInput (composer, textarea, send-button), RightInspector (panel + toggle), ModelSelector, ChatWorkspace (system-profile-selector)
- **NPM scripts**: `test:e2e`, `test:e2e:headed`, `test:e2e:debug`, `test:e2e:report`, `qa:ai` (typecheck + test + build + e2e)
- **Vitest config** (`vitest.config.ts`): Excludes `tests/e2e/` from unit test runs to prevent Playwright/Vitest import conflicts
- **AI_QA_REPORT.md**: Automated QA report template with results summary, artifacts paths, and error tracking sections

### Fixed — E2E Test Stabilization
- **Smoke tests**: Fixed `main-chat-panel`, `chat-composer`, and `model-selector` tests to create a chat first (app shows welcome screen when no chat is active)
- **Navigation test**: Fixed "Navigate back to Chats" to not assert `main-chat-panel` exists (welcome screen is valid when no chat active)
- **Playwright config**: Added `retries: 1` outside CI for intermittent Electron launch failures
- **Electron fixture**: Added 3s cleanup delay between tests for SQLite WAL checkpointing; added renderer crash detection
- **Test ordering**: Renamed test files with numeric prefixes so smoke tests run first, warming up the database before chat tests

## [0.9.3] - 2026-07-06

### Added — Native SQLite Workflow Hardening
- **`verify:native` script** (`scripts/verify-native.js`): Checks if `better_sqlite3.node` binary exists and is loadable, provides clear fix instructions if missing
- **`rebuild:native` script**: Alias for `electron-builder install-app-deps` — rebuilds native modules for Electron's Node ABI
- **Startup resilience**: Database initialization and migrations wrapped in try/catch with clear error dialog if the native module is missing or incompatible
- **Actionable error messages**: Both the CLI (`verify:native`) and the app (error dialog) provide step-by-step fix instructions for missing native modules

### Changed
- **`.npmrc`**: Removed unsupported `enable-pre-post-scripts=true` config
- **`README.md`**: New Windows Native Dependencies section with one-time setup instructions, verify/rebuild commands, and CI guidance
- **`MVP_TEST_PLAN.md`**: Added native dependency startup test case
- **`connection.ts`**: Wraps `new Database()` in try/catch with descriptive error for missing native bindings
- **`index.ts`**: Wraps full startup sequence in try/catch with `dialog.showErrorBox()` on failure, distinguishing native module errors from other startup errors

## [0.9.2] - 2026-07-06

### Added — Real Chat Completion Engine
- **Chat completion service** (`src/main/services/chat-completion.service.ts`): Sends messages to configured providers via native `fetch()`, stores assistant responses in SQLite
- **Provider adapters**: OpenAI-compatible (OpenAI, OpenRouter, Groq, Mistral, DeepSeek, Custom, Ollama, LM Studio), Anthropic (`/v1/messages`), Google Gemini (`generateContent`)
- **IPC handler**: New `chat:send` IPC method with comprehensive error classification (`no_provider`, `no_model`, `no_api_key`, `provider_error`, `timeout`)
- **Renderer UX**: Thinking/typing loading bubble during AI response, error bubble with retry button and "Open Provider Settings" navigation, input disabled while request is running
- **Preload API**: `chatSend(chatId)` method with `ChatSendResult` type (success, message, error, warnings, providerName, modelName)
- **14 new unit tests**: Missing API key, no model, disabled provider, successful OpenAI completion, Anthropic payload shape, provider errors (401/403/500), timeout handling, findProviderByModel, chat not found

### Fixed — Critical Bugs from Code Review
- **Anthropic adapter**: Preserve original user/assistant roles from request builder (was stripping all roles to 'user')
- **Ollama/LM Studio**: Use provider's configured `base_url` from settings (was hardcoding localhost URLs)
- **Error logging**: Preserve error value when error is not an `Error` instance (was discarding via `undefined`)
- **Navigation**: Replace broken `CustomEvent('navigate')` with `useNavigate()` from react-router-dom
- **Google Gemini**: Map assistant role to 'model' for correct multi-turn conversations
- **Dead imports**: Remove unused `removeChatFromList` import from ChatPanel

## [0.9.1] - 2026-07-06

### Fixed — Stabilization Pass
- **console.log → logger**: `migrate.ts` and `seed.ts` direct-run paths now use `logger.info/error` instead of `console.log/error`
- **Missing routes**: Added `/settings/system-prompts` and `/settings/imports` route aliases in App.tsx (CommandPalette now resolves correctly)
- **Dead code removal**: Removed unused `PlaceholderPage` component from App.tsx
- **APP_NAME constant**: Fixed from `'Ivory'` to `'Aureon Desk'` in shared constants
- **CommandPalette path**: Fixed GitHub Imports entry from `/settings/imports` → `/settings/github`

### Added — Documentation
- **MVP_TEST_PLAN.md**: 59-step manual click-test checklist covering startup, chat, providers, profiles, library, imports, tools, projects, logs, persistence, security, and packaging
- **SECURITY_NOTES.md**: Comprehensive security documentation covering credential storage (DPAPI), 9-tier secret redaction, import safety, file access, IPC security, packaging safety, and known limitations
- **ROADMAP.md**: Feature roadmap from v0.9.0 through v1.0.0 with current status and future priorities

## [0.9.0] - 2026-07-06

### Added — Windows Packaging & Installer
- **electron-builder.yml**: NSIS installer + portable targets, asar with native module unpacking, comprehensive file exclusions, artifact naming (`AureonDesk-Setup-*.exe`, `AureonDesk-Portable-*.exe`)
- **App icon**: Programmatically generated 4-size .ico (16, 32, 48, 256px) with warm ivory/terracotta design matching app theme
- **GitHub Actions CI**: Windows build workflow (`build.yml`) — typecheck → test → build → package with artifact upload and draft release on tags
- **Build scripts**: `npm run dist:win` (electron-builder --win), `npm run package` (build + dist:win)
- **Release safety**: Enhanced .gitignore (installer outputs, IDE, secrets), .npmrc for native module builds
- **App metadata**: Version bumped to 0.9.0, author set, description updated

### Verification
- Runtime paths confirmed: DB in `userData`, imports in `userData/imports`, logs in `userData/logs`, secrets via DPAPI safeStorage
- Packaging requires Visual Studio Build Tools locally (GitHub Actions windows-latest has them pre-installed)
- `npm run build` → `npm run dist:win` produces installer + portable in `dist/`

## [0.9.0] - 2026-07-06

### Added — Component Integration & Polish
- **CommandPalette**: Ctrl+K / Cmd+K global shortcut to open a searchable command palette with 10 navigation items (Chats, Prompts, Projects, Tools, Profiles, Providers, Imports, Logs, Appearance, Settings) with icons and keyboard navigation (ArrowUp/Down/Enter/Escape)
- **Tabs component** integrated into PromptsPage: Active/Archived tabswitcher with live count badges replacing inline tab buttons
- **Card component** integrated into PromptsPage and ProvidersPage: Consistent card wrapping with proper hover/clickable styling
- **Toast notifications** wired into ProvidersPage: 5 toast calls for API key saved, key removed, connection test result, provider deleted, custom provider created — auto-dismiss with type-colored styling
- **Toast integration**: `showToast(type, message)` with 4 types (success, error, warning, info) and slide-in animation

### Changed
- `AppShell.tsx`: CommandPalette component with Ctrl+K listener, ToastContainer already present
- `PromptsPage.tsx`: Inline tab buttons replaced with `<Tabs>`, prompt item divs replaced with `<Card>`
- `ProvidersPage.tsx`: Provider card divs replaced with `<Card>` in a `space-y-4` container, 5 Toast calls added
- `CommandPalette.tsx`: `CommandItem` interface now exported for external use

### Fixed
- Dead imports removed from AppShell (`useLocation`, `Shield` icon)
- Toast calls corrected to match `showToast(type, message)` signature

## [0.8.0] - 2026-07-06

### Added — Logs, Debug Panel & Audit Trail
- **LogsPage**: Full-page UI with log table (level, timestamp, category, message), detail panel, copy sanitized log, filter by level/category/limit, search, clear logs modal, and debug bundle export
- **Unified redaction utility** (`log-redacter.ts`): 9 redaction patterns (Anthropic keys, OpenAI keys, generic sk- keys, Google AI keys, Bearer tokens, x-api-key headers, Authorization headers, secret/token/password assignments, private key blocks) with ordered application (specific before generic)
- **Log model**: 8-field `app_logs` table (id, timestamp, level, category, message, metadata JSON, chat_id, project_id) with 9 categories (app, routing, provider, tool, import, chat, project, security, system)
- **Log service**: CRUD operations, filtering by level/category/search/date range, log counting, bulk clear, debug bundle export (app version, platform, arch, settings, recent logs, tool call logs, import logs)
- **Debug bundle export**: Downloads a sanitized JSON file with all secrets redacted — safe to share for debugging
- **Redaction consolidation**: `request-builder.ts` and `tool-safety-gate.ts` now delegate to the unified `redactSecrets` from `log-redacter.ts`, eliminating duplicate redaction logic
- **25 unit tests**: Redaction coverage (OpenAI, Anthropic, Google, generic sk-, Bearer, x-api-key, api_key, secret, password, Authorization, private keys), containsSecrets, redactObject, debug bundle safety (no plaintext secrets), log filtering (level, category, search, combined)
- **IPC layer**: 9 handlers for log write, query, count, categories, get, clear (app/tool/import), and debug bundle export

### Changed
- `App.tsx` route `/settings/logs` now renders full `LogsPage` instead of placeholder
- `request-builder.ts`: `redactForLog` now aliases unified `redactSecrets`
- `tool-safety-gate.ts`: Internal redaction delegated to unified `redactSecrets`

### Security
- All log entries sanitized before DB storage — API keys, tokens, and secrets are never stored in plaintext
- Debug bundle export automatically redacts all secrets
- Redaction patterns applied in order: specific key formats (Anthropic, OpenAI, Google) before generic catch-alls

## [0.7.0] - 2026-07-06

### Added — Projects & Local Folder Access
- **ProjectsPage**: Full-page UI with project list (search/filter), create/edit/archive/delete, file tree explorer, project instructions, default settings (provider, model, system prompt), and context preview
- **Project model**: 13-column schema (id, name, description, instructions, root_path, archived, default_provider_id, default_model, default_system_prompt_id, enabled_skill_ids, created_at, updated_at)
- **Local folder access**: Electron folder dialog, recursive file tree builder with skip patterns (.git, node_modules, dist, build, .env*, secrets, credentials), binary file detection, 5MB size guard
- **Project context builder**: Select files from tree, read with safety checks (binary skip, size guard, secret detection), assemble context with remote-upload warnings
- **RightInspector integration**: `ProjectContextSection` shows active project name, instructions, and root path in the Router panel
- **File tree component**: Collapsible directory tree with checkboxes for file selection, size display, ignore pattern compliance
- **Project defaults**: Dropdowns to set default provider, model, and system prompt profile per project
- **Project store**: Zustand store (`projectStore.ts`) for managing project selection across the app
- **24 unit tests**: File tree ignore patterns (.git, node_modules, .env, dist, binary, secrets), path ignore checks, context builder, instruction resolution
- **Additive migration**: 5 new columns on `projects` table (archived, default_provider_id, default_model, default_system_prompt_id, enabled_skill_ids)

### Changed
- `App.tsx` routes `/projects` and `/settings/projects` now render full `ProjectsPage` instead of placeholder
- `RightInspector` now imports `useProjectStore` and renders active project context
- `ProjectRow` type extended from 6 to 11 fields

### Security
- Files are read-only by default — no write functionality without explicit confirmation
- Secret patterns detected in project files (API keys, tokens, private keys)
- Binary files skipped entirely (no content sent)
- Remote provider upload warning displayed when building context
- Ignored paths enforced: .git, node_modules, dist, build, .env, .env.*, secrets, credentials, __pycache__, .venv, venv

## [0.6.0] - 2026-07-06

### Added — MCP-Style Tool Manager & Safety Gate
- **Tools & MCP Page**: Full-page UI listing installed tools with enable/disable toggles, trust status, permission badges, transport type indicators, config preview, JSON test input, safety check, and call log viewer
- **Tool model**: 12-column tool schema (id, name, description, version, source, transport, command, config, permissions, enabled, trusted, timestamps) with 5 transport types (stdio, http, sse, websocket, local)
- **Permission model**: 9 granular permissions (file_read, file_write, shell_command, network, browser, git, database, clipboard, secrets) with icon and color per type
- **Safety Gate**: Every tool call passes through `checkToolSafety` — blocks disabled tools, blocks untrusted imported tools, blocks unknown tools, requires confirmation for destructive permissions, provides dry-run previews
- **Log redaction**: API keys, Bearer tokens, and secrets auto-redacted from tool call logs before storage
- **3 built-in mock tools**: `file_search_mock`, `git_status_mock`, `project_summary_mock` — never touch real files, return simulated JSON responses
- **Seed system**: Mock tools auto-seeded on app startup if they don't exist
- **Tool call logs**: `tool_call_logs` table records every attempt (approved, denied, blocked_untrusted, blocked_disabled, blocked_unknown, error) with input preview, output preview, and permission checks
- **RightInspector integration**: Suggested tools from the routing engine now shown in the Router panel with tool names visible but not auto-executed
- **Routing type extension**: New `ToolSuggestion` interface and `suggestedTools` field on `RoutingResult` for inspector display
- **16 unit tests**: Permission model coverage, transport types, log redaction patterns, disabled-by-default for imports, destructive classification, unknown tool blocking
- **3 new DB tables**: `tools` (enriched), `tool_permissions`, `tool_call_logs` with additive migration for existing databases

### Changed
- `App.tsx` route `/tools` and `/settings/tools` now render the full `ToolsPage` instead of placeholder
- `Seed.ts` now calls `toolService.seedMockTools()` after system prompt seeding
- `RoutingPolicy` now populates `suggestedTools` list for inspector display
- `tool.service.ts` `toggleEnabled` fixed from placeholder to real toggle

### Security
- All tool calls logged with redacted secrets
- Imported tools disabled and untrusted by default
- Destructive permissions (file_write, shell_command, git, database, secrets) require explicit confirmation
- Unknown tools always blocked — no auto-discovery or auto-registration

### Added — Secure GitHub Star List Importer
- **GitHub Imports screen**: Full-page UI with single URL input, bulk URL textarea, "Import Mert's Star List" button, repo table with expandable item list
- **Mert's Star List preset**: 29 curated repositories covering system prompts, agent frameworks, prompt engineering, MCP servers, and AI tooling
- **Repo classifier**: 8-category classification (system-prompt-pack, prompt-library, agent-framework-reference, skill-pack, mcp-server-list, local-model-reference, research/reference, unrelated/reference)
- **Import parser**: Multi-format support (Markdown, YAML, JSON, TXT, TOML) with title/content/tag extraction and item type detection
- **Safety engine**: Secret detection (API keys, tokens), prompt injection detection, proprietary content detection — all imported content marked untrusted by default
- **File discovery**: Whitelist of accepted extensions (.md/.mdx/.txt/.json/.yaml/.yml/.toml), 5MB size limit, skip patterns for node_modules/.git/build dirs
- **Shell injection protection**: Branch name sanitized to `[a-zA-Z0-9._/-]` before passing to git commands
- **4 database tables**: `imported_repositories`, `imported_items`, `import_warnings`, `import_logs` with additive migration
- **26 unit tests**: File acceptance, Markdown/YAML/JSON parsing, safety checks (secrets, injection, proprietary), repo classification
- **IPC layer**: 12 handlers for repo management, item management, and warning retrieval

### Changed
- `App.tsx` route `/settings/github` now renders full `GitHubImportsPage` instead of placeholder
- `github_imports` table renamed to `imported_repositories` with enriched columns (status, category, commit_hash, item counts)

### Security
- All imported content is `is_untrusted = 1` by default
- Never executes imported code — static parsing only
- Shell scripts blocked by extension filter
- Branch names sanitized against injection
- Secrets stripped from imports

## [0.4.0] - 2026-07-06

### Added — Prompt Intelligence Engine (Agent Skill Router)
- **PromptAnalyzer**: Rule-based intent classifier supporting 12 intents (coding, debugging, writing, planning, research, data_analysis, file_operation, github_operation, terminal_operation, design_request, security_review, general_chat)
- **Context detection**: Automatically detects required context (files, repo, project instructions, web access, skills)
- **Risk assessment**: Four-level risk classification (low, medium, high, destructive) with permission detection
- **AgentRegistry**: 12 built-in agent definitions (General Assistant, Code Architect, Debugger, Refactor Engineer, Test Engineer, Documentation Writer, Git Assistant, Prompt Engineer, Research Synthesizer, Data Analyst, Security Reviewer, UX/Product Designer)
- **SkillRegistry**: 28 built-in skill definitions with tags, required permissions, allowed file patterns, and versioning
- **RoutingPolicy**: Deterministic rule-based routing engine matches prompts → agents → skills → tools
- **SubagentPlanner**: Generates multi-step execution plans for complex tasks with primary + supporting agents
- **Risk warnings**: Automatic confirmation required for destructive/high-risk operations (git push, file delete, production changes)
- **RightInspector rebuilt**: Now shows intent classification, primary agent, supporting agents, risk level, selected skills, required permissions, execution plan
- **36 unit tests**: Intent classification, risk assessment, agent matching, skill matching, routing integration
- **routingStore**: Zustand store with analysis history, override support, and error handling

### Changed
- `ChatPanel` now triggers `routingAnalyze` on every send, populating the inspector in real-time
- `RightInspector` renamed from "Inspector" to "Router" with Brain icon
- `AgentRegistry` includes `file_operation` category on General Assistant for fallback coverage

## [0.3.0] - 2026-07-06

### Added — Prompt Library & Slash Command System
- **10 built-in slash commands**: /fix, /explain, /refactor, /commit, /test, /plan, /review, /summarize, /skill, /system — all with `{{variable}}` template support
- **Variable filler modal**: Captures template variables before inserting prompt into composer, with live preview
- **Favorites system**: Star prompts to filter by favorites, persist favorite state across sessions
- **Usage tracking**: Increment counter on each slash-command insert, visible on prompt cards
- **Automatic variable detection**: `{{var}}` placeholders extracted from content on create/edit, displayed below textarea
- **Import/export**: Export all prompts as JSON, import from JSON / Markdown / YAML with format auto-detection
- **Import safety**: Secret stripping (API keys, tokens) on import, ID sanitization, no code execution
- **Combined command palette**: Built-in commands + prompt library entries unified in a single `/` dropdown with category-colored icons
- **Schema migration**: Additive ALTER TABLE for `variables`, `favorite`, `usage_count` columns
- **Prompt I/O service**: Standalone import/export engine with JSON validation, Markdown frontmatter parsing, YAML parsing

### Changed
- `PromptRow` + `NewPrompt` types extended with `variables`, `favorite`, `usage_count`
- `PromptCard` now shows favorite star button and usage counter
- `PromptEditor` now detects and displays `{{variables}}` from content
- `PromptLibrary` page now has Import/Export toolbar buttons, favorites toggle, file upload handler
- `MessageInput` slash system rewritten with full 10-command palette and keyboard navigation

### Fixed
- `stripSecrets` regex now properly replaces secrets with `[REDACTED]` instead of leaking the original value
- Removed dead imports and unused state across UI components

## [0.2.0] - 2026-07-06

### Added — System Prompt Profile Engine
- **Hierarchy resolver**: 5-layer merge (global policy → project → profile → chat → task) with priority-based ordering
- **Extended metadata**: tags, category, is_archived, priority fields on system prompts
- **Archive/Restore**: Soft-delete system prompts with Active/Archived tabbed UI
- **Duplicate**: One-click profile duplication
- **Safety checker**: Automatic detection of secrets (API keys, tokens) and tool bypass attempts
- **Resolved preview modal**: Shows merged layers, active sources, and safety warnings before sending
- **Prompt profile selector**: Per-chat dropdown in the chat header to assign system prompt profiles
- **Search & tags**: Filter profiles by name, tag, or content
- **Additive migration**: ALTER TABLE for existing databases — never breaks existing data
- **15 unit tests** for the hierarchy resolver (layer ordering, secret detection, bypass detection, archived skip, priority sorting)

### Changed
- System prompt UI rebuilt with tabs (Active/Archived), inline editing with priority + category fields
- Preload API extended with 6 new IPC methods (archive, restore, duplicate, resolveHierarchy, validateSecrets, validateToolBypass)

### Fixed
- Seed data now includes `is_archived` and `priority` defaults for new columns

## [0.1.0] - 2026-07-06

### Added
- Electron desktop shell with secure IPC (contextBridge, sandbox, no nodeIntegration)
- React app shell with three-panel layout (sidebar, chat, inspector)
- Ivory warm theme with Crimson Text serif headings and Inter body text
- SQLite database with Drizzle ORM (10 tables, auto-migration, seeding)
- 8 provider adapters (Anthropic, OpenAI, Google, Mistral, Groq, DeepSeek, OpenRouter, Ollama)
- Provider settings page with secure API key management (safeStorage/DPAPI)
- System prompt profile CRUD with default/editing support
- Chat workspace with message persistence and model selection
- Prompt library with CRUD, tags, categories, and full-text search
- Slash command (`/`) integration in chat input for prompt insertion
- 5 Zustand atomic stores (ui, chat, provider, prompt, promptLibrary)
- 8 shared UI components (Button, Input, Textarea, Modal, Select, Toggle, Badge, EmptyState)
- Right inspector panel placeholder for tool transcripts

### Renamed
- Project renamed from "ivory-desktop" to "aureon-desk"
- Brand references updated from "Ivory" to "Aureon"
