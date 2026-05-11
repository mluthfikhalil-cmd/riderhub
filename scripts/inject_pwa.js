// Inject PWA manifest + sw.js + meta tags into the downloaded prod deployment.
// Does NOT modify the JS bundle — only adds 3 files and patches index.html head.

const fs = require('fs');
const path = require('path');

const OUT = path.resolve(__dirname, '..', '.pwa_deploy');

// 1. Write manifest.json
const manifest = {
  name: 'RiderHub',
  short_name: 'RiderHub',
  description: 'All-in-One App untuk Pemotor Indonesia — ride tracker, marketplace parts, komunitas, servis tracker & 3D configurator.',
  start_url: '/',
  display: 'standalone',
  orientation: 'portrait',
  background_color: '#000000',
  theme_color: '#00D67D',
  lang: 'id',
  scope: '/',
  categories: ['lifestyle', 'travel', 'sports', 'social'],
  icons: [
    { src: '/favicon.ico', sizes: '48x48', type: 'image/x-icon' },
    { src: '/favicon.ico', sizes: '192x192', type: 'image/x-icon', purpose: 'any maskable' },
  ],
  shortcuts: [
    { name: 'Ride Tracker', short_name: 'Ride', url: '/history', description: 'Mulai tracking ride baru' },
    { name: 'Garage',       short_name: 'Garage', url: '/garage', description: 'Kelola motor' },
    { name: 'Service',      short_name: 'Servis', url: '/service', description: 'Service tracker & reminder' },
  ],
};
fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log('✓ manifest.json written');

// 2. Write sw.js (network-first HTML, cache-first static assets)
const sw = `// RiderHub Service Worker — PWA support
const CACHE = 'riderhub-3d-v1';
const STATIC = ['/', '/manifest.json', '/favicon.ico'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname.includes('supabase.co')) return;
  if (url.hostname.includes('unpkg.com') || url.hostname.includes('cdnjs.cloudflare.com')) return;

  // HTML — network first
  if (req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html')) {
    e.respondWith(
      fetch(req).then(r => {
        const c = r.clone();
        caches.open(CACHE).then(cache => cache.put(req, c));
        return r;
      }).catch(() => caches.match(req).then(r => r || caches.match('/')))
    );
    return;
  }

  // GLB models — cache first (large files, rarely change)
  if (url.pathname.endsWith('.glb')) {
    e.respondWith(
      caches.match(req).then(cached => {
        if (cached) return cached;
        return fetch(req).then(r => {
          if (r.ok) caches.open(CACHE).then(c => c.put(req, r.clone()));
          return r;
        });
      })
    );
    return;
  }

  // JS/CSS/fonts — cache first
  if (/\\.(js|css|ttf|woff2?|png|jpg|jpeg|svg|webp|ico)$/.test(url.pathname)) {
    e.respondWith(
      caches.match(req).then(cached => {
        if (cached) return cached;
        return fetch(req).then(r => {
          if (r.ok) caches.open(CACHE).then(c => c.put(req, r.clone()));
          return r;
        });
      })
    );
  }
});
`;
fs.writeFileSync(path.join(OUT, 'sw.js'), sw);
console.log('✓ sw.js written');

// 3. Patch index.html — inject PWA meta tags into <head>
const indexPath = path.join(OUT, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

if (html.includes('manifest.json')) {
  console.log('⚠ index.html already has manifest link — skipping injection');
} else {
  const injection = `
    <link rel="manifest" href="/manifest.json" />
    <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
    <meta name="theme-color" content="#00D67D" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="RiderHub" />
    <link rel="apple-touch-icon" href="/favicon.ico" />
    <meta property="og:title" content="RiderHub - All-in-One App untuk Pemotor Indonesia" />
    <meta property="og:description" content="Marketplace spareparts, event touring, komunitas rider, ride tracking, service tracker, dan fitur lengkap untuk pemotor Indonesia." />
    <meta property="og:image" content="/favicon.ico" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://riderhub-ten.vercel.app" />
    <meta name="twitter:card" content="summary_large_image" />
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
          navigator.serviceWorker.register('/sw.js', { scope: '/' })
            .then(function(reg) { console.log('[PWA] SW registered:', reg.scope); })
            .catch(function(err) { console.warn('[PWA] SW failed:', err); });
        });
      }
    </script>`;
  html = html.replace('</head>', injection + '\n  </head>');
  fs.writeFileSync(indexPath, html);
  console.log('✓ index.html patched with PWA meta + SW registration');
}

// 4. Write robots.txt
fs.writeFileSync(path.join(OUT, 'robots.txt'), 'User-agent: *\nAllow: /\n');
console.log('✓ robots.txt written');

// 5. Write vercel.json for this deployment
const vercelConfig = {
  rewrites: [
    { source: '/manifest.json', destination: '/manifest.json' },
    { source: '/sw.js', destination: '/sw.js' },
    { source: '/robots.txt', destination: '/robots.txt' },
    { source: '/models/(.*)', destination: '/models/$1' },
    { source: '/(.*\\.(?:js|css|png|jpg|jpeg|svg|webp|ico|woff2?|glb))', destination: '/$1' },
    { source: '/(.*)', destination: '/index.html' },
  ],
  headers: [
    {
      source: '/sw.js',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
        { key: 'Service-Worker-Allowed', value: '/' },
      ],
    },
    {
      source: '/manifest.json',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=3600' },
        { key: 'Content-Type', value: 'application/manifest+json' },
      ],
    },
    {
      source: '/models/(.*)',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
      ],
    },
  ],
};
fs.writeFileSync(path.join(OUT, 'vercel.json'), JSON.stringify(vercelConfig, null, 2));
console.log('✓ vercel.json written');

// Summary
console.log('\n=== .pwa_deploy/ contents ===');
const walk = (dir, prefix = '') => {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      console.log(`${prefix}${f}/`);
      if (!f.includes('meshy')) walk(full, prefix + '  ');
      else console.log(`${prefix}  [${fs.readdirSync(full).length} GLB files]`);
    } else {
      console.log(`${prefix}${f} (${(stat.size/1024).toFixed(1)} KB)`);
    }
  }
};
walk(OUT);
