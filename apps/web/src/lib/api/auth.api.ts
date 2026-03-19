import apiClient from './client';
import type { AuthResponse, LoginPayload, TokensResponse, AuthUser } from '@/types/api.types';

export const authApi = {
  login: (payload: LoginPayload) =>
    apiClient.post<AuthResponse>('/auth/login', payload).then((r) => r.data),

  refresh: (refreshToken: string) =>
    apiClient.post<TokensResponse>('/auth/refresh', { refreshToken }).then((r) => r.data),

  logout: (refreshToken: string) =>
    apiClient.post('/auth/logout', { refreshToken }).then((r) => r.data),

  me: () =>
    apiClient.get<AuthUser>('/auth/me').then((r) => r.data),
};
