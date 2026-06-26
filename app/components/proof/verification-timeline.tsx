import { Check, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { VerificationStatus } from '@/lib/mock-data'

type Stage = { label: string; detail: string; time: string }

export function VerificationTimeline({
  status,
  baseTime,
}: {
  status: VerificationStatus
  baseTime: string
}) {
  const base = new Date(baseTime)
  const t = (offsetSec: number) =>
    new Date(base.getTime() + offsetSec * 1000).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })

  const stages: Stage[] = [
    { label: 'Run created', detail: 'Payroll data committed', time: t(0) },
    { label: 'Proof generated', detail: 'Groth16 · 2.84s', time: t(3) },
    {
      label: 'Submitted to Stellar',
      detail: 'Transaction broadcast',
      time: t(5),
    },
    {
      label:
        status === 'failed' ? 'Verification failed' : 'Verified on-chain',
      detail:
        status === 'failed'
          ? 'Constraint mismatch detected'
          : 'Soroban verifier · 6ms',
      time: t(6),
    },
  ]

  return (
    <ol className="px-5 py-4">
      {stages.map((stage, i) => {
        const isLast = i === stages.length - 1
        const failed = isLast && status === 'failed'
        const pending = isLast && status === 'pending'
        return (
          <li key={stage.label} className="relative flex gap-4 pb-6 last:pb-0">
            {!isLast && (
              <span className="absolute left-[13px] top-7 h-[calc(100%-16px)] w-px bg-border" />
            )}
            <span
              className={cn(
                'z-10 flex size-7 shrink-0 items-center justify-center rounded-full ring-1 ring-inset',
                failed && 'bg-destructive/10 text-destructive ring-destructive/20',
                pending && 'bg-warning/10 text-warning ring-warning/20',
                !failed &&
                  !pending &&
                  'bg-success/10 text-success ring-success/20',
              )}
            >
              {failed ? (
                <X className="size-3.5" />
              ) : pending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Check className="size-3.5" />
              )}
            </span>
            <div className="flex-1 pt-0.5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-foreground">
                  {stage.label}
                </p>
                <span className="font-mono text-xs text-muted-foreground">
                  {pending ? '—' : stage.time}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {pending ? 'Awaiting proof generation' : stage.detail}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
