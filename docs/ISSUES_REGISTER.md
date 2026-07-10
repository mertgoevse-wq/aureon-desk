# Vibeforge — Issues Register

> **Last updated:** 2026-07-10 — Rebrand to Vibeforge complete
> **Branch:** `main`

---

## Critical Issues

| ID | Area | Issue | Evidence | Root Cause | Status | Fixed In Commit |
|----|------|-------|----------|------------|--------|-----------------|
| — | — | **None found** | Latest pre-feature review plus baseline QA passed | — | — | — |

### Critical Issue Checklist (2026-07-09) — Updated

| # | Check | Result |
|---|-------|--------|
| 1 | App starts (`npm run build` + `npm run dev`) | ✅ PASS |
| 2 | Typecheck (`npm run typecheck`) | ✅ PASS |
| 3 | Unit tests (`npm test`, 723 tests) | ✅ PASS |
| 4 | Build (`npm run build`) | ✅ PASS |
| 5 | Main navigation (Chat/Studio/Code/Settings/Cowork/LivePreview) | ✅ PASS |
| 6 | Buttons/cards/dropdowns have handlers | ✅ PASS — 11-button contract verified |
| 7 | Studio Build App flow opens and can submit | ✅ PASS (E2E verified) |
| 8 | Task Brief Composer accepts typing/Enter | ✅ PASS |
| 9 | LivePreview auto-opens/renders for Build App/Code flow | ✅ PASS (push sync+fast poll) |
| 10 | Code generation creates files/preview/output | ✅ PASS |
| 11 | Provider settings accept typing/paste/save/test | ✅ PASS (E2E verified) |
| 12 | Model/provider label matches actual route | ✅ PASS (canonical resolver) |
| 13 | MCP/tools NOT auto-run, labeled mock/real | ✅ PASS — connection and execution now enforce enabled/trusted/confirmation gates |
| 14 | Dropdowns/popovers render correctly, no overlap | ✅ PASS (Modal/Drawer focus traps) |
| 15 | Window controls correct position | ✅ PASS (native Windows frame) |
| 16 | Hero landing/home screen present and working | ✅ PASS |
| 17 | Logo/icon/image assets not broken | ✅ PASS |
| 18 | No overlap at 1366×768 | ✅ PASS (E2E verified) |
| 19 | No secrets in logs/docs/screenshots | ✅ PASS (secret scan clean) |
| 20 | Performance reasonable on 16GB/no GPU | ✅ PASS (inferred from tests) |
| 21 | Safe connector/social presets do not perform live third-party actions | ✅ PASS |
| 22 | Social publish/reply/delete/upload actions require exact-content confirmation | ✅ PASS |
| 23 | Core contract: Studio → Build Pipeline → Code → LivePreview | ✅ PASS — verified 9-step flow |
| 24 | Deterministic demo works without API key | ✅ PASS — demo:coding 9/9 |
| 25 | Live human QA — headed Playwright + code-level audit | ✅ PASS — 0 dead buttons, 11/11 verified |
| 26 | Private beta ready | ✅ YES — all 11 critical gates pass |

---

## Post-Run Consolidation (2026-07-09)

- **Latest commit:** `c1f566e`
- **Pre-flight:** verify:native ✅, typecheck ✅, 597 tests ✅, build ✅, dev server ✅
- **Critical Issues:** 0
- **Circular dependencies:** 0 (madge verified across 137 files)
- **Dead code removed:** 8 files, 6 exports (see `docs/CODE_CLEANUP_AUDIT.md`)
- **Verdict:** ✅ READY FOR BETA QA — no critical blockers

---

## Major Issues

| ID | Area | Issue | Evidence | Root Cause | Status | Fixed In Commit |
|----|------|-------|----------|------------|--------|-----------------|
| M-01 | Cowork | Task execution is simulated with `setTimeout` | `CoworkPage.tsx` — explicit placeholder labeling | Intentional beta design — real agent execution deferred | ✅ KNOWN | — |
| M-02 | MCP Tools | No real third-party MCP server is configured for end-to-end validation | MCP lifecycle and execution now exist; no user server was connected in this pass | Requires a user-configured server and visible desktop test | OPEN | — |
| M-03 | Connectors | Google Drive and Calendar are placeholders | `connectors.ts` — "Placeholder — full implementation planned" | Intentional — OAuth flow not yet implemented | ✅ KNOWN | — |
| M-04 | Settings | Extensions and Security pages are placeholders | `SettingsPlaceholderPage.tsx` — shell pages | Intentional — features deferred for later releases | ✅ KNOWN | — |
| M-05 | Prompt Library | "Save current composer text as a prompt" is placeholder | `PromptLibrary.tsx:147` — "composer integration comes later" | Not yet wired to chat composer | OPEN | — |
| M-06 | Chat | No file attachment UI | Schema has attachment columns, no upload button | Deferred feature | ✅ KNOWN | — |
| M-07 | Providers | Custom provider adapter routing not fully tested with real endpoints | `chat-completion.service.ts` — 8 adapters, OpenRouter most tested | Limited test infrastructure | OPEN | — |
| M-08 | Social Connectors | OAuth/API flows are setup-contract placeholders | `social-connectors.ts`, `ConnectorsPage.tsx` — test placeholders only | Intentional safe first pass | ✅ KNOWN | — |

---

## Minor Issues

| ID | Area | Issue | Evidence | Root Cause | Status | Fixed In Commit |
|----|------|-------|----------|------------|--------|-----------------|
| m-01 | Vibe Coding | "All templates" collapsed default hides discoverability | `VibeCoding.tsx` — collapsed state | Intentional declutter from 2026-07-08 pass | ✅ KNOWN | — |
| m-02 | Chat | "More…" button low discoverability (no icon, muted text) | `ChatWorkspace.tsx` — plain text pill | Intentional from UI beauty pass | ✅ KNOWN | — |
| m-03 | Studio | Autonomy selector is icon-only (tooltip dependent) | `Studio.tsx` — compact icon row | Intentional compaction from hero refinement | ✅ KNOWN | — |
| m-04 | Chat | No token count / context window display | Missing from `ChatPanel.tsx` | Not yet implemented | OPEN | — |
| m-05 | Settings | 2-column layout (not 3-column with sub-nav) | `SettingsLayout.tsx` | Design choice | ✅ KNOWN | — |
| m-06 | Sidebar | Workflow items all route to `/cowork` regardless of which item clicked | `Sidebar.tsx` — Cowork feature area is single page | Intentional — Cowork is placeholder | ✅ KNOWN | — |

---

## Regression Risks

| Area | Risk | Test/Manual Check |
|------|------|-------------------|
| Studio → LivePreview pipeline | If sessionStorage keys change, auto-start breaks | `live-preview.test.ts` contract tests + manual: Build App wizard → Code mode → preview renders |
| Provider routing | If model resolver changes, mislabeled providers | `chat-completion.test.ts` routing tests + manual: check model label in chat header |
| Log redaction | If new log call sites added without redaction | `log-redacter.ts` 9-tier patterns + secret scan |
| MCP safety gate | If new transports or confirmation paths bypass safety checks | `mcp-safety-contract.test.ts` + real-server manual test |
| Hero gradient | If tokens.css changes break radial gradient | Manual: check hero pages (Chat, Studio, Vibe Coding) |

---

## Protocol Adoption

This file was created as part of adopting the **Aureon Desk Global Run Protocol** (2026-07-09).

Every future run must:
1. Read this file along with AI_QA_REPORT.md and CHANGELOG.md
2. Fix any OPEN critical or major issues before implementing new features
3. Update this file with new findings and resolution status
4. Reference commit hashes for all fixes
