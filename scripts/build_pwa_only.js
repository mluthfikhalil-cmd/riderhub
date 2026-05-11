// Build script for PWA-only deployment.
// Copies .pwa_deploy/ contents to dist/ for Vercel to serve.
const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '..', '.pwa_deploy');
const DIST = path.resolve(__dirname, '..', 'dist');

const copyRec = (src, dst) => {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (path.basename(src) === '.vercel' || path.basename(src) === 'models') return;
    fs.mkdirSync(dst, { recursive: true });
    for (const f of fs.readdirSync(src)) copyRec(path.join(src, f), path.join(dst, f));
  } else {
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
  }
};

fs.mkdirSync(DIST, { recursive: true });
copyRec(SRC, DIST);
console.log('[build_pwa_only] Done. dist/ ready.');
