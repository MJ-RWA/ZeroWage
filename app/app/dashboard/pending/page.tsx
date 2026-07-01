'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Clock, ExternalLink, Copy, Check, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getPayrollRuns, type PayrollRun } from '@/lib/payroll-store'

function StatusBadge({ status }: { status: PayrollRun['status'] }) {
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

function CopyLinkBtn({ runId }: { runId: string }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    const url = `${window.location.origin}/approve/${runId}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={copy}
      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
    >
      {copied ? (
        <>
          <Check size={11} className="text-success" /> Copied
        </>
      ) : (
        <>
          <Copy size={11} /> Approval link
        </>
      )}
    </button>
  )
}

export default function PendingPage() {
  const [runs, setRuns] = useState<PayrollRun[]>([])

  useEffect(() => {
    const all = getPayrollRuns()
    setRuns(
      all.filter((r) => r.status === 'draft' || r.status === 'approved')
    )
  }, [])

  const drafts = runs.filter((r) => r.status === 'draft').length
  const approved = runs.filter((r) => r.status === 'approved').length

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Pending approvals
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {runs.length} pending · {drafts} draft · {approved} approved
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
            <Clock className="mx-auto size-8 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">
              No pending payroll runs.
            </p>
            <p className="text-xs text-muted-foreground/70">
              Drafts and runs awaiting CFO approval will appear here.
            </p>
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
                  <th className="px-5 py-3 font-medium">Action</th>
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
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1.5 items-start">
                        {run.status === 'draft' && (
                          <CopyLinkBtn runId={run.id} />
                        )}
                        <Link
                          href={`/dashboard/new?runId=${run.id}`}
                          className="flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          {run.status === 'approved'
                            ? 'Continue to submit'
                            : 'Continue run'}
                          <ArrowRight size={11} />
                        </Link>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/dashboard/runs/${run.id}`}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Details
                      </Link>
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