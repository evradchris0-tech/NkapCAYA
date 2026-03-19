'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@lib/api/auth.api';
import type { AuthUser } from '@types/api.types';

interface LoginPayload {
  identifier: string;
  password: string;
}

interface UseAuthReturn {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
}

const ACCESS_TOKEN_KEY = 'caya_access_token';
const REFRESH_TOKEN_KEY = 'caya_refresh_token';

export function useAuth(): UseAuthReturn {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(
    async (payload: LoginPayload) => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await authApi.login(payload);
        localStorage.setItem(ACCESS_TOKEN_KEY, data.tokens.access);
        localStorage.setItem(REFRESH_TOKEN_KEY, data.tokens.refresh);
        setUser(data.user);
        router.push('/');
      } catch {
        setError('Identifiant ou mot de passe invalide.');
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } finally {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      setUser(null);
      router.push('/login');
    }
  }, [router]);

  const fetchMe = useCallback(async () => {
    setIsLoading(true);
    try {
      const me = await authApi.me();
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { user, isLoading, error, login, logout, fetchMe };
}
