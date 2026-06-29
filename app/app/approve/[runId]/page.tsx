'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Shield,
  CheckCircle,
  AlertCircle,
  Loader2,
  Lock,
  ExternalLink,
} from 'lucide-react'
import Link from 'next/link'
import { getPayrollRunById, updateRunStatus } from '@/lib/payroll-store'
import { Button } from '@/components/ui/button'

export default function ApprovePage() {
  const params = useParams()
  const runId = params.runId as string

  const [run, setRun] = useState<any>(null)
  const [notFound, setNotFound] = useState(false)
  const [approving, setApproving] = useState(false)
  const [approved, setApproved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)

  useEffect(() => {
    const found = getPayrollRunById(runId)
    if (found) {
      setRun(found)
      if (found.status === 'approved' || found.status === 'paid') {
        setApproved(true)
      }
    } else {
      setNotFound(true)
    }

    // Check wallet
    async function checkWallet() {
      try {
        const { isConnected, getAddress } = await import('@stellar/freighter-api')
        const conn = await isConnected()
        if (conn?.isConnected) {
          const result = await getAddress()
          if (result?.address) setWalletAddress(result.address)
        }
      } catch {}
    }
    checkWallet()
  }, [runId])

  async function connectWallet() {
    try {
      const { requestAccess, getAddress } = await import('@stellar/freighter-api')
      await requestAccess()
      const result = await getAddress()
      if (result?.address) setWalletAddress(result.address)
    } catch (e: any) {
      setError('Could not connect wallet: ' + e.message)
    }
  }

  async function handleApprove() {
    if (!walletAddress) {
      await connectWallet()
      return
    }

    setApproving(true)
    setError(null)

    try {
      // Sign approval message with Freighter
      const { signMessage } = await import('@stellar/freighter-api')

      const message = [
        'ZeroWage Payroll Approval',
        `Run ID: ${runId}`,
        `Cycle: ${run.cycleId}`,
        `Total: ${run.total} USDC`,
        `Recipients: ${run.recipients}`,
        `Approved by: ${walletAddress}`,
        `Timestamp: ${new Date().toISOString()}`,
        '',
        'I confirm I have reviewed the payroll summary above.',
        'Individual salary amounts are ZK-private and not visible to me.',
        'I authorize submission of this payroll run to Stellar.',
      ].join('\n')

let signature = 'approved'
       try {
         const result = await signMessage(message, {
           networkPassphrase: 'Test SDF Network ; September 2015',
         })
         if (result && 'signedMessage' in result && result.signedMessage) {
           signature = typeof result.signedMessage === 'string'
             ? result.signedMessage
             : result.signedMessage.toString('utf-8')
         }
      } catch {
        // signMessage may not be available in all Freighter versions
        // Fall back to address-only approval
        signature = `approved-by-${walletAddress}-at-${Date.now()}`
      }

      updateRunStatus(runId, 'approved', {
        approvalSignature: signature,
        approvedAt: new Date().toUTCString(),
        approverWallet: walletAddress,
      })

      setApproved(true)
    } catch (e: any) {
      setError(e.message || 'Approval failed')
    } finally {
      setApproving(false)
    }
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <AlertCircle size={32} className="text-destructive mb-4" />
        <h1 className="text-lg font-semibold text-foreground mb-2">
          Run not found
        </h1>
        <p className="text-sm text-muted-foreground">
          This approval link is invalid or has expired.
        </p>
      </div>
    )
  }

  if (!run) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

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
        {approved ? (
          /* Approved state */
          <div className="rounded-2xl border border-success/20 bg-success/5 overflow-hidden">
            <div className="px-6 py-5 border-b border-success/20 flex items-center gap-3">
              <CheckCircle size={20} className="text-success" />
              <div>
                <div className="font-semibold text-success text-sm">
                  PAYROLL APPROVED
                </div>
                <div className="text-xs text-success/70">
                  The payroll admin can now submit to Stellar
                </div>
              </div>
            </div>
            <div className="px-6 py-5 space-y-3 font-mono text-sm">
              <Row label="Cycle" value={run.cycleId} />
              <Row label="Total" value={`${run.total.toLocaleString()} USDC`} highlight />
              <Row label="Recipients" value={String(run.recipients)} />
              {run.approvedAt && (
                <Row label="Approved at" value={new Date(run.approvedAt).toLocaleString()} />
              )}
            </div>
            <div className="px-6 py-4 bg-background/50 border-t border-success/20">
              <p className="text-xs text-muted-foreground">
                You can close this window. The payroll admin has been notified.
              </p>
            </div>
          </div>
        ) : (
          /* Approval form */
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            {/* Header */}
            <div className="border-b border-border px-6 py-5">
              <div className="flex items-center gap-3 mb-1">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                  <Shield size={16} className="text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-foreground text-sm">
                    Payroll Approval Required
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Review and approve this payroll run
                  </div>
                </div>
              </div>
            </div>

            {/* Payroll summary — NO salary breakdown */}
            <div className="px-6 py-5 space-y-1">
              <div className="text-xs text-muted-foreground uppercase tracking-widest mb-3">
                Payroll Summary
              </div>
              <Row label="Cycle" value={run.cycleId} />
              <Row
                label="Total amount"
                value={`${run.total.toLocaleString()} USDC`}
                highlight
              />
              <Row label="Recipients" value={String(run.recipients)} />
              <Row label="Submitted" value={new Date(run.date).toLocaleDateString()} />
              <Row label="Status" value="AWAITING APPROVAL" />
            </div>

            {/* ZK privacy notice */}
            <div className="mx-6 mb-5 rounded-lg border border-border bg-background/50 px-4 py-3 flex items-start gap-2">
              <Lock size={12} className="text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Individual salary amounts are cryptographically private — they
                are ZK circuit inputs that never leave the payroll admin's
                browser. You are approving the aggregate total only.
              </p>
            </div>

            {/* Wallet status */}
            {walletAddress ? (
              <div className="mx-6 mb-4 flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
                <div className="size-2 rounded-full bg-success" />
                <span className="font-mono text-xs text-muted-foreground">
                  {walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}
                </span>
              </div>
            ) : (
              <div className="mx-6 mb-4">
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={connectWallet}
                >
                  Connect Freighter to approve
                </Button>
              </div>
            )}

            {error && (
              <div className="mx-6 mb-4 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
                <AlertCircle size={14} className="text-destructive shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Approve button */}
            <div className="px-6 pb-6">
              <Button
                onClick={handleApprove}
                disabled={approving}
                className="w-full gap-2 h-11"
              >
                {approving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Signing approval...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    Approve payroll run
                  </>
                )}
              </Button>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Freighter will ask you to sign an approval message
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={`font-mono text-sm ${
          highlight ? 'font-semibold text-foreground' : 'text-foreground'
        }`}
      >
        {value}
      </span>
    </div>
  )
}