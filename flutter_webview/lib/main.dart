import 'package:flutter/material.dart';
import 'screens/home_screen.dart';
import 'screens/login_screen.dart';
import 'services/api_service.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ShipMeMobileApp());
}

class ShipMeMobileApp extends StatelessWidget {
  const ShipMeMobileApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ShipMe Mobile',
      theme: ThemeData(
        primarySwatch: Colors.blue,
      ),
      home: const StartupScreen(),
    );
  }
}

class StartupScreen extends StatefulWidget {
  const StartupScreen({super.key});

  @override
  State<StartupScreen> createState() => _StartupScreenState();
}

class _StartupScreenState extends State<StartupScreen> {
  late Future<bool> _initialized;

  @override
  void initState() {
    super.initState();
    _initialized = ApiService.instance.initialize();
  }

  void _refresh() {
    setState(() {
      _initialized = ApiService.instance.initialize();
    });
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<bool>(
      future: _initialized,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }

        if (snapshot.hasData && snapshot.data == true) {
          return HomeScreen(onLogout: _refresh);
        }

        return LoginScreen(onSignedIn: _refresh);
      },
    );
  }
}
