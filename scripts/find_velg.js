const fs = require('fs');
const path = require('path');
const BUNDLE = path.resolve(__dirname, '..', '.backups', 'live_bundle_2026-05-10.js');
const content = fs.readFileSync(BUNDLE, 'utf8');

// Find the ZONE_META structure that lists all models + variants
console.log('=== ZONE_META structure ===');
const zmIdx = content.indexOf('ZONE_META');
if (zmIdx >= 0) {
  // Extract a big chunk around it
  const chunk = content.slice(zmIdx - 50, zmIdx + 8000);
  console.log(chunk.replace(/\s+/g, ' ').slice(0, 6000));
}
