import 'package:flutter/material.dart';

import '../models/shipment.dart';
import '../services/api_service.dart';

class ShipmentDetailScreen extends StatelessWidget {
  final String shipmentId;

  const ShipmentDetailScreen({super.key, required this.shipmentId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Shipment Details')),
      body: FutureBuilder<Shipment>(
        future: ApiService.instance.getShipmentDetail(shipmentId),
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return Center(
              child: Text(
                snapshot.error.toString(),
                style: const TextStyle(color: Colors.red),
              ),
            );
          }

          final shipment = snapshot.data!;
          return Padding(
            padding: const EdgeInsets.all(16.0),
            child: ListView(
              children: [
                _detailRow('Tracking Number', shipment.trackingNumber),
                _detailRow('Status', shipment.status),
                _detailRow('Sender', shipment.senderName ?? 'N/A'),
                _detailRow('Receiver', shipment.receiverName ?? 'N/A'),
                _detailRow('Package type', shipment.packageType ?? 'N/A'),
                _detailRow('Estimated delivery', shipment.estimatedDelivery ?? 'N/A'),
                _detailRow('Created at', shipment.createdAt?.toLocal().toString() ?? 'N/A'),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _detailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 6),
          Text(value),
        ],
      ),
    );
  }
}
