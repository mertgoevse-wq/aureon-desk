# MVP Test Plan — Vibeforge v0.9.0

> **⚠️ HISTORICAL DOCUMENT — Updated 2026-07-08**
> This is an original test plan from v0.9.0. The app has evolved significantly since then.
> Current test count: 331 unit tests + 17 E2E specs.
> For current state, see: `docs/CURRENT_STATE.md` and `AI_QA_REPORT.md`.

## Automated Tests (142 passing)

| Suite | Tests | Status |
|-------|-------|--------|
| Hierarchy Resolver | 15 | ✅ |
| Log Manager (redaction) | 25 | ✅ |
| GitHub Import | 26 | ✅ |
| Prompt Analyzer (routing) | 36 | ✅ |
| Project Manager | 24 | ✅ |
| Tool Manager | 16 | ✅ |

## Manual Click-Test Checklist

### Native Dependency Verification

| # | Feature | Test Steps | Expected Result | Pass/Fail | Notes |
|---|---------|-----------|-----------------|-----------|-------|
| 0a | Native binary check | `npm run verify:native` | ✅ Native binary found and loadable | | |
| 0b | Native rebuild | `npm run rebuild:native` | Rebuilds better-sqlite3 for Electron ABI | | |
| 0c | Missing native module | Delete `node_modules/better-sqlite3/build`, run `npm run verify:native` | ❌ Clear error with fix instructions | | |
| 0d | Startup with missing module | Delete native binary, run `npm start` | Error dialog appears with fix steps (not blank screen) | | |

### Startup & Navigation

| # | Feature | Test Steps | Expected Result | Pass/Fail | Notes |
|---|---------|-----------|-----------------|-----------|-------|
| 1 | App startup | `npm start` | Window opens, sidebar visible, ChatWorkspace empty state shown (acts as onboarding) | | |
| 2 | Sidebar navigation | Click Chats, Prompts, Projects, Tools | Each navigates to correct page | | |
| 3 | Settings navigation | Click Settings → navigate sub-pages | Each settings page renders without blank screen | | |
| 4 | Command palette | Press Ctrl+K | Palette opens with searchable list of 10 navigation items | | |
| 5 | Command palette nav | Type "system", press Enter | Navigates to System Prompt Profiles | | |
| 6 | Sidebar resize | Drag sidebar edge | Sidebar resizes smoothly | | |

### Chat

| # | Feature | Test Steps | Expected Result | Pass/Fail | Notes |
|---|---------|-----------|-----------------|-----------|-------|
| 7 | New chat | Click "New Chat" button | New chat appears in sidebar, empty workspace loads | | |
| 8 | Send message | Type message, press Enter | Message appears in chat, routing inspector updates | | |
| 9 | Chat persistence | Create chat, close app, reopen | Chat and messages still present | | |
| 10 | Model selector | Click model dropdown in header | List of enabled models appears | | |
| 11 | Prompt profile selector | Click profile dropdown in header | List of system prompt profiles appears | | |

### Provider Settings

| # | Feature | Test Steps | Expected Result | Pass/Fail | Notes |
|---|---------|-----------|-----------------|-----------|-------|
| 12 | Provider list | Navigate to Settings → Providers | All 8 providers listed with capabilities | | |
| 13 | Add API key | Enter fake key `sk-test123`, click Save | Key saved, shows "●●●●●●●● Key configured", toast appears | | |
| 14 | Masked key | Check the DB directly | API key stored encrypted, not plaintext | | |
| 15 | Test connection | Click Test on a provider | Toast shows result (expected: failure with fake key) | | |
| 16 | Delete key | Click trash icon on key | Key removed, toast appears | | |
| 17 | Toggle provider | Click toggle switch | Provider enables/disables | | |
| 18 | Custom provider | Click Add Custom, fill form, submit | Custom provider appears in list, toast appears | | |

### System Prompt Profiles

| # | Feature | Test Steps | Expected Result | Pass/Fail | Notes |
|---|---------|-----------|-----------------|-----------|-------|
| 19 | Active list | Navigate to Settings → Prompts | Default Assistant profile visible | | |
| 20 | Create profile | Click New Profile, fill form, submit | Profile appears in list | | |
| 21 | Edit profile | Click edit icon, modify, save | Changes persist | | |
| 22 | Archive | Click archive icon | Profile moves to Archived tab | | |
| 23 | Archived tab | Switch to Archived tab | Archived profile visible with Restore button | | |
| 24 | Preview | Click eye icon | Resolved preview modal shows layers | | |
| 25 | Search | Type in search bar | List filters by name/tag/content | | |

