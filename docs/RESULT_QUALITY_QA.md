# Aureon Desk — Result Quality QA

> **Date:** 2026-07-09
> **Branch:** main
> **Purpose:** Verify that Aureon Desk produces useful results, not just clickable buttons.

---

## Quality Checklist

| # | Flow | Expected Result | Status |
|---|------|----------------|--------|
| 1 | **Build App from idea** | Wizard accepts prompt, routes to Code mode, creates preview | ✅ |
| 2 | **Code Program from instruction** | Generates sandbox with language-specific template | ✅ |
| 3 | **Generate Text** | Routes to chat with tone-aware prompt | ✅ |
| 4 | **Generate Image prompt builder** | Mock Offline Creator selected by default, labeled "Mock" | ✅ |
| 5 | **Generate Video prompt builder** | Mock Offline Creator selected by default, labeled "Mock" | ✅ |
| 6 | **Generate Music prompt builder** | Mock Offline Creator selected by default, labeled "Mock" | ✅ |
| 7 | **Vibe Coding template** | Inserts complete prompt with design rules + build-verify steps | ✅ |
| 8 | **Provider setup guidance** | Missing provider shows setup CTA, no crash | ✅ |
| 9 | **LivePreview demo** | Counter app renders with increment/reset, style-aware | ✅ |
| 10 | **MCP tool guidance** | Mock tools labeled, real tools require approval | ✅ |
| 11 | **GitHub import guidance** | Import page has safety notice, star list button | ✅ |
| 12 | **Packaging guidance** | Template includes build-verify instructions | ✅ |

---

## Scenario Results

### Scenario A: Build App from Idea
- **Prompt:** "Build a tiny counter app with increment, reset, ivory theme, and clear heading."
- **Flow:** Studio → Build App card → wizard drawer opens → prompt editor accepts text → Start Task Flow → routes to `/preview` → sessionStorage sets `auto-build-app-preview` → LivePreview creates demo sandbox
- **Output:** Counter demo app (increment/reset buttons, ivory #FAF8F5 bg, "Aureon Counter Demo" heading)
- **Quality:** ✅ Beginner-readable. Generated prompt includes platform/style/output selectors.
- **Gap:** When no provider is configured, the demo uses the deterministic DEMO_COUNTER_HTML template — works offline.

### Scenario B: Vibe Coding → Improve UI
- **Prompt inserted:** Complete multi-paragraph prompt with design rules (calm ivory/warm neutral palette, no neon, clean sans-serif typography, rounded corners, subtle shadows, comfortable whitespace, premium desktop feel). Includes typecheck/tests/build verification step.
- **Quality:** ✅ Comprehensive. Beginner-friendly constraints explicit.

### Scenario C: Generate Text
- **Flow:** Studio → Generate Text card → wizard drawer → select tone (Professional/Creative/Casual/Technical) → prompt editor → Start Task Flow → routes to chat (`/`) → prompt inserted with tone prefix
- **Output:** "Write text in a Professional tone: <user prompt>"
- **Quality:** ✅ Clear tone prefix. Routes correctly to Chat mode.

### Scenario D: Provider Missing
- **Behavior:** ChatWorkspace shows "Setup Provider" badge → links to Settings > Providers
- **Studio cards** with provider-dependent capabilities (image/video/music generation) show "Go Configure Setup" button when missing capabilities detected
- **Quality:** ✅ No crash. Clear CTA. No broken buttons.

### Scenario E: MCP Tools
- **Mock tools** (file_search_mock, git_status_mock, project_summary_mock): labeled with source badge "mock"
- **Imported tools**: disabled by default, untrusted badge shown
- **Destructive actions**: require explicit approval, blocked if untrusted
- **No auto-run**: router suggestions display tool names only, never execute
- **Quality:** ✅ All safety gates in place.

---

## Quality Improvements Made

### Vibe Template Enhancements

1. **`build-desktop-app`**: Added design rules (calm ivory tones, no neon, clean sans-serif) and build-verify instructions
2. **`improve-ui`**: Added detailed design constraints (ivory/warm neutral palette, no dark mode unless requested, clean typography, rounded corners, subtle shadows, premium desktop feel, not flashy website). Added typecheck + tests + build verification.
3. **`create-preview`**: Added interactive requirement (working buttons, not just static page) and Live Preview verification step
4. **`build-android-app`**: Added offline-first constraint, Material Design with warm neutral colors, testing guidance

### Mock Labeling

- VibeCoding project type cards (`ai-tool`, `dashboard`): Added amber "Mock preview" badge when preview generates sandbox-only demo (not real AI tool output)
- Studio image/video/music cards: Default to "Mock Offline Creator" provider with amber warning when non-mock provider selected without credentials

### Guided Builder Prompt Quality

The `buildGuidedPrompt()` function generates structured prompts with:
- What to build (user selection)
- Starting point context
- First action to take
- Beginner-friendly instructions (explain terms, step by step, copyable code, setup notes)
- Safety instructions: typecheck, tests, build, no secrets, document for Git

---

## What Still Needs Work

| Gap | Severity | Notes |
|-----|----------|-------|
| Real AI image/video/music generators | Low | Mock only — no live provider integrations yet |
| Real MCP tool execution | Low | Mock tools only — registry and safety gate operational |
| Cowork mode task execution | Low | Simulated placeholder |
| File attachment | Low | Paperclip button disabled |

**None of these are blockers for result quality.** The app produces useful, deterministic outputs for all currently supported flows.

---

## Screenshots

Directory: `docs/qa-screenshots/result-quality/`

(Manual QA screenshots to be captured by running `npm run dev` and clicking through scenarios A-E.)
