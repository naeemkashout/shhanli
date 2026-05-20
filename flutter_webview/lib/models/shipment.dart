class Shipment {
  final String id;
  final String trackingNumber;
  final String status;
  final DateTime? createdAt;
  final String? senderName;
  final String? receiverName;
  final String? packageType;
  final String? estimatedDelivery;

  Shipment({
    required this.id,
    required this.trackingNumber,
    required this.status,
    this.createdAt,
    this.senderName,
    this.receiverName,
    this.packageType,
    this.estimatedDelivery,
  });

  factory Shipment.fromJson(Map<String, dynamic> json) {
    final sender = json['sender'] as Map<String, dynamic>?;
    final receivers = json['receivers'] as List<dynamic>?;
    final receiverName = receivers != null && receivers.isNotEmpty
        ? receivers.first['name']?.toString()
        : null;

    return Shipment(
      id: json['_id']?.toString() ?? json['id']?.toString() ?? '',
      trackingNumber: json['trackingNumber']?.toString() ?? '',
      status: json['status']?.toString() ?? 'unknown',
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt']) : null,
      senderName: sender != null ? sender['name']?.toString() : null,
      receiverName: receiverName,
      packageType: json['packageType']?.toString(),
      estimatedDelivery: json['estimatedDelivery']?.toString(),
    );
  }
}

class TrackInfo {
  final String trackingNumber;
  final String status;
  final List<dynamic> statusHistory;
  final Map<String, dynamic>? sender;
  final List<dynamic>? receivers;
  final String? estimatedDelivery;
  final String? actualDelivery;

  TrackInfo({
    required this.trackingNumber,
    required this.status,
    required this.statusHistory,
    this.sender,
    this.receivers,
    this.estimatedDelivery,
    this.actualDelivery,
  });

  factory TrackInfo.fromJson(Map<String, dynamic> json) {
    return TrackInfo(
      trackingNumber: json['trackingNumber']?.toString() ?? '',
      status: json['status']?.toString() ?? '',
      statusHistory: json['statusHistory'] as List<dynamic>? ?? [],
      sender: json['sender'] as Map<String, dynamic>?,
      receivers: json['receivers'] as List<dynamic>?,
      estimatedDelivery: json['estimatedDelivery']?.toString(),
      actualDelivery: json['actualDelivery']?.toString(),
    );
  }
}
