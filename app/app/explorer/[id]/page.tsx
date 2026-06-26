import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ExternalLink, Cpu, Clock, Layers, Hash } from "lucide-react"
import { ExplorerHeader } from "@/components/explorer/explorer-header"
import { StatusBadge } from "@/components/status-badge"
import { CopyHash } from "@/components/copy-hash"
import { VerificationTimeline } from "@/components/proof/verification-timeline"
import { getProof, getRun, formatCurrency } from "@/lib/mock-data"

export default async function ProofDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const proof = getProof(id)
  if (!proof) notFound()
  const run = getRun(proof.runId)

  const metrics = [
    { label: "Proving system", value: "Groth16 (BN254)", icon: Cpu },
    { label: "Circuit", value: proof.circuit, icon: Hash },
    { label: "Constraints", value: proof.constraints.toLocaleString(), icon: Layers },
    { label: "Proving time", value: `${(proof.provingTimeMs / 1000).toFixed(2)}s`, icon: Clock },
    { label: "Verification time", value: `${proof.verificationTimeMs}ms`, icon: Clock },
    { label: "Stellar ledger", value: `#${proof.ledger.toLocaleString()}`, icon: Layers },
  ]

  return (
    <div className="min-h-screen">
      <ExplorerHeader />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/explorer"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to explorer
        </Link>

        <div className="mt-6 flex flex-col gap-4 border-b border-border pb-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="font-mono text-2xl font-semibold tracking-tight text-foreground">{proof.id}</h1>
              <StatusBadge status={proof.status} />
            </div>
            <p className="text-pretty text-sm text-muted-foreground">{proof.cycle}</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Settlement value</p>
            <p className="mt-1 font-mono text-xl font-semibold text-foreground">
              {run ? formatCurrency(run.totalAmount, run.asset) : "—"}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Proof hash</h2>
              <div className="mt-3">
                <CopyHash value={proof.hash} />
              </div>
              <div className="mt-3">
                <p className="mb-1 text-xs text-muted-foreground">On-chain transaction</p>
                <CopyHash value={proof.txHash} />
              </div>
            </section>

            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Public inputs</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                These values are publicly committed on-chain. Individual salaries remain private.
              </p>
              <div className="mt-3 overflow-hidden rounded-lg border border-border">
                <table className="w-full text-sm">
                  <tbody>
                    {proof.publicInputs.map((input, i) => (
                      <tr key={input.label} className={i % 2 === 0 ? "bg-card" : "bg-card/40"}>
                        <td className="border-r border-border px-4 py-3 font-mono text-xs text-muted-foreground">
                          {input.label}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-foreground">{input.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Verification lifecycle
              </h2>
              <div className="mt-4">
                <VerificationTimeline status={proof.status} baseTime={proof.generatedAt} />
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold text-foreground">Circuit metrics</h2>
              <dl className="mt-4 space-y-4">
                {metrics.map((m) => (
                  <div key={m.label} className="flex items-start gap-3">
                    <m.icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <dt className="text-xs text-muted-foreground">{m.label}</dt>
                      <dd className="truncate font-mono text-sm text-foreground">{m.value}</dd>
                    </div>
                  </div>
                ))}
              </dl>
            </div>

            {run && (
              <Link
                href={`/dashboard/runs/${run.id}`}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
              >
                <div>
                  <p className="text-xs text-muted-foreground">Linked payroll run</p>
                  <p className="mt-1 font-mono text-sm text-foreground">{run.id}</p>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </Link>
            )}
          </aside>
        </div>
      </main>
    </div>
  )
}
