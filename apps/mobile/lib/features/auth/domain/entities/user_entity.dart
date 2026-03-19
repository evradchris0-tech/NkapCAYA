class UserEntity {
  final String id;
  final String username;
  final String phone;
  final String role;
  final bool isActive;

  const UserEntity({
    required this.id,
    required this.username,
    required this.phone,
    required this.role,
    required this.isActive,
  });
}
