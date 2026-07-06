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

# Start production build
npm start
```

## Current Status (Phase 2)

- ✅ Electron shell with secure IPC
- ✅ React app shell (sidebar + chat + inspector)
- ✅ Ivory warm theme with serif display typography
- ✅ Chat with message persistence (SQLite)
- ✅ Provider & API key management (8 providers)
- ✅ **System Prompt Profile Engine** (CRUD, archive, duplicate, hierarchy resolver, safety checks)
- ✅ **Prompt Library & Slash Commands** (10 commands, variables, favorites, import/export JSON/MD/YAML)
- ✅ Prompt library with tags, categories, search, favorites, usage tracking
- ✅ Slash command integration with combined built-in + library palette
- ✅ Secure credential vault (safeStorage)
- ✅ Unit tests (15 passing for hierarchy resolver)
- 🔜 Projects & local file access
- 🔜 Tools & MCP integration
- 🔜 GitHub imports
- 🔜 Keyboard shortcuts & resize

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Production build |
| `npm run start` | Run from build output |
| `npm run typecheck` | TypeScript check |
| `npm run test` | Run Vitest unit tests |
| `npm run lint` | Lint check (typecheck) |
| `npm run pack` | Package for distribution |
| `npm run dist` | Build installer |
