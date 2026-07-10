# Vibeforge Rebrand Audit

Rebranding the product from **Aureon Desk** to **Vibeforge** (formerly Aureon Desk).

---

## 1. Occurrences Audit & Action Plan

| File | Occurrence | Context / Usage | Action | Rationale |
|------|------------|-----------------|--------|-----------|
| `package.json` | `"name": "aureon-desk"` | Project package name | Replace | Rename to `"vibeforge-desk"` or `"vibeforge"`. |
| `package.json` | `"author": "VibeForge"` | Author field | Keep | Already correct. |
| `package.json` | Scripts referencing `aureon` | QA / test scripts | Replace | Rename files and package scripts to use `vibeforge`. |
| `electron-builder.yml` | `appId: com.aureon.desk` | Windows package ID | Keep / Alias | Keep App ID as `com.aureon.desk` or handle path fallback. |
| `electron-builder.yml` | `productName: VibeForge` | Built executable name | Keep | Already correct. |
| `src/main/index.ts` | `com.aureon.desk` | `setAppUserModelId` | Keep / Alias | Keep for shell shortcut compatibility. |
| `src/main/index.ts` | `Aureon Desk starting...` | Boot logs | Replace | Update to `Vibeforge starting...` |
| `src/main/windows.ts` | `title: 'VibeForge'` | Window title | Keep | Already correct. |
| `src/renderer/index.html` | `<title>Aureon Desk</title>` | Browser frame title | Replace | Update to `Vibeforge` |
| `src/renderer/src/App.tsx` | Routes / Pages references | Routing components | Replace | Update references. |
| `src/renderer/src/layouts/AppShell.tsx` | `Aureon Desk` text in topbar | Header visual brand | Replace | Update to `Vibeforge` |
| `src/renderer/src/pages/ChatWorkspace.tsx` | `Aureon` greeting / prompt | Greeting header | Replace | Update to `Vibeforge` |
| `src/renderer/src/pages/LivePreview.tsx` | `Aureon Live Sandbox Preview` | iframe title | Replace | Update to `Vibeforge Live Sandbox Preview` |
| `src/renderer/src/pages/settings/GeneralSettingsPage.tsx` | About / Version info | User settings | Replace | Add migration note "formerly Aureon Desk" |
| `README.md` | `Aureon Desk` | Main codebase documentation | Replace | Update headers, keep short historical note. |
| `CHANGELOG.md` | Historical release names | Project changelog | Keep | Keep old versions as historical notes, add rebrand entry. |
| `docs/ISSUES_REGISTER.md` | Verification status | Internal QA issues | Replace | Update header and confirm rebrand passes. |
| `docs/IMPLEMENTATION_LOG.md` | Historical logs | Append-only log | Keep / Append | Append rebrand session entry, keep previous logs. |
| `tests/e2e/*.spec.ts` | File names like `01-aureon-smoke.spec.ts` | E2E test files | Replace | Rename files to `*-vibeforge-*.spec.ts`. |

---

## 2. App Data Preservation Strategy

To prevent breaking existing user data (SQLite database, keys, and session logs) on developer or tester machines:
* We will keep the package name as `vibeforge` (or update it in `package.json`).
* In the Electron entry point (`src/main/index.ts`), we will check if the user has an existing `%APPDATA%/aureon-desk` folder. If so, we dynamically override the `userData` path to point to the existing `aureon-desk` folder:
  ```typescript
  const defaultPath = app.getPath('userData')
  if (defaultPath.endsWith('vibeforge') || defaultPath.endsWith('Vibeforge')) {
    const legacyPath = defaultPath.replace(/vibeforge$/i, 'aureon-desk')
    if (fs.existsSync(legacyPath)) {
      app.setPath('userData', legacyPath)
    }
  }
  ```
* This creates a seamless migration without any data loss.

---

## 3. Brand Assets Strategy

* **VibeForgeMark / BrandLockup Components:** Already present in untracked files (`VibeForgeMark.tsx` and `VibeForgeBrandLockup.tsx`).
* **Aliased Exports:** [AureonMark.tsx](file:///C:/Users/mertg/Desktop/code/src/renderer/src/components/shared/AureonMark.tsx) and [BrandLockup.tsx](file:///C:/Users/mertg/Desktop/code/src/renderer/src/components/shared/BrandLockup.tsx) will be updated to cleanly export `VibeForgeMark` as `AureonMark` and `VibeForgeBrandLockup` as `BrandLockup` for full compatibility.
* **Build Icons:** `build/icon.ico` and `build/icon.png` will be updated to use the new VibeForge visual mark.
