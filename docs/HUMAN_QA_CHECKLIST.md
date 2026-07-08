# Aureon Desk — Human QA Checklist

> Use this checklist for visible manual QA. Open the app with `npm run dev` and click through every item.
> Check off each item: ✅ pass, ❌ fail, ⚠️ issue (describe in notes).

## Pre-flight

- [ ] `npm run verify:native` — native module loads
- [ ] `npm run typecheck` — zero type errors
- [ ] `npm test` — all tests pass (current: 409)
- [ ] `npm run build` — builds without errors
- [ ] Secret scan clean (`git grep "sk-or-v1"`)
- [ ] Launch date: _______________
- [ ] Tester: _______________

---

## 1. Launch & Window Controls

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 1.1 | App launches without crash | | |
| 1.2 | Window title visible: "Aureon Desk" | | |
| 1.3 | Native window controls work (min/max/close) | | |
| 1.4 | App taskbar icon shows correctly | | |
| 1.5 | Window resizes without breaking layout | | |
| 1.6 | Test at 1366×768 — no overlapping panels | | |
| 1.7 | Test at 1920×1080 — layout uses space well | | |

## 2. Logo & Branding

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 2.1 | Sidebar logo renders (SVG, no blur) | | |
| 2.2 | No fake vendor logos in Connectors page | | |
| 2.3 | Studio hero icon renders correctly | | |
| 2.4 | No broken image icons anywhere | | |
| 2.5 | BrandLockup shows "Aureon Desk" text | | |

## 3. Sidebar

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 3.1 | "New Chat" button works | | |
| 3.2 | Chat list populates and updates | | |
| 3.3 | Clicking a chat navigates to it | | |
| 3.4 | Studio nav button navigates to /studio | | |
| 3.5 | Chat/Prompts/Code/Cowork nav buttons work | | |
| 3.6 | Collapse/expand sidebar works | | |
| 3.7 | Sidebar resizes with drag handle | | |
| 3.8 | Settings button at bottom navigates | | |
| 3.9 | No Workflow section (removed in cleanup) | | |
| 3.10 | No duplicate New button (removed in cleanup) | | |

## 4. Chat Home

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 4.1 | Greeting shows time-aware text | | |
| 4.2 | Composer card visible with model/profile/project selectors | | |
| 4.3 | Composer accepts text input | | |
| 4.4 | Send button visible and clickable | | |
| 4.5 | Recent chats list shows (if any) | | |
| 4.6 | No branding mark in greeting (removed in cleanup) | | |
| 4.7 | No "Try asking" suggestion box (removed in cleanup) | | |

## 5. Chat (Active)

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 5.1 | New chat creates and appears in sidebar | | |
| 5.2 | Text generation produces sensible response (if provider configured) | | |
| 5.3 | Model selector shows correct provider/model | | |
| 5.4 | Model displayed in header matches model used for response | | |
| 5.5 | System prompt selector works | | |
| 5.6 | Slash commands open palette (/fix, /explain, etc.) | | |
| 5.7 | Shift+Enter inserts line break | | |
| 5.8 | Enter sends message | | |
| 5.9 | Copy/paste works in composer | | |
| 5.10 | No "Cancel generation" text in composer | | |

## 6. Create Studio

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 6.1 | Studio page loads at /studio | | |
| 6.2 | 10 task cards visible (Build App through Automate Workflow) | | |
| 6.3 | Each card shows icon, label, description, mode badge | | |
| 6.4 | Clicking a card shows orchestration details | | |
| 6.5 | No inline "Start" button on cards (removed in cleanup) | | |
| 6.6 | Autonomy levels 1-4 visible (level 0 removed in cleanup) | | |
| 6.7 | Autonomy level selector changes active level | | |
| 6.8 | Safety notice visible at bottom | | |
| 6.9 | "Build App" card routes to code/chat with prompt | | |
| 6.10 | "Code Program" card routes to code/chat | | |
| 6.11 | "Generate Text" routes to chat | | |
| 6.12 | "Generate Image" shows provider setup if no image provider | | |
| 6.13 | "Generate Video" shows provider guidance | | |
| 6.14 | "Generate Music" shows provider guidance (no built-in support) | | |
| 6.15 | "Connect Apps" routes to connectors settings | | |
| 6.16 | Missing capability warning links to Connectors page | | |

## 7. Vibe Coding

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 7.1 | Vibe Coding page loads at /vibe | | |
| 7.2 | 3-tab navigation: Quick Start / Guided Builder / Learn | | |
| 7.3 | Project type cards visible and clickable | | |
| 7.4 | Quick actions grid visible | | |
| 7.5 | Guided builder steps progress through selections | | |
| 7.6 | Generated prompt can be sent to Chat or Code mode | | |
| 7.7 | Learn tab shows tutorial cards | | |

## 8. Code Mode (LivePreview)

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 8.1 | Code mode loads at /preview | | |
| 8.2 | LivePreview UI components visible | | |
| 8.3 | Template type selector shows options (HTML, Vite+React, Coding Demo) | | |
| 8.4 | "Create Sandbox" creates and displays sandbox path | | |
| 8.5 | "Start Server" starts preview with URL | | |
| 8.6 | "Stop Server" stops the preview | | |
| 8.7 | URL bar shows localhost URL and copy button | | |
| 8.8 | No crash on rapid start/stop | | |

