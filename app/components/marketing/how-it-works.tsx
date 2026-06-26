import { Upload, Cpu, ShieldCheck, Send } from 'lucide-react'

const steps = [
  {
    icon: Upload,
    step: '01',
    title: 'Import your run',
    desc: 'Upload a CSV or sync from your HRIS. Salaries are encrypted client-side and never leave your control in plaintext.',
  },
  {
    icon: Cpu,
    step: '02',
    title: 'Generate the proof',
    desc: 'Our Groth16 circuit commits to every salary and produces a succinct zero-knowledge proof of payroll integrity.',
  },
  {
    icon: ShieldCheck,
    step: '03',
    title: 'Verify on Stellar',
    desc: 'The proof is verified on-chain in milliseconds. Anyone can confirm correctness without seeing a single amount.',
  },
  {
    icon: Send,
    step: '04',
    title: 'Settle payments',
    desc: 'Funds settle to employee wallets on Stellar with low fees and finality in seconds, fully reconciled.',
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
      <div className="max-w-2xl">
        <p className="text-sm font-medium text-primary">How it works</p>
        <h2 className="mt-3 text-balance text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
          From spreadsheet to verifiable proof in four steps
        </h2>
        <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
          Run payroll the way you already do — we add a cryptographic guarantee
          on top, without exposing what anyone earns.
        </p>
      </div>

      <div className="mt-14 grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-2 lg:grid-cols-4">
        {steps.map((s) => (
          <div key={s.step} className="group bg-card p-7">
            <div className="flex items-center justify-between">
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
                <s.icon className="size-5" />
              </span>
              <span className="font-mono text-sm text-muted-foreground/60">
                {s.step}
              </span>
            </div>
            <h3 className="mt-5 text-base font-semibold text-foreground">
              {s.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {s.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
