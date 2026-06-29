const fs = require('fs');

// Load your verification key
const vk = JSON.parse(fs.readFileSync('trusted_setup/verification_key.json', 'utf8'));

// BN254 field element to 32-byte big-endian buffer
function fieldToBytes(hex) {
  // snarkjs outputs decimal strings, convert to hex
  const n = BigInt(hex);
  const buf = Buffer.alloc(32);
  let tmp = n;
  for (let i = 31; i >= 0; i--) {
    buf[i] = Number(tmp & 0xffn);
    tmp >>= 8n;
  }
  return buf;
}

// G1 point: [x, y] each 32 bytes = 64 bytes total
function encodeG1(point) {
  return Buffer.concat([
    fieldToBytes(point[0]),
    fieldToBytes(point[1]),
  ]);
}

// G2 point: [[x1,x2],[y1,y2]] each 32 bytes = 128 bytes total
// Note: BN254 G2 uses Fq2 coordinates
function encodeG2(point) {
  return Buffer.concat([
    fieldToBytes(point[0][1]), // x imaginary first (Fq2 convention)
    fieldToBytes(point[0][0]), // x real
    fieldToBytes(point[1][1]), // y imaginary first
    fieldToBytes(point[1][0]), // y real
  ]);
}

// Encode IC array: 4-byte length prefix + each G1 point
function encodeIC(ic) {
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(ic.length, 0);
  const points = ic.map(encodeG1);
  return Buffer.concat([lenBuf, ...points]);
}

// Full VK encoding:
// alpha (G1, 64 bytes)
// beta  (G2, 128 bytes)
// gamma (G2, 128 bytes)
// delta (G2, 128 bytes)
// IC    (4-byte len + n * 64 bytes)
const encoded = Buffer.concat([
  encodeG1(vk.vk_alpha_1),
  encodeG2(vk.vk_beta_2),
  encodeG2(vk.vk_gamma_2),
  encodeG2(vk.vk_delta_2),
  encodeIC(vk.IC),
]);

const hex = encoded.toString('hex');
fs.writeFileSync('trusted_setup/vk_encoded.hex', hex);

console.log('VK encoded successfully');
console.log('Total bytes:', encoded.length);
console.log('Alpha G1:', encodeG1(vk.vk_alpha_1).length, 'bytes');
console.log('Beta G2:', encodeG2(vk.vk_beta_2).length, 'bytes');
console.log('Gamma G2:', encodeG2(vk.vk_gamma_2).length, 'bytes');
console.log('Delta G2:', encodeG2(vk.vk_delta_2).length, 'bytes');
console.log('IC count:', vk.IC.length, '(' + (vk.IC.length * 64) + ' bytes)');
console.log('Hex saved to trusted_setup/vk_encoded.hex');