### Prompt Library

| # | Feature | Test Steps | Expected Result | Pass/Fail | Notes |
|---|---------|-----------|-----------------|-----------|-------|
| 26 | Library list | Navigate to Prompts | Built-in prompts visible | | |
| 27 | Create prompt | Click create, fill form, submit | Prompt appears in list | | |
| 28 | Favorite | Click star icon | Prompt moves to favorites | | |
| 29 | Slash command | Type `/` in chat | Slash palette opens with commands + prompts | | |
| 30 | Export | Click Export toolbar button | JSON file downloads | | |

### GitHub Imports

| # | Feature | Test Steps | Expected Result | Pass/Fail | Notes |
|---|---------|-----------|-----------------|-----------|-------|
| 31 | Import screen | Navigate to Settings → GitHub | Import UI loads | | |
| 32 | Import preset | Click "Import Mert's Star List" | 29 repos import, progress shown | | |
| 33 | Review item | Expand repo, click an item | Item content shown, marked untrusted | | |
| 34 | Import safety | Check imported item status | All items `is_untrusted = 1` | | |

### Tools/MCP

| # | Feature | Test Steps | Expected Result | Pass/Fail | Notes |
|---|---------|-----------|-----------------|-----------|-------|
| 35 | Tools list | Navigate to Settings → Tools | 3 mock tools visible | | |
| 36 | Toggle tool | Click enable/disable toggle | Tool state changes | | |
| 37 | Safety check | Click safety check button | Result shows allowed/blocked | | |
| 38 | Call logs | View tool call logs | Logs show approved/denied entries | | |

### Projects

| # | Feature | Test Steps | Expected Result | Pass/Fail | Notes |
|---|---------|-----------|-----------------|-----------|-------|
| 39 | Projects list | Navigate to Projects | Empty state or project list shown | | |
| 40 | Create project | Click create, fill form, submit | Project appears in list | | |
| 41 | Select folder | Click folder selector | Native dialog opens, path set | | |
| 42 | File tree | Open project with folder | File tree renders with checkboxes | | |
| 43 | Context preview | Select files, view context | Content preview with warnings shown | | |

### Logs/Debug

| # | Feature | Test Steps | Expected Result | Pass/Fail | Notes |
|---|---------|-----------|-----------------|-----------|-------|
| 44 | Logs screen | Navigate to Settings → Logs | Log entries visible | | |
| 45 | Filter | Select level "error", category "provider" | List filters correctly | | |
| 46 | Search | Type search term | List filters by message | | |
| 47 | Clear logs | Click Clear, confirm | Logs cleared | | |
| 48 | Copy sanitized | Click copy on a log entry | Clipboard has redacted content | | |
| 49 | Export bundle | Click Export Debug Bundle | JSON file downloads, no plaintext secrets | | |

### Persistence

| # | Feature | Test Steps | Expected Result | Pass/Fail | Notes |
|---|---------|-----------|-----------------|-----------|-------|
| 50 | Close & reopen | Close app, relaunch | Previous state restored (chats, settings, keys) | | |
| 51 | DB location | Check `%APPDATA%/Vibeforge-desk/ivory.db` | Database file exists with correct tables | | |

### Security

| # | Feature | Test Steps | Expected Result | Pass/Fail | Notes |
|---|---------|-----------|-----------------|-----------|-------|
| 52 | Key encryption | Save API key, check DB | `api_key_enc` contains encrypted data, not plaintext | | |
| 53 | Log redaction | Trigger a provider test with fake key, check logs | Key is `[REDACTED]` in log output | | |
| 54 | Debug bundle safety | Export debug bundle, inspect JSON | No plaintext secrets anywhere | | |
| 55 | .env ignored | Place `.env` file in project root | Not committed to git, not in build output | | |
| 56 | Import safety | Import a repo, check items | No code executed, items marked untrusted | | |

### Packaging

| # | Feature | Test Steps | Expected Result | Pass/Fail | Notes |
|---|---------|-----------|-----------------|-----------|-------|
| 57 | Build | `npm run build` | `out/` directory created with main/preload/renderer | | |
| 58 | Package | `npm run dist:win` (with VS Tools or npmRebuild=false) | `dist/` contains Setup and Portable .exe | | |
| 59 | Launch packaged | Run packaged .exe | App launches, no blank screen | | |
