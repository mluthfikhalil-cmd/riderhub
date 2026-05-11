// Bundle extractor — find feature signatures in the minified 3D bundle
// so we know what to re-implement.

const fs = require('fs');
const path = require('path');

const BUNDLE = path.resolve(__dirname, '..', '.backups', 'live_bundle_2026-05-10.js');
const content = fs.readFileSync(BUNDLE, 'utf8');

console.log(`Bundle size: ${(content.length / 1024 / 1024).toFixed(2)} MB\n`);

// ============ Find feature-specific constants ============
const probes = [
  { name: 'Meshy GLTF URLs',        re: /https?:\/\/[^"'\s]*\.(glb|gltf)[^"'\s]*/gi },
  { name: 'Meshy host',             re: /meshy\.ai[^"']*/gi },
  { name: 'MapLibre style URLs',    re: /https?:\/\/[^"'\s]*(maplibre|openfreemap|maptiler|protomaps)[^"'\s]*/gi },
  { name: 'MapLibre source',        re: /new\s+maplibregl\.\w+/g },
  { name: 'Three.js loader imports',re: /GLTFLoader|DRACOLoader|RGBELoader|OrbitControls/g },
  { name: 'CDN three.js',           re: /three\.js\/r\d+\/[a-z.]+/gi },
  { name: 'bottom bar custom',      re: /customTabBar|BottomBarCustom/g },
  { name: 'marquee keyframe',       re: /@keyframes\s+[a-zA-Z-]*marquee[a-zA-Z-]*/gi },
  { name: 'RideSummary keywords',   re: /RideSummary|calories|cal\/km/g },
  { name: 'Service records',        re: /service_records|ServiceTracker|Maintenance/g },
  { name: 'Honda/Yamaha models',    re: /CBR150R|NMAX 155|Aerox 155|Vario 160/g },
  { name: 'Onboarding odometer',    re: /odometer_km|oil_change_km/g },
];

for (const p of probes) {
  const matches = content.match(p.re);
  if (matches && matches.length > 0) {
    const uniq = [...new Set(matches)];
    console.log(`[${matches.length} matches, ${uniq.length} unique] ${p.name}`);
    uniq.slice(0, 10).forEach((m) => console.log(`  ${m.slice(0, 200)}`));
    if (uniq.length > 10) console.log(`  ... +${uniq.length - 10} more`);
    console.log('');
  } else {
    console.log(`[0]   ${p.name}`);
  }
}

// ============ Find all http URLs (for asset discovery) ============
console.log('\n=== All unique HTTP URLs ===');
const urls = [...new Set(content.match(/https?:\/\/[^"'\s)>]+/g) || [])].sort();
urls.forEach((u) => console.log(`  ${u}`));
