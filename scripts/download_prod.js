// Download the exact production deployment and stage it for PWA injection.
// Source: riderhub-9npx07yul-lils-projects-776e7e74.vercel.app (pinned 3D build)

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PROD = 'https://riderhub-ten.vercel.app';
const OUT = path.resolve(__dirname, '..', '.pwa_deploy');

const get = (url, dest) => new Promise((resolve) => {
  const proto = url.startsWith('https') ? https : http;
  const file = fs.createWriteStream(dest);
  proto.get(url, (res) => {
    if (res.statusCode === 301 || res.statusCode === 302) {
      file.close();
      fs.unlink(dest, () => {});
      return get(res.headers.location, dest).then(resolve);
    }
    if (res.statusCode !== 200) {
      file.close();
      fs.unlink(dest, () => {});
      return resolve({ ok: false, status: res.statusCode });
    }
    res.pipe(file);
    file.on('finish', () => file.close(() => resolve({ ok: true, size: fs.statSync(dest).size })));
  }).on('error', (e) => { file.close(); fs.unlink(dest, () => {}); resolve({ ok: false, error: e.message }); });
});

const getText = (url) => new Promise((resolve) => {
  https.get(url, (res) => {
    let data = '';
    res.on('data', (c) => data += c);
    res.on('end', () => resolve({ ok: res.statusCode === 200, data, status: res.statusCode }));
  }).on('error', (e) => resolve({ ok: false, error: e.message }));
});

(async () => {
  // 1. Get index.html
  console.log('Downloading index.html...');
  const idx = await getText(`${PROD}/`);
  if (!idx.ok) { console.error('FAIL index.html:', idx.status); process.exit(1); }
  
  // Extract bundle filename
  const bundleMatch = idx.data.match(/index-[a-f0-9]+\.js/);
  if (!bundleMatch) { console.error('Cannot find bundle filename'); process.exit(1); }
  const bundleFile = bundleMatch[0];
  console.log(`  Bundle: ${bundleFile}`);
  
  // Save index.html
  fs.writeFileSync(path.join(OUT, 'index.html'), idx.data);
  console.log('  Saved index.html');

  // 2. Download the JS bundle
  const bundlePath = `/_expo/static/js/web/${bundleFile}`;
  const bundleDir = path.join(OUT, '_expo', 'static', 'js', 'web');
  fs.mkdirSync(bundleDir, { recursive: true });
  console.log(`Downloading bundle (${bundleFile})...`);
  const br = await get(`${PROD}${bundlePath}`, path.join(bundleDir, bundleFile));
  if (br.ok) console.log(`  OK (${(br.size / 1024 / 1024).toFixed(2)} MB)`);
  else console.error('  FAIL bundle:', br.status || br.error);

  // 3. Download favicon.ico
  console.log('Downloading favicon.ico...');
  const fr = await get(`${PROD}/favicon.ico`, path.join(OUT, 'favicon.ico'));
  console.log(fr.ok ? `  OK (${(fr.size/1024).toFixed(1)} KB)` : `  FAIL: ${fr.status}`);

  // 4. Download all font assets referenced in the bundle
  // Fonts are at /_expo/static/media/
  console.log('Scanning bundle for font/asset paths...');
  const bundleContent = fs.readFileSync(path.join(bundleDir, bundleFile), 'utf8');
  const assetPaths = [...new Set(bundleContent.match(/\/_expo\/static\/[^"'\s)>]+/g) || [])];
  console.log(`  Found ${assetPaths.length} asset paths`);
  
  for (const ap of assetPaths) {
    const localPath = path.join(OUT, ap.replace(/^\//, ''));
    fs.mkdirSync(path.dirname(localPath), { recursive: true });
    if (fs.existsSync(localPath)) continue;
    const r = await get(`${PROD}${ap}`, localPath);
    if (r.ok) process.stdout.write('.');
    else process.stdout.write('x');
  }
  console.log('\n  Assets done');

  // 5. Download GLB models
  const glbs = [
    'kawasaki-ninja', 'dual-sport', 'orange-scooter', 'supra', 'revo',
    'vespa-super', 'vespa-sprint', 'panigale', 'monster', 'z900extreme',
    'cb650r', 'orange', 'retroscoot', 'vario125', 'azureblaze', 'blushpink', 'yam70cc',
  ];
  const glbDir = path.join(OUT, 'models', 'meshy');
  fs.mkdirSync(glbDir, { recursive: true });
  console.log('\nDownloading GLB models...');
  for (const g of glbs) {
    const dest = path.join(glbDir, `${g}.glb`);
    if (fs.existsSync(dest)) { console.log(`  SKIP ${g}.glb (exists)`); continue; }
    const r = await get(`${PROD}/models/meshy/${g}.glb`, dest);
    console.log(r.ok ? `  OK ${g}.glb (${(r.size/1024/1024).toFixed(2)} MB)` : `  FAIL ${g}.glb: ${r.status}`);
  }

  console.log('\nDone. Files in .pwa_deploy/');
  const total = fs.readdirSync(OUT, { recursive: true }).length;
  console.log(`Total files: ${total}`);
})();
