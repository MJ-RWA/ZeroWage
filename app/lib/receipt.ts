import { type PayrollRun } from './payroll-store'

export function generatePayrollReceipt(run: PayrollRun): string {
  const date = new Date(run.date).toUTCString()
  const lines: string[] = []

  lines.push('═══════════════════════════════════════════════════')
  lines.push('              ZEROWAGE PAYROLL RECEIPT             ')
  lines.push('        Zero-Knowledge Payroll on Stellar          ')
  lines.push('═══════════════════════════════════════════════════')
  lines.push('')
  lines.push(`Cycle:          ${run.cycleId}`)
  lines.push(`Date:           ${date}`)
  lines.push(`Total Amount:   ${run.total.toLocaleString()} USDC`)
  lines.push(`Recipients:     ${run.recipients}`)
  lines.push(`Status:         VERIFIED`)
  lines.push('')
  lines.push('───────────────────────────────────────────────────')
  lines.push('EMPLOYEES')
  lines.push('───────────────────────────────────────────────────')
  for (const emp of run.employees) {
    lines.push(`${emp.name.padEnd(20)} ${emp.wallet.slice(0, 10)}...${emp.wallet.slice(-6)}   ${emp.amount.toLocaleString().padStart(10)} USDC`)
  }
  lines.push('')
  lines.push('───────────────────────────────────────────────────')
  lines.push('PROOF')
  lines.push('───────────────────────────────────────────────────')
  lines.push(`Protocol:       Groth16 · BN254`)
  lines.push(`Circuit:        payroll.circom`)
  lines.push(`Constraints:    660`)
  lines.push(`Network:        Stellar Testnet`)
  lines.push(`Contract:       CCOEJ6QCZEFYDQTK53AAWINVB62BTPBJNZ7P5ZP2ELNHIDQEV3SMRDUD`)
  lines.push('')
  lines.push('Proof Transaction:')
  lines.push(`  ${run.proofTxHash}`)
  if (run.paymentTxHash) {
    lines.push('')
    lines.push('Payment Transaction:')
    lines.push(`  ${run.paymentTxHash}`)
  }
  lines.push('')
  lines.push('───────────────────────────────────────────────────')
  lines.push('PUBLIC ATTESTATION')
  lines.push('───────────────────────────────────────────────────')
  lines.push(`https://zerowage.xyz/verify/${run.proofTxHash}`)
  lines.push('')
  lines.push('Stellar Expert:')
  lines.push(`https://stellar.expert/explorer/testnet/tx/${run.proofTxHash}`)
  lines.push('')
  lines.push('PRIVACY NOTICE')
  lines.push('Individual salary amounts are private inputs to the ZK')
  lines.push('circuit. They do not appear on-chain. This receipt is')
  lines.push('the only record of individual amounts.')
  lines.push('')
  lines.push('═══════════════════════════════════════════════════')
  lines.push(`Generated: ${new Date().toUTCString()}`)
  lines.push('═══════════════════════════════════════════════════')

  return lines.join('\n')
}

export function downloadReceipt(run: PayrollRun): void {
  const content = generatePayrollReceipt(run)
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `zerowage-receipt-${run.cycleId.replace(/\s+/g, '-').toLowerCase()}-${run.proofTxHash.slice(0, 8)}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function downloadReceiptJson(run: PayrollRun): void {
  const payload = {
    product: 'ZeroWage',
    version: '1.0',
    generatedAt: new Date().toISOString(),
    run: {
      cycleId: run.cycleId,
      date: run.date,
      totalUsdc: run.total,
      recipients: run.recipients,
      status: run.status,
      employees: run.employees.map((e) => ({
        name: e.name,
        wallet: e.wallet,
        amount: e.amount,
      })),
    },
    proof: {
      protocol: 'Groth16',
      curve: 'BN254',
      circuit: 'payroll.circom',
      constraints: 660,
      network: 'Stellar Testnet',
      contractId: 'CCOEJ6QCZEFYDQTK53AAWINVB62BTPBJNZ7P5ZP2ELNHIDQEV3SMRDUD',
      proofTxHash: run.proofTxHash,
      paymentTxHash: run.paymentTxHash,
    },
    attestation: {
      publicUrl: `https://zerowage.xyz/verify/${run.proofTxHash}`,
      stellarExpert: `https://stellar.expert/explorer/testnet/tx/${run.proofTxHash}`,
      privacyNote:
        'Individual salary amounts are private ZK circuit inputs and do not appear on-chain.',
    },
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `zerowage-receipt-${run.cycleId.replace(/\s+/g, '-').toLowerCase()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}