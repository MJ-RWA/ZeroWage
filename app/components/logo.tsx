import { cn } from '@/lib/utils'

export function Logo({
  className,
  showWordmark = true,
}: {
  className?: string
  showWordmark?: boolean
}) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <span className="relative inline-flex size-7 items-center justify-center rounded-md bg-primary/15 ring-1 ring-inset ring-primary/30">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="size-4 text-primary"
          aria-hidden="true"
        >
          <path
            d="M12 2.5l2.6 5.9 6.4.6-4.8 4.2 1.4 6.3L12 16.9 6.4 19.5l1.4-6.3-4.8-4.2 6.4-.6L12 2.5z"
            fill="currentColor"
          />
        </svg>
      </span>
      {showWordmark && (
        <span className="text-[15px] font-semibold tracking-tight text-foreground">
          Zero<span className="text-muted-foreground">Wage</span>
        </span>
      )}
    </span>
  )
}
