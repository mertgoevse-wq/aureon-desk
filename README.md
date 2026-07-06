# Aureon Desk

A Windows-first desktop AI workspace with multi-provider chat, projects, and tool integrations.

## Tech Stack

- **Shell:** Electron 43 + electron-vite 5
- **UI:** React 19 + TypeScript 5.7
- **Styling:** Tailwind CSS 4 + ivory warm theme
- **State:** Zustand 5 (atomic stores)
- **Database:** better-sqlite3 + Drizzle ORM
- **Security:** Electron safeStorage (DPAPI on Windows)

## Quick Start

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
- ✅ **GitHub Star List Importer** (29 repos, multi-format parser, safety engine, classifier, 77 tests total)
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
- 🔜 Streaming responses & cancel mid-request

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Production build |
| `npm run start` | Run from build output |
| `npm run typecheck` | TypeScript check |
| `npm run test` | Run Vitest unit tests |
| `npm run lint` | Lint check (typecheck) |
| `npm run dist:win` | Build Windows NSIS installer + portable |
| `npm run package` | Build + package for Windows |
| `npm run pack` | Directory-only build (for testing) |
