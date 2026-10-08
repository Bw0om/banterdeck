/* Mitt vors som app: virker uten nett for sider du har besøkt, og tar imot varsler. */
const CACHE = 'mittvors-v2';
// Bare det aller nødvendigste på forhånd – resten lagres etter hvert som sidene besøkes
const START = ['/no/', '/manifest.webmanifest', '/icon-192.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(START).catch(() => {})).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Hver ny versjon av nettsiden gir nye filnavn under /_astro/ (bl.a. romskriptet). Behold bare de nyeste,
// så gamle versjoner ikke fyller opp telefonen.
const MAKS_FILER = 60;
function rydd(c) {
  return c.keys().then((nokler) => {
    const filer = nokler.filter((r) => new URL(r.url).pathname.startsWith('/_astro/'));
    return Promise.all(filer.slice(0, Math.max(0, filer.length - MAKS_FILER)).map((r) => c.delete(r)));
  }).catch(() => {});
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) {
    // Skrifttyper fra Google lagres, så appen ser lik ut uten nett
    if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
      e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        const kopi = res.clone(); caches.open(CACHE).then((c) => c.put(req, kopi)).catch(() => {}); return res;
      })));
    }
    return;
  }
  if (url.pathname.startsWith('/api/') || /\/(account|statistikk|pluss-verktoy)\/?$/.test(url.pathname)) return;

  // Filer med versjonsnummer i navnet endres aldri: hurtiglager først
  if (url.pathname.startsWith('/_astro/')) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok) { const kopi = res.clone(); caches.open(CACHE).then((c) => c.put(req, kopi).then(() => rydd(c))).catch(() => {}); }
      return res;
    })));
    return;
  }
  // Sider: nett først, med hurtiglager som reserve når man er offline
  e.respondWith(
    fetch(req)
      .then((res) => {
        // Ikke lagre én kopi per romkode/søk – det fyller bare opp telefonen
        if (res.ok && !url.search) { const kopi = res.clone(); caches.open(CACHE).then((c) => c.put(req, kopi)).catch(() => {}); }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match(req, { ignoreSearch: true })).then((hit) => hit || caches.match('/no/')))
  );
});

/* ---------- varsler ---------- */
self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { title: 'Mitt vors', body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Mitt vors', {
    body: d.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: d.tag || 'mittvors',
    data: { url: d.url || '/' },
  }));
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const maal = new URL((e.notification.data && e.notification.data.url) || '/', self.location.origin).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((vinduer) => {
    for (const v of vinduer) { if ('focus' in v) { v.navigate(maal).catch(() => {}); return v.focus(); } }
    return self.clients.openWindow(maal);
  }));
});
