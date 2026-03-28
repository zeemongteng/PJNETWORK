'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  getSentinelStatus, runSentinelScan, resolveAlert, clearAlerts,
  type ThreatAlert, type SentinelStatus, type ThreatLevel, type HapticPattern,
} from '@/lib/api'
import { ShieldAlert, Radar, Zap, Trash2, CheckCircle, Activity } from 'lucide-react'

// ─── Threat level colours ─────────────────────────────────────────────────────

const LEVEL_COLOR: Record<ThreatLevel, string> = {
  none: 'text-muted-foreground',
  low: 'text-success',
  medium: 'text-warning',
  high: 'text-orange-400',
  critical: 'text-destructive',
}

const LEVEL_BG: Record<ThreatLevel, string> = {
  none: 'bg-secondary/30',
  low: 'bg-success/10 border-success/30',
  medium: 'bg-warning/10 border-warning/30',
  high: 'bg-orange-500/10 border-orange-500/30',
  critical: 'bg-destructive/10 border-destructive/30',
}

const LEVEL_BADGE_VARIANT: Record<ThreatLevel, 'default' | 'secondary' | 'destructive'> = {
  none: 'secondary',
  low: 'secondary',
  medium: 'default',
  high: 'default',
  critical: 'destructive',
}

// ─── Threat type label ────────────────────────────────────────────────────────

const THREAT_LABEL: Record<string, string> = {
  signal_jamming: 'JAMMING',
  data_interception: 'INTERCEPT',
  physical_attack: 'KINETIC',
  cyber_intrusion: 'CYBER',
  unit_compromise: 'COMPROMISE',
}

const THREAT_ICON: Record<string, string> = {
  signal_jamming: '📡',
  data_interception: '👁',
  physical_attack: '💥',
  cyber_intrusion: '🔓',
  unit_compromise: '⚠️',
}

// ─── Haptic pattern display ───────────────────────────────────────────────────

const HAPTIC_LABEL: Record<HapticPattern, string> = {
  alert_pulse: 'PULSE ALERT',
  dodge_left: 'DODGE LEFT',
  dodge_right: 'DODGE RIGHT',
  freeze: 'FREEZE',
  retreat: 'RETREAT',
  emergency: 'EMERGENCY',
}

const HAPTIC_COLOR: Record<HapticPattern, string> = {
  alert_pulse: 'text-warning',
  dodge_left: 'text-primary',
  dodge_right: 'text-primary',
  freeze: 'text-violet-400',
  retreat: 'text-orange-400',
  emergency: 'text-destructive',
}

// ─── Threat level indicator ───────────────────────────────────────────────────

function ThreatLevelIndicator({ level }: { level: ThreatLevel }) {
  const order: ThreatLevel[] = ['none', 'low', 'medium', 'high', 'critical']
  const idx = order.indexOf(level)

  return (
    <div className="flex flex-col items-center gap-3">
      <div className={`text-5xl font-mono font-bold tracking-tighter ${LEVEL_COLOR[level]}`}>
        {level.toUpperCase()}
      </div>
      <div className="flex gap-1.5">
        {order.map((l, i) => (
          <div
            key={l}
            className="h-2 rounded-full transition-all duration-500"
            style={{
              width: i === idx ? '32px' : '12px',
              background: i <= idx
                ? (l === 'critical' ? '#ef4444' : l === 'high' ? '#f97316' : l === 'medium' ? '#fbbf24' : l === 'low' ? '#34d399' : '#6b7280')
                : '#1f2937',
            }}
          />
        ))}
      </div>
      <p className="font-mono text-xs text-muted-foreground">OVERALL THREAT LEVEL</p>
    </div>
  )
}

// ─── Alert card ───────────────────────────────────────────────────────────────

