import { encryptData, decryptData } from './crypto'
import { supabase } from './supabase'

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
  status: 'draft' | 'approved' | 'paid'
  proofData?: any
  approverWallet?: string
  approvalSignature?: string
  approvedAt?: string
}

const LOCAL_KEY = 'zerowage_runs'

// ── LocalStorage helpers (always available, used as cache + fallback) ──────

function getLocalRuns(): PayrollRun[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function setLocalRuns(runs: PayrollRun[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(LOCAL_KEY, JSON.stringify(runs))
}

// ── Supabase helpers (encrypted, cross-device) ─────────────────────────────

async function getWalletAddress(): Promise<string | null> {
  try {
    const { isConnected, getAddress } = await import('@stellar/freighter-api')
    const conn = await isConnected()
    if (!conn?.isConnected) return null
    const result = await getAddress()
    return result?.address || null
  } catch {
    return null
  }
}

async function saveToSupabase(
  runs: PayrollRun[],
  walletAddress: string
): Promise<void> {
  try {
    // Encrypt all runs together under the wallet's key
    const encrypted = await encryptData(runs, walletAddress)

    const { error } = await supabase
      .from('payroll_runs')
      .upsert({
        id: walletAddress,           // one row per wallet
        wallet_address: walletAddress,
        encrypted_data: encrypted,
        updated_at: new Date().toISOString(),
      })

    if (error) console.warn('Supabase save error:', error.message)
  } catch (e) {
    console.warn('Supabase save failed, localStorage still has data:', e)
  }
}

async function loadFromSupabase(
  walletAddress: string
): Promise<PayrollRun[] | null> {
  try {
    const { data, error } = await supabase
      .from('payroll_runs')
      .select('encrypted_data')
      .eq('wallet_address', walletAddress)
      .single()

    if (error || !data) return null

    const decrypted = await decryptData(data.encrypted_data, walletAddress)
    return decrypted as PayrollRun[]
  } catch {
    return null
  }
}

// ── Public API ─────────────────────────────────────────────────────────────

export async function savePayrollRun(run: PayrollRun): Promise<void> {
  // Always save to localStorage immediately (instant, no network)
  const existing = getLocalRuns().filter((r) => r.id !== run.id)
  const updated = [run, ...existing]
  setLocalRuns(updated)

  // Then persist encrypted copy to Supabase in the background
  const wallet = await getWalletAddress()
  if (wallet) {
    saveToSupabase(updated, wallet)  // fire and forget
  }
}

export async function getPayrollRuns(): Promise<PayrollRun[]> {
  // Return localStorage immediately (fast, no flicker)
  const local = getLocalRuns()

  // Try to sync from Supabase in the background
  const wallet = await getWalletAddress()
  if (wallet) {
    const remote = await loadFromSupabase(wallet)
    if (remote && remote.length > local.length) {
      // Remote has more data — sync it locally
      setLocalRuns(remote)
      return remote
    }
  }

  return local
}

export function getPayrollRunsSync(): PayrollRun[] {
  // Synchronous version for components that can't await
  return getLocalRuns()
}

export function getPayrollRunById(id: string): PayrollRun | null {
  const runs = getLocalRuns()
  return (
    runs.find((r) => r.id === id) ??
    runs.find((r) => r.proofTxHash === id) ??
    null
  )
}

export async function updateRunStatus(
  id: string,
  status: PayrollRun['status'],
  extra?: Partial<PayrollRun>
): Promise<void> {
  const runs = getLocalRuns()
  const updated = runs.map((r) =>
    r.id === id ? { ...r, status, ...extra } : r
  )
  setLocalRuns(updated)

  const wallet = await getWalletAddress()
  if (wallet) {
    saveToSupabase(updated, wallet)
  }
}