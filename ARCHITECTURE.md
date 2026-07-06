# Ivory Desktop — Product Architecture

> **A Windows-first desktop AI workspace.**
> Ivory background, Anthropic-inspired bold serif display typography, warm neutral surfaces.
> Local-first, secure, modular, daily-driver grade.

---

## 1. Technology Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Desktop Shell** | Electron 33+ | Mature, Windows-first, broad ecosystem |
| **Build Tool** | `electron-vite` | Unified config for main/preload/renderer, HMR, TypeScript |
| **Packaging** | `electron-builder` | NSIS installer for Windows, code signing, auto-update |
| **UI Framework** | React 19 + TypeScript 5.7 | Industry standard, massive ecosystem |
| **Styling** | Tailwind CSS 4 + CSS custom properties | Utility-first + design tokens for the ivory theme |
| **State** | Zustand 5 (atomic stores) | Lightweight, selector-based, persist middleware |
| **Database** | `better-sqlite3` + Drizzle ORM | Native SQLite binding, type-safe schema/migrations |
| **Credentials** | Electron `safeStorage` API | DPAPI-backed on Windows, machine-local, zero deps |
| **IPC** | `contextBridge` + `ipcMain.handle` | Context isolation, typed contract, no remote module |
| **Routing** | `react-router-dom` v7 | Nested layouts for settings, projects, etc. |
| **Icons** | `lucide-react` | Clean, consistent, MIT-licensed |
| **Code Editor** | `@monaco-editor/react` | System prompt editing, JSON config |
| **Markdown** | `react-markdown` + `rehype-highlight` | Chat message rendering |
| **Testing** | Vitest + React Testing Library | Fast, Vite-native, component testing |

---

## 2. Folder Structure

