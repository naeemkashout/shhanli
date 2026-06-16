self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let messageData;
  try {
    messageData = event.data.json();
  } catch (err) {
    console.warn('[firebase-messaging-sw.js] push data parse failed', err);
    return;
  }

  if (messageData?.notification) {
    console.log('[firebase-messaging-sw.js] intercepting notification payload', messageData.notification);
    event.stopImmediatePropagation();

    const title = messageData.notification.title || 'Background Message Title';
    const options = {
      body: messageData.notification.body || 'Background Message body.',
      data: messageData.data || {},
      tag: `${title}|${messageData.notification.body || ''}`,
      renotify: false,
    };

    event.waitUntil(
      (async () => {
        const existing = await self.registration.getNotifications({ tag: options.tag });
        existing.forEach((notification) => notification.close());
        return self.registration.showNotification(title, options);
      })(),
    );
  }
});

importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-messaging-compat.js');

// TODO: Replace with your web config values if you want to hardcode here.
const firebaseConfig = {
  apiKey: "AIzaSyDhh9QmFCCgXvcC96cI-25WfLMqFZ9LeY0",
  authDomain: "shipme-6d246.firebaseapp.com",
  projectId: "shipme-6d246",
  storageBucket: "shipme-6d246.firebasestorage.app",
  messagingSenderId: "695248464104",
  appId: "1:695248464104:web:fb8f8371a83068c237815d",
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

self.addEventListener('push', (event) => {
  console.log('[firebase-messaging-sw.js] push event', event);
  if (event.data) {
    try {
      console.log('[firebase-messaging-sw.js] push data', event.data.json());
    } catch (err) {
      console.warn('[firebase-messaging-sw.js] push data parse failed', err);
    }
  }
});

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification?.title || 'Background Message Title';
  const notificationOptions = {
    body: payload.notification?.body || 'Background Message body.',
    data: payload.data || {},
  };

  // If the payload already contains a notification object, Firebase or the browser may display it automatically.
  // In that case we avoid showing a second duplicate notification from our custom logic.
  const shouldShowNotification = !payload.notification;

  try {
    const now = Date.now();
    self.__recentNotifications = self.__recentNotifications || [];
    self.__recentNotifications = self.__recentNotifications.filter((e) => now - e.ts < 5000);

    const key = [notificationTitle || '', notificationOptions.body || '', JSON.stringify(notificationOptions.data || {})].join('|');
    const seen = self.__recentNotifications.some((e) => e.key === key);
    if (!seen) {
      self.__recentNotifications.push({ key, ts: now });
      if (shouldShowNotification) {
        self.registration.showNotification(notificationTitle, {
          ...notificationOptions,
          tag: key,
          renotify: false,
        });
      } else {
        console.log('[firebase-messaging-sw.js] Skipping custom showNotification because payload already contains notification metadata');
      }

      // Notify any open clients so the page can play a sound or update UI.
      self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then((clientList) => {
        clientList.forEach((client) => {
          try {
            client.postMessage({ type: 'fcm-message', payload });
          } catch (e) {
            // ignore
          }
        });
      });
    } else {
      console.log('[firebase-messaging-sw.js] Duplicate notification suppressed', key);
    }
  } catch (e) {
    if (shouldShowNotification) {
      try {
        self.registration.showNotification(notificationTitle, notificationOptions);
      } catch (err) {
        // ignore
      }
    }
  }
});
