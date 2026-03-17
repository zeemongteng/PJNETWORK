'use client'

import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'

export interface LogEntry {
  time: string
  message: string
  type: 'info' | 'success' | 'error' | 'warning'
}

interface ProtocolLogProps {
  logs: LogEntry[]
}

export function ProtocolLog({ logs }: ProtocolLogProps) {
  return (
    <ScrollArea className="h-48">
      <div className="flex flex-col">
        {logs.length === 0 ? (
          <div className="text-muted-foreground font-mono text-sm py-2">
            Protocol log initialized. Waiting for operations...
          </div>
        ) : (
          logs.map((log, index) => (
            <div
              key={index}
              className="flex gap-4 py-2 border-b border-border last:border-b-0 font-mono text-sm"
            >
              <span className="text-muted-foreground min-w-20 shrink-0">
                {log.time}
              </span>
              <span
                className={cn(
                  'flex-1',
                  log.type === 'success' && 'text-success',
                  log.type === 'error' && 'text-destructive',
                  log.type === 'warning' && 'text-warning',
                  log.type === 'info' && 'text-foreground'
                )}
              >
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  )
}
