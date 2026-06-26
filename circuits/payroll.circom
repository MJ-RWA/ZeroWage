pragma circom 2.0.0;

include "node_modules/circomlib/circuits/comparators.circom";

template Payroll(n) {

    signal input salaries[n];
    signal input total;
    signal input min_salary;
    signal input n_recipients;

    signal running[n+1];
    running[0] <== 0;
    for (var i = 0; i < n; i++) {
        running[i+1] <== running[i] + salaries[i];
    }
    running[n] === total;

    component geq[n];
    for (var i = 0; i < n; i++) {
        geq[i] = GreaterEqThan(32);
        geq[i].in[0] <== salaries[i];
        geq[i].in[1] <== min_salary;
        geq[i].out === 1;
    }

    signal recipient_check;
    recipient_check <== n_recipients;
}

component main {public [total, min_salary, n_recipients]} = Payroll(20);
