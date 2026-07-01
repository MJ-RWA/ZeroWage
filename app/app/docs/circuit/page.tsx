import Link from 'next/link'
import { SiteHeader } from '@/components/marketing/site-header'
import { SiteFooter } from '@/components/marketing/site-footer'
import { ArrowLeft } from 'lucide-react'

export default function CircuitPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-6 py-16 lg:px-8">

        <Link href="/docs" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft size={14} /> Back to docs
        </Link>

        <div className="mb-10">
          <div className="text-xs font-mono text-primary uppercase tracking-widest mb-3">Circuit Specification</div>
          <h1 className="text-3xl font-bold text-foreground mb-3">payroll.circom</h1>
          <p className="text-muted-foreground">Groth16 · BN254 · 660 constraints · 20 max recipients</p>
        </div>

        {/* Circuit overview */}
        <div className="space-y-8">

          <Section title="Overview">
            <p className="text-sm text-muted-foreground leading-relaxed">
              The ZeroWage circuit is written in Circom 2.0 and compiled with the Groth16 proving system over the BN254 elliptic curve. It proves three properties about a payroll batch without revealing individual salary amounts.
            </p>
          </Section>

          <Section title="Constraints">
            <div className="rounded-lg border border-border bg-card divide-y divide-border">
              {[
                { id: 'C1', label: 'Sum correctness', code: 'sum(salaries[0..n]) === total', desc: 'Proves the claimed total equals the actual sum of all salaries.' },
                { id: 'C2', label: 'Minimum threshold', code: 'each salary[i] >= min_salary', desc: 'Proves every recipient received at least the agreed minimum. Uses GreaterEqThan(32) from circomlib.' },
                { id: 'C3', label: 'Recipient count', code: 'n_recipients > 0', desc: 'Prevents empty payroll runs from generating valid proofs.' },
              ].map((c) => (
                <div key={c.id} className="p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-xs text-primary bg-primary/10 px-2 py-0.5 rounded">{c.id}</span>
                    <span className="font-medium text-foreground text-sm">{c.label}</span>
                  </div>
                  <code className="block font-mono text-xs text-success bg-success/5 border border-success/20 rounded px-3 py-2 mb-2">{c.code}</code>
                  <p className="text-xs text-muted-foreground">{c.desc}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Signals">
            <div className="rounded-lg border border-border bg-card overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="px-4 py-3 text-left font-medium">Signal</th>
                    <th className="px-4 py-3 text-left font-medium">Type</th>
                    <th className="px-4 py-3 text-left font-medium">Visibility</th>
                    <th className="px-4 py-3 text-left font-medium">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { signal: 'salaries[20]', type: 'field[]', vis: 'Private', desc: 'Individual salary amounts — never revealed' },
                    { signal: 'total', type: 'field', vis: 'Public', desc: 'Claimed total disbursement' },
                    { signal: 'min_salary', type: 'field', vis: 'Public', desc: 'Minimum salary floor' },
                    { signal: 'n_recipients', type: 'field', vis: 'Public', desc: 'Number of active recipients' },
                  ].map((row) => (
                    <tr key={row.signal}>
                      <td className="px-4 py-3 font-mono text-xs text-foreground">{row.signal}</td>
                      <td className="px-4 py-3 font-mono text-xs text-primary">{row.type}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${row.vis === 'Private' ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'}`}>
                          {row.vis}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{row.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="Trusted Setup">
            <div className="rounded-lg border border-border bg-card p-5 space-y-3 text-sm text-muted-foreground">
              <p>We use the <strong className="text-foreground">Hermez Perpetual Powers of Tau</strong> ceremony, parameterized for 2^12 constraints. This ceremony had over 200 independent participants — security holds as long as at least one destroyed their toxic waste.</p>
              <div className="grid grid-cols-2 gap-3 pt-2">
                {[
                  { label: 'Ceremony', value: 'Hermez PoT (2^12)' },
                  { label: 'Proving system', value: 'Groth16' },
                  { label: 'Curve', value: 'BN254 (alt_bn128)' },
                  { label: 'Constraints', value: '660' },
                  { label: 'Circuit tool', value: 'Circom 2.2.2' },
                  { label: 'Prover library', value: 'snarkjs 0.7.6' },
                ].map((item) => (
                  <div key={item.label} className="rounded border border-border bg-background px-3 py-2">
                    <div className="text-xs text-muted-foreground mb-0.5">{item.label}</div>
                    <div className="font-mono text-xs text-foreground">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          <Section title="Proof Structure">
            <div className="rounded-lg border border-border bg-background p-4 font-mono text-xs space-y-1">
              <div className="text-muted-foreground mb-3">{'// Groth16 proof output'}</div>
              <div><span className="text-primary">pi_a</span><span className="text-muted-foreground">: [G1 point] — 2 field elements</span></div>
              <div><span className="text-primary">pi_b</span><span className="text-muted-foreground">: [G2 point] — 4 field elements</span></div>
              <div><span className="text-primary">pi_c</span><span className="text-muted-foreground">: [G1 point] — 2 field elements</span></div>
              <div className="pt-2 text-muted-foreground">{'// Verification equation'}</div>
              <div className="text-success">e(π_A, π_B) = e(α, β) · e(∑ aᵢuᵢ(τ), γ) · e(π_C, δ)</div>
              <div className="pt-2 text-muted-foreground">{'// Proof size: ~384 bytes'}</div>
            </div>
          </Section>

        </div>
      </main>
      <SiteFooter />
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-4 pb-2 border-b border-border">{title}</h2>
      {children}
    </div>
  )
}