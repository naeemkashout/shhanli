import 'package:flutter/material.dart';

import '../services/api_service.dart';
import 'register_screen.dart';

class LoginScreen extends StatefulWidget {
  final VoidCallback onSignedIn;

  const LoginScreen({super.key, required this.onSignedIn});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _signIn() async {
    setState(() {
      _isLoading = true;
    });

    try {
      await ApiService.instance.login(
        _emailController.text,
        _passwordController.text,
      );
      if (!mounted) return;
      widget.onSignedIn();
    } catch (error) {
      if (!mounted) return;
      final message =
          error is ApiException ? error.message : 'Unable to sign in';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(message)),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  void _openRegister() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => RegisterScreen(onRegistered: widget.onSignedIn),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('ShipMe Login')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            TextField(
              controller: _emailController,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(labelText: 'Email'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _passwordController,
              obscureText: true,
              decoration: const InputDecoration(labelText: 'Password'),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _isLoading ? null : _signIn,
              child: _isLoading
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Sign In'),
            ),
            const SizedBox(height: 16),
            TextButton(
              onPressed: _openRegister,
              child: const Text('Create an account'),
            ),
          ],
        ),
      ),
    );
  }
}
