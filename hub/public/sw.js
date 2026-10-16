// TOMZO ARCADE の Service Worker。
// ネットワーク優先で常に最新を取りに行き、取れたものをキャッシュに残す。
// オフライン時だけキャッシュから返すので、一度遊んだゲームは電波が無くても起動できる。
const CACHE = 'tomzo-arcade-v2';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  // ページ本体（HTML）はブラウザの HTTP キャッシュ（GitHub Pages は10分）を使わず、毎回サーバーに確認する。
  // js/css はファイル名にハッシュが付くので、HTML さえ新しければ最新版が読まれる。
  event.respondWith(
    fetch(request.mode === 'navigate' ? new Request(request, { cache: 'no-cache' }) : request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request).then((hit) => hit ?? Response.error())),
  );
});
