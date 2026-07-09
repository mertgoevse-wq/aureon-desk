# Security Notes — Aureon Desk

## Credential Storage

- **Vault**: Uses Electron's `safeStorage` API. On Windows, this is backed by **DPAPI** (Data Protection API).
- **Scope**: Encryption keys are user-scoped. A key encrypted on one Windows user account cannot be decrypted on another machine or by another user.
- **Storage**: Encrypted keys are stored as base64-encoded strings in the `api_key_enc` column of the `providers` table in the local SQLite database.
- **Never plaintext**: API keys are never written to disk in plaintext. The `api_key_enc` column always contains DPAPI-encrypted data.

### Credential Flow

```
User enters key → vault.encryptToBase64(key) → DB (encrypted blob)
DB (encrypted blob) → vault.decryptFromBase64(blob) → in-memory use → discarded
```

## Secret Redaction

All secrets are redacted before they appear in logs, debug bundles, or tool call logs.

### Redaction Patterns (9 tiers, ordered specific→generic)

| # | Pattern | Matches | Replaced With |
|---|---------|---------|---------------|
| 1 | `sk-ant-api\d{2}-` | Anthropic API keys | `[REDACTED_ANTHROPIC_KEY]` |
| 2 | `sk-proj-`, `sk-org-` | OpenAI project/org keys | `[REDACTED_OPENAI_KEY]` |
| 3 | `sk-[a-zA-Z0-9]{20,}` | Generic `sk-` keys | `[REDACTED_KEY]` |
| 4 | `AIza[0-9A-Za-z_-]{20,}` | Google AI keys | `[REDACTED_GOOGLE_KEY]` |
| 5 | `Bearer [A-Za-z0-9_\-+=.]{20,}` | Bearer tokens | `Bearer [REDACTED]` |
| 6 | `(?i)(x-api-key|api_key|apikey)[\s:=]+[A-Za-z0-9_\-+=.]{8,}` | API key headers/params | `$1=[REDACTED]` |
| 7 | `(?i)Authorization[\s:=]+[^\s]{8,}` | Authorization headers | `Authorization=[REDACTED]` |
| 8 | `(?i)(secret|token|password|passwd)[\s:=]+[^\s]{4,}` | Secret/password assignments | `$1=[REDACTED]` |
| 9 | `-----BEGIN.*PRIVATE KEY-----` | Private key blocks | `[REDACTED_PRIVATE_KEY]` |

### Redaction Points

- **DB storage**: Logs are redacted BEFORE writing to `app_logs` table
- **Debug bundle**: All data sanitized before export
- **Tool call logs**: Inputs/outputs redacted before storage
- **Request builder**: Headers redacted before logging
- **Safety gate**: Tool inputs redacted before logging

## Import Safety

All imported content is treated as untrusted.

- `is_untrusted = 1` on every imported item by default
- No code execution — static parsing only (Markdown, YAML, JSON, TOML, TXT)
- Shell scripts blocked by extension filter
- Branch names sanitized: `[a-zA-Z0-9._/-]` only
- Secret detection runs on all imported content
- Proprietary content detection flags known model/system prompts

## File Access

- Project files are **read-only** by default
- File writes require explicit user confirmation (not yet implemented in UI)
- Binary files skipped entirely (no content sent to remote providers)
- 5MB size guard on individual files
- 15+ ignore patterns enforced at file tree level:
  `.git`, `node_modules`, `dist`, `build`, `.env*`, `secrets`, `credentials`, `__pycache__`, `.venv`, `venv`, `*.pem`, `*.key`
- Remote upload warning displayed when building project context

## IPC Security

- **contextBridge**: All IPC goes through `contextBridge.exposeInMainWorld` — no `nodeIntegration`
- **Sandbox**: Renderer process is sandboxed
- **No remote content**: No `webPreferences.webSecurity: false`
- **Single instance**: `app.requestSingleInstanceLock()` prevents multiple instances

## Packaging Security

### Git-ignored

