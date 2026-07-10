# Vibeforge — Beta Clean Release Checklist

> **Purpose:** Prepare Vibeforge for a private beta release by cleaning secrets, local app data, caches, logs, and ensuring zero private data in release builds.

---

## Pre-Release Verification

### 1. Secret Scan (Source)

Run these before every release:

```powershell
# From project root (PowerShell)
git grep "sk-or-v1"        # Should only match docs/tests
git grep "AIza"            # Should only match docs/tests
git grep "sk-"             # Should only match docs/tests
git grep "OPENROUTER_API_KEY"  # Should only match docs/tests/scripts
git grep "GEMINI_API_KEY"      # Should only match docs
git grep "OPENAI_API_KEY"      # Should only match docs
```

**Result:** Only mock/test references and documentation. Zero real API keys in source.

### 2. Build Verification

```powershell
npm run verify:native   # Confirm better-sqlite3 binary
npm run typecheck       # Zero TypeScript errors
npm test                # All 491 tests pass
npm run build           # Production build succeeds
```

### 3. Release Ignore Audit

Verify `.gitignore` excludes all of:

| Pattern | Purpose | Status |
|---------|---------|--------|
| `.env`, `.env.*` | Environment files | ✅ |
| `*.db`, `*.sqlite` | Local databases | ✅ |
| `*.db-journal`, `*.db-wal`, `*.db-shm` | SQLite WAL files | ✅ |
| `logs/` | Log files | ✅ |
| `app-data/` | Local app data | ✅ |
| `node_modules/` | Dependencies | ✅ |
| `dist/`, `out/` | Build outputs | ✅ |
| `release/` | Release packages | ✅ |
| `test-results/` | Playwright test results | ✅ |
| `playwright-report/` | Playwright HTML reports | ✅ |
| `videos/` | Playwright video recordings | ✅ |
| `traces/` | Playwright trace files | ✅ |
| `screenshots/` | Screenshot artifacts | ✅ |
| `tests/e2e/artifacts/*.png` | E2E screenshots | ✅ |
| `*.pem`, `*.key` | Private keys | ✅ |
| `credentials.json` | Credential files | ✅ |
| `imported-repos/` | Cloned repos | ✅ |
| `coverage/` | Test coverage | ✅ |
| `.vscode/`, `.idea/` | IDE config | ✅ |
| `*.tsbuildinfo` | TypeScript build info | ✅ |

### 4. Build Exclusions (electron-builder.yml)

The build already excludes:
- `src/` (source code)
- `tests/`, `__tests__/`, `specs/` (test files)
- `*.test.*`, `*.spec.*` (test files)
- `coverage/`, `.nyc_output/` (coverage)
- `.env`, `.env.*` (environment)
- `CHANGELOG.md`, `README.md`, `*.md` (docs)
- `*.map` (source maps)
- `dist/`, `installer/` (build artifacts)

---

## App Data Cleanup (Windows)

### Delete All Local App Data

Before distributing to beta testers, ensure your local machine is clean:

```powershell
# Stop the app first, then run in PowerShell as the current user:

# Delete Vibeforge data (Electron userData)
Remove-Item -Recurse -Force "$env:APPDATA\Vibeforge-desk" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "$env:APPDATA\Vibeforge" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "$env:LOCALAPPDATA\Vibeforge-desk" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "$env:LOCALAPPDATA\Vibeforge" -ErrorAction SilentlyContinue

# Also check these alternate locations
Remove-Item -Recurse -Force "$env:USERPROFILE\.Vibeforge-desk" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "$env:USERPROFILE\AppData\Roaming\Vibeforge-desk" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "$env:USERPROFILE\AppData\Local\Vibeforge-desk" -ErrorAction SilentlyContinue
```

### Verify Cleanup

```powershell
# Confirm nothing remains
Test-Path "$env:APPDATA\Vibeforge-desk"   # Should return False
Test-Path "$env:LOCALAPPDATA\Vibeforge-desk"  # Should return False
```

### What This Removes

- All chat history (SQLite database)
- All provider API keys (encrypted, but removed anyway)
- All system prompt profiles
- All project configurations
- All tool/MCP configurations
- All GitHub import history
- All application logs
- All LivePreview sandboxes
- All cached data

