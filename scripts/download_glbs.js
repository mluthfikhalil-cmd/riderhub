// Download all Meshy GLB assets from the live 3D production into local repo.
// Files saved to public/models/meshy/ which gets copied to dist/ at build time.

const fs = require('fs');
const path = require('path');
const https = require('https');

const BASE = 'https://riderhub-9npx07yul-lils-projects-776e7e74.vercel.app';
const OUT_DIR = path.resolve(__dirname, '..', 'public', 'models', 'meshy');
const OUT_VELG = path.resolve(OUT_DIR, 'velg');

const BIKES = [
  'kawasaki-ninja', 'dual-sport', 'orange-scooter', 'supra', 'revo',
  'vespa-super', 'vespa-sprint', 'panigale', 'monster', 'z900extreme',
  'cb650r', 'orange', 'retroscoot', 'vario125', 'azureblaze',
  'blushpink', 'yam70cc',
];

// Velg names will be discovered by trying common patterns
const VELG_CANDIDATES = [
  'sport-classic', 'racing-5', 'racing-6', 'racing-10', 'wire-36',
  'solid-disc', 'multi-spoke', 'carbon-5', 'y-spoke', 'classic-wire',
  'retro-solid', 'multi-y', 'forged-5', 'forged-6', 'cbr', 'nmax',
  'vario', 'vespa', 'panigale', 'monster',
];

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(OUT_VELG, { recursive: true });

const download = (url, dest) =>
  new Promise((resolve) => {
    const file = fs.createWriteStream(dest);
    https
      .get(url, (res) => {
        if (res.statusCode === 200) {
          res.pipe(file);
          file.on('finish', () => file.close(() => resolve({ ok: true, size: fs.statSync(dest).size })));
        } else {
          file.close();
          fs.unlink(dest, () => {});
          resolve({ ok: false, status: res.statusCode });
        }
      })
      .on('error', (err) => {
        file.close();
        fs.unlink(dest, () => {});
        resolve({ ok: false, error: err.message });
      });
  });

(async () => {
  console.log('Downloading bike GLBs...\n');
  let bikeTotalMB = 0;
  for (const name of BIKES) {
    const url = `${BASE}/models/meshy/${name}.glb`;
    const dest = path.join(OUT_DIR, `${name}.glb`);
    const r = await download(url, dest);
    if (r.ok) {
      const mb = (r.size / 1024 / 1024).toFixed(2);
      bikeTotalMB += parseFloat(mb);
      console.log(`  [OK] ${name}.glb (${mb} MB)`);
    } else {
      console.log(`  [FAIL] ${name}.glb — ${r.status || r.error}`);
    }
  }
  console.log(`\nBike total: ${bikeTotalMB.toFixed(2)} MB\n`);

  console.log('Discovering velg GLBs...\n');
  let velgTotalMB = 0;
  let found = 0;
  for (const name of VELG_CANDIDATES) {
    const url = `${BASE}/models/meshy/velg/${name}.glb`;
    const dest = path.join(OUT_VELG, `${name}.glb`);
    const r = await download(url, dest);
    if (r.ok) {
      const mb = (r.size / 1024 / 1024).toFixed(2);
      velgTotalMB += parseFloat(mb);
      found++;
      console.log(`  [OK] velg/${name}.glb (${mb} MB)`);
    } else {
      // silently skip — not every candidate exists
    }
  }
  console.log(`\nVelg found: ${found}/${VELG_CANDIDATES.length}, total ${velgTotalMB.toFixed(2)} MB`);
  console.log(`\n===== GRAND TOTAL: ${(bikeTotalMB + velgTotalMB).toFixed(2)} MB =====`);
})();
