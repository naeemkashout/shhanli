import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

const String _defaultSiteUrl = 'http://10.0.2.2:5173';
const String siteUrl = String.fromEnvironment('SITE_URL', defaultValue: _defaultSiteUrl);

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
      home: const WebSiteScreen(),
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
  int _progress = 0;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0x00000000))
      ..setNavigationDelegate(
        NavigationDelegate(
          onProgress: (progress) {
            setState(() {
              _progress = progress;
            });
          },
          onNavigationRequest: (request) {
            return NavigationDecision.navigate;
          },
        ),
      )
      ..loadRequest(Uri.parse(siteUrl));
  }

  Future<void> _reload() async {
    await _controller.reload();
  }

  Future<void> _goBack() async {
    if (await _controller.canGoBack()) {
      await _controller.goBack();
    }
  }

  Future<void> _goForward() async {
    if (await _controller.canGoForward()) {
      await _controller.goForward();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('ShipMe Website'),
        actions: [
          IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: _goBack,
            tooltip: 'Back',
          ),
          IconButton(
            icon: const Icon(Icons.arrow_forward),
            onPressed: _goForward,
            tooltip: 'Forward',
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _reload,
            tooltip: 'Reload',
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(4),
          child: _progress < 100
              ? LinearProgressIndicator(value: _progress / 100)
              : const SizedBox(height: 4),
        ),
      ),
      body: WebViewWidget(controller: _controller),
    );
  }
}
