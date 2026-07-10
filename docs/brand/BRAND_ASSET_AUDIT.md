# Vibeforge — Brand Asset Audit

> Generated: 2026-07-08
> Updated: 2026-07-10 (Brand Finalization Pass)

## Overview

This document catalogs all brand-related assets in the Vibeforge project, including file sizes, dimensions, usage, and status.

---

## 1. SVG Assets (Source of Truth)

| File | Size | Dimensions | Status | Used In |
|------|------|------------|--------|---------|
| `assets/brand/Vibeforge-mark.svg` | ~1KB | 64×64 viewBox | ✅ Good | VibeforgeMark component (variant=svg) |
| `assets/brand/Vibeforge-icon.svg` | ~2KB | App icon | ✅ Good | Source for ICO generation |
| `assets/brand/Vibeforge-logo.svg` | ~2KB | Full logo | ✅ Good | Documentation |
| `assets/brand/Vibeforge-wordmark.svg` | ~2KB | Mark + text | ✅ Good | Sidebar, topbar references |
| `assets/brand/Vibeforge-logo-lockup.svg` | ~2KB | 400×100 | ✅ NEW | Full logo lockup (mark + wordmark + tagline) |
| `assets/brand/Vibeforge-github-banner.svg` | ~3KB | 1280×640 | ✅ NEW | GitHub social preview banner source |

