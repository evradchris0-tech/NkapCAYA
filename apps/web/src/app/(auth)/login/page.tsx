'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, LogIn, Users, PiggyBank, Banknote, Shield, AlertCircle, Loader2 } from 'lucide-react';
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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  return (
    <main className="min-h-screen flex">
      {/* ── Panneau gauche — branding ── */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden flex-col justify-between p-12"
        style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 50%, #3b82f6 100%)' }}
      >
        {/* Cercles décoratifs */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #ffffff 0%, transparent 70%)' }} />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #93c5fd 0%, transparent 70%)' }} />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <div>
              <p className="text-white font-bold text-xl tracking-tight">CAYA</p>
              <p className="text-blue-200 text-xs">Plateforme de tontine</p>
            </div>
          </div>
        </div>

        {/* Centre */}
        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-white leading-snug mb-4">
            Gérez votre tontine<br />en toute simplicité.
          </h2>
          <p className="text-blue-200 text-sm leading-relaxed mb-8 max-w-xs">
            Une plateforme complète pour administrer les sessions, épargnes, prêts et distributions de votre groupe.
          </p>
          <ul className="space-y-3">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                  <Icon className="h-3.5 w-3.5 text-white" strokeWidth={2} />
                </div>
                <span className="text-blue-100 text-sm">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bas */}
        <p className="relative z-10 text-blue-300 text-xs">
          © {new Date().getFullYear()} CAYA — Tous droits réservés
        </p>
      </div>

      {/* ── Panneau droit — formulaire ── */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-sm animate-fade-in">
          {/* Logo mobile */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="font-bold text-gray-900 text-lg">CAYA</span>
          </div>

          {/* En-tête */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Connexion</h1>
            <p className="text-gray-500 text-sm mt-1">Accédez à votre espace tontine</p>
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Identifiant
              </label>
              <input
                {...register('identifier')}
                type="text"
                autoComplete="username"
                autoFocus
                placeholder="Username ou numéro de téléphone"
                className={`w-full border rounded-xl px-4 py-2.5 text-sm bg-white transition-colors
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  ${errors.identifier ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={`w-full border rounded-xl px-4 py-2.5 pr-10 text-sm bg-white transition-colors
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    ${errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
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
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold
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
          <p className="mt-8 text-center text-xs text-gray-400">
            Problème de connexion ? Contactez votre administrateur.
          </p>
        </div>
      </div>
    </main>
  );
}
