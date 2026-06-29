'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle,
  Shield,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getPayrollRunById, type PayrollRun } from '@/lib/payroll-store'
import { downloadPayslip, downloadAllPayslips } from '@/lib/download-payslip'
import { FileText } from 'lucide-react'

function CopyBtn({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(value)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      className="text-muted-foreground hover:text-foreground transition-colors"
    >
      {copied ? (
        <Check size={12} className="text-success" />
      ) : (
        <Copy size={12} />
      )}
    </button>
  )
}

function DetailRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3.5 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className="text-right text-sm text-foreground font-mono">
        {children}
      </span>
    </div>
  )
}

export default function RunDetailPage() {
  const params = useParams()
  const id = decodeURIComponent(params.id as string)
  const [run, setRun] = useState<PayrollRun | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const found = getPayrollRunById(id)
    if (found) {
      setRun(found)
    } else {
      setNotFound(true)
    }
  }, [id])

  if (notFound) {
    return (
      <div className="mx-auto max-w-6xl text-center py-20">
        <p className="text-muted-foreground">Payroll run not found.</p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/runs">Back to runs</Link>
        </Button>
      </div>
    )
  }

  if (!run) {
    return (
      <div className="mx-auto max-w-6xl py-20 text-center text-muted-foreground">
        Loading...
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href="/dashboard/runs"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Payroll runs
      </Link>

      {/* Header */}
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {run.cycleId}
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-mono font-medium text-success ring-1 ring-inset ring-success/20">
              <CheckCircle size={11} />
              VERIFIED
            </span>
          </div>
          <p className="mt-1 font-mono text-sm text-muted-foreground">
            {new Date(run.date).toUTCString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            asChild
            variant="outline"
            className="gap-1.5 border-border bg-card hover:bg-accent"
          >
            <a
              href={`https://stellar.expert/explorer/testnet/tx/${run.proofTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="size-4" />
              Stellar Expert
            </a>
          </Button>

           <Button
            variant="outline"
            className="gap-1.5 border-border bg-card hover:bg-accent"
            onClick={() => {
            const name = JSON.parse(localStorage.getItem('zerowage_settings') || '{}').companyName
            downloadAllPayslips(run, name)
            }}
           >
           <FileText className="size-4" />
           All payslips
         </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-card p-5">
          <p className="text-xs text-muted-foreground">Total amount</p>
          <p className="mt-1.5 font-mono text-xl font-semibold text-foreground">
            {run.total.toLocaleString()} USDC
          </p>
        </div>
        <div className="bg-card p-5">
          <p className="text-xs text-muted-foreground">Recipients</p>
          <p className="mt-1.5 font-mono text-xl font-semibold text-foreground">
            {run.recipients}
          </p>
        </div>
        <div className="bg-card p-5">
          <p className="text-xs text-muted-foreground">Protocol</p>
          <p className="mt-1.5 font-mono text-xl font-semibold text-foreground">
            Groth16
          </p>
        </div>
        <div className="bg-card p-5">
          <p className="text-xs text-muted-foreground">Constraints</p>
          <p className="mt-1.5 font-mono text-xl font-semibold text-foreground">
            660
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">

          {/* Proof metadata */}
          <section className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
              <h2 className="text-sm font-medium text-foreground">
                ZK Proof
              </h2>
              <span className="inline-flex items-center gap-1.5 text-xs text-success">
                <Shield size={11} />
                Groth16 · BN254
              </span>
            </div>
            <div className="divide-y divide-border">
              <DetailRow label="Proof tx hash">
                <div className="flex items-center gap-2">
                  <span className="text-primary">
                    {run.proofTxHash.slice(0, 20)}...{run.proofTxHash.slice(-8)}
                  </span>
                  <CopyBtn value={run.proofTxHash} />
                  <a
                    href={`https://stellar.expert/explorer/testnet/tx/${run.proofTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <ExternalLink size={11} />
                  </a>
                </div>
              </DetailRow>
              {run.paymentTxHash && (
                <DetailRow label="Payment tx hash">
                  <div className="flex items-center gap-2">
                    <span className="text-primary">
                      {run.paymentTxHash.slice(0, 20)}...
                      {run.paymentTxHash.slice(-8)}
                    </span>
                    <CopyBtn value={run.paymentTxHash} />
                    <a
                      href={`https://stellar.expert/explorer/testnet/tx/${run.paymentTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <ExternalLink size={11} />
                    </a>
                  </div>
                </DetailRow>
              )}
              <DetailRow label="Circuit">payroll.circom</DetailRow>
              <DetailRow label="Constraints">660</DetailRow>
              <DetailRow label="Network">Stellar Testnet</DetailRow>
              <DetailRow label="Contract">
                CCOEJ6QC...SMRDUD
              </DetailRow>
            </div>
          </section>

          {/* Recipients — admin sees real salaries */}
          <section className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
              <h2 className="text-sm font-medium text-foreground">
                Recipients ({run.employees.length})
              </h2>
              <span className="text-xs text-muted-foreground">
                Admin view · salaries visible
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="px-5 py-2.5 font-medium">Name</th>
                    <th className="px-5 py-2.5 font-medium">Wallet</th>
                    <th className="px-5 py-2.5 text-right font-medium">
                      Amount
                    </th>
                    <th className="px-5 py-2.5 text-right font-medium">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {run.employees.map((emp) => (
                    <tr
                      key={emp.id}
                      className="border-b border-border/70 last:border-0"
                    >
                      <td className="px-5 py-3.5 text-foreground font-medium">
                        {emp.name}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">
                        {emp.wallet.slice(0, 8)}...{emp.wallet.slice(-6)}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono font-semibold text-foreground">
                        {emp.amount.toLocaleString()} USDC
                      </td>
                      <td className="px-5 py-3.5 text-right">
                         <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                          run.status === 'paid'
                          ? 'bg-success/10 text-success ring-success/20'
                          : run.status === 'approved'
                          ? 'bg-blue-500/10 text-blue-400 ring-blue-500/20'
                          : 'bg-yellow-500/10 text-yellow-400 ring-yellow-500/20'
                          }`}>
                          {run.status === 'paid' ? 'Paid' : run.status === 'approved' ? 'Pending' : 'Draft'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-border bg-background/50 px-5 py-3 flex items-center gap-2">
              <Shield size={12} className="text-success" />
              <p className="text-xs text-muted-foreground">
                Salary amounts are stored locally. They are private inputs to
                the ZK proof and never appear on-chain.
              </p>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-6">
          <section className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="border-b border-border px-5 py-3.5">
              <h2 className="text-sm font-medium text-foreground">
                Verification timeline
              </h2>
            </div>
            <div className="p-5 space-y-4">
              {[
                { label: 'Salaries entered', done: true },
                { label: 'Witness computed', done: true },
                { label: 'Groth16 proof generated', done: true },
                { label: 'Soroban contract verified', done: true },
                { label: 'USDC payments sent', done: !!run.paymentTxHash },
              ].map((step) => (
                <div key={step.label} className="flex items-center gap-3">
                  <span
                    className={`flex size-6 shrink-0 items-center justify-center rounded-full ${
                      step.done
                        ? 'bg-success/10 text-success ring-1 ring-success/20'
                        : 'bg-border text-muted-foreground'
                    }`}
                  >
                    {step.done ? (
                      <Check size={12} />
                    ) : (
                      <span className="size-1.5 rounded-full bg-current" />
                    )}
                  </span>
                  <span
                    className={`text-sm ${
                      step.done ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="border-b border-border px-5 py-3.5">
              <h2 className="text-sm font-medium text-foreground">
                Public record
              </h2>
            </div>
            <div className="p-5 space-y-3 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="text-foreground">
                  {run.total.toLocaleString()} USDC
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Recipients</span>
                <span className="text-foreground">{run.recipients}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Proof verified</span>
                <span className="text-success">true</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Salaries</span>
                <span className="text-muted-foreground blur-sm select-none">
                  hidden
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}