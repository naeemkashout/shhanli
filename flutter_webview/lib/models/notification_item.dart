class NotificationItem {
  final String id;
  final String titleAr;
  final String titleEn;
  final String messageAr;
  final String messageEn;
  final bool isRead;
  final DateTime createdAt;

  NotificationItem({
    required this.id,
    required this.titleAr,
    required this.titleEn,
    required this.messageAr,
    required this.messageEn,
    required this.isRead,
    required this.createdAt,
  });

  factory NotificationItem.fromJson(Map<String, dynamic> json) {
    return NotificationItem(
      id: json['_id']?.toString() ?? json['id']?.toString() ?? '',
      titleAr: json['titleAr']?.toString() ?? '',
      titleEn: json['titleEn']?.toString() ?? '',
      messageAr: json['messageAr']?.toString() ?? '',
      messageEn: json['messageEn']?.toString() ?? '',
      isRead: json['isRead'] == true,
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ?? DateTime.now(),
    );
  }

  String get title => titleEn.isNotEmpty ? titleEn : titleAr;
  String get message => messageEn.isNotEmpty ? messageEn : messageAr;
}
