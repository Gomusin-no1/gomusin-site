/* 컨설팅 · 오프라인 대비
   항상 인터넷에서 최신 파일을 먼저 받고, 인터넷이 끊겼을 때만 저장해 둔 파일을 써요. */
var C = 'gms-consult-20261128i';
self.addEventListener('install', function (e) { self.skipWaiting(); e.waitUntil(caches.open(C).then(function (c) { return c.addAll(['./', 'index.html', 'css/app.css', 'js/data.js', 'js/core.js', 'js/app.js', 'manifest.webmanifest']).catch(function () {}); })); });
self.addEventListener('activate', function (e) { e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== C; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); })); });
self.addEventListener('fetch', function (e) {
  var u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(function (r) { if (r && r.ok) { var cp = r.clone(); caches.open(C).then(function (c) { c.put(e.request, cp); }); } return r; })
    .catch(function () { return caches.match(e.request, { ignoreSearch: true }).then(function (m) { return m || caches.match('index.html'); }); }));
});
