Flutter FCM integration (notes for this WebView app)

This app hosts the web frontend inside a WebView. For mobile push notifications you have two options:

1) Let the web frontend handle push (recommended for this WebView approach)
   - Add Firebase Web config to the hosted site and ensure `firebase-messaging-sw.js` is available on the site root.
   - The WebView won't receive OS-level push on Android/iOS when the app is closed; web push only works via browser contexts.

2) Native FCM in the Flutter app (to receive OS-level push while app is backgrounded/closed)
   - Add `firebase_core` and `firebase_messaging` packages to `pubspec.yaml`:
     firebase_core: ^2.10.0
     firebase_messaging: ^14.6.6

   - Android: place `google-services.json` into `android/app/` and update Gradle per Firebase docs.
   - iOS: place `GoogleService-Info.plist` into `ios/Runner/` and enable background modes/Push Notifications.

Example minimal initialization (put in `main.dart` before `runApp`):

```dart
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();

  // Foreground message handler
  FirebaseMessaging.onMessage.listen((RemoteMessage message) {
    print('Foreground message: ${message.notification?.title}');
  });

  // Background message handler - must be a top-level function
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

  runApp(const ShipMeWebViewApp());
}

Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  // handle background message
}
```

Obtain token and send to backend:

```dart
final token = await FirebaseMessaging.instance.getToken();
// POST to backend /api/notifications/device-token with Authorization header
```

Security notes:
- Keep `google-services.json` and `GoogleService-Info.plist` out of public VCS if they contain credentials.
- Backend already supports `POST /api/notifications/device-token` (authenticated).

If you want I can add the `pubspec.yaml` changes and a ready-to-copy Dart snippet into your `main.dart` and a small script to POST the token to the backend. Provide the `google-services.json` and `GoogleService-Info.plist` or confirm you will add them.
