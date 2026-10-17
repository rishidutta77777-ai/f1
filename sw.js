const CACHE_NAME = "f1-pitwall-pro-live-v1";

// Activate immediately without waiting for user to close all tabs
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    ).then(() => self.clients.claim())
  );
});

// NETWORK-FIRST STRATEGY:
// Always fetches the latest code from GitHub when online so updates appear automatically!
// Falls back to cache only if the phone has no internet connection.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // For HTML / JS / CSS on your GitHub Pages domain: always check network first with no-cache
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(event.request, { cache: "no-store" })
        .then((networkResponse) => {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return networkResponse;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // For external APIs (Jolpica, OpenF1, Open-Meteo, MyInstants): fetch live
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
