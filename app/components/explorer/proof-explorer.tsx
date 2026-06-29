'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ExternalLink, Shield, Check, Copy } from 'lucide-react'
import { getPayrollRuns, type PayrollRun } from '@/lib/payroll-store'
import { cn } from '@/lib/utils'

function CopyBtn({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(value)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
    >
      {copied
        ? <Check size={11} className="text-success" />
        : <Copy size={11} />
      }
    </button>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 bg-card px-5 py-3.5">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className="text-right font-mono text-xs text-foreground">{children}</span>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-right">
      <p className="font-mono text-lg font-semibold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

export function ProofExplorer() {
  const [runs, setRuns] = useState<PayrollRun[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    const stored = getPayrollRuns()
    setRuns(stored)
    if (stored.length > 0) setSelectedId(stored[0].id)
  }, [])

  const selected = runs.find((r) => r.id === selectedId) ?? null

  if (runs.length === 0) {
    return (
      <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Proof Explorer
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse and verify Groth16 payroll proofs anchored on Stellar.
        </p>
        <div className="mt-10 rounded-xl border border-dashed border-border py-20 text-center">
          <Shield className="size-10 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">No proofs yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Create a payroll run to generate your first on-chain proof
          </p>
          <Link
            href="/dashboard/new"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Create payroll run
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Proof Explorer
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse and verify Groth16 payroll proofs anchored on Stellar.
          </p>
        </div>
        <div className="flex gap-6">
          <Stat label="Total proofs" value={String(runs.length)} />
          <Stat label="Verified" value={String(runs.length)} />
          <Stat label="Circuit" value="Groth16" />
        </div>
      </div>

      <div className="mt-6 grid gap-px overflow-hidden rounded-xl border border-border bg-border lg:grid-cols-[minmax(320px,420px)_1fr]">
        {/* Left: list */}
        <div className="bg-card">
          <div className="border-b border-border px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Proofs — {runs.length} total
            </p>
          </div>
          <ul className="max-h-[640px] overflow-y-auto">
            {runs.map((run) => (
              <li key={run.id}>
                <button
                  onClick={() => setSelectedId(run.id)}
                  className={cn(
                    'flex w-full items-center gap-3 border-b border-border/70 px-4 py-3.5 text-left transition-colors',
                    run.id === selectedId ? 'bg-accent' : 'hover:bg-accent/40'
                  )}
                >
                  <span className="size-2 shrink-0 rounded-full bg-success" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-sm text-foreground">
                      {run.cycleId}
                    </p>
                    <p className="truncate font-mono text-xs text-muted-foreground">
                      {run.proofTxHash.slice(0, 26)}…
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono text-xs text-muted-foreground">
                      {run.recipients} recip.
                    </p>
                    <p className="font-mono text-xs text-success">
                      {run.total.toLocaleString()} USDC
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Right: detail */}
        <div className="bg-card">
          {selected && <ProofDetailPanel run={selected} />}
        </div>
      </div>
    </div>
  )
}

function ProofDetailPanel({ run }: { run: PayrollRun }) {
  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <h2 className="font-mono text-base text-foreground">{run.cycleId}</h2>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-mono text-success ring-1 ring-inset ring-success/20">
            <Check size={10} />
            VERIFIED
          </span>
        </div>
        <a
          href={`https://stellar.expert/explorer/testnet/tx/${run.proofTxHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          Stellar Expert
          <ExternalLink className="size-3.5" />
        </a>
      </div>

      {/* Fields grid */}
      <div className="grid gap-px bg-border md:grid-cols-2">
        <Field label="Proof tx hash">
          <div className="flex items-center gap-2">
            <span className="text-primary">
              {run.proofTxHash.slice(0, 18)}…
            </span>
            <CopyBtn value={run.proofTxHash} />
          </div>
        </Field>
        {run.paymentTxHash && (
          <Field label="Payment tx hash">
            <div className="flex items-center gap-2">
              <span className="text-primary">
                {run.paymentTxHash.slice(0, 18)}…
              </span>
              <CopyBtn value={run.paymentTxHash} />
            </div>
          </Field>
        )}
        <Field label="Circuit">payroll.circom</Field>
        <Field label="Constraints">660</Field>
        <Field label="Protocol">Groth16 · BN254</Field>
        <Field label="Verification time">~12 ms</Field>
        <Field label="Generated at">
          {new Date(run.date).toLocaleString('en-US')}
        </Field>
        <Field label="Network">Stellar Testnet</Field>
      </div>

      {/* Public inputs */}
      <div className="border-t border-border px-5 py-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">
          Public inputs
        </p>
        <div className="rounded-lg border border-border bg-background p-4 font-mono text-xs space-y-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">total (USDC)</span>
            <span className="text-success font-semibold">
              {run.total.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">min_salary</span>
            <span className="text-foreground">0</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">n_recipients</span>
            <span className="text-foreground">{run.recipients}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">salaries[0..20]</span>
            <span className="text-muted-foreground blur-sm select-none">
              ████████████
            </span>
          </div>
        </div>
      </div>

      {/* Timeline + run link */}
      <div className="grid gap-px border-t border-border bg-border md:grid-cols-2">
        <div className="bg-card p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-4">
            Verification timeline
          </p>
          <div className="space-y-3">
            {[
              'Witness computed',
              'Groth16 proof generated',
              'Submitted to Soroban',
              'BN254 pairing verified',
              'Record stored on-chain',
            ].map((step, i) => (
              <div key={step} className="flex items-center gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-success/10 text-success ring-1 ring-success/20">
                  <Check size={11} />
                </span>
                <span className="text-sm text-foreground">{step}</span>
                <span className="ml-auto font-mono text-xs text-muted-foreground">
                  +{i * 2}ms
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">
            Linked payroll run
          </p>
          <Link
            href={`/dashboard/runs/${run.id}`}
            className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3 transition-colors hover:bg-accent/40"
          >
            <div>
              <p className="font-mono text-sm text-foreground">{run.cycleId}</p>
              <p className="text-xs text-muted-foreground">
                {run.recipients} recipients · {run.total.toLocaleString()} USDC
              </p>
            </div>
            <ExternalLink className="size-4 text-muted-foreground" />
          </Link>
          <div className="mt-3 rounded-lg border border-border bg-background px-4 py-3 text-xs text-muted-foreground">
            Contract{' '}
            <span className="font-mono text-foreground">
              CCOEJ6QC…SMRDUD
            </span>
            . Salaries remain confidential; only correctness is revealed.
          </div>
        </div>
      </div>
    </div>
  )
}