```
ivory-desktop/
├── electron.vite.config.ts
├── electron-builder.yml
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── tsconfig.web.json
├── tailwind.config.ts
├── drizzle.config.ts
├── ARCHITECTURE.md
├── src/
│   ├── main/                         # Electron Main Process
│   │   ├── index.ts                  # App entry, window creation, lifecycle
│   │   ├── windows.ts                # Window factory (main, settings, onboarding)
│   │   ├── ipc/                      # IPC handler registrations
│   │   │   ├── index.ts              # Registers all handlers
│   │   │   ├── chat.ipc.ts           # Chat CRUD, message CRUD
│   │   │   ├── provider.ipc.ts       # Provider/API key CRUD
│   │   │   ├── prompt.ipc.ts         # System prompts, prompt library CRUD
│   │   │   ├── project.ipc.ts        # Project CRUD
│   │   │   ├── tool.ipc.ts           # MCP/tool manager CRUD
│   │   │   ├── settings.ipc.ts       # App settings read/write
│   │   │   ├── filesystem.ipc.ts     # File/folder access
│   │   │   ├── github.ipc.ts         # GitHub import operations
│   │   │   └── credentials.ipc.ts    # Encrypt/decrypt secrets
│   │   ├── db/                       # Database layer
│   │   │   ├── connection.ts         # better-sqlite3 init + WAL mode
│   │   │   ├── schema.ts             # Drizzle ORM schema (all tables)
│   │   │   ├── migrations/           # Drizzle migration files
│   │   │   └── seed.ts               # Default providers, sample prompts
│   │   ├── services/                 # Business logic
│   │   │   ├── chat.service.ts
│   │   │   ├── provider.service.ts
│   │   │   ├── prompt.service.ts
│   │   │   ├── project.service.ts
│   │   │   ├── tool.service.ts
│   │   │   ├── credential.service.ts # safeStorage encrypt/decrypt
│   │   │   ├── github.service.ts     # GitHub API, repo cloning
│   │   │   └── filesystem.service.ts # File/folder operations
│   │   ├── adapters/                 # Provider & tool adapters
│   │   │   ├── providers/            # LLM provider adapters
│   │   │   │   ├── base.ts           # Abstract base + interface
│   │   │   │   ├── anthropic.ts
│   │   │   │   ├── openai.ts
│   │   │   │   ├── google.ts
│   │   │   │   ├── mistral.ts
│   │   │   │   ├── groq.ts
│   │   │   │   ├── deepseek.ts
│   │   │   │   ├── openrouter.ts
│   │   │   │   ├── ollama.ts         # Local
│   │   │   │   └── registry.ts       # Provider registry + factory
│   │   │   └── tools/                # Tool adapters
│   │   │       ├── base.ts           # Abstract tool interface
│   │   │       ├── mcp-client.ts     # MCP protocol client (stdio/SSE)
│   │   │       ├── mcp-registry.ts   # Discover/register MCP servers
│   │   │       └── builtin/          # Built-in tools
│   │   │           ├── file-read.ts
│   │   │           ├── file-write.ts
│   │   │           ├── shell.ts
│   │   │           └── web-search.ts
│   │   ├── security/                 # Security utilities
│   │   │   └── vault.ts              # safeStorage wrapper
│   │   └── utils/
│   │       ├── paths.ts              # App data paths, DB path
│   │       └── logger.ts             # Structured logging
│   │
│   ├── preload/                      # Preload scripts (contextBridge)
│   │   ├── index.ts                  # Exposes typed `window.api` object
│   │   └── index.d.ts               # Global type declarations
│   │
│   ├── renderer/                     # React Application
│   │   ├── index.html
│   │   ├── src/
│   │   │   ├── main.tsx              # React entry point
│   │   │   ├── App.tsx               # Root router + layout shell
│   │   │   │
│   │   │   ├── layouts/
│   │   │   │   ├── AppShell.tsx       # Left sidebar + content + right panel
│   │   │   │   ├── Sidebar.tsx        # Navigation sidebar
│   │   │   │   ├── RightInspector.tsx # Right panel host
│   │   │   │   └── SettingsLayout.tsx # Settings page wrapper
│   │   │   │
│   │   │   ├── pages/
│   │   │   │   ├── ChatWorkspace.tsx  # Main chat view
│   │   │   │   ├── Onboarding.tsx     # First-run wizard
│   │   │   │   ├── settings/
│   │   │   │   │   ├── ProvidersPage.tsx
│   │   │   │   │   ├── PromptsPage.tsx
│   │   │   │   │   ├── ToolsPage.tsx
│   │   │   │   │   ├── AppearancePage.tsx
│   │   │   │   │   ├── ProjectsPage.tsx
│   │   │   │   │   ├── GitHubPage.tsx
│   │   │   │   │   └── LogsPage.tsx
│   │   │   │   ├── PromptLibrary.tsx
│   │   │   │   └── ProjectExplorer.tsx
│   │   │   │
│   │   │   ├── components/
│   │   │   │   ├── chat/
│   │   │   │   │   ├── ChatPanel.tsx        # Message list + input
│   │   │   │   │   ├── MessageBubble.tsx    # Single message
│   │   │   │   │   ├── MessageInput.tsx     # Composer with slash commands
│   │   │   │   │   ├── ModelSelector.tsx    # Per-chat model picker
│   │   │   │   │   ├── PromptProfileSelect.tsx
│   │   │   │   │   ├── AttachFileButton.tsx
│   │   │   │   │   ├── ToolCallCard.tsx     # Tool call display
│   │   │   │   │   └── StreamingText.tsx    # Animated streaming
│   │   │   │   ├── sidebar/
│   │   │   │   │   ├── ChatList.tsx         # Conversation list
│   │   │   │   │   ├── ChatListItem.tsx
│   │   │   │   │   ├── NewChatButton.tsx
│   │   │   │   │   └── SearchBar.tsx
│   │   │   │   ├── inspector/
│   │   │   │   │   ├── ToolTranscript.tsx   # Tool call history
│   │   │   │   │   ├── ContextViewer.tsx    # Current context tokens
│   │   │   │   │   └── FilePreview.tsx
│   │   │   │   ├── prompts/
│   │   │   │   │   ├── PromptEditor.tsx
│   │   │   │   │   ├── PromptCard.tsx
│   │   │   │   │   └── TagInput.tsx
│   │   │   │   └── shared/
│   │   │   │       ├── Button.tsx
│   │   │   │       ├── Input.tsx
│   │   │   │       ├── Select.tsx
│   │   │   │       ├── Modal.tsx
│   │   │   │       ├── Toggle.tsx
│   │   │   │       ├── Badge.tsx
│   │   │   │       ├── EmptyState.tsx
│   │   │   │       └── KeyboardShortcut.tsx
│   │   │   │
│   │   │   ├── stores/               # Zustand atomic stores
│   │   │   │   ├── chatStore.ts
│   │   │   │   ├── uiStore.ts        # Panels, sidebar width, theme
│   │   │   │   ├── settingsStore.ts   # Persisted preferences
│   │   │   │   ├── providerStore.ts
│   │   │   │   ├── promptStore.ts
│   │   │   │   ├── projectStore.ts
│   │   │   │   └── toolStore.ts
│   │   │   │
│   │   │   ├── hooks/
│   │   │   │   ├── useIpc.ts          # Typed IPC call wrapper
│   │   │   │   ├── useKeyboard.ts     # Global shortcuts
│   │   │   │   ├── useTheme.ts
│   │   │   │   └── useChat.ts         # Chat state + streaming
│   │   │   │
│   │   │   ├── theme/
│   │   │   │   ├── tokens.css         # CSS custom properties
│   │   │   │   └── typography.css     # Font definitions
│   │   │   │
│   │   │   └── types/
│   │   │       └── ipc.ts             # Shared IPC types (also used by main)
│   │   │
│   │   └── public/
│   │       └── fonts/                 # Local font files
│   │
│   └── shared/                        # Shared between main + renderer
│       ├── types/
│       │   ├── chat.ts
│       │   ├── provider.ts
│       │   ├── prompt.ts
│       │   ├── project.ts
│       │   ├── tool.ts
│       │   └── settings.ts
│       └── constants.ts               # Provider defaults, limits
```

