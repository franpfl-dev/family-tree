/**
 * sw.js — Service Worker
 * Handles background push notification scheduling for Family Tree app.
 *
 * NOTE: Push Notifications (and Service Workers) require HTTPS in production.
 * On localhost they work over HTTP for development/testing.
 *
 * This SW is intentionally minimal — it caches nothing and does no offline handling.
 * Its only job is to receive NOTIFICATION_CHECK messages and fire Notification API calls.
 */

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Listen for messages from the main app
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'CHECK_TODAY_EVENTS') {
    const { events, prefs } = event.data;
    if (!prefs || !prefs.enabled) return;

    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayMD = `${mm}-${dd}`;

    for (const ev of events) {
      if (!ev.dateStr) continue;
      const parts = ev.dateStr.split('-');
      if (parts.length < 3) continue;
      const evMD = `${parts[1]}-${parts[2]}`;
      if (evMD !== todayMD) continue;

      // Only show if the relevant toggle is on
      if (ev.type === 'birthday' && !prefs.birthdays) continue;
      if (ev.type === 'anniversary' && !prefs.anniversaries) continue;
      if (ev.type === 'remembrance' && !prefs.remembrances) continue;

      self.registration.showNotification(ev.title, {
        body: ev.body,
        icon: ev.icon || '/favicon.svg',
        tag: ev.tag,
        badge: '/favicon.svg',
      });
    }
  }
});

// Handle notification click — focus or open the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return self.clients.openWindow('/');
    }),
  );
});
