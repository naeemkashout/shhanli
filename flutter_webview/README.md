# ShipMe Mobile

A Flutter mobile app for Android and iOS that connects to the ShipMe backend.

## Run

1. Open a terminal in `flutter_webview`
2. Run `flutter pub get`
3. If the `android` and `ios` folders are missing, generate them with:
   - `flutter create .`
4. Start the app on a device or emulator:
   - `flutter run`
   - or `flutter run -d chrome` for web testing

## Local API configuration

- Android emulator: `http://10.0.2.2:5001/api`
- iOS simulator: `http://localhost:5001/api`
- Physical device: use your machine IP address and update `ApiService.baseUrl`

## Android

1. Ensure the app has internet permission in `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
```

2. Use an Android emulator or a physical device connected to your development machine.

## iOS

1. If your backend uses `http://`, add App Transport Security exceptions in `ios/Runner/Info.plist`.
2. Use the iOS simulator or a connected physical device.

## Features

- User authentication (login + registration)
- Shipment listing
- Create new shipments with sender, receiver, package, and company details
- Attach a package image to shipment creation
- Public shipment tracking
- Wallet balance view
- Notifications list with read actions
- Persistent login using shared preferences
- Android and iOS ready

## Dependencies

- `http`
- `shared_preferences`
- `image_picker`
- `mime`
- `path`
- `http_parser`

## Notes

- Update the backend URL inside `flutter_webview/lib/services/api_service.dart` if your API runs on a different host or port.
- Run `flutter pub get` after changing dependencies.
