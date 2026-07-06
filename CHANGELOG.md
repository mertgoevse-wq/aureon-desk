# Changelog

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
