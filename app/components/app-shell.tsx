'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ListChecks,
  ShieldCheck,
  Users,
  Settings,
  Plus,
  Search,
  ChevronsUpDown,
  Clock,
} from 'lucide-react'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { WalletButton } from '@/components/wallet-button'
import { CompanyName } from '@/components/company-name'
import { useState, useEffect } from 'react'

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/runs', label: 'Payroll Runs', icon: ListChecks },
  { href: '/explorer', label: 'Proof Explorer', icon: ShieldCheck },
  { href: '/dashboard/employees', label: 'Employees', icon: Users },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

function SidebarUser() {
  const [name, setName] = useState('Admin')
  const [role, setRole] = useState('Payroll Admin')
  const [initials, setInitials] = useState('ZW')

  useEffect(() => {
    try {
      const s = localStorage.getItem('zerowage_settings')
      if (s) {
        const parsed = JSON.parse(s)
        if (parsed.adminName) {
          setName(parsed.adminName)
          setRole(parsed.role || 'Payroll Admin')
          const parts = parsed.adminName.trim().split(' ')
          setInitials(
            parts.length >= 2
              ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
              : parsed.adminName.slice(0, 2).toUpperCase()
          )
        }
      }
    } catch {}
  }, [])

  return (
    <div className="border-t border-border p-3">
      <div className="flex items-center gap-3 rounded-md px-2 py-1.5">
        <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary shrink-0">
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{name}</p>
          <p className="truncate text-xs text-muted-foreground">{role}</p>
        </div>
      </div>
    </div>
  )
}

function NavWithBadge({ pathname }: { pathname: string }) {
  const [draftCount, setDraftCount] = useState(0)
  const active = pathname.startsWith('/dashboard/pending')

  useEffect(() => {
    const runs = JSON.parse(localStorage.getItem('zerowage_runs') || '[]')
    const pending = runs.filter(
      (r: any) => r.status === 'draft' || r.status === 'approved'
    ).length
    setDraftCount(pending)
  }, [])

  return (
    <Link
      href="/dashboard/pending"
      className={cn(
        'group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
        active
          ? 'bg-accent text-foreground'
          : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
      )}
    >
      <Clock
        className={cn(
          'size-4 shrink-0',
          active ? 'text-primary' : 'text-muted-foreground'
        )}
      />
      Pending Approvals
      {draftCount > 0 && (
        <span className="ml-auto flex size-5 items-center justify-center rounded-full bg-yellow-500/20 text-[10px] font-medium text-yellow-400">
          {draftCount}
        </span>
      )}
    </Link>
  )
}

function NavLinks({ pathname }: { pathname: string }) {
  return (
    <nav className="flex flex-col gap-0.5">
      {nav.map((item) => {
        const active =
          item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(item.href)
        return (
          <span key={item.href} className="contents">
            <Link
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-accent text-foreground'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
              )}
            >
              <item.icon
                className={cn(
                  'size-4 shrink-0',
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
              />
              {item.label}
            </Link>
            {/* Pending Approvals sits right after Payroll Runs */}
            {item.href === '/dashboard/runs' && (
              <NavWithBadge pathname={pathname} />
            )}
          </span>
        )
      })}
    </nav>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-background md:flex">
        <div className="flex h-16 items-center border-b border-border px-5">
          <Link href="/dashboard" aria-label="Company home">
            <Logo />
          </Link>
        </div>

        <div className="px-3 py-4">
          <button className="flex w-full items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-left text-sm transition-colors hover:bg-accent/50">
            <span className="flex items-center gap-2.5">
              <span className="flex size-6 items-center justify-center rounded bg-primary/15 text-[11px] font-semibold text-primary">
                AC
              </span>
              <span className="font-medium text-foreground"><CompanyName /></span>
            </span>
            <ChevronsUpDown className="size-3.5 text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3">
          <NavLinks pathname={pathname} />
        </div>

        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-md px-2 py-1.5">
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-foreground">
                <SidebarUser />
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 md:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-border bg-background/80 px-4 backdrop-blur-md md:px-8">
          <div className="flex items-center gap-3 md:hidden">
            <Logo showWordmark={false} />
            <span className="text-sm font-medium text-foreground">
              <CompanyName />
            </span>
          </div>
          <div className="hidden flex-1 items-center md:flex">
            <div className="flex w-full max-w-md items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground">
              <Search className="size-4" />
              <span>Search runs, proofs, employees…</span>
              <kbd className="ml-auto rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-[10px]">
                ⌘K
              </kbd>
            </div>
          </div>

          <div className="flex items-center gap-2 min-w-0">
          <WalletButton />
          <Button asChild size="sm" className="gap-1.5">
          <Link href="/dashboard/new">
          <Plus className="size-4" />
          <span className="hidden sm:inline">New Payroll Run</span>
          </Link>
          </Button>
         </div>

        </header>

        {/* Mobile nav */}
        <div className="flex gap-1 overflow-x-auto whitespace-nowrap border-b border-border px-4 py-2 md:hidden">
          {nav.map((item) => {
            const active =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href)
            return (
              <span key={item.href} className="contents">
                <Link
                  href={item.href}
                  className={cn(
                    'whitespace-nowrap rounded-md px-3 py-1.5 text-sm',
                    active
                      ? 'bg-accent text-foreground'
                      : 'text-muted-foreground',
                  )}
                >
                  {item.label}
                </Link>
                {item.href === '/dashboard/runs' && (
                  <Link
                    href="/dashboard/pending"
                    className={cn(
                      'whitespace-nowrap rounded-md px-3 py-1.5 text-sm',
                      pathname.startsWith('/dashboard/pending')
                        ? 'bg-accent text-foreground'
                        : 'text-muted-foreground',
                    )}
                  >
                    Pending
                  </Link>
                )}
              </span>
            )
          })}
        </div>

        <main className="px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  )
}