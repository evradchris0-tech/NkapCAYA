'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Copy, CheckCheck, UserCheck } from 'lucide-react';
import Input from '@components/ui/Input';
import Button from '@components/ui/Button';
import { membersApi } from '@lib/api/members.api';
import type { CreateMemberResult } from '@/types/api.types';

const memberSchema = z.object({
  firstName: z.string().min(2, 'Prénom requis'),
  lastName: z.string().min(2, 'Nom requis'),
  phone1: z.string().min(9, 'Téléphone invalide'),
  phone2: z.string().optional().or(z.literal('')),
  neighborhood: z.string().min(2, 'Quartier requis'),
  locationDetail: z.string().optional().or(z.literal('')),
  mobileMoneyType: z.string().optional().or(z.literal('')),
  mobileMoneyNumber: z.string().optional().or(z.literal('')),
  sponsorId: z.string().optional().or(z.literal('')),
  username: z.string().optional().or(z.literal('')),
});

type MemberFormValues = z.infer<typeof memberSchema>;

interface MemberFormProps {
  memberId?: string;
  defaultValues?: Partial<MemberFormValues>;
  onSuccess?: () => void;
}

// ── Ligne copiable ──────────────────────────────────────────────────────────
function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex items-center justify-between gap-4 py-2 px-3 bg-gray-50 rounded-lg border border-gray-200">
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-mono font-semibold text-gray-900 mt-0.5 break-all">{value}</p>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        title="Copier"
        className="shrink-0 p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
      >
        {copied ? <CheckCheck className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}

// ── Modal identifiants ──────────────────────────────────────────────────────
function CredentialsModal({
  result,
  onClose,
}: {
  result: CreateMemberResult;
  onClose: () => void;
}) {
  const fullName = `${result.profile.firstName} ${result.profile.lastName}`;
  const username = result.profile.user.username;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-5">
        {/* Icône + titre */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50">
            <UserCheck className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Membre créé</h2>
            <p className="text-xs text-gray-500 mt-0.5">{fullName}</p>
          </div>
        </div>

        {/* Alerte */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800 leading-relaxed">
          Notez ces identifiants et transmettez-les au membre.
          Le mot de passe temporaire ne sera <span className="font-semibold">plus affiché</span> après fermeture.
        </div>

        {/* Identifiants */}
        <div className="flex flex-col gap-2">
          <CopyRow label="Code membre" value={result.profile.memberCode} />
          <CopyRow label="Identifiant (username)" value={username} />
          <CopyRow label="Mot de passe temporaire" value={result.temporaryPassword} />
        </div>

        <p className="text-[11px] text-gray-400 text-center">
          Un SMS a été envoyé au <span className="font-medium">{result.profile.phone1}</span> avec ces informations.
        </p>

        {/* Action */}
        <Button onClick={onClose} className="w-full">
          J&apos;ai noté les identifiants
        </Button>
      </div>
    </div>
  );
}

// ── Formulaire principal ────────────────────────────────────────────────────
export default function MemberForm({ memberId, defaultValues, onSuccess }: MemberFormProps) {
  const router = useRouter();
  const isEdit = Boolean(memberId);

  const [createdMember, setCreatedMember] = useState<CreateMemberResult | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues,
  });

  const normalizePhone = (v?: string) => v ? v.replace(/[\s\-.()]/g, '') : undefined;

  const onSubmit = async (data: MemberFormValues) => {
    const payload = {
      ...data,
      phone1: normalizePhone(data.phone1) ?? data.phone1,
      phone2: normalizePhone(data.phone2),
      locationDetail: data.locationDetail || undefined,
      mobileMoneyType: data.mobileMoneyType || undefined,
      mobileMoneyNumber: normalizePhone(data.mobileMoneyNumber),
      sponsorId: data.sponsorId || undefined,
      username: data.username || undefined,
    };

    try {
      if (isEdit && memberId) {
        await membersApi.update(memberId, payload);
        onSuccess?.();
        router.push(`/members/${memberId}`);
      } else {
        const result = await membersApi.create(payload);
        // Afficher les identifiants avant de rediriger
        setCreatedMember(result);
      }
    } catch {
      setError('root', {
        message: isEdit
          ? 'Erreur lors de la mise à jour du membre.'
          : 'Erreur lors de la création du membre.',
      });
    }
  };

  const handleModalClose = () => {
    setCreatedMember(null);
    onSuccess?.();
    router.push('/members');
  };

  return (
    <>
      {createdMember && (
        <CredentialsModal result={createdMember} onClose={handleModalClose} />
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Prénom"
            placeholder="Jean"
            {...register('firstName')}
            error={errors.firstName?.message}
          />
          <Input
            label="Nom"
            placeholder="Dupont"
            {...register('lastName')}
            error={errors.lastName?.message}
          />
        </div>

        <Input
          label="Téléphone principal"
          type="tel"
          placeholder="+237 6XX XXX XXX"
          {...register('phone1')}
          error={errors.phone1?.message}
        />

        <Input
          label="Téléphone secondaire (optionnel)"
          type="tel"
          placeholder="+237 6XX XXX XXX"
          {...register('phone2')}
          error={errors.phone2?.message}
        />

        <Input
          label="Quartier"
          placeholder="Bastos, Yaoundé"
          {...register('neighborhood')}
          error={errors.neighborhood?.message}
        />

        <Input
          label="Détail localisation (optionnel)"
          placeholder="Près du marché central"
          {...register('locationDetail')}
          error={errors.locationDetail?.message}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Type Mobile Money (optionnel)"
            placeholder="MTN, Orange..."
            {...register('mobileMoneyType')}
            error={errors.mobileMoneyType?.message}
          />
          <Input
            label="Numéro Mobile Money (optionnel)"
            placeholder="6XX XXX XXX"
            {...register('mobileMoneyNumber')}
            error={errors.mobileMoneyNumber?.message}
          />
        </div>

        {!isEdit && (
          <Input
            label="Username (optionnel — par défaut : téléphone principal)"
            placeholder="jdupont"
            {...register('username')}
            error={errors.username?.message}
          />
        )}

        {errors.root && (
          <p className="text-red-500 text-sm">{errors.root.message}</p>
        )}

        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Annuler
          </Button>
          <Button type="submit" isLoading={isSubmitting} className="flex-1">
            {isEdit ? 'Enregistrer les modifications' : 'Enregistrer le membre'}
          </Button>
        </div>
      </form>
    </>
  );
}
