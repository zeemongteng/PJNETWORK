import type { Shard } from '@/components/shard-card'

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

export async function shardData(data: string, shardSize: number = 8): Promise<ShardResponse> {
  const response = await fetch('/api/shard', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ data, shard_size: shardSize }),
  })
  
  if (!response.ok) {
    throw new Error('Failed to shard data')
  }
  
  return response.json()
}

export async function reassembleShards(shards: Shard[]): Promise<ReassembleResponse> {
  const response = await fetch('/api/reassemble', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ shards }),
  })
  
  if (!response.ok) {
    throw new Error('Failed to reassemble data')
  }
  
  return response.json()
}

export async function corruptShards(shards: Shard[], corruptionType: 'unsorted' | 'incomplete'): Promise<CorruptionResponse> {
  const response = await fetch('/api/corrupt', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ shards, corruption_type: corruptionType }),
  })
  
  if (!response.ok) {
    throw new Error('Failed to corrupt shards')
  }
  
  return response.json()
}

export async function recoverData(shards: Shard[]): Promise<RecoveryResponse> {
  const response = await fetch('/api/recover', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ shards }),
  })
  
  if (!response.ok) {
    throw new Error('Failed to attempt recovery')
  }
  
  return response.json()
}

export async function checkHealth(): Promise<{ status: string; protocol: string }> {
  const response = await fetch('/api/health')
  
  if (!response.ok) {
    throw new Error('Backend unavailable')
  }
  
  return response.json()
}
