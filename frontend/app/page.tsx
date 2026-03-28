'use client'

import { useState, useCallback, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ShardGrid, type Shard } from '@/components/shard-card'
import { ProtocolLog, type LogEntry } from '@/components/protocol-log'
import { StatGrid } from '@/components/stat-card'
import { GhostWeb } from '@/components/ghost-web'
import { ActiveSkin } from '@/components/active-skin'
import { Sentinel } from '@/components/sentinel'
import {
  checkHealth, getTopology, getSentinelStatus,
  shardData, reassembleShards, corruptShards, recoverData,
} from '@/lib/api'
import type { NetworkTopology, SentinelStatus } from '@/lib/api'
import {
  Activity, Zap, RotateCcw, ShieldAlert, Trash2,
  RefreshCw, AlertTriangle, Wrench, Wifi, WifiOff,
  Satellite, Fingerprint, Radar, Network,
} from 'lucide-react'

const DEFAULT_MESSAGE = `GBNL SECURE: Tactical comms 0800 hrs. Grid 51.5074°N 0.1278°W. Auth ALPHA-7-DELTA. Maintain radio silence.`

// ─── Overview cards ───────────────────────────────────────────────────────────

function OverviewCard({
  title, value, sub, color, icon, pulse,
}: {
  title: string
  value: string
  sub: string
  color: string
  icon: React.ReactNode
  pulse?: boolean
}) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-1">{title}</p>
            <p className={`font-mono text-2xl font-bold ${color}`}>{value}</p>
            <p className="font-mono text-xs text-muted-foreground mt-1">{sub}</p>
          </div>
          <div className={`p-2 rounded-lg bg-secondary/50 ${color} relative`}>
            {icon}
            {pulse && (
              <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-success animate-ping" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Architecture overview ────────────────────────────────────────────────────

const LAYERS = [
  {
    id: 1,
    name: 'Active Skin Interface',
    tab: 'auth',
    icon: <Fingerprint className="size-4" />,
    desc: 'Biometric authentication via pulse, iris & DNA. Bio-Kill Switch auto-triggers on KIA or capture.',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10 border-violet-500/20',
  },
  {
    id: 2,
    name: 'Ghost Web',
    tab: 'ghost',
    icon: <Satellite className="size-4" />,
    desc: 'Decentralized Micro-Satellite + Drone mesh. Frequency hopping millions/sec. No single point of failure.',
    color: 'text-primary',
    bg: 'bg-primary/10 border-primary/20',
  },
  {
    id: 3,
    name: 'Void Protocol',
    tab: 'void',
    icon: <Network className="size-4" />,
    desc: 'Data sharded into fragments sent via separate paths. Intercepted shard = digital garbage.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
  },
  {
    id: 4,
    name: 'The Sentinel',
    tab: 'sentinel',
    icon: <Radar className="size-4" />,
    desc: 'AI threat detection monitors all nodes. Tactical haptic feedback drives armor response in real-time.',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10 border-orange-500/20',
  },
]

// ─── Main page ────────────────────────────────────────────────────────────────

export default function GBNLCommandCenter() {
  const [tab, setTab] = useState('overview')
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const [topology, setTopology] = useState<NetworkTopology | null>(null)
  const [sentinelStatus, setSentinelStatus] = useState<SentinelStatus | null>(null)

  // Void Protocol state
  const [inputData, setInputData] = useState(DEFAULT_MESSAGE)
  const [shards, setShards] = useState<Shard[]>([])
  const [reassembledData, setReassembledData] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const shardSize = 8

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    const time = new Date().toTimeString().split(' ')[0]
    setLogs(prev => [{ time, message, type }, ...prev.slice(0, 49)])
  }, [])

  // Initial system check
  useEffect(() => {
    const init = async () => {
      try {
        const health = await checkHealth()
        setBackendStatus('online')
        addLog('GBNL Network System online — all 4 layers operational', 'success')
        const [topo, sentinel] = await Promise.all([getTopology(), getSentinelStatus()])
        setTopology(topo)
        setSentinelStatus(sentinel)
        addLog(`Ghost Web: ${topo.active_nodes}/${topo.total_nodes} nodes active | ${topo.connectivity_percent.toFixed(1)}% connectivity`, 'info')
      } catch {
        setBackendStatus('offline')
        addLog('Backend offline — start the FastAPI server on port 8000', 'error')
      }
    }
    init()
  }, [addLog])

  // Periodic overview refresh
  useEffect(() => {
    if (backendStatus !== 'online') return
    const id = setInterval(async () => {
      try {
        const [topo, sentinel] = await Promise.all([getTopology(), getSentinelStatus()])
        setTopology(topo)
        setSentinelStatus(sentinel)
      } catch { /* ignore */ }
    }, 10000)
    return () => clearInterval(id)
  }, [backendStatus])

  // ─── Void Protocol handlers ────────────────────────────────────────────────

  const handleShardData = async () => {
    if (!inputData.trim()) { addLog('No data to shard', 'warning'); return }
    setIsLoading(true)
    addLog('Void Protocol: initiating data sharding…', 'info')
    try {
      const res = await shardData(inputData, shardSize)
      setShards(res.shards)
      setReassembledData(null)
      addLog(`Sharded into ${res.total_shards} fragments — each routed via separate Ghost Web paths`, 'success')
      addLog(`Message ID: ${res.message_id.slice(0, 8)}… | Intercepted shard = useless garbage`, 'info')
    } catch {
      addLog('Sharding failed — backend error', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReassemble = async () => {
    if (!shards.length) { addLog('No shards to reassemble', 'warning'); return }
    const active = shards.filter(s => s.active)
    if (active.length < shards[0]?.total) {
      addLog(`Missing shards: have ${active.length}, need ${shards[0]?.total}`, 'error')
    }
    setIsLoading(true)
    addLog('Attempting endpoint reassembly…', 'info')
    try {
      const res = await reassembleShards(shards)
      if (res.success && res.data) {
        setReassembledData(res.data)
        setShards(prev => prev.map(s => ({ ...s, status: 'delivered' as const })))
        addLog('Reassembly successful — message integrity verified', 'success')
      } else {
        addLog(`Reassembly failed: ${res.error}`, 'error')
      }
    } catch {
      addLog('Reassembly failed — backend error', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleIntercept = () => {
    if (!shards.length) { addLog('No shards to intercept', 'warning'); return }
    const active = shards.filter(s => s.active)
    if (!active.length) { addLog('All shards already intercepted', 'warning'); return }
    const target = active[Math.floor(Math.random() * active.length)]
    setShards(prev => prev.map(s =>
      s.index === target.index ? { ...s, status: 'lost' as const, active: false } : s
    ))
    addLog(`Shard [${String(target.index).padStart(2, '0')}] intercepted — enemy gets: "${target.payload}" (meaningless)`, 'warning')
  }

  const handleRestore = () => {
    setShards(prev => prev.map(s => ({ ...s, status: 'transit' as const, active: true })))
    setReassembledData(null)
    addLog('All shards restored to transit state', 'success')
  }

  const handleCorruptUnsorted = async () => {
    if (!shards.length) { addLog('No shards to corrupt', 'warning'); return }
    setIsLoading(true)
    addLog('Simulating corruption: shuffling shard order…', 'warning')
    try {
      const res = await corruptShards(shards, 'unsorted')
      setShards(res.corrupted_shards)
      addLog(res.corruption_details, 'warning')
    } catch {
      addLog('Corruption simulation failed', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCorruptIncomplete = async () => {
    if (!shards.length) { addLog('No shards to corrupt', 'warning'); return }
    setIsLoading(true)
    addLog('Simulating corruption: dropping shards…', 'warning')
    try {
      const res = await corruptShards(shards, 'incomplete')
      setShards(res.corrupted_shards)
      addLog(res.corruption_details, 'warning')
    } catch {
      addLog('Corruption simulation failed', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRecover = async () => {
    if (!shards.length) { addLog('No shards to recover', 'warning'); return }
    setIsLoading(true)
    addLog('Sentinel attempting data recovery…', 'info')
    try {
      const res = await recoverData(shards)
      if (res.success) {
        setReassembledData(res.recovered_data)
        addLog('Recovery successful', 'success')
      } else {
        addLog(res.recovery_details, 'warning')
        if (res.recovered_data) setReassembledData(res.recovered_data)
      }
      res.issues_found.forEach(issue => addLog(`Issue: ${issue}`, 'warning'))
    } catch {
      addLog('Recovery failed — backend error', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  // ─── Computed overview values ──────────────────────────────────────────────

  const activeSessions = 0  // will be shown via Active Skin tab
  const threatLevel = sentinelStatus?.overall_threat_level ?? 'none'
  const threatColor = { none: 'text-muted-foreground', low: 'text-success', medium: 'text-warning', high: 'text-orange-400', critical: 'text-destructive' }[threatLevel]
  const connectivity = topology?.connectivity_percent ?? 0
  const connColor = connectivity >= 90 ? 'text-success' : connectivity >= 60 ? 'text-warning' : 'text-destructive'

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-7xl">

        {/* ─── Header ──────────────────────────────────────────────────────── */}
        <header className="mb-6 pb-4 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="size-2.5 rounded-full bg-primary animate-pulse" />
                <h1 className="font-mono text-2xl font-bold tracking-tight text-primary">
                  GBNL COMMAND CENTER
                </h1>
              </div>
              <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest mt-0.5">
                Global Federal Network Line · Intergalactic Communications Architecture
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className={`size-2 rounded-full ${backendStatus === 'online' ? 'bg-success' : backendStatus === 'offline' ? 'bg-destructive' : 'bg-warning animate-pulse'}`} />
                <span className="font-mono text-xs text-muted-foreground">
                  Backend: {backendStatus === 'online' ? 'Online' : backendStatus === 'offline' ? 'Offline' : 'Connecting…'}
                </span>
              </div>
              {topology && (
                <Badge variant="secondary" className="font-mono text-xs">
                  {topology.active_nodes}/{topology.total_nodes} Nodes
                </Badge>
              )}
            </div>
          </div>
        </header>

        {/* ─── Tabs ────────────────────────────────────────────────────────── */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full h-auto flex flex-wrap mb-4">
            {[
              { value: 'overview', label: 'Overview', icon: <Activity className="size-3.5" /> },
              { value: 'ghost', label: 'Ghost Web', icon: <Satellite className="size-3.5" /> },
              { value: 'auth', label: 'Active Skin', icon: <Fingerprint className="size-3.5" /> },
              { value: 'void', label: 'Void Protocol', icon: <Network className="size-3.5" /> },
              { value: 'sentinel', label: 'Sentinel', icon: <Radar className="size-3.5" /> },
            ].map(t => (
              <TabsTrigger key={t.value} value={t.value} className="gap-1.5">
                {t.icon}
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ─── OVERVIEW ──────────────────────────────────────────────────── */}
          <TabsContent value="overview">
            <div className="space-y-6">
              {/* Status cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <OverviewCard
                  title="Network Health"
                  value={topology ? `${topology.active_nodes}/${topology.total_nodes}` : '—'}
                  sub={topology ? `${connectivity.toFixed(1)}% connectivity` : 'Loading…'}
                  color={connColor}
                  icon={<Wifi className="size-4" />}
                  pulse={backendStatus === 'online'}
                />
                <OverviewCard
                  title="Uptime"
                  value={topology ? `${topology.uptime_percent.toFixed(2)}%` : '—'}
                  sub="Rolling mesh uptime"
                  color="text-primary"
                  icon={<Activity className="size-4" />}
                />
                <OverviewCard
                  title="Threat Level"
                  value={threatLevel.toUpperCase()}
                  sub={`${sentinelStatus?.anomalies_detected ?? 0} active alert(s)`}
                  color={threatColor}
                  icon={<ShieldAlert className="size-4" />}
                  pulse={(sentinelStatus?.anomalies_detected ?? 0) > 0}
                />
                <OverviewCard
                  title="Active Shards"
                  value={shards.filter(s => s.active).length.toString()}
                  sub={shards.length ? `of ${shards.length} total` : 'No message sharded'}
                  color="text-emerald-400"
                  icon={<Network className="size-4" />}
                />
              </div>

              {/* Mesh status banner */}
              {topology && (
                <div className={`rounded-lg border px-4 py-3 flex items-center gap-3 ${
                  connectivity >= 90 ? 'border-success/30 bg-success/10' :
                  connectivity >= 60 ? 'border-warning/30 bg-warning/10' :
                  'border-destructive/30 bg-destructive/10'
                }`}>
                  <div className={`size-2 rounded-full ${connectivity >= 90 ? 'bg-success' : connectivity >= 60 ? 'bg-warning' : 'bg-destructive'} animate-pulse`} />
                  <span className="font-mono text-sm">{topology.mesh_status}</span>
                </div>
              )}

              {/* Architecture layers */}
              <div>
                <h2 className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-3">
                  Architecture — 4 Layers
                </h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {LAYERS.map(layer => (
                    <button
                      key={layer.id}
                      onClick={() => setTab(layer.tab)}
                      className={`text-left border rounded-lg p-4 space-y-2 hover:opacity-90 transition-opacity ${layer.bg}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={layer.color}>{layer.icon}</span>
                        <span className="font-mono text-xs text-muted-foreground">Layer {layer.id}</span>
                        <span className={`font-mono text-sm font-semibold ${layer.color}`}>{layer.name}</span>
                      </div>
                      <p className="font-mono text-xs text-muted-foreground leading-relaxed">{layer.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Protocol log */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Activity className="size-4 text-primary" />
                    System Log
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ProtocolLog logs={logs} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ─── GHOST WEB ─────────────────────────────────────────────────── */}
          <TabsContent value="ghost">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Satellite className="size-4 text-primary" />
                <h2 className="font-mono text-sm font-semibold text-primary">Layer 2: Ghost Web</h2>
                <span className="font-mono text-xs text-muted-foreground">— Decentralized Mesh Network</span>
              </div>
              <GhostWeb onLog={addLog} />
            </div>
          </TabsContent>

          {/* ─── ACTIVE SKIN ───────────────────────────────────────────────── */}
          <TabsContent value="auth">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Fingerprint className="size-4 text-violet-400" />
                <h2 className="font-mono text-sm font-semibold text-violet-400">Layer 1: Active Skin Interface</h2>
                <span className="font-mono text-xs text-muted-foreground">— Biometric Auth & Kill Switch</span>
              </div>
              <ActiveSkin onLog={addLog} />
            </div>
          </TabsContent>

          {/* ─── VOID PROTOCOL ─────────────────────────────────────────────── */}
          <TabsContent value="void">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Network className="size-4 text-emerald-400" />
                <h2 className="font-mono text-sm font-semibold text-emerald-400">Layer 3: Void Protocol</h2>
                <span className="font-mono text-xs text-muted-foreground">— Data Sharding & Multi-Path Delivery</span>
              </div>

              <div className="grid lg:grid-cols-[1fr_1.5fr] gap-4">
                {/* Left col */}
                <div className="flex flex-col gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <div className="size-2 bg-emerald-400 rounded-sm" />
                        Transmission Data
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3">
                      <Textarea
                        value={inputData}
                        onChange={e => setInputData(e.target.value)}
                        placeholder="Enter your secure message…"
                        className="min-h-28 resize-none"
                      />
                      <StatGrid charCount={inputData.length} shardCount={shards.length} shardSize={shardSize} />
                      <div className="flex gap-2">
                        <Button
                          onClick={handleShardData}
                          disabled={isLoading || backendStatus !== 'online'}
                          variant="terminal"
                          className="flex-1"
                        >
                          <Zap className="size-4" />
                          Shard & Transmit
                        </Button>
                        <Button type="button" onClick={() => { setShards([]); setReassembledData(null) }} variant="outline">
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                      <Separator />
                      <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider">Simulation</p>
                      <div className="flex gap-2">
                        <Button onClick={handleIntercept} disabled={!shards.length || isLoading} variant="outline" className="flex-1 text-xs">
                          <ShieldAlert className="size-3" /> Intercept Shard
                        </Button>
                        <Button onClick={handleReassemble} disabled={!shards.length || isLoading} variant="outline" className="flex-1 text-xs">
                          <RefreshCw className="size-3" /> Reassemble
                        </Button>
                      </div>
                      <Button onClick={handleRestore} disabled={!shards.length} variant="outline" className="text-xs">
                        <RotateCcw className="size-3" /> Restore All Shards
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Output */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Reassembled Output</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-secondary/50 border border-border rounded-lg p-3 min-h-16 font-mono text-sm">
                        {reassembledData
                          ? <span className="text-success">{reassembledData}</span>
                          : <span className="text-muted-foreground italic text-xs">Awaiting reassembly…</span>
                        }
                      </div>
                    </CardContent>
                  </Card>

                  {/* Corruption & Recovery */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <AlertTriangle className="size-4 text-warning" />
                        Corruption & Recovery
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex gap-2">
                        <Button onClick={handleCorruptUnsorted} disabled={!shards.length || isLoading} variant="outline" size="sm" className="flex-1 text-xs">
                          <AlertTriangle className="size-3" /> Unsorted
                        </Button>
                        <Button onClick={handleCorruptIncomplete} disabled={!shards.length || isLoading} variant="outline" size="sm" className="flex-1 text-xs">
                          <AlertTriangle className="size-3" /> Incomplete
                        </Button>
                      </div>
                      <Button onClick={handleRecover} disabled={!shards.length || isLoading} variant="outline" className="w-full text-xs">
                        <Wrench className="size-3" /> Attempt Recovery
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Right col — shard grid */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <div className="size-2 bg-emerald-400 rounded-sm" />
                      Shard Visualization
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[560px] pr-3">
                      <ShardGrid shards={shards} />
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ─── SENTINEL ──────────────────────────────────────────────────── */}
          <TabsContent value="sentinel">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Radar className="size-4 text-orange-400" />
                <h2 className="font-mono text-sm font-semibold text-orange-400">Layer 4: The Sentinel</h2>
                <span className="font-mono text-xs text-muted-foreground">— AI Threat Detection & Tactical Haptics</span>
              </div>
              <Sentinel onLog={addLog} />
            </div>
          </TabsContent>
        </Tabs>

        {/* ─── Footer ──────────────────────────────────────────────────────── */}
        <footer className="mt-8 pt-4 border-t border-border text-center">
          <p className="font-mono text-xs text-muted-foreground">
            GBNL Network Architecture v2.0 · CP352005 Networks · Classification: TOP SECRET // GBNL-ALPHA
          </p>
        </footer>
      </div>
    </div>
  )
}
