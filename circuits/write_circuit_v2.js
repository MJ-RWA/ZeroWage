const fs = require('fs');

const code = `pragma circom 2.0.0;

include "node_modules/circomlib/circuits/comparators.circom";
include "node_modules/circomlib/circuits/poseidon.circom";

/*
 * ZeroWage Payroll Circuit v2
 *
 * Proves three things without revealing individual salaries:
 * 1. sum(salaries[0..n]) == total
 * 2. each salary[i] >= min_salary
 * 3. poseidon_hash(salaries[0..7]) == commitment
 *    (first 8 slots hashed — ties proof to specific salary batch)
 *
 * n = 20 (pad unused slots with 0)
 */
template Payroll(n) {

    // Private inputs — never go on-chain
    signal input salaries[n];

    // Public inputs — recorded on Stellar
    signal input total;
    signal input min_salary;
    signal input n_recipients;
    signal input commitment;   // poseidon hash of first 8 salary slots

    // ── Constraint 1: sum(salaries) == total ──────────────────────────────
    signal running[n+1];
    running[0] <== 0;
    for (var i = 0; i < n; i++) {
        running[i+1] <== running[i] + salaries[i];
    }
    running[n] === total;

    // ── Constraint 2: each salary >= min_salary ───────────────────────────
    component geq[n];
    for (var i = 0; i < n; i++) {
        geq[i] = GreaterEqThan(32);
        geq[i].in[0] <== salaries[i];
        geq[i].in[1] <== min_salary;
        geq[i].out === 1;
    }

    // ── Constraint 3: poseidon commitment of first 8 salary slots ─────────
    // Poseidon supports up to 16 inputs in circomlib.
    // We hash the first 8 slots — enough to uniquely fingerprint any
    // realistic payroll batch and prevent proof reuse across cycles.
    component hash = Poseidon(8);
    for (var i = 0; i < 8; i++) {
        hash.inputs[i] <== salaries[i];
    }
    hash.out === commitment;

    // ── Auxiliary: recipient count signal (checked by contract) ───────────
    signal recipient_check;
    recipient_check <== n_recipients;
}

component main {public [total, min_salary, n_recipients, commitment]} = Payroll(20);
`;

fs.writeFileSync('payroll.circom', code);
console.log('Circuit v2 written');