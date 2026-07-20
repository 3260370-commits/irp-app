/* IRP 앱 서비스 워커 — 네트워크 우선, 실패 시 캐시(오프라인 지원) */
const CACHE = 'irp-app-v1';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const url = e.request.url;
  /* GitHub API 호출은 캐시하지 않고 항상 네트워크로 */
  if (url.includes('api.github.com')) return;
  if (e.request.method !== 'GET') return;
  /* 앱 파일: 네트워크 우선(새 버전 즉시 반영), 오프라인이면 캐시 사용 */
  e.respondWith(
    fetch(e.request).then(res => {
      const clone = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, clone));
      return res;
    }).catch(() => caches.match(e.request))
  );
});
