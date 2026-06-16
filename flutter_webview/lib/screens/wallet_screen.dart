import 'package:flutter/material.dart';

import '../models/transaction.dart';
import '../services/api_service.dart';

class WalletScreen extends StatefulWidget {
  const WalletScreen({super.key});

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {
  static const int _pageSize = 10;

  late Future<Map<String, dynamic>> _futureBalance;
  final List<WalletTransaction> _transactions = [];
  int _transactionPage = 1;
  int? _totalTransactionPages;
  bool _isLoadingTransactions = false;
  bool _hasMoreTransactions = true;
  bool _isInitialTransactionLoad = true;
  String? _transactionError;

  @override
  void initState() {
    super.initState();
    _futureBalance = ApiService.instance.getWalletBalance();
    _loadTransactions(page: 1, refresh: true);
  }

  Future<void> _loadTransactions(
      {required int page, bool refresh = false}) async {
    if (_isLoadingTransactions) return;
    setState(() {
      _isLoadingTransactions = true;
      if (refresh) {
        _transactionError = null;
      }
    });

    try {
      final result = await ApiService.instance.getTransactions(
        page: page,
        limit: _pageSize,
      );

      final transactions = result['transactions'] as List<WalletTransaction>;
      final pagination = result['pagination'] as Map<String, dynamic>?;
      final pageCount = pagination != null && pagination['pages'] is num
          ? (pagination['pages'] as num).toInt()
          : null;

      setState(() {
        if (refresh) {
          _transactions.clear();
        }
        _transactions.addAll(transactions);
        _transactionPage = page;
        _totalTransactionPages = pageCount;
        _hasMoreTransactions = transactions.length == _pageSize;
        _transactionError = null;
      });
    } catch (error) {
      setState(() {
        _transactionError = error.toString();
      });
    } finally {
      setState(() {
        _isLoadingTransactions = false;
        _isInitialTransactionLoad = false;
      });
    }
  }

  Future<void> _refresh() async {
    setState(() {
      _futureBalance = ApiService.instance.getWalletBalance();
    });
    await _loadTransactions(page: 1, refresh: true);
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
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Text(snapshot.error.toString(),
                    style: const TextStyle(color: Colors.red)),
              ),
            );
          }

          final balance = snapshot.data ?? {};
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              const Text('Wallet Balance',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              _balanceCard('SYP', balance['SYP']?.toString() ?? '0'),
              const SizedBox(height: 12),
              _balanceCard('USD', balance['USD']?.toString() ?? '0'),
              const SizedBox(height: 24),
              const Text('Recent Transactions',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              if (_transactionError != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Text(
                    _transactionError!,
                    style: const TextStyle(color: Colors.red),
                  ),
                ),
              if (_isInitialTransactionLoad)
                const Center(child: CircularProgressIndicator()),
              if (!_isInitialTransactionLoad && _transactions.isEmpty)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 24),
                  child: Center(
                      child: Text('No transactions found. Pull to refresh.')),
                ),
              ..._transactions.map(_buildTransactionCard),
              const SizedBox(height: 12),
              _transactionPaginationFooter(),
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
            Text(amount,
                style:
                    const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          ],
        ),
      ),
    );
  }

  Widget _transactionPaginationFooter() {
    final pageLabel = _totalTransactionPages != null
        ? 'Page $_transactionPage of $_totalTransactionPages'
        : 'Page $_transactionPage';

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              IconButton(
                onPressed: _transactionPage > 1 && !_isLoadingTransactions
                    ? () => _loadTransactions(
                          page: _transactionPage - 1,
                          refresh: true,
                        )
                    : null,
                icon: const Icon(Icons.chevron_left),
              ),
              Text(pageLabel),
              IconButton(
                onPressed: _hasMoreTransactions && !_isLoadingTransactions
                    ? () => _loadTransactions(
                          page: _transactionPage + 1,
                          refresh: true,
                        )
                    : null,
                icon: const Icon(Icons.chevron_right),
              ),
            ],
          ),
          if (_isLoadingTransactions)
            const Padding(
              padding: EdgeInsets.only(top: 12),
              child: CircularProgressIndicator(),
            ),
        ],
      ),
    );
  }

  Widget _buildTransactionCard(WalletTransaction transaction) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: ListTile(
        title: Text(
            '${transaction.type} • ${transaction.currency} ${transaction.amount.toStringAsFixed(2)}'),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (transaction.relatedShipment != null)
              Text('Shipment: ${transaction.relatedShipment!.trackingNumber}'),
            Text('Status: ${transaction.status}'),
            if (transaction.description.isNotEmpty)
              Text(transaction.description),
            Text(
              transaction.createdAt.toLocal().toString(),
              style: const TextStyle(fontSize: 12, color: Colors.grey),
            ),
          ],
        ),
      ),
    );
  }
}
