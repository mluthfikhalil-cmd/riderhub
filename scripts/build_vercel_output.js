// Build a proper Vercel Build Output API v3 structure from .pwa_deploy/
// so we can use `vercel deploy --prebuilt`

const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '..', '.pwa_deploy');
const OUT = path.resolve(SRC, '.vercel', 'output');
const STATIC = path.join(OUT, 'static');

fs.mkdirSync(STATIC, { recursive: true });

// Write config.json
const config = {
  version: 3,
  routes: [
    { src: '/manifest\\.json', dest: '/manifest.json' },
    { src: '/sw\\.js', dest: '/sw.js', headers: { 'Cache-Control': 'public, max-age=0, must-revalidate', 'Service-Worker-Allowed': '/' } },
    { src: '/robots\\.txt', dest: '/robots.txt' },
    { src: '/models/(.*)', dest: '/models/$1', headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } },
    { src: '/_expo/(.*)', dest: '/_expo/$1' },
    { src: '/favicon\\.ico', dest: '/favicon.ico' },
    { src: '/(.*)', dest: '/index.html' },
  ],
};
fs.writeFileSync(path.join(OUT, 'config.json'), JSON.stringify(config, null, 2));
console.log('✓ config.json');

// Copy all files from SRC to STATIC (except .vercel itself)
const copyRec = (src, dst) => {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (path.basename(src) === '.vercel') return; // skip
    fs.mkdirSync(dst, { recursive: true });
    for (const f of fs.readdirSync(src)) copyRec(path.join(src, f), path.join(dst, f));
  } else {
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
  }
};

copyRec(SRC, STATIC);
console.log('✓ files copied to static/');

// Count
let count = 0;
const countFiles = (dir) => {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) countFiles(full);
    else count++;
  }
};
countFiles(STATIC);
console.log(`✓ ${count} files in static/`);
console.log('\nReady for: vercel deploy --prebuilt');
