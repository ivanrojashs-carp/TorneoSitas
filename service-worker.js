// Service Worker — Liga Femenina de Handball
// Cachea solo el "cascarón" de la app (HTML, CSS, íconos) para que abra
// instantáneo y sea instalable. Los datos del torneo (partidos, tabla,
// goleadoras, noticias) SIEMPRE se piden a la red, nunca se cachean,
// para que los resultados en vivo se vean actualizados.

const CACHE_NAME = "liga-handball-shell-v1";

const ARCHIVOS_DEL_SHELL = [
  "/index.html",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];

// Al instalar: descarga y cachea el shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ARCHIVOS_DEL_SHELL))
  );
  self.skipWaiting();
});

// Al activar: borra cachés viejas de versiones anteriores
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((nombres) =>
      Promise.all(
        nombres
          .filter((n) => n !== CACHE_NAME)
          .map((n) => caches.delete(n))
      )
    )
  );
  self.clients.claim();
});

// Estrategia de fetch:
// - Llamadas a la API de Apps Script (script.google.com) -> siempre red,
//   nunca caché, porque ahí vive el fixture, los resultados en vivo, etc.
// - Todo lo demás (shell de la app) -> caché primero, con red de respaldo.
self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  if (url.includes("script.google.com")) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((respuestaCacheada) => {
      return (
        respuestaCacheada ||
        fetch(event.request).then((respuestaRed) => {
          // Guarda en caché cualquier archivo nuevo del propio sitio
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, respuestaRed.clone());
            return respuestaRed;
          });
        })
      );
    }).catch(() => caches.match("/index.html"))
  );
});
