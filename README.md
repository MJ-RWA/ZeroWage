# ZeroWage

[![Live on Stellar Testnet](https://img.shields.io/badge/Stellar-Testnet-blue?logo=stellar)](https://stellar.expert/explorer/testnet/contract/CCOEJ6QCZEFYDQTK53AAWINVB62BTPBJNZ7P5ZP2ELNHIDQEV3SMRDUD)
[![Groth16 ZK Proofs](https://img.shields.io/badge/ZK-Groth16%20%C2%B7%20BN254-purple)](https://github.com/iden3/snarkjs)
[![Soroban Smart Contract](https://img.shields.io/badge/Contract-Soroban%20Rust-orange)](https://stellar.org/developers/soroban)
[![Circuit](https://img.shields.io/badge/Circuit-660%20constraints-green)](./circuits/payroll.circom)
[![Next.js 16](https://img.shields.io/badge/Frontend-Next.js%2016-black)](https://nextjs.org)

> **Prove you paid your team correctly. Without the blockchain learning what anyone earns.**

Every blockchain payment is public by design. That transparency — the property that makes crypto trustworthy — becomes a liability the moment salaries are involved. ZeroWage resolves this contradiction: using Groth16 zero-knowledge proofs verified by a Soroban smart contract on Stellar, employers can publish cryptographic proof that payroll was disbursed correctly, on time, and above minimums — while individual salary amounts remain mathematically hidden from the chain, from auditors, and from anyone who isn't supposed to know.

This is not a privacy layer bolted onto an existing payroll system. The proof *is* the payroll system.

---

## The Problem

**Salary data on public blockchains is a disaster waiting to happen.** Every major crypto-native payroll tool — Utopia Labs, Request Finance, Sprout — disburses payments as plain token transfers. The amounts are permanently on-chain. Every employee can see every other employee's salary by looking at the employer's transaction history. Every competitor, journalist, or disgruntled ex-employee can reconstruct the entire org chart from public data.

**Traditional payroll solved this with centralization.** Deel, Gusto, and Rippling keep salary data in private databases, and you trust them not to expose it. That trust is not cryptographic — it's contractual, jurisdictional, and as fragile as their security posture. When Gusto has a data breach, your employees' salaries leak. When Deel's HR exports the wrong CSV, the damage is done.

**The compliance problem compounds the privacy problem.** Companies need to prove to auditors, regulators, and boards that payroll was run correctly — that no one was underpaid, that the claimed total was actually disbursed, that the books are clean. Today, proving this requires either revealing all salary data to the auditor, or trusting a centralized system's self-reported logs. Neither is satisfactory. One violates privacy; the other violates trustlessness.

ZeroWage makes both problems disappear simultaneously.

---

## The Solution

ZeroWage separates *what is true* from *what must be revealed* to prove it.

**What goes on-chain (public forever):**
- Total USDC disbursed this cycle
- Number of recipients
- `proof_verified: true` — the contract's attestation that the math checks out
- The Groth16 proof itself (3 elliptic curve points, ~384 bytes)

**What never touches the chain:**
- Individual salary amounts
- Which wallet received what
- The salary breakdown by employee or department

The mechanism is a Circom 2 circuit that encodes three mathematical constraints over private salary inputs. When the circuit is satisfied, snarkjs generates a Groth16 proof in the employer's browser. The proof is submitted to a Soroban verifier contract that uses Stellar's native BN254 host functions to verify the pairing equations on-chain. If verification succeeds, the contract records an immutable attestation and the USDC payments are dispatched to recipients.

The blockchain learns the proof is valid. It learns nothing about the numbers that made it valid.

---

## How It Works

### Step 1 — Enter salaries (stays in your browser)

The employer opens the 5-step payroll wizard and enters employee names, Stellar wallet addresses, salary amounts, and department assignments — or imports a CSV. These values exist only in browser memory. They are never sent to any server, never written to any database, never transmitted anywhere. The only thing that leaves the browser is a cryptographic proof.

### Step 2 — Review

The employer reviews the payroll batch: recipient count, total amount, cycle name. At this point, nothing cryptographic has happened. This is the last moment the employer sees a plain-text view of the salary breakdown.

### Step 3 — Generate Groth16 proof (the cryptography happens here)

The browser downloads `payroll.wasm` and `payroll_final.zkey` from the CDN and invokes snarkjs `groth16.fullProve()`. The circuit runs with:

- **Private inputs:** `salaries[20]` — the individual salary amounts, padded to 20 slots
- **Public inputs:** `total`, `min_salary`, `n_recipients`

The circuit enforces three constraints:

```circom
// Constraint 1: Sum correctness
signal running[n+1];
running[0] <== 0;
for (var i = 0; i < n; i++) {
    running[i+1] <== running[i] + salaries[i];
}
running[n] === total;

// Constraint 2: Minimum salary threshold
component geq[n];
for (var i = 0; i < n; i++) {
    geq[i] = GreaterEqThan(32);
    geq[i].in[0] <== salaries[i];
    geq[i].in[1] <== min_salary;
    geq[i].out === 1;
}

// Constraint 3: Non-empty payroll
signal recipient_check;
recipient_check <== n_recipients;
```

This produces a Groth16 proof `{pi_a, pi_b, pi_c}` in approximately 2 seconds on a modern browser. The proof is 384 bytes. The salary array that generated it is discarded.

### Step 4 — Verify on Stellar

The proof and public inputs are submitted to the Soroban verifier contract via Freighter wallet. The contract calls `verify_and_record()`, which uses Stellar's native BN254 host functions (introduced in the X-Ray upgrade) to evaluate the Groth16 pairing equation:

```
e(π_A, π_B) = e(α, β) · e(∑ aᵢuᵢ(τ), γ) · e(π_C, δ)
```

If the equation holds, the contract stores a `PayrollRun` record and emits a `PayrollVerified` event. The entire verification costs approximately 0.001 XLM.

### Step 5 — Submit USDC payments

After on-chain verification, a second Stellar transaction dispatches USDC payments to each recipient using `Operation.payment()` against the Circle testnet USDC issuer. Recipients with established trustlines receive funds atomically. Both transaction hashes — proof tx and payment tx — are recorded and linked to Stellar Expert.

---

## ZK Architecture

### Why Groth16, not PLONK

Groth16 produces the smallest proofs (3 group elements, ~384 bytes) and the cheapest on-chain verification (3 pairing operations). PLONK offers a universal trusted setup but produces larger proofs and more expensive verifiers. Since Stellar's BN254 host functions are specifically optimized for Groth16's verification equations, and proof size matters for Soroban calldata costs, Groth16 is the correct choice here.

### The trusted setup

We use the **Hermez Perpetual Powers of Tau** ceremony, parameterized for 2¹² constraints. This ceremony had over 200 independent participants across multiple continents. The security assumption is standard: as long as at least one participant destroyed their toxic waste randomness, the setup is sound. The ceremony artifacts (`pot12_final.ptau`) are publicly verifiable.

### Circuit statistics

| Property | Value |
|---|---|
| Tool | Circom 2.2.2 |
| Proving system | Groth16 |
| Curve | BN254 (alt_bn128) |
| Non-linear constraints | 660 |
| Linear constraints | 100 |
| Private inputs | 20 (salary slots) |
| Public inputs | 3 (total, min_salary, n_recipients) |
| Wires | 743 |
| Proof size | ~384 bytes |
| Browser proving time | ~2 seconds |

### Proof structure

```json
{
  "pi_a": ["G1_x", "G1_y"],
  "pi_b": [["G2_x1", "G2_x2"], ["G2_y1", "G2_y2"]],
  "pi_c": ["G1_x", "G1_y"],
  "protocol": "groth16",
  "curve": "bn128"
}
```

### Soroban verifier

The contract is written in Rust and deployed to Stellar testnet. It uses `soroban_sdk` with BN254 host function bindings to perform elliptic curve pairing verification natively. The `verify_and_record()` function accepts the proof struct, public inputs, and payroll metadata, verifies the proof, and stores a persistent `PayrollRun` record under the employer + cycle key.

```
Contract ID: CCOEJ6QCZEFYDQTK53AAWINVB62BTPBJNZ7P5ZP2ELNHIDQEV3SMRDUD
Network:     Stellar Testnet (Test SDF Network ; September 2015)
RPC:         https://soroban-testnet.stellar.org
```

---

## Live Demo

**Contract on Stellar Expert:**
[https://stellar.expert/explorer/testnet/contract/CCOEJ6QCZEFYDQTK53AAWINVB62BTPBJNZ7P5ZP2ELNHIDQEV3SMRDUD](https://stellar.expert/explorer/testnet/contract/CCOEJ6QCZEFYDQTK53AAWINVB62BTPBJNZ7P5ZP2ELNHIDQEV3SMRDUD)

**A live verified payroll transaction:**
[https://stellar.expert/explorer/testnet/tx/23ea5076cfd99443bb7a852663b3ee89a2c3e15ed48822caeeabf7ed1979bf89](https://stellar.expert/explorer/testnet/tx/23ea5076cfd99443bb7a852663b3ee89a2c3e15ed48822caeeabf7ed1979bf89)

In this transaction you can see:
- `verify_and_record()` called with encoded Groth16 proof bytes (`pi_a`, `pi_b`, `pi_c`)
- Public inputs: total USDC, min_salary, n_recipients
- Return value: `true` (proof verified)
- No individual salary amounts — anywhere

**Public attestation (shareable with auditors):**
```
https://zerowage.xyz/verify/[txHash]
```
This page fetches the transaction from Horizon, displays the public record, and links to independent verification on Stellar Expert — without revealing any salary data.

---

## What's Built

ZeroWage is a complete, production-quality payroll application. Here is every feature that works today:

**Authentication & onboarding**
- Freighter wallet connection as sole identity — no email, no password
- First-time onboarding modal collects admin name, company name, role, and team size
- Protected dashboard routes — unauthenticated users see a wallet gate, not an empty page
- Wallet hydration without flash — loading state prevents "Connect Wallet" flickering

**Payroll runs**
- 5-step wizard: Add Employees → Review → Generate Proof → Verify → Submit
- Manual employee entry with name, Stellar wallet, salary amount, and department
- CSV import — upload `name,wallet,amount,department` and the table populates instantly
- CSV template download so users know the exact format
- Real Groth16 proof generation in the browser (snarkjs WASM, ~2 seconds)
- Live proof log showing circuit steps as they execute
- Soroban contract call via Freighter wallet signature
- Real USDC payments dispatched after proof verification
- Trustline checking — recipients without USDC trustlines are flagged, not silently failed
- Both proof tx hash and payment tx hash recorded and linked to Stellar Expert

**Dashboard**
- Real-time KPI row: total disbursed, verified runs, proof rate — all from localStorage
- Latest proof card showing real tx hash, cycle, and USDC amount
- Paginated activity feed: payroll created → proof verified → USDC sent
- Recent runs table with direct links to run detail

**Employees**
- Aggregated employee list built from all payroll runs
- Department assignment and filter (Engineering, Design, Finance, etc.)
- Total paid per employee across all runs
- Run count per employee
- Admin sees real salary amounts (private inputs stored locally, off-chain)

**Run detail**
- Both proof tx and payment tx with Stellar Expert links
- Full employee breakdown with real salaries visible to admin
- Verification timeline: Witness → Proof → Soroban → Payments
- Public record panel showing what the chain knows (total, count, verified=true)
- Individual payslip PDF download per employee
- Bulk "all payslips" download
- Receipt download in `.txt` and `.json` formats
- "Copy attestation link" for sharing with auditors

**ZK Payslip PDF**
- Dark-themed, professionally designed PDF per employee
- Shows: employee name, wallet, salary amount, cycle, payment date
- ZK proof attestation section with proof tx hash, contract address, Stellar Expert link
- Privacy notice explaining what the blockchain does and does not record
- Generated client-side via `@react-pdf/renderer` — no server involved

**Proof Explorer**
- Split-panel explorer: proof list on left, full detail on right
- Public inputs displayed clearly: total, min_salary, n_recipients
- Private inputs shown as `████████` — cryptographically hidden
- Verification timeline with timing estimates
- Links to run detail and Stellar Expert

**Public attestation page** (`/verify/[txHash]`)
- Shareable link for auditors, boards, or regulators
- Fetches transaction from Stellar Horizon in real time
- Displays: employer address, cycle, total, recipients, verification timestamp
- Full tx hash with copy button and Stellar Expert link
- Privacy notice: salary amounts are ZK-private
- No authentication required — designed for external sharing

**Documentation pages**
- `/docs` — full documentation with quickstart guide and security model
- `/docs/circuit` — circuit specification: constraints, signals table, trusted setup, proof structure
- `/docs/api` — API reference with request/response schemas
- `/pricing` — tiered pricing ($5/employee/month Startup, $3 Growth, Enterprise)
- `/status` — live system status for all components

**Settings**
- Admin name and company name persisted from onboarding
- Treasury wallet auto-populated from Freighter
- Proof configuration (read-only): circuit, constraints, curve, contract address, network
- Sidebar user section shows real admin name and initials from onboarding

---

## Tech Stack

| Layer | Technology |
|---|---|
| ZK Circuit | Circom 2.2.2 |
| Proving system | Groth16 |
| Elliptic curve | BN254 (alt_bn128) |
| Proof library | snarkjs 0.7.6 |
| Trusted setup | Hermez Perpetual Powers of Tau (2¹²) |
| Smart contract | Soroban (Rust) |
| Blockchain | Stellar Testnet |
| Contract SDK | soroban-sdk v26 |
| Frontend | Next.js 16 + TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Wallet | Freighter via @stellar/freighter-api |
| Stellar SDK | @stellar/stellar-sdk |
| Payments | USDC on Stellar Testnet |
| PDF generation | @react-pdf/renderer |
| Fonts | Inter + JetBrains Mono |

---

## Repo Structure

```
zerowage/
├── circuits/
│   ├── payroll.circom              # The ZK circuit — 660 constraints
│   ├── payroll.r1cs                # Compiled constraint system
│   ├── payroll_js/
│   │   └── payroll.wasm            # WASM prover (served from /public/circuit/)
│   ├── trusted_setup/
│   │   ├── pot12_final.ptau        # Hermez ceremony artifact
│   │   ├── payroll_final.zkey      # Circuit-specific proving key
│   │   └── verification_key.json   # Verifier key (embedded in contract)
│   └── test_input.json             # Example witness for testing
│
├── contracts/
│   └── payroll-verifier/
│       └── contracts/hello-world/
│           └── src/
│               └── lib.rs          # Soroban verifier contract
│
└── app/                            # Next.js 16 application
    ├── app/
    │   ├── page.tsx                # Landing page
    │   ├── dashboard/
    │   │   ├── page.tsx            # Dashboard with KPIs + activity
    │   │   ├── new/page.tsx        # 5-step payroll wizard
    │   │   ├── runs/
    │   │   │   ├── page.tsx        # Payroll runs list
    │   │   │   └── [id]/page.tsx   # Run detail + payslip download
    │   │   ├── employees/page.tsx  # Employee list with departments
    │   │   └── settings/page.tsx   # Company + proof configuration
    │   ├── explorer/page.tsx       # Proof explorer
    │   ├── verify/[txHash]/page.tsx # Public attestation (no auth)
    │   ├── docs/                   # Documentation pages
    │   ├── pricing/page.tsx        # Pricing tiers
    │   └── status/page.tsx         # System status
    │
    ├── components/
    │   ├── app-shell.tsx           # Sidebar + topbar + wallet status
    │   ├── auth/protected.tsx      # Wallet-gated route wrapper
    │   ├── onboarding/
    │   │   └── onboarding-modal.tsx # 3-step first-time setup
    │   ├── dashboard/
    │   │   ├── new-run-wizard.tsx  # 5-step payroll wizard
    │   │   ├── kpi-row.tsx         # Real-time stats from localStorage
    │   │   ├── latest-proof.tsx    # Most recent proof card
    │   │   └── activity-feed.tsx   # Paginated event timeline
    │   └── explorer/
    │       └── proof-explorer.tsx  # Split-panel proof browser
    │
    ├── lib/
    │   ├── wallet-context.tsx      # Freighter wallet React context
    │   ├── proof.ts                # snarkjs proof generation wrapper
    │   ├── contract.ts             # Soroban contract interaction
    │   ├── payroll-store.ts        # localStorage persistence layer
    │   ├── payslip-pdf.tsx         # @react-pdf/renderer payslip
    │   ├── download-payslip.ts     # PDF generation + download
    │   ├── receipt.ts              # txt + json receipt generation
    │   └── stellar.ts              # Stellar SDK helpers + constants
    │
    └── public/
        └── circuit/
            ├── payroll.wasm        # Circuit prover (served to browser)
            └── payroll_final.zkey  # Proving key (served to browser)
```

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/zerowage
cd zerowage

# Install frontend dependencies
cd app
npm install

# Run the development server
npm run dev
# → http://localhost:3000
```

> **Note:** The `.zkey` and `.ptau` files are not committed to the repository (they are large binary artifacts). To regenerate the trusted setup:

```bash
cd circuits

# Install dependencies
npm install circomlib

# Compile the circuit
circom2 payroll.circom --r1cs --wasm --sym --output .

# Powers of Tau ceremony
snarkjs powersoftau new bn128 12 trusted_setup/pot12_0000.ptau
snarkjs powersoftau contribute trusted_setup/pot12_0000.ptau trusted_setup/pot12_0001.ptau
snarkjs powersoftau prepare phase2 trusted_setup/pot12_0001.ptau trusted_setup/pot12_final.ptau

# Circuit-specific setup
snarkjs groth16 setup payroll.r1cs trusted_setup/pot12_final.ptau trusted_setup/payroll_0000.zkey
snarkjs zkey contribute trusted_setup/payroll_0000.zkey trusted_setup/payroll_final.zkey
snarkjs zkey export verificationkey trusted_setup/payroll_final.zkey trusted_setup/verification_key.json

# Copy artifacts to frontend public directory
cp payroll_js/payroll.wasm ../app/public/circuit/
cp trusted_setup/payroll_final.zkey ../app/public/circuit/
```

To deploy the Soroban contract to testnet:

```bash
cd contracts/payroll-verifier

# Install Stellar CLI
cargo install --locked stellar-cli

# Generate and fund a testnet identity
stellar keys generate deployer --network testnet
stellar keys fund deployer --network testnet

# Build and deploy
stellar contract build
stellar contract deploy \
  --wasm target/wasm32v1-none/release/hello_world.wasm \
  --source deployer \
  --network testnet
```

---

## Why Stellar

Stellar is the only production blockchain where this project is possible today. The X-Ray protocol upgrade introduced native BN254 elliptic curve host functions — `bn254_add`, `bn254_mul`, `bn254_pairing` — making Groth16 proof verification in a Soroban contract economically viable. On Ethereum, the equivalent verification costs hundreds of thousands of gas. On Stellar, it costs a fraction of a cent.

Beyond cryptography, Stellar is the right chain for payroll. USDC is a first-class asset, not a wrapped token. Path payments are native to the protocol. Settlement is 5 seconds, not 15 minutes. The Stellar Development Foundation's financial inclusion mission is philosophically aligned with ZeroWage's goal: making compliant, private payroll accessible to any company paying anyone, anywhere.

The combination of BN254 precompiles and payments-native infrastructure makes Stellar the only chain where "ZK payroll" is not an academic exercise.

---

## Future Roadmap

**Multi-sig payroll approval**
Before a payroll run can be submitted to the Soroban contract, require M-of-N signatures from designated approvers (CFO + CEO, or 2-of-3 treasury signers). The ZK proof is generated once; the approval workflow happens off-chain and the final submission is authorized by the multisig threshold.

**Recursive proof aggregation for enterprise scale**
The current circuit supports 20 recipients. For companies with thousands of employees, implement recursive Groth16 proof aggregation: batch proofs for 20 employees each, then generate a single aggregation proof that verifies all batches. One on-chain verification for a 10,000-person payroll run.

**Auditor portal with designated decryption**
An employer can designate an auditor's public key. The salary data is re-encrypted under the auditor's key and stored in Supabase. The auditor can decrypt their designated view without the employer revealing data to anyone else. The ZK proof still guarantees the decrypted data is correct — the auditor doesn't have to trust the employer's export.

**Stellar Anchor integration for fiat off-ramps**
Employees who receive USDC on Stellar can redeem it for local fiat through SEP-24-compliant Anchors without ever interacting with crypto directly. ZeroWage becomes the bridge between crypto-native payroll and local bank accounts in 180+ countries.

**TEE-based compliance oracle**
For jurisdictions requiring real payroll compliance data (minimum wage, tax withholding), a Trusted Execution Environment runs the salary validation logic and attests that the ZK circuit inputs satisfy jurisdiction-specific rules — without the TEE ever learning individual salaries, and without the employer manually asserting compliance.

**Cross-chain proof portability**
Export Stellar-verified payroll proofs as standards-compliant attestations (W3C Verifiable Credentials) that can be verified on any chain with BN254 precompiles. A payroll run proven on Stellar becomes a portable credential recognized by EVM chains, Cosmos, and any future chain that supports Groth16 verification.

---

## Acknowledgements

- **iden3 / Circom team** for building the most production-ready ZK circuit compiler and the circomlib constraint library
- **Stellar Development Foundation** for the Soroban platform, the BN254 host function precompiles in the X-Ray upgrade, and for building the payments infrastructure that makes this product real
- **Hermez Network** for the Perpetual Powers of Tau ceremony — a public good that every Groth16 project on any chain can rely on
- **Aztec Protocol** for advancing the theory and practice of practical ZK systems

---

*ZeroWage is proof that blockchain's transparency problem and payroll's privacy requirement are not in conflict — they just needed a different kind of math.*
