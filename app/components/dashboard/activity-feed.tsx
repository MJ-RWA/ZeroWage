'use client'

import { useEffect, useState } from 'react'
import { ShieldCheck, Banknote, ListPlus } from 'lucide-react'
import { getPayrollRuns, type PayrollRun } from '@/lib/payroll-store'

interface ActivityItem {
  id: string
  icon: typeof ShieldCheck
  color: string
  actor: string
  action: string
  target: string
  time: string
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (mins > 0) return `${mins}m ago`
  return 'just now'
}

function buildActivity(runs: PayrollRun[]): ActivityItem[] {
  const items: ActivityItem[] = []

  for (const run of runs.slice(0, 5)) {
    items.push({
      id: run.id + '_run',
      icon: ListPlus,
      color: 'text-muted-foreground',
      actor: 'You',
      action: 'created payroll run',
      target: run.cycleId,
      time: timeAgo(run.date),
    })
    items.push({
      id: run.id + '_proof',
      icon: ShieldCheck,
      color: 'text-success',
      actor: 'Soroban contract',
      action: 'verified proof for',
      target: run.cycleId,
      time: timeAgo(run.date),
    })
    if (run.paymentTxHash) {
      items.push({
        id: run.id + '_payment',
        icon: Banknote,
        color: 'text-primary',
        actor: 'ZeroWage',
        action: `sent ${run.total.toLocaleString()} USDC for`,
        target: run.cycleId,
        time: timeAgo(run.date),
      })
    }
  }

  return items.slice(0, 8)
}

export function ActivityFeed() {
  const [items, setItems] = useState<ActivityItem[]>([])

  useEffect(() => {
    const runs = getPayrollRuns()
    setItems(buildActivity(runs))
  }, [])

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-3.5">
          <h2 className="text-sm font-medium text-foreground">Activity</h2>
        </div>
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-muted-foreground">No activity yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Activity will appear here after your first payroll run
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-5 py-3.5">
        <h2 className="text-sm font-medium text-foreground">Activity</h2>
      </div>
      <ol className="px-5 py-2">
        {items.map((item, i) => {
          const Icon = item.icon
          return (
            <li key={item.id} className="relative flex gap-3 py-3">
              {i !== items.length - 1 && (
                <span className="absolute left-[15px] top-9 h-[calc(100%-12px)] w-px bg-border" />
              )}
              <span className="z-10 flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-secondary">
                <Icon className={`size-4 ${item.color}`} />
              </span>
              <div className="min-w-0 flex-1 pt-1">
                <p className="text-sm leading-snug text-foreground">
                  <span className="font-medium">{item.actor}</span>{' '}
                  <span className="text-muted-foreground">{item.action}</span>{' '}
                  <span className="font-mono text-xs text-foreground">
                    {item.target}
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {item.time}
                </p>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}