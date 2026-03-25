import 'package:equatable/equatable.dart';

class TontineEntity extends Equatable {
  final String id;
  final String name;
  final String code;
  final String city;
  final String baseUrl;
  final String? logoUrl;
  final int? activeMembersCount;

  const TontineEntity({
    required this.id,
    required this.name,
    required this.code,
    required this.city,
    required this.baseUrl,
    this.logoUrl,
    this.activeMembersCount,
  });

  TontineEntity copyWith({
    String? id,
    String? name,
    String? code,
    String? city,
    String? baseUrl,
    String? logoUrl,
    int? activeMembersCount,
  }) {
    return TontineEntity(
      id: id ?? this.id,
      name: name ?? this.name,
      code: code ?? this.code,
      city: city ?? this.city,
      baseUrl: baseUrl ?? this.baseUrl,
      logoUrl: logoUrl ?? this.logoUrl,
      activeMembersCount: activeMembersCount ?? this.activeMembersCount,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'code': code,
        'city': city,
        'baseUrl': baseUrl,
        'logoUrl': logoUrl,
        'activeMembersCount': activeMembersCount,
      };

  factory TontineEntity.fromJson(Map<String, dynamic> json) => TontineEntity(
        id: json['id'] as String,
        name: json['name'] as String,
        code: json['code'] as String,
        city: json['city'] as String,
        baseUrl: json['baseUrl'] as String,
        logoUrl: json['logoUrl'] as String?,
        activeMembersCount: json['activeMembersCount'] as int?,
      );

  @override
  List<Object?> get props => [id, code];
}
