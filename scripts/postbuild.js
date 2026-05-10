// Copy PWA assets into dist/ and inject manifest/theme meta into dist/index.html.
// Safe to run multiple times.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const PUBLIC = path.join(ROOT, 'public');
const ASSETS = path.join(ROOT, 'assets');

if (!fs.existsSync(DIST)) {
  console.error('[postbuild] dist/ does not exist — run the build first.');
  process.exit(1);
}

// 1. Copy everything from public/ → dist/
const copyRec = (src, dst) => {
  if (!fs.existsSync(src)) return;
  if (fs.statSync(src).isDirectory()) {
    if (!fs.existsSync(dst)) fs.mkdirSync(dst, { recursive: true });
    for (const entry of fs.readdirSync(src)) copyRec(path.join(src, entry), path.join(dst, entry));
  } else {
    fs.copyFileSync(src, dst);
  }
};
copyRec(PUBLIC, DIST);
console.log('[postbuild] copied public/ → dist/');

// 2. Copy icons from assets/ so manifest can reference them at root paths
for (const iconFile of ['favicon.png', 'icon.png', 'adaptive-icon.png']) {
  const src = path.join(ASSETS, iconFile);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(DIST, iconFile));
    console.log(`[postbuild] copied ${iconFile}`);
  }
}

// 3. Inject manifest + theme + apple-touch-icon into dist/index.html
const indexPath = path.join(DIST, 'index.html');
if (fs.existsSync(indexPath)) {
  let html = fs.readFileSync(indexPath, 'utf8');
  const injection = `
    <link rel="manifest" href="/manifest.json" />
    <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
    <meta name="theme-color" content="#00D67D" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="RiderHub" />
    <link rel="apple-touch-icon" href="/icon.png" />
    <meta property="og:title" content="RiderHub - All-in-One App untuk Pemotor Indonesia" />
    <meta property="og:description" content="Marketplace spareparts, event touring, komunitas rider, ride tracking, service tracker, dan fitur lengkap untuk pemotor Indonesia." />
    <meta property="og:image" content="/icon.png" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://riderhub-ten.vercel.app" />
    <meta name="twitter:card" content="summary_large_image" />`;

  if (!html.includes('manifest.json')) {
    html = html.replace('</head>', `${injection}\n  </head>`);
    fs.writeFileSync(indexPath, html);
    console.log('[postbuild] injected PWA meta tags into index.html');
  } else {
    console.log('[postbuild] index.html already has manifest link, skipping injection');
  }
} else {
  console.error('[postbuild] dist/index.html not found');
}

console.log('[postbuild] done');
