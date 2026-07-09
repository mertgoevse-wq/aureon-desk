import React, { useState, useEffect, useCallback } from 'react'
import {
  Mic, Camera, Monitor, RefreshCw, AlertTriangle,
  CheckCircle, Circle, Play, Square, Info, Shield
} from 'lucide-react'
import {
  DEVICE_CATEGORIES,
  DEVICE_CATEGORY_LABELS,
  DEVICE_CATEGORY_DESCRIPTIONS,
  DEVICE_CATEGORY_KINDS,
  SAFETY_NOTICE,
  NO_REMOTE_NOTICE,
  DEFAULT_DEVICE_STATE,
  type DeviceCategory,
  type DeviceInputState,
  type PermissionState,
  type ScreenSource
} from '@shared/device-inputs'
import { SettingsSection, SettingsRow } from '../../components/settings/SettingsComponents'
import { Button } from '../../components/shared/Button'
import { Badge } from '../../components/shared/Badge'
import { useIpc } from '../../hooks/useIpc'

const PERMISSION_BADGE: Record<PermissionState, 'success' | 'warning' | 'error' | 'default'> = {
  granted: 'success',
  prompt: 'warning',
  denied: 'error',
  unavailable: 'default',
}

export function DeviceInputsPage(): React.ReactElement {
  const api = useIpc()
  const [deviceStates, setDeviceStates] = useState<Record<DeviceCategory, DeviceInputState>>(() => {
    const states = {} as Record<DeviceCategory, DeviceInputState>
    for (const cat of DEVICE_CATEGORIES) {
      states[cat] = { ...DEFAULT_DEVICE_STATE, category: cat, kind: DEVICE_CATEGORY_KINDS[cat] }
    }
    return states
  })
  const [screenSources, setScreenSources] = useState<ScreenSource[]>([])
  const [loadingSources, setLoadingSources] = useState(false)
  const [activePreview, setActivePreview] = useState<DeviceCategory | null>(null)
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null)
  const previewVideoRef = React.useRef<HTMLVideoElement>(null)

  // Cleanup preview on unmount
  useEffect(() => {
    return () => {
      if (previewStream) {
        previewStream.getTracks().forEach(t => t.stop())
      }
    }
  }, [previewStream])

  // Attach stream to video element
  useEffect(() => {
    if (previewVideoRef.current && previewStream) {
      previewVideoRef.current.srcObject = previewStream
    }
  }, [previewStream])

  const refreshDevices = useCallback(async (category: DeviceCategory) => {
    const kind = DEVICE_CATEGORY_KINDS[category]

    if (kind === 'screen') {
      setLoadingSources(true)
      try {
        const result = await api.deviceInputsListScreenSources({ types: ['screen', 'window'] })
        if (result.success) {
          setScreenSources(result.sources)
          setDeviceStates(prev => ({
            ...prev,
            [category]: {
              ...prev[category],
              availableDevices: result.sources.map((s: ScreenSource) => ({
                deviceId: s.id,
                kind: 'screen' as const,
                label: s.name,
                groupId: '',
              })),
              lastError: null,
            },
          }))
        } else {
          setDeviceStates(prev => ({
            ...prev,
            [category]: { ...prev[category], lastError: result.error || 'Failed to list screen sources' },
          }))
        }
      } catch {
        setDeviceStates(prev => ({
          ...prev,
          [category]: { ...prev[category], lastError: 'Screen capture unavailable — requires desktop app' },
        }))
      } finally {
        setLoadingSources(false)
      }
      return
    }

    // Camera / microphone via navigator.mediaDevices
    try {
      // First request permission to see device labels
      const constraints: MediaStreamConstraints = kind === 'audioinput'
        ? { audio: true }
        : { video: true }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      stream.getTracks().forEach(t => t.stop()) // Immediately stop — we just want labels

      const devices = await navigator.mediaDevices.enumerateDevices()
      const filtered = devices
        .filter(d => d.kind === kind && d.deviceId)
        .map(d => ({
          deviceId: d.deviceId,
          kind: kind,
          label: d.label || `${DEVICE_CATEGORY_LABELS[category]} (${d.deviceId.slice(0, 8)}...)`,
          groupId: d.groupId,
        }))

      setDeviceStates(prev => ({
        ...prev,
        [category]: {
          ...prev[category],
          permission: 'granted',
          availableDevices: filtered,
          lastError: null,
        },
      }))
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setDeviceStates(prev => ({
        ...prev,
        [category]: {
          ...prev[category],
          permission: msg.includes('denied') || msg.includes('NotAllowed') ? 'denied' : 'unavailable',
          availableDevices: [],
          lastError: msg,
        },
      }))
    }
  }, [api])

  const startPreview = useCallback(async (category: DeviceCategory) => {
    const state = deviceStates[category]
    if (!state.selectedDeviceId) return

    if (category === 'screen_capture') {
      setDeviceStates(prev => ({
        ...prev,
        [category]: { ...prev[category], isPreviewing: true, captureMode: 'preview' },
      }))
      setActivePreview(category)
      return
    }

    try {
      const constraints: MediaStreamConstraints = category === 'microphone'
        ? { audio: { deviceId: { exact: state.selectedDeviceId } } }
        : { video: { deviceId: { exact: state.selectedDeviceId } } }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)

      if (previewStream) {
        previewStream.getTracks().forEach(t => t.stop())
      }
      setPreviewStream(stream)
      setActivePreview(category)

      setDeviceStates(prev => ({
        ...prev,
        [category]: { ...prev[category], isPreviewing: true, captureMode: 'preview' },
      }))
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setDeviceStates(prev => ({
        ...prev,
        [category]: { ...prev[category], lastError: msg },
      }))
    }
  }, [deviceStates, previewStream])

  const stopPreview = useCallback((category: DeviceCategory) => {
    if (previewStream) {
      previewStream.getTracks().forEach(t => t.stop())
      setPreviewStream(null)
    }
    setActivePreview(null)
    setDeviceStates(prev => ({
      ...prev,
      [category]: { ...prev[category], isPreviewing: false, captureMode: 'disabled' },
    }))
  }, [previewStream])

  const selectDevice = useCallback((category: DeviceCategory, deviceId: string) => {
    // Stop any active preview first
    if (activePreview === category) {
      stopPreview(category)
    }
    setDeviceStates(prev => ({
      ...prev,
      [category]: { ...prev[category], selectedDeviceId: deviceId },
    }))
  }, [activePreview, stopPreview])

  return (
    <div className="space-y-6" data-testid="device-inputs-page">
      {/* Safety Notice */}
      <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 flex items-start gap-3">
        <Shield size={18} className="text-amber-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-[13px] font-semibold text-amber-800 mb-1">Safety First</p>
          <p className="text-[12px] text-amber-700 leading-relaxed">{SAFETY_NOTICE}</p>
        </div>
      </div>

      {/* No Remote Notice */}
      <div className="p-3 rounded-xl border border-[var(--ivory-border)]/60 bg-[var(--ivory-surface)] flex items-start gap-2.5">
        <Info size={14} className="text-[var(--ivory-text-3)] mt-0.5 shrink-0" />
        <p className="text-[12px] text-[var(--ivory-text-2)] leading-relaxed">{NO_REMOTE_NOTICE}</p>
      </div>

      {/* Device Categories */}
      {DEVICE_CATEGORIES.map(category => {
        const state = deviceStates[category]
        const label = DEVICE_CATEGORY_LABELS[category]
        const description = DEVICE_CATEGORY_DESCRIPTIONS[category]
        const icon = category === 'microphone' ? <Mic size={18} />
          : category === 'camera' ? <Camera size={18} />
          : <Monitor size={18} />

        return (
          <SettingsSection key={category} title={label} description={description}>
            {/* Status Row */}
            <SettingsRow label="Permission" description="Current access state for this device">
              <div className="flex items-center gap-2">
                <Badge variant={PERMISSION_BADGE[state.permission]}>
                  {state.permission === 'granted' ? 'Allowed' : state.permission === 'denied' ? 'Blocked' : state.permission === 'unavailable' ? 'Unavailable' : 'Ask to allow'}
                </Badge>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => refreshDevices(category)}
                  disabled={state.permission === 'unavailable'}
                >
                  <RefreshCw size={12} className="mr-1" />
                  Detect
                </Button>
              </div>
            </SettingsRow>

            {/* Device Selector */}
            {state.availableDevices.length > 0 && (
              <SettingsRow label="Device" description="Select input device">
                <select
                  className="text-[12px] border border-[var(--ivory-border)] rounded-lg px-2.5 py-1.5 bg-[var(--ivory-elevated)] text-[var(--ivory-text)] min-w-[180px]"
                  value={state.selectedDeviceId || ''}
                  onChange={e => selectDevice(category, e.target.value)}
                >
                  <option value="">-- Choose device --</option>
                  {state.availableDevices.map(d => (
                    <option key={d.deviceId} value={d.deviceId}>{d.label}</option>
                  ))}
                </select>
              </SettingsRow>
            )}

            {/* Screen Sources Grid */}
            {category === 'screen_capture' && screenSources.length > 0 && (
              <div className="px-5 py-3">
                <div className="grid grid-cols-3 gap-3">
                  {screenSources.map(source => {
                    const isSelected = state.selectedDeviceId === source.id
                    return (
                      <button
                        key={source.id}
                        type="button"
                        onClick={() => selectDevice(category, source.id)}
                        className={`relative rounded-xl border-2 overflow-hidden transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[var(--ivory-accent)] ring-2 ring-[var(--ivory-accent)]/20'
                            : 'border-[var(--ivory-border)]/50 hover:border-[var(--ivory-border)]'
                        }`}
                      >
                        <img
                          src={source.thumbnail}
                          alt={source.name}
                          className="w-full h-24 object-cover"
                          draggable={false}
                        />
                        <div className="px-2 py-1.5 bg-[var(--ivory-elevated)]">
                          <span className="text-[10px] text-[var(--ivory-text-2)] truncate block">{source.name}</span>
                        </div>
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[var(--ivory-accent)] flex items-center justify-center">
                            <CheckCircle size={12} className="text-white" />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* No devices found */}
            {state.availableDevices.length === 0 && state.permission !== 'unavailable' && (
              <div className="px-5 py-3 text-[12px] text-[var(--ivory-text-3)] italic">
                No {label.toLowerCase()} devices detected. Click &quot;Detect&quot; to scan.
              </div>
            )}

            {/* Preview Controls */}
            <SettingsRow label="Preview" description="Test selected device locally">
              <div className="flex items-center gap-2">
                {state.isPreviewing ? (
                  <Button variant="danger" size="sm" onClick={() => stopPreview(category)}>
                    <Square size={12} className="mr-1" /> Stop
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => startPreview(category)}
                    disabled={!state.selectedDeviceId || state.permission === 'denied'}
                  >
                    <Play size={12} className="mr-1" /> Preview
                  </Button>
                )}
              </div>
            </SettingsRow>

            {/* Error message */}
            {state.lastError && (
              <div className="px-5 py-2 flex items-start gap-2 text-[11px] text-red-600">
                <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                <span className="truncate">{state.lastError}</span>
              </div>
            )}
          </SettingsSection>
        )
      })}

      {/* Live Preview Panel */}
      {activePreview && (
        <div className="rounded-2xl border border-[var(--ivory-border)] bg-[var(--ivory-elevated)] overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--ivory-border)]/60 flex items-center justify-between">
            <span className="text-[13px] font-semibold text-[var(--ivory-text)]">
              {DEVICE_CATEGORY_LABELS[activePreview]} Preview
            </span>
            <Button variant="secondary" size="sm" onClick={() => stopPreview(activePreview)}>
              <Square size={12} className="mr-1" /> Stop Preview
            </Button>
          </div>
          <div className="p-4 flex items-center justify-center bg-black/5 min-h-[200px]">
            {activePreview === 'screen_capture' && deviceStates.screen_capture.selectedDeviceId ? (
              <div className="text-center text-[12px] text-[var(--ivory-text-2)]">
                <Monitor size={32} className="mx-auto mb-2 opacity-40" />
                Screen capture preview — selected source ready
              </div>
            ) : (
              <video
                ref={previewVideoRef}
                autoPlay
                muted
                playsInline
                className="max-w-full max-h-[300px] rounded-xl"
                style={{ transform: activePreview === 'camera' ? 'scaleX(-1)' : 'none' }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