- `.env` and `.env.*` files
- Database files (`*.db`)
- Build artifacts (`out/`, `dist/`)
- Installer outputs (`*.exe`, `*.msi`)
- Private keys (`*.pem`, `*.key`)
- Credentials files (`credentials.json`)

### Build exclusions (electron-builder)

- Source maps (`**/*.map`)
- Test files (`**/*.test.*`, `**/*.spec.*`)
- Dev config (tsconfig, eslint, prettier, drizzle config)
- Documentation (CHANGELOG, README, ARCHITECTURE)
- Coverage output
- IDE directories

## OpenRouter Smoke Testing

### Secure Test Pattern

OpenRouter integration can be tested without hardcoding API keys:

```bash
# CLI smoke test (reads from env, never prints the key)
npm run test:openrouter

# Requires: OPENROUTER_API_KEY environment variable
# Windows: set OPENROUTER_API_KEY=sk-or-v1-... && npm run test:openrouter
# bash:    OPENROUTER_API_KEY=sk-or-v1-... npm run test:openrouter
```

**Security guarantees:**
- No API key is ever hardcoded in source code, tests, docs, or config files
- The CLI script never prints any part of the API key to stdout/stderr
- If `OPENROUTER_API_KEY` is missing, the test skips gracefully with exit code 0
- All log output in the app is redacted (sk-or-v1-* keys → `[REDACTED_KEY]`)
- The test script uses `openrouter/free` model by default (free tier, no cost)

### Key Format

