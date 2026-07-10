# Vibeforge — QA Checklist

> Use this checklist before every commit and before starting each major prompt.

---

## Pre-Commit Checklist

- [ ] `git status` — on branch `main`, no unintended changes
- [ ] `npm run verify:native` — better-sqlite3 binary present
- [ ] `npm run typecheck` — zero TypeScript errors
- [ ] `npm test` — all 283 unit tests pass (or higher count if tests added)
- [ ] `npm run build` — build succeeds with no errors
- [ ] `git grep "sk-or-v1"` — only doc/test references, no real keys
- [ ] No `.env`, `*.db`, `*.sqlite`, `app-data/`, `logs/` staged
- [ ] No `node_modules/`, `dist/`, `out/`, `test-results/`, `playwright-report/` staged
- [ ] `CHANGELOG.md` updated with new version entry
- [ ] `AI_QA_REPORT.md` updated with latest results
- [ ] `docs/IMPLEMENTATION_LOG.md` updated with session details

---

## Visual QA Checklist (before each Prompt)

### App Launch
- [ ] App starts without error dialog
- [ ] No raw React error screen
- [ ] Sidebar visible
- [ ] Mode switch visible in topbar (Chat / Cowork / Code)

### Chat Mode — Empty State
- [ ] Greeting + Sparkles icon centered
- [ ] "Start a new chat" button visible
- [ ] Feature cards visible (Multi-provider, Profiles, Projects, Tools)

### Chat Mode — Active Chat
- [ ] Model selector shows "Provider · Model" format
- [ ] System profile selector shows profile name or "No profile"
- [ ] Composer accepts typing and Ctrl+Enter to send
- [ ] Composer accepts Ctrl+V paste
- [ ] Starter prompts appear when chat is empty
- [ ] Messages render correctly (user right, assistant left)

### Model Selector
- [ ] Dropdown shows all enabled models
- [ ] Labels are "Provider · Model" — not just model name
- [ ] OpenRouter models show "OpenRouter · ..." not direct provider name

### Settings
- [ ] Category column visible (264px sidebar)
- [ ] All 12 categories listed
- [ ] Providers & Models accessible
- [ ] API key field accepts typing
- [ ] API key field accepts Ctrl+V paste
- [ ] Test Connection shows result (not crashes)
- [ ] No raw API keys visible in DOM

### LivePreview
- [ ] Navigate to Code mode
- [ ] Template selector shows HTML, Vite+React, Demo
- [ ] "Create Preview" creates sandbox
- [ ] URL bar shows localhost:PORT
- [ ] iframe shows content
- [ ] Stop server stops the preview

### Cowork
- [ ] Navigates to /cowork
- [ ] 4 cards visible (Scheduled, Dispatch, Ideas, Customize)
- [ ] Permissions section visible (all Off)
- [ ] No broken UI

### Layout Stress
- [ ] No horizontal overflow at 1366×768
- [ ] No overlapping buttons
- [ ] Sidebar collapse works (Ctrl+B)
- [ ] Inspector toggle works (Ctrl+I)
- [ ] Command palette opens (Ctrl+K)

---

## Post-Prompt QA Gate

All of the following must pass before pushing:

| Check | Command | Expected |
|-------|---------|----------|
| TypeScript | `npm run typecheck` | No errors |
| Unit tests | `npm test` | All pass |
| Build | `npm run build` | No errors |
| Secret scan | `git grep "sk-or-v1"` | Only docs/tests |
| Staged files | `git status` | No DB/log/secrets |

---

## Screenshots to Capture (docs/qa-screenshots/)

- `home-empty-state.png` — ChatWorkspace empty state
- `chat-active.png` — chat with messages
- `settings-providers.png` — Providers & Models page
- `settings-provider-test.png` — Provider Test Center
- `cowork-mode.png` — Cowork page
- `code-preview.png` — LivePreview page
- `logs-debug.png` — Logs settings page
- `sidebar-full.png` — Full expanded sidebar
- `sidebar-collapsed.png` — Collapsed icon rail

---

## Known Acceptable Limitations

1. Cowork workflow items are intentional placeholders
2. Computer/browser use permissions are intentionally Off
3. Extensions, Privacy, Capabilities settings pages are intentional placeholders
4. E2E tests are slow on Windows (sequential Electron launch) — run targeted when possible
5. OpenRouter live test skipped when `OPENROUTER_API_KEY` env var is absent
