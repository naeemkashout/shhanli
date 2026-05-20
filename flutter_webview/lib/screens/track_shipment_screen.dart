import 'package:flutter/material.dart';

import '../models/shipment.dart';
import '../services/api_service.dart';

class TrackShipmentScreen extends StatefulWidget {
  const TrackShipmentScreen({super.key});

  @override
  State<TrackShipmentScreen> createState() => _TrackShipmentScreenState();
}

class _TrackShipmentScreenState extends State<TrackShipmentScreen> {
  final _trackingController = TextEditingController();
  TrackInfo? _trackInfo;
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void dispose() {
    _trackingController.dispose();
    super.dispose();
  }

  Future<void> _track() async {
    final trackingNumber = _trackingController.text.trim();
    if (trackingNumber.isEmpty) {
      setState(() {
        _errorMessage = 'Enter a tracking number';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
      _trackInfo = null;
    });

    try {
      final result = await ApiService.instance.trackShipment(trackingNumber);
      setState(() {
        _trackInfo = result;
      });
    } catch (error) {
      setState(() {
        _errorMessage = error is ApiException ? error.message : 'Unable to track shipment';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        children: [
          TextField(
            controller: _trackingController,
            textInputAction: TextInputAction.search,
            decoration: const InputDecoration(
              labelText: 'Tracking Number',
              border: OutlineInputBorder(),
            ),
            onSubmitted: (_) => _track(),
          ),
          const SizedBox(height: 12),
          ElevatedButton(
            onPressed: _isLoading ? null : _track,
            child: _isLoading
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('Track Shipment'),
          ),
          const SizedBox(height: 14),
          if (_errorMessage != null)
            Text(_errorMessage!, style: const TextStyle(color: Colors.red)),
          if (_trackInfo != null) ...[
            const SizedBox(height: 16),
            _buildInfoCard(),
          ],
        ],
      ),
    );
  }

  Widget _buildInfoCard() {
    final info = _trackInfo!;
    return Expanded(
      child: Card(
        elevation: 2,
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: ListView(
            children: [
              _detailRow('Tracking Number', info.trackingNumber),
              _detailRow('Status', info.status),
              if (info.sender != null)
                _detailRow('Sender', info.sender!['name']?.toString() ?? 'N/A'),
              if (info.receivers != null && info.receivers!.isNotEmpty)
                _detailRow('Receiver', info.receivers!.first['name']?.toString() ?? 'N/A'),
              _detailRow('Estimated Delivery', info.estimatedDelivery ?? 'N/A'),
              _detailRow('Actual Delivery', info.actualDelivery ?? 'N/A'),
              const SizedBox(height: 12),
              const Text('Status History', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              ...info.statusHistory.map((item) {
                final statusText = item is Map<String, dynamic>
                    ? '${item['status'] ?? ''} - ${item['timestamp'] ?? ''}'
                    : item.toString();
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Text(statusText),
                );
              }),
            ],
          ),
        ),
      ),
    );
  }

  Widget _detailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            flex: 3,
            child: Text(label, style: const TextStyle(fontWeight: FontWeight.bold)),
          ),
          Expanded(flex: 5, child: Text(value)),
        ],
      ),
    );
  }
}
