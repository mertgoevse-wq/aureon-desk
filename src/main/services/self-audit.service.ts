import { v4 as uuid } from 'uuid'
import path from 'path'
import fs from 'fs'
import { logger } from '../utils/logger'
import type {
  AuditCategory,
  AuditFinding,
  AuditMode,
  AuditReport,
  AuditRequest,
  AuditResult,
  CategoryCheckResult,
  FindingSeverity,
  ImprovementPlan,
  ImprovementTask,
  PatchProposal,
} from '../../shared/self-audit'
import {
  AUDIT_CATEGORIES,
  AUDIT_CATEGORY_LABELS,
  ALWAYS_REDACTED_PATTERNS,
  ALWAYS_SAFE_PATTERNS,
  generateAgentPrompt,
} from '../../shared/self-audit'

/**
 * Self-Audit Service
 *
 * SAFETY RULES (NON-NEGOTIABLE):
 * 1. READ-ONLY: This service NEVER writes files, modifies code, or runs shell commands
 *    that could alter the project. It only reads.
 * 2. NO REMOTE: This service NEVER sends data to remote providers. All analysis is local.
 * 3. NO SECRETS: File contents are never included in audit reports unless they match
 *    ALWAYS_SAFE_PATTERNS. Secret files (.env, *.db, etc.) are always redacted.
 * 4. APPROVAL REQUIRED: Patch proposals require explicit user approval before any
 *    modification. The service only generates proposals — it never applies them.
 */

const PROJECT_ROOT = (() => {
  // __dirname is out/main in dev, so 2 levels up = project root
  const candidate = path.resolve(__dirname, '..', '..')
  // Verify by checking for package.json
  if (fs.existsSync(path.join(candidate, 'package.json'))) {
    return candidate
  }
  // Fallback: try 1 more level up (for production builds)
  const parent = path.resolve(__dirname, '..', '..', '..')
  if (fs.existsSync(path.join(parent, 'package.json'))) {
    return parent
  }
  return process.cwd()
})()

function redactedPath(filePath: string): string {
  return `[REDACTED: ${filePath}]`
}

function isRedacted(filePath: string): boolean {
  const relative = path.relative(PROJECT_ROOT, filePath).replace(/\\/g, '/')
  for (const pattern of ALWAYS_REDACTED_PATTERNS) {
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$')
      if (regex.test(relative)) return true
    } else if (pattern.endsWith('/')) {
      if (relative.startsWith(pattern) || relative === pattern.slice(0, -1)) return true
    } else {
      if (relative === pattern) return true
    }
  }
  return false
}

function isSafeForFullAudit(filePath: string): boolean {
  const relative = path.relative(PROJECT_ROOT, filePath).replace(/\\/g, '/')
  // Always block redacted files
  if (isRedacted(filePath)) return false
  // Block large binary files
  const ext = path.extname(filePath).toLowerCase()
  const binaryExts = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.woff', '.woff2', '.ttf', '.eot', '.mp4', '.webm', '.zip', '.exe', '.dll']
  if (binaryExts.includes(ext)) return false
  // Block large generated files
  if (relative.startsWith('dist/') || relative.startsWith('out/') || relative.startsWith('node_modules/')) return false
  return true
}

function isSafeForDocsOnly(filePath: string): boolean {
  const relative = path.relative(PROJECT_ROOT, filePath).replace(/\\/g, '/')
  return (
    relative.endsWith('.md') ||
    relative === 'package.json' ||
    relative === 'tsconfig.json' ||
    relative === '.gitignore'
  )
}

function findFindingId(): string {
  return uuid().slice(0, 8)
}

function makeFinding(
  category: AuditCategory,
  severity: FindingSeverity,
  title: string,
  description: string,
  recommendation: string,
  file?: string,
  line?: number,
): AuditFinding {
  return {
    id: findFindingId(),
    category,
    severity,
    title,
    description,
    file,
    line,
    recommendation,
    checkedAt: new Date().toISOString(),
  }
}

