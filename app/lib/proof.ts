export interface ProofResult {
  proof: {
    pi_a: string[]
    pi_b: string[][]
    pi_c: string[]
    protocol: string
    curve: string
  }
  publicSignals: string[]
}

export interface PayrollProofInput {
  salaries: number[]
  minSalary: number
}

export async function generatePayrollProof(
  input: PayrollProofInput,
  onLog: (msg: string) => void
): Promise<ProofResult> {
  const snarkjs = await import('snarkjs')

  // Pad to 20 slots
  const padded = [...input.salaries]
  while (padded.length < 20) padded.push(0)

  const total = input.salaries.reduce((s, n) => s + n, 0)
  const nRecipients = input.salaries.length

  const circuitInput = {
    salaries: padded.map(String),
    total: String(total),
    min_salary: String(input.minSalary),
    n_recipients: String(nRecipients),
  }

  onLog('Loading circuit payroll.circom')
  await new Promise((r) => setTimeout(r, 400))

  onLog(`Computing salary commitments (${nRecipients} inputs)`)
  await new Promise((r) => setTimeout(r, 300))

  onLog('Building constraint system — 660 constraints')

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    circuitInput,
    '/circuit/payroll.wasm',
    '/circuit/payroll_final.zkey'
  )

  onLog('Generating witness')
  onLog('Running Groth16 prover')
  onLog(`Proof generated`)

  return { proof, publicSignals }
}

export function validateSalaries(salaries: number[], min: number): string | null {
  if (salaries.length === 0) return 'Add at least one recipient'
  if (salaries.length > 20) return 'Maximum 20 recipients'
  if (salaries.some((s) => s <= 0)) return 'All salaries must be greater than 0'
  if (salaries.some((s) => s < min)) return `All salaries must be at least ${min}`
  return null
}