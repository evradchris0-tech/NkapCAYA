import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../shared/providers/api_providers.dart';
import '../../data/datasources/profile_remote_datasource.dart';
import '../../data/repositories/profile_repository_impl.dart';
import '../../domain/entities/member_entity.dart';
import '../../domain/repositories/profile_repository.dart';
import '../../domain/usecases/get_my_profile_usecase.dart';

final _profileRemoteDataSourceProvider = Provider<ProfileRemoteDataSource>((
  ref,
) {
  return ProfileRemoteDataSourceImpl(apiClient: ref.watch(apiClientProvider));
});

// Expose l'interface abstraite — respecte le principe d'inversion des dépendances
final profileRepositoryProvider = Provider<ProfileRepository>((ref) {
  return ProfileRepositoryImpl(ref.watch(_profileRemoteDataSourceProvider));
});

final myProfileProvider = FutureProvider<MemberEntity>((ref) async {
  final useCase = GetMyProfileUseCase(ref.watch(profileRepositoryProvider));
  return useCase();
});
