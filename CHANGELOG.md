# Changelog

All notable changes to ZeroWage are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

### In progress
- Recursive proof aggregation for >20 recipients (#1)
- SEP-24 fiat off-ramp integration (#4)
- Mainnet deployment configuration (#8)

---

## [0.3.0] — In development

### Added
- M-of-N multi-sig approval workflow — contract and frontend (#2)
  - `set_approvers(approvers, threshold)` stores authorized wallets on-chain
  - `record_approval(run_key, approver)` validates and accumulates signatures
  - `get_approval_status(run_key)` returns current approval record
  - New error codes: `ApproverNotAuthorized`, `ThresholdNotMet`, `AlreadyApproved`
  - Settings page: second approver wallet + required approvals toggle
  - Wizard: per-approver status display for 2-of-2 flows
- GitHub Actions CI: `cargo test` runs on every PR targeting `main`
- CHANGELOG.md tracking all releases

---

## [0.2.0] — 2026-07-14

### Added
- Encrypted off-chain salary storage via Supabase (#3)
  - Client-side AES-GCM encryption (256-bit) before any data leaves browser
  - Encryption key derived from Stellar wallet address via PBKDF2 (100k iterations)
  - Dual-layer architecture: localStorage for instant reads, Supabase for persistence
  - `getPayrollRunsSync()` for synchronous access, `getPayrollRuns()` for Supabase sync
  - Payroll history now survives browser cache clears and syncs across devices
- Horizon SSE streaming for approval detection (#5)
  - Replaced 5-second polling with Horizon's EventStream API
  - CFO approval detected within milliseconds of transaction confirming
  - Automatic fallback to polling if streaming unavailable

### Fixed
- `min_salary` constraint failing for padded salary slots (#7)
  - Added `LessThan(5)` components to compute `is_active[i]` per slot
  - Constraint `active_and_geq[i] === is_active[i]` only enforces geq for active slots
  - Padded slots (i >= n_recipients) now correctly exempt from minimum check
  - Circuit updated to v3: 1,205 non-linear constraints, 2,094 wires
  - Trusted setup re-run, verification key updated on Soroban contract

### Changed
- `payroll.circom` updated from v2 (1,065 constraints) to v3 (1,205 constraints)
- Soroban contract redeployed with updated verification key
- `pnpm` adopted as package manager (replaces `npm` for Vercel compatibility)

---

## [0.1.0] — 2026-06-30

Initial release. Built during Stellar Hacks: Real-World ZK hackathon (June 2026).

### Added

**ZK Circuit**
- `payroll.circom` — Circom 2.2.2, Groth16/BN254
- Three enforced constraints:
  - Sum correctness: `sum(salaries) === total`
  - Minimum salary floor: `each salary >= min_salary` (via `GreaterEqThan(32)`)
  - Poseidon batch commitment: `poseidon(salaries[0..8]) === commitment`
- Hermez Perpetual Powers of Tau trusted setup (2¹²)
- Browser-side proof generation via snarkjs WASM (~2 seconds)
- Circuit stats: 1,065 non-linear constraints, 20 private inputs, 4 public inputs

**Soroban Smart Contract**
- Real BN254 Groth16 pairing verification using Stellar native host functions
  (`bn254_g1_mul`, `bn254_g1_add`, `bn254_pairing_check`)
- On-chain nullifier system (`sha256(proof_bytes)`) preventing proof replay
- Verification key stored on-chain via `set_vk()`
- `verify_and_record()` stores `PayrollRun` and emits `PAYROLL·VERIFIED` event
- `get_run()` for payroll run retrieval
- `is_nullifier_used()` for replay detection
- 6 unit tests covering all primary failure modes
- Deployed: `CCOEJ6QC6ZGGA2GIY72IW3MDN6LNJHQSB2XWRZR3WSLE3PVVE6QVUYAP` (Stellar Testnet)

**Approval Workflow**
- `DRAFT → APPROVED → PAID` run lifecycle
- CFO approval via Stellar memo payment — no backend required
- Cross-browser: approval URL encodes run summary in base64 query param
- Wallet-gated: only the configured approver wallet address may approve
- Admin polls Stellar Horizon every 5 seconds for memo payment detection

**Payments**
- Real USDC disbursement via `Operation.payment()` after proof verification
- Per-recipient trustline checking — wallets without USDC trustline flagged
- Both proof tx hash and payment tx hash recorded and linked to Stellar Expert

**Frontend**
- Next.js 16 + TypeScript + Tailwind CSS v4 + shadcn/ui
- Freighter wallet as sole identity — no email, no password
- Protected dashboard routes with hydration-safe wallet detection
- First-run onboarding modal (admin name, company, role, team size)
- 5-step payroll wizard: Add Employees → Review → Generate Proof → Approval → Submit
- CSV import with downloadable template (`name,wallet,amount,department`)
- Department tagging and filtering on employee roster
- ZK payslip PDF per employee (`@react-pdf/renderer`, generated client-side)
- Payroll receipt download (`.txt` and `.json`)
- Public attestation page (`/verify/[txHash]`) — no authentication required
- Proof Explorer with split-panel layout
- Pending approvals sidebar page with live badge count
- Real-time dashboard: KPI row, latest proof card, paginated activity feed
- Wallet-native auth, no flash on hydration

**Documentation**
- README with story-driven introduction and full architecture diagram
- TECHNICAL.md with circuit specs, trusted setup provenance, security model
- `/docs` — quickstart and security model
- `/docs/circuit` — constraint table, signal visibility, proof structure
- `/docs/api` — request/response schemas
- `/pricing` and `/status` pages

---

## Links

- [v0.1.0 Release](https://github.com/MJ-RWA/ZeroWage/releases/tag/v0.1.0)
- [v0.2.0 Release](https://github.com/MJ-RWA/ZeroWage/releases/tag/v0.2.0)
- [Open issues](https://github.com/MJ-RWA/ZeroWage/issues)
- [Live app](https://zerowage-theta.vercel.app)
- [Contract on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CCOEJ6QC6ZGGA2GIY72IW3MDN6LNJHQSB2XWRZR3WSLE3PVVE6QVUYAP)

