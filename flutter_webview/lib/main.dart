import 'package:flutter/foundation.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

const String _defaultDebugSiteUrl = 'http://10.0.2.2:5173';
const String _defaultReleaseSiteUrl = 'https://your-production-site.com';
const String siteUrl = kReleaseMode
    ? String.fromEnvironment('SITE_URL', defaultValue: _defaultReleaseSiteUrl)
    : String.fromEnvironment('SITE_URL', defaultValue: _defaultDebugSiteUrl);

bool get _isUnconfiguredReleaseUrl => kReleaseMode && siteUrl == _defaultReleaseSiteUrl;

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ShipMeWebViewApp());
}

class ShipMeWebViewApp extends StatelessWidget {
  const ShipMeWebViewApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'ShipMe Website',
      theme: ThemeData(
        primarySwatch: Colors.blue,
      ),
      home: _isUnconfiguredReleaseUrl
          ? const ReleaseConfigScreen()
          : const WebSiteScreen(),
    );
  }
}

class ReleaseConfigScreen extends StatelessWidget {
  const ReleaseConfigScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: SafeArea(
        child: Padding(
          padding: EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Icon(
                Icons.error_outline,
                size: 72,
                color: Colors.redAccent,
              ),
              SizedBox(height: 24),
              Text(
                'Release build is not configured',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
              SizedBox(height: 16),
              Text(
                'The app is built in release mode but SITE_URL is not configured.\n'
                'Please build with a production URL using the dart define option.',
                style: TextStyle(fontSize: 16, height: 1.5),
                textAlign: TextAlign.center,
              ),
              SizedBox(height: 24),
              SelectableText(
                "flutter build apk --release --dart-define=SITE_URL=https://your-production-site.com",
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.black87,
                  fontFamily: 'Courier',
                ),
                textAlign: TextAlign.center,
              ),
              SizedBox(height: 8),
              SelectableText(
                "flutter build ipa --release --dart-define=SITE_URL=https://your-production-site.com",
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.black87,
                  fontFamily: 'Courier',
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class WebSiteScreen extends StatefulWidget {
  const WebSiteScreen({super.key});

  @override
  State<WebSiteScreen> createState() => _WebSiteScreenState();
}

class _WebSiteScreenState extends State<WebSiteScreen> {
  late final WebViewController _controller;

  Uri _resolveLocalhostUri(Uri uri) {
    if (uri.host == 'localhost' || uri.host == '127.0.0.1') {
      return uri.replace(host: '10.0.2.2');
    }
    return uri;
  }

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0x00000000))
      ..setNavigationDelegate(
        NavigationDelegate(
          onNavigationRequest: (request) {
            final Uri requestedUri = Uri.tryParse(request.url) ?? Uri();
            final Uri rewrittenUri = _resolveLocalhostUri(requestedUri);

            if (rewrittenUri.toString() != requestedUri.toString()) {
              _controller.loadRequest(rewrittenUri);
              return NavigationDecision.prevent;
            }

            return NavigationDecision.navigate;
          },
          onPageStarted: (url) {
            final Uri requestedUri = Uri.tryParse(url) ?? Uri();
            final Uri rewrittenUri = _resolveLocalhostUri(requestedUri);

            if (rewrittenUri.toString() != requestedUri.toString()) {
              _controller.loadRequest(rewrittenUri);
            }
          },
          onPageFinished: (url) async {
            final Uri requestedUri = Uri.tryParse(url) ?? Uri();
            final Uri rewrittenUri = _resolveLocalhostUri(requestedUri);

            if (rewrittenUri.toString() != requestedUri.toString()) {
              await _controller.loadRequest(rewrittenUri);
              return;
            }

            await _controller.runJavaScript(r'''
              (() => {
                const fixUrl = (value) => {
                  if (!value || typeof value !== 'string') return value;
                  return value
                    .replace(/https?:\/\/localhost(:\d+)?/gi, 'http://10.0.2.2$1')
                    .replace(/https?:\/\/127\.0\.0\.1(:\d+)?/gi, 'http://10.0.2.2$1');
                };

                document.querySelectorAll('[href]').forEach((el) => {
                  if (el.href) {
                    el.href = fixUrl(el.href);
                  }
                });

                document.querySelectorAll('[action]').forEach((el) => {
                  if (el.action) {
                    el.action = fixUrl(el.action);
                  }
                });

                document.querySelectorAll('meta[http-equiv]').forEach((el) => {
                  if (el.httpEquiv && el.httpEquiv.toLowerCase() === 'refresh') {
                    el.content = fixUrl(el.content || '');
                  }
                });
              })();
            ''');
          },
        ),
      )
      ..loadRequest(Uri.parse(siteUrl));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        top: true,
        child: WebViewWidget(
          controller: _controller,
          gestureRecognizers: {
            Factory<OneSequenceGestureRecognizer>(
              () => EagerGestureRecognizer(),
            ),
          },
        ),
      ),
    );
  }
}
