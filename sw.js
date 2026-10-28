// Cambia la versión cuando subas una actualización de la app
const CACHE = 'rutinas-gym-v5';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Páginas: intenta la red (para recibir actualizaciones) y, sin conexión, usa la copia guardada
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); return res; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Resto (iconos, fuentes): primero la copia guardada, si no, la red y se guarda
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res && (res.ok || res.type === 'opaque') && (url.origin === location.origin || url.hostname.endsWith('googleapis.com') || url.hostname.endsWith('gstatic.com'))) {
        const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => hit))
  );
});
