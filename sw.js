// Offline support. Registered as sw.js?v=<VERSION> (see app.js), so each release installs fresh.
// App files: network first (updates arrive right away), the saved copy when offline.
// Audio clips: saved the first time they are heard, then played from the phone.
const VERSION = new URL(location).searchParams.get("v") || "0";
const SHELL_CACHE = "wg-shell-" + VERSION;
const AUDIO_CACHE = "wg-audio";
const SHELL = ["./", "index.html", "app.js", "srs.js", "coach.js", "figure.js", "version.js", "words.json",
               "icon.svg", "manifest.webmanifest", "icons/icon-180.png", "icons/icon-192.png", "icons/icon-512.png",
               "audio/hello.mp3"];

self.addEventListener("install", e => {
  // One file failing (e.g. a flaky connection) must not stop the rest from being saved.
  e.waitUntil(caches.open(SHELL_CACHE)
    .then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {}))))
    .then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith("wg-shell-") && k !== SHELL_CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;

  if (url.pathname.includes("/audio/")) {
    e.respondWith(caches.open(AUDIO_CACHE).then(async cache => {
      const hit = await cache.match(req, { ignoreSearch: true });
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok) cache.put(req, res.clone());
      return res;
    }));
    return;
  }

  e.respondWith(fetch(req).then(res => {
    if (res.ok) caches.open(SHELL_CACHE).then(c => c.put(req, res.clone()));
    return res;
  }).catch(async () => (await caches.match(req, { ignoreSearch: true }))
    || (req.mode === "navigate" ? caches.match("index.html") : Response.error())));
});
