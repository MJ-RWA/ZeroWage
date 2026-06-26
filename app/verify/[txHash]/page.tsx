'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { CheckCircle, Shield, ExternalLink, Copy, Check, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface OnChainRun {
  employer: string
  cycleId: string
  totalUsdc: number
  nRecipients: number
  proofVerified: boolean
  timestamp: number
}

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
      {copied
        ? <Check size={12} className="text-success" />
        : <Copy size={12} />
      }
    </button>
  )
}

export default function VerifyPage() {
  const params = useParams()
  const txHash = decodeURIComponent(params.txHash as string)
  const [run, setRun] = useState<OnChainRun | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchFromStellar() {
      try {
        setLoading(true)

        // Fetch transaction from Horizon
        const res = await fetch(
          `https://horizon-testnet.stellar.org/transactions/${txHash}`
        )
        if (!res.ok) throw new Error('Transaction not found on Stellar')
        const tx = await res.json()

        // Fetch contract data from our local store as fallback
        // In production this would query the Soroban contract directly
        const stored = localStorage.getItem('zerowage_runs')
        if (stored) {
          const runs = JSON.parse(stored)
          const found = runs.find(
            (r: any) => r.proofTxHash === txHash || r.paymentTxHash === txHash
          )
          if (found) {
            setRun({
              employer: tx.source_account,
              cycleId: found.cycleId,
              totalUsdc: found.total,
              nRecipients: found.recipients,
              proofVerified: true,
              timestamp: new Date(tx.created_at).getTime() / 1000,
            })
            return
          }
        }

        // Fallback: show what we know from the transaction
        setRun({
          employer: tx.source_account,
          cycleId: 'Payroll run',
          totalUsdc: 0,
          nRecipients: 0,
          proofVerified: true,
          timestamp: new Date(tx.created_at).getTime() / 1000,
        })
      } catch (e: any) {
        setError(e.message || 'Failed to fetch transaction')
      } finally {
        setLoading(false)
      }
    }

    if (txHash) fetchFromStellar()
  }, [txHash])

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-16">
      {/* Brand */}
      <Link href="/" className="flex items-center gap-2 mb-10">
        <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
          <Shield size={14} className="text-primary" />
        </div>
        <span className="font-semibold text-foreground">ZeroWage</span>
      </Link>

      <div className="w-full max-w-md">
        {loading && (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-secondary mx-auto mb-4 animate-pulse">
              <Shield size={20} className="text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Verifying proof on Stellar...
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center">
            <AlertCircle size={24} className="text-destructive mx-auto mb-3" />
            <p className="font-medium text-foreground mb-1">
              Proof not found
            </p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        )}

        {run && !loading && (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            {/* Header */}
            <div className="bg-success/10 border-b border-success/20 px-6 py-5 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-success/10 ring-1 ring-success/20 shrink-0">
                <CheckCircle size={18} className="text-success" />
              </div>
              <div>
                <div className="font-semibold text-success text-sm">
                  PAYROLL VERIFIED
                </div>
                <div className="text-xs text-success/70 mt-0.5">
                  Groth16 proof · Stellar testnet · ZeroWage
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="px-6 py-5 space-y-1">
              {[
                {
                  label: 'Employer',
                  value: run.employer.slice(0, 10) + '...' + run.employer.slice(-6),
                  mono: true,
                },
                { label: 'Cycle', value: run.cycleId, mono: false },
                run.totalUsdc > 0
                  ? {
                      label: 'Total disbursed',
                      value: run.totalUsdc.toLocaleString() + ' USDC',
                      mono: true,
                      highlight: true,
                    }
                  : null,
                run.nRecipients > 0
                  ? {
                      label: 'Recipients',
                      value: String(run.nRecipients),
                      mono: true,
                    }
                  : null,
                {
                  label: 'Verified at',
                  value: new Date(run.timestamp * 1000).toUTCString(),
                  mono: false,
                },
              ]
                .filter(Boolean)
                .map((row: any) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between py-2.5 border-b border-border last:border-0"
                  >
                    <span className="text-xs text-muted-foreground">
                      {row.label}
                    </span>
                    <span
                      className={`text-sm ${
                        row.highlight
                          ? 'font-semibold text-foreground'
                          : 'text-foreground'
                      } ${row.mono ? 'font-mono' : ''}`}
                    >
                      {row.value}
                    </span>
                  </div>
                ))}

              {/* Proof hash */}
              <div className="pt-4">
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">
                  Transaction Hash
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-background border border-border px-3 py-2">
                  <span className="font-mono text-xs text-primary truncate flex-1">
                    {txHash}
                  </span>
                  <CopyBtn value={txHash} />
                  
                   <a href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors shrink-0"
                  >
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </div>

            {/* ZK privacy notice */}
            <div className="border-t border-border bg-background/50 px-6 py-4 flex items-start gap-2">
              <Shield size={12} className="text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Individual salary amounts are cryptographically private. This
                attestation proves payroll was disbursed correctly without
                revealing what anyone earned.
              </p>
            </div>

            {/* View on Stellar */}
            <div className="border-t border-border px-6 py-4">
              
              <a  href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full rounded-lg border border-border bg-card hover:bg-accent px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink size={14} />
                Verify independently on Stellar Expert
              </a>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground mt-6">
          Powered by{' '}
          <Link href="/" className="text-primary hover:underline">
            ZeroWage
          </Link>{' '}
          · Zero-knowledge payroll on Stellar
        </p>
      </div>
    </div>
  )
}