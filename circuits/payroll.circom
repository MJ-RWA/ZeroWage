pragma circom 2.0.0;

include "node_modules/circomlib/circuits/comparators.circom";
include "node_modules/circomlib/circuits/poseidon.circom";

/*
 * ZeroWage Payroll Circuit v3
 *
 * Fixes: min_salary constraint now only applies to ACTIVE slots.
 * Padded (inactive) slots are excluded from the geq check.
 *
 * Proves three things without revealing individual salaries:
 * 1. sum(salaries[0..n]) == total
 * 2. each ACTIVE salary[i] >= min_salary (padded slots exempt)
 * 3. poseidon_hash(salaries[0..7]) == commitment
 *
 * n = 20 (pad unused slots with 0)
 * n_recipients = number of active slots (1..20)
 */
template Payroll(n) {

    // Private inputs
    signal input salaries[n];

    // Public inputs
    signal input total;
    signal input min_salary;
    signal input n_recipients;
    signal input commitment;

    // ── Constraint 1: sum(salaries) == total ──────────────────────────────
    signal running[n+1];
    running[0] <== 0;
    for (var i = 0; i < n; i++) {
        running[i+1] <== running[i] + salaries[i];
    }
    running[n] === total;

    // ── Constraint 2: each ACTIVE salary >= min_salary ────────────────────
    // For each slot i:
    //   if i < n_recipients (active): salaries[i] >= min_salary must hold
    //   if i >= n_recipients (padded): no constraint
    //
    // Implementation:
    //   is_active[i] = LessThan(i, n_recipients)
    //   geq[i].out * is_active[i] === is_active[i]
    //   (if active, geq must be 1; if inactive, 0*anything == 0 == 0 ✓)
    component lt[n];
    component geq[n];
    signal is_active[n];
    signal active_and_geq[n];

    for (var i = 0; i < n; i++) {
        lt[i] = LessThan(5);
        lt[i].in[0] <== i;
        lt[i].in[1] <== n_recipients;
        is_active[i] <== lt[i].out;

        geq[i] = GreaterEqThan(32);
        geq[i].in[0] <== salaries[i];
        geq[i].in[1] <== min_salary;

        // active_and_geq[i] = is_active[i] * geq[i].out
        // Must equal is_active[i]:
        // - if active (1): 1 * geq.out == 1 → geq must be 1 ✓
        // - if inactive (0): 0 * geq.out == 0 ✓ (always passes)
        active_and_geq[i] <== is_active[i] * geq[i].out;
        active_and_geq[i] === is_active[i];
    }

    // ── Constraint 3: poseidon commitment of first 8 salary slots ─────────
    component hash = Poseidon(8);
    for (var i = 0; i < 8; i++) {
        hash.inputs[i] <== salaries[i];
    }
    hash.out === commitment;
}

component main {public [total, min_salary, n_recipients, commitment]} = Payroll(20);
