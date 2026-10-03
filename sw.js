// Service worker: bildirim gösterme ve tıklayınca ilgili sayfayı açma.
// Canlı modda Firebase Cloud Messaging "data" mesajı gönderir: { data: { title, body, url, tag } }.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (e) => {
  let payload = {};
  try { payload = e.data ? e.data.json() : {}; } catch { payload = { body: e.data?.text() }; }
  const m = payload.data || payload.notification || payload;
  e.waitUntil(self.registration.showNotification(m.title || 'F1 Telemetri', {
    body: m.body || '', tag: m.tag, icon: '/assets/images/icon-192.png', badge: '/assets/images/icon-192.png', data: { url: m.url || '/' },
  }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = new URL(e.notification.data?.url || '/', self.location.origin).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
    for (const w of wins) if (w.url.startsWith(self.location.origin) && 'focus' in w) return w.navigate(url).then((c) => (c || w).focus());
    return self.clients.openWindow(url);
  }));
});
