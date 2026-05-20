import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:mime/mime.dart';
import 'package:path/path.dart' as path;
import 'package:shared_preferences/shared_preferences.dart';

import '../models/notification_item.dart';
import '../models/shipment.dart';
import '../models/shipping_company.dart';
import '../models/user.dart';

class ApiException implements Exception {
  final String message;
  ApiException(this.message);

  @override
  String toString() => message;
}

class ApiService {
  ApiService._();
  static final ApiService instance = ApiService._();

  static const _tokenKey = 'auth_token';
  static const _refreshTokenKey = 'refresh_token';
  static const _userKey = 'auth_user';

  String? _token;
  String? _refreshToken;
  User? user;

  String get baseUrl {
    if (Platform.isAndroid) {
      return 'http://10.0.2.2:5001/api';
    }
    return 'http://localhost:5001/api';
  }

  bool get isAuthenticated => _token != null;

  Future<bool> initialize() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString(_tokenKey);
    _refreshToken = prefs.getString(_refreshTokenKey);

    if (_token == null) {
      return false;
    }

    final userJson = prefs.getString(_userKey);
    if (userJson != null) {
      user = User.fromJson(jsonDecode(userJson));
    }

    try {
      await refreshMe();
      return true;
    } catch (_) {
      await _clearSession();
      return false;
    }
  }

  Map<String, String> get _headers {
    final headers = {'Content-Type': 'application/json'};
    if (_token != null) {
      headers['Authorization'] = 'Bearer $_token';
    }
    return headers;
  }

  Future<void> _saveSession({required String token, required String refreshToken, required User authenticatedUser}) async {
    _token = token;
    _refreshToken = refreshToken;
    user = authenticatedUser;

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
    await prefs.setString(_refreshTokenKey, refreshToken);
    await prefs.setString(_userKey, jsonEncode(authenticatedUser.toJson()));
  }

  Future<void> _clearSession() async {
    _token = null;
    _refreshToken = null;
    user = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_refreshTokenKey);
    await prefs.remove(_userKey);
  }

  Future<void> refreshMe() async {
    final uri = Uri.parse('$baseUrl/auth/me');
    final response = await http.get(uri, headers: _headers);
    final body = jsonDecode(response.body);

    if (response.statusCode != 200 || body['success'] != true) {
      throw ApiException(body['message'] ?? 'Unable to refresh user');
    }

    user = User.fromJson(body['data']);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_userKey, jsonEncode(user!.toJson()));
  }

  Future<void> login(String email, String password) async {
    final uri = Uri.parse('$baseUrl/auth/login');
    final response = await http.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email.trim(), 'password': password.trim()}),
    );

    final body = jsonDecode(response.body);
    if (response.statusCode != 200 || body['success'] != true) {
      throw ApiException(body['message'] ?? 'Login failed');
    }

    final data = body['data'];
    final user = User.fromJson(data['user']);
    await _saveSession(
      token: data['token'],
      refreshToken: data['refreshToken'],
      authenticatedUser: user,
    );
  }

  Future<void> register({
    required String name,
    required String email,
    required String phone,
    required String password,
  }) async {
    final uri = Uri.parse('$baseUrl/auth/register');
    final response = await http.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'name': name.trim(),
        'email': email.trim(),
        'phone': phone.trim(),
        'password': password.trim(),
      }),
    );

    final body = jsonDecode(response.body);
    if (response.statusCode != 201 || body['success'] != true) {
      throw ApiException(body['message'] ?? 'Registration failed');
    }

    final data = body['data'];
    final user = User.fromJson(data['user']);
    await _saveSession(
      token: data['token'],
      refreshToken: data['refreshToken'],
      authenticatedUser: user,
    );
  }

  Future<void> logout() async {
    if (_token != null) {
      try {
        final uri = Uri.parse('$baseUrl/auth/logout');
        await http.post(uri, headers: _headers);
      } catch (_) {
        // ignore
      }
    }
    await _clearSession();
  }

  Future<List<ShippingCompany>> getShippingCompanies({required String shippingType}) async {
    final uri = Uri.parse('$baseUrl/shipping-companies?shippingType=$shippingType');
    final response = await http.get(uri, headers: {'Content-Type': 'application/json'});
    final body = jsonDecode(response.body);

    if (response.statusCode != 200 || body['success'] != true) {
      throw ApiException(body['message'] ?? 'Unable to fetch shipping companies');
    }

    final data = body['data'] as List<dynamic>;
    return data.map((json) => ShippingCompany.fromJson(json)).toList();
  }

  Future<http.Response> _sendMultipartRequest(http.MultipartRequest request) async {
    final streamedResponse = await request.send();
    return await http.Response.fromStream(streamedResponse);
  }

  Future<void> createShipment({
    required Map<String, dynamic> shipmentData,
    File? packageImageFile,
  }) async {
    if (!isAuthenticated) {
      throw ApiException('User is not authenticated');
    }

    final uri = Uri.parse('$baseUrl/shipments');
    if (packageImageFile != null) {
      final request = http.MultipartRequest('POST', uri)
        ..headers['Authorization'] = 'Bearer $_token'
        ..fields['data'] = jsonEncode(shipmentData);

      final mimeType = lookupMimeType(packageImageFile.path) ?? 'image/jpeg';
      final mediaType = MediaType(
        mimeType.split('/').first,
        mimeType.split('/').last,
      );

      request.files.add(
        await http.MultipartFile.fromPath(
          'packageImage',
          packageImageFile.path,
          contentType: mediaType,
          filename: path.basename(packageImageFile.path),
        ),
      );

      final response = await _sendMultipartRequest(request);
      final body = jsonDecode(response.body);

      if (response.statusCode != 201 || body['success'] != true) {
        throw ApiException(body['message'] ?? 'Failed to create shipment');
      }
      return;
    }

    final response = await http.post(
      uri,
      headers: _headers,
      body: jsonEncode(shipmentData),
    );
    final body = jsonDecode(response.body);

    if (response.statusCode != 201 || body['success'] != true) {
      throw ApiException(body['message'] ?? 'Failed to create shipment');
    }
  }

  Future<Map<String, dynamic>> getWalletBalance() async {
    final uri = Uri.parse('$baseUrl/wallet/balance');
    final response = await http.get(uri, headers: _headers);
    final body = jsonDecode(response.body);

    if (response.statusCode != 200 || body['success'] != true) {
      throw ApiException(body['message'] ?? 'Unable to fetch wallet balance');
    }

    return Map<String, dynamic>.from(body['data']['balance'] ?? {});
  }

  Future<List<NotificationItem>> getNotifications({int page = 1, int limit = 20}) async {
    final uri = Uri.parse('$baseUrl/notifications?page=$page&limit=$limit');
    final response = await http.get(uri, headers: _headers);
    final body = jsonDecode(response.body);

    if (response.statusCode != 200 || body['success'] != true) {
      throw ApiException(body['message'] ?? 'Unable to fetch notifications');
    }

    final data = body['data'] as List<dynamic>;
    return data.map((json) => NotificationItem.fromJson(json)).toList();
  }

  Future<void> markNotificationAsRead(String id) async {
    final uri = Uri.parse('$baseUrl/notifications/$id/read');
    final response = await http.put(uri, headers: _headers);
    final body = jsonDecode(response.body);

    if (response.statusCode != 200 || body['success'] != true) {
      throw ApiException(body['message'] ?? 'Unable to mark notification as read');
    }
  }

  Future<void> markAllNotificationsAsRead() async {
    final uri = Uri.parse('$baseUrl/notifications/read-all');
    final response = await http.put(uri, headers: _headers);
    final body = jsonDecode(response.body);

    if (response.statusCode != 200 || body['success'] != true) {
      throw ApiException(body['message'] ?? 'Unable to mark notifications as read');
    }
  }

  Future<List<Shipment>> getShipments({int page = 1, int limit = 20}) async {
    final uri = Uri.parse('$baseUrl/shipments?page=$page&limit=$limit');
    final response = await http.get(uri, headers: _headers);
    final body = jsonDecode(response.body);

    if (response.statusCode != 200 || body['success'] != true) {
      throw ApiException(body['message'] ?? 'Unable to fetch shipments');
    }

    final data = body['data'] as List<dynamic>;
    return data.map((json) => Shipment.fromJson(json)).toList();
  }

  Future<Shipment> getShipmentDetail(String id) async {
    final uri = Uri.parse('$baseUrl/shipments/$id');
    final response = await http.get(uri, headers: _headers);
    final body = jsonDecode(response.body);

    if (response.statusCode != 200 || body['success'] != true) {
      throw ApiException(body['message'] ?? 'Unable to load shipment details');
    }
    return Shipment.fromJson(body['data']);
  }

  Future<TrackInfo> trackShipment(String code) async {
    final uri = Uri.parse('$baseUrl/shipments/track/${Uri.encodeComponent(code.trim())}');
    final response = await http.get(uri, headers: {'Content-Type': 'application/json'});
    final body = jsonDecode(response.body);

    if (response.statusCode != 200 || body['success'] != true) {
      throw ApiException(body['message'] ?? 'Unable to track shipment');
    }

    return TrackInfo.fromJson(body['data']);
  }
}
