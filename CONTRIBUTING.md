# Contributing to ZeroWage

ZeroWage is an open-source, zero-knowledge payroll protocol on Stellar. Salaries are proven correct on-chain without ever being revealed on-chain. We welcome contributions of all sizes — from fixing a typo to implementing a roadmap feature.

## Getting Started

1. Fork the repository and clone your fork locally.
2. Read [TECHNICAL.md](./docs/TECHNICAL.md) to understand the ZK circuit and Soroban verifier architecture before touching either.
3. Follow the [Quick Start](./README.md#quick-start) in the README to get the circuit, contract, and frontend running locally.
4. Check [open issues](../../issues) — anything labeled `good first issue` is a solid entry point if you're new to the codebase.

## Areas Where Help Is Especially Useful

- **Circuit optimization** — reducing the constraint count in `payroll.circom` without weakening the guarantees.
- **Soroban contract tests** — more coverage around edge cases in the verifier and nullifier logic.
- **Frontend improvements** — the wizard, proof explorer, and mobile layout all have room to improve.
- **Documentation** — clarifying the ZK architecture, the approval workflow, or the deployment steps for someone encountering this for the first time.
- **Integration tests** — end-to-end coverage across circuit → contract → frontend.

## Development Setup

See the [Quick Start](./README.md#quick-start) section of the README for circuit compilation, trusted setup regeneration, and contract deployment steps.

## Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add multi-sig approval support
fix: resolve proof encoding for large salary values
docs: add circuit constraint explanation
test: add nullifier collision resistance test
ci: add GitHub Actions workflow for contract tests
refactor: simplify Poseidon commitment wrapper
```

## Opening a Pull Request

- Reference the issue your PR addresses (e.g. `Closes #12`).
- Describe **what** changed and **why** — not just what the diff shows.
- Any change to `contracts/` or `circuits/` must include or update tests.
- Keep PRs scoped to one concern where possible — smaller PRs get reviewed faster.

## Code of Conduct

By participating, you agree to uphold our [Code of Conduct](./CODE_OF_CONDUCT.md).

## Questions

Open a [GitHub Discussion](../../discussions) rather than an issue for open-ended questions about architecture or roadmap direction.
