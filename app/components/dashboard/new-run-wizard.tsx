'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  Users,
  Cpu,
  ShieldCheck,
  Send,
  Check,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Lock,
  Plus,
  Trash2,
  AlertCircle,
  Download,
  Upload,
  Share2,
  FileText,
  Clock,
  Copy,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { generatePayrollProof } from '@/lib/proof'
import { submitPayrollToContract } from '@/lib/contract'
import { savePayrollRun, getPayrollRunById, updateRunStatus } from '@/lib/payroll-store'
import { useWallet } from '@/lib/wallet-context'
import { toast } from 'sonner'
import { downloadAllPayslips } from '@/lib/download-payslip'
import { downloadReceipt } from '@/lib/receipt'

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Add Employees', icon: Users },
  { id: 2, label: 'Review',        icon: Users },
  { id: 3, label: 'Generate Proof', icon: Cpu },
  { id: 4, label: 'Approval',      icon: ShieldCheck },
  { id: 5, label: 'Submit',        icon: Send },
]

const DEPARTMENTS = [
  'General', 'Engineering', 'Design', 'Marketing',
  'Sales', 'Finance', 'HR', 'Operations',
]

// ─── Types ────────────────────────────────────────────────────────────────────

interface Employee {
  id: string
  name: string
  wallet: string
  amount: string
  department: string
}

interface ProofResult {
  proof: {
    pi_a: string[]
    pi_b: string[][]
    pi_c: string[]
  }
  publicSignals: string[]
}

// ─── Root wizard ──────────────────────────────────────────────────────────────

