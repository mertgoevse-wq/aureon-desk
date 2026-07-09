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
