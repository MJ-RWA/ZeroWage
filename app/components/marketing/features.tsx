import {
  EyeOff,
  Globe,
  Zap,
  FileCheck2,
  GitBranch,
  Wallet,
} from 'lucide-react'

const features = [
  {
    icon: EyeOff,
    title: 'Private by construction',
    desc: 'Individual salaries are committed inside the circuit. Not even ZeroWage can read them from a proof.',
  },
  {
    icon: FileCheck2,
    title: 'Provable integrity',
    desc: 'Each run proves totals, headcount, and constraints are correct — auditors verify math, not trust.',
  },
  {
    icon: Globe,
    title: 'Global payouts',
    desc: 'Pay contractors and employees across 40+ countries in USDC or XLM with near-instant settlement.',
  },
  {
    icon: Zap,
    title: 'Millisecond verification',
    desc: 'Groth16 proofs verify on Stellar in single-digit milliseconds, regardless of team size.',
  },
  {
    icon: GitBranch,
    title: 'Versioned circuits',
    desc: 'Every proof records the exact circuit and parameters used, so results are reproducible forever.',
  },
  {
    icon: Wallet,
    title: 'Treasury controls',
    desc: 'Multisig approvals, spending limits, and role-based access keep payroll funds locked down.',
  },
]

export function Features() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
      <div className="max-w-2xl">
        <p className="text-sm font-medium text-primary">Platform</p>
        <h2 className="mt-3 text-balance text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
          Enterprise payroll, cryptographic guarantees
        </h2>
        <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
          Everything you expect from modern payroll, plus a verifiable proof of
          correctness on every single run.
        </p>
      </div>

      <div className="mt-14 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="bg-card p-7">
            <span className="flex size-10 items-center justify-center rounded-lg bg-secondary text-foreground">
              <f.icon className="size-5 text-primary" />
            </span>
            <h3 className="mt-5 text-base font-semibold text-foreground">
              {f.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {f.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