---

## Secure First-Run State

After cleanup, the app on first launch will have:

| State | Expected |
|-------|----------|
| Chats | None (empty) ✅ |
| Provider API keys | None (`api_key_enc: null` for all providers) ✅ |
| Connected accounts | None ✅ |
| Logs with secrets | None (logs are empty on fresh DB) ✅ |
| Provider setup guidance | Shown (Setup Provider badge if no models configured) ✅ |
| Mock/fake keys in UI | None (seed sets `api_key_enc: null`, no mock keys anywhere) ✅ |
| System prompts | One default ("Default Assistant") — no sensitive content ✅ |

---

## Log Redaction Verification

The app uses 9-tier secret redaction before any log is written:

| # | Pattern | Replaced With |
|---|---------|---------------|
| 1 | `sk-ant-*` (Anthropic) | `[REDACTED_ANTHROPIC_KEY]` |
| 2 | `sk-proj-*`, `sk-org-*` (OpenAI) | `[REDACTED_OPENAI_KEY]` |
| 3 | `AIza*` (Google) | `[REDACTED_GOOGLE_KEY]` |
| 4 | `sk-*` (Generic) | `[REDACTED_KEY]` |
| 5 | `Bearer <token>` | `Bearer [REDACTED]` |
| 6 | `x-api-key/api_key=<value>` | `$1=[REDACTED]` |
| 7 | `Authorization=<value>` | `Authorization=[REDACTED]` |
| 8 | `secret/token/password=<value>` | `$1=[REDACTED]` |
| 9 | `-----BEGIN PRIVATE KEY-----` | `[REDACTED_PRIVATE_KEY]` |

Redaction points:
- **DB storage**: Logs redacted BEFORE writing to `app_logs`
- **Debug bundle**: All data sanitized before export
- **Tool call logs**: Inputs/outputs redacted before storage
- **Request builder**: Headers redacted before logging
- **Safety gate**: Tool inputs redacted before logging
- **Provider test results**: Sanitized in renderer before display

### Verify Log Safety

```powershell
# After running the app, check logs have no secrets
Select-String -Path "$env:APPDATA\Vibeforge-desk\logs\*" -Pattern "sk-or-v1|AIza|sk-proj|sk-ant" -SimpleMatch
# Should return NO matches

# Or check the debug bundle
# Settings → Developer → Export Diagnostics → inspect the JSON
```

---

## Pre-Distribution Checklist

Before sending the installer to beta testers:

- [ ] Run secret scan — zero real keys in source
- [ ] Run `npm run typecheck` — zero errors
- [ ] Run `npm test` — all 491 pass
- [ ] Run `npm run build` — succeeds
- [ ] Delete all local app data (see PowerShell commands above)
- [ ] Launch app fresh — confirm no chats, no keys, no accounts
- [ ] Verify Setup Provider badge appears (no models configured)
- [ ] Configure a test provider, send a message, verify it works
- [ ] Check logs directory — no secrets in log files
- [ ] Export debug bundle — inspect for redacted secrets
- [ ] Delete local app data again before packaging
- [ ] Build installer: `npm run dist:win`
- [ ] Verify installer size is reasonable (< 200 MB)
- [ ] Test installer on a clean machine/VM

---

## Known Limitations (Beta)

1. **No code signing**: Windows SmartScreen will show a warning on install
2. **No auto-updater**: Manual updates required
3. **No CSP headers**: Content Security Policy not yet enforced
4. **No 2FA/MFA**: Provider keys protected only by OS-level DPAPI
5. **Local DB not encrypted at rest**: SQLite file relies on file system permissions
6. **Cowork mode**: Simulated/placeholder — not production-ready
7. **MCP tool execution**: Registry only — not wired to live execution

---

## Emergency Cleanup

If a tester accidentally exposes credentials, instruct them to:

```powershell
# Delete ALL local data immediately
Remove-Item -Recurse -Force "$env:APPDATA\Vibeforge-desk"
Remove-Item -Recurse -Force "$env:LOCALAPPDATA\Vibeforge-desk"

# Then rotate any API keys that may have been used
# Visit: openrouter.ai/keys, console.anthropic.com, platform.openai.com, etc.
```
