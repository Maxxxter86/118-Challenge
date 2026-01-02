const CACHE_NAME = "c118-2026-v2";
const ASSETS = [
  "/118-Challenge/",
  "/118-Challenge/index.html",
  "/118-Challenge/manifest.json",
  "/118-Challenge/sw.js",
  "/118-Challenge/icon-192.png",
  "/118-Challenge/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(ASSETS);
    self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k !== CACHE_NAME) ? caches.delete(k) : null));
    self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Navegaciones: intenta red primero, si falla usa cache
  if (req.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE_NAME);
        cache.put("/118-Challenge/index.html", fresh.clone());
        return fresh;
      } catch (e) {
        const cache = await caches.open(CACHE_NAME);
        return (await cache.match("/118-Challenge/index.html")) || (await cache.match("/118-Challenge/"));
      }
    })());
    return;
  }

  // Assets: cache-first
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req);
    if (cached) return cached;

    const res = await fetch(req);
    // Cachea solo recursos same-origin
    if (res && res.status === 200 && new URL(req.url).origin === self.location.origin) {
      cache.put(req, res.clone());
    }
    return res;
  })());
});
