import Link from 'next/link'
import { SiteHeader } from '@/components/marketing/site-header'
import { SiteFooter } from '@/components/marketing/site-footer'
import { FileText, Cpu, Code, ArrowRight, BookOpen, Shield, Zap } from 'lucide-react'

const sections = [
  {
    icon: BookOpen,
    title: 'Getting Started',
    desc: 'Connect your Freighter wallet and run your first zero-knowledge payroll in under 5 minutes.',
    href: '#quickstart',
  },
  {
    icon: Cpu,
    title: 'Circuit Specification',
    desc: 'Deep dive into the Circom circuit — constraints, witness generation, trusted setup, and proof structure.',
    href: '/docs/circuit',
  },
  {
    icon: Code,
    title: 'API Reference',
    desc: 'Integrate ZeroWage into your existing payroll workflow with our REST and Stellar SDK references.',
    href: '/docs/api',
  },
  {
    icon: Shield,
    title: 'Security Model',
    desc: 'How we protect salary data, the trust assumptions, and what the ZK proof actually guarantees.',
    href: '#security',
  },
]

const quickstart = [
  { step: '01', title: 'Install Freighter', desc: 'Download the Freighter browser extension and create or import a Stellar wallet.' },
  { step: '02', title: 'Fund on testnet', desc: 'Get free testnet XLM from friendbot.stellar.org to pay transaction fees.' },
  { step: '03', title: 'Connect wallet', desc: 'Click Connect Wallet on the dashboard and approve the connection in Freighter.' },
  { step: '04', title: 'Create a payroll run', desc: 'Click New Run, enter employee names, wallet addresses, and salary amounts.' },
  { step: '05', title: 'Generate proof', desc: 'Click Generate ZK Proof. Your browser runs the Groth16 circuit locally — salaries never leave your device.' },
  { step: '06', title: 'Submit to Stellar', desc: 'The proof and payroll record are submitted to the Soroban verifier contract on Stellar testnet.' },
]

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-16 lg:px-8">

        {/* Header */}
        <div className="mb-14">
          <div className="text-xs font-mono text-primary uppercase tracking-widest mb-3">Documentation</div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4">
            ZeroWage Developer Docs
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Everything you need to understand, integrate, and audit ZeroWage — the zero-knowledge payroll protocol on Stellar.
          </p>
        </div>

        {/* Section cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-16">
          {sections.map((s) => {
            const Icon = s.icon
            return (
              <Link
                key={s.title}
                href={s.href}
                className="group rounded-xl border border-border bg-card p-6 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                    <Icon size={16} className="text-primary" />
                  </div>
                  <ArrowRight size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="font-semibold text-foreground mb-1">{s.title}</div>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </Link>
            )
          })}
        </div>

        {/* Quickstart */}
        <div id="quickstart" className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-2">Quickstart</h2>
          <p className="text-muted-foreground text-sm mb-8">Get from zero to your first on-chain payroll proof in minutes.</p>
          <div className="space-y-4">
            {quickstart.map((item) => (
              <div key={item.step} className="flex gap-5 rounded-xl border border-border bg-card p-5">
                <div className="font-mono text-xs text-muted-foreground w-6 shrink-0 pt-0.5">{item.step}</div>
                <div>
                  <div className="font-medium text-foreground mb-1">{item.title}</div>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Key concepts */}
        <div id="security" className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-2">Security Model</h2>
          <p className="text-muted-foreground text-sm mb-8">What ZeroWage guarantees — and what it doesn't.</p>
          <div className="rounded-xl border border-border bg-card divide-y divide-border">
            {[
              { label: 'Salary privacy', value: 'Individual amounts are private inputs to the Groth16 circuit. They never appear on-chain, in logs, or on any server.' },
              { label: 'Sum correctness', value: 'The circuit proves sum(salaries) == claimed_total. The blockchain knows the total but not the breakdown.' },
              { label: 'Minimum threshold', value: 'The circuit enforces each salary >= min_salary. Underpayment is cryptographically impossible without a failed proof.' },
              { label: 'Trusted setup', value: 'We use the Hermez perpetual Powers of Tau ceremony (2^12). Security assumes at least one participant destroyed their randomness.' },
              { label: 'Contract address', value: 'CCOEJ6QC6ZGGA2GIY72IW3MDN6LNJHQSB2XWRZR3WSLE3PVVE6QVUYAP (Stellar testnet)' },
            ].map((row) => (
              <div key={row.label} className="flex gap-6 px-5 py-4 flex-wrap">
                <div className="text-sm font-medium text-foreground w-40 shrink-0">{row.label}</div>
                <div className="text-sm text-muted-foreground flex-1">{row.value}</div>
              </div>
            ))}
          </div>
        </div>

      </main>
      <SiteFooter />
    </div>
  )
}