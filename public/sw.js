/* Only a public offline fallback is cached. Never store authenticated pages, APIs,
   exam answers or certificate files in Cache Storage. */
const CACHE = 'klevro-public-offline-v3';
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(['/offline.html', '/pwa/icon-192.png'])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('klevro-public-offline-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.mode !== 'navigate' || event.request.method !== 'GET') return;
  // Installed windows must load the current document and its matching CSS chunks.
  event.respondWith(fetch(event.request, { cache: 'no-store' }).catch(() => caches.match('/offline.html')));
});
self.addEventListener('push', event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { /* Malformed payload gets a generic notification. */ }
  event.waitUntil(self.registration.showNotification('Klevro', {
    body: typeof data.body === 'string' ? data.body.slice(0, 200) : 'لديك تحديث جديد في المنصة',
    icon: '/pwa/icon-192.png', badge: '/pwa/badge-96.png', tag: String(data.tag || 'klevro-update'),
    data: { url: '/notifications' },
  }));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async clients => {
    const client = clients.find(item => new URL(item.url).origin === self.location.origin);
    if (client) { await client.navigate('/notifications'); return client.focus(); }
    return self.clients.openWindow('/notifications');
  }));
});
