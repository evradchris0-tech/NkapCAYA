'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, LogIn, Users, PiggyBank, Banknote, Shield, AlertCircle, Loader2 } from 'lucide-react';
import Logo from '@components/ui/Logo';
import { useAuth } from '@lib/hooks/useAuth';

const loginSchema = z.object({
  identifier: z.string().min(3, 'Identifiant requis'),
  password: z.string().min(6, 'Mot de passe trop court'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const FEATURES = [
  { icon: Users,     text: 'Gestion des membres et inscriptions' },
  { icon: PiggyBank, text: 'Épargne, cotisations et intérêts' },
  { icon: Banknote,  text: 'Prêts avec suivi des remboursements' },
  { icon: Shield,    text: 'Caisse de secours et bénéficiaires' },
];

export default function LoginPage() {
  const { login, isLoading, error } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (localStorage.getItem('caya_access_token')) {
      router.replace('/');
    }
  }, [router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  return (
    <main className="min-h-screen flex">
      {/* ── Panneau gauche — branding ── */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden flex-col justify-between p-12"
        style={{ background: 'linear-gradient(135deg, #0a1326 0%, #162848 55%, #2a4575 100%)' }}
      >
        {/* Cercles décoratifs — halo doré discret */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #ffffff 0%, transparent 70%)' }} />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #c6902a 0%, transparent 70%)' }} />

        {/* Centre */}
        <div className="relative z-10">
          {/* Logo large */}
          <div className="mb-6 -ml-3">
            <Logo size="4xl" />
          </div>
          <h2 className="text-5xl font-extrabold text-white leading-tight mb-3 tracking-tight">NkapZen</h2>
          <p className="text-accent-300 text-lg font-medium mb-10">Gestion de tontine — épargne, prêts &amp; secours</p>
          <ul className="space-y-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-white/10 ring-1 ring-white/15 flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-accent-300" strokeWidth={1.8} />
                </div>
                <span className="text-primary-100 text-base">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bas */}
        <p className="relative z-10 text-primary-300 text-xs">
          © {new Date().getFullYear()} NkapZen — Tous droits réservés
        </p>
      </div>

      {/* ── Panneau droit — formulaire ── */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-sm animate-fade-in">
          {/* Logo — visible sur tous les écrans */}
          <div className="flex justify-center mb-6">
            <Logo size="2xl" />
          </div>

          {/* En-tête */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-slate-900">Connexion</h1>
            <p className="text-sm text-slate-500 mt-1.5">Accédez à votre espace de gestion</p>
          </div>

          {/* Message d'erreur global */}
          {error && (
            <div className="mb-5 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 animate-slide-up">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(login)} className="space-y-4" noValidate>
            {/* Identifiant */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Identifiant
              </label>
              <input
                {...register('identifier')}
                type="text"
                autoComplete="username"
                autoFocus
                placeholder="Username ou numéro de téléphone"
                className={`w-full border rounded-xl px-4 py-2.5 text-sm bg-white transition-colors
                  focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                  ${errors.identifier ? 'border-red-300 bg-red-50' : 'border-slate-300'}`}
              />
              {errors.identifier && (
                <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.identifier.message}
                </p>
              )}
            </div>

            {/* Mot de passe */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={`w-full border rounded-xl px-4 py-2.5 pr-10 text-sm bg-white transition-colors
                    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                    ${errors.password ? 'border-red-300 bg-red-50' : 'border-slate-300'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword
                    ? <EyeOff className="h-4 w-4" />
                    : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Bouton */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-semibold
                py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 mt-2
                disabled:opacity-60 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connexion…
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Se connecter
                </>
              )}
            </button>
          </form>

          {/* Aide */}
          <p className="mt-8 text-center text-xs text-slate-400">
            Problème de connexion ? Contactez votre administrateur.
          </p>
        </div>
      </div>
    </main>
  );
}
