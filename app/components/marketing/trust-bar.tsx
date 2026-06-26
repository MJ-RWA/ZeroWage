const companies = ['Northwind', 'Meridian', 'Arclight', 'Cobalt DAO', 'Vantage', 'Helios']

export function TrustBar() {
  return (
    <section className="border-y border-border bg-card/30">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <p className="text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Trusted by modern teams paying across 40+ countries
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
          {companies.map((c) => (
            <span
              key={c}
              className="text-lg font-semibold tracking-tight text-muted-foreground/70"
            >
              {c}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
