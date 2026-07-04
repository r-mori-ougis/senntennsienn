/* 選点支援ツール Service Worker
   更新時は CACHE_VERSION を変えること (例: v1 → v2) */
const CACHE_VERSION = "senten-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png"
];

self.addEventListener("install", function(e) {
  e.waitUntil(
    caches.open(CACHE_VERSION).then(function(c) { return c.addAll(ASSETS); })
      .then(function() { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k) { return k !== CACHE_VERSION; })
        .map(function(k) { return caches.delete(k); }));
    }).then(function() { return self.clients.claim(); })
  );
});

/* キャッシュ優先 + バックグラウンド更新 (stale-while-revalidate) */
self.addEventListener("fetch", function(e) {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      const fetched = fetch(e.request).then(function(res) {
        if (res && res.ok) {
          const clone = res.clone();
          caches.open(CACHE_VERSION).then(function(c) { c.put(e.request, clone); });
        }
        return res;
      }).catch(function() { return cached; });
      return cached || fetched;
    })
  );
});
