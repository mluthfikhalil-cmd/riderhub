// Upload GLB files to Supabase Storage (riderhub-uploads bucket, models/meshy/ path)
// so they can be served publicly without Vercel deployment protection.

const fs = require('fs');
const path = require('path');
const https = require('https');

const SUPABASE_URL = 'https://wqnpyzjixjkjygeulfvo.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxbnB5emppeGpranlnZXVsZnZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5OTQ2MDYsImV4cCI6MjA5MjU3MDYwNn0.eTZHCgSCRuCoG0wD9BzrF28oSO8SO35ZXSBwqAUjEfM';
const BUCKET = 'riderhub-uploads';
const GLB_DIR = path.resolve(__dirname, '..', 'public', 'models', 'meshy');

const uploadFile = (filePath, storagePath) => new Promise((resolve) => {
  const data = fs.readFileSync(filePath);
  const url = new URL(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${storagePath}`);
  const options = {
    hostname: url.hostname,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ANON_KEY}`,
      'apikey': ANON_KEY,
      'Content-Type': 'model/gltf-binary',
      'Content-Length': data.length,
      'x-upsert': 'true',
    },
  };
  const req = https.request(options, (res) => {
    let body = '';
    res.on('data', (c) => body += c);
    res.on('end', () => resolve({ ok: res.statusCode < 300, status: res.statusCode, body }));
  });
  req.on('error', (e) => resolve({ ok: false, error: e.message }));
  req.write(data);
  req.end();
});

(async () => {
  const files = fs.readdirSync(GLB_DIR).filter((f) => f.endsWith('.glb'));
  console.log(`Uploading ${files.length} GLB files to Supabase Storage...\n`);
  
  for (const file of files) {
    const filePath = path.join(GLB_DIR, file);
    const storagePath = `models/meshy/${file}`;
    const sizeMB = (fs.statSync(filePath).size / 1024 / 1024).toFixed(2);
    process.stdout.write(`  ${file} (${sizeMB} MB)... `);
    const r = await uploadFile(filePath, storagePath);
    if (r.ok) {
      console.log(`OK (${r.status})`);
    } else {
      console.log(`FAIL (${r.status}): ${r.body?.slice(0, 100) || r.error}`);
    }
  }
  
  // Get public URL for one file to confirm
  const testUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/models/meshy/panigale.glb`;
  console.log(`\nPublic URL format: ${testUrl}`);
  console.log('\nDone. Update vercel.json proxy to use Supabase URLs.');
})();
