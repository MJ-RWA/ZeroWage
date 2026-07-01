const stack = [
  { name: 'Circom 2', detail: 'ZK circuit' },
  { name: 'Groth16', detail: 'proving system' },
  { name: 'BN254', detail: 'elliptic curve' },
  { name: 'Soroban', detail: 'smart contract' },
  { name: 'Stellar', detail: 'settlement layer' },
  { name: 'Freighter', detail: 'wallet' },
]

export function TrustBar() {
  return (
    <section className="border-y border-border bg-card/30">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <p className="text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Built on production cryptography
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {stack.map((s) => (
            <div key={s.name} className="text-center">
              <div className="text-sm font-semibold text-foreground">
                {s.name}
              </div>
              <div className="text-xs text-muted-foreground">{s.detail}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}