// ---- File Scanner ----

function scanProjectStructure(): { files: string[]; dirs: string[] } {
  const files: string[] = []
  const dirs: string[] = []

  function walk(dir: string, depth: number = 0) {
    if (depth > 6) return
    let entries: fs.Dirent[]
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      const relative = path.relative(PROJECT_ROOT, fullPath).replace(/\\/g, '/')
      if (isRedacted(fullPath)) continue
      if (entry.name.startsWith('.')) continue
      if (entry.isDirectory()) {
        dirs.push(relative)
        if (!['node_modules', 'dist', 'out', '.git', 'test-results', 'playwright-report', 'logs', 'app-data', 'imported-repos', 'scratch', 'videos', 'traces'].includes(entry.name)) {
          walk(fullPath, depth + 1)
        }
      } else if (entry.isFile()) {
        files.push(relative)
      }
    }
  }

  walk(PROJECT_ROOT)
  return { files, dirs }
}

// ---- Category Checks ----

function checkCriticalIssues(auditMode: AuditMode): CategoryCheckResult {
  const start = Date.now()
  const findings: AuditFinding[] = []
  const issuesRegisterPath = path.join(PROJECT_ROOT, 'docs', 'ISSUES_REGISTER.md')

  // In local_only mode, don't read file contents (only check existence)
  if (auditMode === 'local_only') {
    if (fs.existsSync(issuesRegisterPath)) {
      findings.push(
        makeFinding(
          'critical_issues',
          'info',
          'ISSUES_REGISTER.md exists',
          'The issues register file is present. Switch to docs_only or full mode to read its contents.',
          'Re-run audit in a mode that reads docs for detailed analysis.',
          'docs/ISSUES_REGISTER.md',
        ),
      )
    } else {
      findings.push(
        makeFinding(
          'critical_issues',
          'major',
          'docs/ISSUES_REGISTER.md not found',
          'The issues register file is missing.',
          'Create docs/ISSUES_REGISTER.md to track known issues.',
        ),
      )
    }
    return {
      category: 'critical_issues',
      label: AUDIT_CATEGORY_LABELS.critical_issues,
      status: 'pass',
      findings,
      summary: `${findings.length} finding(s) (local_only — file contents not read)`,
      durationMs: Date.now() - start,
    }
  }

  try {
    if (fs.existsSync(issuesRegisterPath)) {
      const content = fs.readFileSync(issuesRegisterPath, 'utf-8')
      const hasOpenCritical = content.includes('| — | — | **None found**')
      if (hasOpenCritical) {
        findings.push(
          makeFinding(
            'critical_issues',
            'info',
            'No open critical issues',
            'docs/ISSUES_REGISTER.md reports no open critical issues.',
            'Continue monitoring for regressions.',
            'docs/ISSUES_REGISTER.md',
          ),
        )
      }
      // Check for OPEN status in critical issues table
      const criticalTableMatch = content.match(/## Critical Issues\n\n([\s\S]*?)(?=\n## |$)/)
      if (criticalTableMatch) {
        const criticalSection = criticalTableMatch[1]
        const openCritical = criticalSection.match(/\|.*\|.*\|.*\|.*\|.*\| OPEN \|/g)
        if (openCritical && openCritical.length > 0) {
          findings.push(
            makeFinding(
              'critical_issues',
              'critical',
              `${openCritical.length} open critical issue(s) found`,
              'docs/ISSUES_REGISTER.md has open critical issues that need attention.',
              'Fix all open critical issues before adding new features.',
              'docs/ISSUES_REGISTER.md',
            ),
          )
        }
      }
    } else {
      findings.push(
        makeFinding(
          'critical_issues',
          'major',
          'docs/ISSUES_REGISTER.md not found',
          'The issues register file is missing.',
          'Create docs/ISSUES_REGISTER.md to track known issues.',
        ),
      )
    }
  } catch (err) {
    findings.push(
      makeFinding(
        'critical_issues',
        'major',
        'Failed to read ISSUES_REGISTER.md',
        `Error reading issues register: ${err instanceof Error ? err.message : String(err)}`,
        'Check file permissions and path.',
        'docs/ISSUES_REGISTER.md',
      ),
    )
  }

  return {
    category: 'critical_issues',
    label: AUDIT_CATEGORY_LABELS.critical_issues,
    status: findings.some((f) => f.severity === 'critical') ? 'fail' : findings.some((f) => f.severity === 'major') ? 'warn' : 'pass',
    findings,
    summary: `${findings.length} finding(s)`,
    durationMs: Date.now() - start,
  }
}

function checkBuildTestHealth(auditMode: AuditMode): CategoryCheckResult {
  const start = Date.now()
  const findings: AuditFinding[] = []

  // Check package.json exists
  const pkgPath = path.join(PROJECT_ROOT, 'package.json')
  if (!fs.existsSync(pkgPath)) {
    findings.push(
      makeFinding(
        'build_test_health',
        'critical',
        'package.json not found',
        'The project package.json is missing.',
        'Restore package.json from version control.',
        'package.json',
      ),
    )
    return {
      category: 'build_test_health',
      label: AUDIT_CATEGORY_LABELS.build_test_health,
      status: 'fail',
      findings,
      summary: 'package.json missing',
      durationMs: Date.now() - start,
    }
  }

  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
    const scripts = pkg.scripts || {}

    // Check essential scripts
    const essentialScripts = ['typecheck', 'test', 'build', 'dev']
    for (const script of essentialScripts) {
      if (!scripts[script]) {
        findings.push(
          makeFinding(
            'build_test_health',
            'major',
            `Missing "${script}" script`,
            `package.json does not have a "${script}" script defined.`,
            `Add a "${script}" script to package.json.`,
            'package.json',
          ),
        )
      }
    }

    // Check test framework
    const hasVitest = pkg.devDependencies?.vitest || pkg.dependencies?.vitest
    const hasJest = pkg.devDependencies?.jest || pkg.dependencies?.jest
    if (!hasVitest && !hasJest) {
      findings.push(
        makeFinding(
          'build_test_health',
          'minor',
          'No test framework detected',
          'Neither vitest nor jest found in dependencies.',
          'Consider adding vitest for unit testing.',
          'package.json',
        ),
      )
    }

    // Check TypeScript
    if (!pkg.devDependencies?.typescript && !pkg.dependencies?.typescript) {
      findings.push(
        makeFinding(
          'build_test_health',
          'major',
          'TypeScript not found in dependencies',
          'The project may not be using TypeScript.',
          'Add TypeScript to devDependencies.',
          'package.json',
        ),
      )
    }

    if (findings.length === 0) {
      findings.push(
        makeFinding(
          'build_test_health',
          'info',
          'Build scripts look healthy',
          'All essential scripts (typecheck, test, build, dev) are present.',
          'Keep running typecheck, test, and build before each commit.',
          'package.json',
        ),
      )
    }
  } catch (err) {
    findings.push(
      makeFinding(
        'build_test_health',
        'critical',
        'Failed to parse package.json',
        `Error: ${err instanceof Error ? err.message : String(err)}`,
        'Validate package.json syntax.',
        'package.json',
      ),
    )
  }

  return {
    category: 'build_test_health',
    label: AUDIT_CATEGORY_LABELS.build_test_health,
    status: findings.some((f) => f.severity === 'critical') ? 'fail' : findings.some((f) => f.severity === 'major') ? 'warn' : 'pass',
    findings,
    summary: `${findings.length} finding(s)`,
    durationMs: Date.now() - start,
  }
}

