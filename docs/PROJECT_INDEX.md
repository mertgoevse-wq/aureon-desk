# Vibeforge — Project Index

> **Last updated:** 2026-07-08  
> **Branch:** main  
> **Version:** 0.9.0

---

## Folder Structure

```
Vibeforge-desk/
├── src/
│   ├── main/                    # Electron main process
│   │   ├── index.ts             # App entry: migrations, seed, IPC, window
│   │   ├── windows.ts           # BrowserWindow creation & paste handler
│   │   ├── db/
│   │   │   ├── connection.ts    # SQLite via drizzle-orm
│   │   │   ├── schema.ts        # All table definitions (15 tables)
│   │   │   ├── migrate.ts       # Additive migration runner
│   │   │   └── seed.ts          # Default providers/models/prompts seeder
│   │   ├── ipc/
│   │   │   ├── index.ts         # registerAllIPC() dispatcher
│   │   │   ├── chat.ipc.ts      # Chat CRUD + send-message
│   │   │   ├── credentials.ipc.ts
│   │   │   ├── github.ipc.ts    # GitHub import handlers
│   │   │   ├── live-preview.ipc.ts
│   │   │   ├── log.ipc.ts
│   │   │   ├── project.ipc.ts
│   │   │   ├── prompt.ipc.ts    # System prompts
│   │   │   ├── promptLibrary.ipc.ts
│   │   │   ├── provider.ipc.ts  # Provider/model CRUD + test
│   │   │   ├── routing.ipc.ts   # Prompt analysis
│   │   │   ├── settings.ipc.ts
│   │   │   └── tool.ipc.ts
│   │   ├── services/            # 22 service files
│   │   │   ├── chat-completion.service.ts  # Provider adapters + streaming
│   │   │   ├── chat.service.ts             # Chat/message CRUD
│   │   │   ├── provider.service.ts         # Provider/model CRUD + canonical resolver
│   │   │   ├── live-preview.service.ts     # In-process HTTP sandbox server
│   │   │   ├── github-import.service.ts    # Repo clone + parse + safety scan
│   │   │   ├── routing-policy.ts           # Prompt intent routing rules
│   │   │   ├── prompt-analyzer.ts          # Prompt intent/risk classifier
│   │   │   └── ... (15 more service files)
│   │   ├── security/
│   │   │   └── vault.ts         # SafeStorage credential vault
│   │   └── utils/
│   │       ├── logger.ts        # Structured logger (DB + console)
│   │       └── paths.ts         # App path helpers
│   ├── preload/
│   │   ├── index.ts             # contextBridge IPC bridge (all channels)
│   │   └── index.d.ts           # TypeScript type declarations for window.api
│   ├── renderer/
│   │   ├── index.html           # HTML shell
│   │   └── src/
│   │       ├── App.tsx          # Hash router + all routes
│   │       ├── layouts/
│   │       │   ├── AppShell.tsx       # Root: sidebar + topbar + outlet + inspector
│   │       │   ├── Sidebar.tsx        # Left nav: chats, prompts, code, cowork
│   │       │   ├── RightInspector.tsx # Right panel: prompt analysis
│   │       │   └── SettingsLayout.tsx # Settings: category column + detail panel
│   │       ├── pages/
│   │       │   ├── ChatWorkspace.tsx  # Home/Chat mode (empty state + active chat)
│   │       │   ├── CoworkPage.tsx     # Cowork mode (safe placeholder shell)
│   │       │   ├── LivePreview.tsx    # Code/Preview mode
│   │       │   ├── ProjectsPage.tsx   # Projects manager
│   │       │   ├── PromptLibrary.tsx  # Prompt library browser
│   │       │   └── settings/          # 9 settings pages
│   │       ├── components/
│   │       │   ├── chat/              # ChatPanel, MessageBubble, MessageInput, ModelSelector
│   │       │   ├── sidebar/           # ChatList
│   │       │   └── shared/            # 13 shared UI components
│   │       ├── stores/                # 8 Zustand stores
│   │       ├── theme/
│   │       │   ├── tokens.css         # Full design system (CSS custom properties)
│   │       │   └── typography.css
│   │       └── hooks/
│   │           └── useIpc.ts          # IPC hook
│   └── shared/
│       ├── constants.ts         # PROVIDER_ADAPTERS (10 providers)
│       ├── star-list.ts         # Curated GitHub star list
│       └── types/               # 9 shared type files
├── tests/
│   ├── unit/                    # 13 Vitest files, 283 tests
│   └── e2e/                     # 12 Playwright Electron specs, 84 tests
├── scripts/                     # 5 scripts (verify-native, demo-coding, etc.)
├── docs/                        # Documentation (this folder)
├── assets/brand/                # Brand assets
├── build/icon.ico               # Windows app icon
├── package.json                 # npm scripts + deps
├── electron.vite.config.ts      # Vite config (main/preload/renderer)
├── electron-builder.yml         # NSIS + portable Win64 build targets
└── drizzle.config.ts            # Drizzle ORM config
```

