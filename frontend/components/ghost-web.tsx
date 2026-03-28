'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  getTopology, attackNetwork, resetNetwork, hopFrequencies,
  type GBNLNode, type NetworkTopology,
} from '@/lib/api'
import { Zap, Shield, RotateCcw, Radio, Wifi, WifiOff, Satellite } from 'lucide-react'

// ─── Colours per type / status ───────────────────────────────────────────────

const NODE_COLORS: Record<string, string> = {
  command_center: '#22d3ee',   // cyan
  micro_satellite: '#a78bfa',  // violet
  relay_station: '#34d399',    // emerald
  drone: '#fbbf24',            // amber
  ground_unit: '#f87171',      // red
}

const STATUS_OPACITY: Record<string, number> = {
  active: 1,
  degraded: 0.6,
  destroyed: 0.18,
}

const STATUS_STROKE: Record<string, string> = {
  active: '#ffffff22',
  degraded: '#fbbf2488',
  destroyed: '#ef444488',
}

const NODE_RADIUS: Record<string, number> = {
  command_center: 14,
  micro_satellite: 9,
  relay_station: 8,
  drone: 7,
  ground_unit: 8,
}

// ─── SVG Network Graph ────────────────────────────────────────────────────────

function NetworkGraph({ topology }: { topology: NetworkTopology }) {
  const nodeMap = Object.fromEntries(topology.nodes.map(n => [n.id, n]))
  const W = 900
  const H = 740

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto"
      style={{ background: 'transparent' }}
    >
      {/* Grid lines */}
      <defs>
        <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
          <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#ffffff08" strokeWidth="0.5" />
        </pattern>
        <radialGradient id="glow-cc" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
        </radialGradient>
        <filter id="blur-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect width={W} height={H} fill="url(#grid)" />

      {/* CC glow */}
      {nodeMap['cc-alpha'] && (
        <circle
          cx={nodeMap['cc-alpha'].x}
          cy={nodeMap['cc-alpha'].y}
          r={80}
          fill="url(#glow-cc)"
        />
      )}

      {/* Connections */}
      {topology.connections.map(([aId, bId], i) => {
        const a = nodeMap[aId]
        const b = nodeMap[bId]
        if (!a || !b) return null
        const aDestroyed = a.status === 'destroyed'
        const bDestroyed = b.status === 'destroyed'
        const opacity = aDestroyed || bDestroyed ? 0.06 : 0.22
        return (
          <line
            key={i}
            x1={a.x} y1={a.y}
            x2={b.x} y2={b.y}
            stroke="#22d3ee"
            strokeWidth={aDestroyed || bDestroyed ? 0.5 : 1}
            strokeOpacity={opacity}
            strokeDasharray={aDestroyed || bDestroyed ? '4 6' : undefined}
          />
        )
      })}

      {/* Nodes */}
      {topology.nodes.map(node => {
        const color = NODE_COLORS[node.type] || '#94a3b8'
        const opacity = STATUS_OPACITY[node.status] ?? 1
        const stroke = STATUS_STROKE[node.status] ?? '#ffffff22'
        const r = NODE_RADIUS[node.type] ?? 8
        const isCC = node.type === 'command_center'

        return (
          <g key={node.id} opacity={opacity}>
            {/* Pulse ring for active nodes */}
            {node.status === 'active' && (
              <circle
                cx={node.x} cy={node.y}
                r={r + 5}
                fill="none"
                stroke={color}
                strokeWidth="0.8"
                strokeOpacity="0.3"
              />
            )}
            {/* Node circle */}
            <circle
              cx={node.x} cy={node.y}
              r={r}
              fill={node.status === 'destroyed' ? '#1f2937' : color}
              stroke={isCC ? '#22d3ee' : stroke}
              strokeWidth={isCC ? 2 : 1}
              filter={isCC ? 'url(#blur-glow)' : undefined}
            />
            {/* Cross for destroyed */}
            {node.status === 'destroyed' && (
              <>
                <line x1={node.x - 4} y1={node.y - 4} x2={node.x + 4} y2={node.y + 4}
                  stroke="#ef4444" strokeWidth="1.5" />
                <line x1={node.x + 4} y1={node.y - 4} x2={node.x - 4} y2={node.y + 4}
                  stroke="#ef4444" strokeWidth="1.5" />
              </>
            )}
            {/* Label */}
            <text
              x={node.x} y={node.y + r + 13}
              textAnchor="middle"
              fontSize="8"
              fill={node.status === 'destroyed' ? '#6b7280' : '#94a3b8'}
              fontFamily="DM Mono, monospace"
            >
              {node.name}
            </text>
            {/* Frequency label for active nodes */}
            {node.status === 'active' && (
              <text
                x={node.x} y={node.y - r - 5}
                textAnchor="middle"
                fontSize="6.5"
                fill={color}
                fillOpacity="0.7"
                fontFamily="DM Mono, monospace"
              >
                {node.frequency_band}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

// ─── Legend ───────────────────────────────────────────────────────────────────

function NodeLegend() {
  const items = [
    { type: 'command_center', label: 'Command Center' },
    { type: 'micro_satellite', label: 'Micro-Satellite' },
    { type: 'relay_station', label: 'Relay Station' },
    { type: 'drone', label: 'Drone' },
    { type: 'ground_unit', label: 'Ground Unit' },
  ]
  return (
    <div className="flex flex-wrap gap-3 mt-2">
      {items.map(({ type, label }) => (
        <div key={type} className="flex items-center gap-1.5">
          <div
            className="size-2.5 rounded-full"
            style={{ background: NODE_COLORS[type] }}
          />
          <span className="font-mono text-xs text-muted-foreground">{label}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  onLog: (msg: string, type?: 'info' | 'success' | 'warning' | 'error') => void
}

export function GhostWeb({ onLog }: Props) {
  const [topology, setTopology] = useState<NetworkTopology | null>(null)
  const [loading, setLoading] = useState(false)
  const [attackPct, setAttackPct] = useState(30)

  const refresh = useCallback(async () => {
    try {
      const t = await getTopology()
      setTopology(t)
    } catch {
      // silently ignore — parent shows offline state
    }
  }, [])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, 5000)
    return () => clearInterval(id)
  }, [refresh])

  const handleAttack = async () => {
    setLoading(true)
    try {
      const res = await attackNetwork(attackPct)
      onLog(`Enemy attack: ${res.destroyed.length} nodes destroyed`, 'error')
      onLog(`Mesh resilience: ${res.mesh_resilience}`, res.connectivity_percent > 70 ? 'warning' : 'error')
      onLog(`Connectivity: ${res.connectivity_percent.toFixed(1)}% — Swarm Tactical Synchronization active`, 'info')
      await refresh()
    } catch {
      onLog('Attack simulation failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    setLoading(true)
    try {
      await resetNetwork()
      onLog('Network fully restored — all nodes operational', 'success')
      await refresh()
    } catch {
      onLog('Reset failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleHop = async () => {
    setLoading(true)
    try {
      const res = await hopFrequencies()
      onLog(res.message, 'success')
      onLog(`${res.nodes_hopped} nodes hopped — total hops: ${res.total_hops_executed.toLocaleString()}`, 'info')
      await refresh()
    } catch {
      onLog('Frequency hop failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (!topology) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground font-mono text-sm">
        Initializing Ghost Web...
      </div>
    )
  }

  const destroyed = topology.total_nodes - topology.active_nodes
  const destroyedPct = Math.round(destroyed / topology.total_nodes * 100)

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: 'Active Nodes',
            value: `${topology.active_nodes}/${topology.total_nodes}`,
            color: topology.active_nodes === topology.total_nodes ? 'text-success' : 'text-warning',
            icon: <Wifi className="size-3" />,
          },
          {
            label: 'Connectivity',
            value: `${topology.connectivity_percent.toFixed(1)}%`,
            color: topology.connectivity_percent > 90 ? 'text-success' : topology.connectivity_percent > 60 ? 'text-warning' : 'text-destructive',
            icon: <Radio className="size-3" />,
          },
          {
            label: 'Uptime',
            value: `${topology.uptime_percent.toFixed(2)}%`,
            color: 'text-primary',
            icon: <Shield className="size-3" />,
          },
          {
            label: 'Nodes Lost',
            value: `${destroyed} (${destroyedPct}%)`,
            color: destroyed === 0 ? 'text-muted-foreground' : 'text-destructive',
            icon: <WifiOff className="size-3" />,
          },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className="bg-secondary/40 border border-border rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              {icon}
              <span className="font-mono text-xs uppercase tracking-wider">{label}</span>
            </div>
            <p className={`font-mono text-lg font-semibold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Mesh status */}
      <div className="bg-secondary/20 border border-border rounded-lg px-4 py-2 flex items-center gap-2">
        <div className={`size-2 rounded-full ${topology.connectivity_percent > 90 ? 'bg-success' : topology.connectivity_percent > 60 ? 'bg-warning' : 'bg-destructive'}`} />
        <span className="font-mono text-xs text-primary tracking-wider">{topology.mesh_status}</span>
      </div>

      {/* Network graph */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Satellite className="size-4 text-primary" />
            Live Mesh Topology
          </CardTitle>
          <NodeLegend />
        </CardHeader>
        <CardContent className="p-2">
          <NetworkGraph topology={topology} />
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="grid sm:grid-cols-3 gap-3">
        {/* Attack */}
        <div className="flex flex-col gap-2 bg-secondary/30 border border-border rounded-lg p-3">
          <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider">Simulate Attack</p>
          <div className="flex items-center gap-2">
            <input
              type="range" min={10} max={80} step={5}
              value={attackPct}
              onChange={e => setAttackPct(Number(e.target.value))}
              className="flex-1 accent-destructive"
            />
            <span className="font-mono text-xs text-destructive w-8 text-right">{attackPct}%</span>
          </div>
          <Button
            onClick={handleAttack}
            disabled={loading}
            variant="outline"
            size="sm"
            className="border-destructive/50 text-destructive hover:bg-destructive/10"
          >
            Destroy {attackPct}% of Nodes
          </Button>
        </div>

        {/* Frequency hop */}
        <div className="flex flex-col gap-2 bg-secondary/30 border border-border rounded-lg p-3">
          <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider">Frequency Hopping</p>
          <p className="font-mono text-xs text-muted-foreground">Rotate all active nodes to new frequency bands.</p>
          <Button
            onClick={handleHop}
            disabled={loading}
            variant="terminal"
            size="sm"
          >
            <Zap className="size-3" />
            Execute Hop
          </Button>
        </div>

        {/* Reset */}
        <div className="flex flex-col gap-2 bg-secondary/30 border border-border rounded-lg p-3">
          <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider">Network Reset</p>
          <p className="font-mono text-xs text-muted-foreground">Restore all destroyed nodes to full health.</p>
          <Button
            onClick={handleReset}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RotateCcw className="size-3" />
            Restore Full Mesh
          </Button>
        </div>
      </div>

      {/* Node list */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono">Node Registry</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-48">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-border">
                  {['ID', 'Type', 'Status', 'Frequency', 'Hops', 'Health'].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-muted-foreground uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topology.nodes.map(node => (
                  <tr key={node.id} className="border-b border-border/50 hover:bg-secondary/20">
                    <td className="px-3 py-1.5 text-primary">{node.name}</td>
                    <td className="px-3 py-1.5 text-muted-foreground capitalize">
                      {node.type.replace('_', ' ')}
                    </td>
                    <td className="px-3 py-1.5">
                      <Badge
                        variant={node.status === 'active' ? 'default' : node.status === 'degraded' ? 'secondary' : 'destructive'}
                        className="text-xs"
                      >
                        {node.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-1.5 text-primary/70">{node.status !== 'destroyed' ? node.frequency_band : '—'}</td>
                    <td className="px-3 py-1.5 text-muted-foreground">{node.hops.toLocaleString()}</td>
                    <td className="px-3 py-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${node.health}%`,
                              background: node.health > 60 ? '#34d399' : node.health > 30 ? '#fbbf24' : '#ef4444',
                            }}
                          />
                        </div>
                        <span className="text-muted-foreground">{node.health}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