OpenRouter API keys start with `sk-or-v1-` followed by a long random string. These are redacted by the same `sk-[a-zA-Z0-9]{20,}` pattern (pattern #3 in the redaction table).

## Remote Provider Security

### Supported Remote Providers

| Provider | Auth Method | Key Encryption | Redaction Pattern |
|----------|------------|----------------|-------------------|
| Anthropic | `x-api-key` header | DPAPI safeStorage | `sk-ant-*` pattern |
| OpenAI | `Authorization: Bearer` | DPAPI safeStorage | `sk-proj-*`, `sk-org-*` |
| OpenRouter | `Authorization: Bearer` | DPAPI safeStorage | `sk-*` pattern |
| Google Gemini | Query param `?key=` | DPAPI safeStorage | `AIza*` pattern |
| Mistral | `Authorization: Bearer` | DPAPI safeStorage | `sk-*` pattern |
| Groq | `Authorization: Bearer` | DPAPI safeStorage | `sk-*` pattern |
| DeepSeek | `Authorization: Bearer` | DPAPI safeStorage | `sk-*` pattern |
| Custom | `Authorization: Bearer` | DPAPI safeStorage | `sk-*` pattern |
| Ollama | None (local) | N/A | N/A |
| LM Studio | None (local) | N/A | N/A |

### API Key Lifecycle

1. **Entry**: User enters key in Settings UI (`input[type="password"]` — never visible in DOM)
2. **Encryption**: `vault.encryptToBase64(key)` uses Electron `safeStorage` (DPAPI on Windows)
3. **Storage**: Base64-encoded encrypted blob in `providers.api_key_enc` column
4. **Decryption**: `vault.decryptFromBase64(blob)` only in main process, never sent to renderer
5. **Transmission**: Decrypted key sent over HTTPS only to the configured provider's API
6. **Masking**: Settings UI shows `●●●●●●●● Key configured` or `sk-XXXX...XXXX` when key exists

### Network Transmission

- All remote provider API calls use HTTPS (enforced by provider default URLs)
- API keys are transmitted in headers (`Authorization: Bearer`, `x-api-key`) or query params (Gemini)
- No API keys are sent to any domain other than the configured provider's `base_url`
- Request/response bodies are logged with all secrets redacted
- Custom provider base URLs are user-configured — users must ensure HTTPS for production use

### Log Sanitization Coverage

Every adapter's auth mechanism is covered by the redaction patterns:
- **Bearer tokens** (OpenAI, OpenRouter, Mistral, Groq, DeepSeek, Custom): Pattern #5
- **x-api-key header** (Anthropic): Pattern #6
- **Query param API key** (Gemini): Pattern #4 + sanitized in URL logging
- **sk- prefix keys**: Patterns #1, #2, #3 (ordered specific→generic)

All log entries pass through `redactSecrets()` before DB storage. Debug bundle export applies redaction to all fields.

## LivePreview Security

### Sandbox Architecture

LivePreview creates isolated sandbox directories for previewing generated code:

- **Location**: Sandboxes are created under the app's `userData` directory (e.g., `%APPDATA%/aureon-desk/preview-sandboxes/`)
- **Isolation**: Each preview has its own subfolder with a unique ID — no shared state between previews
- **Path traversal protection**: All file paths are validated against escaping the sandbox directory (no `../`, no absolute paths outside sandbox)
- **Template generation**: Templates are hardcoded in the service — no user-provided templates to prevent injection
- **In-Process HTTP Static Preview Server**: For `html` and `demo` templates, the preview server runs directly inside Electron's main process, completely eliminating the need for Windows sub-process spawning, reducing overhead, and ensuring absolute sandboxing as no external Node processes are started.
- **Canonical Path Containment**: Every request received by the in-process server is strictly checked against directory escaping using `path.resolve` containment checks (`resolvedFile.startsWith(resolvedSandbox)`), returning a secure `403 Forbidden` response for unauthorized access attempts.

### Preview Runner Security

When running a local dev server:

- **Command execution**: `npm install` and `npm run dev` are the only allowed commands
- **Process containment**: The dev server is bound to `127.0.0.1` (localhost only) — not accessible from other machines
- **Port detection**: The service scans for available ports (3100+) to avoid conflicts
- **Clean shutdown**: The server process is tracked and killable via the Stop button
- **No arbitrary commands**: Only pre-approved commands run in the sandbox directory

### Log Safety

All preview stdout/stderr output passes through the same `redactSecrets()` pipeline:

- API keys (`sk-*`, `AIza*`, etc.) → `[REDACTED_KEY]`
- Bearer tokens → `Bearer [REDACTED]`
- Authorization headers → `Authorization=[REDACTED]`
- Private key blocks → `[REDACTED_PRIVATE_KEY]`

### User Confirmation

Before any file write or server start:

1. The user must explicitly click **Create Preview** to generate sandbox files
2. The user must explicitly click **Start Server** to launch the dev server
3. The user can stop the server at any time with the **Stop Server** button

### Sandbox Cleanup

- Old sandboxes (24+ hours) can be cleaned up via the service's `cleanupSandboxes()` method
- Sandboxes are not automatically deleted — users control cleanup

## Connection Test Safety

### Test Connection Flow

Each provider card has a **Test Connection** button that verifies API connectivity without sending sensitive data:

- **What's sent**: A minimal test request with a tiny prompt ("Hello") to the provider's API
- **No data stored**: Test prompts and responses are never persisted to chat history or logs
- **Secrets redacted**: All test request/response bodies pass through `redactSecrets()` before display or logging
- **Graceful failures**: Invalid keys, offline servers, rate limits, and unavailable models all show clear error messages in the UI — never raw stack traces
- **Fake key safety**: Testing with an invalid key simply shows "Connection failed" — no crash, no data leak

### Provider Test Center

The Settings page also exposes a Provider Test Center for a consolidated provider health view:

- **No raw secrets in renderer text**: Test result messages are sanitized again in the renderer before they are displayed.
- **Sequential Test All**: Bulk testing runs one provider after another to avoid noisy parallel failures and rate-limit spikes.
- **Status-only key display**: The UI shows whether a key is stored or missing, never the decrypted key.
- **Local provider handling**: Ollama and LM Studio are labeled as no-key-needed and only checked against localhost model endpoints.
- **Timing metadata only**: Latency and last-checked timestamps are stored in component state, not persisted as chat history.

### Local Provider Testing

- **Ollama**: Tests via `/api/tags` (lists available models) — no content sent to remote servers
- **LM Studio**: Tests via `/v1/models` — no content sent to remote servers
- **Offline detection**: Connection refused errors include actionable fix instructions (e.g., "Start Ollama with `ollama serve`")

## Cowork Agent Workspace Safety

### Safe-by-Default Design
Cowork mode enforces strict safety gates to prevent autonomous desktop control or destructive automation:
- **No Browser Use**: Web browsing capabilities default to Off/Disabled to prevent arbitrary page scrapes or scraping private credentials.
- **No Computer Use**: Autonomous mouse, keyboard, or display control routines are disabled to prevent the agent from manipulating the user's host environment.
- **Sandboxed File System Access**: File system operations default to "Project-Only", locking all read/write side-effects strictly inside the active workspace directory.
- **Explicit Shell Approvals**: Shell execution tools default to Off and require explicit manual authorization on a per-command basis.
- **Radio-controlled Network Access**: Connections default to "Providers-Only", blocking connections to unverified third-party domains.
- **System Permissions**: OS Accessibility and Screen Recording permissions are marked as "Not requested" by default.
- **Process Blocking (Denied Apps)**: The workspace prevents the agent from inspecting or touching sensitive running application processes (e.g., Slack, Discord, Steam, Google Chrome Passwords, Windows Terminal).

### Interactive Safety Gate (Approval Lifecycle)
Tasks transition through `Draft` ➔ `Ready` ➔ `Running` ➔ `Waiting for approval` ➔ `Completed` / `Failed`.
- **Manual Gate Intervention**: If an agent requests a write operation or terminal command, the execution suspends. The UI presents an explicit **Approve / Reject** card showing the exact operation details.
- **No Accidental Execution**: Shell execution and file writes will abort immediately if the user clicks "Reject" or closes the task.

## Code Mode & LivePreview Safety

### Port Allocation & Conflict Resolution
- **127.0.0.1 Binding**: The LivePreview static server is explicitly bound to `127.0.0.1` rather than `0.0.0.0` or raw host addresses. This prevents external machines on the same local network from connecting to the running sandbox.
- **Dynamic Port Selection**: If the target port (default `5173`) is busy, the server automatically searches and binds to the next available port, preventing starting failures.

### Path Containment & Traversal Defense
- **Strict Sandbox Resolve**: Static file requests are resolved using `path.resolve` against the designated sandbox path.
- **Traversal Prevention**: If a path tries to read files outside the sandbox directory structure, the request is immediately rejected with a `403 Forbidden` response.

### File Privacy in Code Mode
- **Omitted Configuration Files**: To prevent credentials from leaking to external provider endpoints, the workspace automatically blocks and hides configuration/dotfiles (e.g. `.env`, `.git/`, `node_modules/`).
- **Authorization Gate for Edits**: Automated file writes require explicit user confirmation before any content is written back to the active workspace directory.

## Known Security Limitations

1. **No code signing**: The Windows installer is not code-signed. Windows SmartScreen will show a warning.
2. **No auto-updater**: Manual updates required. No update server or signing infrastructure.
3. **No CSP headers**: Content Security Policy not yet enforced in the renderer.
4. **No 2FA/MFA**: No multi-factor auth for provider keys. Relies on OS-level DPAPI.
5. **Local DB encryption**: SQLite database file is not encrypted at rest. Relies on file system permissions.

## Beta Clean Release

Before distributing builds, run through the full checklist at [`docs/BETA_CLEAN_RELEASE_CHECKLIST.md`](./BETA_CLEAN_RELEASE_CHECKLIST.md).

Key points:
- Zero real API keys in source (verified by `git grep`)
- `.gitignore` excludes all local data, logs, databases, credentials, and test artifacts
- `electron-builder.yml` strips source, tests, docs, and dev config from packaged builds
- First-run state has no chats, no provider keys, and no connected accounts
- Log redaction covers all 9 key/token/secret patterns before any DB or file write
- PowerShell cleanup commands provided for wiping local app data before distribution

## Recommendations for Production

1. Code-sign the Windows installer with an EV certificate
2. Implement auto-updater with signed update manifests
3. Add Content Security Policy headers
4. Encrypt the SQLite database file at rest (SQLCipher or similar)
5. Add user-facing confirmation for all destructive tool calls
6. Add network request allowlisting for providers
