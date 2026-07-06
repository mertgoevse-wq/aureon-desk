import React, { useEffect, useState, useCallback } from 'react'
import { Check, AlertTriangle, X, Info } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
}

// Global toast state
let toastListeners: Array<(toast: Toast | null) => void> = []
let currentToast: Toast | null = null
let toastTimer: ReturnType<typeof setTimeout> | null = null

function notifyListeners(): void {
  toastListeners.forEach(fn => fn(currentToast))
}

export function showToast(type: ToastType, message: string, duration = 3000): void {
  if (toastTimer) clearTimeout(toastTimer)
  currentToast = { id: Date.now().toString(), type, message, duration }
  notifyListeners()

  toastTimer = setTimeout(() => {
    currentToast = null
    notifyListeners()
  }, duration)
}

const iconMap: Record<ToastType, React.ReactElement> = {
  success: <Check size={14} />,
  error: <AlertTriangle size={14} />,
  warning: <AlertTriangle size={14} />,
  info: <Info size={14} />
}

const colorMap: Record<ToastType, string> = {
  success: 'border-[var(--ivory-success)] bg-[var(--ivory-success-bg)] text-[var(--ivory-success)]',
  error: 'border-[var(--ivory-error)] bg-[var(--ivory-error-bg)] text-[var(--ivory-error)]',
  warning: 'border-[var(--ivory-warning)] bg-[var(--ivory-warning-bg)] text-[var(--ivory-warning)]',
  info: 'border-[var(--ivory-accent)] bg-[var(--ivory-bg)] text-[var(--ivory-text-2)]'
}

export function ToastContainer(): React.ReactElement | null {
  const [toast, setToast] = useState<Toast | null>(null)

  useEffect(() => {
    const handler = (t: Toast | null) => setToast(t)
    toastListeners.push(handler)
    return () => { toastListeners = toastListeners.filter(h => h !== handler) }
  }, [])

  const dismiss = useCallback(() => {
    if (toastTimer) clearTimeout(toastTimer)
    currentToast = null
    notifyListeners()
  }, [])

  if (!toast) return null

  return (
    <div className="fixed bottom-6 right-6 z-[100] animate-slide-in">
      <div className={`flex items-center gap-2 px-4 py-3 rounded-[var(--radius-lg)] border shadow-[var(--shadow-lg)] ${colorMap[toast.type]} min-w-[280px] max-w-[420px]`}>
        {iconMap[toast.type]}
        <span className="text-sm flex-1">{toast.message}</span>
        <button onClick={dismiss} className="p-0.5 rounded-[var(--radius-sm)] opacity-60 hover:opacity-100 transition-opacity" aria-label="Dismiss">
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
