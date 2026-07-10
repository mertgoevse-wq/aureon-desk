/**
 * Self-Audit System — Shared Types & Constants
 *
 * Safety rules:
 * - No autonomous self-modification without explicit user approval
 * - No shell/file writes without approval
 * - No secret files included in prompts
 * - No local DBs/logs/env files sent to remote providers
 */

// ---- Audit Categories ----

export const AUDIT_CATEGORIES = [
  'critical_issues',
  'dead_buttons',
  'livepreview_health',
  'studio_health',
  'provider_health',
  'mcp_safety',
  'ui_clutter',
  'performance',
  'docs',
  'dead_code',
  'security_secrets',
  'build_test_health',
] as const

export type AuditCategory = (typeof AUDIT_CATEGORIES)[number]

export const AUDIT_CATEGORY_LABELS: Record<AuditCategory, string> = {
  critical_issues: 'Critical Issues',
  dead_buttons: 'Dead Buttons / Broken UI',
  livepreview_health: 'LivePreview Health',
  studio_health: 'Studio Health',
  provider_health: 'Provider Health',
  mcp_safety: 'MCP Safety',
  ui_clutter: 'UI Clutter',
  performance: 'Performance',
  docs: 'Documentation',
  dead_code: 'Dead Code',
  security_secrets: 'Security / Secrets',
  build_test_health: 'Build & Test Health',
}

export const AUDIT_CATEGORY_DESCRIPTIONS: Record<AuditCategory, string> = {
  critical_issues: 'Checks docs/ISSUES_REGISTER.md for open critical issues, verifies core flows',
  dead_buttons: 'Scans for onClick handlers without implementations, dead routes, broken links',
  livepreview_health: 'Verifies LivePreview service state, sandbox, server, auto-render pipeline',
  studio_health: 'Checks Studio composer, task cards, wizard drawer, routing triggers',
  provider_health: 'Verifies provider configs, API key status, model lists, test connectivity',
  mcp_safety: 'Audits MCP tools: enabled/trusted state, destructive permissions, safety gate',
  ui_clutter: 'Checks for visual overlap, text truncation, responsive issues, unused components',
  performance: 'Checks bundle sizes, render cycles, memory usage hints',
  docs: 'Verifies doc coverage: README, CHANGELOG, ISSUES_REGISTER, AI_QA_REPORT, ARCHITECTURE',
  dead_code: 'Scans for unused imports, unreachable code, orphaned files',
  security_secrets: 'Runs git grep for secrets, verifies .gitignore coverage, checks redaction',
  build_test_health: 'Runs npm run typecheck, npm test, npm run build — reports pass/fail',
}

// ---- Audit Finding Severity ----

export type FindingSeverity = 'critical' | 'major' | 'minor' | 'info'

export const SEVERITY_LABELS: Record<FindingSeverity, string> = {
  critical: 'Critical',
  major: 'Major',
  minor: 'Minor',
  info: 'Info',
}

// ---- Audit Finding ----

export interface AuditFinding {
  id: string
  category: AuditCategory
  severity: FindingSeverity
  title: string
  description: string
  file?: string
  line?: number
  recommendation: string
  checkedAt: string // ISO timestamp
}

// ---- Audit Check Result ----

export interface CategoryCheckResult {
  category: AuditCategory
  label: string
  status: 'pass' | 'warn' | 'fail' | 'skipped'
  findings: AuditFinding[]
  summary: string
  durationMs: number
}

// ---- Audit Report ----

export interface AuditReport {
  reportId: string
  generatedAt: string
  durationMs: number
  mode: AuditMode
  checks: CategoryCheckResult[]
  summary: {
    totalCategories: number
    passed: number
    warned: number
    failed: number
    skipped: number
    totalFindings: number
    criticalCount: number
    majorCount: number
    minorCount: number
    infoCount: number
  }
  redactedFiles: string[]
  warnings: string[]
}

// ---- Improvement Plan ----

export interface ImprovementTask {
  id: string
  title: string
  description: string
  category: AuditCategory
  severity: FindingSeverity
  estimatedRisk: 'low' | 'medium' | 'high'
  filesToChange: string[]
  suggestedApproach: string
  testPlan: string
  relatedFindings: string[] // finding IDs
}

export interface ImprovementPlan {
  planId: string
  generatedAt: string
  basedOnReportId: string
  tasks: ImprovementTask[]
  summary: string
  estimatedTotalRisk: 'low' | 'medium' | 'high'
}

// ---- Patch Proposal ----

export type PatchApprovalState = 'pending' | 'approved' | 'rejected'

