/*
 * Service worker — offline shell only.
 *
 * Strategy:
 *   • Navigations / HTML  → NETWORK-FIRST. A new deploy is picked up on the
 *     next load, so the page never references JS chunks that no longer exist.
 *     (The previous cache-first strategy served a stale index.html after every
 *     deploy, and its lazy chunks 404'd — surfacing as "Something went wrong".)
 *   • /assets/*           → CACHE-FIRST. Build assets are content-hashed, so a
 *     cached copy is always the correct one and never goes stale.
 *   • /api/*              → never intercepted.
 */
const CACHE = "djac-v2";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys =>
        Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  // Immutable, content-hashed build assets: cache-first.
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(
      caches.match(req).then(
        cached =>
          cached ||
          fetch(req).then(res => {
            if (res && res.status === 200) {
              const clone = res.clone();
              caches
                .open(CACHE)
                .then(c => c.put(req, clone))
                .catch(() => {});
            }
            return res;
          })
      )
    );
    return;
  }

  // HTML and everything else: network-first, cache only as an offline fallback.
  event.respondWith(
    fetch(req)
      .then(res => {
        if (res && res.status === 200 && res.type === "basic") {
          const clone = res.clone();
          caches
            .open(CACHE)
            .then(c => c.put(req, clone))
            .catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req).then(cached => cached || Response.error()))
  );
});