function checkSecuritySecrets(auditMode: AuditMode): CategoryCheckResult {
  const start = Date.now()
  const findings: AuditFinding[] = []

  // Check .gitignore exists
  const gitignorePath = path.join(PROJECT_ROOT, '.gitignore')
  if (!fs.existsSync(gitignorePath)) {
    findings.push(
      makeFinding(
        'security_secrets',
        'critical',
        '.gitignore not found',
        'No .gitignore file — secrets could be committed.',
        'Create a .gitignore file with proper patterns.',
      ),
    )
  } else {
    try {
      const content = fs.readFileSync(gitignorePath, 'utf-8')
      const requiredPatterns = ['node_modules', 'dist', '.env', '*.db', '*.sqlite']
      const missing = requiredPatterns.filter((p) => !content.includes(p))
      if (missing.length > 0) {
        findings.push(
          makeFinding(
            'security_secrets',
            'major',
            `.gitignore missing ${missing.length} essential pattern(s)`,
            `Missing: ${missing.join(', ')}`,
            'Add these patterns to .gitignore.',
            '.gitignore',
          ),
        )
      } else {
        findings.push(
          makeFinding(
            'security_secrets',
            'info',
            '.gitignore looks healthy',
            'All essential patterns present.',
            'Keep .gitignore up to date.',
            '.gitignore',
          ),
        )
      }
    } catch (err) {
      findings.push(
        makeFinding(
          'security_secrets',
          'major',
          'Failed to read .gitignore',
          `Error: ${err instanceof Error ? err.message : String(err)}`,
          'Check file permissions.',
          '.gitignore',
        ),
      )
    }
  }

  // Check for .npmrc with tokens
  const npmrcPath = path.join(PROJECT_ROOT, '.npmrc')
  if (fs.existsSync(npmrcPath)) {
    try {
      const content = fs.readFileSync(npmrcPath, 'utf-8')
      if (content.includes('_authToken') || content.includes('_auth')) {
        findings.push(
          makeFinding(
            'security_secrets',
            'critical',
            '.npmrc may contain auth tokens',
            'The .npmrc file contains _authToken or _auth — ensure it is in .gitignore.',
            'Verify .npmrc is gitignored or use environment variables instead.',
            '.npmrc',
          ),
        )
      }
    } catch { /* ignore read errors */ }
  }

  // Check SECURITY_NOTES.md exists
  const securityNotesPath = path.join(PROJECT_ROOT, 'SECURITY_NOTES.md')
  if (!fs.existsSync(securityNotesPath)) {
    findings.push(
      makeFinding(
        'security_secrets',
        'minor',
        'SECURITY_NOTES.md not found',
        'Security documentation is missing.',
        'Create SECURITY_NOTES.md documenting security practices.',
      ),
    )
  }

  return {
    category: 'security_secrets',
    label: AUDIT_CATEGORY_LABELS.security_secrets,
    status: findings.some((f) => f.severity === 'critical') ? 'fail' : findings.some((f) => f.severity === 'major') ? 'warn' : 'pass',
    findings,
    summary: `${findings.length} finding(s)`,
    durationMs: Date.now() - start,
  }
}

