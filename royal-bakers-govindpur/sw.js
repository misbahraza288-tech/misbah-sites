/* Cafe template service worker — offline support. Version badlo to naya cache banega. */
const CACHE = "md_royal_bakers_govindpur-mw00zhrq"; // har update pe badlo
const ASSETS = ["./","index.html","styles.css","app.js","data.js","vendor/qrcode.js","manifest.json","img/apple-touch-icon.png","img/favicon.png","img/hero-1-s.webp","img/hero-1.webp","img/hero-2-s.webp","img/hero-2.webp","img/hero-3-s.webp","img/hero-3.webp","img/icon-192.png","img/icon-512.png","img/icon-maskable-512.png","img/logo.webp","img/poster.webp"];
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
