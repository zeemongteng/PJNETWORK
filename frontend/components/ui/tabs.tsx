'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface TabsContextValue {
  value: string
  onValueChange: (value: string) => void
}

const TabsContext = React.createContext<TabsContextValue>({ value: '', onValueChange: () => {} })

function Tabs({
  value,
  defaultValue,
  onValueChange,
  className,
  children,
}: {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  className?: string
  children: React.ReactNode
}) {
  const [internal, setInternal] = React.useState(defaultValue ?? '')
  const active = value ?? internal
  const setActive = (v: string) => {
    setInternal(v)
    onValueChange?.(v)
  }
  return (
    <TabsContext.Provider value={{ value: active, onValueChange: setActive }}>
      <div className={cn('flex flex-col gap-2', className)}>{children}</div>
    </TabsContext.Provider>
  )
}

function TabsList({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        'bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]',
        className,
      )}
    >
      {children}
    </div>
  )
}

function TabsTrigger({
  value,
  className,
  children,
  disabled,
}: {
  value: string
  className?: string
  children: React.ReactNode
  disabled?: boolean
}) {
  const ctx = React.useContext(TabsContext)
  const active = ctx.value === value
  return (
    <button
      disabled={disabled}
      onClick={() => ctx.onValueChange(value)}
      className={cn(
        'inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-colors',
        'text-foreground disabled:pointer-events-none disabled:opacity-50',
        active
          ? 'bg-background shadow-sm border-input/30 text-foreground'
          : 'text-muted-foreground hover:text-foreground',
        className,
      )}
    >
      {children}
    </button>
  )
}

function TabsContent({
  value,
  className,
  children,
}: {
  value: string
  className?: string
  children: React.ReactNode
}) {
  const ctx = React.useContext(TabsContext)
  if (ctx.value !== value) return null
  return <div className={cn('flex-1 outline-none', className)}>{children}</div>
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