---

## Important Entrypoints

| File | Role |
|------|------|
| `src/main/index.ts` | Electron boot: vault → migrations → seed → IPC → window |
| `src/renderer/src/main.tsx` | React mount |
| `src/renderer/src/App.tsx` | Hash router with all routes |
| `src/preload/index.ts` | contextBridge IPC bridge |

---

## Providers (10 adapters in `src/shared/constants.ts`)

| Slug | Name | Auth | Notes |
|------|------|------|-------|
| anthropic | Anthropic | api_key | Claude Sonnet 4, Opus 4, Haiku 3.5 |
| openai | OpenAI | api_key | GPT-4o, GPT-4o Mini |
| google | Google Gemini | api_key | Gemini 2.5 Pro/Flash |
| mistral | Mistral AI | api_key | Large, Small |
| groq | Groq | api_key | Llama 4 Scout |
| deepseek | DeepSeek | api_key | DeepSeek Chat |
| openrouter | OpenRouter | api_key | Auto + Free models |
| ollama | Ollama | none | Local (localhost:11434) |
| lmstudio | LM Studio | none | Local (localhost:1234) |
| custom | Custom OpenAI-Compatible | api_key | Any endpoint |

---

## Database Schema (15 tables via Drizzle ORM + better-sqlite3)

`providers`, `models`, `system_prompts`, `chats`, `messages` (with provider/model metadata), `attachments`, `prompts` (library), `projects`, `tools`, `tool_permissions`, `tool_call_logs`, `imported_repositories`, `imported_items`, `import_warnings`, `import_logs`, `approved_skills`, `settings` (KV), `app_logs`

---

## Chat Completion Flow

```
renderer: sendMessage(chatId, content, modelId)
  → IPC: chat:send-message
    → providerService.resolveCanonicalModelReference(modelId)
    → validate expectedModelId matches resolved
    → requestBuilder.build(messages, systemPrompt, tools)
    → chatCompletionService.sendMessage(request, canonicalRef)
      → adapter(anthropic|openai|google|ollama|lmstudio|openrouter)
      → streaming response chunks
    → chatService.addMessage(assistantMessage + provider metadata)
    → routingStore: update analysis
```

---

## Routing / Inspector System

- `routing-policy.ts`: Intent classification (coding/debugging/data_analysis/general_chat)
- `prompt-analyzer.ts`: Keyword extraction, risk assessment (low/medium/high/destructive)
- Right Inspector panel: shows agent assignment, risk level, intent, tools count, project context
- Agents: General Assistant, Code Architect, Debugger, Data Analyst

---

## LivePreview System

- In-process HTTP server (127.0.0.1 only, path traversal blocked)
- Templates: `html` (static counter), `vite-react` (npm scaffold), `demo` (coding agent)
- Renderer: URL bar, iframe, logs panel, restart/stop/copy-URL controls

---

## Settings System

Settings layout: category column (264px) + detail panel. Categories:
General, Providers & Models, System Prompts, Appearance, Projects, Tools & MCP,
GitHub Imports, Extensions (placeholder), Privacy & Security (placeholder),
Capabilities (placeholder), Logs, Developer

---

## Tests

```
Unit tests:   283 tests in 13 files (Vitest, jsdom)
E2E tests:    84 tests in 12 files (Playwright, Electron, 1 worker)
```

---

## Important Commands

```bash
npm run dev              # Dev mode (Vite HMR + Electron)
npm run build            # Production build
npm run typecheck        # TypeScript check
npm test                 # Unit tests (283 tests)
npm run test:e2e         # Playwright E2E (slow on Windows, ~84 tests)
npm run verify:native    # Check better-sqlite3 binary
npm run rebuild:native   # Rebuild for current Electron ABI
npm run demo:coding      # CLI coding agent self-test
npm run test:openrouter  # Live OpenRouter test (needs OPENROUTER_API_KEY env)
npm run qa:ai            # Full QA: typecheck + test + build + test:e2e
```
