/* Kanak Cafe service worker — offline support. Version badlo to naya cache banega. */
const CACHE = "kanak-v2.0.0-d2fbe3";
const ASSETS = ["./", "index.html", "styles.css", "app.js", "data.js", "vendor/qrcode.js", "manifest.json", "img/apple-touch-icon.png", "img/cafe-counter-s.webp", "img/cafe-counter.webp", "img/cafe-front-s.webp", "img/cafe-front.webp", "img/cafe-front2-s.webp", "img/cafe-front2.webp", "img/chicken-chilli-s.webp", "img/chicken-chilli.webp", "img/favicon.png", "img/icon-192.png", "img/icon-512.png", "img/icon-maskable-512.png", "img/interior-s.webp", "img/interior.webp", "img/logo.webp", "img/lollipop-s.webp", "img/lollipop.webp", "img/menu-cover.webp", "img/momo-chilli-s.webp", "img/momo-chilli.webp", "img/momo-panfried-s.webp", "img/momo-panfried.webp", "img/poster-s.webp", "img/poster.webp"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const req = e.request; if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  // Pages/code: network pehle (naya update), offline ho to cache. Photos: cache pehle.
  const isImg = req.destination === "image";
  if (isImg) { e.respondWith(caches.match(req).then((r) => r || fetch(req).then((res) => { const cp = res.clone(); caches.open(CACHE).then((c) => c.put(req, cp)); return res; }))); return; }
  e.respondWith(fetch(req).then((res) => { const cp = res.clone(); caches.open(CACHE).then((c) => c.put(req, cp)); return res; }).catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match("index.html"))));
});
self.addEventListener("notificationclick", (e) => { e.notification.close(); e.waitUntil(self.clients.openWindow("./#/orders")); });
