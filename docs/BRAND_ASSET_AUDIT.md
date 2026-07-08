# Aureon Desk — Brand Asset Audit

> Generated: 2026-07-08

## Overview

This document catalogs all brand-related assets in the Aureon Desk project, including file sizes, dimensions, usage, and status.

---

## 1. SVG Assets (Source of Truth)

| File | Size | Dimensions | Status | Used In |
|------|------|------------|--------|---------|
| `assets/brand/aureon-mark.svg` | ~1KB | 64×64 viewBox | ✅ Good | AureonMark component (variant=svg) |
| `assets/brand/aureon-logo.svg` | ~2KB | Full logo | ✅ Good | Documentation |
| `assets/brand/aureon-wordmark.svg` | ~2KB | Mark + text | ✅ Good | Not currently wired |
| `assets/brand/aureon-icon.svg` | ~2KB | App icon | ✅ Good | Source for ICO generation |

### SVG Quality
- Clean vector format, infinitely scalable
- Uses proper Ivory/Terracotta palette
- Abstract "A" design with aureole ring
- No copied brand elements from any vendor

---

## 2. Public PNG Assets (Renderer-Accessible)

| File | Size | Dimensions | Status | Used In |
|------|------|------------|--------|---------|
| `public/brand/aureon-mark-64.png` | ~2KB | 64×64 | ✅ Good | AureonMark (variant=png, size ≤64) |
| `public/brand/aureon-mark-128.png` | ~5KB | 128×128 | ✅ Good | AureonMark (variant=png, size ≤128) |
| `public/brand/aureon-mark-256.png` | ~12KB | 256×256 | ✅ Good | AureonMark (variant=png, size ≤256) |
| `public/brand/aureon-logo-512.png` | ~30KB | 512×? | ✅ Good | AureonLogo component |

### PNG Quality
- Optimized sizes, no huge runtime PNGs
- Proper resolution for their use cases
- Web-accessible in Electron renderer

---

## 3. Build Assets (Packaging)

| File | Size | Dimensions | Status | Used In |
|------|------|------------|--------|---------|
| `build/icon.ico` | ~277KB | multi (16,32,48,256) | ✅ Good | Windows app icon, installer |
| `build/icon.png` | ~262KB | 256×256 | ✅ Good | General reference |
| `build/icon-16.png` | varies | 16×16 | ✅ Good | Generated |
| `build/icon-32.png` | varies | 32×32 | ✅ Good | Generated |
| `build/icon-48.png` | varies | 48×48 | ✅ Good | Generated |
| `build/icon-256.png` | varies | 256×256 | ✅ Good | Generated |

---

## 4. Nano Banana Source Assets

| File | Size | Status | Notes |
|------|------|--------|-------|
| `assets/brand/source/nano-banana/*` | varies | ✅ Source | Source images for icon generation |

---

## 5. Code References to Brand Assets

| Component | Asset Used | Variant |
|-----------|-----------|---------|
| `AureonMark.tsx` | `aureon-mark-*.png` or inline SVG | Both |
| `BrandLockup.tsx` | `AureonMark` component | SVG default |
| `AppShell.tsx` | `BrandLockupCompact` | SVG |
| `Sidebar.tsx` | `BrandLockup` | SVG |
| `ChatWorkspace.tsx` | `AureonMark` (greeting) | SVG |
| `Studio.tsx` | `Sparkles` icon | Lucide (no brand asset) |
| `VibeCoding.tsx` | `Sparkles` icon | Lucide (no brand asset) |

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
| `public/brand/aureon-mark-64.png` | ✅ Present |
| `public/brand/aureon-mark-128.png` | ✅ Present |
| `public/brand/aureon-mark-256.png` | ✅ Present |
| `public/brand/aureon-logo-512.png` | ✅ Present |
| `build/icon.ico` | ✅ Generated |
| `build/icon.png` | ✅ Generated |

**No broken references found.**

---

## 8. Asset Size Summary

| Category | Total Size | Files |
|----------|-----------|-------|
| SVG source assets | ~8KB | 4 files |
| Public PNG assets | ~50KB | 4 files |
| Build icons | ~300KB | 6 files |
| **Total brand assets** | **~360KB** | **14 files** |

All well under normal thresholds. No optimization needed.

---

## 9. Recommendations

- [x] All Aureon brand SVGs exist and are original
- [x] All PNG sizes generated for renderer use
- [x] ICO generated for Windows packaging
- [x] No fake vendor logos
- [x] No broken image references
- [ ] Create `assets/vendor/` directory for future licensed vendor assets
- [ ] Add `ConnectorIcon` component for standardized connector icon rendering
