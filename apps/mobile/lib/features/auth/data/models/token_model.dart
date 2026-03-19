class TokenModel {
  final String access;
  final String refresh;

  const TokenModel({required this.access, required this.refresh});

  factory TokenModel.fromJson(Map<String, dynamic> json) {
    return TokenModel(
      access: json['access'] as String,
      refresh: json['refresh'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {'access': access, 'refresh': refresh};
  }
}
