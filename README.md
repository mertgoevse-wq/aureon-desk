# Aureon Desk

<p align="center">
  <img src="assets/brand/aureon-logo.svg" alt="Aureon Desk" width="360" />
</p>

A Windows-first desktop AI workspace with multi-provider chat, projects, and tool integrations.

## Tech Stack

- **Shell:** Electron 43 + electron-vite 5
- **UI:** React 19 + TypeScript 5.7
- **Styling:** Tailwind CSS 4 + ivory warm theme
- **State:** Zustand 5 (atomic stores)
- **Database:** better-sqlite3 + Drizzle ORM
- **Security:** Electron safeStorage (DPAPI on Windows)

## Quick Start

### Windows Native Dependencies

The project uses `better-sqlite3`, which requires a compiled native addon. On Windows, you need **Visual Studio Build Tools** with the **Desktop development with C++** workload.

**One-time setup:**
1. Download and install [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022)
2. During installation, select **"Desktop development with C++"**
3. After installation, run:
   ```bash
   npm install
   npm run rebuild:native
   ```

**Verify the native module is ready:**
```bash
npm run verify:native
```

**If you get a blank screen or "native module missing" error:**
```bash
npm run rebuild:native
```

**Without Visual Studio Build Tools:**
- CI/CD (GitHub Actions) builds automatically — no local VS needed
- For packaging only: `npm run dist:win -- --config.npmRebuild=false`
- For development: VS Build Tools are required for the native SQLite module

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Package for Windows (NSIS installer + portable)
npm run dist:win

# Build + package in one step
npm run package

# Start production build
npm start
```

### Packaging Requirements

- **Local:** Visual Studio Build Tools (for native module rebuilds)
- **Without VS:** `npm run dist:win -- --config.npmRebuild=false`
- **CI:** GitHub Actions builds automatically on push to main/master and tags (`v*`)

Output files in `dist/`:
- `AureonDesk-Setup-0.9.0-x64.exe` (NSIS installer)
- `AureonDesk-Portable-0.9.0-x64.exe` (standalone portable)

## Current Status (Phase 2)

- ✅ Electron shell with secure IPC
- ✅ React app shell (sidebar + chat + inspector)
- ✅ Ivory warm theme with serif display typography
- ✅ Chat with message persistence (SQLite)
- ✅ Provider & API key management (8 providers)
- ✅ **System Prompt Profile Engine** (CRUD, archive, duplicate, hierarchy resolver, safety checks)
- ✅ **GitHub Star List Importer** (29 repos, multi-format parser, safety engine, classifier, approve→Prompt Library/System Profiles/Skill Registry, retry failed imports, warning details)
- ✅ **MCP-Style Tool Manager & Safety Gate** (3 mock tools, 9 permissions, call logs, safety gate, 93 tests total)
- ✅ Prompt Intelligence Engine (12 intents, 12 agents, 28 skills, rule-based routing)
- ✅ Prompt library with tags, categories, search, favorites, usage tracking
- ✅ Slash command integration with combined built-in + library palette
- ✅ Right inspector panel now shows routing analysis on every message
- ✅ Secure credential vault (safeStorage)
- ✅ Unit tests (15 passing for hierarchy resolver)
- ✅ **Projects & Local Folder Access** (file tree, context builder, instructions, defaults, 117 tests total)
- ✅ **Logs & Debug Panel** (unified redaction, audit trail, debug bundle export, 142 tests total)
- ✅ **Windows Packaging**: NSIS installer + portable, asar, app icon, GitHub Actions CI (142 tests)
- ✅ **Stabilization Pass**: Bug fixes, route aliases, dead code removal, docs (MVP_TEST_PLAN, SECURITY_NOTES, ROADMAP)
- ✅ **Real Chat Completion Engine**: Send messages to configured providers (OpenAI, Anthropic, Gemini, Ollama, LM Studio, OpenRouter, Groq, Mistral, DeepSeek, custom) with loading states, error handling, and retry
- ✅ **Local Provider Support**: Ollama native API + OpenAI-compatible fallback, LM Studio, custom OpenAI-compatible endpoints with offline detection and friendly error messages
- ✅ **Provider Test Center**: Per-provider connectivity checks, "Test All", key/local status badges, latency, sanitized error details, and last-checked timestamps
- ✅ **Premium UI & Desktop Shell Polish**: Frameless custom titlebar window, integrated navigation history, soft warm ivory themes, time-aware greetings
- ✅ **Safe Cowork Mode Dashboard**: Safe agent workflows, task creation composer, interactive execution lifecycles, and manual safety gates
- ✅ **Interactive Code Mode Workspace**: Project selector, file tree summary filtering `.env`/`.git`/`node_modules`, live preview frames, and execution logs console
- 🔜 Streaming responses & cancel mid-request

## Local Provider Setup

### Ollama
1. [Install Ollama](https://ollama.com) and start it:
   ```bash
   ollama serve
   ```
2. Pull a model:
   ```bash
   ollama pull llama3.2
   ```
3. In Aureon Desk, go to **Settings → Providers** and enable the Ollama provider
4. Models are auto-detected from Ollama on startup. You can also manually sync via the "Test" button

### LM Studio
1. [Install LM Studio](https://lmstudio.ai)
2. Load a model and start the local server (default port 1234)
3. In Aureon Desk, enable the LM Studio provider in Settings

### Custom OpenAI-Compatible
1. Start any OpenAI-compatible server (e.g., vLLM, text-generation-webui)
2. In Aureon Desk, click **Add Custom** in Settings → Providers
3. Enter the server URL and optional API key

## Remote Provider Setup

### Anthropic (Claude)
1. Get an API key from [console.anthropic.com](https://console.anthropic.com)
2. In Aureon Desk, go to **Settings → Providers** and enter your key
3. Select a Claude model (Sonnet 4, Opus 4, Haiku 3.5) from the model list

### OpenRouter
1. Get an API key from [openrouter.ai/keys](https://openrouter.ai/keys)
2. In Aureon Desk, enter the key in Settings → Providers → OpenRouter
3. OpenRouter provides access to 200+ models — use "Auto" for best results

### Google Gemini
1. Get an API key from [aistudio.google.com](https://aistudio.google.com)
2. In Aureon Desk, enter the key in Settings → Providers → Google Gemini
3. Gemini offers a generous free tier for testing

### Security
- All API keys are encrypted with your OS credentials (DPAPI on Windows)
- Keys are **never** stored in plaintext on disk
- All log output is redacted to remove API keys and tokens
- Remote provider warning displayed before sending project file context

### Provider Test Center

Open **Settings -> Providers** to run connection checks:

- **Test** checks one provider and reports sanitized success/failure details inline
- **Test All** checks every configured provider sequentially
- Local providers show "No key needed"; remote providers show "Key stored" or "Missing key"
- Results include latency and last checked time without exposing API keys

### OpenRouter Smoke Test

Test the OpenRouter integration without hardcoding any keys:

```bash
# Requires OPENROUTER_API_KEY environment variable
npm run test:openrouter

