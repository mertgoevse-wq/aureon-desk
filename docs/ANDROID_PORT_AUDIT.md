# Vibeforge — Android Port Audit

> **Date:** 2026-07-10  
> **Scope:** Identify every desktop-only Electron API, Node.js dependency, and UI pattern that must change for a future Android (Capacitor) build.  
> **Goal:** Keep the desktop app stable while preparing realistic mobile foundations.

---

## 1. Audit Methodology

We inspected the following areas:

- Renderer routes and navigation
- Desktop-only Electron APIs (`app`, `BrowserWindow`, `ipcRenderer`, `safeStorage`)
- File-system usage (`fs`, `path`, `os`)
- IPC bridge (`src/preload/index.ts`)
- LivePreview / sandbox server (`child_process`, `http`)
- Provider key storage (`safeStorage`)
- SQLite / `better-sqlite3`
- Window controls, drag/drop, MCP/local tools, shell commands

Each item is classified as:

| Classification | Meaning |
| :------------- | :------ |
| ✅ Works on mobile web | No changes needed, or only CSS tweaks |
| ⚠️ Needs abstraction | Must go through a platform adapter |
| 🖥️ Desktop-only | Feature is intentionally desktop-only; hide/disable on mobile |
| ❌ Impossible/unsafe on Android | Cannot run on Android; must be replaced or removed |
| 🔌 Future native plugin needed | Requires a Capacitor plugin later |

---

## 2. Renderer Routes

| Route | File | Mobile Status | Notes |
| :---- | :--- | :------------ | :---- |
| `/` Studio | `src/renderer/src/pages/Studio.tsx` | ✅ Works | Hero composer + cards; touch targets already sized |
| `/chat` | `src/renderer/src/pages/ChatWorkspace.tsx` | ✅ Works | Chat UI is mobile-friendly |
| `/preview` LivePreview | `src/renderer/src/pages/LivePreview.tsx` | ⚠️ Needs abstraction | Uses `window.api.preview*` (IPC) and assumes local server |
| `/vibe` | `src/renderer/src/pages/VibeCoding.tsx` | ✅ Works | Cards and tabs are responsive |
| `/skills` | `src/renderer/src/pages/SkillsPage.tsx` | ✅ Works | Grid adapts to small screens |
| `/learn` | `src/renderer/src/pages/LearnPage.tsx` | ✅ Works | Education content |
| `/cowork` | `src/renderer/src/pages/CoworkPage.tsx` | ✅ Works | Task composer |
| `/settings/*` | `src/renderer/src/pages/settings/*.tsx` | ⚠️ Needs abstraction | Many settings pages call desktop-only APIs |
| `/companion` | `src/renderer/src/pages/CompanionMobileView.tsx` | ✅ Works | Designed for mobile companion preview |

**Action:** Wrap route definitions in a platform-aware router so mobile builds can disable `/preview` and advanced settings until adapters are ready.

---
## 3. Desktop-Only Electron APIs

| API | Usage Location | Mobile Status | Migration Path |
| :-- | :------------- | :------------ | :------------- |
| `app.getPath('userData')` | `live-preview.service.ts`, `logger.ts` | ⚠️ Needs abstraction | Use Capacitor `Filesystem` / `Preferences` |
| `BrowserWindow` | `windows.ts` | 🖥️ Desktop-only | Not needed on mobile; use full-screen WebView |
| `Menu` | `index.ts` | 🖥️ Desktop-only | Use native Android menus or in-app overflow menu |
| `dialog` | `index.ts`, `project.service.ts` | ❌ Impossible/unsafe | Use Capacitor file picker / native dialogs |
| `clipboard` | `windows.ts` | ⚠️ Needs abstraction | Use `@capacitor/clipboard` |
| `shell.openExternal` | `windows.ts`, multiple pages | ⚠️ Needs abstraction | Use `@capacitor/browser` |
| `nativeImage` | `windows.ts` | 🖥️ Desktop-only | Use Android asset pipeline |
| `safeStorage` | `vault.ts` | ❌ Impossible/unsafe | Use Android Keystore via a secure plugin |
| `ipcRenderer` | `preload/index.ts` | ⚠️ Needs abstraction | Replace with Capacitor plugin bridge |
| `contextBridge` | `preload/index.ts` | 🖥️ Desktop-only | Not used in Capacitor builds |

