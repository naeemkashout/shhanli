import 'shipment.dart';

class WalletTransaction {
  final String id;
  final String type;
  final String status;
  final String method;
  final double amount;
  final String currency;
  final String description;
  final DateTime createdAt;
  final Shipment? relatedShipment;

  WalletTransaction({
    required this.id,
    required this.type,
    required this.status,
    required this.method,
    required this.amount,
    required this.currency,
    required this.description,
    required this.createdAt,
    this.relatedShipment,
  });

  factory WalletTransaction.fromJson(Map<String, dynamic> json) {
    final relatedShipmentJson = json['relatedShipment'];
    return WalletTransaction(
      id: json['_id']?.toString() ?? json['id']?.toString() ?? '',
      type: json['type']?.toString() ?? '',
      status: json['status']?.toString() ?? '',
      method: json['method']?.toString() ?? '',
      amount: (json['amount'] is num)
          ? (json['amount'] as num).toDouble()
          : double.tryParse(json['amount']?.toString() ?? '0') ?? 0,
      currency: json['currency']?.toString() ?? '',
      description: json['description']?.toString() ?? '',
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ??
          DateTime.now(),
      relatedShipment: relatedShipmentJson is Map<String, dynamic>
          ? Shipment.fromJson(relatedShipmentJson)
          : null,
    );
  }
}
