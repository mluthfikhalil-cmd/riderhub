// Full extraction — find every module in the bundle and dump its chunk
// so we can systematically port each feature.
const fs = require('fs');
const path = require('path');

const BUNDLE = path.resolve(__dirname, '..', '.backups', 'live_bundle_2026-05-10.js');
const OUT_DIR = path.resolve(__dirname, '..', '.backups', 'extracted');
fs.mkdirSync(OUT_DIR, { recursive: true });
const content = fs.readFileSync(BUNDLE, 'utf8');

// Metro bundle modules are defined as: __d(function(g,r,...){...},ID,[deps]);
// The ID is the module index.
const modRegex = /__d\(function\([^)]*\)\{[\s\S]*?\},(\d+),\[[^\]]*\]\);?/g;

// Also capture minified module registrations
const modules = [];
let match;
modRegex.lastIndex = 0;

// Simpler: match by ID counter using regex lookahead
// Structure: ... __d(function(...){BODY},ID,[DEPS]);
// Since JS regex can't do balanced braces, we brute-force:

let i = 0;
let idx = 0;
while ((idx = content.indexOf('__d(function', idx)) >= 0) {
  // Find the matching closing });
  let depth = 0;
  let j = idx;
  let inString = false;
  let stringChar = '';
  let inTemplate = false;
  let templateDepth = 0;
  // Simpler: find __d( ... ); where we scan braces & parens + string escape
  // Actually just find the next `,<digits>,[<digits|,|\s>*]);` pattern
  // which is the module signature end
  const rest = content.slice(idx);
  const tailMatch = rest.match(/,(\d+),\[([^\]]*)\]\);?/);
  if (!tailMatch) break;
  // Find where this tail actually belongs by finding the right closing );
  // Use a simple approach: search forward from idx for `},NN,[` patterns
  const tailRegex = /\},(\d+),\[([^\]]*)\]\);?/g;
  tailRegex.lastIndex = idx;
  const tm = tailRegex.exec(content);
  if (!tm) { idx += 10; continue; }
  const id = parseInt(tm[1], 10);
  const deps = tm[2].split(',').map((s) => s.trim()).filter(Boolean).map(Number);
  const body = content.slice(idx, tm.index + tm[0].length);
  modules.push({ id, deps, body });
  idx = tm.index + tm[0].length;
  i++;
  if (i > 5000) break; // safety
}

console.log(`Parsed ${modules.length} modules.`);

// Find modules containing specific feature markers
const interesting = [
  { label: 'Bike3D', markers: ['MeshoptDecoder', 'GLTFLoader'] },
  { label: 'BikeViewer', markers: ['bikeGroup', 'frontWheelPos'] },
  { label: 'ZoneMeta', markers: ['wheels_zone', 'performance_zone', 'availableColors'] },
  { label: 'HomeScreen3D', markers: ['giantText', 'bikeSwitcher', 'engineOn'] },
  { label: 'Track3D', markers: ['maplibregl.Map', 'watchPosition'] },
  { label: 'Configurator', markers: ['BODY COLOR', 'Customize', 'wheels_zone'] },
  { label: 'Garage', markers: ['ZONE_META', 'selectedZone'] },
  { label: 'Onboarding', markers: ['motor_brand', 'odometer'] },
  { label: 'engineState', markers: ['nextEngineState', 'RPM_HIGH_THRESHOLD'] },
];

for (const f of interesting) {
  const hits = modules.filter((m) => f.markers.every((marker) => m.body.includes(marker)));
  console.log(`\n[${f.label}] found ${hits.length} modules matching ${f.markers.join(', ')}`);
  for (const h of hits.slice(0, 3)) {
    const fname = `${f.label}_m${h.id}.js`;
    fs.writeFileSync(path.join(OUT_DIR, fname), h.body);
    console.log(`  → saved ${fname} (${(h.body.length / 1024).toFixed(1)} KB, deps: ${h.deps.slice(0,10).join(',')})`);
  }
}

// Also dump modules that reference any GLB path
console.log('\n--- Modules referencing /models/meshy ---');
const modelMods = modules.filter((m) => m.body.includes('/models/meshy'));
modelMods.forEach((m) => {
  const fname = `MeshyRef_m${m.id}.js`;
  fs.writeFileSync(path.join(OUT_DIR, fname), m.body);
  console.log(`  → saved ${fname} (${(m.body.length / 1024).toFixed(1)} KB)`);
});
