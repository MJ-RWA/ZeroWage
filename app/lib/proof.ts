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
  const { buildPoseidon } = await import('circomlibjs')

  // Pad to 20 slots
  const padded = [...input.salaries]
  while (padded.length < 20) padded.push(0)

  const total = input.salaries.reduce((s, n) => s + n, 0)
  const nRecipients = input.salaries.length

  onLog('Loading circuit...')

  // Compute Poseidon commitment of first 8 salary slots
  onLog('Computing salary commitment...')
  const poseidon = await buildPoseidon()
  const F = poseidon.F
  const first8 = padded.slice(0, 8).map((n) => BigInt(n))
  const hash = poseidon(first8)
  const commitment = F.toString(hash)

  onLog(`Commitment: ${commitment.slice(0, 16)}...`)

  const circuitInput = {
    salaries: padded.map(String),
    total: String(total),
    min_salary: String(input.minSalary),
    n_recipients: String(nRecipients),
    commitment,
  }

  onLog('Computing witness...')

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    circuitInput,
    '/circuit/payroll.wasm',
    '/circuit/payroll_final.zkey'
  )

  onLog('Running Groth16 prover...')
  onLog('Proof generated')

  return { proof, publicSignals }
}

export function validateSalaries(salaries: number[], min: number): string | null {
  if (salaries.length === 0) return 'Add at least one recipient'
  if (salaries.length > 20) return 'Maximum 20 recipients'
  if (salaries.some((s) => s <= 0)) return 'All salaries must be greater than 0'
  if (salaries.some((s) => s < min)) return `All salaries must be at least ${min}`
  return null
}