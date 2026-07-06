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

## Known Security Limitations

1. **No code signing**: The Windows installer is not code-signed. Windows SmartScreen will show a warning.
2. **No auto-updater**: Manual updates required. No update server or signing infrastructure.
3. **No CSP headers**: Content Security Policy not yet enforced in the renderer.
4. **No 2FA/MFA**: No multi-factor auth for provider keys. Relies on OS-level DPAPI.
5. **Local DB encryption**: SQLite database file is not encrypted at rest. Relies on file system permissions.

## Recommendations for Production

1. Code-sign the Windows installer with an EV certificate
2. Implement auto-updater with signed update manifests
3. Add Content Security Policy headers
4. Encrypt the SQLite database file at rest (SQLCipher or similar)
5. Add user-facing confirmation for all destructive tool calls
6. Add network request allowlisting for providers