---

## 3. Screen Map & Navigation

```
┌────────────────────────────────────────────────────────────┐
│  ONBOARDING (first run only)                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Step 1: Welcome + Theme preview                      │  │
│  │ Step 2: Add first provider + API key                 │  │
│  │ Step 3: Choose default model                         │  │
│  │ Step 4: Create first system prompt profile (optional)│  │
│  │ Step 5: Ready → Enter workspace                      │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────┐
│  APP SHELL (persistent)                                    │
│  ┌──────────┬────────────────────────┬──────────────────┐  │
│  │          │                        │                  │  │
│  │ SIDEBAR  │    CONTENT AREA        │  RIGHT INSPECTOR │  │
│  │          │                        │                  │  │
│  │ • Search │  ┌──────────────────┐  │  • Tool Transcript│  │
│  │ • Chats  │  │  CHAT WORKSPACE  │  │  • Context Stats  │  │
│  │   - list │  │  ┌────────────┐  │  │  • File Preview   │  │
│  │ • Projects│  │  │ Messages   │  │  │                  │  │
│  │ • Prompts│  │  │ (scrollable)│  │  │  (collapsible)   │  │
│  │ • Tools  │  │  └────────────┘  │  │                  │  │
│  │          │  │  ┌────────────┐  │  │                  │  │
│  │ + Settings│  │  │ Input Bar  │  │  │                  │  │
│  │          │  │  │ + model    │  │  │                  │  │
│  │          │  │  │ + attach   │  │  │                  │  │
│  │          │  │  └────────────┘  │  │                  │  │
│  │          │  └──────────────────┘  │                  │  │
│  └──────────┴────────────────────────┴──────────────────┘  │
└────────────────────────────────────────────────────────────┘

SETTINGS (modal or routed page):
  ├── Providers & API Keys
  ├── System Prompt Profiles
  ├── Prompt Library
  ├── Tools / MCP Extensions
  ├── Projects
  ├── GitHub Imports
  ├── Appearance / Theme
  └── Logs / Debug

PROMPT LIBRARY (standalone page accessible from sidebar):
  ├── Browse all prompt templates
  ├── Search, tag filter
  ├── Create / edit / delete
  ├── Import from file

PROJECT EXPLORER:
  ├── List projects
  ├── Create project (name + instructions + folder)
  ├── Open project workspace
  └── Project-level chat threads
```

---

## 4. Data Schema (Drizzle ORM / SQLite)

### 4.1 `providers` — LLM Provider Configurations

