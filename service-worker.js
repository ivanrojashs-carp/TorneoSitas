// Service Worker — Liga Femenina de Maxi Handball
// Estrategia "stale-while-revalidate" para el HTML: muestra la versión
// cacheada de inmediato (carga instantánea) y descarga la nueva de fondo
// para la próxima vez. Los datos del torneo van siempre a la red.

const CACHE_NAME = "liga-handball-v4";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((nombres) =>
      Promise.all(nombres.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  // Datos del torneo: siempre red, nunca caché
  if (url.includes("script.google.com") || url.includes("callback=")) {
    event.respondWith(fetch(event.request));
    return;
  }

  // HTML y todo lo demás: stale-while-revalidate
  // (muestra caché al instante, actualiza de fondo)
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cached) => {
        const fetchPromise = fetch(event.request).then((resp) => {
          cache.put(event.request, resp.clone());
          return resp;
        }).catch(() => cached);

        return cached || fetchPromise;
      });
    })
  );
});
