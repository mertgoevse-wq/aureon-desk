## [0.9.62] - 2026-07-09

### Fixed — Product Stability Audit Bug Fixes

**LivePreview Error Retry Style Loss:**

- Fixed bug where error retry in LivePreview always fell back to "Calming Ivory" theme regardless of user's selected style. Root cause: `clearAutoPreview()` was called on mount, wiping sessionStorage before the retry handler could read the style.
- Now saves the auto-preview style in a `useRef` before clearing sessionStorage, so the retry handler can access the correct theme.
- Replaced hardcoded `'build-app-style'` string with `AUTO_PREVIEW_KEYS.style` constant to maintain the shared helper contract.

**README Banner Path:**

- Fixed broken GitHub banner image path from non-existent `assets/brand/nano-banana/aureon-github-banner.png` to correct `assets/brand/aureon-github-banner-1200.png`.

### Created

- `docs/CURRENT_PRODUCT_GAP_AUDIT.md` — comprehensive 15-section product gap audit covering hero landing, theme, LivePreview, Studio, Vibe Coding, buttons/dropdowns, providers, MCP/connectors, brand assets, onboarding, skills/agents, search, performance, cleanup, and next implementation order
- `docs/MANUAL_PRODUCT_QA_NOTES.md` — source-level manual QA notes with click-through results for all major flows and bug documentation

### Verified

- `npm run typecheck` — ✅ PASS
- `npm test` — ✅ PASS (491 tests, 22 files)
- `npm run build` — ✅ PASS

## [0.9.61] - 2026-07-09

### Changed — Final UI Beauty & Declutter Pass

**Hero Gradient Calmed:**

- Softened hero radial gradient from 0.50 → 0.28 opacity, mid-point from 0.10 → 0.04 for a subtler warm glow

**Reduced Orange Accent Overuse:**

- Studio.tsx: Task card icon backgrounds changed from accent-light (terracotta) to neutral ivory-surface with graphite text. Only hero icons and primary CTAs retain the brand terracotta.
- VibeCoding.tsx: Project type, quick action, All templates, and guided builder option icons all changed from accent-light to neutral ivory-surface. ~15 fewer orange-tinted icon containers.

**Chat Home Decluttered:**

- Starter suggestion pills reduced from 3 → 2
- "More ideas" button changed to muted plain text "More…" pill
- Recent Chats section: removed card border/bg wrapper, shortened label

### Verified

- `npm run typecheck` — ✅ PASS
- `npm test` — ✅ PASS (491 tests, 22 files)
- `npm run build` — ✅ PASS

# Changelog

## [0.9.60] - 2026-07-09