```sql
CREATE TABLE providers (
  id            TEXT PRIMARY KEY,           -- UUID
  name          TEXT NOT NULL,              -- "Anthropic", "OpenAI", etc.
  slug          TEXT NOT NULL UNIQUE,       -- "anthropic", "openai"
  adapter       TEXT NOT NULL,              -- Which adapter class to use
  base_url      TEXT,                       -- Custom API base URL (for proxies/Ollama)
  api_key_enc   TEXT,                       -- encrypted(safeStorage) API key
  is_enabled    INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL,              -- ISO 8601
  updated_at    TEXT NOT NULL
);
```

### 4.2 `models` — Available Models per Provider

```sql
CREATE TABLE models (
  id            TEXT PRIMARY KEY,
  provider_id   TEXT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,              -- "claude-sonnet-4-20250514"
  display_name  TEXT NOT NULL,              -- "Claude Sonnet 4"
  context_window INTEGER,                  -- Max token context
  is_default    INTEGER NOT NULL DEFAULT 0,
  is_enabled    INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL
);
```

### 4.3 `system_prompts` — System Prompt Profiles

```sql
CREATE TABLE system_prompts (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  description   TEXT,
  content       TEXT NOT NULL,              -- The system prompt text
  is_default    INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);
```

### 4.4 `chats` — Conversation Threads

```sql
CREATE TABLE chats (
  id            TEXT PRIMARY KEY,
  title         TEXT NOT NULL DEFAULT 'New Chat',
  model_id      TEXT REFERENCES models(id),
  system_prompt_id TEXT REFERENCES system_prompts(id),
  project_id    TEXT REFERENCES projects(id) ON DELETE SET NULL,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL,
  archived      INTEGER NOT NULL DEFAULT 0
);
```

### 4.5 `messages` — Individual Messages

```sql
CREATE TABLE messages (
  id            TEXT PRIMARY KEY,
  chat_id       TEXT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  role          TEXT NOT NULL,              -- 'system' | 'user' | 'assistant' | 'tool'
  content       TEXT NOT NULL,
  tool_calls    TEXT,                       -- JSON array of tool calls
  tool_call_id  TEXT,                       -- For tool result messages
  token_count   INTEGER,                    -- Approximate token count
  created_at    TEXT NOT NULL,
  sort_order    INTEGER NOT NULL            -- For message ordering
);
```

### 4.6 `attachments` — Files Attached to Messages

```sql
CREATE TABLE attachments (
  id            TEXT PRIMARY KEY,
  message_id    TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  file_name     TEXT NOT NULL,
  file_path     TEXT NOT NULL,              -- Absolute path on disk
  mime_type     TEXT,
  file_size     INTEGER,
  content       TEXT,                       -- Extracted text content for context
  created_at    TEXT NOT NULL
);
```

### 4.7 `prompts` — Prompt Library / Templates

```sql
CREATE TABLE prompts (
  id            TEXT PRIMARY KEY,
  title         TEXT NOT NULL,
  content       TEXT NOT NULL,
  description   TEXT,
  tags          TEXT,                       -- JSON array of tag strings
  category      TEXT,                       -- "coding", "writing", "analysis", etc.
  source        TEXT,                       -- "local" | "github:owner/repo"
  source_path   TEXT,                       -- Path within imported repo
  is_template   INTEGER NOT NULL DEFAULT 0, -- Has {{placeholder}} variables
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);
```

### 4.8 `projects` — Workspaces

```sql
CREATE TABLE projects (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  description   TEXT,
  instructions  TEXT,                       -- Project-level system instructions
  root_path     TEXT,                       -- Local folder path
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);
```

### 4.9 `tools` — MCP Servers & Tool Configurations

```sql
CREATE TABLE tools (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  type          TEXT NOT NULL,              -- 'builtin' | 'mcp-stdio' | 'mcp-sse'
  config        TEXT NOT NULL,              -- JSON: command, args, env, url, etc.
  description   TEXT,
  is_enabled    INTEGER NOT NULL DEFAULT 1,
  source        TEXT,                       -- "local" | "github:owner/repo"
  source_path   TEXT,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);
```

### 4.10 `github_imports` — Tracked GitHub Imports

```sql
CREATE TABLE github_imports (
  id            TEXT PRIMARY KEY,
  repo_url      TEXT NOT NULL,              -- https://github.com/owner/repo
  branch        TEXT DEFAULT 'main',
  local_path    TEXT NOT NULL,              -- Where repo is cloned locally
  import_type   TEXT NOT NULL,              -- 'prompts' | 'tools' | 'both'
  last_synced   TEXT,
  created_at    TEXT NOT NULL
);
```

