import '../entities/member_entity.dart';
import '../repositories/profile_repository.dart';

class GetMyProfileUseCase {
  final ProfileRepository _repository;

  const GetMyProfileUseCase(this._repository);

  Future<MemberEntity> call() {
    return _repository.getMyProfile();
  }
}
