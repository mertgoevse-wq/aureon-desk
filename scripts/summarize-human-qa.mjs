#!/usr/bin/env node
/**
 * Summarize the latest serious-human-QA result file.
 * Reads tests/e2e/artifacts/human-serious/human-qa-results.json and prints a
 * concise console summary + a markdown report.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const PROJECT_ROOT = resolve(__dirname, '..')
const RESULT_FILE = join(PROJECT_ROOT, 'tests/e2e/artifacts/human-serious/human-qa-results.json')
const REPORT_FILE = join(PROJECT_ROOT, 'tests/e2e/artifacts/human-serious/human-qa-report.md')

if (!existsSync(RESULT_FILE)) {
  console.error(`[summarize-human-qa] No result file at ${RESULT_FILE}`)
  console.error('[summarize-human-qa] Run npm run test:human:interactive first.')
  process.exit(1)
}

const result = JSON.parse(readFileSync(RESULT_FILE, 'utf8'))

const pass = result.flows.filter((f) => f.status === 'pass').length
const fail = result.flows.filter((f) => f.status === 'fail').length
const skipped = result.flows.filter((f) => f.status === 'skipped').length

console.log('\n=== Aureon Desk — Serious Human QA Summary ===\n')
console.log(`Commit:        ${result.commit} on ${result.branch}`)
console.log(`Date:          ${result.startedAt} → ${result.endedAt}`)
console.log(`Duration:      ${Math.round(result.durationMs / 1000)}s`)
console.log(`Page errors:   ${result.environment.pageErrors}`)
console.log(`Console errs:  ${result.environment.consoleErrors}`)
console.log('')
console.log(`Flows:         ${result.flows.length} total — ${pass} pass, ${fail} fail, ${skipped} skipped`)
console.log('')
console.log('Per-flow:')
for (const f of result.flows) {
  const quality = f.qualityScore != null ? ` q=${f.qualityScore}` : ''
  const shots = f.screenshots.length
  console.log(`  [${f.status.toUpperCase().padEnd(7)}] ${f.name.padEnd(60)} ${(f.durationMs / 1000).toFixed(1)}s${quality} shots=${shots}`)
}
console.log('')
console.log(`Critical issues: ${result.criticalIssues.length}`)
console.log(`Major issues:    ${result.majorIssues.length}`)
console.log(`Fixed:           ${result.fixedIssues.length}`)
console.log(`Blockers:        ${result.remainingBlockers.length}`)
console.log('')
const ready = result.criticalIssues.length === 0 && result.environment.pageErrors === 0
console.log(`Beta readiness: ${ready ? '✅ YES' : '❌ NO'}`)
console.log('')
console.log(`Report:     ${REPORT_FILE}`)
console.log(`Results:    ${RESULT_FILE}`)
console.log('')

// Re-emit the markdown report (it lives next to the JSON)
if (existsSync(REPORT_FILE)) {
  // Spec already wrote it — print path
  console.log(`(Markdown report was written by the spec; rerun npm run test:human:interactive to refresh.)`)
}
