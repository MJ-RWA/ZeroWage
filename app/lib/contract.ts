import {
  Contract,
  Networks,
  TransactionBuilder,
  BASE_FEE,
  nativeToScVal,
  rpc,
  Operation,
  Asset,
  Horizon,
} from '@stellar/stellar-sdk'

export const CONTRACT_ID = 'CCOEJ6QC6ZGGA2GIY72IW3MDN6LNJHQSB2XWRZR3WSLE3PVVE6QVUYAP'
export const RPC_URL = 'https://soroban-testnet.stellar.org'
export const HORIZON_URL = 'https://horizon-testnet.stellar.org'
export const NETWORK_PASSPHRASE = Networks.TESTNET
export const USDC_ASSET = new Asset(
  'USDC',
  'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
)

export interface PayrollEmployee {
  name: string
  wallet: string
  amount: number
}

export interface PayrollRunParams {
  employer: string
  cycleId: string
  totalUsdc: number
  nRecipients: number
  employees: PayrollEmployee[]
  proof: {
    pi_a: string[]
    pi_b: string[][]
    pi_c: string[]
  }
  publicSignals: string[]
}

export interface PayrollResult {
  proofTxHash: string
  paymentTxHash: string
  verified: boolean
  payments: { wallet: string; amount: number; success: boolean }[]
}

