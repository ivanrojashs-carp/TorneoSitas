// Service Worker — Liga Femenina de Maxi Handball
// Estrategia "network-first" para el HTML (siempre intenta traer la
// versión más nueva de la red; si falla, usa la caché). Los datos del
// torneo (script.google.com) van siempre a la red, sin caché.

const CACHE_NAME = "liga-handball-v3";

self.addEventListener("install", (event) => {
  // Activa inmediatamente sin esperar a que cierre la pestaña vieja
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Borra cachés viejas y toma control inmediato
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

  // HTML principal: network-first (intenta red, cae a caché si falla)
  if (event.request.mode === "navigate" || url.endsWith(".html")) {
    event.respondWith(
      fetch(event.request)
        .then((resp) => {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
          return resp;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Todo lo demás (íconos, fuentes, JS de CDN): caché-first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((resp) => {
        const clone = resp.clone();
        caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
        return resp;
      });
    })
  );
});
