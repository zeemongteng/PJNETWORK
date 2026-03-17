import { cn } from '@/lib/utils'

interface StatCardProps {
  value: string | number
  label: string
  className?: string
}

export function StatCard({ value, label, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'bg-secondary/50 border border-border rounded-lg p-4 text-center',
        className
      )}
    >
      <div className="font-mono text-2xl font-medium text-primary mb-1">
        {value}
      </div>
      <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
        {label}
      </div>
    </div>
  )
}

interface StatGridProps {
  charCount: number
  shardCount: number
  shardSize: number
}

export function StatGrid({ charCount, shardCount, shardSize }: StatGridProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <StatCard value={charCount} label="Characters" />
      <StatCard value={shardCount} label="Shards" />
      <StatCard value={shardSize} label="Shard Size" />
    </div>
  )
}
