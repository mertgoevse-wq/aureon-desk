import { ipcMain } from 'electron'
import { selfAuditService } from '../services/self-audit.service'
import { logger } from '../utils/logger'
import type { AuditRequest, AuditResult, AuditReport, ImprovementPlan } from '../../shared/self-audit'

export function registerSelfAuditIPC(): void {
  ipcMain.handle('self-audit:run', async (_e, request: AuditRequest): Promise<AuditResult> => {
    try {
      logger.info(`Self-audit requested in ${request.mode} mode`)
      const result = await selfAuditService.runFullPipeline(request)
      return result
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      logger.error(`self-audit:run failed: ${msg}`)
      return { success: false, error: msg }
    }
  })

  ipcMain.handle('self-audit:runAuditOnly', async (_e, request: AuditRequest) => {
    try {
      const report = await selfAuditService.runAudit(request)
      return { success: true, report }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      logger.error(`self-audit:runAuditOnly failed: ${msg}`)
      return { success: false, error: msg }
    }
  })

  ipcMain.handle('self-audit:generatePlan', async (_e, report: AuditReport) => {
    try {
      const plan = selfAuditService.generatePlan(report)
      return { success: true, plan }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return { success: false, error: msg }
    }
  })

  ipcMain.handle('self-audit:generatePatch', async (_e, plan: ImprovementPlan, report: AuditReport) => {
    try {
      const patch = selfAuditService.generatePatchProposal(plan, report)
      return { success: true, patchProposal: patch }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return { success: false, error: msg }
    }
  })

  logger.info('Self-Audit IPC handlers registered')
}