### SVG Quality
- Clean vector format, infinitely scalable
- Uses proper Ivory/Terracotta palette (#B8683A, #A45A30, #F9EFE9, #E8A45C)
- Abstract "A" design with aureole ring and neural node dots
- No copied brand elements from any vendor
- VibeforgeMark inline SVG uses hardcoded colors (not CSS variables) for guaranteed Chromium/Electron visibility
- New `Vibeforge-logo-lockup.svg` and `Vibeforge-github-banner.svg` for full branding

---

## 2. Public PNG Assets (Renderer-Accessible)

| File | Size | Dimensions | Status | Used In |
|------|------|------------|--------|---------|
| `public/brand/Vibeforge-mark-32.png` | ~2KB | 32×32 | ✅ NEW | VibeforgeMark (variant=png, small sizes) |
| `public/brand/Vibeforge-mark-64.png` | ~2KB | 64×64 | ✅ Good | VibeforgeMark (variant=png, size ≤64) |
| `public/brand/Vibeforge-mark-128.png` | ~5KB | 128×128 | ✅ Good | VibeforgeMark (variant=png, size ≤128) |
| `public/brand/Vibeforge-mark-256.png` | ~12KB | 256×256 | ✅ Good | VibeforgeMark (variant=png, size ≤256) |
| `public/brand/Vibeforge-logo-512.png` | ~30KB | 512×? | ✅ Good | VibeforgeLogo component |

### PNG Quality
- Optimized sizes, no huge runtime PNGs
- Proper resolution for their use cases
- Web-accessible in Electron renderer

---

## 3. Build Assets (Packaging)

| File | Size | Dimensions | Status | Used In |
|------|------|------------|--------|---------|
| `build/icon.ico` | ~13KB | multi (16,24,32,48,64,128,256) | ✅ Regenerated | Windows app icon, taskbar, installer |
| `build/icon.png` | ~6KB | 256×256 | ✅ Regenerated | General reference |
| `build/icon-16.png` | ~1KB | 16×16 | ✅ Generated | ICO source |
| `build/icon-24.png` | ~1KB | 24×24 | ✅ Generated | ICO source |
| `build/icon-32.png` | ~1KB | 32×32 | ✅ Generated | ICO source |
| `build/icon-48.png` | ~1KB | 48×48 | ✅ Generated | ICO source |
| `build/icon-64.png` | ~1KB | 64×64 | ✅ Generated | ICO source |
| `build/icon-128.png` | ~3KB | 128×128 | ✅ Generated | ICO source |
| `build/icon-256.png` | ~6KB | 256×256 | ✅ Generated | ICO source |

---

## 4. Nano Banana Source Assets

| File | Size | Status | Notes |
|------|------|--------|-------|
| `assets/brand/source/nano-banana/*` | varies | ✅ Source | Source images for icon generation |

---

## 5. Code References to Brand Assets

| Component | Asset Used | Variant |
|-----------|-----------|---------|
| `VibeforgeMark.tsx` | Inline SVG with hardcoded brand colors | SVG (default) |
| `VibeforgeMark.tsx` | `Vibeforge-mark-*.png` | PNG (variant) |
| `BrandLockup.tsx` | `VibeforgeMark` + text | SVG |
| `BrandLockupCompact` | `VibeforgeMark` only | SVG (compact) |
| `AppShell.tsx` (topbar) | `BrandLockupCompact` + "Vibeforge" text | SVG |
| `Sidebar.tsx` (expanded) | `BrandLockup` | SVG |
| `Sidebar.tsx` (collapsed) | `BrandLockupCompact` | SVG |
| `SettingsLayout.tsx` | `VibeforgeMark` | SVG |
| `ChatWorkspace.tsx` | `VibeforgeMark` (greeting) | SVG |
| `Studio.tsx` | `VibeforgeMark` (hero) | SVG |

---

## 6. Connector Icon References

| Connector | Icon Source | Status |
|-----------|-------------|--------|
| OpenAI | `Cpu` Lucide icon | ✅ Neutral |
| Google Gemini | `Globe` Lucide icon | ✅ Neutral |
| Google AI Studio | `Globe` Lucide icon | ✅ Neutral |
| Gmail | `Mail` Lucide icon | ✅ Neutral |
| Google Drive | `HardDrive` Lucide icon | ✅ Neutral |
| Google Calendar | `Calendar` Lucide icon | ✅ Neutral |
| GitHub | `Github` Lucide icon | ✅ Neutral (not official GitHub mark) |
| OpenRouter | `Server` Lucide icon | ✅ Neutral |
| Ollama | `Cpu` Lucide icon | ✅ Neutral |
| LM Studio | `Cpu` Lucide icon | ✅ Neutral |
| MCP Servers | `Wrench` Lucide icon | ✅ Neutral |
| Phone Companion | `Smartphone` Lucide icon | ✅ Neutral |

### Status: All connectors use neutral Lucide icons. No fake brand logos. ✅

---

## 7. Missing or Broken References

| Asset | Status |
|-------|--------|
| `public/brand/Vibeforge-mark-32.png` | ✅ NEW |
| `public/brand/Vibeforge-mark-64.png` | ✅ Present |
| `public/brand/Vibeforge-mark-128.png` | ✅ Present |
| `public/brand/Vibeforge-mark-256.png` | ✅ Present |
| `public/brand/Vibeforge-logo-512.png` | ✅ Present |
| `build/icon.ico` | ✅ Regenerated (PNG-based, 7 sizes) |
| `build/icon.png` | ✅ Regenerated |
| `assets/brand/Vibeforge-github-banner-1200.png` | ✅ Generated |

**No broken references found.**

---

## 8. Asset Size Summary

| Category | Total Size | Files |
|----------|-----------|-------|
| SVG source assets | ~13KB | 6 files |
| Public PNG assets | ~55KB | 5 files |
| Build icons | ~18KB | 9 files |
| **Total brand assets** | **~86KB** | **20 files** |

All well under normal thresholds. No optimization needed.

---

## 9. Recommendations

- [x] All Vibeforge brand SVGs exist and are original
- [x] All PNG sizes generated for renderer use
- [x] ICO generated for Windows packaging (PNG-based, 7 sizes)
- [x] No fake vendor logos
- [x] No broken image references
- [x] VibeforgeMark uses hardcoded brand colors for guaranteed visibility (2026-07-10 fix)
- [x] Branding visible in sidebar (expanded + collapsed), topbar, Settings, Studio hero
- [x] `scripts/generate-brand-assets.mjs` for reproducible asset generation
- [ ] Create `assets/vendor/` directory for future licensed vendor assets
- [ ] Add `ConnectorIcon` component for standardized connector icon rendering