export async function submitPayrollToContract(
  params: PayrollRunParams,
  signTransaction: (xdr: string) => Promise<string>
): Promise<PayrollResult> {
  const server = new rpc.Server(RPC_URL)
  const horizon = new Horizon.Server(HORIZON_URL)
  const contract = new Contract(CONTRACT_ID)

  // Encode proof as binary: pi_a (64 bytes) + pi_b (128 bytes) + pi_c (64 bytes)
function encodeProofBytes(
  proof: { pi_a: string[]; pi_b: string[][]; pi_c: string[] }
): Buffer {
  function fieldToBytes(val: string): Buffer {
    const n = BigInt(val)
    const buf = Buffer.alloc(32)
    let tmp = n
    for (let i = 31; i >= 0; i--) {
      buf[i] = Number(tmp & 0xffn)
      tmp >>= 8n
    }
    return buf
  }

  function encodeG1(point: string[]): Buffer {
    return Buffer.concat([
      fieldToBytes(point[0]),
      fieldToBytes(point[1]),
    ])
  }

  function encodeG2(point: string[][]): Buffer {
    return Buffer.concat([
      fieldToBytes(point[0][1]),
      fieldToBytes(point[0][0]),
      fieldToBytes(point[1][1]),
      fieldToBytes(point[1][0]),
    ])
  }

  return Buffer.concat([
    encodeG1(proof.pi_a),
    encodeG2(proof.pi_b),
    encodeG1(proof.pi_c),
  ])
}

// Encode public signals: 4-byte count prefix + each signal as 32 bytes
function encodePublicSignals(signals: string[]): Buffer {
  const lenBuf = Buffer.alloc(4)
  lenBuf.writeUInt32BE(signals.length, 0)

  const sigBufs = signals.map((s) => {
    const n = BigInt(s)
    const buf = Buffer.alloc(32)
    let tmp = n
    for (let i = 31; i >= 0; i--) {
      buf[i] = Number(tmp & 0xffn)
      tmp >>= 8n
    }
    return buf
  })

  return Buffer.concat([lenBuf, ...sigBufs])
}

const proofBuf = encodeProofBytes(params.proof)
const pubSigBuf = encodePublicSignals(params.publicSignals)

const proofScVal = nativeToScVal(
  Buffer.from(proofBuf),
  { type: 'bytes' }
)

const pubSigScVal = nativeToScVal(
  Buffer.from(pubSigBuf),
  { type: 'bytes' }
)

  // ── Step 1: Verify proof on Soroban contract ──────────────────────────────

  const account = await server.getAccount(params.employer)

  const proofTx = new TransactionBuilder(account, {
    fee: (BigInt(BASE_FEE) * BigInt(10)).toString(),
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call(
        'verify_and_record',
        nativeToScVal(params.employer, { type: 'string' }),
        nativeToScVal(params.cycleId, { type: 'string' }),
        nativeToScVal(BigInt(params.totalUsdc), { type: 'i128' }),
        nativeToScVal(params.nRecipients, { type: 'u32' }),
        proofScVal,
        pubSigScVal
      )
    )
    .setTimeout(300)
    .build()

  const simResult = await server.simulateTransaction(proofTx)
  if (rpc.Api.isSimulationError(simResult)) {
    throw new Error('Simulation failed: ' + simResult.error)
  }

  // Rebuild with fresh sequence number
  const freshAccount = await server.getAccount(params.employer)
  const proofTx2 = new TransactionBuilder(freshAccount, {
    fee: (BigInt(BASE_FEE) * BigInt(10)).toString(),
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call(
        'verify_and_record',
        nativeToScVal(params.employer, { type: 'string' }),
        nativeToScVal(params.cycleId, { type: 'string' }),
        nativeToScVal(BigInt(params.totalUsdc), { type: 'i128' }),
        nativeToScVal(params.nRecipients, { type: 'u32' }),
        proofScVal,
        pubSigScVal
      )
    )
    .setTimeout(300)
    .build()

  const simResult2 = await server.simulateTransaction(proofTx2)
  if (rpc.Api.isSimulationError(simResult2)) {
    throw new Error('Simulation failed on retry: ' + simResult2.error)
  }

  const assembled = rpc.assembleTransaction(proofTx2, simResult2).build()
  const signedProofXdr = await signTransaction(assembled.toXDR())
  const signedProofTx = TransactionBuilder.fromXDR(
    signedProofXdr,
    NETWORK_PASSPHRASE
  )

  const proofSendResult = await server.sendTransaction(signedProofTx)
  if (proofSendResult.status === 'ERROR') {
    throw new Error(
      'Proof transaction failed: ' + JSON.stringify(proofSendResult.errorResult)
    )
  }

  // Wait for proof confirmation
  let proofConfirmed = false
  let attempts = 0
  while (!proofConfirmed && attempts < 20) {
    await new Promise((r) => setTimeout(r, 1500))
    const status = await server.getTransaction(proofSendResult.hash)
    if (status.status === rpc.Api.GetTransactionStatus.SUCCESS) {
      proofConfirmed = true
    } else if (status.status === rpc.Api.GetTransactionStatus.FAILED) {
      throw new Error('Proof transaction failed on chain')
    }
    attempts++
  }

  if (!proofConfirmed) throw new Error('Proof transaction timed out')

  // ── Step 2: Send USDC to each employee ───────────────────────────────────

  const validEmployees = params.employees.filter(
    (e) => e.wallet && e.wallet.startsWith('G') && e.wallet.length === 56 && e.amount > 0
  )

  if (validEmployees.length === 0) {
    return {
      proofTxHash: proofSendResult.hash,
      paymentTxHash: '',
      verified: true,
      payments: [],
    }
  }

  // Check each recipient has USDC trustline
  const paymentResults: { wallet: string; amount: number; success: boolean }[] = []
  const eligibleEmployees: PayrollEmployee[] = []

  for (const emp of validEmployees) {
    try {
      const recipientAccount = await horizon.loadAccount(emp.wallet)
      const hasTrustline = recipientAccount.balances.some(
        (b: any) =>
          b.asset_code === 'USDC' &&
          b.asset_issuer === 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
      )
      if (hasTrustline) {
        eligibleEmployees.push(emp)
        paymentResults.push({ wallet: emp.wallet, amount: emp.amount, success: true })
      } else {
        paymentResults.push({ wallet: emp.wallet, amount: emp.amount, success: false })
        console.warn(`${emp.name} (${emp.wallet}) has no USDC trustline — skipping payment`)
      }
    } catch {
      paymentResults.push({ wallet: emp.wallet, amount: emp.amount, success: false })
      console.warn(`${emp.name} (${emp.wallet}) account not found — skipping`)
    }
  }

  if (eligibleEmployees.length === 0) {
    return {
      proofTxHash: proofSendResult.hash,
      paymentTxHash: '',
      verified: true,
      payments: paymentResults,
    }
  }

  // Build payment transaction
  const payerAccount = await horizon.loadAccount(params.employer)
  const payTxBuilder = new TransactionBuilder(payerAccount, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })

  for (const emp of eligibleEmployees) {
    payTxBuilder.addOperation(
      Operation.payment({
        destination: emp.wallet,
        asset: USDC_ASSET,
        amount: emp.amount.toFixed(7),
      })
    )
  }

  const payTx = payTxBuilder.setTimeout(300).build()
  const signedPayXdr = await signTransaction(payTx.toXDR())
  const signedPayTx = TransactionBuilder.fromXDR(signedPayXdr, NETWORK_PASSPHRASE)

  let paymentTxHash = ''
  try {
    const payResult = await horizon.submitTransaction(signedPayTx)
    paymentTxHash = (payResult as any).hash
  } catch (e: any) {
    const extras = e?.response?.data?.extras
    throw new Error(
      'Payment transaction failed: ' +
        (extras?.result_codes?.operations?.join(', ') || e.message)
    )
  }

  return {
    proofTxHash: proofSendResult.hash,
    paymentTxHash,
    verified: true,
    payments: paymentResults,
  }
}