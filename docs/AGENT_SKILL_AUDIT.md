# Vibeforge — Agent & Skill System Audit

> **Date:** 2026-07-10
> **Branch:** `main`
> **Pass:** Agent & Skill System Cleanup (v0.9.83)

---

## Concept Definitions

| Term | Definition |
|------|-----------|
| **Agent** | A role — a focused AI persona with a specific job (e.g., Builder, Debugger). Agents pick the right skill for each task. |
| **Skill** | A workflow — a repeatable sequence of steps that produces a specific output (e.g., Build with Preview, Generate Docs). |
| **Tool** | An action — a single API call, command, or file operation. Tools are the atoms that skills are built from. |
| **Prompt Profile** | Model behavior — a system prompt that shapes how a provider model responds (tone, format, persona). |
| **MCP** | External tool connection — a Model Context Protocol server that lets Vibeforge call external services (APIs, terminals, databases). |

---

## Agents Inventory (src/shared/agent-education.ts)

| ID | Name | Category | Tier | Status |
|----|------|----------|------|--------|
| `general-assistant` | General Assistant | general | beginner | ✅ Active |
| `code-architect` | Builder Agent | builder | beginner | ✅ Active |
| `debugger` | Debugger Agent | debugging | beginner | ✅ Active |
| `refactor-engineer` | Cleanup Agent | cleanup | advanced | ✅ Active |
| `test-engineer` | Test Engineer | builder | advanced | ✅ Active |
| `documentation-writer` | Docs Writer Agent | docs | beginner | ✅ Active |
| `git-assistant` | Git Assistant | builder, cleanup | advanced | ✅ Active — marked destructive |
| `prompt-engineer` | Prompt Engineer | general | advanced | ✅ Active |
| `research-synthesizer` | Research Agent | research | advanced | ✅ Active |
| `data-analyst` | Data Analyst | research | advanced | ✅ Active |
| `security-reviewer` | Security Reviewer | security | advanced | ✅ Active |
| `ux-product-designer` | UI Designer Agent | design | beginner | ✅ Active |
| `live-preview` | LivePreview Agent | preview | beginner | ✅ Active |
| `provider-doctor` | Provider Doctor | providers | beginner | ✅ Active |
| `social-draft` | Social Draft Agent | social | advanced | ✅ Active |
| `tutorial-agent` | Tutorial Agent | tutorial | advanced | ✅ Active |
| — | **Android Companion Planner** | builder | beginner | ⚠️ MISSING — in user task requirement, not yet defined |
| — | **MCP Connector** | providers | advanced | ⚠️ MISSING — in user task requirement, not yet defined |
| — | **Performance Optimizer** | cleanup | advanced | ⚠️ MISSING — in user task requirement, not yet defined |
| — | **LivePreview Engineer** | preview | beginner | ℹ️ EXISTS as `live-preview` — rename in display name done |

### Issues Found
- `social-draft` and `tutorial-agent` have thin descriptions and no matching curated skill
- `data-analyst` duplicates research role with `research-synthesizer`
- No `tier` field — all agents are flat; impossible to hide advanced agents behind toggle

---

## Skills Inventory (src/shared/curated-skills.ts)

| ID | Name | Category | Status | Issue |
|----|------|----------|--------|-------|
| `Vibeforge-web-app-builder` | Web App Builder | web-app-builder | active | ℹ️ Old "Vibeforge" branding in ID |
| `Vibeforge-frontend-design` | Frontend Design | frontend-design | active | ℹ️ Old "Vibeforge" branding in ID |
| `Vibeforge-webapp-testing` | Web App Testing | webapp-testing | active | ℹ️ Old "Vibeforge" branding in ID |
| `Vibeforge-mcp-builder` | MCP Builder | mcp-builder | planned | ℹ️ Old "Vibeforge" branding in ID |
| `Vibeforge-android-testing` | Android Prototype Testing | mobile-testing | planned | ℹ️ Old "Vibeforge" branding in ID |
| `Vibeforge-api-testing` | API Testing | api-testing | planned | ℹ️ Old "Vibeforge" branding in ID |
| `Vibeforge-cicd-pipeline` | CI/CD Pipeline | cicd-pipeline | planned | ℹ️ Old "Vibeforge" branding in ID |
| `Vibeforge-security-review` | Security Review | security-review | planned | ℹ️ Old "Vibeforge" branding in ID |
| `Vibeforge-brand-guidelines` | Brand Guidelines | brand-guidelines | active | ℹ️ Old "Vibeforge" branding in ID |
| `Vibeforge-theme-factory` | Theme Factory | theme-factory | active | ℹ️ Old "Vibeforge" branding in ID |
| `Vibeforge-documentation-writer` | Documentation Writer | documentation | active | ℹ️ Old "Vibeforge" branding in ID |
| `Vibeforge-spreadsheet-pdf` | Spreadsheets & PDFs | spreadsheet-pdf | **placeholder** | ⚠️ Placeholder only — no capabilities defined |

