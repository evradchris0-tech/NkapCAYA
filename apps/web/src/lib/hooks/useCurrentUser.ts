'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { authApi } from '@lib/api/auth.api';

const ME_KEY = ['me'] as const;
const ACCESS_TOKEN_KEY = 'caya_access_token';
const REFRESH_TOKEN_KEY = 'caya_refresh_token';

export function useCurrentUser() {
  return useQuery({
    queryKey: ME_KEY,
    queryFn: () => authApi.me(),
    enabled:
      typeof window !== 'undefined' &&
      Boolean(localStorage.getItem(ACCESS_TOKEN_KEY)),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (refreshToken) await authApi.logout(refreshToken);
    } finally {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      queryClient.removeQueries({ queryKey: ME_KEY });
      router.push('/login');
    }
  }, [router, queryClient]);
}
