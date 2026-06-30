'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, Plus } from 'lucide-react'
import { KpiRow } from '@/components/dashboard/kpi-row'
import { LatestProof } from '@/components/dashboard/latest-proof'
import { ActivityFeed } from '@/components/dashboard/activity-feed'
import { getPayrollRuns, type PayrollRun } from '@/lib/payroll-store'
import { CheckCircle, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { downloadReceipt, downloadReceiptJson } from '@/lib/receipt'
import { Download, Share2 } from 'lucide-react'
import { toast } from 'sonner'

export default function DashboardPage() {
  const [runs, setRuns] = useState<PayrollRun[]>([])

  useEffect(() => {
    setRuns(getPayrollRuns())
  }, [])

  const currentMonth = new Date().toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your payroll command center for {currentMonth}.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <KpiRow />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-foreground">
              Recent payroll runs
            </h2>
            <Link
              href="/dashboard/runs"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              View all
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          {runs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-14 text-center">
              <p className="text-sm text-muted-foreground">
                No payroll runs yet.
              </p>
              <Button asChild className="mt-4 gap-1.5">
                <Link href="/dashboard/new">
                  <Plus className="size-4" />
                  Create your first run
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="px-5 py-3 font-medium">Cycle</th>
                    <th className="px-5 py-3 font-medium">Recipients</th>
                    <th className="px-5 py-3 text-right font-medium">Total</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {runs.slice(0, 5).map((run) => (
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
                      <td className="px-5 py-4 font-mono text-foreground">
                        {run.recipients}
                      </td>
                      <td className="px-5 py-4 text-right font-mono font-semibold text-foreground">
                        {run.total.toLocaleString()} USDC
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-mono text-success ring-1 ring-inset ring-success/20">
                          <CheckCircle size={10} />
                          VERIFIED
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/dashboard/runs/${run.id}`}
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            Details
                          </Link>

                          <Button
                          variant="outline"
                          className="gap-1.5 border-border bg-card hover:bg-accent"
                          onClick={() => downloadReceipt(run)}
                          >
                         <Download className="size-4" />
                         Receipt (.txt)
                        </Button>

                       <Button
                        variant="outline"
                        className="gap-1.5 border-border bg-card hover:bg-accent"
                        onClick={() => downloadReceiptJson(run)}
                        >
                        <Download className="size-4" />
                         Receipt (.json)
                         </Button>
                    
                        {run.proofTxHash && (
                        <Button
                        variant="outline"
                        className="gap-1.5 border-border bg-card hover:bg-accent"
                        onClick={async () => {
                        const url = `${window.location.origin}/verify/${run.proofTxHash}`
                        await navigator.clipboard.writeText(url)
                        toast.success('Attestation link copied')
                        }}
                        >
                        <Share2 className="size-4" />
                        Copy attestation link
                        </Button>
                        )} 

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

        <div className="flex flex-col gap-6">
          <LatestProof />
          <ActivityFeed />
        </div>
      </div>
    </div>
  )
}