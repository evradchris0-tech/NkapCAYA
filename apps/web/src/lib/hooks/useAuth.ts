'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@lib/api/auth.api';
import type { AuthUser } from '@types/api.types';

interface LoginPayload {
  email: string;
  password: string;
}

interface UseAuthReturn {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
}

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
        localStorage.setItem('caya_access_token', data.accessToken);
        setUser(data.user);
        router.push('/');
      } catch (err) {
        setError('Email ou mot de passe invalide.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  const logout = useCallback(() => {
    localStorage.removeItem('caya_access_token');
    setUser(null);
    router.push('/login');
  }, [router]);

  return { user, isLoading, error, login, logout };
}