export interface PatchProposal {
  proposalId: string
  generatedAt: string
  basedOnPlanId: string
  title: string
  description: string
  tasks: ImprovementTask[]
  fileListToChange: string[]
  riskEstimate: 'low' | 'medium' | 'high'
  testPlan: string
  patchPreview: string // placeholder — human-readable diff summary
  approvalState: PatchApprovalState
  agentPrompt: string // generated prompt for next agent session
}

// ---- Audit Mode ----

export type AuditMode = 'local_only' | 'docs_only' | 'selected_files' | 'full'

export const AUDIT_MODE_LABELS: Record<AuditMode, string> = {
  local_only: 'Analyze locally only',
  docs_only: 'Include docs only',
  selected_files: 'Include selected files',
  full: 'Full audit (docs + source)',
}

export const AUDIT_MODE_DESCRIPTIONS: Record<AuditMode, string> = {
  local_only:
    'Only scan project structure and file names. Do not read file contents except package.json. Safe for sharing.',
  docs_only:
    'Only read docs/ and markdown files. No source code is included in the analysis.',
  selected_files:
    'Only scan files you explicitly select. All other files are excluded.',
  full:
    'Full audit including source code, docs, and project structure. Run entirely locally — nothing is sent to remote providers.',
}

// ---- IPC Request / Result types ----

export interface AuditRequest {
  mode: AuditMode
  selectedFiles?: string[]
  includeCategories?: AuditCategory[]
}

export interface AuditResult {
  success: boolean
  report?: AuditReport
  plan?: ImprovementPlan
  patchProposal?: PatchProposal
  error?: string
}

// ---- Agent Prompt Generator ----

export function generateAgentPrompt(report: AuditReport, plan: ImprovementPlan): string {
  const header = `## Vibeforge Self-Audit — Improvement Plan

**Report ID:** ${report.reportId}
**Generated:** ${report.generatedAt}
**Mode:** ${report.mode}
**Summary:** ${report.summary.passed} passed, ${report.summary.warned} warnings, ${report.summary.failed} failures, ${report.summary.criticalCount} critical findings

### Top Findings:
`

  const topFindings = report.checks
    .flatMap((c) => c.findings)
    .filter((f) => f.severity === 'critical' || f.severity === 'major')
    .slice(0, 10)

  const findingsText = topFindings
    .map(
      (f) =>
        `- [${f.severity.toUpperCase()}] **${f.category}**: ${f.title}\n  - ${f.description}\n  - Recommendation: ${f.recommendation}${f.file ? `\n  - File: ${f.file}${f.line ? `:${f.line}` : ''}` : ''}`
    )
    .join('\n\n')

  const planText = `\n### Improvement Plan (${plan.tasks.length} tasks)

${plan.tasks
  .slice(0, 15)
  .map(
    (t, i) =>
      `${i + 1}. **${t.title}** [risk: ${t.estimatedRisk}] [${t.severity}]\n   - ${t.description}\n   - Files: ${t.filesToChange.join(', ') || 'N/A'}\n   - Approach: ${t.suggestedApproach}\n   - Test plan: ${t.testPlan}`
  )
  .join('\n\n')}
`

  const footer = `\n### Instructions for Next Agent Session

1. Read docs/ISSUES_REGISTER.md, AI_QA_REPORT.md, CHANGELOG.md, docs/IMPLEMENTATION_LOG.md
2. Fix critical issues first
3. Run verify:native, typecheck, tests, build before and after changes
4. Do NOT modify files without explicit user approval
5. Do NOT send source code to remote providers without user consent
6. Commit and push when done
`

  return header + findingsText + planText + footer
}

// ---- Redacted file patterns ----

export const ALWAYS_REDACTED_PATTERNS = [
  '.env',
  '.env.local',
  '.env.production',
  '*.db',
  '*.sqlite',
  '*.sqlite3',
  'app-data/',
  'logs/',
  'imported-repos/',
  'node_modules/',
  'dist/',
  'out/',
  'test-results/',
  'playwright-report/',
  '.git/',
  'scratch/',
  'videos/',
  'traces/',
]

// ---- Safe file patterns (always allowed) ----

export const ALWAYS_SAFE_PATTERNS = [
  'package.json',
  'tsconfig.json',
  'tsconfig.*.json',
  '*.config.*',
  'README.md',
  'CHANGELOG.md',
  'SECURITY_NOTES.md',
  'AGENTS.md',
  'ARCHITECTURE.md',
  'docs/**/*.md',
  'src/shared/**/*.ts',
  '.gitignore',
]
