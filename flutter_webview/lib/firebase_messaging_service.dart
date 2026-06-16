import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'services/api_service.dart';

const _pendingFcmTokenKey = 'pending_fcm_token';

Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  // Handle background messages here if needed.
  debugPrint('FCM background message: ${message.messageId}');
}

class FirebaseMessagingService {
  FirebaseMessagingService._();
  static final FirebaseMessagingService instance = FirebaseMessagingService._();

  final FirebaseMessaging _messaging = FirebaseMessaging.instance;

  String? _deviceToken;

  Future<void> init() async {
    await Firebase.initializeApp();
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
    await _requestPermissions();
    await _registerDeviceToken();
    _messaging.onTokenRefresh.listen(_handleTokenRefresh);
    FirebaseMessaging.onMessage.listen(_handleMessage);
    FirebaseMessaging.onMessageOpenedApp.listen(_handleMessageOpenedApp);
  }

  Future<void> _requestPermissions() async {
    final settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );

    debugPrint('FCM permission status: ${settings.authorizationStatus}');
  }

  Future<void> _registerDeviceToken() async {
    final token = await _messaging.getToken();
    if (token == null) {
      debugPrint('FCM token is null');
      return;
    }

    _deviceToken = token;
    await _storeToken(token);
    await _sendTokenToServerIfReady(token);
  }

  Future<void> _handleTokenRefresh(String token) async {
    _deviceToken = token;
    await _storeToken(token);
    await _sendTokenToServerIfReady(token);
  }

  Future<void> _handleMessage(RemoteMessage message) async {
    debugPrint('FCM onMessage received: ${message.messageId}');
    // You can show an in-app message or notification UI here.
  }

  Future<void> _handleMessageOpenedApp(RemoteMessage message) async {
    debugPrint('FCM onMessageOpenedApp: ${message.messageId}');
  }

  Future<void> _sendTokenToServerIfReady(String token) async {
    if (ApiService.instance.isAuthenticated) {
      try {
        await ApiService.instance.registerDeviceToken(token);
        debugPrint('FCM token sent to backend');
      } catch (error) {
        debugPrint('Failed to send FCM token to backend: $error');
        await _storePendingToken(token);
      }
    } else {
      await _storePendingToken(token);
    }
  }

  Future<void> trySendPendingToken() async {
    final prefs = await SharedPreferences.getInstance();
    final pendingToken = prefs.getString(_pendingFcmTokenKey);
    if (pendingToken != null && ApiService.instance.isAuthenticated) {
      try {
        await ApiService.instance.registerDeviceToken(pendingToken);
        await prefs.remove(_pendingFcmTokenKey);
        debugPrint('Pending FCM token sent to backend');
      } catch (error) {
        debugPrint('Failed to send pending token: $error');
      }
    }
  }

  Future<void> _storeToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('fcm_device_token', token);
    debugPrint('FCM Token : $token');
   
  }

  Future<void> _storePendingToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_pendingFcmTokenKey, token);
  }

  Future<String?> getToken() async {
    if (_deviceToken != null) return _deviceToken;
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('fcm_device_token');
  }
}
