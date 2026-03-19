class UserEntity {
  final String id;
  final String email;
  final String firstName;
  final String lastName;
  final String memberCode;
  final String role;
  final bool isActive;

  const UserEntity({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
    required this.memberCode,
    required this.role,
    required this.isActive,
  });

  String get fullName => '$firstName $lastName';
}
