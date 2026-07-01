'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, CheckCircle, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getPayrollRuns, type PayrollRun } from '@/lib/payroll-store'

function StatusBadge({ status }: { status: PayrollRun['status'] }) {
   if (status === 'paid') {
     return (
       <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-mono font-medium text-success ring-1 ring-inset ring-success/20">
         <CheckCircle size={10} />
         PAID
       </span>
     )
   }
  if (status === 'approved') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-mono font-medium text-blue-400 ring-1 ring-inset ring-blue-500/20">
        APPROVED
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-500/10 px-2.5 py-1 text-xs font-mono font-medium text-yellow-400 ring-1 ring-inset ring-yellow-500/20">
      DRAFT
    </span>
  )
}

export default function RunsPage() {
  const [runs, setRuns] = useState<PayrollRun[]>([])

  useEffect(() => {
    // Only paid runs live here now — drafts & approved runs live on
    // /dashboard/pending
    setRuns(getPayrollRuns().filter((r) => r.status === 'paid'))
  }, [])

  const paid = runs.filter((r) => r.status === 'paid').length

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Payroll runs
          </h1>
<p className="mt-1 text-sm text-muted-foreground">
               {runs.length} runs · {paid} paid
             </p>
        </div>
        <Button asChild className="gap-1.5">
          <Link href="/dashboard/new">
            <Plus className="size-4" />
            New Payroll Run
          </Link>
        </Button>
      </div>

      <div className="mt-6">
        {runs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-20 text-center">
            <p className="text-sm text-muted-foreground">No payroll runs yet.</p>
            <Button asChild className="mt-4 gap-1.5">
              <Link href="/dashboard/new">
                <Plus className="size-4" />
                Create your first run
              </Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Cycle</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Recipients</th>
                  <th className="px-5 py-3 text-right font-medium">Total</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Proof</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => (
                  <tr
                    key={run.id}
                    className="border-b border-border/70 last:border-0 hover:bg-accent/30 transition-colors"
                  >
                    <td className="px-5 py-4 font-medium text-foreground">
                      <Link
                        href={`/dashboard/runs/${run.id}`}
                        className="hover:text-primary transition-colors"
                      >
                        {run.cycleId}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground text-xs font-mono">
                      {new Date(run.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-4 font-mono text-foreground">
                      {run.recipients}
                    </td>
                    <td className="px-5 py-4 text-right font-mono font-semibold text-foreground">
                      {run.total.toLocaleString()} USDC
                    </td>
                    <td className="px-5 py-4">
                    <StatusBadge status={run.status} />
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-primary truncate max-w-[120px]">
                      {run.proofTxHash.slice(0, 8)}...{run.proofTxHash.slice(-6)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/runs/${run.id}`}
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Details
                        </Link>
                        <a
                          href={`https://stellar.expert/explorer/testnet/tx/${run.proofTxHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}