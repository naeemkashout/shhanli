class ShippingCompany {
  final String id;
  final String name;
  final bool supportsLocal;
  final bool supportsInternational;
  final bool codEnabled;
  final bool expressEnabled;
  final bool packagingEnabled;

  ShippingCompany({
    required this.id,
    required this.name,
    required this.supportsLocal,
    required this.supportsInternational,
    required this.codEnabled,
    required this.expressEnabled,
    required this.packagingEnabled,
  });

  factory ShippingCompany.fromJson(Map<String, dynamic> json) {
    return ShippingCompany(
      id: json['_id']?.toString() ?? json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      supportsLocal: json['supportsLocal'] == true,
      supportsInternational: json['supportsInternational'] == true,
      codEnabled: json['codService']?['enabled'] == true,
      expressEnabled: json['expressService']?['enabled'] == true,
      packagingEnabled: json['packagingService']?['enabled'] == true,
    );
  }
}
