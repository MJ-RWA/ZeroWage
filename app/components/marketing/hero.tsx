'use client'
import Link from 'next/link'
import { ArrowRight, ShieldCheck, Lock, CircleCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useWallet } from '@/lib/wallet-context'
import { useRouter } from 'next/navigation'

export function Hero() {

const { isConnected, connect } = useWallet()
const router = useRouter()

async function handleLaunch() {
  if (isConnected) {
    router.push('/dashboard')
  } else {
    await connect()
    router.push('/dashboard')
  }
}

  return (
    <section className="relative overflow-hidden">
      {/* subtle grid backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.4]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #1e2330 1px, transparent 1px), linear-gradient(to bottom, #1e2330 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage:
            'radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 75%)',
        }}
      />

      <div className="mx-auto max-w-7xl px-6 pb-20 pt-20 md:pt-28 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            <span className="flex size-1.5 rounded-full bg-primary" />
            Groth16 zero-knowledge proofs, live on Stellar
          </div>

          <h1 className="mt-6 text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-7xl md:text-7xl break-words">
            Pay your team.
            <br />
            <span className="text-primary">Prove it cryptographically.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
            Generate Groth16 zero-knowledge proofs for every payroll run while
            keeping salaries private on Stellar. Verifiable integrity, total
            confidentiality.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
          onClick={handleLaunch}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
           >
          Launch App
          <ArrowRight size={13} />
          </button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-11 border-border bg-card px-6 text-[15px] hover:bg-accent"
            >
              <Link href="/explorer">View Proof Explorer</Link>
            </Button>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Lock className="size-3.5 text-success" /> Salaries never exposed
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-success" /> On-chain verification
            </span>
            <span className="flex items-center gap-1.5">
              <CircleCheck className="size-3.5 text-success" /> 
            </span>
          </div>
        </div>

        {/* Product preview */}
        <div className="relative mx-auto mt-16 max-w-5xl px-4 sm:px-0">
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xl shadow-black/40">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <span className="size-2.5 rounded-full bg-secondary" />
              <span className="size-2.5 rounded-full bg-secondary" />
              <span className="size-2.5 rounded-full bg-secondary" />
              <span className="ml-3 font-mono text-xs text-muted-foreground">
                zerowage-theta.vercel.app/dashboard
              </span>
            </div>
            <HeroPreview />
          </div>
          {/* glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-10 -bottom-8 -z-10 h-24 rounded-full bg-primary/20 blur-3xl"
          />
        </div>
      </div>
    </section>
  )
}

function HeroPreview() {
  const rows = [
    { cycle: 'February 2026 — Cycle 24', emp: 3, amt: '74 USDC', status: 'Verified' },
    { cycle: 'February — Contractors', emp: 36, amt: '318,400 USDC', status: 'Pending' },
    { cycle: 'Q1 Bonus Pool — 2026', emp: 3, amt: '642,000 XLM', status: 'Verified' },
  ]
  return (
    <div className="grid gap-px bg-border md:grid-cols-3">
      <div className="bg-card p-5">
        <p className="text-xs text-muted-foreground">Total paid this cycle</p>
        <p className="mt-2 font-mono text-2xl font-semibold text-foreground">
          $100
        </p>
        <p className="mt-1 text-xs text-success">3 employees · 100% verified</p>
      </div>
      <div className="bg-card p-5">
        <p className="text-xs text-muted-foreground">Proof generation</p>
        <p className="mt-2 font-mono text-2xl font-semibold text-foreground">
          2.84s
        </p>
        <p className="mt-1 text-xs text-muted-foreground">Groth16 · 1,065 constraints</p>
      </div>
      <div className="bg-card p-5">
        <p className="text-xs text-muted-foreground">On-chain verification</p>
        <p className="mt-2 font-mono text-2xl font-semibold text-foreground">6ms</p>
        <p className="mt-1 text-xs text-muted-foreground">Stellar ledger 3,262,727</p>
      </div>

      <div className="bg-card p-5 md:col-span-3">
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[340px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="px-4 py-2.5 font-medium">Payroll run</th>
                  <th className="hidden sm:table-cell px-4 py-2.5 text-right font-medium">Employees</th>
                  <th className="px-4 py-2.5 text-right font-medium">Amount</th>
                  <th className="px-4 py-2.5 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.cycle} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-foreground">{r.cycle}</td>
                    <td className="hidden sm:table-cell px-4 py-3 text-right font-mono text-muted-foreground">
                      {r.emp}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-foreground">
                      {r.amt}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={
                          r.status === 'Verified'
                            ? 'inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success ring-1 ring-inset ring-success/20'
                            : 'inline-flex items-center gap-1.5 rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning ring-1 ring-inset ring-warning/20'
                        }
                      >
                        <span
                          className={
                            r.status === 'Verified'
                              ? 'size-1.5 rounded-full bg-success'
                              : 'size-1.5 rounded-full bg-warning'
                          }
                        />
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