function checkDocs(auditMode: AuditMode): CategoryCheckResult {
  const start = Date.now()
  const findings: AuditFinding[] = []

  const requiredDocs = [
    'README.md',
    'CHANGELOG.md',
    'SECURITY_NOTES.md',
    'AGENTS.md',
    'ARCHITECTURE.md',
    'docs/ISSUES_REGISTER.md',
    'docs/IMPLEMENTATION_LOG.md',
  ]

  for (const doc of requiredDocs) {
    const docPath = path.join(PROJECT_ROOT, doc)
    if (!fs.existsSync(docPath)) {
      findings.push(
        makeFinding(
          'docs',
          'major',
          `Missing: ${doc}`,
          `Required documentation file "${doc}" not found.`,
          `Create ${doc} with appropriate content.`,
          doc,
        ),
      )
    }
  }

  if (findings.length === 0) {
    findings.push(
      makeFinding(
        'docs',
        'info',
        'All required docs present',
        `All ${requiredDocs.length} required documentation files exist.`,
        'Keep docs up to date with each change.',
      ),
    )
  }

  return {
    category: 'docs',
    label: AUDIT_CATEGORY_LABELS.docs,
    status: findings.some((f) => f.severity === 'major') ? 'warn' : 'pass',
    findings,
    summary: `${findings.length} finding(s)`,
    durationMs: Date.now() - start,
  }
}

