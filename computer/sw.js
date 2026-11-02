/* Misbah Digital Computer — service worker (offline shell). API calls kabhi cache nahi hote. */
const CACHE = "mdc-v2.0.0-1";
const ASSETS = ["./", "index.html", "app.css", "app.js", "config.js", "demo.js", "vendor/qrcode.js", "manifest.json", "img/icon-192.png", "img/icon-512.png", "img/icon-maskable-512.png", "img/apple-touch-icon.png", "img/favicon.png"];
self.addEventListener("install", (e) => e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())));
self.addEventListener("activate", (e) => e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin || u.pathname.endsWith("sites.json")) return;
  e.respondWith(fetch(e.request).then((res) => { const cp = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, cp)); return res; }).catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match("index.html"))));
});
