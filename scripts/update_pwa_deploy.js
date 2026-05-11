// Update .pwa_deploy/ with the latest built bundle from dist/
// Keeps manifest.json, sw.js, robots.txt, vercel.json from .pwa_deploy/
// Replaces the JS bundle + index.html with the freshly built ones from dist/

const fs = require('fs');
const path = require('path');

const DIST = path.resolve(__dirname, '..', 'dist');
const PWA = path.resolve(__dirname, '..', '.pwa_deploy');

if (!fs.existsSync(DIST)) {
  console.error('dist/ not found — run npm run build:web first');
  process.exit(1);
}

// 1. Copy new bundle from dist/_expo/ to .pwa_deploy/_expo/
const copyRec = (src, dst) => {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dst, { recursive: true });
    for (const f of fs.readdirSync(src)) copyRec(path.join(src, f), path.join(dst, f));
  } else {
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
    console.log(`  copied ${path.relative(DIST, src)}`);
  }
};

// Remove old _expo bundle
const oldExpo = path.join(PWA, '_expo');
if (fs.existsSync(oldExpo)) {
  fs.rmSync(oldExpo, { recursive: true, force: true });
  console.log('  removed old _expo/');
}

// Copy new _expo bundle
copyRec(path.join(DIST, '_expo'), path.join(PWA, '_expo'));

// 2. Update index.html with new bundle reference + keep PWA tags
const newIndex = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
const oldIndex = fs.readFileSync(path.join(PWA, 'index.html'), 'utf8');

// Extract PWA injection block from old index
const pwaStart = oldIndex.indexOf('<link rel="manifest"');
const pwaEnd = oldIndex.indexOf('</script>', pwaStart) + '</script>'.length;
const pwaBlock = pwaStart >= 0 ? oldIndex.slice(pwaStart, pwaEnd) : '';

// Inject PWA block into new index if not already there
let updatedIndex = newIndex;
if (pwaBlock && !newIndex.includes('manifest.json')) {
  updatedIndex = newIndex.replace('</head>', `    ${pwaBlock}\n  </head>`);
}

fs.writeFileSync(path.join(PWA, 'index.html'), updatedIndex);
console.log('  updated index.html');

// 3. Copy favicon.ico
if (fs.existsSync(path.join(DIST, 'favicon.ico'))) {
  fs.copyFileSync(path.join(DIST, 'favicon.ico'), path.join(PWA, 'favicon.ico'));
  console.log('  copied favicon.ico');
}

// 4. Show new bundle name
const expoDir = path.join(PWA, '_expo', 'static', 'js', 'web');
if (fs.existsSync(expoDir)) {
  const bundles = fs.readdirSync(expoDir).filter(f => f.endsWith('.js'));
  console.log(`\nNew bundle: ${bundles[0]} (${(fs.statSync(path.join(expoDir, bundles[0])).size / 1024 / 1024).toFixed(2)} MB)`);
}

console.log('\n.pwa_deploy/ updated. Run: vercel --yes (from project root)');
