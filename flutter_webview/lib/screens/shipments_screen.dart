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
  late Future<List<Shipment>> _futureShipments;

  @override
  void initState() {
    super.initState();
    _futureShipments = ApiService.instance.getShipments();
  }

  Future<void> _refresh() async {
    setState(() {
      _futureShipments = ApiService.instance.getShipments();
    });
    await _futureShipments;
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _refresh,
      child: FutureBuilder<List<Shipment>>(
        future: _futureShipments,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Text(
                  snapshot.error.toString(),
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.red),
                ),
              ),
            );
          }

          final shipments = snapshot.data ?? [];
          if (shipments.isEmpty) {
            return const Center(child: Text('No shipments found. Pull to refresh.'));
          }

          return ListView.separated(
            padding: const EdgeInsets.all(12),
            itemCount: shipments.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (context, index) {
              final shipment = shipments[index];
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
                        builder: (_) => ShipmentDetailScreen(shipmentId: shipment.id),
                      ),
                    );
                  },
                ),
              );
            },
          );
        },
      ),
    );
  }
}