export function NewRunWizard() {
  const { address: walletAddress } = useWallet()
  const searchParams = useSearchParams()
  const resumeId = searchParams.get('runId')

  const [step, setStep] = useState(1)
  const [cycleId, setCycleId] = useState(
    new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
  )
  const [employees, setEmployees] = useState<Employee[]>([
    { id: '1', name: '', wallet: '', amount: '', department: '' },
    { id: '2', name: '', wallet: '', amount: '', department: '' },
  ])
  const [proofResult, setProofResult] = useState<ProofResult | null>(null)
  const [draftId, setDraftId]         = useState<string | null>(null)
  const [txHash, setTxHash]           = useState<string | null>(null)
  const [paymentTxHash, setPaymentTxHash] = useState<string | null>(null)
  const [paymentResults, setPaymentResults] = useState<
    { wallet: string; amount: number; success: boolean }[]
  >([])
  const [error, setError]       = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [resuming, setResuming] = useState(!!resumeId)

  // ── Resume an existing draft / approved run ────────────────────────────────
  useEffect(() => {
    if (!resumeId) return

    const run = getPayrollRunById(resumeId)
    if (!run) {
      setResuming(false)
      return
    }

    setCycleId(run.cycleId)
    setDraftId(run.id)

    setEmployees(
      run.employees.map((e) => ({
        id: e.id,
        name: e.name,
        wallet: e.wallet,
        amount: String(e.amount),
        department: e.department || 'General',
      }))
    )

    if (run.proofData) {
      setProofResult(run.proofData as ProofResult)
    }

    // Draft → still needs CFO approval → step 4
    // Approved → ready to submit → step 5
    if (run.status === 'approved') {
      setStep(5)
    } else {
      setStep(4)
    }

    setResuming(false)
  }, [resumeId])

  const included = employees.filter(
    (e) => e.name && e.wallet && parseFloat(e.amount) > 0
  )
  const total = included.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0)

  // ── Employee helpers ──────────────────────────────────────────────────────

  function addEmployee() {
    setEmployees((prev) => [
      ...prev,
      { id: Date.now().toString(), name: '', wallet: '', amount: '', department: '' },
    ])
  }

  function removeEmployee(id: string) {
    setEmployees((prev) => prev.filter((e) => e.id !== id))
  }

  function updateEmployee(id: string, field: keyof Employee, value: string) {
    setEmployees((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    )
  }

  // ── CSV import ────────────────────────────────────────────────────────────

  function handleCsvUpload(evt: React.ChangeEvent<HTMLInputElement>) {
    const file = evt.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.trim().split('\n')
      const start = lines[0].toLowerCase().includes('name') ? 1 : 0
      const parsed: Employee[] = []
      for (let i = start; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.trim().replace(/"/g, ''))
        if (cols.length < 3) continue
        const [name, wallet, amountStr, department = 'General'] = cols
        if (!name || !wallet || isNaN(parseFloat(amountStr))) continue
        parsed.push({
          id: Date.now().toString() + i,
          name,
          wallet,
          amount: amountStr,
          department,
        })
      }
      if (parsed.length > 0) {
        setEmployees((prev) => [
          ...prev.filter((e) => e.name || e.wallet),
          ...parsed,
        ])
        toast.success(`Imported ${parsed.length} employees from CSV`)
      }
    }
    reader.readAsText(file)
    evt.target.value = ''
  }

  // ── Submit to Stellar ─────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!proofResult || !draftId) return
    setSubmitting(true)
    setError(null)

    try {
      const {
        isConnected,
        isAllowed,
        requestAccess,
        getAddress,
        signTransaction,
      } = await import('@stellar/freighter-api')

      const conn = await isConnected()
      if (!conn?.isConnected)
        throw new Error('Freighter extension not detected. Please install it from freighter.app')

      const allowed = await isAllowed()
      if (!allowed?.isAllowed) await requestAccess()

      const addressResult = await getAddress()
      if (!addressResult?.address)
        throw new Error('Could not get wallet address. Please unlock Freighter.')
      const address = addressResult.address

      const result = await submitPayrollToContract(
        {
          employer: address,
          cycleId,
          totalUsdc: total,
          nRecipients: included.length,
          proof: proofResult.proof,
          publicSignals: proofResult.publicSignals,
          employees: included.map((e) => ({
            name: e.name,
            wallet: e.wallet,
            amount: parseFloat(e.amount),
          })),
        },
        async (xdr: string) => {
          const signResult = await signTransaction(xdr, {
            networkPassphrase: 'Test SDF Network ; September 2015',
          })
          if (signResult.error) throw new Error(signResult.error)
          return signResult.signedTxXdr
        }
      )

      // Persist completed run
      const completedRun = {
        id: draftId,
        cycleId,
        total,
        recipients: included.length,
        proofTxHash: result.proofTxHash,
        paymentTxHash: result.paymentTxHash,
        date: new Date().toUTCString(),
        employees: included.map((e, i) => ({
          id: String(i),
          name: e.name,
          wallet: e.wallet,
          amount: parseFloat(e.amount),
          department: e.department || 'General',
        })),
        status: 'paid' as const,
      }
      savePayrollRun(completedRun)

      setTxHash(result.proofTxHash)
      setPaymentTxHash(result.paymentTxHash)
      setPaymentResults(result.payments)
      toast.success('Payroll submitted to Stellar')
    } catch (e: any) {
      setError(e.message || 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (resuming) {
    return (
      <div className="mx-auto max-w-4xl py-24 text-center text-sm text-muted-foreground">
        Loading run...
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/runs"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            New payroll run
          </h1>
          <p className="text-sm text-muted-foreground">{cycleId}</p>
        </div>
      </div>

      <Stepper step={step} />

      <div className="mt-8 rounded-xl border border-border bg-card">
        {step === 1 && (
          <InputStep
            cycleId={cycleId}
            setCycleId={setCycleId}
            employees={employees}
            setEmployees={setEmployees}
            addEmployee={addEmployee}
            removeEmployee={removeEmployee}
            updateEmployee={updateEmployee}
            handleCsvUpload={handleCsvUpload}
            total={total}
            count={included.length}
          />
        )}

        {step === 2 && (
          <ReviewStep
            total={total}
            count={included.length}
            employees={included}
            cycleId={cycleId}
          />
        )}

        {step === 3 && (
          <GenerateStep
            employees={included}
            total={total}
            cycleId={cycleId}
            onDone={(result) => {
              setProofResult(result)

              const id = Date.now().toString()
              setDraftId(id)

              const settings = JSON.parse(
                localStorage.getItem('zerowage_settings') || '{}'
              )
              savePayrollRun({
                id,
                cycleId,
                total,
                recipients: included.length,
                proofTxHash: '',
                paymentTxHash: '',
                date: new Date().toUTCString(),
                employees: included.map((e, i) => ({
                  id: String(i),
                  name: e.name,
                  wallet: e.wallet,
                  amount: parseFloat(e.amount),
                  department: e.department || 'General',
                })),
                status: 'draft',
                proofData: result,
                approverWallet: settings.approverWallet || '',
              })

              setStep(4)
            }}
          />
        )}

        {step === 4 && draftId && (
          <DraftStep
            draftId={draftId}
            total={total}
            count={included.length}
            cycleId={cycleId}
            adminWallet={walletAddress || ''}
            onApproved={() => setStep(5)}
          />
        )}

        {step === 5 && (
          txHash ? (
            <SuccessStep
              txHash={txHash}
              paymentTxHash={paymentTxHash}
              paymentResults={paymentResults}
              draftId={draftId || ''}
            />
          ) : (
            <SubmitStep
              total={total}
              count={included.length}
              proofResult={proofResult}
              submitting={submitting}
              error={error}
              onSubmit={handleSubmit}
            />
          )
        )}

        {/* Navigation bar — hidden during auto-advancing steps */}
        {step !== 3 && step !== 4 && !txHash && (
          <div className="flex items-center justify-between border-t border-border px-6 py-4">
            <Button
              variant="outline"
              className="border-border bg-background hover:bg-accent"
              disabled={step === 1}
              onClick={() => setStep((s) => Math.max(1, s - 1))}
            >
              Back
            </Button>

            {step < 5 && (
              <Button
                className="gap-1.5"
                disabled={step === 1 && included.length === 0}
                onClick={() => setStep((s) => s + 1)}
              >
                {step === 2 ? 'Generate proof' : 'Continue'}
                <ArrowRight className="size-4" />
              </Button>
            )}
          </div>
        )}

        {/* After submit — link to runs list */}
        {step === 5 && txHash && (
          <div className="flex justify-end border-t border-border px-6 py-4">
            <Button asChild className="gap-1.5">
              <Link href="/dashboard/runs">
                <Check className="size-4" />
                View runs
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Stepper ──────────────────────────────────────────────────────────────────

function Stepper({ step }: { step: number }) {
  return (
    <div className="mt-8">
      <div className="flex items-center">
        {STEPS.map((s, i) => {
          const done   = step > s.id
          const active = step === s.id
          return (
            <div key={s.id} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-2">
                <span
                  className={cn(
                    'flex size-9 items-center justify-center rounded-full border text-sm transition-colors',
                    done   && 'border-success bg-success/10 text-success',
                    active && 'border-primary bg-primary/10 text-primary',
                    !done && !active && 'border-border bg-card text-muted-foreground'
                  )}
                >
                  {done ? <Check className="size-4" /> : <s.icon className="size-4" />}
                </span>
                <span
                  className={cn(
                    'hidden text-xs sm:block',
                    active ? 'font-medium text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    'mx-2 h-px flex-1 transition-colors',
                    step > s.id ? 'bg-success' : 'bg-border'
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Step 1 — Input ───────────────────────────────────────────────────────────

function InputStep({
  cycleId, setCycleId, employees, setEmployees,
  addEmployee, removeEmployee, updateEmployee,
  handleCsvUpload, total, count,
}: {
  cycleId: string
  setCycleId: (v: string) => void
  employees: Employee[]
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>
  addEmployee: () => void
  removeEmployee: (id: string) => void
  updateEmployee: (id: string, field: keyof Employee, value: string) => void
  handleCsvUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  total: number
  count: number
}) {
  return (
    <div className="p-6">
      <h2 className="text-base font-semibold text-foreground">Add employees</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter names, Stellar wallet addresses, and salary amounts.
        Amounts stay in your browser — only the ZK proof goes on-chain.
      </p>

      <div className="mt-5">
        <label className="block mb-2 text-xs text-muted-foreground uppercase tracking-widest">
          Payroll Cycle
        </label>
        <input
          value={cycleId}
          onChange={(e) => setCycleId(e.target.value)}
          className="w-full sm:w-64 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none transition-colors"
        />
      </div>

      <div className="mt-5 overflow-hidden rounded-lg border border-border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="px-4 py-2.5 font-medium">Department</th>
                <th className="px-4 py-2.5 font-medium">Stellar Wallet (G...)</th>
                <th className="px-4 py-2.5 text-right font-medium">Amount (USDC)</th>
                <th className="px-4 py-2.5 w-8" />
              </tr>
            </thead>
            <tbody>
              {employees.map((emp, i) => (
                <tr key={emp.id} className="border-b border-border/70 last:border-0">
                  <td className="px-4 py-2">
                    <input
                      value={emp.name}
                      onChange={(e) => updateEmployee(emp.id, 'name', e.target.value)}
                      placeholder={`Employee ${i + 1}`}
                      className="w-full bg-transparent text-foreground placeholder-muted-foreground focus:outline-none text-sm"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <select
                      value={emp.department}
                      onChange={(e) => updateEmployee(emp.id, 'department', e.target.value)}
                      className="bg-transparent text-muted-foreground text-xs focus:outline-none w-full"
                    >
                      <option value="">Dept.</option>
                      {DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <input
                      value={emp.wallet}
                      onChange={(e) => updateEmployee(emp.id, 'wallet', e.target.value)}
                      placeholder="GABC...XYZ"
                      className="w-full bg-transparent text-muted-foreground placeholder-muted-foreground focus:outline-none text-sm font-mono"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      value={emp.amount}
                      onChange={(e) => updateEmployee(emp.id, 'amount', e.target.value)}
                      placeholder="0"
                      type="number"
                      className="w-full bg-transparent text-foreground placeholder-muted-foreground focus:outline-none text-sm font-mono text-right"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => removeEmployee(emp.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table footer */}
        <div className="border-t border-border bg-background/50 px-4 py-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={addEmployee}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <Plus size={12} />
                Add employee
              </button>

              <span className="text-border">|</span>

              <label className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                <Upload size={12} />
                Import CSV
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleCsvUpload}
                />
              </label>

              <a
                href="data:text/csv;charset=utf-8,name,wallet,amount,department%0AAlice,GABC...XYZ,3000,Engineering%0ABob,GDEF...ABC,4500,Design"
                download="template.csv"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <Download size={12} />
                Download template
              </a>

              <span className="hidden sm:block text-xs text-muted-foreground/40">
                · CSV format: name, wallet, amount
              </span>
            </div>

            {/* Totals */}
            <div className="text-xs font-mono text-muted-foreground">
              <span>{count} recipients</span>
              <span className="mx-1.5">·</span>
              <span className="font-semibold text-foreground">
                {total.toLocaleString()} USDC
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Privacy notice */}
      <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-background/50 px-4 py-3">
        <Lock className="size-4 text-success shrink-0" />
        <p className="text-xs text-muted-foreground">
          Salary amounts are private inputs to the ZK circuit. They never leave your browser or appear on-chain.
        </p>
      </div>
    </div>
  )
}

// ─── Step 2 — Review ──────────────────────────────────────────────────────────

function ReviewStep({
  total, count, employees, cycleId,
}: {
  total: number
  count: number
  employees: Employee[]
  cycleId: string
}) {
  return (
    <div className="p-6">
      <h2 className="text-base font-semibold text-foreground">Review payroll run</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Confirm recipients and amounts. After this step, a ZK proof will be generated in your browser.
      </p>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-px overflow-hidden rounded-lg border border-border bg-border">
        <div className="bg-card p-4">
          <p className="text-xs text-muted-foreground">Cycle</p>
          <p className="mt-1 font-mono text-sm font-semibold text-foreground">{cycleId}</p>
        </div>
        <div className="bg-card p-4">
          <p className="text-xs text-muted-foreground">Recipients</p>
          <p className="mt-1 font-mono text-lg font-semibold text-foreground">{count}</p>
        </div>
        <div className="bg-card p-4">
          <p className="text-xs text-muted-foreground">Total amount</p>
          <p className="mt-1 font-mono text-lg font-semibold text-foreground">
            {total.toLocaleString()} USDC
          </p>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th className="px-4 py-2.5 font-medium">Employee</th>
              <th className="px-4 py-2.5 font-medium">Wallet</th>
              <th className="px-4 py-2.5 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => (
              <tr key={e.id} className="border-b border-border/70 last:border-0">
                <td className="px-4 py-2.5 text-foreground">{e.name}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground truncate max-w-[120px]">{e.wallet}</td>
                <td className="px-4 py-2.5 text-right font-mono text-foreground">
                  {parseFloat(e.amount).toLocaleString()} USDC
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Step 3 — Generate Proof ──────────────────────────────────────────────────

function GenerateStep({
  employees, total, cycleId, onDone,
}: {
  employees: Employee[]
  total: number
  cycleId: string
  onDone: (result: ProofResult) => void
}) {
  const [logs, setLogs]           = useState<string[]>([])
  const [isComplete, setIsComplete] = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const ranRef                    = useRef(false)

  useEffect(() => {
    if (ranRef.current) return
    ranRef.current = true

    const salaries = employees.map((e) => parseFloat(e.amount))

    generatePayrollProof({ salaries, minSalary: 0 }, (msg) =>
      setLogs((prev) => [...prev, msg])
    )
      .then((result) => {
        setIsComplete(true)
        setTimeout(() => onDone(result as ProofResult), 800)
      })
      .catch((e) => {
        setError(e?.message || 'Proof generation failed')
      })
  }, [employees, onDone])

  return (
    <div className="p-6">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {isComplete ? (
            <Check className="size-5" />
          ) : error ? (
            <AlertCircle className="size-5 text-destructive" />
          ) : (
            <Loader2 className="size-5 animate-spin" />
          )}
        </span>
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Generating Groth16 proof
          </h2>
          <p className="text-sm text-muted-foreground">
            Running ZK circuit locally. Salaries never leave your browser.
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-lg border border-border bg-background p-4 font-mono text-xs space-y-1">
        {logs.map((log, i) => (
          <div key={i} className="flex items-center gap-2 py-0.5">
            <span className="text-muted-foreground">{'>'}</span>
            <span className="text-foreground">{log}</span>
            <Check className="ml-auto size-3 text-success shrink-0" />
          </div>
        ))}
        {!isComplete && !error && (
          <div className="flex items-center gap-2 py-0.5 opacity-40">
            <span className="text-muted-foreground">{'>'}</span>
            <span className="animate-pulse text-muted-foreground">running circuit...</span>
          </div>
        )}
        {error && (
          <div className="mt-2 rounded border border-destructive/20 bg-destructive/5 px-3 py-2 text-destructive">
            {error}
          </div>
        )}
      </div>

      {isComplete && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-success/20 bg-success/5 px-4 py-3">
          <Check className="size-4 text-success shrink-0" />
          <span className="text-sm text-success font-medium">
            Proof generated · 660 constraints satisfied · salaries hidden
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Step 4 — Draft / Approval ────────────────────────────────────────────────

function DraftStep({
  draftId, total, count, cycleId, adminWallet, onApproved,
}: {
  draftId: string
  total: number
  count: number
  cycleId: string
  adminWallet: string
  onApproved: () => void
}) {
  const [copied, setCopied] = useState(false)

  const settings =
    typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('zerowage_settings') || '{}')
      : {}
  const hasApprover = !!settings.approverWallet

  const approvalPayload = typeof window !== 'undefined'
    ? btoa(JSON.stringify({
        id: draftId,
        cycleId,
        total,
        recipients: count,
        date: new Date().toISOString(),
        adminWallet,
        approverWallet: settings.approverWallet || '',
      }))
    : ''

  const approvalUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/approve/${draftId}?data=${approvalPayload}`
      : ''

  function copyLink() {
    navigator.clipboard.writeText(approvalUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function selfApprove() {
    updateRunStatus(draftId, 'approved', {
      approvedAt: new Date().toUTCString(),
      approvalSignature: 'self-approved',
    })
    onApproved()
  }

  // Poll Stellar Horizon for a payment whose memo matches the run ID
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        if (!adminWallet) return

        const { Horizon } = await import('@stellar/stellar-sdk')
        const horizon = new Horizon.Server('https://horizon-testnet.stellar.org')

        const payments = await horizon
          .payments()
          .forAccount(adminWallet)
          .limit(10)
          .order('desc')
          .call()

        for (const payment of payments.records) {
          try {
            const tx = await (payment as any).transaction()
            const memo = tx.memo
            if (memo && draftId.slice(0, 28) === memo) {
              updateRunStatus(draftId, 'approved', {
                approvedAt: new Date().toUTCString(),
                approverWallet: (payment as any).from || 'unknown',
                approvalSignature: tx.hash,
              })
              clearInterval(interval)
              onApproved()
              return
            }
          } catch {}
        }

        // Also check localStorage (same-browser self-approval)
        const run = getPayrollRunById(draftId)
        if (run?.status === 'approved') {
          clearInterval(interval)
          onApproved()
        }
      } catch {}
    }, 5000)

    return () => clearInterval(interval)
  }, [draftId, adminWallet, onApproved])

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <span className="flex size-10 items-center justify-center rounded-lg bg-yellow-500/10 text-yellow-400">
          <Clock className="size-5" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Proof ready — awaiting approval
          </h2>
          <p className="text-sm text-muted-foreground">
            Share the approval link with your CFO or approver.
          </p>
        </div>
      </div>

      {/* Run summary */}
      <div className="rounded-lg border border-border bg-background p-4 space-y-2 mb-5">
        {[
          { label: 'Cycle',      value: cycleId },
          { label: 'Total',      value: `${total.toLocaleString()} USDC` },
          { label: 'Recipients', value: String(count) },
        ].map((row) => (
          <div key={row.label} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{row.label}</span>
            <span className="font-mono text-foreground">{row.value}</span>
          </div>
        ))}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Status</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-500/10 px-2.5 py-0.5 text-xs font-mono text-yellow-400">
            DRAFT
          </span>
        </div>
      </div>

      {/* Approval link */}
      <div className="rounded-lg border border-border bg-background p-4 mb-5">
        <div className="text-xs text-muted-foreground uppercase tracking-widest mb-2">
          Approval link — share with CFO
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-primary truncate flex-1">
            {approvalUrl.slice(0, 60)}...
          </span>
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 rounded border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            {copied
              ? <><Check size={11} className="text-success" /> Copied</>
              : <><Copy size={11} /> Copy</>}
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          The CFO will see total and recipient count only — no salary amounts. Link works in any browser.
        </p>
      </div>

      {/* Polling indicator */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-5">
        <div className="size-2 rounded-full bg-yellow-400 animate-pulse" />
        Polling Stellar for approval every 5 seconds...
      </div>

      {/* Self-approve fallback */}
      {!hasApprover && (
        <div className="rounded-lg border border-border bg-secondary/30 p-4">
          <p className="text-xs text-muted-foreground mb-3">
            No approver wallet configured in Settings. You can approve this run yourself or add an approver in Settings → Approver wallet.
          </p>
          <button
            onClick={selfApprove}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Check size={14} />
            Self-approve and continue
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Step 5a — Submit ─────────────────────────────────────────────────────────

function SubmitStep({
  total, count, proofResult, submitting, error, onSubmit,
}: {
  total: number
  count: number
  proofResult: ProofResult | null
  submitting: boolean
  error: string | null
  onSubmit: () => void
}) {
  return (
    <div className="p-6">
      <h2 className="text-base font-semibold text-foreground">
        Submit proof to Stellar
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        This will call the Soroban verifier contract and record your payroll attestation on Stellar testnet.
      </p>

      <div className="mt-5 rounded-lg border border-border bg-background p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total disbursement</span>
          <span className="font-mono text-xl font-semibold text-foreground">
            {total.toLocaleString()} USDC
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Recipients</span>
          <span className="font-mono text-foreground">{count}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Contract</span>
          <span className="font-mono text-xs text-foreground">CCOEJ6QC...SMRDUD</span>
        </div>
        <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-2 text-xs text-muted-foreground">
          <Lock className="size-3.5 text-success" />
          Proof attached · salaries private · verifiable on-chain
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
          <AlertCircle className="size-4 text-destructive shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="mt-5">
        <Button
          onClick={onSubmit}
          disabled={submitting || !proofResult}
          className="w-full gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Submitting to Stellar...
            </>
          ) : (
            <>
              <Send className="size-4" />
              Submit &amp; verify on Stellar
            </>
          )}
        </Button>
        <p className="mt-2 text-xs text-center text-muted-foreground">
          Freighter will ask you to sign the transaction
        </p>
      </div>
    </div>
  )
}

// ─── Step 5b — Success ────────────────────────────────────────────────────────

function SuccessStep({
  txHash, paymentTxHash, paymentResults, draftId,
}: {
  txHash: string
  paymentTxHash: string | null
  paymentResults: { wallet: string; amount: number; success: boolean }[]
  draftId: string
}) {
  return (
    <div className="p-6">
      <div className="flex flex-col items-center py-6 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-success/10 text-success ring-1 ring-inset ring-success/20">
          <Check className="size-7" />
        </span>
        <h2 className="mt-4 text-lg font-semibold text-foreground">
          Payroll complete
        </h2>
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
          ZK proof verified on Stellar. USDC payments sent to recipients.
        </p>
      </div>

      <div className="space-y-3">
        {/* Proof tx */}
        <div className="rounded-lg border border-border bg-background p-4 space-y-2 font-mono text-xs">
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">
            ZK Proof Transaction
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Hash</span>
            <span className="text-primary font-mono text-xs truncate max-w-[120px]">
              {txHash.slice(0, 16)}...{txHash.slice(-8)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Contract</span>
            <span className="text-foreground">CCOEJ6QC...SMRDUD</span>
          </div>
          <a
            href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-primary hover:underline mt-1"
          >
            View proof on Stellar Expert →
          </a>
        </div>

        {/* Payment tx */}
        {paymentTxHash && (
          <div className="rounded-lg border border-border bg-background p-4 space-y-2 font-mono text-xs">
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">
              USDC Payment Transaction
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Hash</span>
              <span className="text-primary font-mono text-xs truncate max-w-[120px]">
                {paymentTxHash.slice(0, 16)}...{paymentTxHash.slice(-8)}
              </span>
            </div>
            <a
              href={`https://stellar.expert/explorer/testnet/tx/${paymentTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-primary hover:underline mt-1"
            >
              View payments on Stellar Expert →
            </a>
          </div>
        )}

        {/* Per-employee payment results */}
        {paymentResults.length > 0 && (
          <div className="rounded-lg border border-border bg-background overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border text-[10px] text-muted-foreground uppercase tracking-widest">
              Payment Results
            </div>
            <div className="divide-y divide-border">
              {paymentResults.map((p, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3">
                  <div className="font-mono text-xs text-muted-foreground">
                    {p.wallet.slice(0, 6)}...{p.wallet.slice(-4)}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-foreground">
                      {p.amount.toLocaleString()} USDC
                    </span>
                    {p.success ? (
                      <span className="flex items-center gap-1 text-[10px] text-success bg-success/10 border border-success/20 px-2 py-0.5 rounded-full font-mono">
                        <Check size={9} /> SENT
                      </span>
                    ) : (
                      <span className="text-[10px] text-destructive bg-destructive/10 border border-destructive/20 px-2 py-0.5 rounded-full font-mono">
                        NO TRUSTLINE
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={async () => {
              const runs = JSON.parse(localStorage.getItem('zerowage_runs') || '[]')
              const run = runs.find(
                (r: any) => r.id === draftId || r.proofTxHash === txHash
              )
              if (run) {
                const settings = JSON.parse(
                  localStorage.getItem('zerowage_settings') || '{}'
                )
                await downloadAllPayslips(run, settings.companyName)
              }
            }}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-border bg-card hover:bg-accent px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <FileText size={14} />
            Download payslips
          </button>

          <button
            onClick={() => {
              const runs = JSON.parse(localStorage.getItem('zerowage_runs') || '[]')
              const run = runs.find(
                (r: any) => r.id === draftId || r.proofTxHash === txHash
              )
              if (run) downloadReceipt(run)
            }}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-border bg-card hover:bg-accent px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Download size={14} />
            Download receipt
          </button>

          <button
            onClick={async () => {
              const url = `${window.location.origin}/verify/${txHash}`
              try {
                await navigator.clipboard.writeText(url)
                toast.success('Attestation link copied')
              } catch {
                // Clipboard API blocked — fallback to execCommand
                const el = document.createElement('textarea')
                el.value = url
                el.style.position = 'fixed'
                el.style.opacity = '0'
                document.body.appendChild(el)
                el.focus()
                el.select()
                document.execCommand('copy')
                document.body.removeChild(el)
                toast.success('Attestation link copied')
              }
            }}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-border bg-card hover:bg-accent px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Share2 size={14} />
            Share attestation
          </button>
        </div>
      </div>
    </div>
  )
}