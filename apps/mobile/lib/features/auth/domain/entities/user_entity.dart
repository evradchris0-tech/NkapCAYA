import 'package:equatable/equatable.dart';

class UserEntity extends Equatable {
  final String id;
  final String username;
  final String phone;
  final String role;
  final bool isActive;
  final String? lastLoginAt;

  const UserEntity({
    required this.id,
    required this.username,
    required this.phone,
    required this.role,
    required this.isActive,
    this.lastLoginAt,
  });

  UserEntity copyWith({
    String? id,
    String? username,
    String? phone,
    String? role,
    bool? isActive,
    String? lastLoginAt,
  }) {
    return UserEntity(
      id: id ?? this.id,
      username: username ?? this.username,
      phone: phone ?? this.phone,
      role: role ?? this.role,
      isActive: isActive ?? this.isActive,
      lastLoginAt: lastLoginAt ?? this.lastLoginAt,
    );
  }

  @override
  List<Object?> get props => [id, username, phone, role, isActive, lastLoginAt];
}
