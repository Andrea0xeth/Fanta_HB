// Push notification handler per il service worker
// Questo codice viene iniettato nel service worker generato da VitePWA

// Permette al client di forzare l'attivazione immediata del nuovo SW
self.addEventListener('message', (event) => {
  if (event?.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Prendi controllo dei client subito dopo l'attivazione
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Gestisci messaggi push
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification ricevuta:', event);

  let notificationData = {
    title: 'DC-30',
    body: 'Hai ricevuto una nuova notifica!',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: 'default',
    data: {},
  };

  // Se il payload contiene dati, usali
  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = {
        title: payload.title || notificationData.title,
        body: payload.body || payload.message || notificationData.body,
        icon: payload.icon || notificationData.icon,
        badge: payload.badge || notificationData.badge,
        tag: payload.tag || payload.id || notificationData.tag,
        data: payload.data || payload,
        requireInteraction: payload.requireInteraction || false,
        actions: payload.actions || [],
      };
    } catch (e) {
      // Se non è JSON, prova come testo
      notificationData.body = event.data.text();
    }
  }

  const promiseChain = self.registration.showNotification(notificationData.title, {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: notificationData.tag,
    data: notificationData.data,
    requireInteraction: notificationData.requireInteraction,
    actions: notificationData.actions,
    vibrate: [200, 100, 200],
    timestamp: Date.now(),
  });

  event.waitUntil(promiseChain);
});

// Gestisci click sulle notifiche
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Click su notifica:', event);

  event.notification.close();

  const notificationData = event.notification.data || {};
  const urlToOpen = notificationData.url || '/';

  // Apri o focus sulla finestra dell'app
  event.waitUntil(
    clients
      .matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      .then((clientList) => {
        // Se c'è già una finestra aperta, focus su quella
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Altrimenti apri una nuova finestra
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Gestisci chiusura notifiche
self.addEventListener('notificationclose', (event) => {
  console.log('[Service Worker] Notifica chiusa:', event);
});
