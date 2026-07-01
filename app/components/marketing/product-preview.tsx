import { CircleCheck } from 'lucide-react'

export function ProductPreview() {
  return (
    <section id="product" className="border-y border-border bg-card/30">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-primary">Proof Explorer</p>
            <h2 className="mt-3 text-balance text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
              Every run leaves an auditable trail
            </h2>
            <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
              Like a block explorer for your payroll. Inspect proof hashes,
              public inputs, circuit metadata, and on-chain verification — all in
              one transaction-style view.
            </p>
            <ul className="mt-8 flex flex-col gap-4">
              {[
                'Succinct Groth16 proofs anyone can verify',
                'Salaries stay private; totals stay provable',
                'Linked Stellar transaction for full settlement audit',
                'Developer-friendly metadata and public inputs',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CircleCheck className="mt-0.5 size-5 shrink-0 text-success" />
                  <span className="text-sm leading-relaxed text-foreground">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Explorer mock */}
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xl shadow-black/40">
            <div className="border-b border-border px-5 py-3">
              <p className="font-mono text-xs text-muted-foreground">
                Proof prf_a91c
              </p>
            </div>
            <div className="divide-y divide-border">
              <Row label="Status">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success ring-1 ring-inset ring-success/20">
                  <CircleCheck className="size-3.5" /> Verified
                </span>
              </Row>
              <Row label="Proof hash">
                <span className="break-all font-mono text-xs text-foreground">
                  0x7d4e9b2a1f8c3d6e5a0b9c8d7e6f5a4b3c2d1e0f
                </span>
              </Row>
              <Row label="Circuit">
                <span className="font-mono text-xs text-foreground">
                  payroll.circom_v2.circom
                </span>
              </Row>
              <Row label="Constraints">
                <span className="font-mono text-xs text-foreground">660</span>
              </Row>
              <Row label="Verified on">
                <span className="font-mono text-xs text-foreground">
                  Stellar ledger 3,262,727
                </span>
              </Row>
              <Row label="Verification time">
                <span className="font-mono text-xs text-success">6 ms</span>
              </Row>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Row({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-right">{children}</span>
    </div>
  )
}
