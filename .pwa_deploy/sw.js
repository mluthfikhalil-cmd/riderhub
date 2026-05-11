// RiderHub Service Worker — PWA support
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
  if (/\.(js|css|ttf|woff2?|png|jpg|jpeg|svg|webp|ico)$/.test(url.pathname)) {
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
