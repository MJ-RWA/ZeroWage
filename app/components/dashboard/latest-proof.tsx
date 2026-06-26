'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, ShieldCheck, Shield } from 'lucide-react'
import { getPayrollRuns, type PayrollRun } from '@/lib/payroll-store'

export function LatestProof() {
  const [run, setRun] = useState<PayrollRun | null>(null)

  useEffect(() => {
    const runs = getPayrollRuns()
    if (runs.length > 0) setRun(runs[0])
  }, [])

  if (!run) {
    return (
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-3.5">
          <h2 className="text-sm font-medium text-foreground">Latest proof</h2>
        </div>
        <div className="flex flex-col items-center justify-center py-10 text-center px-5">
          <Shield className="size-8 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">No proofs yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Create a payroll run to generate your first ZK proof
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <h2 className="text-sm font-medium text-foreground">Latest proof</h2>
        <a
         href={`https://stellar.expert/explorer/testnet/tx/${run.proofTxHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          Stellar Expert
          <ArrowUpRight className="size-3.5" />
        </a>
      </div>
      <div className="p-5">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-success/10 text-success ring-1 ring-inset ring-success/20">
            <ShieldCheck className="size-5" />
          </span>
          <div>
            <p className="font-mono text-sm text-foreground">{run.cycleId}</p>
            <p className="text-xs text-success">Verified on Stellar testnet</p>
          </div>
        </div>

        <dl className="mt-5 flex flex-col gap-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-xs text-muted-foreground">Proof tx</dt>
            <dd className="truncate font-mono text-xs text-foreground">
              {run.proofTxHash.slice(0, 18)}…
            </dd>
          </div>
          {run.paymentTxHash && (
            <div className="flex items-center justify-between gap-3">
              <dt className="text-xs text-muted-foreground">Payment tx</dt>
              <dd className="truncate font-mono text-xs text-foreground">
                {run.paymentTxHash.slice(0, 18)}…
              </dd>
            </div>
          )}
          <div className="flex items-center justify-between gap-3">
            <dt className="text-xs text-muted-foreground">Circuit</dt>
            <dd className="font-mono text-xs text-foreground">
              Groth16 · BN254
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-xs text-muted-foreground">Constraints</dt>
            <dd className="font-mono text-xs text-foreground">660</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-xs text-muted-foreground">Recipients</dt>
            <dd className="font-mono text-xs text-foreground">
              {run.recipients}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-xs text-muted-foreground">Total</dt>
            <dd className="font-mono text-xs text-success font-semibold">
              {run.total.toLocaleString()} USDC
            </dd>
          </div>
        </dl>
      </div>
    </div>
  )
}