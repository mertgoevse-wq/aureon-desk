# Roadmap — Aureon Desk

> **⚠️ HISTORICAL DOCUMENT — Updated 2026-07-08**
> This roadmap was written for v0.9.0. Most v0.9.0 items are now complete.
> The app is currently at v0.9.33 with 331 tests, full chat, live preview, vibe coding, and brand system.
> For current state, see: `docs/IMPLEMENTATION_LOG.md` and `docs/CURRENT_STATE.md`.

## v0.9.0 — Current (Stabilization)

- [x] Windows packaging (NSIS installer + portable)
- [x] App icon (programmatic 4-size .ico)
- [x] GitHub Actions CI (build + package on push)
- [x] Command palette (Ctrl+K)
- [x] Toast notifications
- [x] Card/Tabs component integration
- [x] Unified secret redaction (9 patterns)
- [x] Logs & debug panel with export
- [x] Project workspaces with file tree
- [x] Provider API key management (8 providers)
- [x] System prompt hierarchy resolver
- [x] Prompt library with slash commands
- [x] GitHub star-list importer (29 repos)
- [x] MCP-style tool manager with safety gate
- [x] Prompt intelligence engine (12 intents, 12 agents, 28 skills)
- [x] 142 unit tests

## v0.10.0 — Real AI Provider Integration

- [ ] Send/receive messages with Anthropic (Claude)
- [ ] Send/receive messages with OpenAI (GPT-4o)
- [ ] Streaming responses
- [ ] Tool use / function calling
- [ ] Message threading and conversation history
- [ ] Token counting and usage tracking
- [ ] Rate limit handling

## v0.11.0 — MCP Server Import & Real Tools

- [ ] Import MCP servers from npm/github
- [ ] stdio transport for local MCP servers
- [ ] Real tool execution (file operations, git, web)
- [ ] Permission escalation flow (user confirms destructive actions)
- [ ] Tool output streaming
- [ ] MCP server health monitoring

## v0.12.0 — Project Workflow Enhancements

- [ ] File writes with explicit confirmation
- [ ] Git integration (status, diff, commit from within app)
- [ ] Project-scoped chat sessions
- [ ] Project-level instructions applied to all chats
- [ ] Archive/restore projects
- [ ] Project template system

## v0.13.0 — Polish & UX

- [ ] Keyboard shortcuts system (global hotkeys)
- [ ] Resizable panels (persisted sizes)
- [ ] Dark mode / theme switching
- [ ] Font size preferences
- [ ] Drag-and-drop file upload
- [ ] Notification system for long-running tasks

## v1.0.0 — Production Release

- [ ] Code signing (EV certificate)
- [ ] Auto-updater (electron-updater)
- [ ] CSP headers
- [ ] SQLite encryption at rest
- [ ] Comprehensive error boundaries
- [ ] Offline mode / local-only provider
- [ ] Import/export all data (settings, chats, prompts, projects)
- [ ] Crash reporting (sentry or similar, opt-in)
- [ ] Telemetry (opt-in, anonymized)

## Future Ideas

- Multi-window support (detached chats)
- Plugin/extension system
- Team/collaboration features
- Cloud sync (encrypted)
- Mobile companion app
- Voice input
- RAG / document Q&A
- Fine-tuning interface
- Agent marketplace
- Browser extension for context capture
