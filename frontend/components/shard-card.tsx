'use client'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export interface Shard {
  message_id: string
  index: number
  total: number
  payload: string
  hash: string
  status: 'transit' | 'delivered' | 'lost'
  active: boolean
}

interface ShardCardProps {
  shard: Shard
  isActive?: boolean
  onIntercept?: () => void
}

export function ShardCard({ shard, isActive = false }: ShardCardProps) {
  const statusVariant = shard.status as 'transit' | 'delivered' | 'lost'
  
  return (
    <div
      className={cn(
        'bg-secondary/50 border rounded-lg p-4 transition-all animate-shard-appear',
        isActive && 'border-primary animate-pulse-glow',
        shard.status === 'lost' && 'border-destructive opacity-70',
        shard.status === 'delivered' && 'border-success'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
        <span className="font-mono text-sm font-medium text-primary">
          SHARD [{shard.index.toString().padStart(2, '0')}/{shard.total.toString().padStart(2, '0')}]
        </span>
        <Badge variant={statusVariant}>
          {shard.status}
        </Badge>
      </div>
      
      {/* Payload */}
      <div className="font-mono text-sm text-muted-foreground mb-3 break-all leading-relaxed bg-background/50 p-2 rounded border border-border">
        {shard.active ? (
          <span className="text-foreground">{shard.payload}</span>
        ) : (
          <span className="text-destructive line-through">{shard.payload}</span>
        )}
      </div>
      
      {/* Metadata */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex justify-between items-center py-1">
          <span className="font-mono text-muted-foreground">HASH</span>
          <span className="font-mono font-medium text-foreground truncate max-w-20">
            {shard.hash.slice(0, 8)}...
          </span>
        </div>
        <div className="flex justify-between items-center py-1">
          <span className="font-mono text-muted-foreground">SIZE</span>
          <span className="font-mono font-medium text-foreground">
            {shard.payload.length} chars
          </span>
        </div>
      </div>
    </div>
  )
}

interface ShardGridProps {
  shards: Shard[]
  activeIndex?: number
}

export function ShardGrid({ shards, activeIndex }: ShardGridProps) {
  if (shards.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground font-mono text-sm">
        No shards generated yet. Enter data and click SHARD DATA.
      </div>
    )
  }
  
  return (
    <div className="flex flex-col gap-3">
      {shards.map((shard, idx) => (
        <ShardCard
          key={`${shard.message_id}-${shard.index}`}
          shard={shard}
          isActive={idx === activeIndex}
        />
      ))}
    </div>
  )
}
