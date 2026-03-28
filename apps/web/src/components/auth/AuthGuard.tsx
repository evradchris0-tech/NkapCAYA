'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@lib/api/auth.api';

const ACCESS_TOKEN_KEY = 'caya_access_token';
const REFRESH_TOKEN_KEY = 'caya_refresh_token';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) {
      router.replace('/login');
      return;
    }

    // Valider le token auprès du backend
    authApi.me()
      .then(() => setChecked(true))
      .catch(() => {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        router.replace('/login');
      });
  }, [router]);

  if (!checked) return null;

  return <>{children}</>;
}
