/**
 * AttachmentChip — Renders a single attachment with file type icon,
 * name, size, safety status, and context toggle.
 *
 * States:
 * - scanning: pulsing skeleton
 * - safe: green check, context toggle available
 * - warning: amber warning, context toggle available
 * - blocked: red X, no context toggle, remove button
 *
 * Special behaviors:
 * - Images show thumbnail
 * - ZIPs show "Inspect" button
 * - Large files show size warning
 */
import React from 'react'
import {
  FileText, Image, Archive, AlertTriangle, X, Eye, CheckCircle,
  ShieldCheck, ShieldAlert, ShieldOff,
} from 'lucide-react'
import type { AttachmentFile } from '@shared/attachments'
import { formatFileSize, getMimeLabel } from '@shared/attachments'

interface AttachmentChipProps {
  attachment: AttachmentFile
  onRemove: (id: string) => void
  onToggleContext: (id: string) => void
  onInspectZip?: (id: string) => void
}

export function AttachmentChip({ attachment, onRemove, onToggleContext, onInspectZip }: AttachmentChipProps): React.ReactElement {
  const { id, name, sizeLabel, mimeType, thumbnailBase64, status, statusMessage, isZip, isIncludedInContext } = attachment

  const isImage = mimeType.startsWith('image/')
  const typeLabel = getMimeLabel(mimeType)

  const statusColors = {
    scanning: 'border-[var(--ivory-border)] bg-[var(--ivory-surface)]',
    safe: 'border-emerald-200/60 bg-emerald-50/40',
    warning: 'border-amber-200/60 bg-amber-50/40',
    blocked: 'border-red-200/60 bg-red-50/40',
  }

  const statusIcons = {
    scanning: <div className="w-4 h-4 rounded-full border-2 border-[var(--ivory-border)] border-t-[var(--ivory-accent)] animate-spin" />,
    safe: <CheckCircle size={14} className="text-emerald-600" />,
    warning: <AlertTriangle size={14} className="text-amber-600" />,
    blocked: <X size={14} className="text-red-600" />,
  }

  const statusLabels = {
    scanning: 'Scanning...',
    safe: 'Safe',
    warning: 'Warning',
    blocked: 'Blocked',
  }

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border ${status === 'scanning' ? 'animate-pulse' : ''} ${statusColors[status]} max-w-[320px] group relative`}
      data-testid={`attachment-chip-${id}`}
    >
      {/* File icon or thumbnail */}
      <div className="shrink-0 relative">
        {thumbnailBase64 ? (
          <img
            src={thumbnailBase64}
            alt={name}
            className="w-10 h-10 rounded-lg object-cover border border-[var(--ivory-border)]"
          />
        ) : (
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            isImage ? 'bg-purple-100 text-purple-600' :
            isZip ? 'bg-blue-100 text-blue-600' :
            'bg-[var(--ivory-surface)] text-[var(--ivory-text-3)]'
          }`}>
            {isImage ? <Image size={18} /> :
             isZip ? <Archive size={18} /> :
             <FileText size={18} />}
          </div>
        )}
      </div>

      {/* File info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] font-semibold text-[var(--ivory-text)] truncate">{name}</span>
          {statusIcons[status]}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[var(--ivory-text-3)]">{typeLabel}</span>
          {sizeLabel && <span className="text-[10px] text-[var(--ivory-text-3)]">{sizeLabel}</span>}
        </div>
      </div>

      {/* Actions */}
      <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Context toggle (only for safe/warning files) */}
        {status !== 'blocked' && (
          <button
            type="button"
            onClick={() => onToggleContext(id)}
            className="p-1 rounded-md hover:bg-[var(--ivory-elevated)] transition-colors cursor-pointer"
            title={isIncludedInContext ? 'Remove from AI context' : 'Include in AI context'}
          >
            {isIncludedInContext ? (
              <ShieldCheck size={14} className="text-emerald-600" />
            ) : (
              <ShieldAlert size={14} className="text-[var(--ivory-text-3)]" />
            )}
          </button>
        )}

        {/* ZIP inspect button */}
        {isZip && onInspectZip && (
          <button
            type="button"
            onClick={() => onInspectZip(id)}
            className="p-1 rounded-md hover:bg-[var(--ivory-elevated)] transition-colors cursor-pointer"
            title="Inspect ZIP contents"
          >
            <Eye size={14} className="text-blue-600" />
          </button>
        )}

        {/* Remove button */}
        <button
          type="button"
          onClick={() => onRemove(id)}
          className="p-1 rounded-md hover:bg-red-100 transition-colors cursor-pointer"
          title="Remove attachment"
        >
          <X size={14} className="text-red-500" />
        </button>
      </div>

      {/* Status message tooltip */}
      {statusMessage && (
        <div className="absolute -bottom-8 left-0 right-0 hidden group-hover:block z-10">
          <div className="bg-[var(--ivory-elevated)] border border-[var(--ivory-border)] rounded-lg px-3 py-1.5 shadow-[var(--shadow-md)] text-[10px] text-[var(--ivory-text-2)] leading-relaxed whitespace-normal max-w-[280px]">
            {statusMessage}
          </div>
        </div>
      )}
    </div>
  )
}