### 4.11 `settings` — Key-Value App Settings

```sql
CREATE TABLE settings (
  key           TEXT PRIMARY KEY,
  value         TEXT NOT NULL               -- JSON-encoded value
);
```

---

## 5. Security Model

### Principle: Defense in Depth for a Local-First App

```
┌─────────────────────────────────────────────────────────────┐
│  THREAT MODEL (Local Desktop App)                           │
│                                                             │
│  Adversary: malware on user's machine, physical access      │
│  Trust boundary: app process is trusted; renderer is not    │
│  Attack surface: XSS in renderer, malicious MCP tools       │
└─────────────────────────────────────────────────────────────┘
```

### 5.1 API Key Storage

```
                         ┌──────────────────┐
  User enters API key ──▶│  Renderer (React) │
                         └──────┬───────────┘
                                │ IPC: 'credentials:store'
                                ▼
                         ┌──────────────────┐
                         │  Main Process     │
                         │  credential.svc   │
                         └──────┬───────────┘
                                │ safeStorage.encryptString()
                                ▼
                         ┌──────────────────┐
                         │  SQLite DB        │
                         │  providers.api_   │
                         │  key_enc (BLOB)   │
                         └──────────────────┘
```

- **Encryption:** `safeStorage.encryptString()` → DPAPI on Windows (user-scoped)
- **At rest:** Only encrypted blobs in SQLite
- **In memory:** Key decrypted only when making API calls, then zeroed
- **Renderer never sees raw key:** Returns masked value (e.g., `sk-ant-...****`)
- **Export:** Keys are NEVER exported; export config excludes `api_key_enc`

### 5.2 IPC Security

- `contextIsolation: true` — mandatory
- `nodeIntegration: false` — renderer has zero Node.js access
- `sandbox: true` — renderer sandboxed
- All IPC uses `ipcMain.handle` / `ipcRenderer.invoke` (not `send`/`on`)
- Preload exposes only typed function signatures via `contextBridge`
- No `eval()`, no `Function()` in renderer (CSP header)

### 5.3 MCP Server Sandboxing

- MCP servers run as child processes (stdio) or network clients (SSE)
- Tool calls are logged with full audit trail
- User must explicitly enable each MCP server
- File system tools are scoped to project root or user-approved directories
- Shell commands require user confirmation (configurable)

---

## 6. Provider Adapter Design

### 6.1 Base Interface

```typescript
// src/main/adapters/providers/base.ts

interface ProviderAdapter {
  readonly providerId: string;
  readonly displayName: string;

  /** List available models for this provider */
  listModels(): Promise<ModelInfo[]>;

  /** Send a chat completion request */
  chat(request: ChatRequest): AsyncGenerator<ChatChunk>;

  /** Validate an API key */
  validateKey(apiKey: string): Promise<boolean>;

  /** Estimate token count */
  countTokens(messages: Message[]): number;
}

interface ChatRequest {
  model: string;
  messages: Message[];
  systemPrompt?: string;
  tools?: ToolDefinition[];
  maxTokens?: number;
  temperature?: number;
  stopSequences?: string[];
}

interface ChatChunk {
  type: 'text' | 'tool_call' | 'tool_call_result' | 'done' | 'error';
  content?: string;
  toolCall?: ToolCallDelta;
  error?: string;
}
```

### 6.2 Provider Registry

```typescript
// src/main/adapters/providers/registry.ts

class ProviderRegistry {
  private adapters: Map<string, ProviderAdapter> = new Map();

  register(adapter: ProviderAdapter): void;
  get(slug: string): ProviderAdapter | undefined;
  list(): ProviderAdapter[];

  /** Create a client from stored provider config */
  createClient(providerConfig: ProviderRow, decryptedKey: string): ProviderAdapter;
}
```

### 6.3 Supported Providers (Phase 2)

