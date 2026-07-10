# VoltAgent Skills Import — Vibeforge

> Import metadata from [VoltAgent/awesome-agent-skills](https://github.com/VoltAgent/awesome-agent-skills) — a community-maintained index of 1,497+ Agent Skills from leading teams.

## Overview

The VoltAgent awesome-agent-skills repository catalogs official Agent Skills from 189+ organizations including Anthropic, Google, Stripe, Vercel, Cloudflare, TestMu AI, Figma, NVIDIA, and many more. Each skill is a small, portable set of instructions for AI assistants.

The Vibeforge importer:
1. Fetches the README.md from GitHub
2. Parses all bullet-point skill entries
3. Categorizes each skill by keywords (testing, web, AI, etc.)
4. Generates JSON + TypeScript output files

## Usage

### Import skills metadata

```bash
npm run skills:import:voltagent
```

This fetches the latest README and writes to:
- `src/shared/data/voltagent-awesome-skills.generated.json` (~738 KB)
- `src/shared/data/voltagent-awesome-skills.generated.ts` (TypeScript module)

### Use a local copy (offline)

```bash
git clone https://github.com/VoltAgent/awesome-agent-skills.git vendor/voltagent-awesome-agent-skills
npm run skills:import:voltagent -- --local vendor/voltagent-awesome-agent-skills/README.md
```

## Import Statistics (latest run)

| Metric | Value |
|--------|-------|
| Skills imported | 1,179 |
| Categories | 20 |
| Unique providers | 189 |
| Top category | `other` (298) |
| Top provider | NVIDIA (155) |

## Skill Metadata

Each imported skill includes:
- **id** — `org/skill-name` (e.g., `anthropics/docx`)
- **name** — Human-readable skill name
- **provider** — Organization/team
- **description** — One-sentence summary
- **url** — Link to skill source
- **category** — Auto-inferred (webapp-testing, ai-development, etc.)
- **tags** — Extracted keywords (testing, javascript, python, etc.)
- **riskLevel** — safe | caution | destructive
- **licenseStatus** — unknown (to be reviewed)
- **adaptationStatus** — none (not yet adapted)

## Safety Policy

- **No source code is copied.** Only metadata (name, URL, description) is imported.
- **License status is tracked.** All skills initially marked `unknown` until license review.
- **Adaptation creates original content.** When a user adapts a skill, the system generates an original Vibeforge implementation inspired by the source, not a copy.
- **Risk levels are auto-assigned.** Skills matching destructive patterns (delete, drop, truncate) are flagged `destructive`. Deploy/publish skills are flagged `caution`.

## Architecture

```
scripts/import-voltagent-awesome-skills.mjs   ← Importer (Node.js)
src/shared/external-skill-sources.ts          ← Type definitions
src/shared/curated-skills.ts                  ← Vibeforge original skills
src/shared/data/voltagent-awesome-skills.generated.{json,ts}  ← Output
src/renderer/src/pages/SkillsPage.tsx          ← Skill Explorer UI
```
