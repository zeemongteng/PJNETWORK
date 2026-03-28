'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  verifyBiometrics, triggerKillSwitch, getSessions,
  type AuthSession,
} from '@/lib/api'
import { Fingerprint, Skull, Shield, Heart, Thermometer, Brain } from 'lucide-react'

// ─── Biometric gauge ──────────────────────────────────────────────────────────

function Gauge({
  label, value, min, max, unit, warn, danger, icon
}: {
  label: string
  value: number
  min: number
  max: number
  unit: string
  warn: number   // value above which it turns orange
  danger: number // value above which it turns red
  icon: React.ReactNode
}) {
  const pct = Math.min(100, Math.max(0, (value - min) / (max - min) * 100))
  const colorClass = value >= danger ? 'text-destructive' : value >= warn ? 'text-warning' : 'text-success'
  const barClass = value >= danger ? 'bg-destructive' : value >= warn ? 'bg-warning' : 'bg-success'

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          {icon}
          <span className="font-mono text-xs uppercase tracking-wider">{label}</span>
        </div>
        <span className={`font-mono text-sm font-semibold ${colorClass}`}>
          {typeof value === 'number' ? (Number.isInteger(value) ? value : value.toFixed(2)) : value} {unit}
        </span>
      </div>
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between font-mono text-xs text-muted-foreground/50">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  )
}

// ─── Session card ────────────────────────────────────────────────────────────

function SessionCard({
  session,
  onKill,
}: {
  session: AuthSession
  onKill: (s: AuthSession) => void
}) {
  const statusColor = session.status === 'active'
    ? 'bg-success'
    : session.status === 'killed'
    ? 'bg-destructive'
    : 'bg-warning'

  return (
    <div className="border border-border rounded-lg p-3 flex flex-col gap-2">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className={`size-2 rounded-full ${statusColor}`} />
            <span className="font-mono text-sm font-medium text-foreground">{session.unit_id}</span>
          </div>
          <p className="font-mono text-xs text-muted-foreground mt-0.5">
            ID: {session.session_id.slice(0, 8)}… | CL-{session.clearance_level}
          </p>
        </div>
        <Badge
          variant={session.status === 'active' ? 'default' : 'destructive'}
          className="text-xs"
        >
          {session.status.toUpperCase()}
        </Badge>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Shield className="size-3 text-primary" />
          <span className="font-mono text-xs text-muted-foreground">
            Score: {(session.biometric_score * 100).toFixed(0)}%
          </span>
        </div>
        {session.status === 'active' && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onKill(session)}
            className="h-6 text-xs border-destructive/50 text-destructive hover:bg-destructive/10"
          >
            <Skull className="size-3" />
            Kill Switch
          </Button>
        )}
      </div>
      <p className="font-mono text-xs text-muted-foreground/60">
        {new Date(session.created_at).toLocaleTimeString()}
      </p>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  onLog: (msg: string, type?: 'info' | 'success' | 'warning' | 'error') => void
}

