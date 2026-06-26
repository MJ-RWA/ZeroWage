'use client'

import { useState, useEffect } from 'react'
import { EyeOff, Users } from 'lucide-react'
import { getPayrollRuns } from '@/lib/payroll-store'
import { downloadPayslip } from '@/lib/download-payslip'
import { FileText } from 'lucide-react'

interface Employee {
  id: string
  name: string
  wallet: string
  amount: number
  cycleId: string
  date: string
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])

  useEffect(() => {
    const runs = getPayrollRuns()
    // Build unique employee list from most recent run
    // If same wallet appears across runs, take latest
    const seen = new Map<string, Employee>()
    for (const run of runs) {
      for (const emp of run.employees) {
        if (!seen.has(emp.wallet)) {
          seen.set(emp.wallet, {
            id: emp.id,
            name: emp.name,
            wallet: emp.wallet,
            amount: emp.amount,
            cycleId: run.cycleId,
            date: run.date,
          })
        }
      }
    }
    setEmployees(Array.from(seen.values()))
  }, [])

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Employees
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {employees.length} team member{employees.length !== 1 ? 's' : ''} from your payroll runs.
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-xs text-muted-foreground">
        <EyeOff className="size-4 text-primary shrink-0" />
        Salary amounts are committed inside the ZK proof circuit and visible
        only to authorized admins. They never appear on-chain.
      </div>

      {employees.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-border py-20 text-center">
          <Users className="size-10 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">No employees yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Employees appear here after you create a payroll run
          </p>
        </div>
      ) : (
        <div className="mt-5 overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Stellar wallet</th>
                  <th className="px-5 py-3 text-right font-medium">
                    Last salary
                  </th>
                  <th className="px-5 py-3 font-medium">Last paid</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-2.5 font-medium">Payslip</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr
                    key={emp.wallet}
                    className="border-b border-border/70 transition-colors last:border-0 hover:bg-accent/40"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-xs font-medium text-foreground shrink-0">
                          {emp.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)}
                        </span>
                        <span className="font-medium text-foreground">
                          {emp.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">
                      {emp.wallet.slice(0, 8)}...{emp.wallet.slice(-6)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-semibold text-foreground">
                      {emp.amount.toLocaleString()} USDC
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground">
                      {new Date(emp.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success ring-1 ring-inset ring-success/20">
                        Active
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                    <button
                    onClick={() => {
                    const name = JSON.parse(
                  localStorage.getItem('zerowage_settings') || '{}'
                  ).companyName
                  const runs = getPayrollRuns()
                  const found = runs.find((r) => r.employees.some((e) => e.wallet === emp.wallet))
                  if (!found) return
                   downloadPayslip(emp, found, name)
                      }}
                     className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                    >
                  <FileText size={11} />
                  PDF
                 </button>
                  </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}