# Changelog

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
