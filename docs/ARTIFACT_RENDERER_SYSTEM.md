# Vibeforge — Artifact Renderer System

> Structured output artifacts that make AI results easier to understand, copy, and reuse.

## Overview

The Artifact Renderer System converts raw AI responses into structured, scannable UI cards. Instead of reading long markdown walls, users see:

- **Code blocks** with syntax highlighting, filename labels, and copy buttons
- **Prompts** with one-click copy and send-to-composer actions
- **Diffs** with green/red line indicators
- **Build Plans** with step-by-step breakdowns
- **Commands** with terminal-style rendering
- **Tutorials, Checklists, Error Diagnostics, and more**

## Artifact Types (16)

| Type | Description | Actions |
|------|-------------|---------|
| `prompt` | Copyable AI prompt template | Copy, Send to composer |
| `code` | Syntax-highlighted code block | Copy, Expand |
| `text` | Freeform text document | Copy |
| `markdown` | Rendered Markdown | Copy |
| `file-tree` | Hierarchical file listing | — |
| `diff` | Green/red line-by-line diff | Copy |
| `preview` | Embedded iframe preview | Open external |
| `build-plan` | Step-by-step build plan | Copy |
| `search-results` | Search result cards | — |
| `image-gallery` | Image grid | — |
| `tutorial` | Expandable Q&A cards | Expand |
| `checklist` | Checkable items with descriptions | Toggle |
| `command` | Terminal command block | Copy |
| `error-diagnostic` | Error message + suggestions | — |
| `provider-setup` | Setup instructions + API key hint | Open setup |
| `skill-result` | Skill execution output | — |

## Architecture

```
src/shared/artifacts.ts          ← Shared types + helpers + parser
src/renderer/src/components/
  artifacts/
    ArtifactCard.tsx             ← Universal router (type → component)
    CodeArtifactView.tsx         ← Per-type renderers
    PromptArtifactView.tsx
    DiffArtifactView.tsx
    BuildPlanArtifactView.tsx
    CommandArtifactView.tsx
    FileTreeArtifactView.tsx
    TextArtifactView.tsx
    MarkdownArtifactView.tsx
    TutorialArtifactView.tsx
    ChecklistArtifactView.tsx
    PreviewArtifactView.tsx
    ErrorDiagnosticArtifactView.tsx
    ProviderSetupArtifactView.tsx
    index.ts                     ← Barrel export
```

## Integration Points

### 1. Chat (`MessageBubble.tsx`)
AI assistant messages are automatically parsed for fenced code blocks (```). Each code block becomes a `CodeArtifact` rendered below the markdown content. Non-code markdown stays as formatted prose.

### 2. LivePreview / Code Mode (`LivePreview.tsx`)
The **"Cards" tab** renders pipeline output as structured artifacts:
- **Build Plan** → `BuildPlanArtifact`
- **Generated Files** → `CodeArtifact` per file
- **Diffs** → `DiffArtifact` per changed file

### 3. Vibe Coding (planned)
Templates produce Prompt + Build + Preview artifacts for structured rendering.

## Helpers (`src/shared/artifacts.ts`)

### `parseArtifactsFromContent(content: string)`
Extracts fenced code blocks from markdown content. Supports:
- Language tags (` ```typescript` )
- Filename hints (` ```typescript # src/app.ts` )
- Windows `\r\n` and Unix `\n` line endings
- Whitespace normalization after extraction

Returns `{ artifacts: CodeArtifact[], cleanedContent: string }`.

### Factory Functions
- `codeArtifactFromFileOp(op)` — build pipeline file op → artifact
- `promptArtifactFromTemplate(template)` — vibe template → artifact
- `diffArtifactFromDiff(path, lang, lines)` — diff data → artifact
- `buildPlanArtifact(prompt, steps)` — prompt + steps → artifact
- `createArtifactId()` — unique ID generator

## Design Principles

1. **Progressive enhancement** — Raw markdown always accessible; artifacts are additive
2. **Consistent shape** — Every artifact has `id`, `type`, `title`, `createdAt`, optional `actions`
3. **Action-first** — Copy, send, expand, and open actions on every relevant card
4. **Calm premium feel** — Ivory/graphite color palette, rounded corners, subtle shadows
5. **No breaking changes** — Existing inline rendering in LivePreview tabs coexists with Cards tab
