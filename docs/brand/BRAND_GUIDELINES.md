# Vibeforge — Brand Guidelines

> **Last updated:** 2026-07-08
> **Assets by:** Nano Banana (Gemini Image Generation)

---

## Brand Concept

Vibeforge is a calm, premium desktop AI workspace. The brand identity conveys warmth, focus, and professional capability without any cyberpunk, neon, or glassmorphism aesthetics.

### Core Principles
- **Calm, not loud** — warm ivory tones, subtle depth, restrained typography
- **Original, not copied** — no Anthropic/Claude/OpenAI/Codex branding, assets, or exact layout patterns
- **Premium, not generic** — refined spacing, consistent radii, elegant typography
- **Windows-first** — designed for Windows desktop with proper scaling and native feel

---

## Asset Inventory

### Nano Banana Generated Assets (Source of Truth)

| File | Description | Usage |
|------|-------------|-------|
| `Vibeforge-app-icon.png` | Rounded app icon with Vibeforge mark | Windows app icon, ICO generation |
| `Vibeforge-mark-monochrome.png` | Abstract "A" mark, monochrome | Sidebar logo, tray icon, small badges |
| `Vibeforge-logo-light.png` | Full logo (mark + wordmark), light bg | README, documentation, splash screens |
| `Vibeforge-dark-logo-presentation.png` | Full logo, dark bg variant | Dark mode, presentations |
| `Vibeforge-github-banner.png` | Wide GitHub banner | Repository social preview, README header |

### Organized Locations

| Location | Contents |
|----------|----------|
| `assets/brand/nano-banana/` | All Nano Banana originals (source of truth) |
| `public/brand/` | Web-accessible copies for renderer use |
| `assets/brand/` | Original SVG assets (programmatic) |
| `build/icon.ico` | Multi-size Windows ICO (16/32/48/256) |
| `build/icon.png` | 256px PNG fallback |

### Icon Generation

```bash
# Generate ICO from Nano Banana PNG
node scripts/generate-nano-icon.js

# Fallback: programmatic SVG-based ICO
node scripts/generate-icon.js
```

---

## Where Each Asset is Used

| Asset | Renderer Component | Main Process | GitHub |
|-------|-------------------|--------------|--------|
| `Vibeforge-mark-monochrome.png` | `VibeforgeMark` (variant="png") | — | — |
| `Vibeforge-logo-light.png` | `VibeforgeLogo` component, README | — | — |
| `Vibeforge-github-banner.png` | — | — | `README.md` header |
| `Vibeforge-app-icon.png` | — | `windows.ts` → `icon.ico` | — |
| `Vibeforge-dark-logo-presentation.png` | Dark mode (future) | — | — |

**Code locations:**
- `src/renderer/src/components/shared/VibeforgeMark.tsx` — SVG + PNG brand mark component
- `src/renderer/src/layouts/Sidebar.tsx` — Sidebar header (VibeforgeMark, size=34)
- `src/renderer/src/layouts/AppShell.tsx` — Collapsed topbar (VibeforgeMark, size=22)
- `src/renderer/src/pages/ChatWorkspace.tsx` — Home greeting (VibeforgeMark, size=44)
- `src/main/windows.ts` — BrowserWindow icon path

---

## Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--ivory-bg` | `#FAF7F2` | Main workspace background |
| `--ivory-surface` | `#F3EFE6` | Sidebar rail, secondary surfaces |
| `--ivory-elevated` | `#FFFFFF` | Cards, chat bubbles, inputs |
| `--ivory-border` | `#E4DEC9` | Delicate borders |
| `--ivory-text` | `#221A0F` | Primary text |
| `--ivory-text-2` | `#5D5241` | Secondary text |
| `--ivory-text-3` | `#8E8371` | Muted/caption text |
| `--ivory-accent` | `#C75B39` | Primary accent (terracotta) |
| `--ivory-accent-light` | `#FDF0EB` | Accent backgrounds |

## Typography

| Role | Font | Usage |
|------|------|-------|
| **Display** | Crimson Text (serif) | Logo, major page headings, greeting |
| **Body** | Inter (sans-serif) | UI, forms, chat, settings, buttons, labels |
| **Mono** | JetBrains Mono | Code, logs, technical content |

### Typography Rules
- **Serif only** for `.display-text` class: logo, greeting, major page headings (h1)
- **Sans-serif everywhere else**: sidebar nav, buttons, inputs, provider cards, chat messages, settings
- **Base size**: 13px body, 10-15px range for UI
- **No tiny unreadable text** below 9px except for badges/kbd

---

## Do's and Don'ts

### ✅ Do
- Use `VibeforgeMark` component for brand mark (not inline SVG)
- Keep the warm ivory palette everywhere
- Use soft rounded corners (12px–28px)
- Maintain consistent spacing and padding
- Use `src="./brand/Vibeforge-mark.png"` for PNG variant

### ❌ Don't
- Copy Claude Desktop, OpenAI, Codex, or Anthropic UI patterns
- Use neon colors, cyberpunk aesthetics, or glassmorphism
- Stretch, rotate, or recolor the Vibeforge mark
- Use the dark logo variant on light backgrounds (and vice versa)
- Add gradients, glows, or drop shadows to the brand mark
- Hardcode API keys or brand secrets
- Use serif fonts for non-display UI text

---

*These brand guidelines are specific to Vibeforge. No proprietary AI company branding was referenced or copied.*
