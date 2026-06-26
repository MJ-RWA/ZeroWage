import Link from 'next/link'
import { Search } from 'lucide-react'
import { Logo } from '@/components/logo'
import { buttonVariants } from '@/components/ui/button'

export function ExplorerHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-4 px-4 md:px-8">
        <div className="flex items-center gap-3">
          <Link href="/" aria-label="ZeroWage home">
            <Logo />
          </Link>
          <span className="hidden rounded-full border border-border bg-card px-2.5 py-0.5 text-xs text-muted-foreground sm:inline">
            Proof Explorer
          </span>
        </div>

        <div className="hidden flex-1 justify-center md:flex">
          <div className="flex w-full max-w-xl items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
            <Search className="size-4" />
            <span>Search by proof hash, run ID, or ledger</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-2 text-xs text-muted-foreground lg:flex">
            <span className="size-1.5 rounded-full bg-success" />
            Stellar Public
          </span>
          <Link href="/dashboard" className={buttonVariants({ size: 'sm' })}>
            Launch App
          </Link>
        </div>
      </div>
    </header>
  )
}
