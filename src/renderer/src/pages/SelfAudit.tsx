import React, { useCallback, useMemo, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clipboard,
  ClipboardCheck,
  Code2,
  FileText,
  MessageSquare,
  RefreshCw,
  ScanLine,
  Search,
  Shield,
  XCircle,
  Info,
  Download,
  Eye,
  EyeOff,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useIpc } from '../hooks/useIpc'
import { Button } from '../components/shared/Button'
import { Badge } from '../components/shared/Badge'
import type {
  AuditCategory,
  AuditFinding,
  AuditMode,
  AuditReport,
  CategoryCheckResult,
  ImprovementPlan,
  PatchApprovalState,
  PatchProposal,
} from '@shared/self-audit'
import {
  AUDIT_CATEGORIES,
  AUDIT_CATEGORY_LABELS,
  AUDIT_CATEGORY_DESCRIPTIONS,
  AUDIT_MODE_LABELS,
  AUDIT_MODE_DESCRIPTIONS,
  SEVERITY_LABELS,
} from '@shared/self-audit'

// ---- Icons ----

const CATEGORY_ICONS: Record<AuditCategory, React.ReactElement> = {
  critical_issues: <AlertTriangle size={15} />,
  dead_buttons: <XCircle size={15} />,
  livepreview_health: <Eye size={15} />,
  studio_health: <Code2 size={15} />,
  provider_health: <Shield size={15} />,
  mcp_safety: <Shield size={15} />,
  ui_clutter: <EyeOff size={15} />,
  performance: <RefreshCw size={15} />,
  docs: <FileText size={15} />,
  dead_code: <Search size={15} />,
  security_secrets: <Shield size={15} />,
  build_test_health: <CheckCircle size={15} />,
}

const STATUS_ICONS: Record<string, React.ReactElement> = {
  pass: <CheckCircle size={14} className="text-emerald-500" />,
  warn: <AlertTriangle size={14} className="text-amber-500" />,
  fail: <XCircle size={14} className="text-red-500" />,
  skipped: <Info size={14} className="text-[var(--ivory-text-3)]" />,
}

const STATUS_BADGE: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  pass: 'success',
  warn: 'warning',
  fail: 'error',
  skipped: 'default',
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'text-red-600 bg-red-50 border-red-200',
  major: 'text-amber-600 bg-amber-50 border-amber-200',
  minor: 'text-blue-600 bg-blue-50 border-blue-200',
  info: 'text-[var(--ivory-text-3)] bg-[var(--ivory-surface-2)] border-[var(--ivory-border)]',
}

// ---- Component ----

