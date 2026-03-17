'use client'

import { useState, useCallback, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { ShardGrid, type Shard } from '@/components/shard-card'
import { ProtocolLog, type LogEntry } from '@/components/protocol-log'
import { StatGrid } from '@/components/stat-card'
import { shardData, reassembleShards, checkHealth } from '@/lib/api'
import { 
  Zap, 
  RotateCcw, 
  ShieldAlert, 
  Trash2,
  RefreshCw,
  Activity
} from 'lucide-react'

const DEFAULT_MESSAGE = `GBNL: Secure tactical communication at 0800 hours. Grid coordinates: 51.5074° N, 0.1278° W. Authentication code: ALPHA-7-DELTA.`

export default function VoidProtocolDemo() {
  const [inputData, setInputData] = useState(DEFAULT_MESSAGE)
  const [shards, setShards] = useState<Shard[]>([])
  const [reassembledData, setReassembledData] = useState<string | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const shardSize = 8

  // Add log entry
  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    const now = new Date()
    const time = now.toTimeString().split(' ')[0]
    setLogs(prev => [{ time, message, type }, ...prev.slice(0, 19)])
  }, [])

  // Check backend health on mount
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const health = await checkHealth()
        setBackendStatus('online')
        addLog(`Backend connected: ${health.protocol}`, 'success')
      } catch {
        setBackendStatus('offline')
        addLog('Backend connection failed', 'error')
      }
    }
    checkBackend()
  }, [addLog])

  // Shard data
  const handleShardData = async () => {
    if (!inputData.trim()) {
      addLog('No data to shard', 'warning')
      return
    }

    setIsLoading(true)
    addLog('Initiating data sharding...', 'info')

    try {
      const response = await shardData(inputData, shardSize)
      setShards(response.shards)
      setReassembledData(null)
      addLog(`Data sharded into ${response.total_shards} fragments`, 'success')
      addLog(`Message ID: ${response.message_id.slice(0, 8)}...`, 'info')
    } catch (error) {
      addLog('Sharding failed: Backend error', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  // Reassemble shards
  const handleReassemble = async () => {
    if (shards.length === 0) {
      addLog('No shards to reassemble', 'warning')
      return
    }

    const activeShards = shards.filter(s => s.active)
    if (activeShards.length < shards[0]?.total) {
      addLog(`Missing shards: Have ${activeShards.length}, need ${shards[0]?.total}`, 'error')
    }

    setIsLoading(true)
    addLog('Attempting reassembly...', 'info')

    try {
      const response = await reassembleShards(shards)
      if (response.success && response.data) {
        setReassembledData(response.data)
        setShards(prev => prev.map(s => ({ ...s, status: 'delivered' as const })))
        addLog('Data successfully reassembled', 'success')
      } else {
        addLog(`Reassembly failed: ${response.error}`, 'error')
      }
    } catch (error) {
      addLog('Reassembly failed: Backend error', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  // Intercept random shard
  const handleIntercept = () => {
    if (shards.length === 0) {
      addLog('No shards to intercept', 'warning')
      return
    }

    const activeShards = shards.filter(s => s.active)
    if (activeShards.length === 0) {
      addLog('All shards already intercepted', 'warning')
      return
    }

    const randomIndex = Math.floor(Math.random() * activeShards.length)
    const targetShard = activeShards[randomIndex]
    
    setShards(prev => prev.map(s => 
      s.index === targetShard.index 
        ? { ...s, status: 'lost' as const, active: false }
        : s
    ))
    
    addLog(`Shard [${targetShard.index.toString().padStart(2, '0')}] intercepted - Fragment now useless`, 'warning')
    addLog('Intercepted payload reveals nothing meaningful', 'info')
  }

  // Restore all shards
  const handleRestore = () => {
    if (shards.length === 0) return
    
    setShards(prev => prev.map(s => ({ ...s, status: 'transit' as const, active: true })))
    setReassembledData(null)
    addLog('All shards restored to transit state', 'success')
  }

  // Clear all
  const handleClear = () => {
    setShards([])
    setReassembledData(null)
    setLogs([])
    addLog('Protocol state cleared', 'info')
  }

  const charCount = inputData.length
  const shardCount = shards.length

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <header className="text-center mb-8 pb-6 border-b border-border">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="size-2 rounded-full bg-primary" />
            <h1 className="font-mono text-3xl font-medium tracking-tight text-primary">
              VOID PROTOCOL DEMO
            </h1>
          </div>
          <p className="font-mono text-sm text-muted-foreground uppercase tracking-widest">
            GBNL Data Sharding Security Model
          </p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <Activity className="size-3" />
            <span className="font-mono text-xs text-muted-foreground">
              Backend: {backendStatus === 'checking' ? 'Checking...' : backendStatus === 'online' ? 'Online' : 'Offline'}
            </span>
            <span className={`size-2 rounded-full ${backendStatus === 'online' ? 'bg-success' : backendStatus === 'offline' ? 'bg-destructive' : 'bg-warning'}`} />
          </div>
        </header>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-[1fr_1.5fr] gap-6 mb-6">
          {/* Left Column - Input & Controls */}
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <div className="size-2 bg-primary rounded-sm" />
                  Input Data
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <Textarea
                  value={inputData}
                  onChange={(e) => setInputData(e.target.value)}
                  placeholder="Enter your secret message here..."
                  className="min-h-32 resize-none"
                />

                <StatGrid
                  charCount={charCount}
                  shardCount={shardCount}
                  shardSize={shardSize}
                />

                <div className="flex gap-3">
                  <Button
                    onClick={handleShardData}
                    disabled={isLoading || backendStatus !== 'online'}
                    className="flex-1"
                    variant="terminal"
                  >
                    <Zap className="size-4" />
                    Shard Data
                  </Button>
                  <Button
                    onClick={handleClear}
                    variant="outline"
                    className="flex-1"
                  >
                    <Trash2 className="size-4" />
                    Clear
                  </Button>
                </div>

                <Separator />

                <div className="space-y-2">
                  <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
                    Simulation Controls
                  </p>
                  <div className="flex gap-3">
                    <Button
                      onClick={handleIntercept}
                      disabled={shards.length === 0 || isLoading}
                      variant="outline"
                      className="flex-1"
                    >
                      <ShieldAlert className="size-4" />
                      Intercept
                    </Button>
                    <Button
                      onClick={handleReassemble}
                      disabled={shards.length === 0 || isLoading}
                      variant="outline"
                      className="flex-1"
                    >
                      <RefreshCw className="size-4" />
                      Reassemble
                    </Button>
                  </div>
                  <Button
                    onClick={handleRestore}
                    disabled={shards.length === 0}
                    variant="outline"
                    className="w-full"
                  >
                    <RotateCcw className="size-4" />
                    Restore All Shards
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Reassembled Output */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <div className="size-2 bg-primary rounded-sm" />
                  Reassembled Output
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-secondary/50 border border-border rounded-lg p-4 min-h-20 font-mono text-sm">
                  {reassembledData ? (
                    <span className="text-success">{reassembledData}</span>
                  ) : (
                    <span className="text-muted-foreground italic">
                      No data reassembled yet. Shard your message first.
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Shard Visualization */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <div className="size-2 bg-primary rounded-sm" />
                Shard Visualization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                <ShardGrid shards={shards} />
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Protocol Log */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <div className="size-2 bg-primary rounded-sm" />
              Protocol Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProtocolLog logs={logs} />
          </CardContent>
        </Card>

        {/* Footer */}
        <footer className="mt-8 pt-6 border-t border-border text-center">
          <p className="font-mono text-xs text-muted-foreground">
            GBNL Network Architecture v1.0 | CP352005 Networks | Void Protocol Security Model
          </p>
        </footer>
      </div>
    </div>
  )
}
