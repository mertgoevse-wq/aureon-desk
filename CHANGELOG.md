# Changelog

## [0.5.0] - 2026-07-06

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
