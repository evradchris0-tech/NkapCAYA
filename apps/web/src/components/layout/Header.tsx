'use client';

import { useAuth } from '@lib/hooks/useAuth';

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="h-14 shrink-0 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div />

      <div className="flex items-center gap-4">
        {user && (
          <span className="text-sm text-gray-600">
            {user.username}
          </span>
        )}
        <button
          onClick={logout}
          className="text-sm text-gray-500 hover:text-red-600 transition"
        >
          Déconnexion
        </button>
      </div>
    </header>
  );
}
