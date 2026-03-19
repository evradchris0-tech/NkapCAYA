import '../../domain/entities/user_entity.dart';

class UserModel extends UserEntity {
  const UserModel({
    required super.id,
    required super.username,
    required super.phone,
    required super.role,
    required super.isActive,
    super.lastLoginAt,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as String,
      username: json['username'] as String,
      phone: json['phone'] as String,
      role: json['role'] as String? ?? 'MEMBRE',
      isActive: json['isActive'] as bool? ?? true,
      lastLoginAt: json['lastLoginAt'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'username': username,
      'phone': phone,
      'role': role,
      'isActive': isActive,
      'lastLoginAt': lastLoginAt,
    };
  }
}
