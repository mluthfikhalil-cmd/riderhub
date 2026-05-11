const fs = require('fs');
const path = require('path');
const BUNDLE = path.resolve(__dirname, '..', '.backups', 'live_bundle_2026-05-10.js');
const content = fs.readFileSync(BUNDLE, 'utf8');

// ZONE_META definition — look for the module export
// Pattern: e.ZONE_META={...}
const match = content.match(/ZONE_META\s*=\s*\{[\s\S]{1,30000}?\}\s*[;,}]/);
if (match) {
  console.log('=== ZONE_META definition ===');
  console.log(match[0].slice(0, 25000));
}

// Also find PART_TO_GARAGE_ZONE
const m2 = content.match(/PART_TO_GARAGE_ZONE\s*=\s*\{[\s\S]{1,5000}?\}/);
if (m2) {
  console.log('\n=== PART_TO_GARAGE_ZONE ===');
  console.log(m2[0].slice(0, 3000));
}

// And CONFIGURATOR-related objects
const m3 = content.match(/wheels_zone[\s\S]{1,10000}?\}\s*\]/);
if (m3) {
  console.log('\n=== wheels_zone items ===');
  console.log(m3[0].slice(0, 8000));
}
