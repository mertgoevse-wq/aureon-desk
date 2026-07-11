/**
 * Vibeforge — Companion Mobile View
 *
 * A mobile-first preview UI for the planned Vibeforge phone companion. This
 * view can be opened on a phone or tablet browser at /companion.
 *
 * Status: Local Beta — UI + types only. No real network/TCP layer yet.
 */

import React, { useState, useCallback } from 'react'
import {
  Smartphone, KeyRound, Send, Play, Image as ImageIcon, Activity,
  CheckCircle, AlertTriangle, Info, ChevronRight, RefreshCw
} from 'lucide-react'

type CompanionTab = 'prompt' | 'build' | 'status'

export function CompanionMobileView(): React.ReactElement {
  const [paired, setPaired] = useState(false)
  const [tab, setTab] = useState<CompanionTab>('prompt')
  const [pairingCode, setPairingCode] = useState('')
  const [prompt, setPrompt] = useState('')
  const [buildPrompt, setBuildPrompt] = useState('')
  const [status, setStatus] = useState({
    appPage: 'studio',
    buildInProgress: false,
    previewRunning: false,
  })
  const [toast, setToast] = useState<string | null>(null)

  const showToast = useCallback((message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 2500)
  }, [])

  const handlePair = useCallback(() => {
    if (pairingCode.length !== 6) {
      showToast('Enter the 6-digit pairing code shown on desktop.')
      return
    }
    setPaired(true)
    showToast('Prototype pairing preview enabled.')
    setTab('prompt')
  }, [pairingCode, showToast])

  const handleUnpair = useCallback(() => {
    setPaired(false)
    setPairingCode('')
  }, [])

  const handleSendPrompt = useCallback(() => {
    if (!prompt.trim()) return
    showToast('Prototype only: prompt was not sent.')
    setPrompt('')
  }, [prompt, showToast])

  const handleStartBuild = useCallback(() => {
    if (!buildPrompt.trim()) return
    showToast('Prototype only: build was not sent.')
    setBuildPrompt('')
    setStatus(prev => ({ ...prev, buildInProgress: true }))
    setTimeout(() => setStatus(prev => ({ ...prev, buildInProgress: false, previewRunning: true })), 3000)
  }, [buildPrompt, showToast])

  const handleRequestPreview = useCallback(() => {
    showToast('Prototype only: no desktop preview was requested.')
  }, [showToast])

  return (
    <div className="min-h-screen bg-[var(--ivory-bg)] text-[var(--ivory-text)] font-body" data-testid="companion-mobile-view">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[var(--ivory-elevated)]/90 backdrop-blur-xl border-b border-[var(--ivory-border)] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[var(--ivory-accent-light)] border border-[var(--ivory-accent)]/15 flex items-center justify-center text-[var(--ivory-accent)]">
              <Smartphone size={16} />
            </div>
            <div>
              <h1 className="text-[15px] font-semibold display-text">Vibeforge Companion</h1>
              <p className="text-[10px] text-[var(--ivory-text-3)]">{paired ? 'Prototype paired' : 'Prototype only'}</p>
            </div>
          </div>
          {paired && (
          <button
            type="button"
            onClick={handleUnpair}
            className="text-[10px] text-[var(--ivory-text-3)] hover:text-[var(--ivory-text)] cursor-pointer"
          >
            Unpair
          </button>
          )}
        </div>
      </header>

      {/* Tab bar */}
      {paired && (
        <nav className="flex items-center justify-around border-b border-[var(--ivory-border)] bg-[var(--ivory-elevated)]/50 px-2">
          {([
            { id: 'prompt', label: 'Prompt', icon: <Send size={14} /> },
            { id: 'build', label: 'Build', icon: <Play size={14} /> },
            { id: 'status', label: 'Status', icon: <Activity size={14} /> },
          ] as { id: CompanionTab; label: string; icon: React.ReactNode }[]).map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`flex-1 py-3 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                tab === item.id ? 'text-[var(--ivory-accent)] border-b-2 border-[var(--ivory-accent)]' : 'text-[var(--ivory-text-3)]'
              }`}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </nav>
      )}

      {/* Content */}
      <main className="p-4 space-y-4">
        {!paired && (
          <section className="space-y-4">
            <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 flex items-start gap-3">
              <AlertTriangle size={18} className="text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-[13px] font-semibold text-amber-800 mb-1">Local Beta</p>
                <p className="text-[12px] text-amber-700 leading-relaxed">
                  This is a preview UI. Real pairing, sync, and desktop control over the local network are not active yet.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-[var(--ivory-border)] bg-[var(--ivory-elevated)] space-y-3">
              <label className="block text-[12px] font-semibold text-[var(--ivory-text)]">Enter demo pairing code</label>
              <input
                type="text"
                maxLength={6}
                value={pairingCode}
                onChange={e => setPairingCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full text-center tracking-[0.5em] text-[22px] font-mono p-3 rounded-xl border border-[var(--ivory-border)] bg-[var(--ivory-bg)] text-[var(--ivory-text)] placeholder-[var(--ivory-text-3)]/40 focus:outline-none focus:border-[var(--ivory-accent)]/40"
              />
              <button
                type="button"
                onClick={handlePair}
                disabled={pairingCode.length !== 6}
                className="w-full py-3 rounded-xl bg-[var(--ivory-accent)] text-white hover:bg-[var(--ivory-accent-hover)] text-[13px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Preview paired state
              </button>
            </div>

            <div className="p-3 rounded-xl border border-[var(--ivory-border)] bg-[var(--ivory-surface)] flex items-start gap-2">
              <Info size={14} className="text-[var(--ivory-text-3)] mt-0.5 shrink-0" />
              <p className="text-[11px] text-[var(--ivory-text-2)] leading-relaxed">
                Find the demo 6-digit code in Vibeforge Desktop under Settings → Android Companion. It does not connect to the desktop yet.
              </p>
            </div>
          </section>
        )}

        {paired && tab === 'prompt' && (
          <section className="space-y-3">
            <h2 className="text-[14px] font-semibold text-[var(--ivory-text)]">Prompt handoff preview</h2>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Draft a prompt for the future desktop handoff..."
              rows={4}
              className="w-full p-3 rounded-xl border border-[var(--ivory-border)] bg-[var(--ivory-elevated)] text-[var(--ivory-text)] placeholder-[var(--ivory-text-3)]/60 focus:outline-none focus:border-[var(--ivory-accent)]/40 text-[13px] resize-none"
            />
            <button
              type="button"
              onClick={handleSendPrompt}
              disabled={!prompt.trim()}
              className="w-full py-3 rounded-xl bg-[var(--ivory-accent)] text-white hover:bg-[var(--ivory-accent-hover)] text-[13px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
            >
              <Send size={14} /> Preview prompt handoff
            </button>
          </section>
        )}

        {paired && tab === 'build' && (
          <section className="space-y-3">
            <h2 className="text-[14px] font-semibold text-[var(--ivory-text)]">Build request preview</h2>
            <textarea
              value={buildPrompt}
              onChange={e => setBuildPrompt(e.target.value)}
              placeholder="Draft the build request for the future companion..."
              rows={4}
              className="w-full p-3 rounded-xl border border-[var(--ivory-border)] bg-[var(--ivory-elevated)] text-[var(--ivory-text)] placeholder-[var(--ivory-text-3)]/60 focus:outline-none focus:border-[var(--ivory-accent)]/40 text-[13px] resize-none"
            />
            <button
              type="button"
              onClick={handleStartBuild}
              disabled={!buildPrompt.trim()}
              className="w-full py-3 rounded-xl bg-[var(--ivory-accent)] text-white hover:bg-[var(--ivory-accent-hover)] text-[13px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
            >
              <Play size={14} /> Preview build request
            </button>
          </section>
        )}

        {paired && tab === 'status' && (
          <section className="space-y-3">
            <h2 className="text-[14px] font-semibold text-[var(--ivory-text)]">Mock desktop status</h2>
            <div className="space-y-2">
              {[
                { label: 'Current page', value: status.appPage },
                { label: 'Build in progress', value: status.buildInProgress ? 'Yes' : 'No' },
                { label: 'Preview running', value: status.previewRunning ? 'Yes' : 'No' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between p-3 rounded-xl border border-[var(--ivory-border)] bg-[var(--ivory-elevated)]">
                  <span className="text-[12px] text-[var(--ivory-text-3)]">{item.label}</span>
                  <span className="text-[12px] font-semibold text-[var(--ivory-text)] capitalize">{item.value}</span>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={handleRequestPreview}
              className="w-full py-3 rounded-xl border border-[var(--ivory-border)] bg-[var(--ivory-elevated)] text-[var(--ivory-text)] hover:bg-[var(--ivory-surface)] text-[13px] font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <ImageIcon size={14} /> Preview request
            </button>
          </section>
        )}
      </main>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-[var(--ivory-text)] text-white text-[12px] font-semibold shadow-lg flex items-center gap-2 z-50">
          <CheckCircle size={14} /> {toast}
        </div>
      )}
    </div>
  )
}
