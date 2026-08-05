# Security Policy

ZeroWage handles real value transfer (USDC on Stellar) and cryptographic proofs. We take security issues seriously.

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Instead, report it privately by emailing **[believeinsomething2421@gmail.com]** or by using GitHub's [private vulnerability reporting](../../security/advisories/new) feature on this repo.

Include, where possible:
- A description of the vulnerability and its potential impact
- Steps to reproduce
- Affected component (circuit, Soroban contract, frontend, approval workflow)
- Any relevant transaction hashes or contract addresses (testnet only — do not test against mainnet without permission)

## Scope

Security-relevant areas of this project include:

- **`circuits/payroll.circom`** — constraint soundness, commitment binding, potential for malicious witnesses to satisfy constraints incorrectly
- **`contracts/payroll-verifier`** — the Soroban verifier contract, nullifier logic, pairing check correctness, authorization/approval-gating logic
- **Approval workflow** — the Stellar-memo-based coordination mechanism between admin and approver wallets
- **Frontend proof generation and key handling** — anything touching salary data in the browser before it's discarded

## Response

We aim to acknowledge reports within 5 business days. This is a community-maintained open-source project without a dedicated security team, so response times may vary — we appreciate your patience and will credit researchers (with permission) once an issue is resolved.

## Known Limitations

See [TECHNICAL.md](./docs/TECHNICAL.md) for currently known limitations and the [Future Roadmap](./README.md#future-roadmap) in the README for planned hardening work (e.g. client-side encryption, multi-sig approval).
