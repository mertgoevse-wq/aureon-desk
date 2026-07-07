import React, { Component } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorBoundaryProps {
  children: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full w-full bg-[var(--ivory-bg)] px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--ivory-error-bg)] flex items-center justify-center mb-5 shadow-[0_2px_12px_rgba(184,69,60,0.12)]">
            <AlertTriangle size={28} className="text-[var(--ivory-error)]" strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-semibold display-text text-[var(--ivory-text)] mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-[var(--ivory-text-3)] max-w-md mb-4 leading-relaxed">
            An unexpected error occurred. Your data is safe — you can reload to recover.
          </p>
          {this.state.error && (
            <pre className="max-w-lg max-h-32 overflow-auto text-[11px] font-mono text-[var(--ivory-error)] bg-[var(--ivory-error-bg)] p-3 rounded-[var(--radius-md)] border border-[var(--ivory-error)]/20 mb-4 text-left whitespace-pre-wrap break-all">
              {this.state.error.message}
            </pre>
          )}
          <div className="flex gap-3">
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] bg-[var(--ivory-accent)] text-white hover:bg-[var(--ivory-accent-hover)] text-sm font-medium transition-colors"
            >
              <RefreshCw size={14} />
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] bg-[var(--ivory-surface)] text-[var(--ivory-text-2)] hover:bg-[var(--ivory-surface-2)] border border-[var(--ivory-border)] text-sm font-medium transition-colors"
            >
              Reload App
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
