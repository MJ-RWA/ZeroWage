export type VerificationStatus = 'verified' | 'pending' | 'failed'

export type PayrollRun = {
  id: string
  cycle: string
  period: string
  date: string
  employees: number
  totalAmount: number
  asset: string
  status: VerificationStatus
  proofId: string
  txHash: string
}

export type Proof = {
  id: string
  hash: string
  runId: string
  cycle: string
  status: VerificationStatus
  generatedAt: string
  verifiedAt: string | null
  circuit: string
  constraints: number
  provingTimeMs: number
  verificationTimeMs: number
  txHash: string
  ledger: number
  publicInputs: { label: string; value: string }[]
}

export type Employee = {
  id: string
  name: string
  role: string
  wallet: string
  // amounts kept private in proof — shown only to admin
  amount: number
  asset: string
  status: 'included' | 'excluded'
}

export const payrollRuns: PayrollRun[] = [
  {
    id: 'run_9F2A',
    cycle: 'February 2026 — Cycle 24',
    period: 'Feb 1 – Feb 29, 2026',
    date: '2026-02-28',
    employees: 3,
    totalAmount: 1284500,
    asset: 'USDC',
    status: 'verified',
    proofId: 'prf_a91c',
    txHash: '7d4e9b2a1f8c3d6e5a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f',
  },
  {
    id: 'run_8B7C',
    cycle: 'January 2026 — Cycle 23',
    period: 'Jan 1 – Jan 31, 2026',
    date: '2026-01-31',
    employees: 138,
    totalAmount: 1247800,
    asset: 'USDC',
    status: 'verified',
    proofId: 'prf_77de',
    txHash: '3a1b8c5d2e9f6a4b7c0d3e8f1a6b9c2d5e8f1a4b7c0d3e6f9a2b5c8d1e4f7a0b',
  },
  {
    id: 'run_7D1E',
    cycle: 'February 2026 — Contractors',
    period: 'Feb 1 – Feb 29, 2026',
    date: '2026-02-27',
    employees: 36,
    totalAmount: 318400,
    asset: 'USDC',
    status: 'pending',
    proofId: 'prf_c4a2',
    txHash: 'b2c5d8e1f4a7b0c3d6e9f2a5b8c1d4e7f0a3b6c9d2e5f8a1b4c7d0e3f6a9b2c5',
  },
  {
    id: 'run_6E9F',
    cycle: 'Q1 Bonus Pool — 2026',
    period: 'Feb 25, 2026',
    date: '2026-02-25',
    employees: 142,
    totalAmount: 642000,
    asset: 'XLM',
    status: 'verified',
    proofId: 'prf_1f8b',
    txHash: 'e8f1a4b7c0d3e6f9a2b5c8d1e4f7a0b3c6d9e2f5a8b1c4d7e0f3a6b9c2d5e8f1',
  },
  {
    id: 'run_5A3B',
    cycle: 'December 2025 — Cycle 22',
    period: 'Dec 1 – Dec 31, 2025',
    date: '2025-12-31',
    employees: 131,
    totalAmount: 1198200,
    asset: 'USDC',
    status: 'failed',
    proofId: 'prf_9e0a',
    txHash: 'd5e8f1a4b7c0d3e6f9a2b5c8d1e4f7a0b3c6d9e2f5a8b1c4d7e0f3a6b9c2d5e8',
  },
  {
    id: 'run_4C8D',
    cycle: 'November 2025 — Cycle 21',
    period: 'Nov 1 – Nov 30, 2025',
    date: '2025-11-30',
    employees: 129,
    totalAmount: 1176400,
    asset: 'USDC',
    status: 'verified',
    proofId: 'prf_3b7c',
    txHash: 'a4b7c0d3e6f9a2b5c8d1e4f7a0b3c6d9e2f5a8b1c4d7e0f3a6b9c2d5e8f1a4b7',
  },
]

export const proofs: Proof[] = payrollRuns.map((run) => ({
  id: run.proofId,
  hash: `0x${run.txHash}`,
  runId: run.id,
  cycle: run.cycle,
  status: run.status,
  generatedAt: `${run.date}T09:42:18Z`,
  verifiedAt: run.status === 'verified' ? `${run.date}T09:42:24Z` : null,
  circuit:'payroll.circom',
  constraints: 660,
  provingTimeMs: 2100,
  verificationTimeMs: 12,
  txHash: `0x${run.txHash}`,
  ledger: 54219003 + Math.floor(Math.random() * 9000),
  publicInputs: [
    { label: 'payrollRoot', value: `0x${run.txHash.slice(0, 40)}` },
    { label: 'employeeCount', value: String(run.employees) },
    { label: 'totalCommitment', value: `0x${run.txHash.slice(8, 48)}` },
    { label: 'cycleId', value: run.id.replace('run_', '') },
  ],
}))

export const employees: Employee[] = [
  { id: 'emp_01', name: 'Ava Mitchell', role: 'Engineering', wallet: 'GAVA…X7K2', amount: 11500, asset: 'USDC', status: 'included' },
  { id: 'emp_02', name: 'Liam Okafor', role: 'Design', wallet: 'GLIA…9F3D', amount: 9800, asset: 'USDC', status: 'included' },
  { id: 'emp_03', name: 'Sofia Reyes', role: 'Product', wallet: 'GSOF…2B8C', amount: 12400, asset: 'USDC', status: 'included' },
  { id: 'emp_04', name: 'Noah Becker', role: 'Engineering', wallet: 'GNOA…5E1A', amount: 10750, asset: 'USDC', status: 'included' },
  { id: 'emp_05', name: 'Mei Tanaka', role: 'Data', wallet: 'GMEI…8C4F', amount: 11200, asset: 'USDC', status: 'included' },
  { id: 'emp_06', name: 'Diego Santos', role: 'Sales', wallet: 'GDIE…1A9B', amount: 8600, asset: 'USDC', status: 'included' },
  { id: 'emp_07', name: 'Priya Nair', role: 'Engineering', wallet: 'GPRI…6D2E', amount: 13100, asset: 'USDC', status: 'included' },
  { id: 'emp_08', name: 'Tom Eriksen', role: 'Operations', wallet: 'GTOM…4F7C', amount: 9200, asset: 'USDC', status: 'excluded' },
]

export type ActivityItem = {
  id: string
  actor: string
  action: string
  target: string
  time: string
  kind: 'proof' | 'run' | 'payment' | 'verify'
}

export const activity: ActivityItem[] = [
  { id: 'a1', actor: 'System', action: 'verified proof for', target: 'run_9F2A', time: '2 min ago', kind: 'verify' },
  { id: 'a2', actor: 'Ava Mitchell', action: 'submitted', target: 'run_9F2A', time: '14 min ago', kind: 'run' },
  { id: 'a3', actor: 'System', action: 'generated Groth16 proof', target: 'prf_a91c', time: '16 min ago', kind: 'proof' },
  { id: 'a4', actor: 'Stellar', action: 'settled 142 payments for', target: 'run_9F2A', time: '18 min ago', kind: 'payment' },
  { id: 'a5', actor: 'Liam Okafor', action: 'created', target: 'run_7D1E', time: '3 hrs ago', kind: 'run' },
  { id: 'a6', actor: 'System', action: 'verification failed for', target: 'run_5A3B', time: '1 day ago', kind: 'verify' },
]

export function formatCurrency(amount: number, asset = 'USDC') {
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
  return `${formatted} ${asset}`
}

export function getRun(id: string) {
  return payrollRuns.find((r) => r.id === id)
}

export function getProof(id: string) {
  return proofs.find((p) => p.id === id)
}
