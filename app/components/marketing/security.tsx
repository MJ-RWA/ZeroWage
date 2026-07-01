import { Lock, ShieldCheck, KeyRound, ScrollText } from 'lucide-react'

const points = [
  {
    icon: Lock,
    title: 'Client-side encryption',
    desc: 'Salary data is encrypted in your browser before it ever reaches our servers.',
  },
  {
    icon: ShieldCheck,
    title: 'Zero-knowledge proofs',
    desc: 'Groth16 proofs reveal correctness without revealing any underlying values.',
  },
  {
    icon: KeyRound,
    title: 'Open-source circuits',
    desc: 'Our payroll circuits are independently audited and open for public review.',
  },
  {
    icon: ScrollText,
    title: 'Immutable audit log',
    desc: 'Every action is recorded on-chain, producing a tamper-evident history.',
  },
]

export function Security() {
  return (
    <section id="security" className="border-y border-border bg-card/30">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <div className="grid gap-14 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-medium text-primary">Security</p>
            <h2 className="mt-3 text-balance text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
              Built to satisfy the most demanding auditors
            </h2>
            <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
              Confidentiality and verifiability are not a trade-off. With
              zero-knowledge proofs, you get both — provable correctness with
              complete salary privacy.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {['GDPR','Open-source circuits'].map(
                (b) => (
                  <span
                    key={b}
                    className="rounded-full border border-border bg-card px-3.5 py-1.5 text-sm text-foreground"
                  >
                    {b}
                  </span>
                ),
              )}
            </div>
          </div>

          <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2">
            {points.map((p) => (
              <div key={p.title} className="bg-card p-6">
                <p.icon className="size-5 text-success" />
                <h3 className="mt-4 text-sm font-semibold text-foreground">
                  {p.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {p.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
