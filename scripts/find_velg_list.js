const fs = require('fs');
const path = require('path');
const BUNDLE = path.resolve(__dirname, '..', '.backups', 'live_bundle_2026-05-10.js');
const content = fs.readFileSync(BUNDLE, 'utf8');

// Find wheels_zone:{...items...} structure
const idx = content.indexOf('wheels_zone');
console.log(`'wheels_zone' occurrences:`);
let start = 0;
const positions = [];
while (true) {
  const i = content.indexOf('wheels_zone', start);
  if (i < 0) break;
  positions.push(i);
  start = i + 1;
  if (positions.length > 20) break;
}
console.log(`  ${positions.length} occurrences`);

// Print context around first few
positions.slice(0, 6).forEach((p) => {
  const chunk = content.slice(p, p + 2500);
  console.log(`\n--- pos ${p} ---`);
  console.log(chunk.replace(/\s+/g, ' ').slice(0, 2000));
});