export function ActiveSkin({ onLog }: Props) {
  const [unitId, setUnitId] = useState('UNIT-ALPHA-7')
  const [pulse, setPulse] = useState(72)
  const [stress, setStress] = useState(0.15)
  const [temperature, setTemperature] = useState(36.8)
  const [sessions, setSessions] = useState<AuthSession[]>([])
  const [loading, setLoading] = useState(false)
  const [lastResult, setLastResult] = useState<string | null>(null)
  const [killConfirm, setKillConfirm] = useState<AuthSession | null>(null)

  // Simulate iris hash from unit_id
  const irisHash = (() => {
    let hash = 0
    for (let i = 0; i < unitId.length; i++) {
      hash = ((hash << 5) - hash) + unitId.charCodeAt(i)
      hash |= 0
    }
    // Build a deterministic 64-char hex string from the unit ID
    const base = Math.abs(hash).toString(16).padStart(8, '0')
    return (base.repeat(8)).slice(0, 64)
  })()

  const refreshSessions = useCallback(async () => {
    try {
      const res = await getSessions()
      setSessions(res.sessions)
    } catch {
      // offline
    }
  }, [])

  useEffect(() => {
    refreshSessions()
    const id = setInterval(refreshSessions, 6000)
    return () => clearInterval(id)
  }, [refreshSessions])

  const handleVerify = async () => {
    setLoading(true)
    onLog(`Initiating biometric scan for ${unitId}…`, 'info')
    onLog(`Pulse: ${pulse} BPM | Stress: ${(stress * 100).toFixed(0)}% | Temp: ${temperature}°C`, 'info')
    try {
      const res = await verifyBiometrics({
        unit_id: unitId,
        pulse_bpm: pulse,
        stress_level: stress,
        temperature_c: temperature,
        iris_hash: irisHash,
      })
      if (res.success && res.session) {
        setLastResult(`AUTHENTICATED — Session ${res.session.session_id.slice(0, 8)} | CL-${res.session.clearance_level}`)
        onLog(`Active Skin: AUTH OK — ${unitId} | Clearance Level ${res.session.clearance_level}`, 'success')
        if (res.warning) onLog(`Warning: ${res.warning}`, 'warning')
      } else {
        setLastResult(`DENIED — ${res.error}`)
        onLog(`Active Skin: AUTH DENIED — ${res.error}`, 'error')
      }
      await refreshSessions()
    } catch {
      onLog('Biometric verification failed — backend error', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleKill = async (session: AuthSession) => {
    if (killConfirm?.session_id !== session.session_id) {
      setKillConfirm(session)
      onLog(`Kill switch armed for ${session.unit_id} — confirm to execute`, 'warning')
      return
    }
    setLoading(true)
    onLog(`EXECUTING Bio-Kill Switch on ${session.unit_id}…`, 'error')
    try {
      const res = await triggerKillSwitch(session.unit_id, session.session_id, 'manual_trigger')
      if (res.success) {
        onLog(`Kill Switch EXECUTED — ${session.unit_id} data wiped | Hardware: ${res.hardware_destroyed ? 'DESTROYED' : 'intact'}`, 'error')
        onLog('Digital Self-Destruction complete — no data leakage possible', 'success')
      }
      await refreshSessions()
    } catch {
      onLog('Kill switch execution failed', 'error')
    } finally {
      setLoading(false)
      setKillConfirm(null)
    }
  }

  const stressLabel = stress < 0.3 ? 'CALM' : stress < 0.6 ? 'ELEVATED' : stress < 0.85 ? 'HIGH' : 'CRITICAL'
  const stressColor = stress < 0.3 ? 'text-success' : stress < 0.6 ? 'text-primary' : stress < 0.85 ? 'text-warning' : 'text-destructive'
  const pulseNormal = pulse >= 60 && pulse <= 100
  const pulseColor = pulseNormal ? 'text-success' : pulse < 45 || pulse > 160 ? 'text-destructive' : 'text-warning'

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        {/* Biometric form */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Fingerprint className="size-4 text-primary" />
              Active Skin Interface
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="font-mono text-xs text-muted-foreground uppercase tracking-wider">Unit ID</Label>
              <Input
                value={unitId}
                onChange={e => setUnitId(e.target.value)}
                className="mt-1 font-mono"
                placeholder="UNIT-ALPHA-7"
              />
            </div>

            <div className="space-y-4 pt-1">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
                    Pulse (BPM)
                  </Label>
                  <span className={`font-mono text-sm font-bold ${pulseColor}`}>{pulse}</span>
                </div>
                <input
                  type="range" min={30} max={200} step={1}
                  value={pulse}
                  onChange={e => setPulse(Number(e.target.value))}
                  className="w-full"
                  title="Pulse (BPM)"
                  aria-label="Pulse (BPM)"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
                    Stress Level
                  </Label>
                  <span className={`font-mono text-sm font-bold ${stressColor}`}>
                    {(stress * 100).toFixed(0)}% — {stressLabel}
                  </span>
                </div>
                <input
                  type="range" min={0} max={1} step={0.01}
                  value={stress}
                  onChange={e => setStress(Number(e.target.value))}
                  className="w-full"
                  title="Stress Level"
                  aria-label="Stress Level"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
                    Temperature (°C)
                  </Label>
                  <span className={`font-mono text-sm font-bold ${temperature > 38.5 || temperature < 35.5 ? 'text-destructive' : 'text-success'}`}>
                    {temperature.toFixed(1)}°C
                  </span>
                </div>
                <input
                  type="range" min={34} max={41} step={0.1}
                  value={temperature}
                  onChange={e => setTemperature(Number(e.target.value))}
                  className="w-full"
                  title="Temperature (°C)"
                  aria-label="Temperature (°C)"
                />
              </div>
            </div>

            {/* Iris hash (read-only) */}
            <div>
              <Label className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
                Iris Hash (auto-generated)
              </Label>
              <div className="mt-1 bg-secondary/50 rounded px-2 py-1.5 font-mono text-xs text-primary/60 break-all">
                {irisHash}
              </div>
            </div>

            {lastResult && (
              <div className={`rounded px-3 py-2 font-mono text-xs border ${
                lastResult.startsWith('AUTH') || lastResult.startsWith('AUTHENTICATED')
                  ? 'border-success/30 bg-success/10 text-success'
                  : 'border-destructive/30 bg-destructive/10 text-destructive'
              }`}>
                {lastResult}
              </div>
            )}

            <Button
              onClick={handleVerify}
              disabled={loading || !unitId.trim()}
              variant="terminal"
              className="w-full"
            >
              <Shield className="size-4" />
              Verify Biometrics
            </Button>
          </CardContent>
        </Card>

        {/* Live gauges */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Heart className="size-4 text-primary" />
              Live Biometric Readout
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <Gauge
              label="Heart Rate"
              value={pulse}
              min={30} max={200}
              unit="BPM"
              warn={100} danger={150}
              icon={<Heart className="size-3" />}
            />
            <Gauge
              label="Stress Index"
              value={stress * 100}
              min={0} max={100}
              unit="%"
              warn={60} danger={85}
              icon={<Brain className="size-3" />}
            />
            <Gauge
              label="Core Temp"
              value={temperature}
              min={34} max={41}
              unit="°C"
              warn={38} danger={39.5}
              icon={<Thermometer className="size-3" />}
            />

            {/* Kill switch threshold indicators */}
            <div className="border border-border rounded-lg p-3 space-y-2">
              <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider">Bio-Kill Switch Thresholds</p>
              {[
                { label: 'Pulse < 45 BPM', trigger: pulse < 45, description: 'KIA / unconscious' },
                { label: 'Stress > 92%', trigger: stress > 0.92, description: 'Extreme duress' },
                { label: 'Temp < 34°C or > 41°C', trigger: temperature < 34 || temperature > 41, description: 'Physiological failure' },
              ].map(({ label, trigger, description }) => (
                <div key={label} className="flex items-center justify-between">
                  <div>
                    <span className="font-mono text-xs text-foreground">{label}</span>
                    <p className="font-mono text-xs text-muted-foreground/60">{description}</p>
                  </div>
                  <div className={`size-2 rounded-full ${trigger ? 'bg-destructive animate-pulse' : 'bg-secondary'}`} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active sessions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Shield className="size-4 text-primary" />
            Active Sessions
            <Badge variant="secondary" className="ml-auto">
              {sessions.filter(s => s.status === 'active').length} active
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="font-mono text-xs text-muted-foreground text-center py-4">
              No sessions. Verify biometrics to create one.
            </p>
          ) : (
            <ScrollArea className="h-64">
              <div className="space-y-2 pr-2">
                {sessions.map(s => (
                  <SessionCard key={s.session_id} session={s} onKill={handleKill} />
                ))}
              </div>
            </ScrollArea>
          )}
          {killConfirm && (
            <div className="mt-3 border border-destructive/50 rounded-lg p-3 bg-destructive/10">
              <p className="font-mono text-xs text-destructive mb-2">
                Confirm kill switch for {killConfirm.unit_id}? This is irreversible.
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleKill(killConfirm)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/80 text-xs"
                >
                  <Skull className="size-3" />
                  Confirm Kill
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setKillConfirm(null)}
                  className="text-xs"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
