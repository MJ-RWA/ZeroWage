const { execSync } = require('child_process');
const fs = require('fs');

const hex = fs.readFileSync('trusted_setup/vk_encoded.hex', 'utf8').trim();
const CONTRACT = 'CCOEJ6QC6ZGGA2GIY72IW3MDN6LNJHQSB2XWRZR3WSLE3PVVE6QVUYAP';

console.log('VK hex length:', hex.length, 'chars =', hex.length / 2, 'bytes');
console.log('Calling set_vk on contract:', CONTRACT);

const cmd = [
  'stellar contract invoke',
  '--id', CONTRACT,
  '--source deployer',
  '--network testnet',
  '--',
  'set_vk',
  '--vk_bytes', hex,
].join(' ');

console.log('Running command...');
try {
  const result = execSync(cmd, { encoding: 'utf8', cwd: process.cwd() });
  console.log('SUCCESS:', result);
} catch (e) {
  console.error('ERROR:', e.stdout || e.message);
}