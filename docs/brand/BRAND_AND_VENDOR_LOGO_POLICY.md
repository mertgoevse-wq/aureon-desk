# Brand & Vendor Logo Policy

## Purpose

This document defines how Vibeforge handles third-party brand assets, vendor logos, and trademarks.

## Core Principle

**Vibeforge uses neutral, open-source Lucide icons with descriptive text labels for all third-party services and connectors.**

## Rules

### 1. No Fake Brand Logos

We do **NOT** generate, create, or use lookalike logos that mimic third-party brands (Google, OpenAI, GitHub, Gmail, etc.). This includes:
- AI-generated logo approximations
- Hand-drawn brand logo clones
- Modified or "inspired by" versions of official logos
- Any visual that could be confused with an official brand mark

### 2. Neutral Icons + Text Labels

All connector/third-party references use:
- **Lucide icons** (open-source, MIT licensed)
- **Descriptive text labels** next to the icons
- Example: A `Globe` icon next to "Google Gemini" text, NOT a fake Google logo

### 3. Official Brand Assets — Only If Licensed

Official vendor assets (logos, icons, wordmarks) may be used **only** if ALL of the following are true:
1. The asset is properly licensed for use in desktop software
2. The asset is stored in `assets/vendor/` with a clear attribution file
3. The asset file name clearly identifies the vendor
4. The attribution file documents: source, license type, permitted use, and expiration

### 4. Current Vendor Asset Status

| Vendor | Status | Notes |
|--------|--------|-------|
| Google/Gmail/Gemini | NOT used | Using Globe + Mail icons |
| OpenAI | NOT used | Using Cpu icon |
| GitHub | NOT used | Using Github icon from Lucide (different from GitHub mark) |
| Anthropic | NOT used | Using text only |
| OpenRouter | NOT used | Using Server icon |
| Ollama | NOT used | Using Cpu icon |
| LM Studio | NOT used | Using Cpu icon |
| MCP | NOT used | Using Wrench icon |

### 5. Vibeforge's Own Brand

Vibeforge's own logo, wordmark, and brand assets are original works. They are:
- Stored in `assets/brand/`
- Generated using `scripts/generate-icon.js` and `scripts/generate-nano-icon.js`
- Not derived from any third-party brand

### 6. Compliance Check

Before any release, verify:
- [ ] No fake brand logos in any component
- [ ] All connector icons are from Lucide icon set
- [ ] No vendor assets in `assets/vendor/` without attribution file
- [ ] All references to third-party services use neutral naming (e.g., "Google Gemini" not "Gemini™")

### 7. Exceptions

- **Lucide `Github` icon**: This is a generic code-hosting icon, part of the open-source Lucide set. It is NOT the official GitHub mark (the Octocat/invertocat logo) and is used under Lucide's MIT license.
- **Text references**: Using service names as text (e.g., "Configure your OpenAI API key") is descriptive use, not trademark infringement.

## Review Date

Last reviewed: 2026-07-08
Next review: when adding new connector types or vendor integrations.
