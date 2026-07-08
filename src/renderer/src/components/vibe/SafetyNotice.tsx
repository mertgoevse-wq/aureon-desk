import React from 'react'
import { AlertTriangle, ShieldCheck, Terminal, FileText, FolderOpen, Globe } from 'lucide-react'

interface SafetyNoticeProps {
  type: 'file_write' | 'shell_command' | 'remote_context' | 'general'
  targetPath?: string
  description?: string
}

/**
 * Safety gate notice — shown before any potentially dangerous action.
 * Does NOT auto-execute anything. Always requires explicit user action.
 */
export function SafetyNotice({ type, targetPath, description }: SafetyNoticeProps): React.ReactElement {
  const config = {
    file_write: {
      icon: <FileText size={15} />,
      title: 'File Write Confirmation',
      color: 'amber',
      body: (
        <>
          <p className="text-[11px] text-amber-800 leading-relaxed">
            This action will <strong>write files</strong> to your computer.{' '}
            Always review what will be created before confirming.
          </p>
          {targetPath && (
            <code className="block mt-2 px-2.5 py-1.5 rounded-lg bg-amber-100/80 border border-amber-200 text-[10px] font-mono text-amber-900 break-all select-all">
              📁 {targetPath}
            </code>
          )}
        </>
      )
    },
    shell_command: {
      icon: <Terminal size={15} />,
      title: 'Shell Command Confirmation',
      color: 'rose',
      body: (
        <>
          <p className="text-[11px] text-rose-800 leading-relaxed">
            This action runs a <strong>terminal command</strong> on your system.{' '}
            Commands can install packages, modify files, or start servers.
          </p>
          {description && (
            <code className="block mt-2 px-2.5 py-1.5 rounded-lg bg-rose-100/80 border border-rose-200 text-[10px] font-mono text-rose-900 break-all select-all">
              {description}
            </code>
          )}
        </>
      )
    },
    remote_context: {
      icon: <Globe size={15} />,
      title: 'Remote Provider Notice',
      color: 'blue',
      body: (
        <>
          <p className="text-[11px] text-blue-800 leading-relaxed">
            Your chat content and referenced files will be <strong>sent to a remote AI provider</strong>.
            Sensitive files (.env, credentials, secrets) are automatically excluded.
          </p>
          <p className="text-[10px] text-blue-600 mt-1.5">
            🔒 API keys, passwords, and personal data are never included in uploaded context.
          </p>
        </>
      )
    },
    general: {
      icon: <ShieldCheck size={15} />,
      title: 'Safety Check',
      color: 'emerald',
      body: (
        <p className="text-[11px] text-emerald-800 leading-relaxed">
          Aureon Desk is designed with safety in mind. No actions run automatically —
          you always confirm file writes, commands, and remote uploads.
        </p>
      )
    }
  }

  const c = config[type]
  const colorMap: Record<string, string> = {
    amber: 'bg-amber-50/80 border-amber-200/60',
    rose: 'bg-rose-50/80 border-rose-200/60',
    blue: 'bg-blue-50/80 border-blue-200/60',
    emerald: 'bg-emerald-50/80 border-emerald-200/60'
  }
  const iconColorMap: Record<string, string> = {
    amber: 'text-amber-600',
    rose: 'text-rose-600',
    blue: 'text-blue-600',
    emerald: 'text-emerald-600'
  }

  return (
    <div className={`rounded-2xl border ${colorMap[c.color]} p-3.5 shadow-[var(--shadow-xs)]`} data-testid="safety-notice">
      <div className="flex items-start gap-2.5">
        <span className={`shrink-0 mt-0.5 ${iconColorMap[c.color]}`}>{c.icon}</span>
        <div>
          <h4 className="text-[12px] font-bold text-[var(--ivory-text)] mb-1">{c.title}</h4>
          {c.body}
        </div>
      </div>
    </div>
  )
}
