/* Kanak Cafe v3 — offline cache. Version badlo toh sabke phone pe naya app aata hai. */
const VERSION = "kanak-v3.0.2";
const CORE = ["./", "index.html", "styles.css?v=3.0.2", "app.js?v=3.0.2", "data.js?v=3.0.2", "icons.js?v=3.0.2", "vendor/qrcode.js", "manifest.json", "fonts/inter.woff2", "fonts/fraunces.woff2",
  "img/apple-touch-icon.png", "img/cafe-counter-s.webp", "img/cafe-counter.webp", "img/cafe-front-s.webp", "img/cafe-front.webp", "img/cafe-front2-s.webp", "img/cafe-front2.webp", "img/chicken-chilli-s.webp", "img/chicken-chilli.webp", "img/favicon.png", "img/icon-192.png", "img/icon-512.png", "img/icon-maskable-512.png", "img/interior-s.webp", "img/interior.webp", "img/logo.webp", "img/lollipop-s.webp", "img/lollipop.webp", "img/menu-cover.webp", "img/momo-chilli-s.webp", "img/momo-chilli.webp", "img/momo-panfried-s.webp", "img/momo-panfried.webp", "img/poster-s.webp", "img/poster.webp"];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => Promise.all(CORE.map((u) => c.add(new Request(u, { cache: "reload" })).catch(() => null)))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // API (Worker) hamesha live — app khud cache rakhta hai
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then((r) => { const cp = r.clone(); caches.open(VERSION).then((c) => c.put("index.html", cp)); return r; }).catch(() => caches.match("index.html").then((r) => r || caches.match("./"))));
    return;
  }
  e.respondWith(caches.match(req).then((hit) => {
    const net = fetch(req).then((r) => { if (r.ok) { const cp = r.clone(); caches.open(VERSION).then((c) => c.put(req, cp)); } return r; }).catch(() => hit);
    return hit || net;
  }));
});
