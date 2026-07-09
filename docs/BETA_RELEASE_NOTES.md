# Aureon Desk — Private Beta Release Notes

**Version:** 0.9.73  
**Commit:** `0295c4f`  
**Date:** 2026-07-09  
**Status:** Private Beta — Not for public distribution

---

## What's Included

### Installer
- **File:** `AureonDesk-Setup-0.9.0-x64.exe` (~124 MB)
- **Type:** NSIS installer — installs to `%LOCALAPPDATA%\Aureon Desk`
- **SmartScreen:** Will show a warning (not code-signed yet). Click "More info" → "Run anyway".

### Portable (No-Install)
- **File:** `AureonDesk-Portable-0.9.0-x64.exe` (~124 MB)
- **Type:** Self-extracting portable — run from any folder, no installation needed

### No-Install ZIP
- **File:** `Aureon-Desk-Beta-No-Install.zip` (~174 MB)
- **How to use:** Extract anywhere, run `Aureon Desk.exe`

---

## What Works ✅

| Feature | Status |
|---------|--------|
| Chat with AI models | ✅ |
| OpenRouter multi-provider access | ✅ |
| Anthropic Claude (Sonnet, Opus, Haiku) | ✅ |
| Google Gemini | ✅ |
| Ollama (local models) | ✅ |
| LM Studio (local models) | ✅ |
| OpenAI, Mistral, Groq, DeepSeek | ✅ |
| Custom OpenAI-compatible providers | ✅ |
| System prompt profiles | ✅ |
| Prompt library with tags/favorites | ✅ |
| Studio — Build App wizard with model routing | ✅ |
| Studio — Code/Connect/Automate cards | ✅ |
| Studio → Code Mode pipeline (9-step flow) | ✅ |
| Vibe Coding — project types + templates | ✅ |
| Vibe Coding — guided builder | ✅ |
| LivePreview — HTML sandbox previews | ✅ |
| LivePreview — Coding Demo (counter app) | ✅ |
| LivePreview — deterministic demo (no API key needed) | ✅ |
| LivePreview — AI code generation (with provider) | ✅ |
| LivePreview — streaming code preview | ✅ |
| Code Mode — Code/Files/Diff/Plan tabs | ✅ |
| MCP Tools manager (master-detail) | ✅ |
| Provider Test Center | ✅ |
| GitHub Star List imports | ✅ |
| Projects with local folder context | ✅ |
| Log viewer with secret redaction | ✅ |
| Debug bundle export | ✅ |
| Keyboard shortcuts | ✅ |
| Collapsible sidebar + right inspector | ✅ |
| Resizable panels | ✅ |
| Ivory calm premium theme | ✅ |

## Known Limitations ⚠️

| Limitation | Detail |
|------------|--------|
| No code signing | Windows SmartScreen will warn on install |
| No auto-updater | Manual updates only |
| Cowork mode | Simulated/placeholder — not yet functional |
| MCP tool execution | Registry only — not wired to live execution |
| File attachment upload | Not yet implemented |
| Streaming cancellation | Not yet implemented |
| Dark mode | Not yet implemented |
| CSP headers | Not yet enforced |
| SQLite DB encryption | Not encrypted at rest |

---

## How to Start

### Option 1: Installer (recommended)
1. Run `AureonDesk-Setup-0.9.0-x64.exe`
2. If SmartScreen warns: click "More info" → "Run anyway"
3. Follow the installer prompts
4. Launch "Aureon Desk" from the Start Menu or desktop shortcut

### Option 2: Portable
1. Run `AureonDesk-Portable-0.9.0-x64.exe`
2. If SmartScreen warns: click "More info" → "Run anyway"
3. Choose an extraction folder
4. Run `Aureon Desk.exe` from the extracted folder

### Option 3: No-Install ZIP
1. Extract `Aureon-Desk-Beta-No-Install.zip` to any folder
2. Run `Aureon Desk.exe` from the extracted folder

---

## How to Configure a Provider

1. Open **Settings** (Ctrl+, or sidebar gear icon)
2. Click **Providers & Models**
3. Choose a provider (OpenRouter is recommended for beginners)
4. Get an API key from the provider's website:
   - **OpenRouter:** [openrouter.ai/keys](https://openrouter.ai/keys)
   - **Anthropic:** [console.anthropic.com](https://console.anthropic.com)
   - **Google Gemini:** [aistudio.google.com](https://aistudio.google.com)
5. Paste the key into the API Key field and click **Save Key**
6. Click **Test Connection** to verify
7. Toggle the provider **Enabled**
8. Return to Chat — the model selector will show available models

### Using Free Models
OpenRouter offers `:free` models for zero-cost testing. After configuring OpenRouter, use the **Auto** model for automatic selection.

---

## How to Use Studio Build App

1. Click the **Studio** tab in the top mode switch (or click the Studio icon in sidebar)
2. Describe what you want to build in the text field (e.g., "a task timer with start, pause, and reset buttons")
3. Click **Start building**
4. The app switches to Code Mode and automatically generates a preview
5. Interact with the generated app in the iframe
6. Use **Stop** / **Restart** buttons to control the preview server

---

## How to Use LivePreview (Code Mode)

1. Click the **Code** tab in the top mode switch
2. Select a template: Simple HTML, Coding Demo, or Vite+React
3. Describe your task in the "Task brief composer"
4. Click **Create & Build** to generate the sandbox
5. The preview appears in the right panel once the server starts
6. Use **Open Browser** to view in your default web browser
7. View server output in the **Server Logs Console** (collapsible)

---

## How to Reset Local Data

If you need to wipe all data and start fresh:

```powershell
# Close the app first, then run in PowerShell:
Remove-Item -Recurse -Force "$env:APPDATA\aureon-desk"
Remove-Item -Recurse -Force "$env:LOCALAPPDATA\aureon-desk"
Remove-Item -Recurse -Force "$env:APPDATA\Aureon Desk"
Remove-Item -Recurse -Force "$env:LOCALAPPDATA\Aureon Desk"
```

This removes all chats, API keys, projects, and settings.

---

## Security Warning — Private Beta Only

**This is private beta software.** Do not:

- Share the installer or download link publicly
- Use with production-critical API keys without testing first
- Send sensitive/confidential data through remote providers
- Assume local data is encrypted at rest (SQLite DB is not encrypted)

**Before distributing to testers:**

- Run through `docs/BETA_CLEAN_RELEASE_CHECKLIST.md`
- Verify zero API keys in the build
- Wipe all local app data

**Encryption:** API keys are encrypted with Windows DPAPI (safeStorage). Chat data is stored in a local SQLite database without additional encryption. File system permissions protect this data.

**Remote providers:** Chat content and project file context is transmitted to the configured provider's API servers. See `SECURITY_NOTES.md` for full details.

---

## Quick Reference

| Action | Shortcut |
|--------|----------|
| Open command palette | Ctrl+K |
| New chat | Ctrl+N |
| Open settings | Ctrl+, |
| Toggle sidebar | Ctrl+B |
| Toggle inspector | Ctrl+I |
| Focus composer | Ctrl+L |
| Keyboard shortcuts help | Ctrl+/ or F1 |
| Close modal/dialog | Esc |

---

## Feedback

Report issues at: [github.com/mertgoevse-wq/aureon-desk](https://github.com/mertgoevse-wq/aureon-desk)

Include:
- Your version (0.9.62 beta)
- What you were doing
- What happened vs what you expected
- Screenshots if helpful
