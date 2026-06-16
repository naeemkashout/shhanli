import 'package:flutter/material.dart';

import '../models/shipment.dart';
import '../services/api_service.dart';
import 'shipment_detail_screen.dart';

class ShipmentsScreen extends StatefulWidget {
  const ShipmentsScreen({super.key});

  @override
  State<ShipmentsScreen> createState() => _ShipmentsScreenState();
}

class _ShipmentsScreenState extends State<ShipmentsScreen> {
  static const int _pageSize = 10;

  final List<Shipment> _shipments = [];
  int _currentPage = 1;
  bool _isLoading = false;
  bool _hasMore = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadPage(1);
  }

  Future<void> _loadPage(int page, {bool refresh = false}) async {
    if (_isLoading) return;
    setState(() {
      _isLoading = true;
      if (refresh) {
        _errorMessage = null;
      }
    });

    try {
      final shipments = await ApiService.instance.getShipments(
        page: page,
        limit: _pageSize,
      );

      setState(() {
        if (refresh) {
          _shipments.clear();
        }
        _shipments.addAll(shipments);
        _currentPage = page;
        _hasMore = shipments.length == _pageSize;
        _errorMessage = null;
      });
    } catch (error) {
      setState(() {
        _errorMessage = error.toString();
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _refresh() async {
    await _loadPage(_currentPage, refresh: true);
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _refresh,
      child: _shipments.isEmpty && _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _errorMessage != null && _shipments.isEmpty
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Text(
                      _errorMessage!,
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: Colors.red),
                    ),
                  ),
                )
              : ListView.separated(
                  padding: const EdgeInsets.all(12),
                  itemCount: _shipments.isEmpty ? 1 : _shipments.length + 1,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    if (_shipments.isEmpty) {
                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          const SizedBox(height: 80),
                          const Text('No shipments found. Pull to refresh.'),
                          const SizedBox(height: 24),
                          _paginationFooter(),
                        ],
                      );
                    }

                    if (index >= _shipments.length) {
                      return _paginationFooter();
                    }

                    final shipment = _shipments[index];
                    return Card(
                      child: ListTile(
                        title: Text(shipment.trackingNumber),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Status: ${shipment.status}'),
                            if (shipment.receiverName != null)
                              Text('Receiver: ${shipment.receiverName}'),
                          ],
                        ),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => ShipmentDetailScreen(
                                shipmentId: shipment.id,
                              ),
                            ),
                          );
                        },
                      ),
                    );
                  },
                ),
    );
  }

  Widget _paginationFooter() {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              ElevatedButton(
                onPressed: _currentPage > 1 && !_isLoading
                    ? () => _loadPage(_currentPage - 1, refresh: true)
                    : null,
                child: const Text('Previous'),
              ),
              const SizedBox(width: 16),
              Text('Page $_currentPage${_hasMore ? '' : ' (last page)'}'),
              const SizedBox(width: 16),
              ElevatedButton(
                onPressed: _hasMore && !_isLoading
                    ? () => _loadPage(_currentPage + 1, refresh: true)
                    : null,
                child: const Text('Next'),
              ),
            ],
          ),
          if (_isLoading)
            const Padding(
              padding: EdgeInsets.only(top: 12),
              child: CircularProgressIndicator(),
            ),
        ],
      ),
    );
  }
}