# Windows: set OPENROUTER_API_KEY=sk-or-v1-... && npm run test:openrouter
# bash:    OPENROUTER_API_KEY=sk-or-v1-... npm run test:openrouter
```

The test uses the `openrouter/free` model (free tier, no cost) and never prints your API key. If the env var is missing, the test skips gracefully.

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Production build |
| `npm run start` | Run from build output |
| `npm run typecheck` | TypeScript check |
| `npm run test` | Run Vitest unit tests |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run test:e2e` | Run Playwright E2E tests (requires build first) |
| `npm run test:e2e:headed` | Run E2E tests in headed mode (watch Playwright interact) |
| `npm run test:e2e:debug` | Run E2E tests with Playwright debugger |
| `npm run test:e2e:report` | Show Playwright HTML test report |
| `npm run qa:ai` | Full AI QA pipeline: typecheck → unit tests → build → E2E tests |
| `npm run demo:coding` | Run self-test coding agent demo (generates + verifies counter app) |
| `npm run lint` | Lint check (typecheck) |
| `npm run dist:win` | Build Windows NSIS installer + portable |
| `npm run package` | Build + package for Windows |
| `npm run pack` | Directory-only build (for testing) |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` | Open command palette |
| `Ctrl+N` | New chat |
| `Ctrl+Shift+P` | Open prompt library |
| `Ctrl+,` | Open settings |
| `Ctrl+L` | Focus message composer |
| `Ctrl+B` | Toggle sidebar |
| `Ctrl+I` | Toggle inspector panel |
| `Esc` | Close modals / command palette |
| `Ctrl+/` or `F1` | Show keyboard shortcuts help |

### Panel Resizing
- **Left sidebar**: Drag the right edge to resize (200–500px)
- **Right inspector**: Drag the left edge to resize (260–600px)
- Panel sizes are persisted across sessions
- Use `Ctrl+K` → "Reset Layout" to restore defaults

## LivePreview Workspace

The LivePreview workspace lets you generate and preview small apps (HTML, Vite+React) safely within Aureon Desk.

### Features
- **Sandboxed preview**: Creates isolated project folders under your user data directory
- **Template types**: HTML (single file) or Vite+React (full project scaffold)
- **In-process static runner**: HTML and Coding Demo previews run through an Electron main-process HTTP server bound to `127.0.0.1`
- **Vite runner**: Vite+React previews still use npm/Vite with captured stdout/stderr logs
- **Live log viewer**: See server output in real-time within the Preview panel
- **External browser**: Open the preview URL in your default browser
- **Copy/restart controls**: Copy the local preview URL or restart the active server from the Preview toolbar
- **Safety by default**: No destructive commands without confirmation, secrets redacted from logs

### Coding Agent Demo

Prove that Aureon Desk can generate and verify code autonomously:

```bash
npm run demo:coding
```

This self-test:
1. Generates the "Aureon Counter Demo" app (ivory theme, counter, increment/reset buttons)
2. Starts a local server on a detected free port
3. Verifies all 9 requirements (title, counter, buttons, footer, no secrets)
4. Cleans up the sandbox after verification
5. Exits 0 on pass, 1 on failure

### Usage
1. Navigate to the **Preview** tab in the sidebar
2. Select a template type (HTML, Coding Demo, or Vite+React)
3. Click **Create & Start Preview** to generate the sandbox and launch the server
4. Click **Open in Browser** to view the preview
5. Use **Copy URL** or **Restart** when needed
6. Click **Stop Server** when done

### Security
- All preview file writes require user confirmation
- Preview logs redact API keys, tokens, and secrets
- Sandbox directories are isolated from the rest of your file system
- Static preview requests use canonical path containment checks and return `403 Forbidden` for traversal attempts
- See `SECURITY_NOTES.md` for full LivePreview security details
