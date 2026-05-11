// Create public 'models' bucket in Supabase Storage and upload all GLBs.
const fs = require('fs');
const path = require('path');
const https = require('https');

const SUPABASE_URL = 'https://wqnpyzjixjkjygeulfvo.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxbnB5emppeGpranlnZXVsZnZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5OTQ2MDYsImV4cCI6MjA5MjU3MDYwNn0.eTZHCgSCRuCoG0wD9BzrF28oSO8SO35ZXSBwqAUjEfM';
const GLB_DIR = path.resolve(__dirname, '..', 'public', 'models', 'meshy');

const request = (method, path_, body, contentType) => new Promise((resolve) => {
  const url = new URL(`${SUPABASE_URL}${path_}`);
  const bodyBuf = body ? (Buffer.isBuffer(body) ? body : Buffer.from(JSON.stringify(body))) : null;
  const options = {
    hostname: url.hostname,
    path: url.pathname + url.search,
    method,
    headers: {
      'Authorization': `Bearer ${ANON_KEY}`,
      'apikey': ANON_KEY,
      'Content-Type': contentType || 'application/json',
      ...(bodyBuf ? { 'Content-Length': bodyBuf.length } : {}),
    },
  };
  const req = https.request(options, (res) => {
    const chunks = [];
    res.on('data', (c) => chunks.push(c));
    res.on('end', () => {
      const raw = Buffer.concat(chunks);
      let data;
      try { data = JSON.parse(raw.toString()); } catch { data = raw.toString(); }
      resolve({ ok: res.statusCode < 300, status: res.statusCode, data });
    });
  });
  req.on('error', (e) => resolve({ ok: false, error: e.message }));
  if (bodyBuf) req.write(bodyBuf);
  req.end();
});

(async () => {
  // 1. Create bucket
  console.log('Creating public bucket "models"...');
  const cr = await request('POST', '/storage/v1/bucket', {
    id: 'models',
    name: 'models',
    public: true,
    file_size_limit: 52428800,
    allowed_mime_types: ['model/gltf-binary', 'application/octet-stream', 'application/gltf-binary'],
  });
  if (cr.ok || (cr.data?.error === 'The resource already exists')) {
    console.log('  Bucket ready');
  } else {
    console.log(`  Bucket create: ${cr.status} ${JSON.stringify(cr.data)}`);
    // Try to continue anyway
  }

  // 2. Upload GLBs
  const files = fs.readdirSync(GLB_DIR).filter((f) => f.endsWith('.glb'));
  console.log(`\nUploading ${files.length} GLB files...\n`);

  for (const file of files) {
    const filePath = path.join(GLB_DIR, file);
    const storagePath = `/storage/v1/object/models/meshy/${file}`;
    const data = fs.readFileSync(filePath);
    const sizeMB = (data.length / 1024 / 1024).toFixed(2);
    process.stdout.write(`  ${file} (${sizeMB} MB)... `);
    const r = await request('POST', storagePath + '?upsert=true', data, 'application/octet-stream');
    if (r.ok) {
      console.log(`OK`);
    } else {
      console.log(`FAIL (${r.status}): ${JSON.stringify(r.data).slice(0, 120)}`);
    }
  }

  // 3. Verify one file
  console.log('\nVerifying public access...');
  const testUrl = `${SUPABASE_URL}/storage/v1/object/public/models/meshy/panigale.glb`;
  const vr = await request('GET', '/storage/v1/object/public/models/meshy/panigale.glb');
  console.log(`  panigale.glb: ${vr.status} (${Buffer.isBuffer(vr.data) ? vr.data.length : 0} bytes)`);
  console.log(`\nPublic URL: ${testUrl}`);
})();
