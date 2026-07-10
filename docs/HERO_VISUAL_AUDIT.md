# Vibeforge — Hero Visual Audit

> Pre-polish baseline for the hero visual polish pass (v0.9.53).

## Design Targets
- **Calm ivory background** — `#FAF7F2` main, `#F3EFE6` sidebar
- **Soft hero surface** — radial gradient from warm ivory to background
- **Bronze/copper accent** — `#C75B39` (primary) and `#8B5E3C` (bronze)
- **Graphite text** — `#221A0F` (primary), `#5D5241` (secondary), `#8E8371` (muted)
- **No neon, no cyberpunk, no glassmorphism**
- **Serif only for major headings** — Crimson Text on hero headings only
- **Sans-serif for all body/UI** — Inter everywhere else

---

## Screen-by-Screen Audit

### 1. Chat Home (`ChatWorkspace.tsx` — home state)
| Aspect | Status | Notes |
|--------|--------|-------|
| Hero greeting | ✅ Good | "Good morning, Mert" in 4xl font-display — clean, centered |
| Composer card | ✅ Good | Large rounded card with model/prompt/project chips, shadow-lg |
| Suggestions | ✅ Good | 3 pills + "More ideas" link — compact and quiet |
| Recent chats | ✅ Good | Small grid, muted borders, tiny icons |
| Setup provider badge | ⚠️ OK | Red badge when no providers — could be softer |
| Overall | ✅ | Feels premium, centered, intentional |

### 2. Studio (`Studio.tsx`)
| Aspect | Status | Notes |
|--------|--------|-------|
| Hero heading | ✅ Good | "Start building" in font-display 2.25rem, centered |
| Primary composer | ✅ Good | Clean textarea + "Start building" CTA |
| 4 main cards | ✅ Good | Build/Code/Create/Connect — compact, clean |
| More types drawer | ✅ Good | Collapsible secondary cards |
| Autonomy selector | ✅ Good | Icon-only compact row, bottom-anchored |
| Drawer wizard | ⚠️ Dense | Very small text (9-10px), tight button grids — functional but could breathe more |
| Overall | ✅ | Clean, not overloaded, one clear CTA |

### 3. Vibe Coding (`VibeCoding.tsx`)
| Aspect | Status | Notes |
|--------|--------|-------|
| Hero | ✅ Good | "What do you want to build?" in display-text, view tabs |
| Project type cards | ✅ Good | 4 cards with Chat/Preview action buttons |
| Quick actions | ✅ Good | 4 compact action cards |
| All templates | ⚠️ Busy | Collapsible section with many cards — fine when collapsed |
| Guided builder | ✅ Good | Clean step cards, progress bar |
| Overall | ⚠️ Slightly busy | Could reduce card border intensity and button sizes |

### 4. Code Mode / LivePreview (`LivePreview.tsx`)
| Aspect | Status | Notes |
|--------|--------|-------|
| Header | ✅ Good | "Code Mode" with description |
| Project explorer | ⚠️ Mock | Mock file list with "Ignored" badges — placeholder data |
| Task brief composer | ✅ Good | Clean textarea + template selector |
| Preview frame | ✅ Good | Clean iframe container with rounded corners |
| Server logs | ✅ Good | Collapsible console log panel |
| Safety card | ✅ Good | Amber safety policy notice |
| Idle state | ✅ Good | Clean empty state with CTAs |
| Overall | ✅ | Functional, clean layout |

### 5. Settings — Providers (`ProvidersPage.tsx`)
| Aspect | Status | Notes |
|--------|--------|-------|
| Header | ✅ Good | Clear title + safety notice |
| Test Center | ⚠️ Dense | 3-column grid of small test cards — functional but dense |
| Provider cards | ⚠️ Dense | Full-width cards with many sections — lots of info |
| Overall | ⚠️ Dense | Information-rich, could use more whitespace between sections |

### 6. Settings — Tools & MCP (`ToolsPage.tsx`)
| Aspect | Status | Notes |
|--------|--------|-------|
| Header | ✅ Good | Clear title + safety notice |
| Master-detail layout | ✅ Good | Left tool list, right detail panel |
| Tool list items | ✅ Good | Compact rows with status badges |
| Detail panel | ✅ Good | Clean sections with transport, permissions, test |
| Call history | ✅ Good | Collapsible log panel |
| Overall | ✅ | Well-organized, functional |

### 7. Sidebar (`Sidebar.tsx`)
| Aspect | Status | Notes |
|--------|--------|-------|
| Brand header | ✅ Good | BrandLockup + collapse button |
| New Chat button | ✅ Good | Accent-light background, subtle border |
| Workspace shortcuts | ✅ Good | 4-icon grid, active state with elevated bg |
| Projects section | ✅ Good | Compact buttons |
| Chat list | ✅ Good | Clean list with "Recents" header |
| Bottom profile | ✅ Good | Minimal "Local profile" + settings |
| Collapsed state | ✅ Good | Clean icon column |
| Overall | ✅ | Clean, quiet, functional |

### 8. Right Inspector (`RightInspector.tsx`)
| Aspect | Status | Notes |
|--------|--------|-------|
| Header | ✅ Good | "Inspector" with Brain icon |
| Empty state | ✅ Good | Subtle message + project context |
| Analysis sections | ⚠️ Busy | Many collapsible sections (Intent, Agent, Risk, Skills, Tools, Permissions, Plan, Keywords) |
| Section headers | ⚠️ Heavy | Bold text with accent-colored icons — could be softer |
| Overall | ⚠️ Could be quieter | Too many sections by default, too much visual weight |

### 9. Shared Components
| Component | Status | Notes |
|-----------|--------|-------|
| Button | ✅ Good | Clean variants, good transitions |
| Input/Textarea | ✅ Good | Clean styling, good focus states |
| Toggle | ✅ Good | Clean switch with smooth animation |
| Card | ✅ Good | Clean with optional hover |
| Badge | ✅ Good | Clean pill variants |
| Modal | ✅ Good | Clean with backdrop blur |
| Drawer | ✅ Good | Clean slide-in panel |
| Popover/SelectMenu | ✅ Good | Clean anchored menus |

---

## Priority Actions

1. **RightInspector** — Reduce section count, softer headers, less visual weight
2. **Studio drawer wizard** — Increase spacing, slightly larger text
3. **Tokens** — Add explicit bronze/copper tokens, graphite text token
4. **Providers & Tools pages** — More whitespace between sections
5. **VibeCoding** — Softer card borders, cleaner action buttons
6. **Global** — Use bronze accent (`#8B5E3C`) more, orange (`#C75B39`) only for primary CTAs