| Provider | Adapter File | API Style |
|----------|-------------|-----------|
| Anthropic | `anthropic.ts` | Messages API (streaming) |
| OpenAI | `openai.ts` | Chat Completions API |
| Google Gemini | `google.ts` | Generative Language API |
| Mistral | `mistral.ts` | Chat Completions API |
| Groq | `groq.ts` | OpenAI-compatible |
| DeepSeek | `deepseek.ts` | OpenAI-compatible |
| OpenRouter | `openrouter.ts` | OpenAI-compatible |
| Ollama (local) | `ollama.ts` | OpenAI-compatible local |

---

## 7. MCP / Tool Manager Design

### 7.1 Architecture

```
┌──────────────────────────────────────────────────────┐
│                   TOOL MANAGER                        │
│                                                      │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │ Built-in     │  │ MCP (stdio)  │  │ MCP (SSE)   │ │
│  │ Tools        │  │ Tools        │  │ Tools       │ │
│  │              │  │              │  │             │ │
│  │ file-read    │  │ child_process│  │ HTTP/SSE    │ │
│  │ file-write   │  │ spawn        │  │ client      │ │
│  │ shell        │  │ JSON-RPC     │  │ JSON-RPC    │ │
│  │ web-search   │  │ over stdin   │  │ over HTTP   │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬──────┘ │
│         │                 │                  │        │
│         └─────────┬───────┴──────────────────┘        │
│                   ▼                                   │
│         ┌─────────────────┐                          │
│         │  Tool Executor   │                          │
│         │  - execution log │                          │
│         │  - confirmation  │                          │
│         │  - sandbox       │                          │
│         └─────────────────┘                          │
└──────────────────────────────────────────────────────┘
```

### 7.2 Tool Definition

```typescript
interface ToolDefinition {
  name: string;
  description: string;
  parameters: JSONSchema;
}

interface ToolResult {
  toolCallId: string;
  content: string;
  isError?: boolean;
}
```

### 7.3 MCP Client

- Implements MCP protocol (JSON-RPC over stdio or SSE)
- Discovers tools from MCP server at connection time
- Routes tool calls to the correct MCP server
- Handles server lifecycle (start, health check, stop)

---

## 8. System Prompt Hierarchy

```
┌─────────────────────────────────────────┐
│  LAYER 4: Per-Message System Prompt     │  (highest priority)
│  (inline /command overrides)            │
├─────────────────────────────────────────┤
│  LAYER 3: Per-Chat System Prompt Profile│
│  (selected in model selector dropdown)  │
├─────────────────────────────────────────┤
│  LAYER 2: Project Instructions          │
│  (from project.instructions)            │
├─────────────────────────────────────────┤
│  LAYER 1: Global Default System Prompt  │
│  (from system_prompts where is_default) │
├─────────────────────────────────────────┤
│  LAYER 0: Provider Safety Injections    │  (lowest priority)
│  (safety prompts injected automatically)│
└─────────────────────────────────────────┘
```

**Merge Rule:** Layers stack from bottom to top. Higher layers can reference lower layers via `{{LAYER_N}}` template variables. The final system prompt sent to the API is the concatenation of all active layers, separated by `\n\n---\n\n`.

---

## 9. GitHub Prompt/Skill Import Specification

### 9.1 Repo Structure Convention

Imported repos must follow this layout:

```
owner/ivory-prompts/
├── ivory.json                    # Manifest file
│   {
│     "name": "My Prompt Pack",
│     "version": "1.0.0",
│     "type": "prompts",          // "prompts" | "tools" | "both"
│     "author": "...",
│     "description": "..."
│   }
├── prompts/
│   ├── code-review.md
│   ├── api-designer.md
│   └── writing/
│       └── blog-post.md
├── tools/                        # If type includes "tools"
│   ├── ivory-tools.json          # Tool manifest
│   └── mcp-servers/
│       └── my-server/
│           └── package.json
└── skills/                       # Skill packs
    └── python-expert.md
```

### 9.2 Import Flow

```
1. User enters GitHub repo URL
2. App clones repo to %APPDATA%/ivory-desktop/imports/{owner}-{repo}/
3. Parse ivory.json manifest
4. If type=prompts: scan prompts/ directory for .md, .json, .yaml files
5. Each file becomes a prompt template entry in prompts table
6. If type=tools: read ivory-tools.json, register MCP servers
7. Store import record in github_imports table
8. Provide "sync" button to git pull updates
```

### 9.3 Prompt File Format

