'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@lib/hooks/useCurrentUser';
import { useMyMemberProfile } from '@lib/hooks/useMembers';
import { authApi } from '@lib/api/auth.api';
import { BUREAU_ROLE_LABELS, BureauRole } from '@/types/domain.types';
import Button from '@components/ui/Button';
import Input from '@components/ui/Input';

export default function ProfilePage() {
  const { data: user, isLoading } = useCurrentUser();
  const { data: memberProfile } = useMyMemberProfile();
  const queryClient = useQueryClient();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-500">
        Chargement...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-48 text-red-500">
        Impossible de charger le profil.
      </div>
    );
  }

  const roleLabel = BUREAU_ROLE_LABELS[user.role as BureauRole] ?? user.role;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(false);

    if (newPassword !== confirmPassword) {
      setPwError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (newPassword.length < 8) {
      setPwError('Le nouveau mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    setPwLoading(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setPwSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      // Déconnecter l'utilisateur (le refresh token a été révoqué côté serveur)
      setTimeout(() => {
        localStorage.removeItem('caya_access_token');
        localStorage.removeItem('caya_refresh_token');
        window.location.href = '/login';
      }, 2000);
    } catch {
      setPwError('Mot de passe actuel incorrect ou erreur serveur.');
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Mon profil</h1>

      {/* Informations du compte */}
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h2 className="text-base font-semibold text-slate-800">Informations du compte</h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary-100 text-primary-700 font-bold text-xl">
              {memberProfile
                ? `${memberProfile.firstName[0]}${memberProfile.lastName[0]}`.toUpperCase()
                : user.username.slice(0, 2).toUpperCase()}
            </span>
            <div>
              <p className="text-lg font-semibold text-slate-900">
                {memberProfile
                  ? `${memberProfile.lastName} ${memberProfile.firstName}`
                  : user.username}
              </p>
              {memberProfile?.neighborhood && (
                <p className="text-sm text-slate-500">{memberProfile.neighborhood}</p>
              )}
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 mt-1">
                {roleLabel}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            {memberProfile && (
              <>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Code membre</p>
                  <p className="text-sm font-mono font-medium text-slate-900">{memberProfile.memberCode}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Quartier</p>
                  <p className="text-sm font-medium text-slate-900">{memberProfile.neighborhood}</p>
                </div>
              </>
            )}
            <div>
              <p className="text-xs text-slate-500 mb-1">Identifiant</p>
              <p className="text-sm font-medium text-slate-900">{user.username}</p>
            </div>
            {user.phone && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Téléphone</p>
                <p className="text-sm font-medium text-slate-900">{user.phone}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-slate-500 mb-1">Rôle</p>
              <p className="text-sm font-medium text-slate-900">{roleLabel}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Statut</p>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  user.isActive
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {user.isActive ? 'Actif' : 'Inactif'}
              </span>
            </div>
            {user.lastLoginAt && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Dernière connexion</p>
                <p className="text-sm text-slate-700">
                  {new Date(user.lastLoginAt).toLocaleString('fr-FR')}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Changement de mot de passe */}
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h2 className="text-base font-semibold text-slate-800">Changer le mot de passe</h2>
        </div>
        <form onSubmit={handleChangePassword} className="px-6 py-5 space-y-4">
          <Input
            label="Mot de passe actuel"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
          <Input
            label="Nouveau mot de passe"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <Input
            label="Confirmer le nouveau mot de passe"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          {pwError && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{pwError}</p>
          )}
          {pwSuccess && (
            <p className="text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg">
              Mot de passe modifié avec succès. Vous allez être déconnecté...
            </p>
          )}

          <Button type="submit" isLoading={pwLoading}>
            Mettre à jour le mot de passe
          </Button>
        </form>
      </section>
    </div>
  );
}
