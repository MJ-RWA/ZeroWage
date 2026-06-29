'use client'

import { useState, useEffect } from 'react'
import { EyeOff, Users, RefreshCw } from 'lucide-react'
import { getPayrollRuns } from '@/lib/payroll-store'

interface EmployeeRecord {
  name: string
  wallet: string
  latestAmount: number
  latestCycle: string
  latestDate: string
  department: string
  runsCount: number
  totalPaid: number
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeRecord[]>([])
  const [filter, setFilter] = useState('All')

  useEffect(() => {
    load()
  }, [])

  function load() {
  const runs = getPayrollRuns().filter((r) => r.status === 'paid')
  const map = new Map<string, EmployeeRecord>()

  for (const run of runs) {
    for (const emp of run.employees) {
      if (!emp.wallet) continue
      const existing = map.get(emp.wallet)
      if (existing) {
        // Update with latest run data
        existing.latestAmount = emp.amount
        existing.latestCycle = run.cycleId
        existing.latestDate = run.date
        existing.runsCount += 1
        existing.totalPaid += emp.amount  // accumulate across paid runs
        if (emp.department) existing.department = emp.department
      } else {
        map.set(emp.wallet, {
          name: emp.name || 'Unknown',
          wallet: emp.wallet,
          latestAmount: emp.amount,
          latestCycle: run.cycleId,
          latestDate: run.date,
          department: emp.department || 'General',
          runsCount: 1,
          totalPaid: emp.amount,
        })
      }
    }
  }

  setEmployees(Array.from(map.values()))
}

  const departments = ['All', ...Array.from(new Set(employees.map((e) => e.department)))]
  const filtered = filter === 'All' ? employees : employees.filter((e) => e.department === filter)

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Employees
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {employees.length} team member{employees.length !== 1 ? 's' : ''} across{' '}
            {departments.length - 1} department{departments.length !== 2 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw size={12} />
          Refresh
        </button>
      </div>

      {/* Department filter */}
      {departments.length > 2 && (
        <div className="mt-4 flex gap-2 flex-wrap">
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => setFilter(dept)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filter === dept
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-xs text-muted-foreground">
        <EyeOff className="size-4 text-primary shrink-0" />
        Salary amounts are ZK circuit private inputs — they never appear on-chain.
        Only totals are recorded on Stellar.
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
                  <th className="px-5 py-3 font-medium">Employee</th>
                  <th className="px-5 py-3 font-medium">Department</th>
                  <th className="px-5 py-3 font-medium">Stellar Wallet</th>
                  <th className="px-5 py-3 text-right font-medium">Latest Salary</th>
                  <th className="px-5 py-3 text-right font-medium">Total Paid</th>
                  <th className="px-5 py-3 font-medium">Last Paid</th>
                  <th className="px-5 py-3 font-medium">Runs</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp) => (
                  <tr
                    key={emp.wallet}
                    className="border-b border-border/70 transition-colors last:border-0 hover:bg-accent/40"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-foreground shrink-0">
                          {emp.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                        </span>
                        <span className="font-medium text-foreground">{emp.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex rounded-full bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground">
                        {emp.department}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">
                      {emp.wallet.slice(0, 8)}...{emp.wallet.slice(-6)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-semibold text-foreground">
                      {emp.latestAmount.toLocaleString()} USDC
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-foreground">
                      {emp.totalPaid.toLocaleString()} USDC
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground">
                      {new Date(emp.latestDate).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-foreground">
                      {emp.runsCount}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success ring-1 ring-inset ring-success/20">
                        Active
                      </span>
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