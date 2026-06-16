import { initializeApp } from 'firebase/app';
import { deleteToken, getMessaging, getToken, onMessage } from 'firebase/messaging';
import { firebaseConfig } from './firebaseConfig';
import api from './services/api';

// Simple shared audio unlock helper stored on window so other modules can reuse it.
declare global {
  interface Window {
    __notificationAudio?: { audioContext?: any; unlocked?: boolean };
  }
}

function setupAudioUnlock() {
  try {
    if (typeof window === 'undefined') return;
    if (window.__notificationAudio?.unlocked) return;

    const onFirstGesture = async () => {
      try {
        const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        await ctx.resume();
        window.__notificationAudio = { audioContext: ctx, unlocked: true };
      } catch (err) {
        // ignore
      }
    };

    document.addEventListener('click', onFirstGesture, { once: true, capture: true });
  } catch (err) {
    // ignore
  }
}

async function clearExistingPushSubscription(
  swRegistration?: ServiceWorkerRegistration,
) {
  if (!swRegistration || !swRegistration.pushManager) return;

  try {
    const existingSubscription = await swRegistration.pushManager.getSubscription();
    if (existingSubscription) {
      await existingSubscription.unsubscribe();
      console.log('Cleared existing push subscription from service worker');
    }
  } catch (err) {
    console.warn('Unable to clear existing push subscription', err);
  }
}

export async function initFirebaseMessaging(sendTokenToServer: (token: string) => Promise<any>) {
  try {
    // Prepare audio unlock on first user gesture so notifications can play sound.
    setupAudioUnlock();

    const isNotificationSupported =
      typeof window !== 'undefined' &&
      'Notification' in window &&
      'serviceWorker' in navigator &&
      'PushManager' in window;

    if (!isNotificationSupported) {
      console.warn('Browser does not fully support Web Push notifications');
      return null;
    }

    if (typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('Notifications permission not granted');
        return null;
      }
    }

    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined;
    console.log('Firebase initFirebaseMessaging called', {
      firebaseConfig,
      vapidKey,
    });

    const app = initializeApp(firebaseConfig as any);
    if (!vapidKey) {
      console.warn('VITE_FIREBASE_VAPID_KEY is not set; Web push may not work');
    }

    const messaging = getMessaging(app);
    // Clean duplicate / stale firebase-messaging-sw registrations before registering a fresh one.
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.getRegistrations) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        const firebaseRegistrations = registrations.filter((registration) => {
          const scriptURL = registration.active?.scriptURL || registration.installing?.scriptURL || registration.waiting?.scriptURL || '';
          return scriptURL.includes('/firebase-messaging-sw.js');
        });

        if (firebaseRegistrations.length > 1) {
          console.log('[firebaseInit] Found duplicate firebase-messaging-sw registrations', firebaseRegistrations.map((reg) => reg.scope));
          for (let i = 1; i < firebaseRegistrations.length; i++) {
            try {
              await firebaseRegistrations[i].unregister();
              console.log('[firebaseInit] Unregistered duplicate firebase-messaging-sw', firebaseRegistrations[i].scope);
            } catch (err) {
              console.warn('[firebaseInit] Failed to unregister duplicate SW', err);
            }
          }
        }
      } catch (err) {
        console.warn('[firebaseInit] Unable to inspect service worker registrations', err);
      }
    }

    // Register service worker (for web push background messages)
    let swRegistration: ServiceWorkerRegistration | undefined;
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          updateViaCache: 'none',
        });
        await swRegistration.update();
        // Wait until the service worker is active/ready
        await navigator.serviceWorker.ready;
        console.log('Service worker registered', {
          scope: swRegistration.scope,
          scriptURL: swRegistration.active?.scriptURL,
        });
        // Listen for messages from the service worker (e.g., background FCM messages)
        if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
          try {
            navigator.serviceWorker.addEventListener('message', (event) => {
              try {
                const data = event?.data;
                if (data?.type === 'fcm-message') {
                  try {
                    const shared = window.__notificationAudio || (window as any).__notificationAudio;
                    if (shared?.unlocked && shared.audioContext) {
                      const audioContext = shared.audioContext;
                      const oscillator = audioContext.createOscillator();
                      const gainNode = audioContext.createGain();

                      oscillator.type = 'sine';
                      oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
                      gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime);
                      gainNode.gain.exponentialRampToValueAtTime(0.08, audioContext.currentTime + 0.02);
                      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.25);

                      oscillator.connect(gainNode);
                      gainNode.connect(audioContext.destination);
                      oscillator.start(audioContext.currentTime);
                      oscillator.stop(audioContext.currentTime + 0.26);

                      oscillator.onended = () => {
                        // keep the audioContext open for future sounds
                      };
                    } else {
                      // Fallback: try to play an audio file if provided in public/sounds/notification.mp3
                      try {
                        const audio = new Audio('/sounds/notification.mp3');
                        void audio.play().catch(() => {});
                      } catch (e) {
                        // ignore
                      }
                    }
                  } catch (err) {
                    // ignore
                  }
                }
              } catch (err) {
                // ignore
              }
            });
          } catch (err) {
            // ignore
          }
        }
      } catch (swErr) {
        console.warn('Service worker registration failed', swErr);
        swRegistration = undefined;
      }
    }

    // Request permission and token
    let currentToken: string | null = null;
    const getTokenOptions: any = { vapidKey: vapidKey };
    if (swRegistration) getTokenOptions.serviceWorkerRegistration = swRegistration;

    const tryGetToken = async () => {
      return await getToken(messaging, getTokenOptions);
    };

    try {
      currentToken = await tryGetToken();
    } catch (err: any) {
      console.warn('An error occurred while retrieving token. Retrying after cleanup.', err);

      if (swRegistration) {
        await clearExistingPushSubscription(swRegistration);
        try {
          await deleteToken(messaging);
        } catch (deleteErr) {
          console.warn('deleteToken failed during retry cleanup', deleteErr);
        }
        try {
          currentToken = await tryGetToken();
        } catch (retryErr) {
          console.error('Retry getToken failed', retryErr);
        }
      }
    }

    if (currentToken) {
      console.log('FCM token:', currentToken);
      try {
        await sendTokenToServer(currentToken);
      } catch (e) {
        console.warn('Failed to send token to server', e);
      }
    }

    onMessage(messaging, (payload) => {
      console.log('Message received. ', payload);
      // You can display in-app notification toast here
    });

    return messaging;
  } catch (error) {
    console.error('Firebase init error', error);
    return null;
  }
}

// Default token sender using existing `api` wrapper which should include Authorization header
export async function defaultSendTokenToServer(token: string) {
  try {
    await api.post('/notifications/device-token', { token });
  } catch (err) {
    console.error('Failed to register token on backend', err);
  }
}

export default { initFirebaseMessaging, defaultSendTokenToServer };
