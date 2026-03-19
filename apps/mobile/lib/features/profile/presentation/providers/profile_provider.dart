import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';
import '../../data/datasources/profile_remote_datasource.dart';
import '../../data/repositories/profile_repository_impl.dart';
import '../../domain/entities/member_entity.dart';
import '../../domain/usecases/get_my_profile_usecase.dart';

final _profileRemoteDataSourceProvider = Provider<ProfileRemoteDataSource>((
  ref,
) {
  return ProfileRemoteDataSourceImpl(apiClient: ApiClient());
});

final _profileRepositoryProvider = Provider<ProfileRepositoryImpl>((ref) {
  return ProfileRepositoryImpl(ref.watch(_profileRemoteDataSourceProvider));
});

final myProfileProvider = FutureProvider<MemberEntity>((ref) async {
  final useCase = GetMyProfileUseCase(ref.watch(_profileRepositoryProvider));
  return useCase();
});
