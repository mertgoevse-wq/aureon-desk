# Changelog

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
