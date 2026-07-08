import React, { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

interface DrawerProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  /** Max width of the drawer */
  width?: string
}

/**
 * Compact right-side slide-in panel.
 * Closes on ESC, click outside, and traps focus inside.
 * Does NOT block the page scroll like Modal.
 */
export function Drawer({
  isOpen,
  onClose,
  title,
  children,
  width = 'max-w-[420px]'
}: DrawerProps): React.ReactElement | null {
  const contentRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  // Mount/unmount with animation delay
  useEffect(() => {
    if (!isOpen) {
      if (mounted) {
        const timer = setTimeout(() => setMounted(false), 200)
        return () => clearTimeout(timer)
      }
      return
    }
    setMounted(true)
  }, [isOpen])

  // Focus trap & ESC close
  useEffect(() => {
    if (!isOpen) return

    const prevFocused = document.activeElement as HTMLElement

    const handleTab = (e: KeyboardEvent) => {
      if (!contentRef.current) return
      const focusable = contentRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    // Auto-focus first focusable element
    const timer = setTimeout(() => {
      const first = contentRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      first?.focus()
    }, 80)

    document.addEventListener('keydown', handleTab)
    document.addEventListener('keydown', handleEsc)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('keydown', handleTab)
      document.removeEventListener('keydown', handleEsc)
      prevFocused?.focus()
    }
  }, [isOpen, onClose])

  if (!isOpen && !mounted) return null

  return (
    <>
      {/* Semi-transparent overlay */}
      <div
        className={`fixed inset-0 z-[150] bg-black/15 transition-opacity duration-200 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        ref={contentRef}
        className={`fixed top-0 right-0 z-[160] h-full ${width} w-full bg-[var(--ivory-bg)] border-l border-[var(--ivory-border)] shadow-[var(--shadow-xl)] flex flex-col transition-transform duration-200 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Drawer'}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--ivory-border)]/60 shrink-0">
            <h2 className="text-[15px] font-semibold text-[var(--ivory-text)]">{title}</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface)] transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/30"
              aria-label="Close drawer"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {children}
        </div>

        {/* Footer slot — rendered via children, no dedicated slot needed */}
      </div>
    </>
  )
}
