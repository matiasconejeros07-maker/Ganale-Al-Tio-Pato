// Service worker de «Gánale al Tío Pato»: deja el juego listo para usarse sin conexión.
// Si cambias imágenes o el código, sube el número de VERSION para que los celulares descarguen lo nuevo.
const VERSION = 'v18';
const CACHE = 'tio-pato-' + VERSION;
const ASSETS = ["./", "index.html", "config.js", "tienda.js", "dialogos.js", "manifest.webmanifest", "icons/apple-touch-icon.png", "icons/favicon-32.png", "icons/favicon-64.png", "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png", "pato/face0.png", "pato/face1.png", "pato/face2.png", "pato/face3.png", "pato/halo.png", "pato/hero_angel.png", "pato/hero_devil.png", "pato/hero_mid.png", "pato/horns.png", "pato/tail.png", "pato/trident.png", "pato/wingL_angel.png", "pato/wingL_devil.png", "pato/wingR_angel.png", "pato/wingR_devil.png", "patita/face0.png", "patita/face1.png", "patita/face2.png", "patita/face3.png", "patita/halo.png", "patita/hero_angel.png", "patita/hero_devil.png", "patita/hero_mid.png", "patita/horns.png", "patita/tail.png", "patita/trident.png", "patita/wingL_angel.png", "patita/wingL_devil.png", "patita/wingR_angel.png", "patita/wingR_devil.png", "skins/b1000.webp", "skins/b10000.webp", "skins/b2000.webp", "skins/b20000.webp", "skins/b5000.webp", "skins/peso1.webp", "skins/peso10.webp", "skins/peso100.webp", "skins/peso50.webp", "skins/peso500.webp", "trajes/bigotes.webp", "trajes/conejo-enojado.webp", "trajes/conejo.webp", "trajes/conejita.webp", "skins/peso5.webp", "trajes/bigotes-enojado.webp", "trajes/conejita-enojada.webp", "trajes/tios-enojados.webp", "trajes/tios.webp", "fondos/galaxia-1.webp", "fondos/galaxia-2.webp", "fondos/aurora-1.webp", "fondos/aurora-2.webp", "fondos/aurora-3.webp", "skins/plata.webp", "skins/oro.webp", "skins/diamante.webp"];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('tio-pato-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;                    // Firebase (marcadores) y otros: siempre directo a internet

  // Página y configuración: primero internet (para tener siempre lo último), y sin conexión usa la copia guardada.
  const fresh = req.mode === 'navigate' || /\/(config|tienda)\.js$|\/manifest\.webmanifest$/.test(url.pathname) || url.pathname.endsWith('.html');
  if (fresh) {
    e.respondWith(
      fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res; })
        .catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || caches.match('index.html')))
    );
    return;
  }
  // Imágenes e íconos: primero la copia guardada (el personaje secreto, carpeta oro/, no se precarga: se guarda al usarlo) (carga instantánea).
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }))
  );
});
