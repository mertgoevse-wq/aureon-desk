/**
 * DropZone — Reusable drag-and-drop wrapper component.
 *
 * Usage:
 * <DropZone onFilesDropped={handleFiles} disabled={isStreaming}>
 *   <YourComposerOrPanel />
 * </DropZone>
 *
 * Handles:
 * - Visual feedback on drag-over (highlighted border)
 * - File path extraction from Electron's drag events
 * - Disabled state
 */
import React, { useState, useCallback } from 'react'

interface DropZoneProps {
  onFilesDropped: (filePaths: string[]) => void
  children: React.ReactNode
  disabled?: boolean
  className?: string
}

export function DropZone({ onFilesDropped, children, disabled = false, className = '' }: DropZoneProps): React.ReactElement {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragOver(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    if (disabled) return

    const filePaths: string[] = []

    // Electron provides file paths in dataTransfer.files
    if (e.dataTransfer.files.length > 0) {
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        const file = e.dataTransfer.files[i] as any
        // Electron adds a `path` property to the File object
        if (file.path) {
          filePaths.push(file.path)
        }
      }
    }

    if (filePaths.length > 0) {
      onFilesDropped(filePaths)
    }
  }, [disabled, onFilesDropped])

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative ${className}`}
    >
      {/* Drop overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-50 rounded-[22px] border-2 border-dashed border-[var(--ivory-accent)] bg-[var(--ivory-accent-light)]/30 pointer-events-none flex items-center justify-center" data-testid="drop-zone-overlay">
          <div className="bg-[var(--ivory-elevated)] rounded-2xl px-6 py-4 shadow-[var(--shadow-lg)] text-center">
            <p className="text-[14px] font-semibold text-[var(--ivory-accent)]">
              Drop files to attach
            </p>
            <p className="text-[11px] text-[var(--ivory-text-3)] mt-1">
              Images, code, documents, and ZIPs supported
            </p>
          </div>
        </div>
      )}

      {children}
    </div>
  )
}
