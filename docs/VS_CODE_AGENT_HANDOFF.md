# VS Code Agent Handoff — Aureon Desk

This handoff document catalogs the active state of the **Aureon Desk** workspace for subsequent AI coding sessions.

---

## 1. Current Branch & Revision Info

* **Current Branch:** `main` (tracks `origin/main` upstream)
* **Status:** Behind/ahead check:
  * `main` is current with upstream.
  * Local repository also contains a stale branch `codex/provider-test-center-polish` (ahead of `origin/codex/provider-test-center-polish` by 1 commit).

### Latest Commits (Git Log -12)

1. `e5fbb88` (HEAD -> main, origin/main, origin/master) `chore: package beta after brand, skills, and cleanup gate`
2. `d1403cf` `refactor: consolidate codebase and improve LivePreview performance`
3. `95b7c00` `feat: add agent and skill education center`
4. `6f749e8` `feat: add VoltAgent awesome skills metadata importer`
5. `d939dd4` `feat: add artifact and output renderer system`
6. `14d58e9` `feat: UI simplification pass — simple/advanced mode, cleaner providers, sidebar cleanup`
7. `6320ac7` `feat: finalize Aureon brand logo and app icon system`
8. `c7ab4b0` `fix: harden MCP connection confirmations`
9. `3b6e162` `feat: real MCP execution MVP with safety gates, presets, and discovery`
10. `47ffd11` `feat: add safe drag-and-drop file attachments to Chat and Studio`
11. `cdcdb9c` `fix: blank LivePreview iframe and missing icons in packaged app`
12. `db01f94` `Run live human QA and fix Studio LivePreview flaky test`

---

## 2. Uncommitted Files & Codex Changes

The local working directory has uncommitted files implementing specific **Codex** design and testing features. Do **not** reset or clean these changes.

### Uncommitted Modifications (Working Tree)

* **`.gitignore`**
  * Local exclusions updated.
* **`electron-builder.yml`**
  * Configured app packages and Windows dependencies.
* **`package.json`** & **`package-lock.json`**
  * Added developer tools and diagnostics scripts (`test:human:headed`, `audit:deadcode`, `audit:deps`, `audit:cycles`, etc.).
* **`src/main/windows.ts`** & **`src/renderer/index.html`** & **`src/renderer/src/App.tsx`**
  * Integrated routes for Developer Setup page and updated page titles.
* **`src/renderer/src/components/chat/ModelSelector.tsx`**
  * Rebuilt the chat model selector into an advanced 2-column drawer (left: searchable provider sidebar with connection test dots; right: model selection list). Added search and shortcut features.
* **`src/renderer/src/components/chat/BuildPipelinePanel.tsx`** & **`src/renderer/src/pages/LivePreview.tsx`**
  * Removed independent model selection dropdown from the preview activity panel to funnel all generation through the smart main-process model router. Added standard iframe sandbox permissions (`sandbox="allow-scripts allow-forms allow-modals allow-popups allow-same-origin"`).
* **`src/renderer/src/components/shared/AureonMark.tsx`** & **`src/renderer/src/components/shared/BrandLockup.tsx`**
  * Hooked to dynamic re-export scripts matching the `VibeForge` visual theme files.
* **`src/renderer/src/layouts/SettingsLayout.tsx`**
  * Added a `Developer Setup` sidebar entry pointing to the new developer setup tab.
* **`tests/e2e/helpers/electronApp.ts`**
  * Injected environment-sensitive slow-motion delay supports (`AUREON_HUMAN_QA_SLOWMO` and `AUREON_SLOW_MO_MS`) for visual and headed Playwright QA.

### Untracked Files Detected

* **AI Coding Workspace Cache Files:**
  * Config and status folders for other AI tools: `.continue/`, `.roo/`, `.devin/`, `.openhands/`, `.pi/`, `.aider-desk/`, `.augment/`, etc.
* **New Brand Files (VibeForge Branding):**
  * `src/renderer/src/components/shared/VibeForgeMark.tsx`
  * `src/renderer/src/components/shared/VibeForgeBrandLockup.tsx`
  * `assets/brand/vibeforge-*` (logo lockup, marks, banners)
