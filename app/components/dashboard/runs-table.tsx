import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { StatusBadge } from '@/components/status-badge'
import { formatCurrency, type PayrollRun } from '@/lib/mock-data'

export function RunsTable({ runs }: { runs: PayrollRun[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-5 py-3 font-medium">Payroll run</th>
              <th className="px-5 py-3 font-medium">Run ID</th>
              <th className="px-5 py-3 text-right font-medium">Employees</th>
              <th className="px-5 py-3 text-right font-medium">Amount</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3" aria-label="Open" />
            </tr>
          </thead>
          <tbody>
            {runs.map((run) => (
              <tr
                key={run.id}
                className="group border-b border-border/70 transition-colors last:border-0 hover:bg-accent/40"
              >
                <td className="px-5 py-3.5">
                  <Link
                    href={`/dashboard/runs/${run.id}`}
                    className="font-medium text-foreground hover:text-primary"
                  >
                    {run.cycle}
                  </Link>
                  <p className="text-xs text-muted-foreground">{run.period}</p>
                </td>
                <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">
                  {run.id}
                </td>
                <td className="px-5 py-3.5 text-right font-mono text-foreground">
                  {run.employees}
                </td>
                <td className="px-5 py-3.5 text-right font-mono text-foreground">
                  {formatCurrency(run.totalAmount, run.asset)}
                </td>
                <td className="px-5 py-3.5">
                  <StatusBadge status={run.status} />
                </td>
                <td className="px-5 py-3.5 text-muted-foreground">
                  {new Date(run.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </td>
                <td className="px-5 py-3.5 text-right">
                  <Link
                    href={`/dashboard/runs/${run.id}`}
                    className="inline-flex text-muted-foreground transition-colors group-hover:text-foreground"
                    aria-label={`Open ${run.id}`}
                  >
                    <ChevronRight className="size-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
