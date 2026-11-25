// Gleich – Service Worker: App-Dateien offline verfügbar, Abfahrtsdaten immer live.
const CACHE = "gleich-v24";
const SHELL = ["./", "index.html", "manifest.json", "icon-192.png", "icon-512.png", "apple-touch-icon.png", "icon-bvg-512.png", "icon-rmv-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  if (url.hostname.endsWith("transport.rest")) return;          // Live-Daten nie cachen
  if (url.origin === location.origin) {
    // Netz zuerst (damit Updates ankommen), sonst Cache
    e.respondWith(fetch(e.request).then(r => {
      const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r;
    }).catch(() => caches.match(e.request).then(r => r || caches.match("index.html"))));
  } else if (url.hostname.includes("fonts.g")) {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return res;
    })));
  }
});
