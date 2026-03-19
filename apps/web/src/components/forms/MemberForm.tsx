'use client';

import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Input from '@components/ui/Input';
import Button from '@components/ui/Button';
import { membersApi } from '@lib/api/members.api';

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
  defaultValues?: Partial<MemberFormValues>;
  onSuccess?: () => void;
}

export default function MemberForm({ defaultValues, onSuccess }: MemberFormProps) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues,
  });

  const onSubmit = async (data: MemberFormValues) => {
    try {
      await membersApi.create({
        ...data,
        phone2: data.phone2 || undefined,
        locationDetail: data.locationDetail || undefined,
        mobileMoneyType: data.mobileMoneyType || undefined,
        mobileMoneyNumber: data.mobileMoneyNumber || undefined,
        sponsorId: data.sponsorId || undefined,
        username: data.username || undefined,
      });
      onSuccess?.();
      router.push('/members');
    } catch {
      setError('root', { message: 'Erreur lors de la création du membre.' });
    }
  };

  return (
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

      <Input
        label="Username (optionnel)"
        placeholder="jdupont"
        {...register('username')}
        error={errors.username?.message}
      />

      {errors.root && (
        <p className="text-red-500 text-sm">{errors.root.message}</p>
      )}

      <Button type="submit" isLoading={isSubmitting} className="w-full">
        Enregistrer le membre
      </Button>
    </form>
  );
}
