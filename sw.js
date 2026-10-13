// Offline support. Bump VERSION every time you upload a changed file,
// or phones will keep running the old copy.
const VERSION = "catalyst-v1";
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "icons/apple-touch-icon.png",
  "fonts/saira-condensed-latin-600-normal.woff2",
  "fonts/saira-condensed-latin-700-normal.woff2",
  "fonts/source-sans-3-latin-400-normal.woff2",
  "fonts/source-sans-3-latin-600-normal.woff2",
  "fonts/jetbrains-mono-latin-500-normal.woff2"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Pages: try the network first so updates arrive, fall back to the saved copy offline.
// Everything else: saved copy first.
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request)
        .then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put("index.html", copy)); return r; })
        .catch(() => caches.match("index.html"))
    );
    return;
  }
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request)));
});