* **New Settings UI:**
  * `src/renderer/src/pages/settings/DeveloperSetupPage.tsx`
* **New QA Spec Files:**
  * `tests/e2e/aureon-human-visible.spec.ts` (headed E2E test)
  * `tests/e2e/aureon-human-serious.spec.ts` (extended interaction checks)
  * `docs/HUMAN_VISIBLE_QA_HARNESS.md`
  * `docs/qa/EXHAUSTIVE_QA_SPEC.md`
  * `docs/FULL_AUTONOMOUS_QA_SPEC.md`
  * `docs/REBRAND_AUDIT.md`
  * `docs/INSTALLER_DEPENDENCIES.md`
* **New Utility Scripts:**
  * `scripts/check-prerequisites.mjs`
  * `scripts/summarize-human-qa.mjs`
* **Prepackaged Installers:**
  * `AureonDesk-Setup-0.9.0-x64.exe`, `AureonDesk-Portable-0.9.0-x64.exe`, `Aureon-Desk-Beta-No-Install.zip`

---

## 3. Test & Verification Results

* **Native Dependency Verification (`npm run verify:native`):** ✅ **PASS**
  * SQLite `better-sqlite3` native library successfully compiled and dynamically loaded.
* **TypeScript Compilation (`npm run typecheck`):** ✅ **PASS**
  * Both node process and browser renderer configurations build without errors.
* **Unit Tests (`npm test`):** ✅ **PASS**
  * All 845 unit tests passed successfully in 3.28 seconds.
* **Production Build (`npm run build`):** ✅ **PASS**
  * Vite bundling completed successfully for main, preload, and web renderer.

---

## 4. Diagnostics & Environment Setup

### Environment Warning
When running `npm` commands on the system's global Node.js `v26.4.0`, a path resolution issue causes NPM to error out:
```
Error: Cannot find module 'C:\Program Files\nodejs\node_modules\npm\bin\npm-prefix.js'
```

### Clean Workaround
An NVM (Node Version Manager) setup is available in the user's environment. To run any development scripts, verify code, or execute tests, **you must prioritize NVM's Node v20.19.5** by modifying the session path first:

```powershell
# Prepend Node 20.19.5 directory to path in your PowerShell execution command:
$env:PATH = "C:\Users\mertg\AppData\Local\nvm\v20.19.5;" + $env:PATH

# Examples of running verified tasks:
$env:PATH = "C:\Users\mertg\AppData\Local\nvm\v20.19.5;" + $env:PATH; npm run typecheck
$env:PATH = "C:\Users\mertg\AppData\Local\nvm\v20.19.5;" + $env:PATH; npm test
$env:PATH = "C:\Users\mertg\AppData\Local\nvm\v20.19.5;" + $env:PATH; npm run build
```

---

## 5. Development Guidelines & Boundaries

### What is Safe to Edit Next
1. **Developer Setup Page (`DeveloperSetupPage.tsx`):**
   * Expand the setup check UI to list diagnostic statuses or link package scripts.
2. **Deterministic LivePreview Templates:**
   * Extend generated prototypes or template builders to be smarter/adaptive depending on intent.
3. **Advanced Model Selector Features:**
   * Add filters or connection latency details inside the new 2-column model panel layout.
4. **General App Polish:**
   * Implement additional style settings or documentation templates under `docs/`.

### What MUST NOT Be Touched
* **CRITICAL:** **Do not run `git reset` or `git clean`!** Discarding these changes will wipe the active developer settings page, the new `ModelSelector` sidebar design, and custom test scripts.
* **Do not delete untracked agent folders** (like `.continue`, `.roo`, etc.) as they store configuration data for active AI sessions.
* **Do not hardcode secrets or API keys.** Verify that key-redacting helper functions are used for any logging or preview output writes.
* **Do not modify the Studio → LivePreview SessionStorage/IPC contract** keys (`build-pipeline-prompt`, `build-pipeline-theme`, etc.) unless keeping the contracts in `docs/STUDIO_LIVEPREVIEW_CONTRACT.md` updated in tandem.
* **Do not cast types as `any` in TypeScript files.** Follow the project type safety guidelines.
