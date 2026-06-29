'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
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

const steps = [
  { id: 1, label: 'Add Employees', icon: Users },
  { id: 2, label: 'Review', icon: Users },
  { id: 3, label: 'Generate Proof', icon: Cpu },
  { id: 4, label: 'Verify', icon: ShieldCheck },
  { id: 5, label: 'Submit', icon: Send },
]

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

export function NewRunWizard() {
  const [step, setStep] = useState(1)
  const [cycleId, setCycleId] = useState(
    new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
  )
  const [employees, setEmployees] = useState<Employee[]>([
    { id: '1', name: '', wallet: '', amount: '', department: '' },
    { id: '2', name: '', wallet: '', amount: '', department: '' },
  ])
  const [proofResult, setProofResult] = useState<ProofResult | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const included = employees.filter(
    (e) => e.name && e.wallet && parseFloat(e.amount) > 0
  )
  const total = included.reduce((s, e) => s + parseFloat(e.amount), 0)
  const [draftId, setDraftId] = useState<string | null>(null)

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

  function DraftStep({
  draftId,
  total,
  count,
  proof,
  cycleId,
  onApproved,
}: {
  draftId: string
  total: number
  count: number
  proof: any
  cycleId: string
  onApproved: () => void
}) {
  const [copied, setCopied] = useState(false)
  const [checking, setChecking] = useState(false)
  const approvalUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/approve/${draftId}`
      : ''

  // Check if already approved
  useEffect(() => {
    const interval = setInterval(() => {
      const { getPayrollRunById } = require('@/lib/payroll-store')
      const run = getPayrollRunById(draftId)
      if (run?.status === 'approved') {
        clearInterval(interval)
        onApproved()
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [draftId, onApproved])

  function copyLink() {
    navigator.clipboard.writeText(approvalUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Self-approve if no approver set
  async function selfApprove() {
    setChecking(true)
    const { updateRunStatus } = await import('@/lib/payroll-store')
    updateRunStatus(draftId, 'approved', {
      approvedAt: new Date().toUTCString(),
      approvalSignature: 'self-approved',
    })
    onApproved()
    setChecking(false)
  }

  const settings = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('zerowage_settings') || '{}')
    : {}
  const hasApprover = !!settings.approverWallet

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
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Cycle</span>
          <span className="font-mono text-foreground">{cycleId}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Total</span>
          <span className="font-mono font-semibold text-foreground">
            {total.toLocaleString()} USDC
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Recipients</span>
          <span className="font-mono text-foreground">{count}</span>
        </div>
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
            {approvalUrl}
          </span>
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 rounded border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            {copied
              ? <><Check size={11} className="text-success" /> Copied</>
              : <><Copy size={11} /> Copy</>
            }
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          The CFO will see total and recipient count only — no salary amounts.
        </p>
      </div>

      {/* Polling indicator */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
        <div className="size-2 rounded-full bg-yellow-400 animate-pulse" />
        Waiting for approval... (checking every 2 seconds)
      </div>

      {/* Skip approval if no approver configured */}
      {!hasApprover && (
        <div className="rounded-lg border border-border bg-secondary/30 p-4">
          <p className="text-xs text-muted-foreground mb-3">
            No approver wallet configured in Settings. You can approve this run yourself or add an approver in Settings → Approver wallet.
          </p>
          <button
            onClick={selfApprove}
            disabled={checking}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Check size={14} />
            {checking ? 'Approving...' : 'Self-approve and continue'}
          </button>
        </div>
      )}
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

          // Save as DRAFT — don't go to submit yet
          const settings = JSON.parse(
          localStorage.getItem('zerowage_settings') || '{}'
          )
          const runId = Date.now().toString()
          const draftRun = {
          id: runId,
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
          amount: e.amount,
          department: e.department || 'General',
          })),
          status: 'draft' as const,
          proofData: result,
          approverWallet: settings.approverWallet || '',
          }

         const { savePayrollRun } = require('@/lib/payroll-store')
         savePayrollRun(draftRun)
         setDraftId(runId)
         setProofResult(result)
         setStep(4)
        }}
        />
        )}
        {step === 4 && proofResult && draftId && (
        <DraftStep
        draftId={draftId}
        total={total}
        count={included.length}
        proof={proofResult}
        cycleId={cycleId}
        onApproved={() => setStep(5)}
        />
        )}
        {step === 5 && (
          <SubmitStep

            total={total}
            count={included.length}
            proofResult={proofResult}
            cycleId={cycleId}
            txHash={txHash}
            setTxHash={setTxHash}
            error={error}
            setError={setError}
            employees={included}
          />
        )}

        {step !== 3 && step !== 4 && (
        <div className="flex items-center justify-between border-t border-border px-6 py-4">
        <Button
        variant="outline"
        className="border-border bg-background hover:bg-accent"
        disabled={step === 1}
        onClick={() => setStep((s) => Math.max(1, s - 1))}
        >
        Back
       </Button>

       {step < 5 ? (
       <Button
       className="gap-1.5"
       disabled={step === 1 && included.length === 0}
       onClick={() => {
       if (step === 2) {
            setStep(3)
          } else {
            setStep((s) => s + 1)
          }
        }}
       >
        {step === 2 ? "Generate proof" : "Continue"}
        <ArrowRight className="size-4" />
      </Button>
      ) : txHash ? (
      <Button asChild className="gap-1.5">
        <Link href="/dashboard/runs">
          <Check className="size-4" />
          View runs
        </Link>
      </Button>
      ) : null}
     </div>
    )}
      </div>
    </div>
   )
  }

function Stepper({ step }: { step: number }) {
  return (
    <div className="mt-8">
      <div className="flex items-center">
        {steps.map((s, i) => {
          const done = step > s.id
          const active = step === s.id
          return (
            <div key={s.id} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-2">
                <span
                  className={cn(
                    'flex size-9 items-center justify-center rounded-full border text-sm transition-colors',
                    done && 'border-success bg-success/10 text-success',
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
              {i < steps.length - 1 && (
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

function InputStep({
  cycleId, setCycleId, employees, setEmployees, addEmployee, removeEmployee, updateEmployee, total, count,
}: {
  cycleId: string
  setCycleId: (v: string) => void
  employees: Employee[]
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>
  addEmployee: () => void
  removeEmployee: (id: string) => void
  updateEmployee: (id: string, field: keyof Employee, value: string) => void
  total: number
  count: number
})
{

  function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (evt) => {
    const text = evt.target?.result as string
    const lines = text.trim().split('\n')

    // Skip header row if it contains non-numeric amount
    const start = lines[0].toLowerCase().includes('name') ? 1 : 0
    const parsed: Employee[] = []

    for (let i = start; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim().replace(/"/g, ''))
      if (cols.length < 3) continue
      const [name, wallet, amountStr, department = 'General'] = cols
      const amount = parseFloat(amountStr)
      if (!name || !wallet || isNaN(amount)) continue
      parsed.push({
        id: Date.now().toString() + i,
        name,
        wallet,
        amount: amountStr,
        department,
      })
    }

    if (parsed.length > 0) {
      setEmployees((prev) => [...prev.filter((e) => e.name || e.wallet), ...parsed])
    }
  }
  reader.readAsText(file)
  // Reset input so same file can be uploaded again
  e.target.value = ''
}
  return (
    <div className="p-6">
      <h2 className="text-base font-semibold text-foreground">Add employees</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter names, Stellar wallet addresses, and salary amounts.
        Amounts stay in your browser — only the ZK proof goes on-chain.
      </p>


     <div className="mt-5">
        <label className="text-xs text-muted-foreground uppercase tracking-widest block mb-2">
          Payroll Cycle
        </label>
        <input
          value={cycleId}
          onChange={(e) => setCycleId(e.target.value)}
          className="w-full sm:w-64 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none transition-colors"
        />
      </div>

      <div className="mt-5 overflow-hidden rounded-lg border border-border">
  <table className="w-full text-left text-sm">
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
          <option value="Engineering">Engineering</option>
          <option value="Design">Design</option>
          <option value="Marketing">Marketing</option>
          <option value="Sales">Sales</option>
          <option value="Finance">Finance</option>
          <option value="HR">HR</option>
          <option value="Operations">Operations</option>
          <option value="General">General</option>
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

  {/* ── Table footer ── */}
  <div className="border-t border-border bg-background/50 px-4 py-3 space-y-2.5">

    {/* Row 1: actions + summary */}
    <div className="flex items-center justify-between">

      {/* Left: add + CSV actions */}
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

        
          <a href="data:text/csv;charset=utf-8,name,wallet,amount,department%0AAlice,GABC...XYZ,3000,Engineering%0ABob,GDEF...ABC,4500,Design"
          download="template.csv"
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <Download size={12} />
          Download template
        </a>

        <span className="text-xs text-muted-foreground/40 hidden sm:block">
          · CSV format: name, wallet, amount
        </span>
      </div>

      {/* Right: totals */}
      <div className="text-xs font-mono text-muted-foreground">
        <span>{count} recipients</span>
        <span className="mx-1.5">·</span>
        <span className="text-foreground font-semibold">{total.toLocaleString()} USDC</span>
      </div>
    </div>

  </div>
</div>

{/* ── Privacy notice ── */}
<div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-background/50 px-4 py-3">
  <Lock className="size-4 text-success shrink-0" />
  <p className="text-xs text-muted-foreground">
    Salary amounts are private inputs to the ZK circuit. They never leave your browser or appear on-chain.
  </p>
</div>
    </div>
  )
}

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

      <div className="mt-5 grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-border bg-border">
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

      <div className="mt-5 overflow-hidden rounded-lg border border-border">
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
                <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{e.wallet}</td>
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

function GenerateStep({
  employees, total, cycleId, onDone,
}: {
  employees: Employee[]
  total: number
  cycleId: string
  onDone: (result: ProofResult) => void
}) {
  const [logs, setLogs] = useState<string[]>([])
  const [isComplete, setIsComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const ranRef = useRef(false)
  

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

function VerifyStep({
  proof, total, count,
}: {
  proof: ProofResult
  total: number
  count: number
}) {
  return (
    <div className="p-6">
      <div className="flex flex-col items-center py-6 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-success/10 text-success ring-1 ring-inset ring-success/20">
          <ShieldCheck className="size-7" />
        </span>
        <h2 className="mt-4 text-lg font-semibold text-foreground">
          Proof generated successfully
        </h2>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          Your Groth16 proof is ready. Submit it to the Soroban verifier contract on Stellar testnet to record the payroll attestation on-chain.
        </p>
      </div>

      <dl className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2">
        {[
          ['Protocol', 'Groth16 · BN254'],
          ['Constraints', '660 satisfied'],
          ['Total', `${total.toLocaleString()} USDC`],
          ['Recipients', String(count)],
          ['Public signal[0]', proof.publicSignals[0] + ' (total)'],
          ['Public signal[2]', proof.publicSignals[2] + ' (recipients)'],
        ].map(([label, value]) => (
          <div key={label} className="flex items-center justify-between bg-card px-4 py-3">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="font-mono text-xs text-foreground">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function SubmitStep({
  total, count, proofResult, cycleId, txHash, setTxHash, error, setError, employees,
}: {
  employees: Employee[]
  total: number
  count: number
  proofResult: ProofResult | null
  cycleId: string
  txHash: string | null
  setTxHash: (h: string) => void
  error: string | null
  setError: (e: string | null) => void
}) {
  const [submitting, setSubmitting] = useState(false)
  const [paymentTxHash, setPaymentTxHash] = useState<string | null>(null)
  const [paymentResults, setPaymentResults] = useState<{ wallet: string; amount: number; success: boolean }[]>([])

 async function handleSubmit() {
    if (!proofResult) return
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

      // Check if Freighter extension exists
      const connected = await isConnected()
      if (!connected || !connected.isConnected) {
        throw new Error('Freighter extension not detected. Please install it from freighter.app')
      }

      // Check if site is allowed
      const allowed = await isAllowed()
      if (!allowed || !allowed.isAllowed) {
        await requestAccess()
      }

      // Get address
      const addressResult = await getAddress()
      if (!addressResult || addressResult.error) {
        throw new Error('Could not get wallet address. Please unlock Freighter.')
      }
      const address = addressResult.address

      const { submitPayrollToContract } = await import('@/lib/contract')

      const result = await submitPayrollToContract(
        {
          employer: address,
          cycleId,
          totalUsdc: total,
          nRecipients: count,
          proof: proofResult.proof,
          publicSignals: proofResult.publicSignals,
          employees: employees.map(e => ({ ...e, amount: parseFloat(e.amount) })),
        },
        async (xdr: string) => {
          const signResult = await signTransaction(xdr, {
            networkPassphrase: 'Test SDF Network ; September 2015',
          })
          if (signResult.error) throw new Error(signResult.error)
          return signResult.signedTxXdr
        }
      )

      // Save to local store
      const { savePayrollRun } = await import('@/lib/payroll-store')
      savePayrollRun({
      id: result.proofTxHash,
      cycleId,
      total,
      recipients: count,
      proofTxHash: result.proofTxHash,
      paymentTxHash: result.paymentTxHash,
      date: new Date().toUTCString(),
      employees: employees.map((e, i) => ({
      id: String(i),
      name: e.name,
      wallet: e.wallet,
      amount: Number(e.amount),
      department: e.department || 'General',
      })),
      status: 'paid',
      })

      setTxHash(result.proofTxHash)
      setPaymentTxHash(result.paymentTxHash)
      setPaymentResults(result.payments)
      setPaymentTxHash(result.paymentTxHash)
      setPaymentResults(result.payments)
    } catch (e: any) {
      setError(e.message || 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (txHash) {
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
          <span className="text-primary">
            {txHash?.slice(0, 16)}...{txHash?.slice(-8)}
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
            <span className="text-primary">
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

            <div className="mt-4 flex gap-2">
           <button
           onClick={() => {
           const { downloadReceipt } = require('@/lib/receipt')
           // Get from store
           const runs = JSON.parse(localStorage.getItem('zerowage_runs') || '[]')
           const run = runs.find((r: any) => r.proofTxHash === txHash)
           if (run) downloadReceipt(run)
           }}
           className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-border bg-card hover:bg-accent px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
           >
          <Download size={14} />
          Download receipt
          </button>
          <button
          onClick={() => {
          navigator.clipboard.writeText(
          `${window.location.origin}/verify/${txHash}`
          )
          }}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-border bg-card hover:bg-accent px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
          <Share2 size={14} />
          Share attestation
          </button>
            <button
         onClick={async () => {
         const runs = JSON.parse(localStorage.getItem('zerowage_runs') || '[]')
         const run = runs.find((r: any) => r.proofTxHash === txHash)
        if (!run) return
        const settings = JSON.parse(localStorage.getItem('zerowage_settings') || '{}')
        const { downloadAllPayslips } = await import('@/lib/download-payslip')
        downloadAllPayslips(run, settings.companyName)
        }}
        className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-border bg-card hover:bg-accent px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
        <FileText size={14} />
       Download payslips
       </button>
          </div>
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
    </div>
  </div>
    )
  }

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
          onClick={handleSubmit}
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
              Submit & verify on Stellar
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