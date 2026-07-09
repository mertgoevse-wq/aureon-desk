import React, { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'xs' | 'sm' | 'md' | 'lg'
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md'
}: ModalProps): React.ReactElement | null {
  const overlayRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  const sizeClasses: Record<string, string> = {
    xs: 'max-w-[320px]',
    sm: 'max-w-[380px]',
    md: 'max-w-[460px]',
    lg: 'max-w-[560px]'
  }

  // Focus trap
  useEffect(() => {
    if (!isOpen) {
      // Reset mounted after exit animation completes
      if (mounted) {
        const timer = setTimeout(() => setMounted(false), 200)
        return () => clearTimeout(timer)
      }
      return
    }

    setMounted(true)

    // Save previously focused element
    const prevFocused = document.activeElement as HTMLElement

    // Trap focus inside modal
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

    // Auto-focus first focusable element
    const timer = setTimeout(() => {
      const first = contentRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      first?.focus()
    }, 80)

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') handleTab(e)
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      clearTimeout(timer)
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
      prevFocused?.focus()
    }
  }, [isOpen, onClose, mounted])

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose()
  }

  if (!isOpen && !mounted) return null

  return (
    <div
      ref={overlayRef}
      className={`fixed inset-0 z-[200] flex items-center justify-center bg-black/20 p-4 transition-opacity duration-200 ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={handleOverlayClick}
      aria-modal="true"
      role="dialog"
    >
      <div
        ref={contentRef}
        className={`w-full ${sizeClasses[size]} bg-[var(--ivory-bg)] rounded-[20px]
          border border-[var(--ivory-border)] shadow-[var(--shadow-xl)] ring-1 ring-black/5
          transition duration-200 ${
          isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        } max-h-[85vh] flex flex-col`}
      >
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--ivory-border)]/60 shrink-0">
            <h2 className="text-[15px] font-semibold text-[var(--ivory-text)]">{title}</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] hover:bg-[var(--ivory-surface)] transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ivory-accent)]/30"
              aria-label="Close dialog"
            >
              <X size={16} />
            </button>
          </div>
        )}
        <div className="px-5 py-4 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  )
}
