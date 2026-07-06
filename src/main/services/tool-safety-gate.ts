import { v4 as uuid } from 'uuid'
import { getDb } from '../db/connection'
import { tools, toolCallLogs } from '../db/schema'
import { eq } from 'drizzle-orm'
import { logger } from '../utils/logger'
import { redactSecrets } from './log-redacter'
import type { ToolRow, SafetyCheckResult, ToolCallLog, ToolPermission } from '../../shared/types/tool'

/**
 * Tool Safety Gate — every tool call must pass through this gate.
 * Enforces: enabled, trusted, permission checks, destructive confirmation.
 * Unknown tools always blocked.
 */

const DESTRUCTIVE_PERMISSIONS: ToolPermission[] = [
  'file_write', 'shell_command', 'git', 'database', 'secrets'
]

const PERMISSION_DESCRIPTIONS: Record<ToolPermission, string> = {
  file_read: 'Read files from disk',
  file_write: 'Write/modify files on disk',
  shell_command: 'Execute shell commands',
  network: 'Make network requests',
  browser: 'Open and control browser',
  git: 'Perform git operations (push/pull/commit)',
  database: 'Read/write database records',
  clipboard: 'Read/write clipboard',
  secrets: 'Access stored credentials and secrets',
}

/** Redact secrets from input/output previews — delegates to unified redacter */
function redactForLog(text: string): string {
  return redactSecrets(text).slice(0, 200)
}

/** Check if tool has destructive permissions */
function hasDestructivePermissions(permissions: ToolPermission[]): boolean {
  return permissions.some(p => DESTRUCTIVE_PERMISSIONS.includes(p))
}

/** Build a dry-run preview for the tool call */
function buildDryRunPreview(
  tool: ToolRow,
  input: Record<string, unknown>
): string | null {
  switch (tool.name) {
    case 'file_search_mock':
      return `Would search for files matching "${input.pattern || '*'}" in ${input.path || 'current directory'}`
    case 'git_status_mock':
      return `Would check git status in repository at ${input.path || 'current directory'}`
    case 'project_summary_mock':
      return `Would generate project summary for ${input.projectPath || 'current project'}`
    default:
      return null
  }
}

/** Main safety check — returns whether the tool can be executed */
export function checkToolSafety(
  toolId: string,
  input: Record<string, unknown>
): SafetyCheckResult {
  const db = getDb()

  // 1. Check tool exists
  const tool = db.select().from(tools).where(eq(tools.id, toolId)).get() as ToolRow | undefined
  if (!tool) {
    return {
      allowed: false,
      reason: 'tool_unknown',
      message: 'Tool not found in registry',
      requiresConfirmation: false,
      dryRunPreview: null
    }
  }

  // 2. Check enabled
  if (!tool.is_enabled) {
    return {
      allowed: false,
      reason: 'tool_disabled',
      message: `Tool "${tool.name}" is disabled. Enable it in Tools settings.`,
      requiresConfirmation: false,
      dryRunPreview: null
    }
  }

  // 3. Check trusted for non-builtin tools
  if (tool.source !== 'builtin' && !tool.is_trusted) {
    return {
      allowed: false,
      reason: 'tool_untrusted',
      message: `Tool "${tool.name}" is not trusted. Imported tools must be explicitly trusted before use.`,
      requiresConfirmation: true,
      dryRunPreview: buildDryRunPreview(tool, input)
    }
  }

  // 4. Check destructive permissions
  const permissions: ToolPermission[] = tool.permissions
    ? JSON.parse(tool.permissions)
    : []

  if (hasDestructivePermissions(permissions)) {
    const destructive = permissions.filter(p => DESTRUCTIVE_PERMISSIONS.includes(p))
    return {
      allowed: true,
      reason: 'tool_destructive',
      message: `Tool "${tool.name}" requires destructive permissions: ${destructive.join(', ')}. Confirm to proceed.`,
      requiresConfirmation: true,
      dryRunPreview: buildDryRunPreview(tool, input)
    }
  }

  return {
    allowed: true,
    reason: 'all_checks_passed',
    message: 'All safety checks passed',
    requiresConfirmation: false,
    dryRunPreview: buildDryRunPreview(tool, input)
  }
}

/** Log a tool call attempt (approved, denied, blocked, error) */
export function logToolCall(params: {
  toolId: string
  toolName: string
  status: ToolCallLog['status']
  input: Record<string, unknown>
  output?: string
  error?: string
  permissionChecks?: string[]
}): string {
  const db = getDb()
  const id = uuid()
  const now = new Date().toISOString()

  db.insert(toolCallLogs).values({
    id,
    tool_id: params.toolId,
    tool_name: params.toolName,
    status: params.status,
    input_preview: redactForLog(JSON.stringify(params.input)),
    output_preview: params.output ? redactForLog(params.output) : null,
    permission_checks: params.permissionChecks ? JSON.stringify(params.permissionChecks) : null,
    error_message: params.error || null,
    created_at: now
  } as never).run()

  logger.info(`Tool call logged: ${params.toolName} → ${params.status} [${id}]`)
  return id
}

/** Get all call logs */
export function getCallLogs(toolId?: string, limit = 50): ToolCallLog[] {
  const db = getDb()
  if (toolId) {
    return db.select().from(toolCallLogs)
      .where(eq(toolCallLogs.tool_id, toolId))
      .all() as ToolCallLog[]
  }
  return db.select().from(toolCallLogs).all().slice(-limit) as ToolCallLog[]
}

export { PERMISSION_DESCRIPTIONS }
