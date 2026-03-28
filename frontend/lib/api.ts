// GBNL Network System — API Client v2.0

import type { Shard } from '@/components/shard-card'

// ─── Shared types ────────────────────────────────────────────────────────────

export type NodeType = 'command_center' | 'micro_satellite' | 'drone' | 'ground_unit' | 'relay_station'
export type NodeStatus = 'active' | 'degraded' | 'destroyed'
export type ThreatLevel = 'none' | 'low' | 'medium' | 'high' | 'critical'
export type ThreatType = 'signal_jamming' | 'data_interception' | 'physical_attack' | 'cyber_intrusion' | 'unit_compromise'
export type HapticPattern = 'alert_pulse' | 'dodge_left' | 'dodge_right' | 'freeze' | 'retreat' | 'emergency'

// ─── Ghost Web ────────────────────────────────────────────────────────────────

export interface GBNLNode {
  id: string
  name: string
  type: NodeType
  status: NodeStatus
  x: number
  y: number
  health: number
  frequency_band: string
  connections: string[]
  hops: number
}

export interface NetworkTopology {
  nodes: GBNLNode[]
  connections: [string, string][]
  active_nodes: number
  total_nodes: number
  connectivity_percent: number
  uptime_percent: number
  mesh_status: string
}

export interface AttackResponse {
  destroyed: string[]
  surviving_nodes: number
  connectivity_percent: number
  mesh_resilience: string
}

export interface HopResponse {
  nodes_hopped: number
  total_hops_executed: number
  new_frequencies: Record<string, string>
  message: string
}

// ─── Active Skin ─────────────────────────────────────────────────────────────

export interface BiometricReading {
  unit_id: string
  pulse_bpm: number
  stress_level: number
  temperature_c: number
  iris_hash: string
}

export interface AuthSession {
  session_id: string
  unit_id: string
  status: 'active' | 'killed' | 'compromised'
  clearance_level: number
  created_at: string
  biometric_score: number
}

export interface AuthResponse {
  success: boolean
  session?: AuthSession
  error?: string
  warning?: string
}

export interface KillSwitchResponse {
  success: boolean
  unit_id: string
  data_wiped: boolean
  hardware_destroyed: boolean
  timestamp: string
}

// ─── Sentinel ────────────────────────────────────────────────────────────────

export interface ThreatAlert {
  id: string
  type: ThreatType
  level: ThreatLevel
  description: string
  target_node?: string
  detected_at: string
  haptic_response?: HapticPattern
  resolved: boolean
}

export interface SentinelStatus {
  overall_threat_level: ThreatLevel
  active_alerts: ThreatAlert[]
  last_scan: string
  nodes_monitored: number
  anomalies_detected: number
}

export interface ScanResponse {
  threats_found: number
  new_alerts: ThreatAlert[]
  sentinel_status: SentinelStatus
}

// ─── Void Protocol ───────────────────────────────────────────────────────────

export interface ShardResponse {
  message_id: string
  shards: Shard[]
  total_shards: number
  original_length: number
}

export interface ReassembleResponse {
  success: boolean
  data: string | null
  error: string | null
}

export interface CorruptionResponse {
  corrupted_shards: Shard[]
  corruption_details: string
  status: string
}

export interface RecoveryResponse {
  success: boolean
  recovered_data: string | null
  recovery_details: string
  issues_found: string[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

const post = <T>(path: string, body: unknown) =>
  api<T>(path, { method: 'POST', body: JSON.stringify(body) })

// ─── System ──────────────────────────────────────────────────────────────────

export const checkHealth = () => api<Record<string, unknown>>('/health')

// ─── Ghost Web ────────────────────────────────────────────────────────────────

export const getTopology = () => api<NetworkTopology>('/network/topology')
export const attackNetwork = (percentage: number) =>
  post<AttackResponse>('/network/attack', { percentage })
export const resetNetwork = () => post<{ status: string; message: string }>('/network/reset', {})
export const hopFrequencies = () => post<HopResponse>('/network/hop', {})

// ─── Active Skin ─────────────────────────────────────────────────────────────

export const verifyBiometrics = (reading: BiometricReading) =>
  post<AuthResponse>('/auth/verify', reading)
export const triggerKillSwitch = (unit_id: string, session_id: string, reason: string) =>
  post<KillSwitchResponse>('/auth/killswitch', { unit_id, session_id, reason })
export const getSessions = () =>
  api<{ sessions: AuthSession[]; active_count: number; killed_count: number }>('/auth/sessions')

// ─── Sentinel ────────────────────────────────────────────────────────────────

export const getSentinelStatus = () => api<SentinelStatus>('/sentinel/status')
export const runSentinelScan = () => post<ScanResponse>('/sentinel/scan', {})
export const resolveAlert = (alertId: string) =>
  post<{ status: string }>(`/sentinel/resolve/${alertId}`, {})
export const clearAlerts = () => post<{ status: string }>('/sentinel/clear', {})

// ─── Void Protocol ───────────────────────────────────────────────────────────

export const shardData = (data: string, shard_size = 8) =>
  post<ShardResponse>('/shard', { data, shard_size })
export const reassembleShards = (shards: Shard[]) =>
  post<ReassembleResponse>('/reassemble', { shards })
export const corruptShards = (shards: Shard[], corruption_type: 'unsorted' | 'incomplete') =>
  post<CorruptionResponse>('/corrupt', { shards, corruption_type })
export const recoverData = (shards: Shard[]) =>
  post<RecoveryResponse>('/recover', { shards })
