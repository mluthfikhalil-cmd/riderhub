// Find Configurator/GLTF loading code in the bundle
const fs = require('fs');
const path = require('path');
const BUNDLE = path.resolve(__dirname, '..', '.backups', 'live_bundle_2026-05-10.js');
const content = fs.readFileSync(BUNDLE, 'utf8');

// Find GLTFLoader usage context
const gltfRegex = /.{200}GLTFLoader.{200}/gs;
const matches = [...content.matchAll(gltfRegex)];
console.log(`GLTFLoader usage sites: ${matches.length}\n`);
matches.slice(0, 5).forEach((m, i) => {
  console.log(`--- site ${i + 1} ---`);
  console.log(m[0].replace(/\s+/g, ' '));
  console.log();
});

// Find .load( calls with URL
console.log('\n=== .load() calls ===');
const loads = content.match(/\.load\s*\(\s*["'`][^"'`]+["'`]/g) || [];
const uniq = [...new Set(loads)];
uniq.forEach((l) => console.log(`  ${l.slice(0, 200)}`));

// Find asset paths — ending with .glb / .bin / .gltf
console.log('\n=== Asset path patterns ===');
const assets = content.match(/["'`]\/?[^"'`\s]*\.(glb|gltf|bin|hdr|ktx2)[^"'`\s]*["'`]/g) || [];
[...new Set(assets)].forEach((a) => console.log(`  ${a}`));

// Find Configurator screen — look for distinctive strings
console.log('\n=== Configurator text snippets ===');
const snippets = content.match(/.{50}(Configurator|Customize|Wheel Style|BODY COLOR|Pilih Motor|Pilih Warna).{50}/g) || [];
[...new Set(snippets)].slice(0, 20).forEach((s) => console.log(`  ${s.replace(/\s+/g, ' ').slice(0, 250)}`));
