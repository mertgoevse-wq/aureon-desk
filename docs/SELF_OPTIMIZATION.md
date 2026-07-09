# Aureon Desk — Self-Audit & Optimization System

> **Version:** 0.9.66  
> **Created:** 2026-07-09  
> **Branch:** main  

---

## Overview

The Self-Audit system allows Aureon Desk to inspect its own project repository, detect issues across 12 categories, generate prioritized improvement plans, and propose patches — **without ever silently modifying itself**.

All analysis is performed **locally** on the user's machine. No data is ever sent to remote providers. Sensitive files (`.env`, `*.db`, `logs/`, `node_modules/`, etc.) are **always excluded** from audit scans.

---

## Safety Model (Non-Negotiable)

| Rule | Enforcement |
|------|-------------|
| **Read-only** | The audit service NEVER writes files, modifies code, or runs shell commands. All operations are `fs.readFileSync`, `fs.readdirSync`, `fs.existsSync`. |
| **No remote calls** | All analysis is local. No data is ever sent to remote providers or external APIs. |
| **Secret redaction** | Sensitive files (`.env`, `*.db`, `*.sqlite`, `node_modules/`, `logs/`, `app-data/`, `test-results/`, etc.) are always excluded regardless of mode. |
| **Mode-gated file reading** | `local_only` mode only reads `package.json`. `docs_only` mode only reads markdown docs. `full` mode reads source but never transmits. |
| **Approval required** | Patch proposals start in `pending` state. They must be explicitly approved by the user before any changes can be applied. |
| **No autonomous self-modification** | Aureon will never modify itself without explicit consent. The `approvalState` field must be set to `approved` explicitly. |

---

## Audit Categories (12)

| Category | What it Checks |
|----------|---------------|
| **Critical Issues** | Reads `docs/ISSUES_REGISTER.md` for open critical issues |
| **Dead Buttons** | Scans for dead onClick handlers, broken routes, dead links |
| **LivePreview Health** | Verifies LivePreview service, sandbox, server, auto-render |
| **Studio Health** | Checks Studio composer, task cards, wizard drawer, routing |
| **Provider Health** | Verifies provider configs, API keys, model lists, connectivity |
| **MCP Safety** | Audits MCP tools: enabled/trusted, destructive permissions, safety gate |
| **UI Clutter** | Checks visual overlap, text truncation, responsive issues |
| **Performance** | Checks bundle sizes, render cycles, memory hints |
| **Documentation** | Verifies doc coverage: README, CHANGELOG, ISSUES_REGISTER, etc. |
| **Dead Code** | Scans for unused imports, unreachable code, orphaned files |
| **Security/Secrets** | Runs pattern checks, .gitignore audit, redaction verification |
| **Build & Test Health** | Verifies package.json scripts, test framework, TypeScript presence |

---

## Audit Modes (4)

| Mode | Description |
|------|-------------|
| **Local Only** | Only scan project structure and file names. Do not read file contents except `package.json`. Safe for sharing. |
| **Docs Only** | Only read `docs/` and markdown files. No source code is included. |
| **Selected Files** | Only scan files you explicitly select. All others are excluded. |
| **Full** | Full audit including source code, docs, and project structure. Run entirely locally — nothing is sent to remote providers. |

---

## Usage

1. Open **Settings → Self Audit** in Aureon Desk
2. Select an audit mode (default: Local Only)
3. Click **Run Audit**
4. Review results across 12 categories (expandable)
5. Click **Generate Improvement Plan** to create prioritized tasks
6. Click **Generate Patch Proposal** to create a patch
7. **Approve** or **Reject** the patch proposal
8. Use **Copy Prompt**, **Send to Chat**, or **Open in Code Mode** to hand off to an agent

---

## Architecture

```
src/
├── shared/
│   └── self-audit.ts          # Types, constants, agent prompt generator
├── main/
│   ├── services/
│   │   └── self-audit.service.ts  # Audit engine (read-only, local-only)
│   └── ipc/
│       └── self-audit.ipc.ts      # IPC handlers (typed, no any)
└── renderer/
    └── src/
        └── pages/
            └── SelfAudit.tsx      # UI page (3-tab layout)

tests/
└── unit/
    └── self-audit.test.ts         # 36 unit tests
```

### IPC API

| Method | Description |
|--------|-------------|
| `selfAuditRun(request)` | Run full audit pipeline (audit → plan → patch) |
| `selfAuditRunAuditOnly(request)` | Run audit only, return report |
| `selfAuditGeneratePlan(report)` | Generate improvement plan from report |
| `selfAuditGeneratePatch(plan, report)` | Generate patch proposal from plan |

---

## Improvement Plan Format

Each task in an improvement plan includes:
- **Title & Description** — what to fix and why
- **Severity** — critical, major, minor, or info
- **Estimated Risk** — low, medium, or high
- **Files to Change** — list of file paths
- **Suggested Approach** — how to fix it
- **Test Plan** — how to verify the fix
- **Related Findings** — links to audit findings

---

## Patch Proposal Flow

1. **Generate**: System creates a patch proposal from the improvement plan
2. **Review**: User reviews file list, risk estimate, test plan, and patch preview
3. **Approve/Reject**: User explicitly approves or rejects the patch
4. **Hand off**: User copies the agent prompt, sends to chat, or opens in code mode
5. **Apply**: A future agent session applies the approved patch (never automatic)

---

## Agent Prompt Format

Generated agent prompts include:
- Audit report summary (pass/warn/fail counts)
- Top critical and major findings with recommendations
- Prioritized improvement tasks with file lists and approaches
- Safety instructions for the next agent session:
  - Read docs before implementing
  - Fix critical issues first
  - Run verify:native, typecheck, tests, build
  - Do NOT modify files without explicit user approval
  - Do NOT send source code to remote providers

---

## Test Coverage

36 unit tests in `tests/unit/self-audit.test.ts`:

| Area | Tests |
|------|-------|
| Shared types & constants | 4 tests |
| Redacted/safe file patterns | 6 tests |
| Audit report structure | 4 tests |
| Improvement plan structure | 4 tests |
| Patch proposal safety | 8 tests |
| Agent prompt generation | 4 tests |
| Audit finding fields | 2 tests |
| Category check results | 2 tests |
| Category completeness | 1 test |
| **Total** | **36 tests** |

---

## Known Limitations

1. **7 categories are structural only** — `dead_buttons`, `livepreview_health`, `studio_health`, `provider_health`, `mcp_safety`, `ui_clutter`, `performance` require the full app running for deep analysis
2. **Visual QA deferred** — manual `npm run dev` click-through not yet performed
3. **Open in Code Mode** — sessionStorage key set but not yet consumed by LivePreview page
4. **Docs depth** — `AI_QA_REPORT.md` and `CHANGELOG.md` contents not deeply analyzed (only existence checked)
5. **Secret scanning** — pattern-based only; real `git grep` not executed from service (safety decision)

---

## Future Improvements

- Add deep analysis for structural categories when app is running
- Wire Open in Code Mode to consume self-audit sessionStorage
- Add real `git grep` integration for secret scanning (with safety gate)
- Add historical trend tracking (compare audits over time)
- Add auto-scheduling (run audit on startup, before commits)
- Deep read of AI_QA_REPORT.md and CHANGELOG.md for recent changes analysis