function AlertCard({
  alert,
  onResolve,
}: {
  alert: ThreatAlert
  onResolve: (id: string) => void
}) {
  const time = new Date(alert.detected_at).toLocaleTimeString()
  return (
    <div className={`border rounded-lg p-3 space-y-2 ${LEVEL_BG[alert.level]} ${alert.resolved ? 'opacity-40' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-base">{THREAT_ICON[alert.type] || '⚠️'}</span>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs font-bold text-foreground">
                {THREAT_LABEL[alert.type] || alert.type}
              </span>
              <Badge
                variant={LEVEL_BADGE_VARIANT[alert.level]}
                className="text-xs h-4 px-1"
              >
                {alert.level.toUpperCase()}
              </Badge>
            </div>
            <p className="font-mono text-xs text-muted-foreground">ID: {alert.id} · {time}</p>
          </div>
        </div>
        {!alert.resolved && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onResolve(alert.id)}
            className="h-6 w-6 p-0 text-muted-foreground hover:text-success"
          >
            <CheckCircle className="size-3.5" />
          </Button>
        )}
      </div>

      <p className="font-mono text-xs text-foreground/80">{alert.description}</p>

      <div className="flex items-center justify-between">
        {alert.target_node && (
          <span className="font-mono text-xs text-primary/60">Target: {alert.target_node}</span>
        )}
        {alert.haptic_response && (
          <div className="flex items-center gap-1">
            <Zap className="size-3 text-muted-foreground" />
            <span className={`font-mono text-xs font-bold ${HAPTIC_COLOR[alert.haptic_response]}`}>
              ↯ {HAPTIC_LABEL[alert.haptic_response]}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Haptic simulation display ────────────────────────────────────────────────

function HapticSimulator({ alerts }: { alerts: ThreatAlert[] }) {
  const latest = alerts.find(a => !a.resolved && a.haptic_response)

  if (!latest?.haptic_response) {
    return (
      <div className="border border-border rounded-lg p-4 text-center">
        <div className="w-12 h-12 mx-auto mb-2 rounded-full border-2 border-border flex items-center justify-center">
          <Activity className="size-5 text-muted-foreground" />
        </div>
        <p className="font-mono text-xs text-muted-foreground">No active haptic signal</p>
        <p className="font-mono text-xs text-muted-foreground/50 mt-0.5">Armor standby</p>
      </div>
    )
  }

  const pattern = latest.haptic_response
  const color = HAPTIC_COLOR[pattern]
  const label = HAPTIC_LABEL[pattern]

  const arrows: Record<HapticPattern, string> = {
    alert_pulse: '⚡',
    dodge_left: '← DODGE',
    dodge_right: 'DODGE →',
    freeze: '■ FREEZE',
    retreat: '↓ FALL BACK',
    emergency: '🚨 EMERGENCY',
  }

  return (
    <div className={`border rounded-lg p-4 text-center ${LEVEL_BG[latest.level]}`}>
      <div className="font-mono text-2xl mb-1 animate-pulse">{arrows[pattern]}</div>
      <p className={`font-mono text-sm font-bold ${color}`}>{label}</p>
      <p className="font-mono text-xs text-muted-foreground mt-0.5">
        Tactical armor signal active
      </p>
      <p className="font-mono text-xs text-muted-foreground/60 mt-1">
        Threat: {THREAT_LABEL[latest.type]} · Level {latest.level.toUpperCase()}
      </p>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  onLog: (msg: string, type?: 'info' | 'success' | 'warning' | 'error') => void
}

export function Sentinel({ onLog }: Props) {
  const [status, setStatus] = useState<SentinelStatus | null>(null)
  const [scanning, setScanning] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const s = await getSentinelStatus()
      setStatus(s)
    } catch { /* offline */ }
  }, [])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, 8000)
    return () => clearInterval(id)
  }, [refresh])

  const handleScan = async () => {
    setScanning(true)
    onLog('Sentinel AI: initiating network-wide threat scan…', 'info')
    try {
      const res = await runSentinelScan()
      if (res.threats_found === 0) {
        onLog('Sentinel scan complete — no new threats detected', 'success')
      } else {
        onLog(`Sentinel detected ${res.threats_found} new threat(s)!`, 'warning')
        res.new_alerts.forEach(a => {
          onLog(
            `[${THREAT_LABEL[a.type]}] ${a.description}${a.haptic_response ? ` → ↯ ${HAPTIC_LABEL[a.haptic_response]}` : ''}`,
            a.level === 'critical' || a.level === 'high' ? 'error' : 'warning',
          )
        })
      }
      setStatus(res.sentinel_status)
    } catch {
      onLog('Sentinel scan failed — backend error', 'error')
    } finally {
      setScanning(false)
    }
  }

  const handleResolve = async (id: string) => {
    try {
      await resolveAlert(id)
      onLog(`Alert ${id} resolved`, 'success')
      await refresh()
    } catch {
      onLog('Failed to resolve alert', 'error')
    }
  }

  const handleClear = async () => {
    try {
      await clearAlerts()
      onLog('All Sentinel alerts cleared', 'info')
      await refresh()
    } catch {
      onLog('Failed to clear alerts', 'error')
    }
  }

  const activeAlerts = status?.active_alerts.filter(a => !a.resolved) ?? []
  const resolvedAlerts = status?.active_alerts.filter(a => a.resolved) ?? []

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-3 gap-4">
        {/* Threat level */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <ShieldAlert className="size-4 text-primary" />
              The Sentinel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ThreatLevelIndicator level={status?.overall_threat_level ?? 'none'} />
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-secondary/30 rounded-lg p-2">
                <p className="font-mono text-lg font-bold text-destructive">{activeAlerts.length}</p>
                <p className="font-mono text-xs text-muted-foreground">Active Alerts</p>
              </div>
              <div className="bg-secondary/30 rounded-lg p-2">
                <p className="font-mono text-lg font-bold text-primary">{status?.nodes_monitored ?? 0}</p>
                <p className="font-mono text-xs text-muted-foreground">Nodes Watched</p>
              </div>
            </div>
            <div className="space-y-1 text-xs font-mono text-muted-foreground">
              <p>Last scan: {status?.last_scan === 'Never' ? 'Never' : new Date(status?.last_scan ?? '').toLocaleTimeString()}</p>
            </div>
          </CardContent>
        </Card>

        {/* Haptic feedback */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Zap className="size-4 text-primary" />
              Tactical Haptics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <HapticSimulator alerts={status?.active_alerts ?? []} />
            <div className="mt-3 space-y-1.5">
              <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider">Signal Map</p>
              {(Object.entries(HAPTIC_LABEL) as [HapticPattern, string][]).map(([pattern, label]) => (
                <div key={pattern} className="flex items-center justify-between">
                  <span className="font-mono text-xs text-muted-foreground">{label}</span>
                  <span className={`font-mono text-xs ${HAPTIC_COLOR[pattern]}`}>
                    {pattern === 'dodge_left' ? '← armor' :
                     pattern === 'dodge_right' ? '→ armor' :
                     pattern === 'freeze' ? 'lock joints' :
                     pattern === 'retreat' ? 'pull back' :
                     pattern === 'emergency' ? 'full override' : 'vibrate'}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Radar className="size-4 text-primary" />
              Scan Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={handleScan}
              disabled={scanning}
              variant="terminal"
              className="w-full"
            >
              <Radar className={`size-4 ${scanning ? 'animate-spin' : ''}`} />
              {scanning ? 'Scanning…' : 'Run Threat Scan'}
            </Button>
            <Button
              onClick={handleClear}
              variant="outline"
              className="w-full"
            >
              <Trash2 className="size-4" />
              Clear All Alerts
            </Button>
            <div className="bg-secondary/30 rounded-lg p-3 space-y-1">
              <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider">Threat Types</p>
              {Object.entries(THREAT_LABEL).map(([type, label]) => (
                <div key={type} className="flex items-center gap-2">
                  <span className="text-xs">{THREAT_ICON[type]}</span>
                  <span className="font-mono text-xs text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert timeline */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <ShieldAlert className="size-4 text-primary" />
            Alert Timeline
            <Badge variant="destructive" className="ml-2">{activeAlerts.length} active</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(status?.active_alerts.length ?? 0) === 0 ? (
            <div className="text-center py-8">
              <ShieldAlert className="size-8 mx-auto mb-2 text-muted-foreground/30" />
              <p className="font-mono text-xs text-muted-foreground">
                No alerts detected. Run a threat scan to activate Sentinel AI.
              </p>
            </div>
          ) : (
            <ScrollArea className="h-72">
              <div className="space-y-2 pr-2">
                {/* Active first, then resolved */}
                {[...activeAlerts, ...resolvedAlerts].map(alert => (
                  <AlertCard key={alert.id} alert={alert} onResolve={handleResolve} />
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
