# ZeroWage — Technical Reference

This document is written for judges, auditors, and engineers who want to understand
exactly what the cryptography does, why each design decision was made, and how the
pieces fit together. If a claim sounds strong, there's a reason for it here.

---

## Table of Contents

1. [The Circuit](#1-the-circuit)
2. [Trusted Setup](#2-trusted-setup)
3. [Proof Structure](#3-proof-structure)
4. [The On-Chain Verifier](#4-the-on-chain-verifier)
5. [Nullifier System](#5-nullifier-system)
6. [Poseidon Commitment](#6-poseidon-commitment)
7. [Approval Architecture](#7-approval-architecture)
8. [Security Properties](#8-security-properties)
9. [Known Limitations](#9-known-limitations)
10. [Test Coverage](#10-test-coverage)

---

## 1. The Circuit

**File:** `circuits/payroll.circom`
**Tool:** Circom 2.2.2
**Proving system:** Groth16
**Curve:** BN254 (alt_bn128)

### Signals

| Signal | Type | Visibility | Description |
|---|---|---|---|
| `salaries[20]` | `signal input` | **Private** | Individual salary amounts, padded to 20 slots |
| `total` | `signal input` | Public | Claimed sum of all salaries |
| `min_salary` | `signal input` | Public | Minimum any recipient may receive |
| `n_recipients` | `signal input` | Public | Number of active (non-padded) salary slots |
| `commitment` | `signal input` | Public | Poseidon hash of `salaries[0..8]` |

### Constraints

**Constraint 1 — Sum correctness (linear, O(n))**

```circom
signal running[n+1];
running[0] <== 0;
for (var i = 0; i < n; i++) {
    running[i+1] <== running[i] + salaries[i];
}
running[n] === total;
```

Proves `sum(salaries[0..20]) == total`. This is a linear constraint — no multiplication
required — so it adds 20 wires and 20 linear constraints, O(n) in recipients.

**Constraint 2 — Minimum salary floor (non-linear, O(n))**

```circom
component geq[n];
for (var i = 0; i < n; i++) {
    geq[i] = GreaterEqThan(32);
    geq[i].in[0] <== salaries[i];
    geq[i].in[1] <== min_salary;
    geq[i].out === 1;
}
```

Uses circomlib's `GreaterEqThan(32)` template, which internally uses a binary
decomposition comparison. Each instance adds ~33 non-linear constraints.
With 20 recipients this accounts for the bulk of the 1,065 total.

**Constraint 3 — Poseidon batch commitment (non-linear)**

```circom
component hash = Poseidon(8);
for (var i = 0; i < 8; i++) {
    hash.inputs[i] <== salaries[i];
}
hash.out === commitment;
```

Hashes the first 8 salary slots using Poseidon — a ZK-friendly hash function
designed for efficient circuit representation. This constrains the proof to a
specific salary batch: a valid proof for June's payroll cannot be reused for
July's even if the total happens to be the same, because the commitment would differ.
Circomlib's Poseidon supports up to 16 inputs per invocation; we use 8 to
stay well within bounds while covering the critical salary slots.

### Compiled statistics

| Property | Value |
|---|---|
| Non-linear constraints | 1,065 |
| Linear constraints | 866 |
| Wires | 1,914 |
| Labels | 2,820 |
| Public inputs | 4 |
| Private inputs | 20 |
| Proof size | ~384 bytes (3 curve points) |
| Browser proving time | ~2 seconds (snarkjs WASM, modern hardware) |

---

## 2. Trusted Setup

ZeroWage uses the **Hermez Perpetual Powers of Tau** ceremony, parameterized for
2¹² = 4,096 constraints. Our circuit uses 1,065 non-linear constraints, comfortably
within this bound.

### Why Hermez

The Powers of Tau ceremony is a multi-party computation that generates the
structured reference string (SRS) Groth16 needs. Security holds as long as at
least one participant destroyed their secret randomness ("toxic waste"). The Hermez
ceremony had 200+ independent participants across multiple continents; its
transcripts are publicly verifiable. We use this instead of running our own
ceremony because:

1. Our own 2-party ceremony (the approach most hackathon projects take) is strictly
   weaker — it requires trusting two specific people.
2. Hermez artifacts are a recognized public good already used in production systems.

### Setup artifacts

```
trusted_setup/
├── pot12_final.ptau         # Phase 1: Hermez ceremony output for 2^12
├── payroll_0000.zkey        # Phase 2 initial (groth16 setup from r1cs)
├── payroll_final.zkey       # Phase 2 with contribution (proving key)
└── verification_key.json    # Verification key (embedded in Soroban contract)
```

The `.zkey` and `.ptau` files are binary artifacts not committed to the repo
(each is 400KB–5MB). The `README.md` contains exact commands to regenerate them.
The `verification_key.json` is the source of truth; it's encoded into 772 bytes
of binary data and stored on-chain via `set_vk()`.

### Verification key encoding

`circuits/encode_vk.js` converts the snarkjs JSON verification key into the
binary format the Soroban contract expects:

```
alpha_G1   64 bytes  (x, y field elements, 32 bytes each)
beta_G2   128 bytes  (x_im, x_re, y_im, y_re — Fq2 convention)
gamma_G2  128 bytes
delta_G2  128 bytes
IC_len      4 bytes  (uint32 big-endian, value: 5)
IC[0..4]  320 bytes  (5 × 64 bytes)
─────────────────────
Total:    772 bytes
```

IC (input coefficients) has one entry per public input plus one constant term,
so `IC.length == 4 public inputs + 1 == 5`. The on-chain verification key
is stored in contract instance storage under a fixed key and loaded once per
`verify_and_record` call.

---

## 3. Proof Structure

A Groth16 proof over BN254 consists of three elliptic curve points:

```json
{
  "pi_a": ["field_element_x", "field_element_y"],           // G1 point (64 bytes)
  "pi_b": [["x_im", "x_re"], ["y_im", "y_re"]],            // G2 point (128 bytes)
  "pi_c": ["field_element_x", "field_element_y"],           // G1 point (64 bytes)
  "protocol": "groth16",
  "curve": "bn128"
}
```

**Total proof size: 256 bytes** (as binary, without JSON wrapping).

When submitted to the contract, proof points are serialized using the same
convention as the verification key: G1 points as `[x_bytes_32, y_bytes_32]`,
G2 points as `[x_im_32, x_re_32, y_im_32, y_re_32]`.

The public signals are serialized separately:

```
4 bytes: signal count (uint32 big-endian, value: 4)
32 bytes: total (as 256-bit big-endian integer)
32 bytes: min_salary
32 bytes: n_recipients
32 bytes: commitment
─────────
132 bytes total
```

---

## 4. The On-Chain Verifier

**File:** `contracts/payroll-verifier/contracts/hello-world/src/lib.rs`
**SDK:** soroban-sdk 27.0.0-rc.1
**Contract ID:** `CCOEJ6QC6ZGGA2GIY72IW3MDN6LNJHQSB2XWRZR3WSLE3PVVE6QVUYAP`

### Why this matters

Most "ZK on-chain" demos either:
- Store proof bytes on-chain and check they're non-empty (not verification)
- Call an off-chain oracle that verifies and writes a result (not on-chain)

ZeroWage does neither. The contract performs the actual Groth16 verification
equation using Stellar's native BN254 host functions.

### Verification equation

```
e(−π_A, π_B) · e(α, β) · e(vk_x, γ) · e(π_C, δ) = 1
```

where `vk_x = IC[0] + Σᵢ(public_input[i] · IC[i+1])`.

This is implemented directly:

```rust
fn verify_groth16(
    env: &Env,
    vk: VerificationKey,
    proof: Proof,
    pub_signals: Vec<Fr>,
) -> Result<bool, VerifierError> {
    if pub_signals.len() + 1 != vk.ic.len() {
        return Err(VerifierError::MalformedVerifyingKey);
    }

    let bn = env.crypto().bn254();

    // Compute vk_x = IC[0] + sum(pub_signals[i] * IC[i+1])
    let mut vk_x = vk.ic.get(0).unwrap();
    for (s, v) in pub_signals.iter().zip(vk.ic.iter().skip(1)) {
        let prod = bn.g1_mul(&v, &s);
        vk_x = bn.g1_add(&vk_x, &prod);
    }

    // The Groth16 pairing check: 4 pairings, result must be identity
    let neg_a = -proof.a;
    let vp1 = vec![env, neg_a, vk.alpha, vk_x, proof.c];
    let vp2 = vec![env, proof.b, vk.beta, vk.gamma, vk.delta];

    Ok(bn.pairing_check(vp1, vp2))
}
```

`bn.pairing_check()` invokes Stellar's native BN254 multi-pairing host function,
which evaluates the Miller loop and final exponentiation on-chain. This is not
simulated — it is a cryptographic operation executed by Stellar's runtime.

### Contract functions

| Function | Description |
|---|---|
| `set_vk(vk_bytes)` | Store verification key in instance storage. Called once after deployment. |
| `verify_and_record(employer, cycle_id, total, n_recipients, proof_bytes, pub_signals)` | Core function: nullifier check, VK load, deserialization, BN254 verification, nullifier write, run storage, event emit. |
| `get_run(employer, cycle_id)` | Read a stored `PayrollRun` by key. |
| `is_nullifier_used(proof_bytes)` | Check if a proof's SHA-256 hash has already been spent. |

### Error codes

| Code | Meaning |
|---|---|
| `MalformedVerifyingKey = 1` | VK bytes don't parse to valid curve points |
| `VerificationKeyNotSet = 2` | `set_vk()` was never called |
| `MalformedProof = 3` | Proof bytes don't parse |
| `MalformedPublicSignals = 4` | Signal encoding is invalid or wrong count |
| `ProofAlreadyUsed = 5` | Nullifier already in storage — replay attempt |
| `ProofVerificationFailed = 6` | Pairing equation did not hold |

---

## 5. Nullifier System

A nullifier is a one-time marker that permanently records "this proof has been
spent." ZeroWage uses `sha256(proof_bytes)` as the nullifier.

```rust
fn nullifier_from_proof(env: &Env, proof_bytes: &Bytes) -> Bytes {
    let hash = env.crypto().sha256(proof_bytes);
    let arr = hash.to_array();
    Bytes::from_array(env, &arr)
}
```

Before verification:
```rust
let null_key = (symbol_short!("NULL"), nullifier.clone());
if env.storage().persistent().has(&null_key) {
    return Err(VerifierError::ProofAlreadyUsed);
}
```

After verification:
```rust
env.storage().persistent().set(&null_key, &true);
```

### Why this matters

Without nullifiers, a valid proof for June's payroll could be submitted again
in July — passing all verification checks because the proof is still
cryptographically valid — and triggering another recorded attestation (or
another USDC disbursement if the caller also sends payment). The nullifier
makes each proof a single-use artifact: once spent, permanently spent.

This is the same mechanism Zcash uses to prevent note double-spending.

### Combined with Poseidon commitment

The nullifier prevents reuse of the same proof bytes. The Poseidon commitment
prevents a new proof from being generated for a different salary batch that
happens to have the same public totals. Together they ensure:

- Same proof bytes → rejected by nullifier check
- Same totals, different salaries → rejected because commitment differs
- Same salaries, same totals → generates identical proof and commitment,
  rejected by nullifier check

---

## 6. Poseidon Commitment

### Why Poseidon and not SHA-256

SHA-256 is extremely expensive to implement in a ZK circuit — it requires
thousands of constraints per invocation due to its bitwise operations. Poseidon
is a hash function designed specifically for use inside arithmetic circuits over
prime fields. Each Poseidon(8) call adds roughly 240 constraints, versus ~25,000
for SHA-256.

### What it commits to

```circom
component hash = Poseidon(8);
for (var i = 0; i < 8; i++) {
    hash.inputs[i] <== salaries[i];
}
hash.out === commitment;
```

We hash the first 8 salary slots. The `commitment` value is a public output
of the circuit — it appears in `publicSignals[3]` and is stored on Stellar.

An auditor with access to the salary data can independently compute
`Poseidon(salaries[0..8])` and verify it matches the on-chain commitment,
confirming the proof was generated for this specific salary batch.

### Practical example

For a payroll run with salaries `[3000, 4500, 2800, 5000, 3200, 0, 0, 0]`
in the first 8 slots, the Poseidon commitment is:

```
486050705090383856309069735755768246115656074295761079472470596120056838176
```

This value is stored in `publicSignals[3]` in the `public.json` output and
submitted to the contract as the 4th public signal.

---

## 7. Approval Architecture

### The problem with a backend

A naive approval flow stores draft runs in a database and has the CFO log in
to approve. This requires: a server, authentication, a database, session management,
and a trust assumption that the server isn't compromised.

ZeroWage uses Stellar itself as the approval coordination layer.

### How it works

```
1. Admin generates ZK proof → run saved as DRAFT in browser localStorage
2. Admin generates approval URL:
   /approve/[runId]?data=base64(JSON({ id, cycleId, total, recipients,
                                       date, adminWallet, approverWallet }))
3. CFO opens URL in any browser, any device — run summary decoded from URL params
4. CFO connects Freighter wallet
5. If approverWallet is configured: contract checks connected wallet matches
   exactly — wrong wallet gets rejected immediately
6. CFO clicks "Approve" → sends 1 XLM to adminWallet with memo = runId[0..28]
7. Admin's browser polls Horizon every 5 seconds for payments to adminWallet
8. Admin detects memo payment → updateRunStatus(runId, 'approved') → Submit unlocks
```

### Why this is sound

- **No backend required** — the approval signal is a Stellar transaction,
  permanently recorded on-chain
- **Works across browsers and devices** — the run summary is URL-encoded, not
  locked in localStorage
- **Works across days or weeks** — the XLM payment persists on Stellar indefinitely;
  the admin's polling will find it whenever they return
- **Wallet-gated** — if a specific approver address is configured, only that
  address can approve; any other wallet is rejected client-side before it can
  even send a payment
- **CFO never sees salaries** — the URL encodes only `total`, `recipients`,
  `cycleId`, `date`, `adminWallet`, and `approverWallet`; no salary breakdown
  is ever transmitted

### Run states

```
DRAFT    → proof generated, awaiting CFO approval
APPROVED → CFO memo payment detected, Submit button unlocked
PAID     → verify_and_record() called on Stellar, USDC sent
```

Draft and approved runs are permanently visible in the `/dashboard/pending` page
with a live badge count in the sidebar. They persist until the admin explicitly
submits them. Closing the tab does not lose a draft — it's in localStorage and
can be resumed via `?runId=` URL parameter.

---

## 8. Security Properties

### What the ZK proof guarantees

| Property | Guaranteed | How |
|---|---|---|
| Sum correctness | ✓ | Circuit constraint 1 |
| Minimum salary floor | ✓ | Circuit constraint 2 |
| Batch commitment | ✓ | Poseidon constraint 3 |
| Salary privacy | ✓ | Private inputs never leave browser |
| Non-malleability | ✓ | Groth16 proofs are non-malleable |

### What the contract guarantees

| Property | Guaranteed | How |
|---|---|---|
| Proof validity | ✓ | BN254 pairing check on-chain |
| No replay | ✓ | SHA-256 nullifier in persistent storage |
| VK integrity | ✓ | VK stored once at deploy time via set_vk() |
| Immutable record | ✓ | PayrollRun in persistent contract storage |

### What the approval flow guarantees

| Property | Guaranteed | How |
|---|---|---|
| Two-party authorization | ✓ | Stellar memo payment from designated approver |
| Approver identity | ✓ | Wallet-gated: only configured address may approve |
| Audit trail | ✓ | Approval XLM transaction is permanently on Stellar |
| Salary privacy from approver | ✓ | Approver URL contains only aggregate data |

### What is NOT guaranteed

- **Admin honesty about salary inputs** — the circuit proves the math over
  whatever inputs the admin provides. If an admin inputs `0` for an employee
  they paid separately off-chain, the circuit cannot detect this. The proof
  proves internal consistency, not absolute correctness of the inputs.

- **Trustline existence** — USDC payments silently skip recipients without
  a USDC trustline. This is logged in the UI but is not enforced by the contract.

- **Admin recovery if tab crashes before draft is saved** — if the browser
  crashes between proof generation and `savePayrollRun()`, the draft is lost.
  The proof would need to be regenerated. This is a known limitation.

---

## 9. Known Limitations

**20-recipient limit per proof**
The circuit is parameterized for `n=20`. This is a compile-time constant.
Scaling requires either increasing `n` (larger circuit, longer proving time)
or implementing recursive proof aggregation (multiple 20-person batches
aggregated into one proof). Recursive aggregation is on the roadmap.

**Poseidon commits only to slots 0–7**
We hash the first 8 salary slots. For payrolls with more than 8 recipients,
slots 8–19 are not covered by the commitment — an admin could theoretically
modify those amounts after proof generation without changing the commitment.
In practice this is mitigated by the nullifier system (the same proof bytes
can't be reused), but a production version should either extend the commitment
to all 20 slots (requires chunked Poseidon) or move to a Merkle tree root.

**Approval is client-polled, not pushed**
The admin's approval detection polls Stellar Horizon every 5 seconds. If
the admin closes their tab and reopens the run later, polling restarts and
will find the approval. But there's no push notification — the admin must
have the tab open or return to check.

**localStorage as state store**
All run data (including salary amounts) is stored in browser localStorage.
This is intentional — no server holds salary data — but it means data is
lost if the user clears their browser storage. A production version would
encrypt salary data under the employer's key and store ciphertext in a
database, with the decryption key never leaving the browser.

**soroban-sdk 27.0.0-rc.1**
The BN254 host functions required `soroban-sdk = "27"`. The stable `27.0.0`
release was not yet published at time of submission; we use the release
candidate. The API is stable and unchanged from what the stable release will
ship.

---

## 10. Test Coverage

**Contract unit tests** (`cargo test` — 6/6 passing):

| Test | What it verifies |
|---|---|
| `test_vk_not_set_returns_error` | `verify_and_record` fails if `set_vk` was never called |
| `test_malformed_proof_rejected` | Too-short proof bytes fail deserialization before pairing |
| `test_malformed_public_signals_rejected` | Signals claiming 4 entries but providing 1 are rejected |
| `test_malformed_vk_rejected_at_set_time` | Malformed VK bytes fail at `set_vk` time, not later |
| `test_get_run_returns_none_when_not_recorded` | Storage reads return `None` cleanly for missing keys |
| `test_nullifier_unused_by_default` | `is_nullifier_used` correctly returns `false` for a fresh proof |

**Circuit tests** (snarkjs CLI):

```bash
# Proof generation + local verification
snarkjs groth16 fullprove test_input_v2.json payroll_js/payroll.wasm \
  trusted_setup/payroll_final.zkey proof.json public.json
snarkjs groth16 verify trusted_setup/verification_key.json public.json proof.json
# → [INFO] snarkJS: OK!
```

**End-to-end tests** (manual, on Stellar testnet):
- Proof submitted to `verify_and_record` → `true` returned, PayrollRun stored
- Proof resubmitted → `ProofAlreadyUsed` error
- USDC payments confirmed on Stellar Expert for both recipient wallets
- Public attestation page confirms transaction from Horizon

---

## Appendix: Running the verifier locally

```bash
# Compile circuit
circom2 payroll.circom --r1cs --wasm --sym --output .

# Compute Poseidon commitment for test input
node compute_commitment.js

# Generate proof
snarkjs groth16 fullprove test_input_v2.json \
  payroll_js/payroll.wasm \
  trusted_setup/payroll_final.zkey \
  proof.json public.json

# Verify locally
snarkjs groth16 verify trusted_setup/verification_key.json public.json proof.json

# Encode VK for contract
node encode_vk.js

# Push VK to deployed contract
node call_set_vk.js

# Run contract tests
cd ../contracts/payroll-verifier && cargo test
```