import React from 'react'
import { PanelRightClose, PanelRightOpen, Wrench } from 'lucide-react'
import { useUIStore } from '../stores/uiStore'

export function RightInspector(): React.ReactElement {
  const { inspectorOpen, toggleInspector, inspectorWidth } = useUIStore()

  if (!inspectorOpen) {
    return (
      <div className="flex flex-col items-center w-10 h-full border-l border-[var(--ivory-border)] bg-[var(--ivory-surface)] py-3">
        <button
          onClick={toggleInspector}
          className="p-1.5 rounded-[var(--radius-md)] text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)] transition-colors"
          title="Open Inspector"
        >
          <PanelRightOpen size={16} />
        </button>
      </div>
    )
  }

  return (
    <div
      className="flex flex-col h-full border-l border-[var(--ivory-border)] bg-[var(--ivory-surface)]"
      style={{ width: inspectorWidth }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--ivory-border)]">
        <h2 className="text-sm font-semibold display-text text-[var(--ivory-text)]">
          Inspector
        </h2>
        <button
          onClick={toggleInspector}
          className="p-1.5 rounded-[var(--radius-md)] text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface-2)] transition-colors"
        >
          <PanelRightClose size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Wrench size={32} className="text-[var(--ivory-text-3)] mb-3" strokeWidth={1.5} />
          <p className="text-sm text-[var(--ivory-text-2)] font-medium mb-1">
            Tool Transcript
          </p>
          <p className="text-xs text-[var(--ivory-text-3)] max-w-[200px]">
            Tool calls and responses will appear here during conversations.
          </p>
        </div>
      </div>
    </div>
  )
}
