import apiClient from './client';
import type { AuthResponse, LoginPayload } from '@types/api.types';

export const authApi = {
  /**
   * Authentifie un utilisateur et retourne les tokens JWT.
   */
  login: (payload: LoginPayload) =>
    apiClient.post<AuthResponse>('/auth/login', payload).then((r) => r.data),

  /**
   * Invalide la session côté serveur.
   */
  logout: () => apiClient.post('/auth/logout').then((r) => r.data),

  /**
   * Retourne le profil de l'utilisateur connecté.
   */
  me: () => apiClient.get<AuthResponse['user']>('/auth/me').then((r) => r.data),
};
