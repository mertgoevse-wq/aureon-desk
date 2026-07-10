# Vibeforge — UI Simplification Audit

> Generated: 2026-07-10
> Branch: main

Per-screen analysis of clutter, unfinished UX, dead controls, and recommended simplifications.

---

## 1. Home/Studio Hero

| Aspect | Finding | Recommendation |
|--------|---------|----------------|
| Hero composer | Too many elements (textarea + 2 CTAs + 4 pills + 4 cards + More + autonomy). | Keep composer + CTAs. Move pills below fold. |
| Action cards | "More" drawer shows 8 secondary cards — too many choices. | Collapse secondary to 4 and hide really niche ones. |
| Autonomy selector | 5 icon-only buttons are cryptic. | Add tooltips or labels, or collapse into simple/advanced mode. |
| Spacing | Vertical rhythm is tight. | Add more breathing room between sections. |
| Status | ✅ Overall functional, just dense. | — |

## 2. ChatWorkspace

| Aspect | Finding | Recommendation |
|--------|---------|----------------|
| Home greeting | Greeting + composer + 2 pills + recents — clean. | ✅ Good as-is. |
| Empty state | "Setup Provider" badge is red/orange — jarring. | Tone down to amber/warning. |
| Starter pills | Only 2 shown, "More…" to Vibe Coding. | ✅ Good. |
| Active chat | Model selector + prompt selector + messages. | ✅ Good. |
| Status | ✅ Cleanest screen in the app. | — |

## 3. LivePreview / Code Mode

| Aspect | Finding | Recommendation |
|--------|---------|----------------|
| Layout | 2-column grid (400px explorer + preview). | Reduce explorer width to 320px on small screens. |
| Project Explorer | Mock files list + safety warning + composer + template select + Create + Demo button. Very dense. | Collapse explorer by default, show expand toggle. |
| Status | ⚠️ Functional but overwhelming for first-time users. | Simplify explorer, auto-collapse. |

## 4. Vibe Coding

| Aspect | Finding | Recommendation |
|--------|---------|----------------|
| Hero | Sparkles icon + "What do you want to build?" + 3 view tabs. Clean. | ✅ Good. |
| Quick Start | 4 project types + 4 quick actions + collapsible templates. | OK. Reduce to 3 project types. |
| Guided Builder | Step progress bar + options — works well. | ✅ Good. |
| Status | ✅ Well-designed screen. Minor density reduction. | — |

## 5. Settings — General

| Aspect | Finding | Recommendation |
|--------|---------|----------------|
| Layout | SettingsSection/SettingsRow with title + description + control. | ✅ Model setting page. |
| Controls | Uses shared Select and Toggle components. | ✅ Consistent. |
| Missing | No simple/advanced mode toggle. | Add here. |
| Status | ✅ Best-designed settings page. | — |

## 6. Settings — Providers (CRITICAL)

| Aspect | Finding | Recommendation |
|--------|---------|----------------|
| Test Center | 3-column grid of compact cards — OK but busy. | Reduce to 2-column. |
| Token Usage | Separate panel with table. Could be collapsed. | Collapse by default. |
| Adapter cards | One massive card per adapter with ALL details inline. Very long scroll. | **Major redesign needed.** |
| API key section | Cramped inline key input. | Move to a dedicated section. |
| Models list | Flat list inside card, hard to scan. | Compact row with toggle only. |
| Actions | Test/Delete/Toggle scattered across card. | Consolidate to a footer bar. |
| Overall feel | "Programmed together" — too many sections, no visual hierarchy. | **Redesign to clean left-list + right-detail layout, or clean stacked cards with expand/collapse.** |
| Status | ❌ Most cluttered screen. Needs redesign. | — |

## 7. Settings — Tools & MCP

| Aspect | Finding | Recommendation |
|--------|---------|----------------|
| Layout | Cards with expand/configure. Safety gate well-documented. | ✅ Good. Add description rows. |
| Status | ✅ Acceptable. | — |

## 8. Settings — Connectors

| Aspect | Finding | Recommendation |
|--------|---------|----------------|
| Cards | Registry-based, search/filter, config drawer. | ✅ Well-designed. |
| Status | ✅ Good. | — |

## 9. Sidebar

| Aspect | Finding | Recommendation |
|--------|---------|----------------|
| Nav items | 5 modes + Projects + Tools + Settings = 8 icons (expanded) / 8 (collapsed). | Group secondary items under "More". |
| Expanded nav | 4 workspace modes + Projects + Tools sections. | Reduce Projects/Tools to icons. |
| Active states | Already subtle (borderless icons). | ✅ Good. |
| Status | ⚠️ Slightly busy. | Reduce visible items in simple mode. |

## 10. Topbar

| Aspect | Finding | Recommendation |
|--------|---------|----------------|
| Brand | BrandLockupCompact + "Vibeforge" — clean. | ✅ Good. |
| Mode switch | 4 tabs (Studio/Chat/Cowork/Code) — functional. | Reduce to 3: hide Cowork in simple mode? |
| Search | Only on md+ screens. | ✅ Good. |
| Status | ✅ Clean. | — |

## 11. Right Inspector

| Aspect | Finding | Recommendation |
|--------|---------|----------------|
| Default | Collapsed by default. Only opens on /chat. | ✅ Good. |
| Content | Intent analysis + agents + risk. | Too much detail for casual use. |
| Status | ✅ Good default state. Collapse advanced sections. | — |

---

## Priority Actions

1. **Simple/Advanced mode toggle** — foundation for all other simplification
2. **Providers page redesign** — biggest UX pain point
3. **Sidebar simplification** — fewer visible items
4. **LivePreview explorer** — auto-collapse for first-time users
5. **Studio density** — reduce pills/cards shown at once
