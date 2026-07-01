'use client'

import { useEffect, useState } from 'react'
import { ShieldCheck, Banknote, ListPlus, ChevronLeft, ChevronRight } from 'lucide-react'
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

const PAGE_SIZE = 5

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
  for (const run of runs) {
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
        id: run.id + '_pay',
        icon: Banknote,
        color: 'text-primary',
        actor: 'ZeroWage',
        action: `sent ${run.total.toLocaleString()} USDC for`,
        target: run.cycleId,
        time: timeAgo(run.date),
      })
    }
  }
  return items
}

export function ActivityFeed() {
  const [all, setAll] = useState<ActivityItem[]>([])
  const [page, setPage] = useState(1)

  useEffect(() => {
    setAll(buildActivity(getPayrollRuns()))
  }, [])

  const totalPages = Math.max(1, Math.ceil(all.length / PAGE_SIZE))
  const items = all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  if (all.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-3.5">
          <h2 className="text-sm font-medium text-foreground">Activity</h2>
        </div>
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-muted-foreground">No activity yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Activity appears after your first payroll run
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-5 py-3.5 flex items-center justify-between">
        <h2 className="text-sm font-medium text-foreground">Activity</h2>
        <span className="text-xs text-muted-foreground">
          {all.length} events
        </span>
      </div>

      <ol className="px-5 py-2 min-h-[220px]">
        {items.map((item, i) => {
          const Icon = item.icon
          const isLast = i === items.length - 1
          return (
            <li key={item.id} className="relative flex gap-3 py-3">
              {!isLast && (
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
                <p className="mt-0.5 text-xs text-muted-foreground">{item.time}</p>
              </div>
            </li>
          )
        })}
      </ol>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="border-t border-border px-5 py-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <div className="overflow-x-auto">
            <div className="flex items-center gap-1 whitespace-nowrap pb-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex size-7 items-center justify-center rounded border border-border text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={13} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`flex size-7 items-center justify-center rounded border text-xs transition-colors ${
                  p === page
                    ? 'border-primary bg-primary/10 text-primary font-medium'
                    : 'border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex size-7 items-center justify-center rounded border border-border text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={13} />
            </button>
           </div>
         </div>
         </div>
       )}
    </div>
  )
}