### Issues Found
- All 12 IDs have `Vibeforge-` prefix — old branding
- `Vibeforge-spreadsheet-pdf` is a placeholder with no real capabilities
- None of the 10 canonical user-requested skills exist yet:
  - Build with Preview ❌
  - Fix LivePreview ❌
  - Create Landing Page ❌ (similar: Vibeforge-web-app-builder, different name)
  - Create Android Prototype ❌ (similar: Vibeforge-android-testing, different focus)
  - Refactor UI ❌
  - Test Provider ❌
  - Setup MCP ❌ (similar: Vibeforge-mcp-builder, different name)
  - Generate Docs ❌ (similar: Vibeforge-documentation-writer, different name)
  - Build Beta ❌
  - Run Human QA ❌

---

## External Skills (src/shared/data/voltagent-awesome-skills.generated.ts)

| Metric | Value |
|--------|-------|
| File size | 868 KB |
| Total entries | ~6,500+ |
| Providers | anthropics, testmu-ai, and others |
| License status | mix of known-open, known-proprietary, unknown |
| Risk levels | safe, caution, destructive |

- Currently shown in the "All" tab with no tier separation
- No "Beginner" / "Advanced" classification
- No "Use this" / "Copy prompt" / "Send to Build" buttons

---

## Capability Registry (src/shared/capability-registry.ts)

| ID | Display Name | Risk |
|----|-------------|------|
| `text_generation` | Text Generation | safe |
| `code_generation` | Code Generation | write_local |
| `app_building` | App Building | write_local |
| `image_generation` | Image Generation | write_remote |
| `image_understanding` | Image Understanding | read_only |
| + more | (264 lines total) | varies |

- Used by Studio/task orchestration — not surfaced in Skills page yet

---

## MCP Tools (src/shared/types/tool.ts)

- Defined in `tool.ts` type definitions
- Rendered in settings Tools/MCP page
- Not yet exposed in Skills & Agents page as a browsable category

---

## Vibe Templates (src/shared/vibe-templates.ts)

- 14 KB of template definitions used by Studio / Vibe Coding
- Different concept from skills — these are starter prompts for the composer
- Should remain separate from skills catalog

---

## Duplicates

| Duplicate | Reason |
|-----------|--------|
| `research-synthesizer` + `data-analyst` | Both research agents; data-analyst is a specialization |
| `Vibeforge-web-app-builder` + `create-landing-page` skill | Same goal, different scope |
| `Vibeforge-documentation-writer` + `generate-docs` (new) | Same goal, different name |
| `Vibeforge-mcp-builder` + `setup-mcp` (new) | Same goal, different UX framing |

---

## Broken / Missing Entries

| Entry | Issue |
|-------|-------|
| `Vibeforge-spreadsheet-pdf` | `status: placeholder` — no capabilities, no usefulness |
| Android Companion Planner | Listed in user task, not in agent-education.ts |
| MCP Connector | Listed in user task, not in agent-education.ts |
| Performance Optimizer | Listed in user task, not in agent-education.ts |

---

## Resolution Plan

| Action | Files |
|--------|-------|
| Add `tier` field to all agents | `agent-education.ts` |
| Add 10 canonical skills | `curated-skills.ts` |
| Keep old 12 skills with updated IDs (vb- prefix) | `curated-skills.ts` |
| Add Beginner / Advanced tabs | `SkillsPage.tsx` |
| Add Use this / Copy prompt / Send to Build | `SkillsPage.tsx` |
| Add concept strip | `SkillsPage.tsx` |
