'use client';

import { useAuth } from '@lib/hooks/useAuth';

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 shrink-0 bg-background border-b border-border flex items-center justify-between px-8 shadow-soft">
      <div />

      <div className="flex items-center gap-6">
        {user && (
          <span className="text-sm font-medium text-foreground">
            {user.username}
          </span>
        )}
        <button
          onClick={logout}
          className="text-sm font-medium text-muted-foreground hover:text-accent transition-colors duration-200"
        >
          Déconnexion
        </button>
      </div>
    </header>
  );
}
