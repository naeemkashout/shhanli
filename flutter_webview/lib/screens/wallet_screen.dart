import 'package:flutter/material.dart';

import '../services/api_service.dart';

class WalletScreen extends StatefulWidget {
  const WalletScreen({super.key});

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {
  late Future<Map<String, dynamic>> _futureBalance;

  @override
  void initState() {
    super.initState();
    _futureBalance = ApiService.instance.getWalletBalance();
  }

  Future<void> _refresh() async {
    setState(() {
      _futureBalance = ApiService.instance.getWalletBalance();
    });
    await _futureBalance;
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _refresh,
      child: FutureBuilder<Map<String, dynamic>>(
        future: _futureBalance,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return Center(
              child: Text(snapshot.error.toString(), style: const TextStyle(color: Colors.red)),
            );
          }

          final balance = snapshot.data ?? {};
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              const Text('Wallet Balance', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              _balanceCard('SYP', balance['SYP']?.toString() ?? '0'),
              const SizedBox(height: 12),
              _balanceCard('USD', balance['USD']?.toString() ?? '0'),
              const SizedBox(height: 24),
              const Text('Refresh to update your balance.'),
            ],
          );
        },
      ),
    );
  }

  Widget _balanceCard(String currency, String amount) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(currency, style: const TextStyle(fontSize: 16)),
            Text(amount, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          ],
        ),
      ),
    );
  }
}
