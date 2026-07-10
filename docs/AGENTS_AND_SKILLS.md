# Aureon Desk — Agents & Skills

> How Aureon Desk manages skills, agents, and external skill catalog metadata.

## System Overview

### Internal Skills (Built-in)
28 built-in skills defined in `src/main/services/skill-registry.ts` — code generation, testing, security, design, documentation, and more. Always available and fully integrated.

### Curated Skills (Aureon Original)
12 curated skills in `src/shared/curated-skills.ts` — inspired by popular external skill categories but implemented as original Aureon content. Each has defined capabilities, status (active/planned/placeholder), and attribution.

### External Skill Catalog
Metadata from [VoltAgent/awesome-agent-skills](https://github.com/VoltAgent/awesome-agent-skills) — 1,179+ skills from 189+ providers. Imported as metadata only; no source code is copied. Users browse external skills and adapt them into original Aureon implementations.

## Skill Lifecycle

```
External Source → Import Metadata → Browse/Filter → Adapt → Aureon Skill
                                                         ↑
                                            (original implementation,
                                             not a copy of source)
```

## Pages

| Route | Page | Description |
|-------|------|-------------|
| `/skills` | Skill Explorer | Browse external catalog + curated starter set |
| `/settings/skills` | Skill Explorer (settings) | Same view, within settings context |
| `/learn` | Education Center | Concepts, agents, skills, auto-selection explained |
| `/settings/learn` | Education Center (settings) | Same view, within settings context |
| `/tools` | Tools & MCP | MCP server and tool registry management |

## Education Center

A beginner-friendly education page at `/learn` that explains:
- **Concepts:** What is an Agent, Skill, Tool, MCP, and Prompt Profile — with simple analogies and examples
- **Agents:** 16 agent profiles with beginner explanations, example prompts, and permissions
- **Skills:** 19 skill profiles with descriptions, inputs/outputs, and examples
- **Auto-Selection:** Interactive demo showing how Aureon picks the right agent + skill for a prompt

## Safety

- External skills are metadata-only — no code execution
- "Adapt" flow generates original prompts, never copies source
- License status tracked for every external skill
- Risk levels (safe/caution/destructive) auto-assigned and visible
- External source attribution preserved via `inspiredBy` fields