function checkDeadCode(auditMode: AuditMode): CategoryCheckResult {
  const start = Date.now()
  const findings: AuditFinding[] = []

  // In local_only and docs_only modes, don't read source files
  if (auditMode === 'docs_only' || auditMode === 'local_only') {
    return {
      category: 'dead_code',
      label: AUDIT_CATEGORY_LABELS.dead_code,
      status: 'skipped',
      findings: [
        makeFinding(
          'dead_code',
          'info',
          'Dead code check skipped',
          `Dead code analysis requires source files. Current mode is ${auditMode === 'local_only' ? 'local-only (structure only)' : 'docs-only'}.`,
          'Switch to full or selected-files mode to scan for dead code.',
        ),
      ],
      summary: `Skipped (${auditMode} mode)`,
      durationMs: Date.now() - start,
    }
  }

  // Scan for common dead code patterns in source files
  const srcDir = path.join(PROJECT_ROOT, 'src')
  if (fs.existsSync(srcDir)) {
    const { files } = scanProjectStructure()
    const sourceFiles = files.filter(
      (f) => f.startsWith('src/') && (f.endsWith('.ts') || f.endsWith('.tsx')) && !f.endsWith('.d.ts'),
    )

    // Check for unused imports pattern: files with many imports
    // This is a heuristic — real dead code detection needs a linter
    let suspiciousFiles = 0
    for (const file of sourceFiles.slice(0, 50)) {
      const fullPath = path.join(PROJECT_ROOT, file)
      if (!isSafeForFullAudit(fullPath)) continue
      try {
        const content = fs.readFileSync(fullPath, 'utf-8')
        const importCount = (content.match(/^import\s/gm) || []).length
        if (importCount > 15) {
          suspiciousFiles++
        }
      } catch { /* skip */ }
    }

    if (suspiciousFiles > 0) {
      findings.push(
        makeFinding(
          'dead_code',
          'minor',
          `${suspiciousFiles} file(s) with many imports`,
          `${suspiciousFiles} source files have more than 15 import statements. Some may be unused.`,
          'Run a linter (ESLint with no-unused-vars) to detect dead imports and code.',
        ),
      )
    }

    // Check for TODO/FIXME count
    let todoCount = 0
    for (const file of sourceFiles.slice(0, 100)) {
      const fullPath = path.join(PROJECT_ROOT, file)
      if (!isSafeForFullAudit(fullPath)) continue
      try {
        const content = fs.readFileSync(fullPath, 'utf-8')
        todoCount += (content.match(/\/\/\s*TODO/g) || []).length
        todoCount += (content.match(/\/\/\s*FIXME/g) || []).length
      } catch { /* skip */ }
    }

    if (todoCount > 5) {
      findings.push(
        makeFinding(
          'dead_code',
          'minor',
          `${todoCount} TODO/FIXME comments found`,
          'Lingering TODOs may indicate incomplete features or dead code.',
          'Review and address or remove stale TODOs.',
        ),
      )
    }

    if (findings.length === 0) {
      findings.push(
        makeFinding(
          'dead_code',
          'info',
          'Dead code scan clean',
          'No obvious dead code patterns detected in source scan.',
          'Run linters periodically to catch dead code.',
        ),
      )
    }
  }

  return {
    category: 'dead_code',
    label: AUDIT_CATEGORY_LABELS.dead_code,
    status: findings.some((f) => f.severity === 'major') ? 'warn' : 'pass',
    findings,
    summary: `${findings.length} finding(s)`,
    durationMs: Date.now() - start,
  }
}

