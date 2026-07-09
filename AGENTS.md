# Aureon Desk — AGENTS.md

> Agent handoff instructions for AI sessions working on this repo.

---

## Project Identity

- **Name:** Aureon Desk
- **Type:** Electron desktop app (Windows-first)
- **Stack:** Electron 43 + React 19 + TypeScript + Tailwind CSS v4 + drizzle-orm + better-sqlite3
- **Version:** 0.9.0
- **Repository:** https://github.com/mertgoevse-wq/aureon-desk
- **Local path:** `C:\Users\mertg\Desktop\code`

---

## Working Branch: `main`

Always work on `main`. Do not reset, clean, or discard local changes without explicit approval.

```bash
git status          # check before any work
git branch -a -vv   # confirm you are on main
git log --oneline -8
```

---

## Design Rules (NEVER VIOLATE)

1. **No neon, no cyberpunk, no glassmorphism**
2. **No Anthropic/OpenAI/Claude/Codex copied assets, fonts, or exact UI patterns**
3. **Serif only for logo/display headings** (`font-display: Crimson Text`)
4. **Sans-serif for all UI, body, forms, chat, settings** (`font-body: Inter`)
5. **Calm ivory palette**: `#FAF7F2` bg, `#F3EFE6` sidebar, `#FFFFFF` cards, `#C75B39` accent
6. **Premium desktop feel**: rounded corners (xl to 28px), warm shadows, subtle animations
7. **No hardcoded API keys anywhere** — use SafeStorage vault or env vars only

---

## Security Rules

- Never commit `.env`, `*.db`, `*.sqlite`, `logs/`, `app-data/`, `imported-repos/`
- Never commit `node_modules/`, `dist/`, `out/`, `test-results/`, `playwright-report/`
- Never hardcode any real API key in source
- Always run `git grep "sk-or-v1"` before committing to verify only mock/doc references exist
- Use `OPENROUTER_API_KEY` from environment only
- Use the vault (`src/main/security/vault.ts`) for manual provider keys

---

## Before Starting Any Implementation

1. `git status` — verify branch and working tree
2. `npm run verify:native` — confirm better-sqlite3 binary
3. `npm run typecheck` — must PASS before editing
4. `npm test` — must PASS before editing (283 tests)
5. Read `docs/CURRENT_STATE.md` — understand what exists
6. Read `docs/IMPLEMENTATION_LOG.md` — understand recent changes
7. Read `docs/VISUAL_AUDIT.md` — understand UX gaps
8. Read `CONTINUATION_NOTES.md` — read the handoff note

---

## After Any Implementation

1. `npm run typecheck` — must PASS
2. `npm test` — must PASS (or newly added tests must pass)
3. `npm run build` — must PASS
4. Update `CHANGELOG.md` with a new version entry
5. Update `AI_QA_REPORT.md` with latest results
6. Update `docs/IMPLEMENTATION_LOG.md` with session details
7. Update `docs/CURRENT_STATE.md` if features changed
8. Check for secrets: `git grep "sk-or-v1"` — only docs/tests should match
9. `git status`, `git add .`, review staged files, then commit
10. `git push origin main`
11. If master is stale: `git push origin main:master`

---

## Commit Message Convention

```
feat: <description of new feature>
fix: <description of bug fix>
refactor: <description of refactor>
docs: <description of documentation change>
test: <description of test change>
chore: <description of maintenance work>
```

---

## Key Files for Each Domain

| Domain | Key Files |
|--------|-----------|
| Window/Shell | `src/main/windows.ts`, `src/main/index.ts` |
| Topbar/Mode Switch | `src/renderer/src/layouts/AppShell.tsx` |
| Sidebar | `src/renderer/src/layouts/Sidebar.tsx` |
| Right Inspector | `src/renderer/src/layouts/RightInspector.tsx` |
| Chat | `src/renderer/src/pages/ChatWorkspace.tsx`, `src/renderer/src/components/chat/` |
| Settings | `src/renderer/src/layouts/SettingsLayout.tsx`, `src/renderer/src/pages/settings/` |
| Providers | `src/main/services/provider.service.ts`, `src/main/ipc/provider.ipc.ts`, `src/renderer/src/pages/settings/ProvidersPage.tsx` |
| Chat Completion | `src/main/services/chat-completion.service.ts` |
| LivePreview | `src/main/services/live-preview.service.ts`, `src/renderer/src/pages/LivePreview.tsx` |
| Design Tokens | `src/renderer/src/theme/tokens.css` |
| DB Schema | `src/main/db/schema.ts` |
| Shared Types | `src/shared/types/` |
| Provider List | `src/shared/constants.ts` |
| Preload Bridge | `src/preload/index.ts`, `src/preload/index.d.ts` |

---

## Prompt Queue (as of 2026-07-09)

| # | Prompt | Status |
|---|--------|--------|
| 1 | Desktop Shell Polish | ✅ Done |
| 2+ | TBD | — |

---

## Architecture Reference

- `ARCHITECTURE.md` — technical deep-dive
- `SECURITY_NOTES.md` — key handling, redaction rules
- `CONTINUATION_NOTES.md` — last session handoff
- `docs/PROJECT_INDEX.md` — full file map
- `docs/CURRENT_STATE.md` — feature status
- `docs/VISUAL_AUDIT.md` — UI pass/fail
- `AI_QA_REPORT.md` — latest test results
