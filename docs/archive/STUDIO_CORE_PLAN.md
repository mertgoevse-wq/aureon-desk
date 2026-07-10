# Vibeforge Studio Core — Architecture & Plan

## Overview

Vibeforge Studio Core is the central orchestrator layer for the Vibeforge application. It replaces the earlier "Jarvis Core" concept with a safer, product-like task launcher and orchestrator that follows strict permission-based principles.

## Architecture

### Layers

```
┌─────────────────────────────────────────────┐
│               Renderer (UI)                  │
│  Studio.tsx    ConnectorsPage.tsx            │
│  AppShell.tsx  Sidebar.tsx                   │
├─────────────────────────────────────────────┤
│              Preload Bridge                  │
│  studioOrchestrate(), studioTaskCategories() │
├─────────────────────────────────────────────┤
│              Main Process                    │
│  studio-core.ipc.ts                          │
│  studio-core.service.ts (Orchestrator)       │
├─────────────────────────────────────────────┤
│              Shared Types                    │
│  studio-core.ts (types, constants)           │
│  capability-registry.ts (21 capabilities)    │
├─────────────────────────────────────────────┤
│           Existing Services                  │
│  routing-policy.ts  agent-registry.ts        │
│  skill-registry.ts  prompt-analyzer.ts       │
│  provider.service.ts  tool.service.ts        │
└─────────────────────────────────────────────┘
```

### Key Components

#### 1. Studio Core Orchestrator (`studio-core.service.ts`)
- Accepts user intent + context
- Classifies tasks via keyword matching (10 categories)
- Routes to appropriate model based on task type
- Generates safety warnings and permission requirements
- Returns orchestration plan with next UI action

#### 2. Capability Registry (`capability-registry.ts`)
- 21 capabilities defined: text, code, image, video, music, audio, connectors, etc.
- Each capability has: risk tier, required connector, permission flags
- Risk tiers: safe → read_only → write_local → write_remote → account_action → destructive
- Used by orchestrator to detect missing capabilities

#### 3. Task Launcher (`Studio.tsx`)
- 10 task category cards in a calm ivory grid layout
- Autonomy level selector (0-4) at the bottom
- Inline orchestration results per card
- Safety warnings displayed before task starts
- Routes to Chat/Cowork/Code/Studio based on task type

#### 4. Connectors Hub (`ConnectorsPage.tsx`)
- 12 connector cards: OpenAI, Gemini, Google AI Studio, Gmail, Google Drive, Google Calendar, GitHub, OpenRouter, Ollama, LM Studio, MCP, Phone Companion
- Status indicators: Connected / Not connected / Needs setup / Planned
- Expandable details: auth type, capabilities, permission scopes, risk notes
- Configure / Test / Disconnect actions
- Neutral Lucide icons only — no fake brand logos

### Autonomy Levels

| Level | Name | Description |
|-------|------|-------------|
| 0 | View Only | Read and observe. No actions. |
| 1 | Suggest Only | Propose changes, never apply. |
| 2 | Ask Before Acting | Every action requires confirmation. |
| 3 | Approved Workspace | Auto-acts in workspace. Destructive actions still confirm. |
| 4 | Advanced | Full autonomy in workspace. Destructive/account/shell actions confirm. |

## Safety Design

### Principles
1. **Never auto-execute destructive actions** — every file write, shell command, account action requires explicit approval
2. **Permission scoping** — each connector/capability has defined scopes
3. **No silent access** — no background system access, no auto-run without visibility
4. **Safe defaults** — default autonomy level is 2 (Ask Before Acting)
5. **Transparency** — safety warnings displayed before any task starts

### What's Blocked
- Silent file writes outside approved workspace
- Auto-send emails (always requires confirmation)
- Auto-run shell commands
- Unapproved MCP tool execution
- Background account access

## Integration Points

### With Existing Systems
- **routing-policy.ts**: Studio orchestrator's task classification mirrors the prompt-analyzer's keyword approach
- **agent-registry.ts**: Existing 12 agents remain; Studio adds task-level routing above them
- **provider.service.ts**: Connector page reads provider status via existing IPC
- **tool.service.ts**: MCP tools safety gate still enforces permissions
- **VibeCoding.tsx**: Complementary; Vibe Coding is for guided prompts, Studio is for task orchestration

### New IPC Channels
- `studio:orchestrate` — classify intent, return orchestration plan
- `studio:taskCategories` — get all task categories
- `studio:capabilities` — get all capabilities
- `studio:autonomyLevels` — get autonomy level definitions

## Future Extensions

### Planned
- Gmail OAuth flow (currently design-only)
- Google Drive/Calendar OAuth
- Phone Companion pairing (local network only)
- Music generation connector (Suno/Udio API)
- Video generation connector (Veo/Sora API)

### Out of Scope (for now)
- Browser automation of third-party websites
- Remote desktop control
- Cloud relay for phone companion
- Automatic credential sharing between connectors
