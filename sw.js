// Service worker: guarda la "cáscara" de la app para que abra rápido y sin señal.
// Los datos (Supabase) siempre van por red; solo se cachean archivos propios.
const CACHE = 'solito-v1';
const SHELL = ['./', 'index.html', 'css/app.css', 'js/app.js', 'js/store.js', 'js/icons.js', 'js/config.js',
  'manifest.webmanifest', 'icons/icon-192.png', 'icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// Red primero (para ver siempre la última versión), caché si no hay conexión.
// Solo se cachean respuestas correctas, y solo las páginas caen a index.html:
// un JS o CSS que falla no debe recibir HTML.
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  const fromCache = exact => caches.match(e.request, { ignoreSearch: !exact });
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return res; }
        // 404/500 del servidor: se prefiere una copia buena de esa misma URL (coincidencia exacta, con su query)
        // a la respuesta de error; sin copia exacta se devuelve el error tal cual.
        return fromCache(true).then(r => r || res);
      })
      .catch(() => fromCache(false)
        .then(r => r || (e.request.mode === 'navigate' ? caches.match('index.html') : Response.error())))
  );
});