export function SelfAudit(): React.ReactElement {
  const navigate = useNavigate()
  const api = useIpc()

  const [mode, setMode] = useState<AuditMode>('local_only')
  const [running, setRunning] = useState(false)
  const [report, setReport] = useState<AuditReport | null>(null)
  const [plan, setPlan] = useState<ImprovementPlan | null>(null)
  const [patchProposal, setPatchProposal] = useState<PatchProposal | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<AuditCategory>>(new Set())
  const [showPlan, setShowPlan] = useState(false)
  const [showPatch, setShowPatch] = useState(false)
  const [patchApproval, setPatchApproval] = useState<PatchApprovalState>('pending')
  const [copiedPrompt, setCopiedPrompt] = useState(false)
  const [activeTab, setActiveTab] = useState<'results' | 'plan' | 'patch'>('results')

  const toggleCategory = useCallback((category: AuditCategory) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }, [])

  const runAudit = useCallback(async () => {
    setRunning(true)
    setError(null)
    setReport(null)
    setPlan(null)
    setPatchProposal(null)
    setShowPlan(false)
    setShowPatch(false)
    setPatchApproval('pending')
    setCopiedPrompt(false)
    setActiveTab('results')

    try {
      const result = await api.selfAuditRun({ mode })
      if (result.success && result.report) {
        setReport(result.report)
        if (result.plan) setPlan(result.plan)
        if (result.patchProposal) {
          setPatchProposal(result.patchProposal)
          setPatchApproval(result.patchProposal.approvalState)
        }
        // Auto-expand failed/warned categories
        const autoExpand = new Set<AuditCategory>()
        for (const check of result.report.checks) {
          if (check.status === 'fail' || check.status === 'warn') {
            autoExpand.add(check.category)
          }
        }
        setExpandedCategories(autoExpand)
      } else {
        setError(result.error || 'Audit failed with no report')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setRunning(false)
    }
  }, [mode, api])

  const handleGeneratePlan = useCallback(async () => {
    if (!report) return
    try {
      const result = await api.selfAuditGeneratePlan(report)
      if (result.success && result.plan) {
        setPlan(result.plan)
        setShowPlan(true)
        setActiveTab('plan')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }, [report, api])

  const handleGeneratePatch = useCallback(async () => {
    if (!plan || !report) return
    try {
      const result = await api.selfAuditGeneratePatch(plan, report)
      if (result.success && result.patchProposal) {
        setPatchProposal(result.patchProposal)
        setPatchApproval(result.patchProposal.approvalState)
        setShowPatch(true)
        setActiveTab('patch')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }, [plan, report, api])

  const handleCopyPrompt = useCallback(() => {
    if (!patchProposal) return
    navigator.clipboard.writeText(patchProposal.agentPrompt).then(() => {
      setCopiedPrompt(true)
      setTimeout(() => setCopiedPrompt(false), 2000)
    })
  }, [patchProposal])

  const handleSendToChat = useCallback(() => {
    if (!patchProposal) return
    navigate('/chat', { state: { prompt: patchProposal.agentPrompt } })
  }, [patchProposal, navigate])

  const handleOpenInCodeMode = useCallback(() => {
    if (!patchProposal) return
    // Store the agent prompt in sessionStorage for Code mode to pick up
    sessionStorage.setItem('self-audit-agent-prompt', patchProposal.agentPrompt)
    navigate('/preview')
  }, [patchProposal, navigate])

  const handleApprovePatch = useCallback(() => {
    setPatchApproval('approved')
    if (patchProposal) {
      setPatchProposal({ ...patchProposal, approvalState: 'approved' })
    }
  }, [patchProposal])

  const handleRejectPatch = useCallback(() => {
    setPatchApproval('rejected')
    if (patchProposal) {
      setPatchProposal({ ...patchProposal, approvalState: 'rejected' })
    }
  }, [patchProposal])

  const handleExportReport = useCallback(() => {
    if (!report) return
    const json = JSON.stringify({ report, plan, patchProposal }, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `aureon-self-audit-${report.reportId.slice(0, 8)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [report, plan, patchProposal])

  // Compute summary stats
  const summaryStats = useMemo(() => {
    if (!report) return null
    return {
      total: report.summary.totalCategories,
      passed: report.summary.passed,
      warned: report.summary.warned,
      failed: report.summary.failed,
      skipped: report.summary.skipped,
      findings: report.summary.totalFindings,
      critical: report.summary.criticalCount,
      major: report.summary.majorCount,
    }
  }, [report])

  return (
    <div className="h-full min-h-0 overflow-y-auto bg-[var(--ivory-bg)]" data-testid="self-audit-page">
      <div className="max-w-4xl mx-auto px-6 py-7 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-[20px] font-display font-semibold text-[var(--ivory-text)]">
            Self Audit
          </h1>
          <p className="text-[13px] text-[var(--ivory-text-2)] leading-relaxed">
            Inspect this project, detect issues, and generate improvement plans. All analysis is local — nothing is sent to remote providers.
          </p>
        </div>

        {/* Safety Notice */}
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3" data-testid="safety-notice">
          <Shield size={18} className="text-amber-600 mt-0.5 shrink-0" />
          <div className="text-[12px] text-amber-800 leading-relaxed">
            <strong>Safety Rules:</strong> No autonomous self-modification. No shell/file writes without your explicit approval.
            No secret files are included in prompts. No data is sent to remote providers.
            Patch proposals must be explicitly approved before any changes can be applied.
          </div>
        </div>

        {/* Audit Controls */}
        <div className="p-5 rounded-2xl bg-[var(--ivory-surface)] border border-[var(--ivory-border)] space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <ScanLine size={18} className="text-[var(--ivory-accent)]" />
              <span className="text-[14px] font-semibold text-[var(--ivory-text)]">Audit Controls</span>
            </div>
            {report && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleExportReport}
                data-testid="export-report-btn"
              >
                <Download size={14} />
                Export Report
              </Button>
            )}
          </div>

          {/* Mode Selection */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-[var(--ivory-text-3)] uppercase tracking-wider">
              Audit Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(AUDIT_MODE_LABELS) as [AuditMode, string][]).map(([m, label]) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  data-testid={`mode-${m}`}
                  className={`text-left p-3 rounded-xl border transition text-[12px] leading-relaxed ${
                    mode === m
                      ? 'border-[var(--ivory-accent)]/30 bg-[var(--ivory-accent-light)] text-[var(--ivory-text)]'
                      : 'border-[var(--ivory-border)] hover:border-[var(--ivory-border)]/80 text-[var(--ivory-text-2)]'
                  }`}
                >
                  <div className="font-semibold text-[12px]">{label}</div>
                  <div className="text-[11px] text-[var(--ivory-text-3)] mt-1">
                    {AUDIT_MODE_DESCRIPTIONS[m]}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Redaction Warning */}
          {mode === 'full' && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-[11px] text-red-700" data-testid="redaction-warning">
              ⚠️ <strong>Redaction active:</strong> Sensitive files (.env, *.db, logs/, node_modules/) are always excluded.
              Source file contents are read but NEVER sent to remote providers.
            </div>
          )}

          {/* Run Button */}
          <Button
            variant="primary"
            size="md"
            onClick={runAudit}
            disabled={running}
            loading={running}
            data-testid="run-audit-btn"
            className="w-full"
          >
            <ScanLine size={16} />
            {running ? 'Running Audit…' : 'Run Audit'}
          </Button>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-[12px] text-red-700" data-testid="audit-error">
              {error}
            </div>
          )}
        </div>

        {/* Summary Stats */}
        {summaryStats && (
          <div className="grid grid-cols-4 gap-3" data-testid="audit-summary">
            <div className="p-3 rounded-2xl bg-[var(--ivory-surface)] border border-[var(--ivory-border)] text-center">
              <div className="text-[24px] font-bold text-[var(--ivory-text)]">{summaryStats.total}</div>
              <div className="text-[10px] text-[var(--ivory-text-3)]">Categories</div>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
              <div className="text-[24px] font-bold text-emerald-700">{summaryStats.passed}</div>
              <div className="text-[10px] text-emerald-600">Passed</div>
            </div>
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-center">
              <div className="text-[24px] font-bold text-amber-700">{summaryStats.warned + summaryStats.failed}</div>
              <div className="text-[10px] text-amber-600">Issues</div>
            </div>
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-center">
              <div className="text-[24px] font-bold text-red-700">{summaryStats.critical}</div>
              <div className="text-[10px] text-red-600">Critical</div>
            </div>
          </div>
        )}

        {/* Tab Bar */}
        {report && (
          <div className="flex gap-1 p-1 rounded-2xl bg-[var(--ivory-surface-2)]" data-testid="audit-tabs">
            {(['results', 'plan', 'patch'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                data-testid={`tab-${tab}`}
                className={`flex-1 py-2 rounded-xl text-[12px] font-semibold transition ${
                  activeTab === tab
                    ? 'bg-white text-[var(--ivory-text)] shadow-sm'
                    : 'text-[var(--ivory-text-3)] hover:text-[var(--ivory-text-2)]'
                }`}
              >
                {tab === 'results' ? 'Results' : tab === 'plan' ? 'Improvement Plan' : 'Patch Proposal'}
              </button>
            ))}
          </div>
        )}

        {/* Results Tab */}
        {report && activeTab === 'results' && (
          <div className="space-y-3" data-testid="audit-results">
            {/* Category Checks */}
            {report.checks.map((check) => (
              <div
                key={check.category}
                className="rounded-2xl border bg-white overflow-hidden"
                data-testid={`check-${check.category}`}
              >
                {/* Category Header */}
                <button
                  type="button"
                  onClick={() => toggleCategory(check.category)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-[var(--ivory-surface-2)]/50 transition-colors"
                >
                  <span className="text-[var(--ivory-text-3)]">
                    {CATEGORY_ICONS[check.category]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-[var(--ivory-text)]">
                        {check.label}
                      </span>
                      <Badge variant={STATUS_BADGE[check.status]} size="sm">
                        {check.status}
                      </Badge>
                    </div>
                    <div className="text-[11px] text-[var(--ivory-text-3)] mt-0.5">
                      {check.summary} · {check.durationMs}ms
                    </div>
                  </div>
                  {expandedCategories.has(check.category) ? (
                    <ChevronDown size={16} className="text-[var(--ivory-text-3)]" />
                  ) : (
                    <ChevronRight size={16} className="text-[var(--ivory-text-3)]" />
                  )}
                </button>

                {/* Findings List */}
                {expandedCategories.has(check.category) && (
                  <div className="border-t border-[var(--ivory-border)] divide-y divide-[var(--ivory-border)]/50">
                    {check.findings.length === 0 ? (
                      <div className="p-4 text-[12px] text-[var(--ivory-text-3)] italic">
                        No findings.
                      </div>
                    ) : (
                      check.findings.map((finding) => (
                        <div key={finding.id} className="p-4 pl-10 space-y-2">
                          <div className="flex items-start gap-2">
                            <span
                              className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${SEVERITY_COLORS[finding.severity]}`}
                            >
                              {SEVERITY_LABELS[finding.severity]}
                            </span>
                            <span className="text-[13px] font-semibold text-[var(--ivory-text)]">
                              {finding.title}
                            </span>
                          </div>
                          <p className="text-[12px] text-[var(--ivory-text-2)] leading-relaxed">
                            {finding.description}
                          </p>
                          {finding.file && (
                            <div className="text-[11px] text-[var(--ivory-text-3)] font-mono">
                              📄 {finding.file}{finding.line ? `:${finding.line}` : ''}
                            </div>
                          )}
                          <div className="flex items-start gap-1.5 text-[12px] text-[var(--ivory-text-2)]">
                            <span className="shrink-0">💡</span>
                            <span>{finding.recommendation}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Generate Plan Button */}
            <Button
              variant="secondary"
              size="md"
              onClick={handleGeneratePlan}
              data-testid="generate-plan-btn"
            >
              <FileText size={16} />
              Generate Improvement Plan
            </Button>
          </div>
        )}

        {/* Plan Tab */}
        {activeTab === 'plan' && (
          <div className="space-y-4" data-testid="audit-plan">
            {plan ? (
              <>
                <div className="p-4 rounded-2xl bg-[var(--ivory-surface)] border border-[var(--ivory-border)] space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={plan.estimatedTotalRisk === 'high' ? 'error' : plan.estimatedTotalRisk === 'medium' ? 'warning' : 'success'}
                    >
                      Risk: {plan.estimatedTotalRisk}
                    </Badge>
                    <span className="text-[12px] text-[var(--ivory-text-2)]">{plan.tasks.length} tasks</span>
                  </div>
                  <p className="text-[13px] text-[var(--ivory-text)] leading-relaxed">{plan.summary}</p>
                </div>

                <div className="space-y-2">
                  {plan.tasks.map((task, i) => (
                    <div
                      key={task.id}
                      className="p-4 rounded-2xl bg-white border border-[var(--ivory-border)] space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-[var(--ivory-text-3)]">
                            #{i + 1}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${SEVERITY_COLORS[task.severity]}`}
                          >
                            {SEVERITY_LABELS[task.severity]}
                          </span>
                        </div>
                        <Badge
                          variant={task.estimatedRisk === 'high' ? 'error' : task.estimatedRisk === 'medium' ? 'warning' : 'success'}
                          size="sm"
                        >
                          {task.estimatedRisk} risk
                        </Badge>
                      </div>
                      <div className="text-[13px] font-semibold text-[var(--ivory-text)]">{task.title}</div>
                      <div className="text-[12px] text-[var(--ivory-text-2)]">{task.description}</div>
                      {task.filesToChange.length > 0 && (
                        <div className="text-[11px] text-[var(--ivory-text-3)]">
                          <span className="font-semibold">Files:</span>{' '}
                          {task.filesToChange.join(', ')}
                        </div>
                      )}
                      <div className="text-[11px] text-[var(--ivory-text-3)]">
                        <span className="font-semibold">Test plan:</span> {task.testPlan}
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  variant="secondary"
                  size="md"
                  onClick={handleGeneratePatch}
                  data-testid="generate-patch-btn"
                >
                  <Code2 size={16} />
                  Generate Patch Proposal
                </Button>
              </>
            ) : (
              <div className="p-8 text-center text-[var(--ivory-text-3)]">
                <FileText size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-[13px]">No improvement plan generated yet.</p>
                <p className="text-[12px] mt-1">Run an audit first, then click "Generate Improvement Plan".</p>
              </div>
            )}
          </div>
        )}

        {/* Patch Tab */}
        {activeTab === 'patch' && (
          <div className="space-y-4" data-testid="audit-patch">
            {patchProposal ? (
              <>
                {/* Patch Header */}
                <div className="p-4 rounded-2xl bg-[var(--ivory-surface)] border border-[var(--ivory-border)] space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[14px] font-semibold text-[var(--ivory-text)]">
                      {patchProposal.title}
                    </h3>
                    <Badge
                      variant={patchApproval === 'approved' ? 'success' : patchApproval === 'rejected' ? 'error' : 'default'}
                    >
                      {patchApproval}
                    </Badge>
                  </div>
                  <p className="text-[12px] text-[var(--ivory-text-2)]">{patchProposal.description}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant={patchProposal.riskEstimate === 'high' ? 'error' : patchProposal.riskEstimate === 'medium' ? 'warning' : 'success'}
                    >
                      Risk: {patchProposal.riskEstimate}
                    </Badge>
                    <span className="text-[11px] text-[var(--ivory-text-3)]">
                      {patchProposal.tasks.length} tasks · {patchProposal.fileListToChange.length} files
                    </span>
                  </div>
                </div>

                {/* File List */}
                <div className="p-4 rounded-2xl bg-white border border-[var(--ivory-border)] space-y-2">
                  <h4 className="text-[12px] font-semibold text-[var(--ivory-text)]">Files to Change</h4>
                  <div className="space-y-1">
                    {patchProposal.fileListToChange.map((f) => (
                      <div key={f} className="text-[12px] text-[var(--ivory-text-2)] font-mono bg-[var(--ivory-surface-2)] px-2 py-1 rounded-md">
                        {f}
                      </div>
                    ))}
                    {patchProposal.fileListToChange.length === 0 && (
                      <div className="text-[12px] text-[var(--ivory-text-3)] italic">No files identified.</div>
                    )}
                  </div>
                </div>

                {/* Test Plan */}
                <div className="p-4 rounded-2xl bg-white border border-[var(--ivory-border)] space-y-2">
                  <h4 className="text-[12px] font-semibold text-[var(--ivory-text)]">Test Plan</h4>
                  <pre className="text-[12px] text-[var(--ivory-text-2)] whitespace-pre-wrap font-mono bg-[var(--ivory-surface-2)] p-3 rounded-xl">
                    {patchProposal.testPlan}
                  </pre>
                </div>

                {/* Patch Preview */}
                <div className="p-4 rounded-2xl bg-white border border-[var(--ivory-border)] space-y-2">
                  <h4 className="text-[12px] font-semibold text-[var(--ivory-text)]">Patch Preview</h4>
                  <pre className="text-[11px] text-[var(--ivory-text-2)] whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto bg-[var(--ivory-surface-2)] p-3 rounded-xl">
                    {patchProposal.patchPreview}
                  </pre>
                </div>

                {/* Approval Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant={patchApproval === 'approved' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={handleApprovePatch}
                    disabled={patchApproval === 'approved'}
                    data-testid="approve-patch-btn"
                  >
                    <CheckCircle size={14} />
                    {patchApproval === 'approved' ? 'Approved' : 'Approve Patch Plan'}
                  </Button>
                  <Button
                    variant={patchApproval === 'rejected' ? 'danger' : 'secondary'}
                    size="sm"
                    onClick={handleRejectPatch}
                    disabled={patchApproval === 'rejected'}
                    data-testid="reject-patch-btn"
                  >
                    <XCircle size={14} />
                    {patchApproval === 'rejected' ? 'Rejected' : 'Reject'}
                  </Button>
                </div>

                {/* Agent Prompt */}
                <div className="p-4 rounded-2xl bg-white border border-[var(--ivory-border)] space-y-3">
                  <h4 className="text-[12px] font-semibold text-[var(--ivory-text)]">Generated Agent Prompt</h4>
                  <pre className="text-[11px] text-[var(--ivory-text-2)] whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto bg-[var(--ivory-surface-2)] p-3 rounded-xl font-mono">
                    {patchProposal.agentPrompt}
                  </pre>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleCopyPrompt}
                      data-testid="copy-prompt-btn"
                    >
                      {copiedPrompt ? <ClipboardCheck size={14} /> : <Clipboard size={14} />}
                      {copiedPrompt ? 'Copied!' : 'Copy Prompt'}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleSendToChat}
                      data-testid="send-to-chat-btn"
                    >
                      <MessageSquare size={14} />
                      Send to Chat
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleOpenInCodeMode}
                      data-testid="open-code-mode-btn"
                    >
                      <Code2 size={14} />
                      Open in Code Mode
                    </Button>
                  </div>
                </div>

                {/* Warning: No Auto-Apply */}
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-700 flex items-start gap-2" data-testid="no-auto-apply-warning">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  <span>
                    <strong>No automatic patch application.</strong> This plan must be explicitly approved and applied
                    by you or a future agent session. Aureon will never modify itself without your consent.
                  </span>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-[var(--ivory-text-3)]">
                <Code2 size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-[13px]">No patch proposal generated yet.</p>
                <p className="text-[12px] mt-1">Run an audit and generate an improvement plan first.</p>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!report && !running && !error && (
          <div className="p-12 text-center space-y-4" data-testid="audit-empty">
            <ScanLine size={48} className="mx-auto text-[var(--ivory-text-3)] opacity-30" />
            <div>
              <h3 className="text-[15px] font-semibold text-[var(--ivory-text)]">Ready to Audit</h3>
              <p className="text-[13px] text-[var(--ivory-text-2)] mt-1 max-w-md mx-auto">
                Select an audit mode and click "Run Audit" to inspect this project for issues,
                dead code, security concerns, and improvement opportunities.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
