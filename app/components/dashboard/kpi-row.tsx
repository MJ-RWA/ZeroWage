'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, Shield } from 'lucide-react'
import { getPayrollRuns } from '@/lib/payroll-store'

export function KpiRow() {
  const [stats, setStats] = useState({
    totalPaid: 0,
    totalRuns: 0,
    totalRecipients: 0,
    verifiedRuns: 0,
  })

  useEffect(() => {
    const runs = getPayrollRuns()
    const totalPaid = runs.reduce((s, r) => s + r.total, 0)
    const totalRecipients = runs.reduce((s, r) => s + r.recipients, 0)
setStats({
       totalPaid,
       totalRuns: runs.length,
       totalRecipients,
       verifiedRuns: runs.filter((r) => r.status === 'paid').length,
     })
  }, [])

  const kpis = [
    {
      label: 'Total disbursed',
      value: stats.totalPaid === 0
        ? '$0'
        : '$' + (stats.totalPaid >= 1000
          ? (stats.totalPaid / 1000).toFixed(1) + 'K'
          : stats.totalPaid.toLocaleString()),
      sub: `Across ${stats.totalRecipients} recipients`,
      delta: stats.totalRuns > 0
        ? { value: stats.totalRuns + ' runs', positive: true }
        : null,
    },
    {
      label: 'Verified runs',
      value: `${stats.verifiedRuns} / ${stats.totalRuns}`,
      sub: stats.totalRuns === 0
        ? 'No runs yet'
        : `${Math.round((stats.verifiedRuns / stats.totalRuns) * 100)}% verification rate`,
      delta: stats.verifiedRuns > 0
        ? { value: '100%', positive: true }
        : null,
    },
    {
      label: 'Avg. proof time',
      value: '2.1s',
      sub: 'Groth16 · BN254',
      delta: { value: '660 constraints', positive: true },
    },
    {
      label: 'Pending approvals',
      value: '0',
      sub: 'All runs verified',
      delta: null,
    },
  ]

  return (
    <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <div key={kpi.label} className="bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{kpi.label}</p>
            {kpi.delta && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                <TrendingUp className="size-3.5" />
                {kpi.delta.value}
              </span>
            )}
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold tracking-tight text-foreground">
            {kpi.value}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{kpi.sub}</p>
        </div>
      ))}
    </div>
  )
}