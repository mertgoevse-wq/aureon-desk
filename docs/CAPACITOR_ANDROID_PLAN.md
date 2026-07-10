# Vibeforge — Capacitor Android Plan

> **Date:** 2026-07-10  
> **Goal:** Ship a realistic Android app version of Vibeforge while keeping the desktop Electron app stable.  
> **Target device:** Samsung Galaxy A56 (and similar mid-range Android 14+ phones)

---

## 1. Package Strategy

### Monorepo Layout

```
vibeforge/
  apps/
    desktop/          # existing Electron app (root today)
    mobile/           # new Capacitor app
      android/        # Android Studio project
      ios/            # future
      capacitor.config.ts
      package.json
  packages/
    shared/           # renderer-agnostic code (already in src/shared)
    ui/               # React components used by both desktop and mobile
```

### Build Outputs

| Output | Desktop | Mobile |
| :----- | :------ | :----- |
| Main bundle | `out/main/index.js` | N/A |
| Renderer bundle | `out/renderer/` | `apps/mobile/www/` |
| Native deps | `better-sqlite3` | `@capacitor-community/sqlite` |
| Package manager | npm | npm |
| CI artifact | `VibeForge-Setup-*.exe` | `app-release.apk` / AAB |

---

## 2. Required Capacitor Plugins

| Plugin | Purpose | Install |
| :----- | :------ | :------ |
| `@capacitor/app` | App lifecycle, back-button handling | `npm i @capacitor/app` |
| `@capacitor/preferences` | Key/value settings | `npm i @capacitor/preferences` |
| `@capacitor/filesystem` | Sandbox / log files | `npm i @capacitor/filesystem` |
| `@capacitor/clipboard` | Copy preview URL, diagnostics | `npm i @capacitor/clipboard` |
| `@capacitor/browser` | Open external links | `npm i @capacitor/browser` |
| `@capacitor/keyboard` | Keyboard show/hide events | `npm i @capacitor/keyboard` |
| `@capacitor/status-bar` | Safe-area / status bar styling | `npm i @capacitor/status-bar` |
| `@capacitor/splash-screen` | Branded splash screen | `npm i @capacitor/splash-screen` |
| `@capacitor-community/sqlite` | SQLite database | `npm i @capacitor-community/sqlite` |
| `capacitor-safe-area` | Safe-area insets | `npm i capacitor-safe-area` |

**Future plugins (v2+):**
- `@capacitor/push-notifications` — native push
- `@capacitor/camera` — image attachments
- `@capacitor/share` — share preview URL
- Custom Android Keystore plugin — encrypted API keys

---

## 3. Limitations

### v1 — Must Disable on Mobile

| Feature | Reason |
| :------ | :----- |
| Local MCP tool servers | Cannot spawn subprocesses |
| Project file-tree explorer | No arbitrary file-system access |
| GitHub import / git clone | No shell / git binary |
| Vite/React sandbox with npm | No Node runtime |
| Drag & drop attachments | Use file picker instead |
| Custom window controls | Android manages its own window |

### v1 — Supported

- Chat with all configured providers
- Studio task cards and vibe coding
- Static HTML preview in WebView
- Settings (appearance, providers, prompts)
- Prompt library
- Skills & Agents catalog
- Companion sync (via future plugin)

---

## 4. Security

| Concern | Mitigation |
| :------ | :--------- |
| API keys in plain text | Android Keystore + EncryptedSharedPreferences |
| Arbitrary network requests | Whitelist provider base URLs in Capacitor config |
| WebView mixed content | Use `https` only; local preview served from app sandbox |
| File traversal | Restrict to `Filesystem` app directories |
| Deep links | Validate incoming URLs before routing |

---

## 5. Storage Plan

| Data | Desktop | Mobile |
| :--- | :------ | :----- |
| SQLite DB | `better-sqlite3` file in `userData` | `@capacitor-community/sqlite` |
| Settings | Electron `settings` IPC | `Preferences` plugin |
| API keys | `safeStorage` | Android Keystore |
| Preview sandbox | `preview-sandbox/` folder | `Filesystem` app directory |
| Logs | Rotated text files | Same, via `Filesystem` |

---

## 6. Build Steps

### 6.1 Initialize Capacitor

```bash
mkdir -p apps/mobile
cd apps/mobile
npm init -y
npm i @capacitor/core @capacitor/cli @capacitor/android
npx cap init Vibeforge com.vibeforge.app --web-dir www
npx cap add android
```

### 6.2 Build Renderer for Mobile

```bash
# From repo root
npm run build:mobile   # outputs to apps/mobile/www
```

### 6.3 Sync & Open Android Studio

```bash
cd apps/mobile
npx cap sync android
npx cap open android
```

### 6.4 Build APK / AAB

```bash
cd android
./gradlew assembleRelease   # APK
./gradlew bundleRelease     # AAB
```

---

## 7. Galaxy A56 Testing Checklist

### Display & Layout

- [ ] App launches in portrait without white screen
- [ ] Bottom nav is reachable and tappable (≥44×44 dp)
- [ ] Sidebar is hidden; hamburger opens drawer
- [ ] Composer is large enough (min 48 dp height)
- [ ] Preview opens full screen in WebView
- [ ] Settings pages scroll without truncation
- [ ] No horizontal scroll on any page

### Navigation

- [ ] Back gesture navigates within app
- [ ] Bottom nav highlights current page
- [ ] Deep links open correct page
- [ ] Command palette (Ctrl+K) disabled or replaced

### Chat

- [ ] Send message with Enter
- [ ] Shift+Enter inserts newline
- [ ] Provider selector visible and works
- [ ] Streaming response appears smoothly

### Preview

- [ ] Static HTML preview renders
- [ ] Counter demo buttons respond
- [ ] Preview URL can be copied
- [ ] Preview opens in external browser

### Settings

- [ ] Appearance toggle persists
- [ ] Provider API key saves and masks
- [ ] Prompt library loads

### Performance

- [ ] Cold start < 3 seconds
- [ ] Chat list scrolls at 60 fps
- [ ] Preview WebView loads < 2 seconds
- [ ] Memory usage < 250 MB during normal use

### Offline

- [ ] App opens without crash when offline
- [ ] Chat shows provider error, not crash
- [ ] Settings remain editable

---

## 8. Migration Path

| Phase | Timeline | Deliverable |
| :---- | :------- | :---------- |
| Phase 0 | Now | Platform adapter pattern, mobile audit |
| Phase 1 | Week 1-2 | Capacitor shell, web-only build |
| Phase 2 | Week 3-4 | SQLite + settings + providers on Android |
| Phase 3 | Week 5-6 | Preview WebView + static HTML |
| Phase 4 | Week 7-8 | Galaxy A56 QA, performance pass |
| Phase 5 | Week 9+ | Publish open beta on Play Store |

---

## 9. Risks & Mitigations

| Risk | Impact | Mitigation |
| :--- | :----- | :--------- |
| Desktop build breaks | High | Keep adapters optional; run desktop CI first |
| SQLite schema drift | High | Use Drizzle migrations for both engines |
| WebView performance | Medium | Limit preview complexity; use static HTML |
| Keystore complexity | Medium | Start with EncryptedSharedPreferences |
| Play Store policy | Medium | No remote code execution; static previews only |

---

## 10. Success Criteria

- [ ] `npm run build` still passes for desktop
- [ ] `npm run typecheck` has zero errors
- [ ] Mobile web build renders all v1 routes
- [ ] Android APK installs on Galaxy A56
- [ ] Chat, Studio, Preview, Settings work on device
- [ ] No desktop-only API crashes the mobile build

---

*End of Capacitor Android plan.*
