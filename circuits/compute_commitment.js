const { buildPoseidon } = require('circomlibjs');

async function main() {
  const poseidon = await buildPoseidon();
  const F = poseidon.F;

  // First 8 salary slots from test input
  const salaries = [3000n, 4500n, 2800n, 5000n, 3200n, 0n, 0n, 0n];
  const hash = poseidon(salaries);
  const commitment = F.toString(hash);
  
  console.log('Commitment:', commitment);
  
  // Write updated test input
  const fs = require('fs');
  const input = {
    salaries: ["3000","4500","2800","5000","3200","0","0","0","0","0","0","0","0","0","0","0","0","0","0","0"],
    total: "18500",
    min_salary: "0",
    n_recipients: "5",
    commitment: commitment
  };
  fs.writeFileSync('test_input_v2.json', JSON.stringify(input, null, 2));
  console.log('test_input_v2.json updated with real commitment');
}

main().catch(console.error);