---

## 4. File System Usage

| Feature | Files | Mobile Status | Migration Path |
| :------ | :---- | :------------ | :------------- |
| Sandbox root (`preview-sandbox`) | `live-preview.service.ts` | ⚠️ Needs abstraction | Capacitor `Filesystem` directory |
| Log files | `logger.ts` | ⚠️ Needs abstraction | Capacitor `Filesystem` or remote logging |
| Project file trees | `project.service.ts` | ❌ Impossible/unsafe | Limit to scoped storage; no arbitrary FS |
| GitHub import clone | `github-import.service.ts` | ❌ Impossible/unsafe | Move to backend or remove on mobile |
| Attachment processing | `attachment.service.ts` | 🔌 Future native plugin | Use Capacitor file picker + read |
| Database file (`*.db`) | `db/index.ts` | ⚠️ Needs abstraction | `@capacitor-community/sqlite` |

---

## 5. IPC Usage

The preload bridge (`src/preload/index.ts`) exposes ~100 methods on `window.api`. On mobile these must be routed through a Capacitor plugin or a web fallback.

| IPC Area | Method Count | Mobile Strategy |
| :------- | :----------- | :-------------- |
| Chat / Messages | 10 | ✅ Works via HTTP API fallback |
| Providers / Models | 18 | ⚠️ Needs secure bridge (keys on device) |
| Settings | 4 | ✅ Works via HTTP API fallback |
| Prompt Library | 10 | ✅ Works via HTTP API fallback |
| LivePreview | 9 | ⚠️ Needs mobile preview adapter |
| Tools / MCP | 14 | ❌ Disable on mobile v1 |
| Projects / File tree | 8 | ❌ Disable on mobile v1 |
| Logs / Debug | 9 | ⚠️ Needs adapter |
| Studio / Build | 7 | ⚠️ Needs adapter |
| Device Inputs | 1 | 🔌 Future plugin |
| Attachments | 4 | 🔌 Future plugin |

**Action:** Create a `PlatformIpcAdapter` interface with desktop (Electron) and mobile (Capacitor HTTP) implementations.

---

## 6. LivePreview Dependencies

| Dependency | Desktop | Mobile |
| :--------- | :------ | :----- |
| Local HTTP server (`http`) | In-process / spawned | Use Capacitor `Http` or host preview in WebView |
| `child_process.spawn` | Vite/React sandbox | Not available; use static HTML only |
| `npm install` | Installs deps in sandbox | Not available; bundle deps offline |
| File watcher | `fs.watch` | Not available; reload manually |
| `127.0.0.1` localhost | Works | May need `https://localhost` or custom scheme |

**Mobile strategy:**
- Phase 1: Static HTML/JS preview only (no Vite)
- Phase 2: Bundle lightweight runtime (no npm)
- Phase 3: Optional cloud build backend

---

## 7. Provider Key Storage

| Desktop | Mobile |
| :------ | :----- |
| `safeStorage` (DPAPI on Windows) | Android Keystore / EncryptedSharedPreferences |
| Keys stored locally in SQLite | Same, but encrypted at rest |

**Action:** Add a `VaultAdapter` with Electron and Android Keystore implementations.

---

## 8. SQLite / better-sqlite3

| Desktop | Mobile |
| :------ | :----- |
| `better-sqlite3` native module | `@capacitor-community/sqlite` |
| Drizzle ORM works with both | Drizzle ORM works with both |
| Synchronous API | Async API |

**Action:** Wrap DB access in an async adapter. On desktop, keep `better-sqlite3`; on mobile, use `@capacitor-community/sqlite`.

---

## 9. Window Controls

