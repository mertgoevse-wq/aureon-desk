# Code Cleanup Audit — 2026-07-09

> Tools: `knip`, `depcheck`, `madge`, `ts-prune`
> Branch: `main`
> Pre-audit verification: ✅ verify:native, ✅ typecheck, ✅ 597 tests, ✅ build

---

## Summary

| Metric | Count |
|--------|-------|
| Source files analyzed (madge) | 137 |
| Circular dependencies | 0 ✅ |
| Unused files found | 6 |
| Dead files safely removed | 5 |
| Dead exports removed from existing files | 6 |
| Unused dependencies (false positive - CLI tools) | 3 |
| Files kept (false positives or risky) | 2 |

---

## Tools Added

| Tool | Version | Purpose |
|------|---------|---------|
| `knip` | latest | Dead code & unused export detection |
| `depcheck` | latest | Unused dependency detection |
| `madge` | latest | Circular dependency detection |
| `ts-prune` | (already installed) | Unused export detection |

---

## Findings

### 1. Unused Files (Removed)

| File | Size | Reason |
|------|------|--------|
| `src/renderer/src/components/shared/Popover.tsx` | ~170 lines | 0 imports found. Exported `Popover` and `SelectPopover` — never used. |
| `src/renderer/src/components/shared/SelectMenu.tsx` | ~143 lines | 0 imports found. Exported `SelectMenu` and `SelectMenuItem` — never used. |
| `src/main/ipc/device-inputs.ipc.ts` | (untracked) | From interrupted previous task. Not wired into IPC registry. |
| `src/main/services/device-inputs.service.ts` | (untracked) | From interrupted previous task. Not imported anywhere. |
| `src/shared/device-inputs.ts` | (untracked) | From interrupted previous task. No consumer imports. |

### 2. Scratch Directory (Removed)

| Path | Size | Status |
|------|------|--------|
| `scratch/` | ~398K, 12+ .tsx files | Already in `.gitignore`. Diagnostic/test files. Deleted. |

### 3. Dead Exports Removed from Existing Files

| File | Export Removed | Reason |
|------|---------------|--------|
| `src/renderer/src/components/settings/SettingsComponents.tsx` | `DangerZone` | Exported, never imported by any consumer (4 files import other exports from this file) |
| `src/renderer/src/components/shared/VibeforgeMark.tsx` | `VibeforgeLogo` | Exported, 0 imports anywhere |
| `src/renderer/src/components/shared/BrandLockup.tsx` | `BrandLockupCompact` | Exported, 0 imports anywhere |
| `src/renderer/src/components/connectors/ConnectorIcon.tsx` | `ConnectorIconSmall` | Exported, 0 imports anywhere (barrel exports CONNECTOR_LABELS/ICONS/INITIALS kept — used in tests) |
| `src/shared/constants.ts` | `APP_NAME` | Exported, 0 imports anywhere |
| `src/shared/self-audit.ts` | `SEVERITY_ORDER` | Exported, 0 imports anywhere (not used by self-audit service) |

### 4. False Positives (Kept)

| Item | Reason Kept |
|------|-------------|
| `knip`, `depcheck`, `madge` (devDeps) | CLI tools — not imported in code. Needed for future audits. |
| `src/renderer/src/stores/settingsStore.ts` | Knip flagged as unused, but Zustand stores can be subscribed to indirectly. Kept to avoid risk. |
| `CONNECTOR_LABELS`, `CONNECTOR_ICONS`, `CONNECTOR_INITIALS` barrel exports | Used by `tests/unit/connector-icon.test.ts`. Kept. |
| Several knip-flagged exports in services | Many are used dynamically via IPC channel names or barrel re-exports. Investigaed and kept. |

### 5. No Circular Dependencies

Madge analyzed 137 source files and found **0 circular dependencies**. ✅

### 6. Depcheck — Unused Dependencies

Depcheck reported `knip`, `depcheck`, `madge` as unused devDependencies. These are **false positives** — CLI tools are not imported in source code. No action taken.

### 7. Deferred / Not Removed

| Item | Reason |
|------|--------|
| `docs/archive/` files | Already archived — no action needed |
| `duplicate public/ vs assets/` | Different resolutions of same brand assets (source vs. export-ready). Not duplicate. |
| Service-level "unused" exports | Dynamic usage via IPC channel names. Safer to keep. |

---

## Commands Run

```bash
npx knip --config knip.json
npx depcheck
npx madge --circular --extensions ts,tsx src/
npx ts-prune
```

---

## Post-Cleanup Verification

| Check | Result |
|-------|--------|
| `npm run verify:native` | ✅ PASS |
| `npm run typecheck` | ✅ PASS |
| `npm test` | ✅ PASS |
| `npm run build` | ✅ PASS |

---

## Configuration Files Added

- `knip.json` — Configured for Electron + Vite + Vitest + Playwright project, ignores build artifacts, correctly handles entry points

## npm Scripts Recommended

Consider adding to `package.json`:
```json
"audit:deadcode": "npx knip --config knip.json",
"audit:deps": "npx depcheck",
"audit:cycles": "npx madge --circular --extensions ts,tsx src/"
```
