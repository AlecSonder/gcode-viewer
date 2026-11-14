// offline cache + receive files shared from other apps (Android «Поделиться»)
const VER = "gcv-3";
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(VER).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VER && k !== "gcv-shared").map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method === "POST" && url.pathname.endsWith("/share")) {
    e.respondWith((async () => {
      const form = await e.request.formData();
      const files = form.getAll("files");
      const c = await caches.open("gcv-shared");
      await Promise.all((await c.keys()).map(k => c.delete(k)));
      let i = 0;
      for (const f of files) await c.put(`./shared/${i++}?name=${encodeURIComponent(f.name)}`, new Response(f));
      return Response.redirect("./?shared=" + files.length, 303);
    })());
    return;
  }
  if (e.request.method !== "GET") return;
  // network first (fresh version when online), cache when offline
  e.respondWith(fetch(e.request).then(r => { const cp = r.clone(); caches.open(VER).then(c => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request, {ignoreSearch: true})));
});
