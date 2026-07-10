# Aureon Desk — Installer Dependencies

> What developers need vs what normal users need.
> All optional tools are opt-in only. No silent installs.

---

## Runtime (Always Bundled)

These ship inside the Electron app. Users need nothing extra.

| Dependency | Purpose | Bundled | Notes |
|-----------|---------|---------|-------|
| Electron 43 | App runtime | ✅ | 404 KB main, 236 MB unpacked |
| better-sqlite3 | Local database | ✅ | Native module, auto-rebuilt |
| Node.js (Electron) | JS runtime | ✅ | No system Node required |
| Chromium | Web renderer | ✅ | Inside Electron |
| Aureon Desk | The app | ✅ | NSIS installer + portable |

**No Node, Git, or VS Build Tools required for normal use.**

---

## Developer Mode (Optional)

Required **only** if you want to build, test, or develop Aureon Desk from source.

### Required for Source Build

| Dependency | Purpose | How to Install | Detection |
|-----------|---------|---------------|-----------|
| **Node.js 20 LTS** | JS runtime, npm | `winget install OpenJS.NodeJS.LTS` or [nodejs.org](https://nodejs.org) | `node --version` |
| **Git for Windows** | Version control | `winget install Git.Git` or [git-scm.com](https://git-scm.com) | `git --version` |
| **VS Build Tools 2022** | Native modules (better-sqlite3) | [visualstudio.microsoft.com](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022) → Desktop C++ workload | Check `%ProgramFiles(x86)%\Microsoft Visual Studio\2022\BuildTools` |
| **Playwright browsers** | E2E testing | `npx playwright install chromium` | `npx playwright install --dry-run` |

### Recommended for Developers

| Dependency | Purpose | How to Install | Detection |
|-----------|---------|---------------|-----------|
| **GitHub CLI** | PRs, issues, releases | `winget install GitHub.cli` | `gh --version` |
| **Ollama** | Local LLM models | `winget install Ollama.Ollama` or [ollama.com](https://ollama.com) | `ollama --version` |
| **LM Studio** | Local LLM GUI | [lmstudio.ai](https://lmstudio.ai) | Check `%LOCALAPPDATA%\LM-Studio` |

### Optional AI / Local Tools

| Dependency | Purpose | How to Install | Detection |
|-----------|---------|---------------|-----------|
| **Ollama models** | Local AI (llama3, mistral, etc.) | `ollama pull llama3.1` | `ollama list` |
| **Windows Terminal** | Better CLI | `winget install Microsoft.WindowsTerminal` | Check for `wt.exe` |

---

## Offline Installer Folder

If you want to provide installers without internet access, place them in:

```
vendor/installers/
├── README.md              ← explains this folder
├── node-lts-x64.msi       ← Node.js LTS (from nodejs.org)
├── git-for-windows-x64.exe ← Git for Windows (from git-scm.com)
├── github-cli-x64.msi     ← GitHub CLI (from GitHub)
├── vs-build-tools.exe     ← VS Build Tools bootstrapper
└── ollama-windows.exe     ← Ollama for Windows
```

**These files are NOT committed to Git** (see `.gitignore`).
They must be manually downloaded from their respective official sources.

### Download Links

| File | Source | License |
|------|--------|---------|
| `node-lts-x64.msi` | [nodejs.org/en/download](https://nodejs.org/en/download) | MIT |
| `git-for-windows-x64.exe` | [git-scm.com/download/win](https://git-scm.com/download/win) | GPL v2 |
| `github-cli-x64.msi` | [github.com/cli/cli/releases](https://github.com/cli/cli/releases) | MIT |
| `vs-build-tools.exe` | [visualstudio.microsoft.com](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022) | Microsoft EULA |
| `ollama-windows.exe` | [ollama.com/download](https://ollama.com/download) | MIT |

---

## NSIS Installer Options

The current NSIS installer (`electron-builder --win`) offers:

- **Standard Install** — Aureon Desk only, no extras
- **Portable** — Self-extracting, no installation

A future custom NSIS page could add:

- [ ] Developer Tools Setup checkbox group
- [ ] Offline dependency folder browser
- [ ] Skip all optional tools (default)

Currently, developer tool detection happens **in-app** via the Settings → Developer Setup page.

---

## In-App Developer Setup

Route: **Settings → Developer Setup** (`/settings/developer-setup`)

Features:
- Status card per dependency (✅ installed / ⚠️ missing / 🔄 checking)
- One-click copy of install commands
- Open official download pages
- Offline installer detection (checks `vendor/installers/`)
- Recommended tools for the current device

### Detection Commands Used

```
node --version          → Node.js version
npm --version           → npm version
git --version           → Git version
gh --version            → GitHub CLI version
ollama --version        → Ollama version
ollama list             → Installed models
npx playwright install --dry-run → Playwright browser status
System check:           → Windows version, CPU cores, RAM
```

---

## Safety Rules

1. **No silent installs** — Every tool requires explicit user action
2. **No bundled installers** — `vendor/installers/` is user-populated
3. **License attribution** — All tools show source and license
4. **Admin elevation** — Only when Windows requires it, with explicit confirmation
5. **Normal users** — Simple install. No developer tools suggested.
6. **Offline mode** — Works if `vendor/installers/` is populated manually