| Feature | Desktop | Mobile |
| :------ | :------ | :----- |
| Minimize / Maximize / Close | Native OS frame | System back gesture / app lifecycle |
| Custom topbar | AppShell header | Same header, but no window controls |
| Resize / drag | Window edges | Orientation change only |

**Action:** Make window-control IPC calls no-op on mobile and hide the control buttons.

---

## 10. Drag / Drop

| Feature | Desktop | Mobile |
| :------ | :------ | :----- |
| File drop on chat | `dragover` / `drop` | Use file picker |
| Attachment drag from explorer | Native drag | Use share sheet |

**Action:** Replace drag/drop with explicit file picker on mobile.

---

## 11. MCP / Local Tools

| Feature | Desktop | Mobile v1 |
| :------ | :------ | :---------- |
| Local MCP servers | Spawn subprocess | Disable |
| File search mock | Local FS | Disable |
| Git status mock | Local git | Disable |
| Project summary mock | Local FS | Disable |

**Action:** Hide Tools/MCP settings on mobile v1.

---

## 12. Shell Commands

| Feature | Desktop | Mobile |
| :------ | :------ | :----- |
| `npm install` in sandbox | Works | Not available |
| `git clone` | Works | Not available |
| `npx vite` | Works | Not available |
| `execSync` for tool detection | Works | Not available |

**Action:** Route shell commands through a `ShellAdapter` that returns `unsupported` on mobile.

---

## 13. Summary Table

| Category | ✅ Works | ⚠️ Needs Abstraction | 🖥️ Desktop-only | ❌ Impossible/Unsafe | 🔌 Future Plugin |
| :------- | :------ | :------------------- | :--------------- | :------------------ | :--------------- |
| Routes | 6 | 2 | 0 | 0 | 0 |
| Electron APIs | 0 | 4 | 3 | 2 | 0 |
| File System | 0 | 3 | 0 | 3 | 1 |
| IPC Methods | 34 | 27 | 0 | 22 | 5 |
| LivePreview | 0 | 3 | 0 | 2 | 0 |
| Storage/DB | 0 | 2 | 0 | 1 | 0 |
| Window/Drag | 0 | 0 | 2 | 2 | 0 |
| MCP/Shell | 0 | 1 | 0 | 5 | 0 |
| **TOTAL** | **40** | **42** | **5** | **37** | **6** |

---

## 14. Recommended Phases

### Phase 1 — Foundation (keep desktop stable)
- Introduce `PlatformAdapter` interface
- Implement desktop adapter (no behavior change)
- Add mobile placeholder adapter with graceful `unsupported` fallbacks
- Hide desktop-only routes on mobile builds

### Phase 2 — Mobile Web Build
- Build renderer as pure web app
- Replace Electron IPC with HTTP API fallback
- Use IndexedDB / localStorage where SQLite is not yet available

### Phase 3 — Capacitor Android Shell
- Add Capacitor project
- Implement Android vault, file, and DB plugins
- Wire preview to WebView

### Phase 4 — Feature Parity
- Re-enable safe mobile features (file picker, share sheet, camera)
- Add native notifications
- Galaxy A56 testing

---

## 15. Files Requiring Adapter Wrappers

| File | Adapter Needed |
| :--- | :------------- |
| `src/main/services/live-preview.service.ts` | `PreviewAdapter` |
| `src/main/security/vault.ts` | `VaultAdapter` |
| `src/main/db/index.ts` | `DatabaseAdapter` |
| `src/main/services/provider-call.ts` | `ProviderAdapter` (already mostly platform-agnostic) |
| `src/main/services/project.service.ts` | `FileSystemAdapter` |
| `src/main/services/github-import.service.ts` | `ShellAdapter` |
| `src/main/services/attachment.service.ts` | `FilePickerAdapter` |
| `src/preload/index.ts` | `IpcAdapter` |
| `src/main/windows.ts` | `WindowAdapter` |

---

*End of audit. Next: implement the platform adapter pattern and create the Capacitor plan.*
