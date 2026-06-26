import { CircleCheck, CircleDashed, CircleX } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { VerificationStatus } from '@/lib/mock-data'

const config: Record<
  VerificationStatus,
  { label: string; icon: typeof CircleCheck; className: string; dot: string }
> = {
  verified: {
    label: 'Verified',
    icon: CircleCheck,
    className: 'text-success bg-success/10 ring-success/20',
    dot: 'bg-success',
  },
  pending: {
    label: 'Pending',
    icon: CircleDashed,
    className: 'text-warning bg-warning/10 ring-warning/20',
    dot: 'bg-warning',
  },
  failed: {
    label: 'Failed',
    icon: CircleX,
    className: 'text-destructive bg-destructive/10 ring-destructive/20',
    dot: 'bg-destructive',
  },
}

export function StatusBadge({
  status,
  className,
  withIcon = true,
}: {
  status: VerificationStatus
  className?: string
  withIcon?: boolean
}) {
  const c = config[status]
  const Icon = c.icon
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        c.className,
        className,
      )}
    >
      {withIcon ? (
        <Icon className="size-3.5" aria-hidden="true" />
      ) : (
        <span className={cn('size-1.5 rounded-full', c.dot)} aria-hidden="true" />
      )}
      {c.label}
    </span>
  )
}
