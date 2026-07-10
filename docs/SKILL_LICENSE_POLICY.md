# Aureon Desk — Skill License Policy

> How Aureon Desk handles licenses for external skill sources and adaptations.

## Core Principle

**Import metadata only. Never copy source content.** The skill catalog stores names, URLs, descriptions, and categories — not the actual skill code or instructions. This avoids license contamination and respects the intellectual property of external skill authors.

## License Status Tracking

Every imported skill is tracked with one of four statuses:

| Status | Meaning | Action |
|--------|---------|--------|
| `known-open` | Verified open-source license (MIT, Apache 2.0, etc.) | Safe to adapt with attribution |
| `known-proprietary` | Proprietary/commercial license | May require permission to adapt |
| `unknown` | License not yet reviewed | Default for all imports — review before adapting |
| `needs-review` | Flagged for license review | Requires manual assessment |

**All 1,179 imported skills are initially marked `unknown`.** This is intentional — we do not assume license status without verification.

## Adaptation Policy

When a user clicks "Adapt into Aureon Skill":
1. An **original prompt** is generated describing the desired Aureon implementation
2. The prompt explicitly states: "Do NOT copy content from the external source"
3. Attribution is included via an "Inspired by" section with source URL
4. The resulting Aureon skill is **100% original content** — not a derivative work

## Source Attribution

- All curated skills include `inspiredBy` and `inspiredByUrl` fields
- All external skill cards display the source link prominently
- The importer records the source repository URL for every entry

## User Responsibility

Users are responsible for verifying license terms before adapting external skills for production use. Aureon Desk provides metadata and tools — the user makes the final decision about adaptation and usage.
