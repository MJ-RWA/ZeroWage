export interface PayrollEmployee {
  id: string
  name: string
  wallet: string
  amount: number
  department?: string
}

export interface PayrollRun {
  id: string
  cycleId: string
  total: number
  recipients: number
  proofTxHash: string
  paymentTxHash: string
  date: string
  employees: PayrollEmployee[]
  status: 'verified'
}

const KEY = 'zerowage_runs'

export function savePayrollRun(run: PayrollRun): void {
  if (typeof window === 'undefined') return
  const existing = getPayrollRuns()
  localStorage.setItem(KEY, JSON.stringify([run, ...existing]))
}

export function getPayrollRuns(): PayrollRun[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function getPayrollRunById(id: string): PayrollRun | null {
  return getPayrollRuns().find((r) => r.id === id) ?? null
}