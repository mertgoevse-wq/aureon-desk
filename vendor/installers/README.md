# vendor/installers — Offline Dependency Installers

This folder holds **manually downloaded** installer files for developer tools
needed to build, test, and develop Vibeforge from source.

## ⚠️ Important

- **These installers are NEVER committed to Git.**
- You must download them yourself from the official sources.
- Vibeforge never silently installs anything from this folder.

## Expected Files

| File | Source | License |
|------|--------|---------|
| `node-lts-x64.msi` | [nodejs.org](https://nodejs.org/en/download) | MIT |
| `git-for-windows-x64.exe` | [git-scm.com](https://git-scm.com/download/win) | GPL v2 |
| `github-cli-x64.msi` | [github.com/cli/cli/releases](https://github.com/cli/cli/releases) | MIT |
| `vs-build-tools.exe` | [visualstudio.microsoft.com](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022) | Microsoft EULA |
| `ollama-windows.exe` | [ollama.com](https://ollama.com/download) | MIT |

## How to Populate

1. Download each installer from the official source listed above
2. Place the downloaded file in this folder with the exact filename shown
3. Vibeforge's Developer Setup page will auto-detect them

## Redistribution

**Do NOT redistribute these installers** unless you have verified the license
permits it. Most are MIT or GPL and permit redistribution, but VS Build Tools
requires acceptance of the Microsoft EULA during installation.

## Normal Users

If you're just using Vibeforge (not developing it), you don't need any of
these. The app runs standalone with its bundled Electron runtime.