## 9. Cowork

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 9.1 | Cowork page loads at /cowork | | |
| 9.2 | Task composer visible | | |
| 9.3 | Safety notices visible | | |
| 9.4 | No broken permissions panel | | |

## 10. Settings — Providers

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 10.1 | Settings page loads at /settings | | |
| 10.2 | Providers page shows all adapters | | |
| 10.3 | Provider cards show correct status (Connected/Not connected) | | |
| 10.4 | API key can be entered and saved | | |
| 10.5 | Saved key shows masked value | | |
| 10.6 | Test Connection button works | | |
| 10.7 | Local providers (Ollama, LM Studio) show help cards | | |
| 10.8 | Provider toggle enable/disable works | | |
| 10.9 | Delete provider key works | | |
| 10.10 | Provider layout no longer has overlapping buttons | | |

## 11. Settings — Connectors

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 11.1 | Connectors page at /settings/connectors loads | | |
| 11.2 | 12 connector cards visible | | |
| 11.3 | Each card shows status badge (Connected/Not connected/Needs setup/Planned) | | |
| 11.4 | Expand a card — shows auth type, capabilities, permission scopes, risk notes | | |
| 11.5 | Configure button navigates to correct settings page | | |
| 11.6 | Test button visible for connected API key providers | | |
| 11.7 | Disconnect button visible for connected API key providers | | |
| 11.8 | Phone Companion shows "Planned" status | | |
| 11.9 | Gmail connector shows OAuth scopes and confirmation requirements | | |
| 11.10 | Brand policy notice visible at bottom | | |
| 11.11 | No fake vendor logos — all neutral Lucide icons | | |

## 12. Settings — MCP Tools

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 12.1 | Tools page at /tools loads with master-detail layout | | |
| 12.2 | Tool list on left shows at least the 3 built-in mock tools | | |
| 12.3 | Click a tool — details show on right panel | | |
| 12.4 | Safety check button works | | |
| 12.5 | Run Test button works for mock tools | | |
| 12.6 | Tool call history visible | | |
| 12.7 | Tool suggestions do not auto-run | | |
| 12.8 | Destructive tool permissions show warning | | |
| 12.9 | Untrusted imported tools are disabled by default | | |

## 13. Result Quality (if provider configured)

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 13.1 | Text generation: produces coherent, sensible response | | |
| 13.2 | Code generation: produces valid code, not placeholder | | |
| 13.3 | App building prompt: routes to Code mode | | |
| 13.4 | Model displayed in UI matches model actually used | | |
| 13.5 | Provider missing: shows helpful setup guidance, not crash | | |
| 13.6 | Image generation prompt: shows provider requirements if unconfigured | | |
| 13.7 | Video generation prompt: shows provider requirements | | |
| 13.8 | Music generation prompt: shows "in planning" guidance | | |

## 14. Compact / Responsive

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 14.1 | Modals: ESC key closes them | | |
| 14.2 | Modals: click outside closes them | | |
| 14.3 | Drawer: ESC key closes it | | |
| 14.4 | Drawer: click outside/overlay closes it | | |
| 14.5 | Popovers: close on ESC and click outside | | |
| 14.6 | At 1366×768, no panels overlap | | |
| 14.7 | At 1366×768, all text readable (no truncation issues) | | |
| 14.8 | Command palette opens with Ctrl+K, closes with ESC | | |
| 14.9 | Shortcuts help opens with Ctrl+/ or F1 | | |

## 15. Safety Gates

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 15.1 | Gmail send/draft: UI shows confirmation required | | |
| 15.2 | MCP tools: do not auto-execute | | |
| 15.3 | Studio cards: never execute dangerous actions on click | | |
| 15.4 | Autonomy level 2 (default): asks before acting | | |
| 15.5 | No raw API keys visible in DOM or console | | |
| 15.6 | Secret scan clean (no `sk-or-v1` in source) | | |

---

## Summary

| Section | Total | Passed | Failed | Warning |
|---------|-------|--------|--------|---------|
| 1. Launch & Window | 7 | | | |
| 2. Logo & Branding | 5 | | | |
| 3. Sidebar | 10 | | | |
| 4. Chat Home | 7 | | | |
| 5. Chat (Active) | 10 | | | |
| 6. Create Studio | 16 | | | |
| 7. Vibe Coding | 7 | | | |
| 8. Code Mode | 8 | | | |
| 9. Cowork | 4 | | | |
| 10. Providers | 10 | | | |
| 11. Connectors | 11 | | | |
| 12. MCP Tools | 9 | | | |
| 13. Result Quality | 8 | | | |
| 14. Compact/Responsive | 9 | | | |
| 15. Safety Gates | 6 | | | |
| **TOTAL** | **127** | | | |

## QA Session

- Date: _______________
- Duration: _______________
- Screenshots saved: `docs/qa-screenshots/human-qa/`
- Notes file: `docs/HUMAN_QA_REPORT.md`