function checkPlaceholderCategory(category: AuditCategory): CategoryCheckResult {
  const start = Date.now()
  return {
    category,
    label: AUDIT_CATEGORY_LABELS[category],
    status: 'skipped',
    findings: [
      makeFinding(
        category,
        'info',
        `${AUDIT_CATEGORY_LABELS[category]} — structural check only`,
        `Deep ${AUDIT_CATEGORY_LABELS[category].toLowerCase()} analysis requires the full app to be running. This is a structural placeholder.`,
        'Run a full audit with the app running for comprehensive analysis.',
      ),
    ],
    summary: '1 finding (structural placeholder)',
    durationMs: Date.now() - start,
  }
}

// ---- Main Service ----

export const selfAuditService = {
  /**
   * Run a full self-audit.
   * SAFE: Read-only, no writes, no remote calls, no secrets exposed.
   */
  async runAudit(request: AuditRequest): Promise<AuditReport> {
    const reportId = uuid()
    const start = Date.now()
    const redactedFiles: string[] = []
    const warnings: string[] = []
    const checks: CategoryCheckResult[] = []

    // Validate mode
    const mode = request.mode || 'local_only'

    // Add redaction warning for full mode
    if (mode === 'full') {
      warnings.push(
        'Full audit mode: source file contents are read but NEVER sent to remote providers. All analysis is local.',
      )
    }

    // Scan project structure
    const { files, dirs } = scanProjectStructure()
    logger.info(`Self-audit: ${files.length} files, ${dirs.length} dirs found in ${mode} mode`)

    // Run category checks
    const deepCategories: AuditCategory[] = ['critical_issues', 'build_test_health', 'security_secrets', 'docs', 'dead_code']
    const structuralCategories: AuditCategory[] = AUDIT_CATEGORIES.filter((c) => !deepCategories.includes(c as AuditCategory)) as AuditCategory[]

    // Deep checks
    for (const category of deepCategories) {
      switch (category) {
        case 'critical_issues':
          checks.push(checkCriticalIssues(mode))
          break
        case 'build_test_health':
          checks.push(checkBuildTestHealth(mode))
          break
        case 'security_secrets':
          checks.push(checkSecuritySecrets(mode))
          break
        case 'docs':
          checks.push(checkDocs(mode))
          break
        case 'dead_code':
          checks.push(checkDeadCode(mode))
          break
      }
    }

    // Structural checks (placeholder — work in a running app)
    for (const category of structuralCategories) {
      checks.push(checkPlaceholderCategory(category))
    }

    // Compute summary
    const passed = checks.filter((c) => c.status === 'pass').length
    const warned = checks.filter((c) => c.status === 'warn').length
    const failed = checks.filter((c) => c.status === 'fail').length
    const skipped = checks.filter((c) => c.status === 'skipped').length
    const allFindings = checks.flatMap((c) => c.findings)
    const criticalCount = allFindings.filter((f) => f.severity === 'critical').length
    const majorCount = allFindings.filter((f) => f.severity === 'major').length
    const minorCount = allFindings.filter((f) => f.severity === 'minor').length
    const infoCount = allFindings.filter((f) => f.severity === 'info').length

    return {
      reportId,
      generatedAt: new Date().toISOString(),
      durationMs: Date.now() - start,
      mode,
      checks,
      summary: {
        totalCategories: checks.length,
        passed,
        warned,
        failed,
        skipped,
        totalFindings: allFindings.length,
        criticalCount,
        majorCount,
        minorCount,
        infoCount,
      },
      redactedFiles,
      warnings,
    }
  },

  /**
   * Generate an improvement plan from an audit report.
   * SAFE: Pure computation, no I/O.
   */
  generatePlan(report: AuditReport): ImprovementPlan {
    const planId = uuid()
    const tasks: ImprovementTask[] = []

    for (const check of report.checks) {
      for (const finding of check.findings) {
        if (finding.severity === 'critical' || finding.severity === 'major') {
          tasks.push({
            id: uuid().slice(0, 8),
            title: finding.title,
            description: finding.description,
            category: finding.category,
            severity: finding.severity,
            estimatedRisk: finding.severity === 'critical' ? 'high' : 'medium',
            filesToChange: finding.file ? [finding.file] : [],
            suggestedApproach: finding.recommendation,
            testPlan: `Verify fix: re-run self-audit and confirm finding is resolved. Run npm test.`,
            relatedFindings: [finding.id],
          })
        }
      }
    }

    // Sort by severity (critical first)
    tasks.sort((a, b) => {
      const sev = { critical: 0, major: 1, minor: 2, info: 3 }
      return sev[a.severity] - sev[b.severity]
    })

    const summary = `${tasks.length} improvement tasks generated from ${report.summary.totalFindings} findings. ` +
      `${report.summary.criticalCount} critical, ${report.summary.majorCount} major issues to address.`

    const estimatedTotalRisk = tasks.some((t) => t.estimatedRisk === 'high')
      ? 'high'
      : tasks.some((t) => t.estimatedRisk === 'medium')
        ? 'medium'
        : 'low'

    return {
      planId,
      generatedAt: new Date().toISOString(),
      basedOnReportId: report.reportId,
      tasks,
      summary,
      estimatedTotalRisk,
    }
  },

  /**
   * Generate a patch proposal from an improvement plan.
   * SAFE: Pure computation. No files are modified. Approval state is 'pending'.
   */
  generatePatchProposal(plan: ImprovementPlan, report: AuditReport): PatchProposal {
    const proposalId = uuid()
    const allFiles = new Set<string>()
    for (const task of plan.tasks) {
      for (const f of task.filesToChange) {
        allFiles.add(f)
      }
    }

    const agentPrompt = generateAgentPrompt(report, plan)

    return {
      proposalId,
      generatedAt: new Date().toISOString(),
      basedOnPlanId: plan.planId,
      title: `Self-Audit Patch — ${new Date().toLocaleDateString()}`,
      description: `Patch addressing ${plan.tasks.length} tasks from self-audit report ${report.reportId}. Risk: ${plan.estimatedTotalRisk}.`,
      tasks: plan.tasks.slice(0, 10), // Top 10 tasks
      fileListToChange: Array.from(allFiles),
      riskEstimate: plan.estimatedTotalRisk,
      testPlan: '1. Run npm run verify:native\n2. Run npm run typecheck\n3. Run npm test\n4. Run npm run build\n5. Run self-audit again to confirm fixes',
      patchPreview: `This patch addresses ${plan.tasks.length} improvement tasks.\n\n` +
        plan.tasks.slice(0, 10).map((t, i) =>
          `${i + 1}. ${t.title} [${t.severity}] [risk: ${t.estimatedRisk}]\n   Files: ${t.filesToChange.join(', ') || 'N/A'}`
        ).join('\n\n') +
        `\n\n⚠️ NO AUTOMATIC PATCH APPLICATION. You must explicitly approve before any changes.`,
      approvalState: 'pending',
      agentPrompt,
    }
  },

  /**
   * Run full audit pipeline: audit → plan → patch proposal.
   * Returns all three results.
   */
  async runFullPipeline(request: AuditRequest): Promise<AuditResult> {
    try {
      const report = await this.runAudit(request)
      const plan = this.generatePlan(report)
      const patchProposal = this.generatePatchProposal(plan, report)

      return {
        success: true,
        report,
        plan,
        patchProposal,
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      logger.error(`Self-audit pipeline failed: ${msg}`)
      return {
        success: false,
        error: msg,
      }
    }
  },
}
