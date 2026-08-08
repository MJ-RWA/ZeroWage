'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, Plus, CheckCircle, ExternalLink, Download, Share2 } from 'lucide-react'
import { KpiRow } from '@/components/dashboard/kpi-row'
import { LatestProof } from '@/components/dashboard/latest-proof'
import { ActivityFeed } from '@/components/dashboard/activity-feed'
import { getPayrollRunsSync, type PayrollRun } from '@/lib/payroll-store'
import { Button } from '@/components/ui/button'
import { downloadReceipt, downloadReceiptJson } from '@/lib/receipt'
import { toast } from 'sonner'

export default function DashboardPage() {
  const [runs, setRuns] = useState<PayrollRun[]>([])

  useEffect(() => {
    // Sync load — instant, no flicker
    setRuns(getPayrollRunsSync())

    // Async refresh from Supabase
    async function syncRemote() {
      try {
        const { getPayrollRuns } = await import('@/lib/payroll-store')
        const remote = await getPayrollRuns()
        setRuns(remote)
      } catch {}
    }
    syncRemote()
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

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
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
              <table className="w-full text-left text-sm min-w-[540px]">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Cycle</th>
                    <th className="px-4 py-3 font-medium">Recip.</th>
                    <th className="px-4 py-3 text-right font-medium">Total</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.slice(0, 5).map((run) => (
                    <tr
                      key={run.id}
                      className="border-b border-border/70 last:border-0 hover:bg-accent/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-foreground">
                        <Link
                          href={`/dashboard/runs/${encodeURIComponent(run.id)}`}
                          className="hover:text-primary transition-colors"
                        >
                          {run.cycleId}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-mono text-foreground">
                        {run.recipients}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-foreground">
                        {run.total.toLocaleString()} USDC
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={run.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {/* Download receipt */}
                          <button
                            onClick={() => downloadReceipt(run)}
                            title="Download receipt (.txt)"
                            className="flex size-7 items-center justify-center rounded border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                          >
                            <Download size={12} />
                          </button>

                          {/* Copy attestation link */}
                          {run.proofTxHash && (
                            <button
                              onClick={async () => {
                                const url = `${window.location.origin}/verify/${run.proofTxHash}`
                                await navigator.clipboard.writeText(url)
                                toast.success('Attestation link copied')
                              }}
                              title="Copy attestation link"
                              className="flex size-7 items-center justify-center rounded border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                            >
                              <Share2 size={12} />
                            </button>
                          )}

                          {/* Stellar Expert */}
                          {run.proofTxHash && (
                            <a
                              href={`https://stellar.expert/explorer/testnet/tx/${run.proofTxHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="View on Stellar Expert"
                              className="flex size-7 items-center justify-center rounded border border-border text-muted-foreground hover:text-primary hover:border-blue-500/30 transition-colors"
                            >
                              <ExternalLink size={12} />
                            </a>
                          )}

                          {/* Details */}
                          <Link
                            href={`/dashboard/runs/${encodeURIComponent(run.id)}`}
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-1"
                          >
                            Details →
                          </Link>
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

function StatusBadge({ status }: { status: string }) {
  if (status === 'paid') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-mono text-success ring-1 ring-inset ring-success/20">
        <CheckCircle size={10} />
        PAID
      </span>
    )
  }
  if (status === 'approved') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-mono text-blue-400 ring-1 ring-inset ring-blue-500/20">
        APPROVED
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-500/10 px-2.5 py-1 text-xs font-mono text-yellow-400 ring-1 ring-inset ring-yellow-500/20">
      DRAFT
    </span>
  )
}