Each `.md` file is a prompt template with YAML frontmatter:

```markdown
---
title: Code Review Assistant
tags: [coding, review]
category: coding
template: true
variables:
  - name: language
    description: Programming language
  - name: focus
    description: What to focus on
---

You are an expert code reviewer specializing in {{language}}.
Focus your review on {{focus}}.

Review the following code:
```

---

## 10. Implementation Roadmap

### Phase 2.1 — Foundation Shell (current)
```
[x] ARCHITECTURE.md written
[ ] Electron + electron-vite scaffold
[ ] React app shell with AppShell layout (sidebar + content + inspector)
[ ] CSS custom properties ivory theme + typography
[ ] Left sidebar (ChatList, nav items)
[ ] Main chat panel (ChatPanel, MessageBubble, MessageInput)
[ ] Right inspector panel (collapsible, placeholder)
```

### Phase 2.2 — Data Layer
```
[ ] better-sqlite3 + Drizzle ORM schema
[ ] Database connection + WAL mode
[ ] IPC bridge layer (typed handlers)
[ ] Chat CRUD via IPC
[ ] Message persistence
[ ] Local chat history loading
```

### Phase 2.3 — Settings & Configuration
```
[ ] Settings shell (routed pages)
[ ] Provider settings page (CRUD)
[ ] Secure API key storage (safeStorage)
[ ] System prompt profile CRUD
[ ] Model selection per chat
```

### Phase 2.4 — Prompt Library
```
[ ] Prompt library page
[ ] Prompt CRUD
[ ] Tag system + search
[ ] Template variables
[ ] Slash command integration in chat input
```

### Phase 2.5 — Projects
```
[ ] Project CRUD
[ ] Project-level instructions
[ ] File/folder browser
[ ] Project-scoped chats
```

### Phase 2.6 — Tools & MCP
```
[ ] Tool manager page
[ ] MCP client (stdio + SSE)
[ ] Built-in tools (file read/write, shell)
[ ] Tool call transcript panel
```

### Phase 2.7 — GitHub Imports
```
[ ] GitHub import page
[ ] Repo cloning
[ ] ivory.json parsing
[ ] Prompt/tool import from repo
[ ] Sync/update flow
```

### Phase 2.8 — Polish
```
[ ] Logs/debug panel
[ ] Keyboard shortcuts
[ ] Onboarding wizard
[ ] Export/import app config
[ ] Appearance settings (font size, spacing)
[ ] Performance optimization
```

---

## 11. Design Tokens — Ivory Theme

```
┌─────────────────────────────────────────────┐
│  COLOR PALETTE                               │
│                                              │
│  --ivory-bg:         #FAF8F5    (main bg)   │
│  --ivory-surface:    #F5F1EB    (cards)     │
│  --ivory-surface-2:  #EDE7DD    (hover)     │
│  --ivory-border:     #E0D8CC    (borders)   │
│  --ivory-text:       #2C2416    (primary)   │
│  --ivory-text-2:     #6B5E4A    (secondary) │
│  --ivory-text-3:     #9B8D7A    (muted)     │
│  --ivory-accent:     #C75B39    (warm rust) │
│  --ivory-accent-2:   #8B5E3C    (warm brown)│
│  --ivory-success:    #5C8A5E                 │
│  --ivory-warning:    #C2953E                 │
│  --ivory-error:      #B8453C                 │
│                                              │
│  TYPOGRAPHY                                  │
│                                              │
│  --font-display:  'Crimson Text', Georgia,   │
│                    serif                     │
│  --font-body:     'Inter', -apple-system,    │
│                    sans-serif                │
│  --font-mono:     'JetBrains Mono', monospace│
│                                              │
│  SPACING                                     │
│                                              │
│  --space-xs:  4px                            │
│  --space-sm:  8px                            │
│  --space-md:  16px                           │
│  --space-lg:  24px                           │
│  --space-xl:  32px                           │
│  --space-2xl: 48px                           │
│                                              │
│  RADIUS                                      │
│                                              │
│  --radius-sm: 4px                            │
│  --radius-md: 8px                            │
│  --radius-lg: 12px                           │
└─────────────────────────────────────────────┘
```

---

*End of Phase 1: Product Architecture. Ready for Phase 2 implementation upon approval.*
