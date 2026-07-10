/**
 * Vibeforge — Android/Phone Companion Settings Page
 *
 * Configure the local-network phone companion feature. This is a local-beta
 * UI + types pass: no real TCP/network layer is active yet.
 */

import React, { useState, useCallback } from 'react'
import {
  Smartphone, Shield, Info, RefreshCw, Copy, CheckCircle,
  QrCode, Trash2, Clock, AlertTriangle, KeyRound
} from 'lucide-react'
import { SettingsSection, SettingsRow, Toggle } from '../../components/settings/SettingsComponents'
import { Button } from '../../components/shared/Button'
import {
  DEFAULT_COMPANION_CONFIG,
  generatePairingCode,
  PERMISSION_LABELS,
} from '@shared/companion'
import type { CompanionCommandType, CompanionConfig } from '@shared/companion'

const ALL_COMMANDS: { id: CompanionCommandType; label: string }[] = [
  { id: 'sendPrompt', label: 'Send prompt' },
  { id: 'startBuild', label: 'Start build' },
  { id: 'requestPreview', label: 'Request preview' },
  { id: 'approveAction', label: 'Approve action' },
  { id: 'rejectAction', label: 'Reject action' },
  { id: 'getStatus', label: 'Get status' },
  { id: 'openProject', label: 'Open project' },
]

