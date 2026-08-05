# Changelog

All notable changes to ZeroWage will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Planned
- Multi-sig (M-of-N) approval workflow
- Client-side AES-GCM encryption for off-chain salary storage
- Recursive proof aggregation for 20+ recipients

## [0.1.0] — 2026-06-XX

### Added
- Circom 2 payroll circuit with 1,065 constraints (sum correctness, minimum-wage floor, Poseidon commitment)
- Real Groth16/BN254 verification in a Soroban smart contract using native pairing host functions
- On-chain nullifier system preventing proof replay
- CFO/admin approval workflow coordinated entirely via Stellar memo payments, wallet-gated
- Real USDC disbursement to recipient wallets on Stellar testnet, with trustline checking
- Client-side ZK payslip PDF generation, stamped with proof hash and contract address
- Public, unauthenticated attestation page (`/verify/[txHash]`)
- Proof Explorer with public/private input separation
- Freighter-based wallet-native authentication

### Contract
- Deployed to Stellar testnet: `CCOEJ6QC6ZGGA2GIY72IW3MDN6LNJHQSB2XWRZR3WSLE3PVVE6QVUYAP`

### Known Limitations
- Circuit supports a maximum of 20 recipients per proof (see [#1](../../issues/1))
- Single-approver model only (see [#2](../../issues/2))
- Salary data persists in browser localStorage without encryption (see [#3](../../issues/3))