export function CompanionPage(): React.ReactElement {
  const [config, setConfig] = useState<CompanionConfig>(DEFAULT_COMPANION_CONFIG)
  const [pairingCode, setPairingCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const toggleEnabled = useCallback(() => {
    setConfig(prev => ({ ...prev, enabled: !prev.enabled }))
  }, [])

  const toggleCommand = useCallback((command: CompanionCommandType) => {
    setConfig(prev => {
      const allowed = new Set(prev.allowedCommands)
      if (allowed.has(command)) allowed.delete(command)
      else allowed.add(command)
      return { ...prev, allowedCommands: [...allowed] }
    })
  }, [])

  const generateCode = useCallback(() => {
    setPairingCode(generatePairingCode())
    setCopied(false)
  }, [])

  const copyCode = useCallback(() => {
    if (!pairingCode) return
    navigator.clipboard?.writeText(pairingCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [pairingCode])

  const revokeDevice = useCallback(() => {
    setConfig(prev => ({ ...prev, pairedDevice: undefined }))
  }, [])

  return (
    <div className="space-y-6" data-testid="companion-page">
      {/* Page Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--ivory-border)] bg-[var(--ivory-elevated)] text-[11px] font-semibold text-[var(--ivory-text-3)] mb-3 select-none">
          <Smartphone size={13} className="text-[var(--ivory-accent)]" />
          Phone Companion (Local Beta)
        </div>
        <h1 className="text-[28px] font-semibold tracking-tight text-[var(--ivory-text)] display-text">Android Companion</h1>
        <p className="mt-2 max-w-2xl text-xs leading-relaxed text-[var(--ivory-text-3)]">
          Pair your phone or tablet on the same local network to send prompts, request previews, and approve actions remotely.
        </p>
      </div>

      {/* Beta Notice */}
      <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 flex items-start gap-3">
        <AlertTriangle size={18} className="text-amber-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-[13px] font-semibold text-amber-800 mb-1">Local Beta</p>
          <p className="text-[12px] text-amber-700 leading-relaxed">
            The companion feature is UI + types only in this release. No real network connection is established yet. Pairing codes and device records are stored locally.
          </p>
        </div>
      </div>

      {/* Enable Companion */}
      <SettingsSection title="Companion Access" description="Turn the companion feature on or off.">
        <SettingsRow
          label="Enable Phone Companion"
          description="Allow phones on the same network to pair with this Vibeforge desktop instance."
          dataTestId="row-companion-enabled"
        >
          <Toggle checked={config.enabled} onChange={toggleEnabled} dataTestId="toggle-companion-enabled" />
        </SettingsRow>
      </SettingsSection>

      {config.enabled && (
        <>
          {/* Pairing */}
          <SettingsSection title="Pairing" description="Generate a code or QR data to pair a new device.">
            <div className="px-5 py-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex-1 p-3 rounded-xl bg-[var(--ivory-bg)] border border-[var(--ivory-border)] text-center tracking-[0.25em] text-[18px] font-mono text-[var(--ivory-text)]">
                  {pairingCode ?? '------'}
                </div>
                <Button variant="secondary" size="sm" onClick={generateCode} data-testid="generate-pairing-code">
                  <RefreshCw size={12} className="mr-1" /> Generate
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={copyCode}
                  disabled={!pairingCode}
                  data-testid="copy-pairing-code"
                >
                  {copied ? <CheckCircle size={12} className="mr-1" /> : <Copy size={12} className="mr-1" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
              <p className="text-[11px] text-[var(--ivory-text-3)] leading-relaxed">
                Open <span className="font-mono text-[var(--ivory-accent)]">/companion</span> on your phone and enter the 6-digit code. Codes expire after 5 minutes.
              </p>
            </div>
          </SettingsSection>

          {/* Allowed Commands */}
          <SettingsSection title="Allowed Commands" description="Choose what a paired phone is allowed to do.">
            {ALL_COMMANDS.map(cmd => (
              <SettingsRow
                key={cmd.id}
                label={cmd.label}
                dataTestId={`row-allow-${cmd.id}`}
              >
                <Toggle
                  checked={config.allowedCommands.includes(cmd.id)}
                  onChange={() => toggleCommand(cmd.id)}
                  dataTestId={`toggle-allow-${cmd.id}`}
                />
              </SettingsRow>
            ))}
          </SettingsSection>

          {/* Paired Device */}
          <SettingsSection title="Paired Device" description="Currently paired phone or tablet.">
            {config.pairedDevice ? (
              <div className="px-5 py-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--ivory-accent-light)] border border-[var(--ivory-accent)]/15 flex items-center justify-center text-[var(--ivory-accent)]">
                      <Smartphone size={18} />
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-[var(--ivory-text)]">{config.pairedDevice.name}</div>
                      <div className="text-[11px] text-[var(--ivory-text-3)] capitalize">{config.pairedDevice.platform} · {PERMISSION_LABELS[config.pairedDevice.permissionLevel]}</div>
                    </div>
                  </div>
                  <Button variant="danger" size="sm" onClick={revokeDevice} data-testid="revoke-companion-device">
                    <Trash2 size={12} className="mr-1" /> Revoke
                  </Button>
                </div>
                <div className="text-[10px] text-[var(--ivory-text-3)] flex items-center gap-1">
                  <Clock size={10} /> Last seen: {new Date(config.pairedDevice.lastSeen).toLocaleString()}
                </div>
              </div>
            ) : (
              <div className="px-5 py-4 text-[12px] text-[var(--ivory-text-3)] italic">
                No device paired yet. Generate a pairing code above to connect a phone.
              </div>
            )}
          </SettingsSection>

          {/* Security Rules */}
          <SettingsSection title="Security Rules" description="Hard limits enforced by the companion layer.">
            <div className="px-5 py-3 space-y-2">
              {[
                { icon: <Shield size={12} />, text: 'No remote shell execution without desktop approval' },
                { icon: <KeyRound size={12} />, text: 'No API key or provider changes from phone' },
                { icon: <Trash2 size={12} />, text: 'No file deletion from companion device' },
                { icon: <Clock size={12} />, text: 'Pairing codes expire after 5 minutes' },
              ].map((rule, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px] text-[var(--ivory-text-2)]">
                  <span className="text-[var(--ivory-accent)]">{rule.icon}</span>
                  {rule.text}
                </div>
              ))}
            </div>
          </SettingsSection>
        </>
      )}

      {!config.enabled && (
        <div className="p-4 rounded-2xl border border-[var(--ivory-border)] bg-[var(--ivory-surface)] flex items-start gap-3">
          <Info size={16} className="text-[var(--ivory-text-3)] mt-0.5 shrink-0" />
          <p className="text-[12px] text-[var(--ivory-text-2)] leading-relaxed">
            Enable the companion to generate pairing codes and manage allowed commands. The mobile view is available at <span className="font-mono text-[var(--ivory-accent)]">/companion</span>.
          </p>
        </div>
      )}
    </div>
  )
}
